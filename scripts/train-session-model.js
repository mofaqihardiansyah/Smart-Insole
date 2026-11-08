#!/usr/bin/env node
/**
 * train-session-model.js — DFN vs DM from one session of plantar pressure.
 *
 * Fase 0 dari rencana "Bentuk 2". Ini bukan retrain model per sampel: label,
 * fitur, dan satuan barisnya berbeda. Satu baris = satu pasien = satu sesi.
 *
 * Kenapa ada gerbang: dengan 135 pasien, hasil bagus bisa muncul dari
 * kebetulan. Script ini karena itu melaporkan cross-validation 5-fold
 * berstrata, membandingkannya dengan baseline mayoritas dan dengan fitur
 * tekanan tunggal terbaik. Kalau Random Forest tidak mengalahkan "tekanan
 * maksimum saja", model ini tidak menambah apa pun dan tidak diekspor.
 *
 * Kriteria lulus (diputuskan sebelum melihat hasil):
 *   OOF AUC >= 0.65  DAN  OOF AUC >= AUC fitur tunggal terbaik + 0.03
 *
 * Dua kontrol ikut dijalankan pada fold yang sama, tidak pernah diekspor:
 *   - demografi saja    -> kontrol positif; kalau ikut gagal, pipelinenya rusak
 *   - tekanan + demografi -> apakah tekanan menambah apa pun di atas demografi
 *
 * Usage: node scripts/train-session-model.js
 *        node scripts/train-session-model.js --sweep   (regularisation grid)
 */

const fs = require('fs');
const path = require('path');
const { createRng, trainForest, voteCounts } = require('./lib/forest');

const ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'models', 'session-dataset.json');
const OUTPUT_FILE = path.join(ROOT, 'models', 'session-model.json');

const POSITIVE = 'DFN';
const NEGATIVE = 'DM';
const LABELS = [NEGATIVE, POSITIVE];
const FOLDS = 5;
const SEED = 42;
const COMBO = { nTrees: 300, maxDepth: 3, minSamples: 10 };
// `maxDepth: 3` is deliberate. With n = 135, a depth-6 forest reaches in-sample
// AUC 0.97 while scoring 0.50 out of fold: it memorises, it does not learn. A
// shallow forest is the config that can still generalise at this sample size.

const AUC_FLOOR = 0.65;
const AUC_MARGIN_OVER_BASELINE = 0.03;

const DEMOGRAPHIC_FEATURES = ['age', 'sex', 'diabetesYears', 'bmi'];


/* ------------------------------------------------------------ statistics --- */

/**
 * Rank-based AUC with tied scores sharing an average rank.
 * Returns 1 when positives always score above negatives, 0.5 for a coin flip.
 */
function auc(scored) {
  const sorted = [...scored].sort((a, b) => a.score - b.score);
  const n = sorted.length;
  const ranks = new Array(n);
  let i = 0;
  while (i < n) {
    let j = i;
    while (j + 1 < n && sorted[j + 1].score === sorted[i].score) j += 1;
    const averageRank = (i + j) / 2 + 1;
    for (let k = i; k <= j; k += 1) ranks[k] = averageRank;
    i = j + 1;
  }

  let rankSumPositive = 0;
  let positives = 0;
  for (let k = 0; k < n; k += 1) {
    if (sorted[k].positive) {
      rankSumPositive += ranks[k];
      positives += 1;
    }
  }
  const negatives = n - positives;
  if (positives === 0 || negatives === 0) return 0.5;
  return (rankSumPositive - (positives * (positives + 1)) / 2) / (positives * negatives);
}

function binaryMetrics(scored, threshold = 0.5) {
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;
  for (const item of scored) {
    const predicted = item.score >= threshold;
    if (predicted && item.positive) tp += 1;
    else if (predicted && !item.positive) fp += 1;
    else if (!predicted && item.positive) fn += 1;
    else tn += 1;
  }
  const sensitivity = tp + fn > 0 ? tp / (tp + fn) : 0;
  const specificity = tn + fp > 0 ? tn / (tn + fp) : 0;
  return {
    accuracy: (tp + tn) / (tp + tn + fp + fn),
    sensitivity,
    specificity,
    balancedAccuracy: (sensitivity + specificity) / 2,
    confusion: { tp, fp, tn, fn },
  };
}

function classWeightsFor(rows) {
  const counts = { [NEGATIVE]: 0, [POSITIVE]: 0 };
  for (const row of rows) counts[row.label] += 1;
  const weights = {};
  for (const label of LABELS) {
    // Inverse frequency, capped at 10x like the sample-level trainer.
    weights[label] = Math.min(10, rows.length / (LABELS.length * counts[label]));
  }
  return weights;
}

/** Split patients into k folds, stratified by group, without reusing a row. */
function stratifiedFolds(rows, k, rng) {
  const byLabel = { [NEGATIVE]: [], [POSITIVE]: [] };
  for (const row of rows) byLabel[row.label].push(row);

  const folds = Array.from({ length: k }, () => []);
  for (const label of LABELS) {
    const bucket = byLabel[label];
    // Fisher-Yates with the shared deterministic RNG.
    for (let i = bucket.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [bucket[i], bucket[j]] = [bucket[j], bucket[i]];
    }
    bucket.forEach((row, index) => folds[index % k].push(row));
  }
  return folds;
}

/**
 * Train on k-1 folds, predict the held-out one, and pool the out-of-fold
 * probabilities. A fresh RNG per call means every run sees the same folds even
 * though the forest draws from it.
 */
function crossValidate(rows, featureNames, options = {}) {
  const combo = { ...COMBO, ...options };
  const folds = stratifiedFolds(rows, FOLDS, createRng(SEED));
  const scored = [];
  const foldReports = [];

  for (let f = 0; f < folds.length; f += 1) {
    const testRows = folds[f];
    const trainRows = folds.filter((_, index) => index !== f).flat();
    const trees = trainForest(
      trainRows,
      featureNames,
      classWeightsFor(trainRows),
      combo.nTrees,
      combo.maxDepth,
      combo.minSamples,
      createRng(SEED + f)
    );
    const foldScored = testRows.map((row) => {
      const totals = voteCounts(trees, row, LABELS);
      return {
        positive: row.label === POSITIVE,
        score: totals[POSITIVE] / (totals[POSITIVE] + totals[NEGATIVE]),
      };
    });
    scored.push(...foldScored);
    foldReports.push({
      auc: auc(foldScored),
      accuracy: binaryMetrics(foldScored).accuracy,
      n: testRows.length,
    });
  }

  return { scored, oofAuc: auc(scored), metrics: binaryMetrics(scored), folds: foldReports };
}


/* ---------------------------------------------------------------- report --- */

const pct = (value) => `${(value * 100).toFixed(1)}%`;
const fixed = (value) => value.toFixed(3);

/**
 * Regularisation sweep, opt-in with `--sweep`. Eighteen cross-validations take
 * minutes, so it is not part of the default report. It exists because the
 * headline config has to be justified: at n = 135 a deep forest memorises the
 * training rows and scores chance out of fold, and that has to be shown rather
 * than asserted.
 */
function runSweep(rows, features) {
  const sets = [
    { name: 'pressure only', featureNames: features },
    { name: 'demographics only', featureNames: DEMOGRAPHIC_FEATURES },
    { name: 'pressure + demographics', featureNames: [...features, ...DEMOGRAPHIC_FEATURES] },
  ];

  console.log(`\nSweep (${FOLDS}-fold, 150 trees per run, out-of-fold AUC):`);
  const depths = [2, 3, 4];
  const minSamplesGrid = [10, 20];
  for (const set of sets) {
    console.log(`\n${set.name}`);
    for (const maxDepth of depths) {
      const cells = minSamplesGrid.map((minSamples) => {
        const result = crossValidate(rows, set.featureNames, { nTrees: 150, maxDepth, minSamples });
        return `depth ${maxDepth} / min ${minSamples}: ${fixed(result.oofAuc)}`;
      });
      console.log(`  ${cells.join('   ')}`);
    }
  }
}

function main() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const features = data.features;

  const rows = data.sessions.map((session) => {
    if (session.group !== POSITIVE && session.group !== NEGATIVE) {
      throw new Error(`Unexpected group "${session.group}" in ${session.id}`);
    }
    return {
      id: session.id,
      label: session.group,
      ...session.features,
      ...session.meta,
    };
  });

  const nPositive = rows.filter((r) => r.label === POSITIVE).length;
  const nNegative = rows.length - nPositive;
  console.log(`Sessions: ${rows.length} (${POSITIVE} ${nPositive}, ${NEGATIVE} ${nNegative})  features: ${features.length}`);

  /* ------------------------- single-feature baselines ------------------------- */
  const featureScores = features
    .map((feature) => {
      const raw = auc(rows.map((r) => ({ score: r[feature], positive: r.label === POSITIVE })));
      return { feature, auc: raw, direction: raw >= 0.5 ? '+' : '-' };
    })
    .sort((a, b) => b.auc - a.auc);

  const best = featureScores[0];
  console.log('\nBaselines (no training):');
  console.log(`  majority "${POSITIVE}" always : acc ${pct(nPositive / rows.length)}  AUC 0.500`);
  console.log(`  best single feature          : ${best.feature}  AUC ${fixed(best.auc)} (${best.direction} association)`);
  console.log('  top 5 features:');
  for (const f of featureScores.slice(0, 5)) {
    console.log(`    ${f.feature.padEnd(14)} AUC ${fixed(f.auc)}`);
  }

  if (process.argv.includes('--sweep')) {
    runSweep(rows, features);
    return;
  }

  /* ---------------------------------- CV ---------------------------------- */
  const pressure = crossValidate(rows, features);
  const oofAuc = pressure.oofAuc;
  const oof = pressure.metrics;

  console.log(`\n${FOLDS}-fold stratified CV (seed ${SEED}, ${COMBO.nTrees} trees, depth ${COMBO.maxDepth}):`);
  pressure.folds.forEach((fold, index) => {
    console.log(`  fold ${index + 1}: AUC ${fixed(fold.auc)}  acc ${pct(fold.accuracy)}  (n=${fold.n})`);
  });
  console.log(`  out-of-fold AUC      : ${fixed(oofAuc)}`);
  console.log(`  out-of-fold accuracy : ${pct(oof.accuracy)}  (majority ${pct(nPositive / rows.length)})`);
  console.log(`  sensitivity (${POSITIVE}) : ${pct(oof.sensitivity)}`);
  console.log(`  specificity (${NEGATIVE}) : ${pct(oof.specificity)}`);
  console.log(`  balanced accuracy    : ${pct(oof.balancedAccuracy)}`);
  console.log(`  confusion            : tp=${oof.confusion.tp} fp=${oof.confusion.fp} tn=${oof.confusion.tn} fn=${oof.confusion.fn}`);

  /* -------------------------------- controls ------------------------------- */
  // Both controls use the same folds as the model under test. They separate
  // "pressure carries no signal" from "the pipeline is broken".
  console.log('\nControls (same folds, never exported):');
  const demographics = crossValidate(rows, DEMOGRAPHIC_FEATURES);
  const combined = crossValidate(rows, [...features, ...DEMOGRAPHIC_FEATURES]);
  console.log(`  ${'demographics only'.padEnd(24)} AUC ${fixed(demographics.oofAuc)}  acc ${pct(demographics.metrics.accuracy)}`);
  console.log(`  ${'pressure + demographics'.padEnd(24)} AUC ${fixed(combined.oofAuc)}  acc ${pct(combined.metrics.accuracy)}`);

  if (demographics.oofAuc < AUC_FLOOR) {
    console.log(
      `\n  The demographic control also stays below ${fixed(AUC_FLOOR)} (${fixed(demographics.oofAuc)})` +
        ' — so no feature set in this dataset clears the gate. Pressure is at chance;' +
        ' demographics carry a little, which is why the pipeline is not the thing to blame.'
    );
  }

  /* --------------------------------- gate --------------------------------- */
  const beatsFloor = oofAuc >= AUC_FLOOR;
  const beatsBaseline = oofAuc >= best.auc + AUC_MARGIN_OVER_BASELINE;
  const passed = beatsFloor && beatsBaseline;

  console.log('\nGate (decided before training):');
  console.log(`  AUC >= ${fixed(AUC_FLOOR)}                 : ${beatsFloor ? 'PASS' : 'FAIL'} (${fixed(oofAuc)})`);
  console.log(`  AUC >= ${fixed(best.auc)} + ${AUC_MARGIN_OVER_BASELINE} : ${beatsBaseline ? 'PASS' : 'FAIL'} (${fixed(oofAuc)} vs ${fixed(best.auc + AUC_MARGIN_OVER_BASELINE)})`);

  if (!passed) {
    console.log('\nVERDICT: GAGAL. Model sesi tidak diekspor.');
    console.log('Tekanan plantar pada dataset ini tidak memisahkan DFN dari DM cukup untuk dipakai.');
    console.log('Lanjutkan dengan Bentuk 1 (alarm berbasis aturan) dan catat ini sebagai hasil negatif.');
    process.exitCode = 1;
    return;
  }

  /* ------------------------------ final model ------------------------------ */
  const finalTrees = trainForest(
    rows,
    features,
    classWeightsFor(rows),
    COMBO.nTrees,
    COMBO.maxDepth,
    COMBO.minSamples,
    createRng(SEED)
  );

  const model = {
    version: '1.0',
    purpose: 'session-level screening: DFN (neuropathic) vs DM (non-neuropathic)',
    features,
    labels: LABELS,
    positiveLabel: POSITIVE,
    combo: COMBO,
    decisionThreshold: 0.5,
    metrics: {
      scheme: `${FOLDS}-fold stratified cross-validation, out-of-fold predictions`,
      auc: oofAuc,
      accuracy: oof.accuracy,
      sensitivity: oof.sensitivity,
      specificity: oof.specificity,
      balancedAccuracy: oof.balancedAccuracy,
      confusion: oof.confusion,
      folds: pressure.folds.length,
      baselines: {
        majorityAccuracy: nPositive / rows.length,
        bestSingleFeature: { feature: best.feature, auc: best.auc },
      },
      controls: {
        demographicsOnlyAuc: demographics.oofAuc,
        pressurePlusDemographicsAuc: combined.oofAuc,
      },
    },
    provenance: {
      dataset: data.source,
      datasetVersion: data.datasetVersion,
      sessions: rows.length,
      positiveSessions: nPositive,
      negativeSessions: nNegative,
      preparedBy: 'scripts/prepare-session-dataset.py',
      trainedBy: 'scripts/train-session-model.js',
      seed: SEED,
    },
    trees: finalTrees,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(model));
  console.log('\nVERDICT: LULUS. Model diekspor ke', OUTPUT_FILE);
  console.log(`  ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(0)} KB, ${COMBO.nTrees} trees`);
  console.log('  Catatan: artefak ini untuk skrining per sesi, bukan verdict per sampel.');
}

main();
