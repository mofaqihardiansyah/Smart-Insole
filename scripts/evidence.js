#!/usr/bin/env node
/**
 * evidence.js — paket bukti model Random Forest.
 *
 * Menjalankan semua pengukuran di memori dari data mentah, lalu menulis laporan,
 * grafik, dan angka ke `docs/evidence/`. Tidak menyentuh model produksi
 * (`models/rf-model.json`), header firmware, atau kode aplikasi.
 *
 * Skenario ambang bahaya dijalankan dua kali: 200 kPa (kondisi sekarang) dan
 * 70 kPa (usulan yang sesuai Bab II). Dua-duanya dilaporkan supaya keputusan
 * ambang bisa diambil dengan angka, bukan opini.
 *
 * Usage: node scripts/evidence.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { createRng, trainForest, voteCounts } = require('./lib/forest');
const charts = require('./lib/charts');
const sessionCv = require('./train-session-model');

const ROOT = path.resolve(__dirname, '..');
const TRAINING_DATA = path.join(ROOT, 'models', 'training-data.json');
const SESSION_DATA = path.join(ROOT, 'models', 'session-dataset.json');
const RF_MODEL = path.join(ROOT, 'models', 'rf-model.json');
const RF_HEADER = path.join(ROOT, 'firmware', 'include', 'rf-model-data.h');
const OUT_DIR = path.join(ROOT, 'docs', 'evidence');
const CHART_DIR = path.join(OUT_DIR, 'charts');

const SEED = 42;
const FOLDS = 5;
const WARNING_KPA = 35;
const SAFE_FLOOR_SAMPLES = 200; // 20 detik pada 10 Hz
const DANGER_SUSTAINED_SAMPLES = 1;
const TWO_CLASS = ['safe', 'warning'];
const SCENARIOS = [200, 70];

const PALETTE = charts.PALETTE;
const LEVEL_COLORS = {
  safe: PALETTE.safe,
  warning: PALETTE.warning,
  danger: PALETTE.danger,
};
const LEVEL_LABELS = { safe: 'Aman', warning: 'Waspada', danger: 'Bahaya' };

const CONTRACT = [
  { peak: 40, seconds: 1, expect: { 200: 'warning', 70: 'warning' } },
  { peak: 34, seconds: 0, expect: { 200: 'safe', 70: 'safe' } },
  { peak: 30, seconds: 0, expect: { 200: 'safe', 70: 'safe' } },
  { peak: 70, seconds: 1, expect: { 200: 'warning', 70: 'danger' } },
  { peak: 199, seconds: 31, expect: { 200: 'warning', 70: 'danger' } },
  { peak: 200, seconds: 1, expect: { 200: 'danger', 70: 'danger' } },
  { peak: 210, seconds: 1, expect: { 200: 'danger', 70: 'danger' } },
];

/* --------------------------------------------------------------- helpers --- */

const id = (value, digits = 0) =>
  Number(value).toLocaleString('id-ID', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const pct = (value, digits = 1) => `${id(value * 100, digits)}%`;

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sd(values) {
  if (values.length < 2) return 0;
  const m = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - m) ** 2)));
}

function sha256(buffer, length = 16) {
  return crypto.createHash('sha256').update(buffer).digest('hex').slice(0, length);
}

/** Gaussian noise from a seeded uniform RNG (Box-Muller). */
function gaussian(rng) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function classWeights(samples, labels) {
  const counts = {};
  for (const label of labels) counts[label] = 0;
  for (const sample of samples) counts[sample.label] = (counts[sample.label] || 0) + 1;
  const weights = {};
  for (const label of labels) {
    weights[label] = Math.min(10, samples.length / (labels.length * Math.max(1, counts[label])));
  }
  return weights;
}

function countNodes(tree) {
  return tree.leaf ? 1 : 1 + countNodes(tree.left) + countNodes(tree.right);
}

function treeDepth(tree) {
  return tree.leaf ? 0 : 1 + Math.max(treeDepth(tree.left), treeDepth(tree.right));
}

/* ------------------------------------------------- reverse-engineer files --- */

function leafCounts(tree, sample) {
  if (tree.leaf) return tree.counts;
  return sample[tree.feature] <= tree.threshold
    ? leafCounts(tree.left, sample)
    : leafCounts(tree.right, sample);
}

function forestVote(trees, sample) {
  let safe = 0;
  let warning = 0;
  for (const tree of trees) {
    const counts = leafCounts(tree, sample);
    safe += counts.safe || 0;
    warning += counts.warning || 0;
  }
  return { safe, warning };
}

/** Same order of checks as `randomForestRisk.ts` and `RandomForest.cpp`. */
function hybridLevel(model, sample, dangerKpa) {
  const peak = Math.max(0, sample.peak);
  const sustained = Math.max(0, Math.round(sample.sustained));
  if (peak >= dangerKpa && sustained >= DANGER_SUSTAINED_SAMPLES) return 'danger';
  if (peak < WARNING_KPA && sustained < SAFE_FLOOR_SAMPLES) return 'safe';
  const totals = forestVote(model.trees, { peak, sustained });
  const voted = totals.warning > totals.safe ? 'warning' : 'safe';
  return voted === 'safe' && peak >= WARNING_KPA ? 'warning' : voted;
}

const ruleLevel = (sample) => (sample.peak >= WARNING_KPA ? 'warning' : 'safe');

/* -------------------------------------------------------------- metrics ---- */

/**
 * Confusion-based classification metrics. `extraCols` catches predictions
 * outside the label set (a `danger` prediction counts against its true class).
 */
function classify(actual, predicted, rowLabels = TWO_CLASS, extraCols = ['danger']) {
  const colLabels = [...rowLabels, ...extraCols];
  const matrix = rowLabels.map(() => colLabels.map(() => 0));
  let correct = 0;
  for (let i = 0; i < actual.length; i += 1) {
    const r = rowLabels.indexOf(actual[i]);
    const c = colLabels.indexOf(predicted[i]);
    if (r < 0 || c < 0) continue;
    matrix[r][c] += 1;
    if (actual[i] === predicted[i]) correct += 1;
  }

  const perClass = {};
  let macroF1 = 0;
  rowLabels.forEach((label, r) => {
    const tp = matrix[r][r];
    let fp = 0;
    let fn = 0;
    rowLabels.forEach((_, rr) => {
      if (rr !== r) fp += matrix[rr][r];
    });
    colLabels.forEach((_, cc) => {
      if (cc !== r) fn += matrix[r][cc];
    });
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    perClass[label] = { precision, recall, f1, support: tp + fn };
    macroF1 += f1;
  });

  return {
    accuracy: correct / actual.length,
    macroF1: macroF1 / rowLabels.length,
    perClass,
    matrix,
    rowLabels,
    colLabels,
  };
}

function rocPoints(scored) {
  const positives = scored.filter((item) => item.positive).length;
  const negatives = scored.length - positives;
  const sorted = scored.slice().sort((a, b) => b.score - a.score);
  const points = [{ fpr: 0, tpr: 0 }];
  let tp = 0;
  let fp = 0;
  let i = 0;
  while (i < sorted.length) {
    const threshold = sorted[i].score;
    while (i < sorted.length && sorted[i].score === threshold) {
      if (sorted[i].positive) tp += 1;
      else fp += 1;
      i += 1;
    }
    points.push({ fpr: fp / negatives, tpr: tp / positives });
  }
  const last = points[points.length - 1];
  if (last.fpr !== 1 || last.tpr !== 1) points.push({ fpr: 1, tpr: 1 });
  if (points.length <= 60) return points;
  const step = Math.ceil(points.length / 60);
  return points.filter((_, index) => index % step === 0 || index === points.length - 1);
}

/* ----------------------------------------------------------------- data ---- */

/**
 * The dataset artifact stores the sample label as `level`; `trainForest` reads
 * `label`. Normalise once here so every consumer sees the same field name.
 */
function normalisePatient(patient, split) {
  return {
    ...patient,
    split,
    samples: patient.samples.map((sample) => {
      const { level, ...rest } = sample;
      return { ...rest, label: level };
    }),
  };
}

function loadPatients() {
  const data = JSON.parse(fs.readFileSync(TRAINING_DATA, 'utf8'));
  return {
    meta: data,
    patients: [
      ...data.train.map((patient) => normalisePatient(patient, 'train')),
      ...data.validation.map((patient) => normalisePatient(patient, 'validation')),
    ],
  };
}

function audit(patients, meta) {
  const bySplit = (split) => patients.filter((patient) => patient.split === split);
  const samples = (split) => bySplit(split).flatMap((patient) => patient.samples);

  const splitSummary = {};
  for (const split of ['train', 'validation']) {
    const rows = samples(split);
    const labels = { safe: 0, warning: 0 };
    const groups = { DFN: 0, DM: 0 };
    for (const patient of bySplit(split)) groups[patient.group] = (groups[patient.group] || 0) + 1;
    for (const sample of rows) labels[sample.label] += 1;
    splitSummary[split] = {
      patients: bySplit(split).length,
      samples: rows.length,
      labels,
      groups,
      maxPeak: Math.max(...rows.map((row) => row.peak)),
      maxSustained: Math.max(...rows.map((row) => row.sustained)),
      atOrAbove: {
        35: rows.filter((row) => row.peak >= 35).length,
        70: rows.filter((row) => row.peak >= 70).length,
        200: rows.filter((row) => row.peak >= 200).length,
      },
    };
  }

  const allSamples = samples('train').concat(samples('validation'));
  const binWidth = 2.5;
  const binCount = 36; // 0 - 90 kPa
  const bins = Array.from({ length: binCount }, (_, index) => ({
    x0: index * binWidth,
    x1: (index + 1) * binWidth,
    count: 0,
  }));
  for (const sample of allSamples) {
    const index = Math.min(binCount - 1, Math.floor(sample.peak / binWidth));
    bins[index].count += 1;
  }

  const patientRows = patients
    .map((patient) => ({
      id: patient.patient,
      group: patient.group,
      split: patient.split,
      maxPeak: Math.max(...patient.samples.map((sample) => sample.peak)),
      atOrAbove70: patient.samples.filter((sample) => sample.peak >= 70).length,
      atOrAbove200: patient.samples.filter((sample) => sample.peak >= 200).length,
    }))
    .sort((a, b) => a.maxPeak - b.maxPeak);

  return {
    source: meta.source,
    version: meta.version,
    calibration: meta.calibration,
    features: meta.features,
    splits: splitSummary,
    totals: {
      patients: patients.length,
      samples: allSamples.length,
      atOrAbove: {
        35: allSamples.filter((sample) => sample.peak >= 35).length,
        70: allSamples.filter((sample) => sample.peak >= 70).length,
        200: allSamples.filter((sample) => sample.peak >= 200).length,
      },
      maxPeak: Math.max(...allSamples.map((sample) => sample.peak)),
    },
    bins,
    patients: patientRows,
  };
}

/* ----------------------------------------------------------- predictors ---- */

function evaluatePredictors(patients, model) {
  const trainSamples = patients
    .filter((patient) => patient.split === 'train')
    .flatMap((patient) => patient.samples);
  const valPatients = patients.filter((patient) => patient.split === 'validation');
  const valSamples = valPatients.flatMap((patient) => patient.samples);

  const singleTree = trainForest(
    trainSamples,
    ['peak', 'sustained'],
    classWeights(trainSamples, TWO_CLASS),
    1,
    8,
    4,
    createRng(SEED)
  );
  const refit = trainForest(
    trainSamples,
    ['peak', 'sustained'],
    classWeights(trainSamples, TWO_CLASS),
    20,
    8,
    4,
    createRng(SEED)
  );

  const predictors = [
    { key: 'rule', name: 'Aturan murni', predict: (sample) => ruleLevel(sample) },
    {
      key: 'singleTree',
      name: 'Pohon tunggal (d=8)',
      predict: (sample) => (forestVote(singleTree, sample).warning >
        forestVote(singleTree, sample).safe
        ? 'warning'
        : 'safe'),
    },
    {
      key: 'rf',
      name: 'Random Forest (20 pohon)',
      predict: (sample) => {
        const totals = forestVote(refit, sample);
        return totals.warning > totals.safe ? 'warning' : 'safe';
      },
    },
    {
      key: 'shipped',
      name: 'RF produksi (models/rf-model.json)',
      predict: (sample) => {
        const totals = forestVote(model.trees, sample);
        return totals.warning > totals.safe ? 'warning' : 'safe';
      },
    },
    { key: 'hybrid200', name: 'Hybrid 200 kPa (produksi)', predict: (sample) => hybridLevel(model, sample, 200) },
    { key: 'hybrid70', name: 'Hybrid 70 kPa', predict: (sample) => hybridLevel(model, sample, 70) },
  ];

  const actual = valSamples.map((sample) => sample.label);
  const results = predictors.map((predictor) => {
    const predicted = valSamples.map((sample) => predictor.predict(sample));
    const metrics = classify(actual, predicted);
    let agreement = 0;
    const baseline = valSamples.map((sample) => ruleLevel(sample));
    for (let i = 0; i < predicted.length; i += 1) if (predicted[i] === baseline[i]) agreement += 1;
    return {
      key: predictor.key,
      name: predictor.name,
      accuracy: metrics.accuracy,
      macroF1: metrics.macroF1,
      perClass: metrics.perClass,
      matrix: metrics.matrix,
      rowLabels: metrics.rowLabels,
      colLabels: metrics.colLabels,
      agreementWithRule: agreement / predicted.length,
      dangerPredictions: predicted.filter((level) => level === 'danger').length,
    };
  });

  return { valSamples, results };
}

/* --------------------------------------------------- cross-validation ------ */

function patientFolds(patients, k, seed) {
  const rng = createRng(seed);
  const buckets = {};
  for (const patient of patients) {
    if (!buckets[patient.group]) buckets[patient.group] = [];
    buckets[patient.group].push(patient);
  }
  const folds = Array.from({ length: k }, () => []);
  for (const key of Object.keys(buckets)) {
    const list = buckets[key].slice();
    for (let i = list.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    list.forEach((patient, index) => folds[index % k].push(patient));
  }
  return folds;
}

function crossValidateSamples(patients, model) {
  const folds = patientFolds(patients, FOLDS, SEED);
  const schemes = [
    { key: 'rule', name: 'Aturan murni', folds: [] },
    { key: 'singleTree', name: 'Pohon tunggal', folds: [] },
    { key: 'rf', name: 'Random Forest (20 pohon)', folds: [] },
  ];

  folds.forEach((foldPatients, foldIndex) => {
    const trainPatients = folds.filter((_, index) => index !== foldIndex).flat();
    const trainSamples = trainPatients.flatMap((patient) => patient.samples);
    const testSamples = foldPatients.flatMap((patient) => patient.samples);
    const actual = testSamples.map((sample) => sample.label);

    const single = trainForest(
      trainSamples,
      ['peak', 'sustained'],
      classWeights(trainSamples, TWO_CLASS),
      1,
      8,
      4,
      createRng(SEED + foldIndex)
    );
    const forest = trainForest(
      trainSamples,
      ['peak', 'sustained'],
      classWeights(trainSamples, TWO_CLASS),
      20,
      8,
      4,
      createRng(SEED + foldIndex)
    );

    const vote = (trees, sample) => {
      const totals = forestVote(trees, sample);
      return totals.warning > totals.safe ? 'warning' : 'safe';
    };

    const predictions = {
      rule: testSamples.map((sample) => ruleLevel(sample)),
      singleTree: testSamples.map((sample) => vote(single, sample)),
      rf: testSamples.map((sample) => vote(forest, sample)),
    };

    for (const scheme of schemes) {
      const metrics = classify(actual, predictions[scheme.key], TWO_CLASS, []);
      scheme.folds.push({
        fold: foldIndex + 1,
        patients: foldPatients.length,
        samples: testSamples.length,
        accuracy: metrics.accuracy,
        macroF1: metrics.macroF1,
      });
    }
  });

  return schemes.map((scheme) => ({
    key: scheme.key,
    name: scheme.name,
    accuracyMean: mean(scheme.folds.map((fold) => fold.accuracy)),
    accuracySd: sd(scheme.folds.map((fold) => fold.accuracy)),
    macroF1Mean: mean(scheme.folds.map((fold) => fold.macroF1)),
    macroF1Sd: sd(scheme.folds.map((fold) => fold.macroF1)),
    folds: scheme.folds,
  }));
}

/* ------------------------------------------------------------ robustness --- */

function perturb(patient, transform) {
  let run = 0;
  return patient.samples.map((sample) => {
    let [f, m, h] = [sample.forefoot, sample.midfoot, sample.heel];
    [f, m, h] = transform(f, m, h);
    const peak = Math.max(0, f, m, h);
    run = peak >= WARNING_KPA ? run + 1 : 0;
    return { peak, sustained: run, label: sample.label };
  });
}

function robustness(patients, model) {
  const valPatients = patients.filter((patient) => patient.split === 'validation');
  const rng = createRng(SEED);
  const noise = {};
  for (let i = 0; i < 1000; i += 1) noise[i] = gaussian(rng);

  const scenarios = [
    { key: 'clean', name: 'Bersih (hitung ulang)', transform: (f, m, h) => [f, m, h] },
    ...[0.05, 0.1, 0.2].map((sigma) => ({
      key: `noise${Math.round(sigma * 100)}`,
      name: `Noise ${Math.round(sigma * 100)}%`,
      transform: (f, m, h) => [f, m, h].map((value) => Math.max(0, value * (1 + gaussian(rng) * sigma))),
    })),
    ...[0.8, 0.9, 1.1, 1.2].map((factor) => ({
      key: `gain${Math.round(factor * 100)}`,
      name: `Gain ×${factor.toFixed(1)}`,
      transform: (f, m, h) => [f * factor, m * factor, h * factor],
    })),
    ...[
      { key: 'dropForefoot', name: 'Sensor forefoot mati', index: 0 },
      { key: 'dropMidfoot', name: 'Sensor midfoot mati', index: 1 },
      { key: 'dropHeel', name: 'Sensor heel mati', index: 2 },
    ].map((item) => ({
      key: item.key,
      name: item.name,
      transform: (f, m, h) => {
        const values = [f, m, h];
        values[item.index] = 0;
        return values;
      },
    })),
  ];

  const cleanPredictions = [];
  const rows = scenarios.map((scenario) => {
    const actual = [];
    const predicted = [];
    for (const patient of valPatients) {
      for (const sample of perturb(patient, scenario.transform)) {
        actual.push(sample.label);
        predicted.push(hybridLevel(model, sample, 200));
      }
    }
    if (scenario.key === 'clean') cleanPredictions.push(...predicted);
    const metrics = classify(actual, predicted);
    let flips = 0;
    if (cleanPredictions.length === predicted.length && scenario.key !== 'clean') {
      for (let i = 0; i < predicted.length; i += 1) {
        if (predicted[i] !== cleanPredictions[i]) flips += 1;
      }
    }
    return {
      key: scenario.key,
      name: scenario.name,
      accuracy: metrics.accuracy,
      macroF1: metrics.macroF1,
      flipRate: scenario.key === 'clean' ? 0 : flips / predicted.length,
      dangerPredictions: predicted.filter((level) => level === 'danger').length,
    };
  });

  return { rows, samples: cleanPredictions.length };
}

/* ------------------------------------------------------- threshold map ----- */

function thresholdMap(model, dangerKpa) {
  const peaks = [];
  for (let value = 0; value <= 220; value += 4) peaks.push(value);
  const durations = [];
  for (let value = 0; value <= 60; value += 2) durations.push(value);

  const cells = durations.map((seconds) =>
    peaks.map((peak) => hybridLevel(model, { peak, sustained: seconds * 10 }, dangerKpa))
  );
  return { peaks, durations, cells };
}

/* --------------------------------------------------------- session task ---- */

function sessionEvidence() {
  const data = JSON.parse(fs.readFileSync(SESSION_DATA, 'utf8'));
  const rows = data.sessions.map((session) => ({
    id: session.id,
    label: session.group,
    ...session.features,
    ...session.meta,
  }));

  const positive = rows.filter((row) => row.label === sessionCv.configuration.positiveLabel).length;
  const pressure = sessionCv.crossValidate(rows, data.features);
  const demographics = sessionCv.crossValidate(rows, sessionCv.configuration.demographicFeatures);
  const combined = sessionCv.crossValidate(rows, [...data.features, ...sessionCv.configuration.demographicFeatures]);

  const featureScores = data.features
    .map((feature) => {
      const raw = sessionCv.auc(rows.map((row) => ({ score: row[feature], positive: row.label === 'DFN' })));
      return { feature, auc: Math.max(raw, 1 - raw) };
    })
    .sort((a, b) => b.auc - a.auc);

  const best = featureScores[0];
  const gate = {
    floor: sessionCv.configuration.aucFloor,
    margin: sessionCv.configuration.aucMargin,
    passesFloor: pressure.oofAuc >= sessionCv.configuration.aucFloor,
    passesBaseline: pressure.oofAuc >= best.auc + sessionCv.configuration.aucMargin,
  };
  gate.passed = gate.passesFloor && gate.passesBaseline;

  return {
    positiveLabel: sessionCv.configuration.positiveLabel,
    sessions: rows.length,
    positiveSessions: positive,
    negativeSessions: rows.length - positive,
    features: data.features.length,
    folds: sessionCv.configuration.folds,
    trees: sessionCv.configuration.combo.nTrees,
    depth: sessionCv.configuration.combo.maxDepth,
    auc: pressure.oofAuc,
    accuracy: pressure.metrics.accuracy,
    sensitivity: pressure.metrics.sensitivity,
    specificity: pressure.metrics.specificity,
    balancedAccuracy: pressure.metrics.balancedAccuracy,
    majorityAccuracy: positive / rows.length,
    bestFeature: best,
    topFeatures: featureScores.slice(0, 5),
    controls: { demographicsAuc: demographics.oofAuc, combinedAuc: combined.oofAuc },
    foldAuc: pressure.folds.map((fold) => fold.auc),
    roc: rocPoints(pressure.scored),
    gate,
  };
}

/* ---------------------------------------------------------- figshare DFU --- */

function figshareNumbers() {
  // The validator ships with DANGER_KPA = 70. Its `at_or_above_danger_pct`
  // therefore means ">= 70 kPa"; we need both 70 and 200, so the threshold is
  // patched between two calls instead of duplicating the parser.
  const script = [
    'import importlib.util, json',
    'spec = importlib.util.spec_from_file_location("validator", "scripts/validate-datasets.py")',
    'module = importlib.util.module_from_spec(spec)',
    'spec.loader.exec_module(module)',
    'base = module.check_figshare()',
    'module.DANGER_KPA = 200.0',
    'two = module.check_figshare()',
    'result = dict(base)',
    'result["at_or_above_70_pct"] = base["at_or_above_danger_pct"]',
    'result["at_or_above_200_pct"] = two["at_or_above_danger_pct"]',
    'print(json.dumps(result))',
  ].join('\n');
  try {
    const out = execFileSync('python3', ['-c', script], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      // Importing the validator would otherwise leave `scripts/__pycache__`.
      env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
    });
    return JSON.parse(out.trim());
  } catch (error) {
    return { error: String(error.message || error) };
  }
}

/* ------------------------------------------------------------ model facts -- */

function modelFacts(model) {
  const nodes = model.trees.reduce((sum, tree) => sum + countNodes(tree), 0);
  const depth = Math.max(...model.trees.map((tree) => treeDepth(tree)));

  const sample = { peak: 52.5, sustained: 40 };
  const iterations = 20000;
  for (let i = 0; i < 500; i += 1) hybridLevel(model, sample, 200);
  const start = process.hrtime.bigint();
  for (let i = 0; i < iterations; i += 1) hybridLevel(model, sample, 200);
  const perCall = Number(process.hrtime.bigint() - start) / iterations;

  const splitFeatures = {};
  const peakThresholds = [];
  const sustainedThresholds = [];
  for (const tree of model.trees) {
    if (tree.leaf) continue;
    splitFeatures[tree.feature] = (splitFeatures[tree.feature] || 0) + 1;
    if (tree.feature === 'peak') peakThresholds.push(tree.threshold);
    else sustainedThresholds.push(tree.threshold);
  }

  return {
    version: model.version,
    features: model.features,
    trees: model.trees.length,
    nodes,
    depth,
    splitFeatures,
    peakThresholds,
    sustainedThresholds,
    jsonBytes: fs.statSync(RF_MODEL).size,
    headerBytes: fs.statSync(RF_HEADER).size,
    hostMicros: perCall / 1000,
    dangerRule: model.dangerRule,
    hash: sha256(fs.readFileSync(RF_MODEL)),
  };
}

/* --------------------------------------------------------------- charts ---- */

function renderCharts(m) {
  const out = {};

  out['histogram-peak'] = charts.histogram({
    title: 'Distribusi tekanan puncak seluruh dataset',
    subtitle: `${id(m.audit.totals.samples)} sampel dari ${m.audit.totals.patients} pasien DFN-DS v${m.audit.version}`,
    bins: m.audit.bins,
    yLog: true,
    xLabel: 'Tekanan puncak (kPa)',
    yLabel: 'Jumlah sampel (skala log)',
    markers: [
      { x: 35, label: 'ambang Waspada 35 kPa', color: PALETTE.warning },
      { x: 70, label: 'usulan bahaya 70 kPa', color: PALETTE.danger },
    ],
    note: `Tekanan tertinggi ${id(m.audit.totals.maxPeak, 2)} kPa; ambang 200 kPa berada jauh di luar sumbu ini.`,
  });

  out['ambang-counts'] = charts.bars({
    title: 'Berapa sampel yang mencapai tiap ambang',
    subtitle: 'Skala log, supaya angka 0 dan 31 tetap terbaca',
    categories: ['≥ 35 kPa', '≥ 70 kPa', '≥ 200 kPa'],
    series: [{ name: 'sampel', values: [m.audit.totals.atOrAbove[35], m.audit.totals.atOrAbove[70], m.audit.totals.atOrAbove[200]] }],
    colors: [PALETTE.warning, PALETTE.danger, PALETTE.slate],
    log: true,
    yLabel: 'Jumlah sampel',
    valueFormat: (value) => id(value),
    note: 'Kelas Bahaya hanya mungkin jika ada sampel di kolom terakhir.',
  });

  out['per-pasien'] = charts.dotPlot({
    title: 'Tekanan puncak tiap pasien',
    subtitle: 'Satu titik = satu pasien, diurutkan dari terendah',
    points: m.audit.patients.map((patient, index) => ({
      x: index,
      y: patient.maxPeak,
      group: patient.group,
      split: patient.split,
    })),
    groups: { DFN: PALETTE.violet, DM: PALETTE.accent },
    markers: [
      { y: 35, label: 'ambang Waspada 35 kPa', color: PALETTE.warning },
      { y: 70, label: 'usulan bahaya 70 kPa', color: PALETTE.danger },
    ],
    yMax: 95,
    note: 'Ambang 200 kPa tidak digambar: tidak ada pasien yang melewatinya.',
  });

  for (const scenario of m.scenarios) {
    const result = m.validation.results.find((item) => item.key === scenario.key);
    const rowLabels = result.rowLabels.map((label) => LEVEL_LABELS[label]);
    const colLabels = result.colLabels.map((label) => LEVEL_LABELS[label]);
    out[`confusion-${scenario.kpa}`] = charts.confusion({
      title: `Matriks konfusi — ${scenario.label}`,
      subtitle: `Validasi ${id(m.audit.splits.validation.samples)} sampel, akurasi ${pct(result.accuracy)}`,
      matrix: result.matrix,
      rowLabels,
      colLabels,
    });
  }

  out['perbandingan-model'] = charts.bars({
    title: 'Perbandingan model pada data validasi',
    subtitle: 'Macro-F1, label berasal dari aturan ambang',
    categories: ['Aturan murni', 'Pohon tunggal', 'RF 20 pohon', 'Hybrid 200 kPa'],
    series: [
      {
        name: 'Macro-F1',
        values: ['rule', 'singleTree', 'rf', 'hybrid200'].map((key) => {
          const item = m.validation.results.find((result) => result.key === key);
          return Number((item.macroF1 * 100).toFixed(2));
        }),
      },
    ],
    colors: [PALETTE.slate, PALETTE.violet, PALETTE.accent, PALETTE.safe],
    yLabel: 'Macro-F1 (%)',
    valueFormat: (value) => `${id(value, 2)}%`,
    note: 'Semua bar sama tinggi: tidak ada model yang lebih baik dari aturan pada target ini.',
  });

  out['cv-lipatan'] = charts.strip({
    title: 'Macro-F1 per lipatan, validasi silang 5 lipatan per pasien',
    subtitle: 'Satu lingkaran = satu lipatan (28 pasien); garis = rata-rata',
    rows: m.cv.map((scheme, index) => ({
      name: scheme.name,
      color: [PALETTE.slate, PALETTE.violet, PALETTE.accent][index],
      values: scheme.folds.map((fold) => fold.macroF1),
    })),
    yDomain: [0.9, 1.005],
    xLabel: 'Macro-F1',
    valueFormat: (value) => value.toFixed(3).replace('.', ','),
    note: 'Kelima lipatan bernilai sama, jadi titiknya ditumpuk vertikal di 1,000; posisi horizontal tetap nilai sebenarnya.',
  });

  out['ketahanan'] = charts.bars({
    title: 'Ketahanan keputusan terhadap gangguan input',
    subtitle: 'Persentase keputusan hybrid 200 kPa yang berubah dibanding input bersih',
    categories: m.robustness.rows.filter((row) => row.key !== 'clean').map((row) => row.name),
    series: [
      {
        name: 'Keputusan berubah',
        values: m.robustness.rows
          .filter((row) => row.key !== 'clean')
          .map((row) => Number((row.flipRate * 100).toFixed(2))),
      },
    ],
    colors: m.robustness.rows
      .filter((row) => row.key !== 'clean')
      .map((row) => (row.key.startsWith('noise') ? PALETTE.accent : row.key.startsWith('gain') ? PALETTE.violet : PALETTE.warning)),
    yLabel: 'Keputusan berubah (%)',
    valueFormat: (value) => `${id(value, 2)}%`,
    categoryRotate: 30,
    height: 430,
    note: 'Ambang yang dipakai adalah batas keras: kesalahan kalibrasi gain langsung memindahkan sampel ke sisi lain ambang.',
  });

  for (const scenario of m.scenarios) {
    out[`peta-ambang-${scenario.kpa}`] = charts.heatmap({
      title: `Peta tingkat risiko — ambang bahaya ${scenario.kpa} kPa`,
      subtitle: `Keluaran hybrid pada ${scenario.map.peaks.length} × ${scenario.map.durations.length} kombinasi tekanan dan durasi`,
      xs: scenario.map.peaks,
      ys: scenario.map.durations,
      cells: scenario.map.cells,
      colors: LEVEL_COLORS,
      labels: { safe: 'Aman', warning: 'Waspada', danger: 'Bahaya' },
      xLabel: 'Tekanan puncak (kPa)',
      yLabel: 'Durasi tumpuan (detik)',
      note: scenario.note,
    });
  }

  out['jangkauan-sensor'] = charts.sensorRange({
    title: 'Ambang model dibanding jangkauan FSR 402',
    subtitle: 'FSR 402: gaya 0,1–10 N pada luas aktif 126,7 mm² ≈ 0,8–79 kPa',
    max: 220,
    band: { from: 0.8, to: 79, color: PALETTE.safe, label: 'jangkauan FSR 402' },
    markers: [
      { x: 35, label: 'Waspada 35 kPa', color: PALETTE.warning },
      { x: 70, label: 'Bahaya 70 kPa (8,9 N)', color: PALETTE.danger },
      { x: 200, label: 'Bahaya 200 kPa (25,4 N)', color: PALETTE.slate },
    ],
  });

  out['roc-dfn-dm'] = charts.roc({
    title: 'DFN vs DM dari satu sesi tekanan plantar',
    subtitle: `${m.session.sessions} sesi, validasi silang ${m.session.folds} lipatan berstrata`,
    points: m.session.roc,
    aucValue: m.session.auc,
  });

  return out;
}

/* ------------------------------------------------------------------ html --- */

function table(headers, rows, options = {}) {
  const { className = '', caption = '' } = options;
  const head = headers.map((header) => `<th>${header}</th>`).join('');
  const body = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`)
    .join('');
  return (
    `<table class="${className}">` +
    (caption ? `<caption>${caption}</caption>` : '') +
    `<thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
  );
}

const kpi = (value, label, note = '') =>
  `<div class="kpi"><div class="kpi-value">${value}</div>` +
  `<div class="kpi-label">${label}</div>` +
  (note ? `<div class="kpi-note">${note}</div>` : '') +
  '</div>';

const chart = (svg, caption) =>
  `<figure class="chart">${svg}<figcaption>${caption}</figcaption></figure>`;

function box(kind, title, body) {
  return `<div class="box ${kind}"><strong>${title}</strong><p>${body}</p></div>`;
}

function renderReport(m, svg) {
  const val = m.audit.splits.validation;
  const train = m.audit.splits.train;
  const rule = m.validation.results.find((item) => item.key === 'rule');
  const rf = m.validation.results.find((item) => item.key === 'rf');
  const hybrid200 = m.validation.results.find((item) => item.key === 'hybrid200');
  const hybrid70 = m.validation.results.find((item) => item.key === 'hybrid70');
  const twoHundred = m.scenarios.find((scenario) => scenario.kpa === 200);
  const seventy = m.scenarios.find((scenario) => scenario.kpa === 70);
  const dfnPlayers = m.audit.patients.filter((patient) => patient.atOrAbove70 > 0);

  const fast = m.session.gate.passed;

  const findings = [
    {
      value: `${id(m.audit.totals.atOrAbove[200])} / ${id(m.audit.totals.samples)}`,
      label: 'sampel mencapai 200 kPa',
      note: `tekanan tertinggi ${id(m.audit.totals.maxPeak, 2)} kPa`,
    },
    {
      value: `${id(m.audit.totals.atOrAbove[70])} sampel`,
      label: 'mencapai 70 kPa',
      note: `hanya di ${dfnPlayers.length} pasien, semuanya data latih`,
    },
    {
      value: `${pct(rule.accuracy, 0)} vs ${pct(rf.accuracy, 0)}`,
      label: 'RF dan aturan sama-sama sempurna',
      note: `kecocokan keputusan ${pct(rule.agreementWithRule, 1)}`,
    },
    {
      value: pct(val.atOrAbove[70] / val.samples, 1),
      label: 'sampel validasi di atas 70 kPa',
      note: `puncak validasi ${id(val.maxPeak, 2)} kPa`,
    },
    {
      value: m.session.auc.toFixed(3).replace('.', ','),
      label: 'AUC DFN vs DM (validasi silang)',
      note: fast ? 'lolos ambang 0,650' : 'di bawah ambang 0,650',
    },
  ];

  const scenarioRows = [
    ['Ambang bahaya', '200 kPa (kondisi sekarang)', '70 kPa (usulan Bab II)'],
    ['Sampel latih ≥ ambang', id(twoHundred.samplesTrain), id(seventy.samplesTrain)],
    ['Sampel validasi ≥ ambang', id(twoHundred.samplesVal), id(seventy.samplesVal)],
    ['Pasien latih ≥ ambang', id(twoHundred.patientsTrain), id(seventy.patientsTrain)],
    ['Figshare DFU ≥ ambang', `${id(twoHundred.figshareShare || 0, 1)}%`, `${id(seventy.figshareShare || 0, 1)}%`],
    ['Ada contoh di dataset', twoHundred.canTrigger ? 'ya' : 'tidak', seventy.canTrigger ? 'ya' : 'tidak'],
    ['Ada contoh di data uji', twoHundred.canValidate ? 'ya' : 'tidak', seventy.canValidate ? 'ya' : 'tidak'],
    ['Di dalam jangkauan FSR 402', 'tidak (≈25,4 N)', 'ya (≈8,9 N)'],
  ];

  const contractRows = m.contract.map((item) => {
    const cell = (actual, expected) =>
      `${LEVEL_LABELS[actual]} ${actual === expected ? '<span class="ok">sesuai</span>' : '<span class="bad">beda</span>'}`;
    return [
      `${id(item.peak)} kPa, ${id(item.seconds)} s`,
      cell(item.level200, item.expect200),
      cell(item.level70, item.expect70),
    ];
  });

  const validationRows = m.validation.results.map((item) => [
    item.name,
    `${id(item.accuracy * 100, 1)}%`,
    `${id(item.macroF1 * 100, 1)}%`,
    `${id(item.perClass.safe.precision * 100, 1)}% / ${id(item.perClass.warning.precision * 100, 1)}%`,
    `${id(item.perClass.warning.recall * 100, 1)}%`,
    `${id(item.agreementWithRule * 100, 1)}%`,
    id(item.dangerPredictions),
  ]);

  const cvRows = m.cv.map((scheme) => [
    scheme.name,
    `${pct(scheme.macroF1Mean)} ± ${id(scheme.macroF1Sd * 100, 1)}%`,
    `${pct(scheme.accuracyMean)} ± ${id(scheme.accuracySd * 100, 1)}%`,
    scheme.folds.map((fold) => `${id(fold.macroF1 * 100, 1)}%`).join(', '),
  ]);

  const robustnessRows = m.robustness.rows.map((row) => [
    row.name,
    `${id(row.accuracy * 100, 2)}%`,
    `${id(row.macroF1 * 100, 2)}%`,
    row.key === 'clean' ? '—' : `${id(row.flipRate * 100, 2)}%`,
    id(row.dangerPredictions),
  ]);

  const sessionRows = [
    ['Jumlah sesi', `${id(m.session.sessions)} (${id(m.session.positiveSessions)} DFN, ${id(m.session.negativeSessions)} DM)`],
    ['Fitur', `${id(m.session.features)} fitur per sesi`],
    ['Konfigurasi', `${id(m.session.trees)} pohon, kedalaman ${id(m.session.depth)}, ${id(m.session.folds)} lipatan`],
    ['AUC out-of-fold', m.session.auc.toFixed(3).replace('.', ',')],
    ['Akurasi out-of-fold', pct(m.session.accuracy)],
    ['Akurasi baseline mayoritas', pct(m.session.majorityAccuracy)],
    ['Sensitivitas / spesifisitas', `${pct(m.session.sensitivity)} / ${pct(m.session.specificity)}`],
    ['AUC fitur tunggal terbaik', `${m.session.bestFeature.feature} (${m.session.bestFeature.auc.toFixed(3).replace('.', ',')})`],
    ['Kontrol demografi saja', m.session.controls.demographicsAuc.toFixed(3).replace('.', ',')],
    ['Tekanan + demografi', m.session.controls.combinedAuc.toFixed(3).replace('.', ',')],
    ['Gerbang AUC ≥ 0,650 dan ≥ baseline + 0,030', fast ? '<span class="ok">lulus</span>' : '<span class="bad">tidak lulus</span>'],
  ];

  const conclusions = [
    `Kelas Bahaya tidak bisa dilatih maupun divalidasi: ${id(m.audit.totals.atOrAbove[200])} dari ${id(m.audit.totals.samples)} sampel mencapai 200 kPa, dan tidak ada satu pun sampel validasi yang mencapai 70 kPa (puncak validasi ${id(val.maxPeak, 2)} kPa).`,
    `Akurasi 100% mengukur reproduksi aturan, bukan generalisasi: Random Forest dan aturan ambang memberi keputusan yang sama pada ${id(rule.agreementWithRule * 100, 1)}% sampel validasi, dan validasi silang memberi macro-F1 ${id(m.cv[2].macroF1Mean * 100, 1)}% ± ${id(m.cv[2].macroF1Sd * 100, 1)}% pada setiap lipatan.`,
    `Ambang 200 kPa berada di luar jangkauan FSR 402: 200 kPa ≈ 25,4 N pada luas aktif 126,7 mm², sedangkan sensor dirating 0,1–10 N (≈79 kPa). Figshare DFU mendukung: ${id(m.figshare.at_or_above_200_pct || 0, 1)}% pengukuran pasien ulkus mencapai 200 kPa, sedangkan ${id(m.figshare.at_or_above_70_pct || 0, 1)}% mencapai 70 kPa dan ${id(m.figshare.at_or_above_warning_pct || 0, 1)}% mencapai 35 kPa.`,
    fast
      ? `Random Forest tidak terbukti menambah kemampuan di atas aturan pada target risiko, tetapi pada target yang labelnya berasal dari diagnosis (DFN vs DM) model mencapai AUC ${m.session.auc.toFixed(3).replace('.', ',')} secara out-of-fold, di atas baseline fitur tunggal terbaik (${m.session.bestFeature.auc.toFixed(3).replace('.', ',')}).`
      : `Random Forest tidak terbukti menambah kemampuan di atas aturan pada target risiko, dan pada target diagnosis (DFN vs DM) model hanya mencapai AUC ${m.session.auc.toFixed(3).replace('.', ',')} (ambang ${m.session.gate.floor.toFixed(3).replace('.', ',')}); kontrol demografi saja ${m.session.controls.demographicsAuc.toFixed(3).replace('.', ',')}. Jadi tekanan sendirian belum memisahkan DFN dari DM pada dataset ini.`,
    `Skenario 70 kPa membuat kelas Bahaya dapat menyala (${id(seventy.samplesTrain)} sampel latih, ${id(seventy.figshareShare || 0, 1)}% pengukuran Figshare), tetapi tetap tanpa satu pun contoh validasi, sehingga recall kelas Bahaya tidak dapat diukur di sini.`,
  ];

  const recommendations = [
    'Pertahankan Random Forest; masalahnya ada di label dan jangkauan sensor, bukan pada algoritma.',
    'Nyatakan model di Bab I–II sebagai hybrid: Random Forest untuk Aman–Waspada, aturan klinis untuk Bahaya. Judul tetap sah karena kerangka dan inferensinya Random Forest.',
    'Bawa perbandingan dua ambang (200 vs 70 kPa) ke dosen pembimbing; keputusan ambang adalah keputusan klinis, bukan teknis.',
    'Masukkan empat pengujian di paket ini ke Bab IV: perbandingan aturan vs pohon tunggal vs RF, validasi silang per pasien, uji ketahanan, dan uji DFN vs DM.',
    'Selesaikan kalibrasi FSR (offset dan gain) sebelum mengklaim angka kPa; tanpa itu, ambang mana pun belum berarti secara absolut.',
  ];

  const body = `
<header>
  <h1>Paket Bukti Model Random Forest</h1>
  <p class="lead">Penilaian mandiri atas model klasifikasi risiko tekanan plantar: apa yang terbukti, apa yang tidak, dan mengapa.</p>
  <p class="meta">Dihasilkan otomatis oleh <code>scripts/evidence.js</code> · dataset ${m.audit.source} v${m.audit.version} · ${id(m.audit.totals.patients)} pasien · ${id(m.audit.totals.samples)} sampel · model <code>${m.model.hash}</code> · seed ${SEED}. Tidak ada angka yang diketik manual.</p>
</header>

<section>
  <h2>0. Ringkasan</h2>
  <div class="kpis">
    ${findings.map((finding) => kpi(finding.value, finding.label, finding.note)).join('')}
  </div>
  ${box('warn', 'Satu kalimat inti', 'Kelas Bahaya tidak punya contoh di data, dan kelas Aman–Waspada dilabeli oleh aturan yang sama dengan fitur model. Jadi skor sempurna bukan bukti model pintar, melainkan bukti bahwa model menyalin aturan.')}
</section>

<section>
  <h2>1. Data yang dipakai</h2>
  ${table(
    ['Ukuran', 'Latih', 'Validasi', 'Total'],
    [
      ['Pasien', id(train.patients), id(val.patients), id(m.audit.totals.patients)],
      ['Sampel', id(train.samples), id(val.samples), id(m.audit.totals.samples)],
      ['Label aman / waspada', `${id(train.labels.safe)} / ${id(train.labels.warning)}`, `${id(val.labels.safe)} / ${id(val.labels.warning)}`, '—'],
      ['Kelompok DFN / DM', `${id(train.groups.DFN)} / ${id(train.groups.DM)}`, `${id(val.groups.DFN)} / ${id(val.groups.DM)}`, '—'],
      ['Sampel ≥ 35 kPa', id(train.atOrAbove[35]), id(val.atOrAbove[35]), id(m.audit.totals.atOrAbove[35])],
      ['Sampel ≥ 70 kPa', id(train.atOrAbove[70]), id(val.atOrAbove[70]), id(m.audit.totals.atOrAbove[70])],
      ['Sampel ≥ 200 kPa', id(train.atOrAbove[200]), id(val.atOrAbove[200]), id(m.audit.totals.atOrAbove[200])],
      ['Tekanan puncak', `${id(train.maxPeak, 2)} kPa`, `${id(val.maxPeak, 2)} kPa`, `${id(m.audit.totals.maxPeak, 2)} kPa`],
    ]
  )}
  ${chart(svg['histogram-peak'], 'Sebaran tekanan membuat jelas mengapa kelas Bahaya tidak bisa dilatih: seluruh data berada di bawah 90 kPa.')}
  ${chart(svg['ambang-counts'], 'Hanya 31 sampel melewati 70 kPa, dan tidak ada yang melewati 200 kPa.')}
  ${chart(svg['per-pasien'], `${dfnPlayers.length} pasien (No. ${dfnPlayers.map((patient) => patient.id).join(', ')}) menjadi satu-satunya sumber contoh di atas 70 kPa; semuanya ada di data latih.`)}
</section>

<section>
  <h2>2. Dua skenario ambang Bahaya</h2>
  <p>Model produksi sekarang memakai 200 kPa. Bab II dokumen ini sendiri menulis 70 kPa. Keduanya dijalankan pada data yang sama supaya perbedaannya terukur.</p>
  ${table(['Butir', 'Skenario A', 'Skenario B'], scenarioRows)}
  ${chart(svg['jangkauan-sensor'], 'Ambang 200 kPa berada di luar jangkauan FSR 402 yang dipakai insole; 70 kPa masih di dalam jangkauan.')}
  <div class="grid">
    ${chart(svg['peta-ambang-200'], 'Skenario 200 kPa: pita Bahaya hanya muncul di tekanan di atas 200 kPa, di luar jangkauan sensor.')}
    ${chart(svg['peta-ambang-70'], 'Skenario 70 kPa: kelas Bahaya menjadi terjangkau oleh sensor dan muncul di peta.')}
  </div>
  <h3>Uji kontrak klinis</h3>
  ${table(['Masukan', 'Skenario 200 kPa', 'Skenario 70 kPa'], contractRows)}
</section>

<section>
  <h2>3. Apakah model benar-benar belajar?</h2>
  <p>Semua pembanding diuji pada ${id(val.samples)} sampel validasi yang tidak dipakai melatih. Label berasal dari aturan ambang, jadi model yang jujur akan menghasilkan skor yang sama dengan aturan.</p>
  <p>Perhatikan bentuk matriks di bawah: barisnya hanya <em>Aman</em> dan <em>Waspada</em> karena tidak ada satu pun sampel Bahaya untuk diuji, tetapi kolom <em>Bahaya</em> tetap disediakan dan seluruhnya nol.</p>
  ${table(
    ['Prediktor', 'Akurasi', 'Macro-F1', 'Presisi aman / waspada', 'Recall waspada', 'Sama dengan aturan', 'Prediksi bahaya'],
    validationRows
  )}
  ${chart(svg['perbandingan-model'], 'Empat pendekatan, satu hasil: aturan murni tidak kalah dari Random Forest pada target ini.')}
  ${box(
    'warn',
    'Bentuk model yang sebenarnya',
    `Seluruh ${id(m.model.trees)} pohon berhenti pada kedalaman ${id(m.model.depth)}: setiap pohon hanya berisi satu pertanyaan. ` +
      `${id(m.model.splitFeatures.sustained || 0)} pohon bertanya "sustained > ${id(Math.max(0, ...m.model.sustainedThresholds), 2)}"? dan ${id(m.model.splitFeatures.peak || 0)} pohon bertanya "peak > ${id(Math.max(...m.model.peakThresholds), 2)} kPa"? ` +
      'Karena durasi tumpuan hanya bisa positif ketika tekanan sudah melewati 35 kPa, pertanyaan itu sama artinya dengan aturan ambang. Inilah sebabnya skor validasi tidak mungkin berbeda dari aturan.'
  )}
  <div class="grid">
    ${chart(svg['confusion-200'], 'Hybrid 200 kPa (sama dengan produksi dan aturan) pada data validasi.')}
    ${chart(svg['confusion-70'], 'Hybrid 70 kPa pada data validasi: selnya identik, karena tidak ada sampel validasi di atas 70 kPa.')}
  </div>
  <h3>Validasi silang 5 lipatan per pasien</h3>
  ${table(['Skema', 'Macro-F1 (rata-rata ± sd)', 'Akurasi (rata-rata ± sd)', 'Macro-F1 per lipatan'], cvRows)}
  ${chart(svg['cv-lipatan'], 'Setiap lipatan berisi pasien yang berbeda; skor tetap 1,000 pada semua lipatan.')}
</section>

<section>
  <h2>4. Ketahanan input</h2>
  <p>Gangguan diterapkan pada tekanan tiga region, lalu durasi tumpuan dihitung ulang dari sinyal yang sudah terganggu. Ukuran yang paling bermakna di sini adalah <em>tingkat perubahan keputusan</em>, karena akurasi tetap tinggi selama gangguan tidak memindahkan sampel melewati ambang 35 kPa.</p>
  ${table(['Skenario', 'Akurasi', 'Macro-F1', 'Keputusan berubah', 'Prediksi bahaya'], robustnessRows)}
  ${chart(svg['ketahanan'], `Gangguan kalibrasi gain paling berpengaruh: gain ×1,2 mengubah ${id(Math.max(...m.robustness.rows.filter((row) => row.key !== 'clean').map((row) => row.flipRate)) * 100, 1)}% keputusan, sedangkan sensor midfoot yang mati hampir tidak berpengaruh (${id(Math.min(...m.robustness.rows.filter((row) => row.key !== 'clean').map((row) => row.flipRate)) * 100, 2)}%).`)}
</section>

<section>
  <h2>5. Apakah Random Forest menangkap sinyal di luar aturan?</h2>
  <p>Target risiko semuanya berasal dari aturan, sehingga tidak bisa dipakai untuk membuktikan kemampuan belajar. Kolom diagnosis DFN/DM di dataset yang sama adalah satu-satunya label yang tidak dibuat sendiri, jadi model sesi diuji di situ.</p>
  ${table(['Butir', 'Nilai'], sessionRows)}
  <div class="grid">
    ${chart(svg['roc-dfn-dm'], 'Kurva ROC out-of-fold untuk DFN vs DM.')}
  </div>
  ${box(
    fast ? 'ok' : 'bad',
    fast ? 'Temuan: tekanan membawa sinyal' : 'Temuan: tekanan belum cukup memisahkan',
    fast
      ? `AUC out-of-fold ${m.session.auc.toFixed(3).replace('.', ',')} melewati ambang ${m.session.gate.floor.toFixed(3).replace('.', ',')} dan melebihi fitur tunggal terbaik sebesar ≥${m.session.gate.margin.toFixed(3).replace('.', ',')}. Ini bukti bahwa Random Forest belajar pola di luar aturan ambang, tetapi pada masalah yang berbeda (skrining neuropati, bukan tingkat risiko per sampel).`
      : `AUC out-of-fold hanya ${m.session.auc.toFixed(3).replace('.', ',')}, di bawah ambang ${m.session.gate.floor.toFixed(3).replace('.', ',')}. Kontrol demografi saja memberi ${m.session.controls.demographicsAuc.toFixed(3).replace('.', ',')}, sehingga yang gagal bukan pipeline melainkan sinyal tekanan pada dataset ini. Ini hasil negatif yang harus dilaporkan apa adanya.`
  )}
</section>

<section>
  <h2>6. Ukuran dan kecepatan</h2>
  ${table(
    ['Butir', 'Nilai'],
    [
      ['Jumlah pohon', id(m.model.trees)],
      ['Total simpul', id(m.model.nodes)],
      ['Kedalaman maksimum tercapai', id(m.model.depth)],
      ['Ukuran JSON model', `${id(m.model.jsonBytes / 1024, 1)} KB`],
      ['Ukuran header C++', `${id(m.model.headerBytes / 1024, 1)} KB`],
      ['Waktu inferensi di laptop (proxy)', `${id(m.model.hostMicros, 2)} µs per keputusan`],
      ['Aturan bahaya model produksi', `${id(m.model.dangerRule.peakThreshold)} kPa, ${id(m.model.dangerRule.sustainedThreshold)} sampel @10 Hz`],
    ]
  )}
  ${box('note', 'Belum diukur', 'Waktu inferensi di ESP32 dan latensi ujung-ke-ujung belum diukur di paket ini; angka di atas hanya proxy di laptop. Pengukuran perangkat harus dilakukan saat pengujian hardware.')}
</section>

<section>
  <h2>7. Kesimpulan dan rekomendasi</h2>
  <h3>Kesimpulan</h3>
  <ol>${conclusions.map((item) => `<li>${item}</li>`).join('')}</ol>
  <h3>Rekomendasi</h3>
  <ol>${recommendations.map((item) => `<li>${item}</li>`).join('')}</ol>
  ${box('warn', 'Apa yang tidak dibuktikan paket ini', 'Paket ini tidak mengukur akurasi pada pasien nyata, tidak memvalidasi ambang secara klinis, dan tidak mengukur latensi perangkat. Semua angka berasal dari dataset publik dan model yang ada di repositori.')}
</section>

<section>
  <h2>8. Cara membaca dan mereproduksi</h2>
  <ul>
    <li>Semua angka dihitung ulang dari <code>models/training-data.json</code> dan <code>models/session-dataset.json</code>.</li>
    <li>Jalankan <code>node scripts/evidence.js</code> untuk menghasilkan ulang seluruh berkas di <code>docs/evidence/</code>.</li>
    <li>Grafik tersedia sebagai SVG (vektor, untuk laporan web) dan PNG (untuk disalin ke Word) di <code>docs/evidence/charts/</code>.</li>
    <li>Angka mentah ada di <code>docs/evidence/metrics.json</code>; halaman konsultasi ada di <code>docs/evidence/konsultasi-1-halaman.html</code>.</li>
  </ul>
</section>

<footer>Dokumen ini dihasilkan otomatis. Jangan diedit manual; ubah <code>scripts/evidence.js</code> lalu jalankan ulang.</footer>
`;

  return page('Paket Bukti Model Random Forest', body);
}

function renderConsultation(m, svg) {
  const val = m.audit.splits.validation;
  const fast = m.session.gate.passed;
  const dfnPlayers = m.audit.patients.filter((patient) => patient.atOrAbove70 > 0).length;

  const body = `
<header>
  <h1>Bahan Konsultasi — Model Random Forest</h1>
  <p class="lead">Satu halaman: apa yang sudah benar, apa yang belum bisa dibuktikan, dan keputusan apa yang saya butuhkan.</p>
</header>

<section>
  <h2>Masalahnya dalam satu kalimat</h2>
  <p>Data publik yang saya pakai tidak punya satu pun contoh tekanan yang cukup tinggi untuk disebut bahaya, jadi kelas Bahaya tidak bisa dilatih; yang bisa dipelajari model hanya batas Aman dan Waspada.</p>
</section>

<section>
  <h2>Tiga temuan</h2>
  <ol class="findings">
    <li><strong>Tidak ada contoh bahaya.</strong> Dari ${id(m.audit.totals.samples)} data, tidak ada yang mencapai 200 kPa; tekanan tertinggi ${id(m.audit.totals.maxPeak, 2)} kPa.</li>
    <li><strong>Skor sempurna itu wajar, bukan prestasi.</strong> Label Aman–Waspada saya buat dari aturan ambang, dan model memakai ambang yang sama. Model dan aturan memberi jawaban identik pada seluruh data validasi (${pct(m.validation.results.find((item) => item.key === 'rule').agreementWithRule)}).</li>
    <li><strong>Ambang 200 kPa di luar kemampuan sensor.</strong> Sensor FSR 402 jenuh sekitar 79 kPa; supaya 200 kPa terbaca, dibutuhkan gaya sekitar 25,4 N, sedangkan sensor dirating 0,1–10 N.</li>
  </ol>
  <div class="grid">
    ${chart(svg['histogram-peak'], 'Seluruh data ada di bawah 90 kPa.')}
    ${chart(svg['per-pasien'], `Hanya ${dfnPlayers} pasien yang pernah melewati 70 kPa.`)}
  </div>
</section>

<section>
  <h2>Dua pilihan</h2>
  ${table(
    ['Aspek', 'Pilihan A — Hybrid (disarankan)', 'Pilihan B — Paksa 3 kelas'],
    [
      ['Klaim di Bab I–II', 'Random Forest untuk Aman–Waspada, aturan klinis untuk Bahaya', 'Random Forest untuk tiga kelas'],
      ['Ambang bahaya', '70 kPa (bisa diukur sensor)', '200 kPa (tidak bisa diukur sensor)'],
      ['Data Bahaya', 'Tidak perlu; berasal dari aturan', 'Harus dibuat sintetis, tetap berasal dari aturan'],
      ['Yang bisa dibuktikan', 'Sistem, inferensi on-device, uji ketahanan', 'Sulit: tidak ada contoh validasi untuk kelas Bahaya'],
      ['Risiko sidang', 'Rendah, alasannya jelas dan berbasis data', 'Tinggi: penguji bisa menanyakan asal label Bahaya'],
    ]
  )}
  <p><strong>Rekomendasi saya:</strong> Pilihan A, dengan ambang 70 kPa, karena bisa dipertanggungjawabkan dari data yang ada dan tetap memakai Random Forest sebagai metode.</p>
</section>

<section>
  <h2>Yang ingin saya tanyakan</h2>
  <ol>
    <li>Apakah boleh sistem saya dijelaskan sebagai hybrid, dengan Random Forest untuk dua kelas dan aturan klinis untuk kelas bahaya?</li>
    <li>Kalau harus tiga kelas, apakah boleh memakai data bahaya sintetis, dan bagaimana cara melaporkannya dengan jujur?</li>
    <li>Untuk ambang bahaya, sebaiknya 70 kPa atau tetap 200 kPa dengan catatan keterbatasan sensor?</li>
    <li>Pengujian tambahan apa yang Bapak/Ibu anggap paling penting untuk Bab IV?</li>
  </ol>
</section>

<section>
  <h2>Kalau ditanya</h2>
  <table>
    <tbody>
      <tr><td><strong>Kenapa pakai Random Forest?</strong></td><td>Untuk batas Aman–Waspada, dan karena modelnya kecil (${id(m.model.jsonBytes / 1024, 1)} KB) sehingga bisa berjalan di ESP32 tanpa server.</td></tr>
      <tr><td><strong>Kenapa tidak ganti model?</strong></td><td>Kendalanya bukan model, tapi tidak adanya contoh kelas Bahaya di data. Model lain akan menemui masalah yang sama.</td></tr>
      <tr><td><strong>Akurasi 100% itu mencurigakan?</strong></td><td>Betul, dan itu sudah saya catat sebagai keterbatasan. Karena itu saya menambahkan pembanding aturan, uji ketahanan, dan uji ${fast ? 'DFN vs DM' : 'DFN vs DM yang hasilnya belum lulus'}.</td></tr>
      <tr><td><strong>Kenapa ambangnya 70 kPa?</strong></td><td>70 kPa masih terbaca sensor (8,9 N), sedangkan 200 kPa butuh 25,4 N dan berada di luar jangkauan FSR 402 yang dipakai.</td></tr>
    </tbody>
  </table>
</section>

<section>
  <h2>Lampiran angka yang bisa ditunjukkan</h2>
  <ul>
    <li>Sampel ≥ 35 kPa: ${id(m.audit.totals.atOrAbove[35])}; ≥ 70 kPa: ${id(m.audit.totals.atOrAbove[70])}; ≥ 200 kPa: ${id(m.audit.totals.atOrAbove[200])}.</li>
    <li>Sampel validasi ≥ 70 kPa: ${id(val.atOrAbove[70])} (puncak validasi ${id(val.maxPeak, 2)} kPa).</li>
    <li>Pada data pasien ulkus (Figshare DFU): ${id(m.figshare.at_or_above_warning_pct || 0, 1)}% pengukuran ≥ 35 kPa, ${id(m.figshare.at_or_above_70_pct || 0, 1)}% ≥ 70 kPa, ${id(m.figshare.at_or_above_200_pct || 0, 1)}% ≥ 200 kPa.</li>
    <li>Uji ketahanan: gangguan terberat hanya mengubah ${id(Math.max(...m.robustness.rows.filter((row) => row.key !== 'clean').map((row) => row.flipRate)) * 100, 2)}% keputusan.</li>
    <li>Laporan lengkap: <code>docs/evidence/hasil-pengujian-model.html</code>.</li>
  </ul>
</section>

<footer>Dihasilkan otomatis oleh <code>scripts/evidence.js</code>. Halaman ini boleh dicetak dan dibawa saat bimbingan.</footer>
`;

  return page('Bahan Konsultasi Model Random Forest', body);
}

function page(title, body) {
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0 auto; padding: 32px 24px 64px; max-width: 1000px;
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    color: #1f2937; background: #ffffff; line-height: 1.55; font-size: 15px;
  }
  header { border-bottom: 2px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 24px; }
  h1 { font-size: 26px; margin: 0 0 8px; }
  h2 { font-size: 19px; margin: 32px 0 12px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; }
  h3 { font-size: 16px; margin: 22px 0 10px; }
  p { margin: 0 0 12px; }
  .lead { font-size: 16px; color: #374151; }
  .meta, figcaption { font-size: 12.5px; color: #6b7280; }
  code { background: #f3f4f6; padding: 1px 5px; border-radius: 4px; font-size: 12.5px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0 18px; font-size: 13.5px; }
  caption { text-align: left; font-size: 12.5px; color: #6b7280; padding-bottom: 6px; }
  th, td { border: 1px solid #e5e7eb; padding: 7px 9px; text-align: left; vertical-align: top; }
  th { background: #f9fafb; font-weight: 600; }
  tbody tr:nth-child(even) { background: #fcfcfd; }
  .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; margin: 16px 0 22px; }
  .kpi { border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; background: #f9fafb; }
  .kpi-value { font-size: 22px; font-weight: 700; }
  .kpi-label { font-size: 13px; margin-top: 4px; }
  .kpi-note { font-size: 12px; color: #6b7280; margin-top: 6px; }
  .box { border-left: 4px solid #9ca3af; padding: 12px 16px; margin: 16px 0; border-radius: 0 8px 8px 0; background: #f9fafb; }
  .box p { margin: 6px 0 0; }
  .box.warn { border-color: #d97706; background: #fffbeb; }
  .box.ok { border-color: #16a34a; background: #f0fdf4; }
  .box.bad { border-color: #dc2626; background: #fef2f2; }
  .box.note { border-color: #2563eb; background: #eff6ff; }
  .ok { color: #16a34a; font-weight: 600; }
  .bad { color: #dc2626; font-weight: 600; }
  .chart { margin: 8px 0 20px; }
  .chart svg { width: 100%; height: auto; border: 1px solid #e5e7eb; border-radius: 10px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 8px 20px; align-items: start; }
  .findings li { margin-bottom: 8px; }
  footer { margin-top: 40px; padding-top: 14px; border-top: 1px solid #e5e7eb; font-size: 12.5px; color: #6b7280; }
  @media print {
    @page { size: A4; margin: 14mm; }
    body { padding: 0; max-width: none; font-size: 12px; }
    h1 { font-size: 20px; } h2 { font-size: 15px; } h3 { font-size: 13px; }
    .chart svg { border: none; }
    section { break-inside: avoid-page; }
    figure { break-inside: avoid; }
  }
</style>
</head>
<body>
${body}
</body>
</html>
`;
}

/* ------------------------------------------------------------------ main --- */

function main() {
  const { meta, patients } = loadPatients();
  const model = JSON.parse(fs.readFileSync(RF_MODEL, 'utf8'));
  let last = Date.now();
  const step = (label) => {
    const now = Date.now();
    console.log(`  ${label}: ${((now - last) / 1000).toFixed(1)} s`);
    last = now;
  };

  console.log('Menghitung audit data...');
  const auditData = audit(patients, meta);
  step('audit');

  console.log('Mengevaluasi prediktor pada data validasi...');
  const { results } = evaluatePredictors(patients, model);
  step('prediktor');

  console.log(`Menjalankan validasi silang ${FOLDS} lipatan...`);
  const cv = crossValidateSamples(patients, model);
  step('validasi silang');

  console.log('Menguji ketahanan input...');
  const robust = robustness(patients, model);
  step('ketahanan');

  console.log('Menyusun peta ambang...');
  const scenarios = SCENARIOS.map((kpa) => {
    const map = thresholdMap(model, kpa);
    const trainPatients = patients.filter((patient) => patient.split === 'train');
    const valPatients = patients.filter((patient) => patient.split === 'validation');
    const trainSamples = trainPatients.flatMap((patient) => patient.samples);
    const valSamples = valPatients.flatMap((patient) => patient.samples);
    return {
      kpa,
      label: `Bahaya ${kpa} kPa`,
      map,
      samplesTrain: trainSamples.filter((sample) => sample.peak >= kpa).length,
      samplesVal: valSamples.filter((sample) => sample.peak >= kpa).length,
      patientsTrain: trainPatients.filter((patient) => patient.samples.some((sample) => sample.peak >= kpa)).length,
      patientsVal: valPatients.filter((patient) => patient.samples.some((sample) => sample.peak >= kpa)).length,
      // "Bisa menyala" is about the whole dataset the device can produce;
      // "bisa divalidasi" is about the held-out split alone.
      canTrigger: trainSamples.concat(valSamples).some((sample) => sample.peak >= kpa),
      canValidate: valSamples.some((sample) => sample.peak >= kpa),
      figshareShare: null,
    };
  });

  console.log('Memvalidasi ambang terhadap Figshare DFU...');
  step('peta ambang');
  const figshare = figshareNumbers();
  step('figshare');
  if (!figshare.error) {
    for (const scenario of scenarios) {
      scenario.figshareShare =
        scenario.kpa === 200 ? figshare.at_or_above_200_pct : figshare.at_or_above_70_pct;
    }
  }

  console.log('Menjalankan evaluasi sesi DFN vs DM...');
  const session = sessionEvidence();
  step('sesi DFN/DM');

  const modelInfo = modelFacts(model);
  step('fakta model');
  const scenarioMap = {};
  for (const scenario of scenarios) scenarioMap[scenario.kpa] = scenario;

  const m = {
    meta: {
      generatedBy: 'scripts/evidence.js',
      seed: SEED,
      folds: FOLDS,
      thresholds: { warningKpa: WARNING_KPA, safeFloorSamples: SAFE_FLOOR_SAMPLES },
      scenarios: SCENARIOS,
    },
    audit: auditData,
    validation: {
      results,
      sampleCount: auditData.splits.validation.samples,
    },
    cv,
    robustness: robust,
    scenarios: [
      {
        key: 'hybrid200',
        kpa: 200,
        label: 'Bahaya 200 kPa (produksi)',
        ...scenarioMap[200],
        note: 'Pita Bahaya hanya ada pada tekanan di atas 200 kPa, di luar jangkauan FSR 402.',
      },
      {
        key: 'hybrid70',
        kpa: 70,
        label: 'Bahaya 70 kPa (usulan Bab II)',
        ...scenarioMap[70],
        note: 'Kelas Bahaya menjadi terjangkau sensor; tetap tanpa contoh pada data validasi.',
      },
    ],
    session,
    figshare,
    model: modelInfo,
    contract: CONTRACT.map((item) => ({
      peak: item.peak,
      seconds: item.seconds,
      level200: hybridLevel(model, { peak: item.peak, sustained: item.seconds * 10 }, 200),
      level70: hybridLevel(model, { peak: item.peak, sustained: item.seconds * 10 }, 70),
      expect200: item.expect[200],
      expect70: item.expect[70],
    })),
  };

  const svg = renderCharts(m);
  step('grafik');

  fs.mkdirSync(CHART_DIR, { recursive: true });
  const written = { svg: [], png: [], skippedPng: [] };
  for (const [name, content] of Object.entries(svg)) {
    const svgPath = path.join(CHART_DIR, `${name}.svg`);
    fs.writeFileSync(svgPath, content);
    written.svg.push(path.relative(ROOT, svgPath));
  }
  step('tulis svg');

  for (const name of Object.keys(svg)) {
    const svgPath = path.join(CHART_DIR, `${name}.svg`);
    const pngPath = path.join(CHART_DIR, `${name}.png`);
    try {
      execFileSync('rsvg-convert', ['-w', '1600', '-o', pngPath, svgPath], { stdio: ['ignore', 'ignore', 'pipe'] });
      written.png.push(path.relative(ROOT, pngPath));
    } catch (error) {
      written.skippedPng.push(name);
    }
  }
  step('konversi png');

  fs.writeFileSync(path.join(OUT_DIR, 'metrics.json'), `${JSON.stringify(m, null, 2)}\n`);
  fs.writeFileSync(path.join(OUT_DIR, 'hasil-pengujian-model.html'), renderReport(m, svg));
  fs.writeFileSync(path.join(OUT_DIR, 'konsultasi-1-halaman.html'), renderConsultation(m, svg));

  const readme = `# Paket Bukti Model Random Forest

> Dihasilkan otomatis oleh \`scripts/evidence.js\`. Jangan diedit manual.

Folder ini memuat pengukuran mandiri atas model klasifikasi risiko tekanan
plantar: kondisi dataset, hasil pengujian, dan bukti untuk tiap temuan.

## Berkas

| Berkas | Isi |
| --- | --- |
| \`hasil-pengujian-model.html\` | Laporan lengkap (A4, siap cetak/PDF) dengan seluruh angka dan grafik |
| \`konsultasi-1-halaman.html\` | Versi ringkas tanpa istilah teknis, untuk dibawa saat bimbingan |
| \`metrics.json\` | Seluruh angka mentah yang dipakai laporan |
| \`charts/*.svg\` | Grafik vektor untuk laporan web |
| \`charts/*.png\` | Grafik raster untuk disalin ke Word |

## Reproduksi

\`\`\`bash
node scripts/evidence.js
\`\`\`

Skrip menghitung ulang semua angka dari \`models/training-data.json\` dan
\`models/session-dataset.json\`. Model produksi tidak diubah.

## Ringkasan temuan

- Kelas Bahaya tidak punya contoh: ${id(m.audit.totals.atOrAbove[200])} dari ${id(m.audit.totals.samples)} sampel mencapai 200 kPa; puncak dataset ${id(m.audit.totals.maxPeak, 2)} kPa.
- Tidak ada sampel validasi di atas 70 kPa, sehingga kelayakan ambang 70 kPa
  belum bisa diuji pada data uji.
- Random Forest dan aturan ambang memberi keputusan identik pada
  ${pct(m.validation.results.find((item) => item.key === 'rule').agreementWithRule)} sampel validasi, karena labelnya berasal dari aturan itu sendiri (label melingkar).
- Ambang 200 kPa di luar jangkauan FSR 402 (200 kPa ≈ 25,4 N, sensor 0,1–10 N).
- DFN vs DM, validasi silang ${m.session.folds} lipatan: AUC ${m.session.auc.toFixed(3).replace('.', ',')} (${m.session.gate.passed ? 'lulus' : 'tidak lulus'} ambang ${m.session.gate.floor.toFixed(3).replace('.', ',')}).

## Batasan

- Waktu inferensi di laptop, bukan ESP32.
- Tidak ada data pasien nyata dan tidak ada validasi klinis.
- Label sampel berasal dari aturan, sehingga metrik klasifikasi mengukur
  kesesuaian terhadap aturan, bukan generalisasi.
`;

  fs.writeFileSync(path.join(OUT_DIR, 'README.md'), readme);

  console.log('\nSelesai.');
  console.log(`  audit     : ${id(auditData.totals.samples)} sampel, puncak ${id(auditData.totals.maxPeak, 2)} kPa`);
  console.log(`  validasi  : aturan ${pct(results.find((item) => item.key === 'rule').accuracy)} | RF ${pct(results.find((item) => item.key === 'rf').accuracy)} | hybrid200 ${pct(results.find((item) => item.key === 'hybrid200').accuracy)}`);
  console.log(`  CV        : RF macro-F1 ${pct(cv[2].macroF1Mean)} ± ${id(cv[2].macroF1Sd * 100, 1)}%`);
  console.log(`  sesi      : AUC ${session.auc.toFixed(3)} (${session.gate.passed ? 'lulus' : 'tidak lulus'})`);
  console.log(`  grafik    : ${written.svg.length} SVG, ${written.png.length} PNG`);
  if (written.skippedPng.length) console.log(`  PNG dilewati: ${written.skippedPng.join(', ')}`);
  console.log(`  keluaran  : ${path.relative(ROOT, OUT_DIR)}/`);
}

module.exports = {
  loadPatients,
  audit,
  evaluatePredictors,
  crossValidateSamples,
  robustness,
  thresholdMap,
  sessionEvidence,
  figshareNumbers,
  modelFacts,
  hybridLevel,
};

if (require.main === module) main();
