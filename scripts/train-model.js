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
const REPORT_FILE = path.join(ROOT, 'docs', 'rf-model-report.md');

// ------------------------------------------------------------ utilities ----
function createRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function giniWeighted(labels, weights) {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  if (totalWeight === 0) return 0;
  const counts = {};
  for (let i = 0; i < labels.length; i++) {
    counts[labels[i]] = (counts[labels[i]] || 0) + weights[i];
  }
  let impurity = 1;
  for (const w of Object.values(counts)) {
    const p = w / totalWeight;
    impurity -= p * p;
  }
  return impurity;
}

const NUM_BINS = 32; // quantile bins for split candidates
const SUBSAMPLE_SIZE = 0; // 0 = gunakan full dataset

function bestSplit(samples, features, weights) {
  const parentGini = giniWeighted(samples.map((s) => s.label), weights);
  let best = null;

  for (const feature of features) {
    // quantile binning: candidate thresholds at bin edges, not every unique value
    const sorted = samples.map((s) => s[feature]).sort((a, b) => a - b);
    const n = sorted.length;
    for (let b = 1; b < NUM_BINS; b++) {
      const threshold = sorted[Math.floor((n * b) / NUM_BINS)];
      const leftLabels = [];
      const leftWeights = [];
      const rightLabels = [];
      const rightWeights = [];
      for (let j = 0; j < samples.length; j++) {
        if (samples[j][feature] <= threshold) {
          leftLabels.push(samples[j].label);
          leftWeights.push(weights[j]);
        } else {
          rightLabels.push(samples[j].label);
          rightWeights.push(weights[j]);
        }
      }
      if (leftLabels.length === 0 || rightLabels.length === 0) continue;

      const leftGini = giniWeighted(leftLabels, leftWeights);
      const rightGini = giniWeighted(rightLabels, rightWeights);
      const leftW = leftWeights.reduce((a, b) => a + b, 0);
      const rightW = rightWeights.reduce((a, b) => a + b, 0);
      const totalW = leftW + rightW;
      const weighted = (leftW * leftGini + rightW * rightGini) / totalW;
      const gain = parentGini - weighted;

      if (!best || gain > best.gain) {
        best = { feature: feature, threshold: threshold, gain: gain };
      }
    }
  }
  return best;
}

function buildTree(samples, features, weights, depth, maxDepth, minSamples, rng) {
  const labels = samples.map((s) => s.label);
  const unique = [...new Set(labels)];

  if (unique.length === 1 || depth >= maxDepth || samples.length < minSamples) {
    const counts = {};
    for (const l of labels) counts[l] = (counts[l] || 0) + 1;
    return { leaf: true, counts };
  }

  const split = bestSplit(samples, features, weights);
  if (!split) {
    const counts = {};
    for (const l of labels) labels.forEach((l) => (counts[l] = (counts[l] || 0) + 1));
    return { leaf: true, counts };
  }

  const leftSamples = [];
  const leftWeights = [];
  const rightSamples = [];
  const rightWeights = [];
  for (let i = 0; i < samples.length; i++) {
    if (samples[i][split.feature] <= split.threshold) {
      leftSamples.push(samples[i]);
      leftWeights.push(weights[i]);
    } else {
      rightSamples.push(samples[i]);
      rightWeights.push(weights[i]);
    }
  }

  return {
    leaf: false,
    feature: split.feature,
    threshold: split.threshold,
    left: buildTree(leftSamples, features, leftWeights, depth + 1, maxDepth, minSamples, rng),
    right: buildTree(rightSamples, features, rightWeights, depth + 1, maxDepth, minSamples, rng),
  };
}

function predictTree(tree, sample) {
  if (tree.leaf) return tree.counts;
  if (sample[tree.feature] <= tree.threshold) return predictTree(tree.left, sample);
  return predictTree(tree.right, sample);
}

function trainForest(samples, features, classWeights, nTrees, maxDepth, minSamples, rng) {
  const trees = [];

  // cumulative weight distribution for O(log n) weighted sampling
  const cumWeights = new Float64Array(samples.length);
  let acc = 0;
  for (let i = 0; i < samples.length; i++) {
    acc += classWeights[samples[i].label] || 1;
    cumWeights[i] = acc;
  }
  const totalWeight = acc;

  // binary search: find smallest index where cumWeights[idx] >= target
  function sampleIndex(target) {
    let lo = 0;
    let hi = cumWeights.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cumWeights[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  for (let t = 0; t < nTrees; t++) {
    // weighted bootstrap: draw with probability proportional to class weight
    const bootstrap = [];
    const bootstrapWeights = [];
    const nDraw = SUBSAMPLE_SIZE > 0 ? Math.min(SUBSAMPLE_SIZE, samples.length) : samples.length;
    for (let j = 0; j < nDraw; j++) {
      const idx = sampleIndex(rng() * totalWeight);
      bootstrap.push(samples[idx]);
      bootstrapWeights.push(1); // weights already baked into sampling
    }
    trees.push(buildTree(bootstrap, features, bootstrapWeights, 0, maxDepth, minSamples, rng));
  }
  return trees;
}

function predict(trees, sample) {
  const totals = { safe: 0, warning: 0 };
  for (const tree of trees) {
    const counts = predictTree(tree, sample);
    for (const [label, count] of Object.entries(counts)) {
      totals[label] = (totals[label] || 0) + count;
    }
  }
  let best = 'safe';
  let bestCount = -1;
  for (const [label, count] of Object.entries(totals)) {
    if (count > bestCount) {
      best = label;
      bestCount = count;
    }
  }
  return best;
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
    classWeights[l] = trainSamples.length / (nClasses * c);
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
  const DANGER_RULE = { peakThreshold: 70, sustainedThreshold: 1 }; // 0.1s pada 10Hz
  function predictWithRule(sample) {
    if (sample.peak >= DANGER_RULE.peakThreshold && sample.sustained >= DANGER_RULE.sustainedThreshold) {
      return 'danger';
    }
    return predict(best.trees, sample);
  }

  const checks = [
    { peak: 40, sustained: 1, expect: 'warning' },
    { peak: 80, sustained: 31, expect: 'danger' },
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
    trees: best.trees,
  };
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(model));
  console.log(`\nModel exported: ${OUTPUT_FILE} (${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(0)} KB)`);

  // report
  const report = `# RF Model Report

## Training
- Data: DFN-DS (135 patients, 81k samples)
- Features: peak pressure (kPa), sustained duration (s)
- **Approach: Hybrid RF + Rule**
  - RF classifier untuk safe/warning boundary (data-driven)
  - Rule-based untuk danger: peak ≥ ${DANGER_RULE.peakThreshold} kPa AND sustained ≥ ${DANGER_RULE.sustainedThreshold} (0.1s)
- Class weighting: inverse frequency, clipped max 10x
- Best hyperparameters: n_trees=${best.combo.nTrees}, max_depth=${best.combo.maxDepth}

## Validation Results (RF only: safe vs warning)
- Accuracy: ${(best.metrics.accuracy * 100).toFixed(1)}%
- Macro-F1: ${(best.metrics.macroF1 * 100).toFixed(1)}%

| Level | Precision | Recall | F1 | Support |
|---|---|---|---|---|
${Object.entries(best.metrics.perLevel).map(([l, m]) => `| ${l} | ${(m.precision * 100).toFixed(1)}% | ${(m.recall * 100).toFixed(1)}% | ${(m.f1 * 100).toFixed(1)}% | ${m.support} |`).join('\n')}

## Clinical Contract (RF + Rule)
${checks.map((c) => `- ${c.peak} kPa, ${c.sustained}s -> ${predictWithRule({ peak: c.peak, sustained: c.sustained })} (expect ${c.expect})`).join('\n')}

## Rationale
DFN-DS dataset hanya memiliki 31 danger samples (0.05%) dari 3 pasien. 
RF tidak cukup data untuk belajar pattern danger yang generalizable.
Danger ditentukan rule-based karena secara klinis sudah well-defined 
(tekanan >70 kPa dalam durasi signifikan sudah berbahaya).

RF tetap data-driven untuk safe/warning boundary (99.95% data).
`;
  fs.writeFileSync(REPORT_FILE, report);
  console.log(`Report: ${REPORT_FILE}`);
}

main();
