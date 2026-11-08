#!/usr/bin/env node
/**
 * train-model.js — train Random Forest on DFN-DS data.
 *
 * Fase 2 dari roadmap. Trains on models/training-data.json (Fase 1 output),
 * evaluates on the validation split, and exports the best model to
 * models/rf-model.json.
 *
 * Class weighting: each sample is drawn into the bootstrap with probability
 * proportional to its class weight (total / (n_classes * class_count)), so
 * the minority warning class is not drowned out by safe/danger.
 *
 * Usage: node scripts/train-model.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'models', 'training-data.json');
const OUTPUT_FILE = path.join(ROOT, 'models', 'rf-model.json');

// ------------------------------------------------------------ utilities ----
const {
  createRng,
  trainForest,
  voteCounts,
} = require('./lib/forest');

/** Argmax over the two sample-level labels, `safe` winning a tied vote. */
function predict(trees, sample) {
  const totals = voteCounts(trees, sample, ['safe', 'warning']);
  return totals.warning > totals.safe ? 'warning' : 'safe';
}

// ------------------------------------------------------------ evaluation ---
function evaluate(trees, samples) {
  const levels = ['safe', 'warning'];
  const per = {};
  for (const l of levels) per[l] = { tp: 0, fp: 0, fn: 0, tn: 0 };

  for (const s of samples) {
    const pred = predict(trees, s);
    for (const l of levels) {
      if (pred === l && s.label === l) per[l].tp++;
      else if (pred === l && s.label !== l) per[l].fp++;
      else if (pred !== l && s.label === l) per[l].fn++;
      else per[l].tn++;
    }
  }

  let macroF1 = 0;
  const metrics = {};
  for (const l of levels) {
    const { tp, fp, fn } = per[l];
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    metrics[l] = { precision, recall, f1, support: tp + fn };
    macroF1 += f1;
  }
  macroF1 /= levels.length;

  const correct = samples.filter((s) => predict(trees, s) === s.label).length;
  const accuracy = correct / samples.length;

  return { accuracy, macroF1, perLevel: metrics };
}

// ------------------------------------------------------------------ main ---
function main() {
  console.log('Loading training data...');
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const trainSamples = data.train.flatMap((p) =>
    p.samples.map((s) => ({ peak: s.peak, sustained: s.sustained, label: s.level }))
  );
  const valSamples = data.validation.flatMap((p) =>
    p.samples.map((s) => ({ peak: s.peak, sustained: s.sustained, label: s.level }))
  );
  console.log(`  train: ${trainSamples.length}, val: ${valSamples.length}`);

  // class weights: balance sederhana untuk safe/warning (sudah cukup seimbang)
  const counts = { safe: 0, warning: 0 };
  for (const s of trainSamples) counts[s.label]++;
  const nClasses = 2;
  const classWeights = {};
  for (const [l, c] of Object.entries(counts)) {
    // Inverse frequency, capped at 10x so a rare class cannot dominate the vote.
    classWeights[l] = Math.min(10, trainSamples.length / (nClasses * c));
  }
  console.log('  class counts:', counts);
  console.log('  class weights:', Object.fromEntries(Object.entries(classWeights).map(([k, v]) => [k, v.toFixed(2)])));

  const features = ['peak', 'sustained'];
  const combos = [
    { nTrees: 20, maxDepth: 8, minSamples: 4 },
    { nTrees: 20, maxDepth: 12, minSamples: 4 },
    { nTrees: 50, maxDepth: 8, minSamples: 4 },
    { nTrees: 50, maxDepth: 12, minSamples: 4 },
  ];

  let best = null;
  for (const combo of combos) {
    const rng = createRng(42);
    const trees = trainForest(trainSamples, features, classWeights, combo.nTrees, combo.maxDepth, combo.minSamples, rng);
    const metrics = evaluate(trees, valSamples);
    console.log(`  n=${combo.nTrees} d=${combo.maxDepth}: acc=${(metrics.accuracy * 100).toFixed(1)}% macroF1=${(metrics.macroF1 * 100).toFixed(1)}%`);
    if (!best || metrics.macroF1 > best.metrics.macroF1) {
      best = { combo, trees, metrics };
    }
  }

  console.log(`\nBest: n=${best.combo.nTrees} d=${best.combo.maxDepth}`);
  console.log(`  accuracy: ${(best.metrics.accuracy * 100).toFixed(1)}%`);
  console.log(`  macro-F1: ${(best.metrics.macroF1 * 100).toFixed(1)}%`);
  for (const [l, m] of Object.entries(best.metrics.perLevel)) {
    console.log(`  ${l}: P=${(m.precision * 100).toFixed(1)}% R=${(m.recall * 100).toFixed(1)}% F1=${(m.f1 * 100).toFixed(1)}% (n=${m.support})`);
  }

  // clinical contract check
  // 200 kPa: ambang in-shoe paling konsensus (Castro-Martins dkk., Heliyon
  // 2024, e26161). `sustainedThreshold` dihitung dalam sampel 10 Hz; nilai 1
  // berarti danger berlaku pada sampel pertama di atas ambang, bukan kriteria
  // durasi klinis.
  const DANGER_RULE = { peakThreshold: 200, sustainedThreshold: 1, sustainedUnit: 'samples_10hz' };
  function predictWithRule(sample) {
    if (sample.peak >= DANGER_RULE.peakThreshold && sample.sustained >= DANGER_RULE.sustainedThreshold) {
      return 'danger';
    }
    return predict(best.trees, sample);
  }

  const checks = [
    { peak: 40, sustained: 1, expect: 'warning' },
    { peak: 199, sustained: 31, expect: 'warning' },
    { peak: 210, sustained: 31, expect: 'danger' },
    { peak: 20, sustained: 0, expect: 'safe' }, // realistic: peak < 35 → sustained = 0
    { peak: 30, sustained: 0, expect: 'safe' },
  ];
  console.log('\nClinical contract:');
  for (const c of checks) {
    const pred = predictWithRule({ peak: c.peak, sustained: c.sustained });
    const ok = pred === c.expect ? 'PASS' : 'FAIL';
    console.log(`  ${c.peak} kPa, ${c.sustained}s -> ${pred} (expect ${c.expect}) ${ok}`);
  }

  // export model
  const model = {
    version: '1.0',
    features,
    levels: ['safe', 'warning'], // RF hanya untuk safe/warning
    dangerRule: DANGER_RULE, // rule-based override untuk danger
    calibration: data.calibration,
    combo: best.combo,
    metrics: {
      accuracy: best.metrics.accuracy,
      macroF1: best.metrics.macroF1,
      perLevel: best.metrics.perLevel,
    },
    // Deterministic provenance: no timestamp, so regenerating with unchanged
    // data produces a byte-identical artifact and an empty git diff.
    provenance: {
      dataset: data.source,
      datasetVersion: data.version,
      trainPatients: data.train.length,
      validationPatients: data.validation.length,
      trainSamples: data.train.reduce((n, p) => n + p.samples.length, 0),
      validationSamples: data.validation.reduce((n, p) => n + p.samples.length, 0),
      preparedBy: 'scripts/prepare-dataset.py',
      trainedBy: 'scripts/train-model.js',
      seed: 42,
    },
    trees: best.trees,
  };
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(model));
  console.log(`\nModel exported: ${OUTPUT_FILE} (${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(0)} KB)`);

  console.log('  danger rule: peak >=', DANGER_RULE.peakThreshold, 'kPa');
  console.log('  docs/rf-model-report.md is edited by hand; this script no longer writes it.');
}

main();
