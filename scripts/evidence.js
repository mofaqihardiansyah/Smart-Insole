#!/usr/bin/env node
/**
 * evidence.js — paket bukti model Random Forest dua kelas.
 *
 * Menjalankan semua pengukuran di memori dari data mentah, lalu menulis laporan,
 * grafik, dan angka ke `docs/evidence/`. Tidak menyentuh model produksi
 * (`models/rf-model.json`), header firmware, atau kode aplikasi.
 *
 * Sejak kontrak 2 kelas (45 kPa), pertanyaan yang dijawab paket ini berubah.
 * Bukan lagi "ambang bahaya mana yang dipilih", melainkan:
 *
 *   1. Apakah model benar-benar belajar, atau hanya menyalin aturan label?
 *   2. Seberapa cepat ia runtuh saat sensor salah kalibrasi?
 *   3. Apakah tekanan membawa sinyal pada label yang tidak dibuat sendiri
 *      (DFN vs DM)?
 *
 * Validasi silang dipanggil dari `scripts/train-model.js`, bukan disalin, supaya
 * angka di laporan dan angka di log pelatihan tidak bisa berbeda protokol.
 *
 * Usage: node scripts/evidence.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { createRng } = require('./lib/forest');
const charts = require('./lib/charts');
const sessionCv = require('./train-session-model');
const trainer = require('./train-model');

const ROOT = path.resolve(__dirname, '..');
const TRAINING_DATA = path.join(ROOT, 'models', 'training-data.json');
const SESSION_DATA = path.join(ROOT, 'models', 'session-dataset.json');
const RF_MODEL = path.join(ROOT, 'models', 'rf-model.json');
const RF_HEADER = path.join(ROOT, 'firmware', 'include', 'rf-model-data.h');
const OUT_DIR = path.join(ROOT, 'docs', 'evidence');
const CHART_DIR = path.join(OUT_DIR, 'charts');

const SEED = trainer.SEED;
const FOLDS = trainer.FOLDS;
const LEVELS = trainer.LEVELS;
const FEATURES = trainer.FEATURES;

// Level dan skor diturunkan persis seperti `randomForestRisk.ts` dan
// `RandomForest.cpp`: kontrak dua arah menentukan level, suara pohon hanya
// menempatkan skor di dalam pita level itu.
const SCORE_BANDS = { safeMax: 47, warningMax: 74 };

const PALETTE = charts.PALETTE;
const LEVEL_COLORS = {
  safe: PALETTE.safe,
  warning: PALETTE.warning,
};
const LEVEL_LABELS = { safe: 'Aman', warning: 'Waspada' };

/* --------------------------------------------------------------- helpers --- */

const id = (value, digits = 0) =>
  Number(value).toLocaleString('id-ID', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const pct = (value, digits = 1) => `${id(value * 100, digits)}%`;

/** Gain factor in the Indonesian report style, e.g. `×0,9`. */
const gainLabel = (factor) => `×${id(factor, 1)}`;

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

function scoreFromVotes(totals, level) {
  const total = totals.safe + totals.warning;
  const proportion = total > 0 ? totals[level] / total : 0;
  if (level === 'warning') {
    return Math.min(
      SCORE_BANDS.warningMax,
      Math.max(SCORE_BANDS.safeMax + 1, Math.round(48 + proportion * 27))
    );
  }
  return Math.min(SCORE_BANDS.safeMax, Math.max(0, Math.round(proportion * 48)));
}

/** Kontrak tingkat, dua arah, sama dengan web dan firmware. */
function contractLevel(sample) {
  return sample.peak >= sample.warningKpa ? 'warning' : 'safe';
}

/** Satu inferensi penuh: level dari kontrak, skor dari suara pohon. */
function infer(model, sample, warningKpa) {
  const clean = {
    peak: Math.max(0, sample.peak),
    sustained: Math.max(0, Math.round(sample.sustained)),
  };
  const level = contractLevel({ ...clean, warningKpa });
  const votes = forestVote(model.trees, clean);
  return { level, score: scoreFromVotes(votes, level), votes };
}

const ruleLevel = (sample, warningKpa) => (sample.peak >= warningKpa ? 'warning' : 'safe');

/* -------------------------------------------------------------- metrics ---- */

function classify(actual, predicted, rowLabels = LEVELS) {
  const matrix = rowLabels.map(() => rowLabels.map(() => 0));
  let correct = 0;
  for (let i = 0; i < actual.length; i += 1) {
    const r = rowLabels.indexOf(actual[i]);
    const c = rowLabels.indexOf(predicted[i]);
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
      if (rr !== r) fn += matrix[r][rr];
    });
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    perClass[label] = { precision, recall, f1, support: tp + fn, tp, fp, fn };
    macroF1 += f1;
  });

  return {
    accuracy: correct / Math.max(1, actual.length),
    macroF1: macroF1 / rowLabels.length,
    perClass,
    matrix,
    rowLabels,
    colLabels: rowLabels,
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
 * The dataset artifact stores the sample label as `level`; the trainer reads
 * `label`. Normalise once here so every consumer sees the same field name.
 */
function normalisePatient(patient) {
  return {
    ...patient,
    samples: patient.samples.map((sample) => ({
      ...sample,
      // The trainer reads `level`; the evidence code reads `label`. Keeping
      // both avoids a silent `undefined` label when the protocol is reused.
      label: sample.level,
    })),
  };
}

function loadPatients() {
  const data = JSON.parse(fs.readFileSync(TRAINING_DATA, 'utf8'));
  return {
    meta: data,
    patients: data.patients.map(normalisePatient),
  };
}

function audit(patients, meta, warningKpa) {
  const allSamples = patients.flatMap((patient) => patient.samples);

  const labels = { safe: 0, warning: 0 };
  const groups = { DFN: 0, DM: 0 };
  for (const patient of patients) groups[patient.group] = (groups[patient.group] || 0) + 1;
  for (const sample of allSamples) labels[sample.label] += 1;

  const atOrAbove = (kpa) => allSamples.filter((sample) => sample.peak >= kpa).length;
  const patientsAtOrAbove = (kpa) =>
    patients.filter((patient) => patient.samples.some((sample) => sample.peak >= kpa)).length;

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
      maxPeak: Math.max(...patient.samples.map((sample) => sample.peak)),
      warningSamples: patient.samples.filter((sample) => sample.label === 'warning').length,
      samples: patient.samples.length,
    }))
    .sort((a, b) => a.maxPeak - b.maxPeak);

  return {
    source: meta.source,
    version: meta.version,
    calibration: meta.calibration,
    labelRule: meta.labelRule,
    features: meta.features,
    warningKpa,
    totals: {
      patients: patients.length,
      samples: allSamples.length,
      labels,
      groups,
      imbalance: labels.warning ? labels.safe / labels.warning : 0,
      atOrAbove: {
        warning: atOrAbove(warningKpa),
        fifty: atOrAbove(50),
        seventy: atOrAbove(70),
      },
      patientsAtOrAbove: {
        warning: patientsAtOrAbove(warningKpa),
        seventy: patientsAtOrAbove(70),
      },
      maxPeak: Math.max(...allSamples.map((sample) => sample.peak)),
      maxSustained: Math.max(...allSamples.map((sample) => sample.sustained)),
    },
    bins,
    patients: patientRows,
  };
}

/* --------------------------------------------------- cross-validation ------- */

function crossValidation(patients, warningKpa) {
  const run = trainer.crossValidate(patients, warningKpa);

  const schemes = run.schemes.map((name, index) => {
    const metrics = trainer.summarise(run.pooled[name]);
    return {
      key: name,
      name,
      accuracy: metrics.accuracy,
      macroF1: metrics.macroF1,
      perLevel: metrics.perLevel,
      folds: run.perFold[index].map((fold, foldIndex) => ({
        fold: foldIndex + 1,
        patients: run.foldLog[foldIndex].patients,
        samples: run.foldLog[foldIndex].samples,
        accuracy: fold.accuracy,
        macroF1: fold.macroF1,
        recallWarning: fold.perLevel.warning.recall,
      })),
    };
  });

  const gain = trainer.GAINS.map((factor) => {
    const row = { gain: factor, schemes: {} };
    for (const name of run.schemes) {
      const metrics = trainer.summarise(run.gainPairs[factor][name]);
      row.schemes[name] = {
        macroF1: metrics.macroF1,
        falsePositives: metrics.perLevel.warning.fp,
        falseNegatives: metrics.perLevel.warning.fn,
      };
    }
    return row;
  });

  const shippedPairs = run.pooled['RF + SMOTE'].map(({ actual, predicted }) => ({
    actual,
    predicted,
  }));
  const confusion = classify(
    shippedPairs.map((pair) => pair.actual),
    shippedPairs.map((pair) => pair.predicted)
  );

  return {
    schemes,
    gain,
    confusion,
    folds: run.foldLog.map((entry) => ({
      fold: entry.fold,
      patients: entry.patients,
      samples: entry.samples,
      warningSamples: entry.warningSamples,
      trainSamples: entry.trainSamples,
      trainWarning: entry.trainWarning,
      smote: entry.smote,
    })),
  };
}

/* ------------------------------------------------------------ robustness --- */

function perturbPatient(patient, transform, warningKpa) {
  let run = 0;
  return patient.samples.map((sample) => {
    let [f, m, h] = [sample.forefoot, sample.midfoot, sample.heel];
    [f, m, h] = transform(f, m, h);
    const peak = Math.max(0, f, m, h);
    run = peak >= warningKpa ? run + 1 : 0;
    return { peak, sustained: run, label: sample.label };
  });
}

function robustness(patients, model, warningKpa) {
  const rng = createRng(SEED);

  const scenarios = [
    { key: 'clean', name: 'Bersih (hitung ulang)', transform: (f, m, h) => [f, m, h] },
    ...[0.05, 0.1, 0.2].map((sigma) => ({
      key: `noise${Math.round(sigma * 100)}`,
      name: `Noise ${Math.round(sigma * 100)}%`,
      transform: (f, m, h) => [f, m, h].map((value) => Math.max(0, value * (1 + gaussian(rng) * sigma))),
    })),
    ...[0.9, 1.0, 1.1, 1.2].map((factor) => ({
      key: `gain${Math.round(factor * 100)}`,
      name: `Gain ${gainLabel(factor)}`,
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

  let cleanLevels = [];
  const rows = scenarios.map((scenario) => {
    const actual = [];
    const levels = [];
    for (const patient of patients) {
      for (const sample of perturbPatient(patient, scenario.transform, warningKpa)) {
        actual.push(sample.label);
        levels.push(infer(model, sample, warningKpa).level);
      }
    }
    if (scenario.key === 'clean') cleanLevels = levels;
    const metrics = classify(actual, levels);
    let flips = 0;
    if (scenario.key !== 'clean' && cleanLevels.length === levels.length) {
      for (let i = 0; i < levels.length; i += 1) if (levels[i] !== cleanLevels[i]) flips += 1;
    }
    return {
      key: scenario.key,
      name: scenario.name,
      accuracy: metrics.accuracy,
      macroF1: metrics.macroF1,
      flipRate: scenario.key === 'clean' ? 0 : flips / Math.max(1, levels.length),
      warningCount: levels.filter((level) => level === 'warning').length,
    };
  });

  return { rows, samples: cleanLevels.length };
}

/* ----------------------------------------------------- contract & score ---- */

function contractCases(model, warningKpa) {
  const cases = [
    { peak: 20, seconds: 0, expected: 'safe' },
    { peak: 40, seconds: 3, expected: 'safe' },
    { peak: 44.9, seconds: 12, expected: 'safe' },
    { peak: warningKpa, seconds: 1, expected: 'warning' },
    { peak: 60, seconds: 5, expected: 'warning' },
    { peak: 80, seconds: 2, expected: 'warning' },
    { peak: 210, seconds: 45, expected: 'warning' },
    { peak: 500, seconds: 60, expected: 'warning' },
  ];

  return cases.map((item) => {
    const verdict = infer(model, { peak: item.peak, sustained: item.seconds * 10 }, warningKpa);
    return {
      peak: item.peak,
      seconds: item.seconds,
      expected: item.expected,
      level: verdict.level,
      score: verdict.score,
      pass: verdict.level === item.expected &&
        (verdict.level === 'warning'
          ? verdict.score > SCORE_BANDS.safeMax && verdict.score <= SCORE_BANDS.warningMax
          : verdict.score >= 0 && verdict.score <= SCORE_BANDS.safeMax),
    };
  });
}

function scoreMap(model, warningKpa) {
  const peaks = [];
  for (let value = 0; value <= 220; value += 4) peaks.push(value);
  const durations = [];
  for (let value = 0; value <= 60; value += 4) durations.push(value);

  const levels = durations.map((seconds) =>
    peaks.map((peak) => infer(model, { peak, sustained: seconds * 10 }, warningKpa).level)
  );
  const scores = durations.map((seconds) =>
    peaks.map((peak) => infer(model, { peak, sustained: seconds * 10 }, warningKpa).score)
  );
  return { peaks, durations, levels, scores };
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

function figshareNumbers(warningKpa) {
  // The validator owns the parser; the threshold is a parameter so the 70 kPa
  // reference can be asked for without a second copy of the parsing code.
  const script = [
    'import importlib.util, json',
    'spec = importlib.util.spec_from_file_location("validator", "scripts/validate-datasets.py")',
    'module = importlib.util.module_from_spec(spec)',
    'spec.loader.exec_module(module)',
    `base = module.check_figshare(${warningKpa})`,
    'seventy = module.check_figshare(70.0)',
    'result = dict(base or {})',
    'result["at_or_above_70_pct"] = (seventy or {}).get("at_or_above_warning_pct")',
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

function modelFacts(model, warningKpa) {
  const nodes = model.trees.reduce((sum, tree) => sum + countNodes(tree), 0);
  const depth = Math.max(...model.trees.map((tree) => treeDepth(tree)));

  const sample = { peak: 52.5, sustained: 40 };
  const iterations = 20000;
  for (let i = 0; i < 500; i += 1) infer(model, sample, warningKpa);
  const start = process.hrtime.bigint();
  for (let i = 0; i < iterations; i += 1) infer(model, sample, warningKpa);
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
    levels: model.levels,
    trees: model.trees.length,
    nodes,
    depth,
    splitFeatures,
    peakThresholds,
    sustainedThresholds,
    jsonBytes: fs.statSync(RF_MODEL).size,
    headerBytes: fs.statSync(RF_HEADER).size,
    hostMicros: perCall / 1000,
    warningKpa,
    hash: sha256(fs.readFileSync(RF_MODEL)),
  };
}

/* --------------------------------------------------------------- charts ---- */

function renderCharts(m) {
  const out = {};
  const warningKpa = m.audit.warningKpa;

  out['histogram-peak'] = charts.histogram({
    title: 'Distribusi tekanan puncak seluruh dataset',
    subtitle: `${id(m.audit.totals.samples)} sampel dari ${m.audit.totals.patients} pasien DFN-DS v${m.audit.version}`,
    bins: m.audit.bins,
    yLog: true,
    xLabel: 'Tekanan puncak (kPa)',
    yLabel: 'Jumlah sampel (skala log)',
    markers: [
      { x: warningKpa, label: `ambang label ${warningKpa} kPa`, color: PALETTE.warning },
      { x: 70, label: '70 kPa (acuan keparahan)', color: PALETTE.slate },
    ],
    note: `Tekanan tertinggi ${id(m.audit.totals.maxPeak, 2)} kPa; tidak ada sampel di atas 90 kPa.`,
  });

  out['ambang-counts'] = charts.bars({
    title: 'Berapa sampel yang mencapai tiap ambang',
    subtitle: 'Skala log, supaya angka kecil tetap terbaca',
    categories: [`≥ ${warningKpa} kPa`, '≥ 50 kPa', '≥ 70 kPa'],
    series: [
      {
        name: 'sampel',
        values: [
          m.audit.totals.atOrAbove.warning,
          m.audit.totals.atOrAbove.fifty,
          m.audit.totals.atOrAbove.seventy,
        ],
      },
    ],
    colors: [PALETTE.warning, PALETTE.accent, PALETTE.slate],
    log: true,
    yLabel: 'Jumlah sampel',
    valueFormat: (value) => id(value),
    note: `Ambang ${warningKpa} kPa menandai ${m.audit.totals.patientsAtOrAbove.warning} dari ${m.audit.totals.patients} pasien.`,
  });

  out['per-pasien'] = charts.dotPlot({
    title: 'Tekanan puncak tiap pasien',
    subtitle: 'Satu titik = satu pasien, diurutkan dari terendah',
    points: m.audit.patients.map((patient, index) => ({
      x: index,
      y: patient.maxPeak,
      group: patient.group,
    })),
    groups: { DFN: PALETTE.violet, DM: PALETTE.accent },
    markers: [
      { y: warningKpa, label: `ambang label ${warningKpa} kPa`, color: PALETTE.warning },
      { y: 70, label: '70 kPa', color: PALETTE.slate },
    ],
    yMax: 95,
    note: `${m.audit.totals.patients - m.audit.totals.patientsAtOrAbove.warning} pasien tidak pernah melewati ${warningKpa} kPa.`,
  });

  out.confusion = charts.confusion({
    title: 'Matriks konfusi — RF + SMOTE, out-of-fold',
    subtitle: `${id(m.cv.confusion.perClass.safe.support + m.cv.confusion.perClass.warning.support)} sampel uji dari ${FOLDS} lipatan`,
    matrix: m.cv.confusion.matrix,
    rowLabels: LEVELS.map((label) => LEVEL_LABELS[label]),
    colLabels: LEVELS.map((label) => LEVEL_LABELS[label]),
  });

  out['cv-skema'] = charts.bars({
    title: 'Tiga skema pada lipatan yang sama',
    subtitle: 'Macro-F1 out-of-fold; label berasal dari aturan ambang',
    categories: m.cv.schemes.map((scheme) => scheme.name),
    series: [
      {
        name: 'Macro-F1',
        values: m.cv.schemes.map((scheme) => Number((scheme.macroF1 * 100).toFixed(2))),
      },
    ],
    colors: [PALETTE.slate, PALETTE.violet, PALETTE.accent],
    yLabel: 'Macro-F1 (%)',
    valueFormat: (value) => `${id(value, 2)}%`,
    categoryRotate: 15,
    note: 'Semua bar sama tinggi: tidak ada skema yang lebih baik dari aturan pada target ini.',
  });

  out['cv-lipatan'] = charts.strip({
    title: 'Macro-F1 per lipatan',
    subtitle: `${FOLDS} lipatan berkelompok per pasien; satu lingkaran = satu lipatan`,
    rows: m.cv.schemes.map((scheme, index) => ({
      name: scheme.name,
      color: [PALETTE.slate, PALETTE.violet, PALETTE.accent][index],
      values: scheme.folds.map((fold) => fold.macroF1),
    })),
    yDomain: [0.9, 1.005],
    xLabel: 'Macro-F1',
    valueFormat: (value) => value.toFixed(3).replace('.', ','),
    note: 'Kelima lipatan bernilai sama, jadi titiknya ditumpuk vertikal di 1,000.',
  });

  out['gain-error'] = charts.bars({
    title: 'Galat penguatan sensor',
    subtitle: 'Macro-F1 terhadap label asli setelah seluruh deret digeser',
    categories: m.cv.gain.map((row) => gainLabel(row.gain)),
    series: m.cv.schemes.map((scheme) => ({
      name: scheme.name,
      values: m.cv.gain.map((row) => Number((row.schemes[scheme.key].macroF1 * 100).toFixed(1))),
    })),
    colors: [PALETTE.slate, PALETTE.violet, PALETTE.accent],
    yLabel: 'Macro-F1 (%)',
    valueFormat: (value) => `${id(value, 1)}%`,
    height: 420,
    note: 'Kurva berbentuk lonceng: hanya gain tepat 1,0 yang lolos sempurna.',
  });

  out.ketahanan = charts.bars({
    title: 'Keputusan yang berubah saat input terganggu',
    subtitle: `Persentase keputusan berbeda dibanding input bersih (kontrak ${warningKpa} kPa)`,
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
    note: 'Ambang adalah batas keras: kesalahan gain langsung memindahkan sampel ke sisi lain ambang.',
  });

  out['peta-kontrak'] = charts.heatmap({
    title: `Peta tingkat risiko — kontrak ${warningKpa} kPa`,
    subtitle: `Keluaran pada ${m.scoreMap.peaks.length} × ${m.scoreMap.durations.length} kombinasi tekanan dan durasi`,
    xs: m.scoreMap.peaks,
    ys: m.scoreMap.durations,
    cells: m.scoreMap.levels,
    colors: LEVEL_COLORS,
    labels: LEVEL_LABELS,
    xLabel: 'Tekanan puncak (kPa)',
    yLabel: 'Durasi tumpuan (detik)',
    note: 'Batasnya garis vertikal di 45 kPa: durasi tidak mengubah tingkat sama sekali.',
  });

  out['jangkauan-sensor'] = charts.sensorRange({
    title: 'Ambang model dibanding jangkauan FSR 402',
    subtitle: 'FSR 402: gaya 0,1–10 N pada luas aktif 126,7 mm² ≈ 0,8–79 kPa',
    max: 220,
    band: { from: 0.8, to: 79, color: PALETTE.safe, label: 'jangkauan FSR 402' },
    markers: [
      { x: warningKpa, label: `Waspada ${warningKpa} kPa (≈5,7 N)`, color: PALETTE.warning },
      { x: 200, label: '200 kPa (≈25,4 N)', color: PALETTE.slate },
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
  const warningKpa = m.audit.warningKpa;
  const totals = m.audit.totals;
  const fast = m.session.gate.passed;
  const worstGain = m.cv.gain.reduce((worst, row) =>
    row.schemes['RF + SMOTE'].macroF1 < worst.schemes['RF + SMOTE'].macroF1 ? row : worst);
  const shipped = m.cv.schemes.find((scheme) => scheme.key === 'RF + SMOTE');
  const rule = m.cv.schemes.find((scheme) => scheme.key === 'aturan murni');
  const single = m.cv.schemes.find((scheme) => scheme.key === 'RF class-weight');
  const confusion = m.cv.confusion;
  const allContractPass = m.contract.every((item) => item.pass);

  const findings = [
    {
      value: `${id(totals.atOrAbove.warning)}`,
      label: `sampel ≥ ${warningKpa} kPa`,
      note: `${pct(totals.atOrAbove.warning / totals.samples)} dari ${id(totals.samples)}; ${totals.patientsAtOrAbove.warning}/${totals.patients} pasien`,
    },
    {
      value: `${id(totals.imbalance, 1)} : 1`,
      label: 'rasio aman : waspada',
      note: `SMOTE menyeimbangkan lipatan latih saja`,
    },
    {
      value: pct(shipped.macroF1),
      label: 'macro-F1 out-of-fold',
      note: `${FOLDS} lipatan berkelompok per pasien`,
    },
    {
      value: pct(worstGain.schemes['RF + SMOTE'].macroF1),
      label: `macro-F1 pada gain ${gainLabel(worstGain.gain)}`,
      note: 'batas keandalan terhadap kalibrasi sensor',
    },
    {
      value: m.session.auc.toFixed(3).replace('.', ','),
      label: 'AUC DFN vs DM',
      note: fast ? `lolos ambang ${m.session.gate.floor.toFixed(3).replace('.', ',')}` : 'di bawah ambang gerbang',
    },
  ];

  const dataRows = [
    ['Pasien', id(totals.patients)],
    ['Sampel', id(totals.samples)],
    ['Kelompok DFN / DM', `${id(totals.groups.DFN)} / ${id(totals.groups.DM)}`],
    ['Label aman / waspada', `${id(totals.labels.safe)} / ${id(totals.labels.warning)}`],
    [`Sampel ≥ ${warningKpa} kPa`, id(totals.atOrAbove.warning)],
    ['Sampel ≥ 50 kPa', id(totals.atOrAbove.fifty)],
    ['Sampel ≥ 70 kPa', id(totals.atOrAbove.seventy)],
    ['Pasien yang pernah ≥ ' + warningKpa + ' kPa', id(totals.patientsAtOrAbove.warning)],
    ['Pasien yang pernah ≥ 70 kPa', id(totals.patientsAtOrAbove.seventy)],
    ['Tekanan puncak', `${id(totals.maxPeak, 2)} kPa`],
    ['Run terpanjang di atas ambang', `${id(totals.maxSustained)} sampel (${id(totals.maxSustained / 10, 1)} s)`],
  ];

  const schemeRows = m.cv.schemes.map((scheme) => [
    scheme.name,
    pct(scheme.macroF1),
    pct(scheme.accuracy),
    `${pct(scheme.perLevel.safe.precision)} / ${pct(scheme.perLevel.warning.precision)}`,
    pct(scheme.perLevel.warning.recall),
    `${id(scheme.perLevel.warning.fp)} / ${id(scheme.perLevel.warning.fn)}`,
  ]);

  const foldRows = m.cv.folds.map((fold, index) => [
    id(fold.fold),
    id(fold.patients),
    id(fold.samples),
    id(fold.warningSamples),
    id(fold.smote.synthetic),
    id(fold.smote.rejected),
    `${pct(single.folds[index].macroF1)} / ${pct(shipped.folds[index].macroF1)}`,
  ]);

  const gainRows = m.cv.gain.map((row) => [
    gainLabel(row.gain),
    ...m.cv.schemes.map((scheme) => pct(row.schemes[scheme.key].macroF1)),
    id(row.schemes['RF + SMOTE'].falsePositives),
    id(row.schemes['RF + SMOTE'].falseNegatives),
  ]);

  const robustnessRows = m.robustness.rows.map((row) => [
    row.name,
    pct(row.accuracy, 2),
    pct(row.macroF1, 2),
    row.key === 'clean' ? '—' : pct(row.flipRate, 2),
    id(row.warningCount),
  ]);

  const contractRows = m.contract.map((item) => [
    `${id(item.peak, 1)} kPa, ${id(item.seconds)} s`,
    `<span class="chip ${item.expected}">${LEVEL_LABELS[item.expected]}</span>`,
    `<span class="chip ${item.level}">${LEVEL_LABELS[item.level]}</span>`,
    id(item.score),
    item.pass ? '<span class="ok">lolos</span>' : '<span class="bad">gagal</span>',
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
    `Model hanya punya dua kelas, dan batasnya adalah aturan yang juga melabeli data: ${id(rule.perLevel.warning.support)} sampel warning lahir dari \`peak >= ${warningKpa} kPa\`. Karena itu macro-F1 ${pct(shipped.macroF1)} tidak mengukur kepintaran model, melainkan kesesuaiannya dengan aturan.`,
    `Ketiga skema (aturan murni, RF berbobot kelas, RF + SMOTE) memberi hasil ${pct(rule.macroF1)}, ${pct(single.macroF1)}, dan ${pct(shipped.macroF1)}; tidak ada skema yang lebih baik dari aturan pada target ini. SMOTE dipakai karena diminta dan karena ketidakseimbangan ${id(totals.imbalance, 1)}:1 nyata, bukan karena ia memperbaiki skor.`,
    `Bentuk pohon menjelaskan sebabnya: ${id(m.model.splitFeatures.sustained || 0)} dari ${id(m.model.trees)} pohon memisah pada \`sustained\`, fitur yang hanya positif ketika tekanan sudah melewati ambang. Kontrak dua arah di web dan firmware memastikan angka dan tingkat tidak bisa bertentangan, termasuk untuk masukan yang tidak mungkin datang dari perangkat.`,
    `Sinyal yang jujur adalah galat penguatan: macro-F1 turun ke ${pct(m.cv.gain.find((row) => row.gain === 0.9).schemes['RF + SMOTE'].macroF1)} pada ×0,9, ${pct(m.cv.gain.find((row) => row.gain === 1.1).schemes['RF + SMOTE'].macroF1)} pada ×1,1, dan ${pct(worstGain.schemes['RF + SMOTE'].macroF1)} pada ${gainLabel(worstGain.gain)}. Kalibrasi FSR adalah prasyarat, bukan pelengkap.`,
    fast
      ? `Pada target yang labelnya berasal dari diagnosis (DFN vs DM), tekanan membawa sinyal: AUC out-of-fold ${m.session.auc.toFixed(3).replace('.', ',')}, di atas fitur tunggal terbaik (${m.session.bestFeature.auc.toFixed(3).replace('.', ',')}).`
      : `Pada target diagnosis (DFN vs DM), tekanan tidak memisahkan kelompok: AUC out-of-fold ${m.session.auc.toFixed(3).replace('.', ',')} (gerbang ${m.session.gate.floor.toFixed(3).replace('.', ',')}), kontrol demografi ${m.session.controls.demographicsAuc.toFixed(3).replace('.', ',')}. Ini hasil negatif yang dilaporkan apa adanya.`,
    `Tidak ada tingkat di atas Waspada. Data acuan berhenti di ${id(totals.maxPeak, 2)} kPa dan FSR 402 mencapai ≈79 kPa, jadi tingkat ketiga tidak dapat dilatih maupun diukur; secara klinis pun pasien neuropati yang melewati ambang sudah kehilangan sensasi pelindung.`,
  ];

  const recommendations = [
    'Pertahankan Random Forest dua kelas; masalahnya ada di label, kalibrasi, dan jangkauan sensor — bukan pada algoritma.',
    `Jawab pertanyaan penguji dengan urutan ini: (1) dua kelas dan alasannya, (2) label berasal dari aturan ${warningKpa} kPa sehingga skor 100% wajar, (3) bukti sesungguhnya ada pada sapuan gain dan pada uji subjek baru.`,
    'Kalibrasi FSR (offset dan gain) sebelum mengklaim angka kPa; tanpa itu ambang berapa pun belum berarti secara absolut.',
    `Rekam subjek diabetes baru sebagai studi kasus eksternal, lalu laporkan kesesuaiannya dengan aturan ${warningKpa} kPa tanpa menyebutnya generalisasi.`,
    'Jangan menghidupkan kembali kelas bahaya tanpa data yang bisa mengukurnya; itu akan memaksa label sintetis yang tidak bisa dipertanggungjawabkan.',
  ];

  const body = `
<header>
  <h1>Paket Bukti Model Random Forest</h1>
  <p class="lead">Penilaian mandiri atas model klasifikasi risiko tekanan plantar dua kelas (${warningKpa} kPa): apa yang terbukti, apa yang tidak, dan mengapa.</p>
  <p class="meta">Dihasilkan otomatis oleh <code>scripts/evidence.js</code> · dataset ${m.audit.source} v${m.audit.version} · ${id(totals.patients)} pasien · ${id(totals.samples)} sampel · model <code>${m.model.hash}</code> · seed ${SEED}. Tidak ada angka yang diketik manual.</p>
</header>

<section>
  <h2>0. Ringkasan</h2>
  <div class="kpis">
    ${findings.map((finding) => kpi(finding.value, finding.label, finding.note)).join('')}
  </div>
  ${box('warn', 'Satu kalimat inti', `Label latih adalah aturan <code>peak >= ${warningKpa} kPa</code> itu sendiri, jadi skor sempurna bukan bukti model pintar melainkan bukti model menyalin aturan. Yang menguji model adalah pergeseran skala sensor dan subjek baru.`)}
</section>

<section>
  <h2>1. Data yang dipakai</h2>
  <p>Seluruh ${id(totals.patients)} pasien DFN-DS dipakai sebagai data latih, tanpa split internal. Data uji eksternal adalah subjek diabetes baru yang direkam sendiri, karena dataset publik tidak boleh dipakai sebagai data uji pada penelitian ini.</p>
  ${table(['Ukuran', 'Nilai'], dataRows)}
  ${chart(svg['histogram-peak'], 'Seluruh data berada di bawah 90 kPa; ambang label 45 kPa berada di dalam sebaran, ambang 200 kPa jauh di luar.')}
  ${chart(svg['ambang-counts'], `Hanya ${id(totals.atOrAbove.warning)} sampel melewati ambang label; ${id(totals.patients - totals.patientsAtOrAbove.warning)} pasien tidak pernah melewatinya.`)}
  ${chart(svg['per-pasien'], `Sebaran puncak per pasien: ambang ${warningKpa} kPa membagi pasien menjadi dua kelompok yang tidak seimbang, dan itu alasan SMOTE dipakai.`)}
</section>

<section>
  <h2>2. Apakah model benar-benar belajar?</h2>
  <p>Validasi silang memakai ${FOLDS} lipatan berkelompok per pasien: tidak ada satu pun pasien yang muncul di sisi latih dan sisi uji pada lipatan yang sama. Ketiga skema dijalankan pada lipatan yang identik, sehingga perbedaannya benar-benar berasal dari skema, bukan dari pembagian data.</p>
  ${table(
    ['Skema', 'Macro-F1', 'Akurasi', 'Presisi aman / waspada', 'Recall waspada', 'FP / FN (waspada)'],
    schemeRows
  )}
  ${chart(svg['cv-lipatan'], 'Setiap lipatan berisi pasien yang berbeda; skor tetap 1,000 pada semua lipatan.')}
  ${chart(svg['cv-skema'], 'Aturan murni tidak kalah dari Random Forest pada target ini — hasil yang jujur, bukan kegagalan pelatihan.')}
  ${table(
    ['Lipatan', 'Pasien uji', 'Sampel uji', 'Sampel warning', 'SMOTE sintetis', 'SMOTE ditolak', 'Macro-F1 class-weight / SMOTE'],
    foldRows
  )}
  <h3>Bentuk model yang sebenarnya</h3>
  ${box(
    'warn',
    'Pohon berhenti di satu pertanyaan',
    `Seluruh ${id(m.model.trees)} pohon berhenti pada kedalaman ${id(m.model.depth)}: setiap pohon hanya berisi satu pertanyaan. ` +
      `${id(m.model.splitFeatures.sustained || 0)} pohon bertanya "sustained > ${id(Math.max(0, ...m.model.sustainedThresholds), 2)}"? dan ${id(m.model.splitFeatures.peak || 0)} pohon bertanya "peak > ${id(Math.max(...m.model.peakThresholds), 2)} kPa"? ` +
      `Karena durasi tumpuan hanya bisa positif ketika tekanan sudah melewati ${warningKpa} kPa, kedua pertanyaan itu sama artinya dengan aturan ambang.`
  )}
  ${chart(svg.confusion, 'RF + SMOTE pada prediksi out-of-fold: tidak ada satu pun false positive atau false negative.')}
</section>

<section>
  <h2>3. Ketahanan terhadap galat kalibrasi</h2>
  <p>Setiap deret pasien digeser, lalu <code>sustained</code> dihitung ulang dari sinyal yang sudah tergeser, persis seperti firmware menghitungnya. Model tidak dilatih ulang: yang diuji adalah model yang sama pada masukan yang salah skala.</p>
  ${table(['Gain', ...m.cv.schemes.map((scheme) => scheme.name), 'FP (SMOTE)', 'FN (SMOTE)'], gainRows)}
  ${chart(svg['gain-error'], 'Kurva berbentuk lonceng sempit: hanya gain tepat 1,0 yang bertahan.')}
  ${box(
    'bad',
    'Kesimpulan yang dipakai di Bab IV',
    `Tidak ada skema yang membeli ketahanan terhadap galat kalibrasi: ketiganya runtuh bersamaan. Pada gain ${gainLabel(worstGain.gain)}, macro-F1 tinggal ${pct(worstGain.schemes['RF + SMOTE'].macroF1)} dan alarm palsu mencapai ${id(worstGain.schemes['RF + SMOTE'].falsePositives)} sampel. Perbaikannya ada di kalibrasi FSR, bukan di classifier.`
  )}
  <h3>Gangguan lain</h3>
  <p>Gangguan diterapkan pada tekanan tiga region, lalu durasi dihitung ulang. Ukuran yang paling bermakna adalah <em>tingkat perubahan keputusan</em>, karena akurasi tetap tinggi selama gangguan tidak memindahkan sampel melewati ambang.</p>
  ${table(['Skenario', 'Akurasi', 'Macro-F1', 'Keputusan berubah', 'Keputusan waspada'], robustnessRows)}
  ${chart(svg.ketahanan, 'Gangguan gain paling berpengaruh; sensor yang mati hanya menghilangkan satu region.')}
</section>

<section>
  <h2>4. Kontrak tingkat</h2>
  <p>Level ditentukan kontrak dua arah di web dan firmware, bukan suara pohon. Tabel ini adalah kasus acuan yang sama dengan <code>randomForestRisk.test.js</code> dan <code>test_randomforest.cpp</code>; skor harus selalu berada di pita levelnya.</p>
  ${table(['Masukan', 'Ekspektasi', 'Hasil', 'Skor', 'Status'], contractRows)}
  ${box(allContractPass ? 'ok' : 'bad', allContractPass ? 'Semua kasus acuan lolos' : 'Ada kasus acuan yang gagal', `Pita skor: aman 0–${SCORE_BANDS.safeMax}, waspada ${SCORE_BANDS.safeMax + 1}–${SCORE_BANDS.warningMax}.`)}
  ${chart(svg['peta-kontrak'], 'Peta keluaran: batasnya garis vertikal di 45 kPa, dan durasi tidak mengubah tingkat sama sekali.')}
  ${chart(svg['jangkauan-sensor'], 'Ambang 45 kPa berada di dalam jangkauan FSR 402; 200 kPa tidak.')}
</section>

<section>
  <h2>5. Apakah tekanan membawa sinyal di luar aturan?</h2>
  <p>Target risiko seluruhnya berasal dari aturan, sehingga tidak bisa dipakai membuktikan kemampuan belajar. Kolom diagnosis DFN/DM adalah satu-satunya label yang tidak dibuat sendiri, jadi model sesi diuji di situ.</p>
  ${table(['Butir', 'Nilai'], sessionRows)}
  ${chart(svg['roc-dfn-dm'], 'Kurva ROC out-of-fold untuk DFN vs DM.')}
  ${box(
    fast ? 'ok' : 'bad',
    fast ? 'Temuan: tekanan membawa sinyal' : 'Temuan: tekanan belum cukup memisahkan',
    fast
      ? `AUC out-of-fold ${m.session.auc.toFixed(3).replace('.', ',')} melewati ambang ${m.session.gate.floor.toFixed(3).replace('.', ',')} dan melebihi fitur tunggal terbaik sebesar ≥${m.session.gate.margin.toFixed(3).replace('.', ',')}. Ini bukti bahwa Random Forest belajar pola di luar aturan ambang, tetapi pada masalah yang berbeda: skrining neuropati per sesi, bukan tingkat risiko per sampel.`
      : `AUC out-of-fold hanya ${m.session.auc.toFixed(3).replace('.', ',')}, di bawah ambang ${m.session.gate.floor.toFixed(3).replace('.', ',')}. Kontrol demografi saja memberi ${m.session.controls.demographicsAuc.toFixed(3).replace('.', ',')}, sehingga yang gagal bukan pipeline melainkan sinyal tekanan pada dataset ini. Hasil negatif ini dilaporkan apa adanya.`
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
      ['Kontrak tingkat', `peak >= ${warningKpa} kPa → warning`],
      ['Level yang diekspor', m.model.levels.join(', ')],
    ]
  )}
  ${box('note', 'Belum diukur', 'Waktu inferensi di ESP32 dan latensi ujung-ke-ujung belum diukur di paket ini; angka di atas hanya proxy di laptop. Pengukuran perangkat dilakukan saat pengujian hardware.')}
</section>

<section>
  <h2>7. Kesimpulan dan rekomendasi</h2>
  <h3>Kesimpulan</h3>
  <ol>${conclusions.map((item) => `<li>${item}</li>`).join('')}</ol>
  <h3>Rekomendasi</h3>
  <ol>${recommendations.map((item) => `<li>${item}</li>`).join('')}</ol>
  ${box('warn', 'Apa yang tidak dibuktikan paket ini', 'Paket ini tidak mengukur akurasi pada subjek baru, tidak memvalidasi ambang secara klinis, dan tidak mengukur latensi perangkat. Semua angka berasal dari dataset publik dan model yang ada di repositori.')}
</section>

<section>
  <h2>8. Cara membaca dan mereproduksi</h2>
  <ul>
    <li>Semua angka dihitung ulang dari <code>models/training-data.json</code> dan <code>models/session-dataset.json</code>.</li>
    <li>Validasi silang dipanggil dari <code>scripts/train-model.js</code>, sehingga laporan dan log pelatihan memakai protokol yang sama.</li>
    <li>Jalankan <code>node scripts/evidence.js</code> untuk menghasilkan ulang seluruh berkas di <code>docs/evidence/</code>.</li>
    <li>Grafik tersedia sebagai SVG dan PNG di <code>docs/evidence/charts/</code>; angka mentah di <code>metrics.json</code>.</li>
  </ul>
</section>

<footer>Dokumen ini dihasilkan otomatis. Jangan diedit manual; ubah <code>scripts/evidence.js</code> lalu jalankan ulang.</footer>
`;

  return page('Paket Bukti Model Random Forest', body);
}

function renderConsultation(m) {
  const warningKpa = m.audit.warningKpa;
  const totals = m.audit.totals;
  const fast = m.session.gate.passed;
  const shipped = m.cv.schemes.find((scheme) => scheme.key === 'RF + SMOTE');
  const g09 = m.cv.gain.find((row) => row.gain === 0.9).schemes['RF + SMOTE'];
  const g12 = m.cv.gain.find((row) => row.gain === 1.2).schemes['RF + SMOTE'];

  const body = `
<header>
  <h1>Bahan Konsultasi — Model Random Forest</h1>
  <p class="lead">Satu halaman: keputusan yang sudah diambil, angka yang mendukungnya, dan pertanyaan yang masih terbuka.</p>
</header>

<section>
  <h2>Keputusan yang sudah dijalankan</h2>
  <ul>
    <li><strong>Dua kelas</strong> (Aman, Waspada) di model, firmware, web, dan seluruh dokumen. Tidak ada tingkat bahaya.</li>
    <li><strong>Ambang label ${warningKpa} kPa</strong>, dari persentil ke-95 DFN-DS (45,4 kPa ≈ 5,7 N pada FSR 402).</li>
    <li><strong>Durasi bukan penentu tingkat.</strong> Run terpanjang di atas ambang hanya ${id(totals.maxSustained)} sampel (${id(totals.maxSustained / 10, 1)} detik), jadi syarat durasi tidak pernah menyala.</li>
    <li><strong>Dataset publik hanya untuk latih.</strong> Uji memakai subjek diabetes baru yang direkam sendiri.</li>
    <li><strong>SMOTE</strong> di dalam lipatan latih saja, karena rasio ${id(totals.imbalance, 1)}:1.</li>
  </ul>
</section>

<section>
  <h2>Tiga temuan yang harus disampaikan apa adanya</h2>
  <ol class="findings">
    <li><strong>Skor sempurna itu wajar.</strong> Label dibuat dari aturan yang sama dengan yang dipakai model. Ketiga skema (aturan, RF berbobot kelas, RF + SMOTE) memberi macro-F1 ${pct(shipped.macroF1)} pada ${FOLDS} lipatan; yang diukur adalah kesesuaian dengan aturan, bukan generalisasi.</li>
    <li><strong>Model rapuh terhadap salah kalibrasi.</strong> Macro-F1 turun ke ${pct(g09.macroF1)} saat sinyal dikalikan 0,9 dan ${pct(g12.macroF1)} pada ×1,2. Kalibrasi FSR menentukan apakah ambang ${warningKpa} kPa berarti.</li>
    <li><strong>Tidak ada contoh untuk kelas ketiga.</strong> ${id(totals.atOrAbove.seventy)} dari ${id(totals.samples)} sampel mencapai 70 kPa dan tidak ada yang mencapai 200 kPa; FSR 402 sendiri hanya sampai ≈79 kPa.</li>
  </ol>
</section>

<section>
  <h2>Yang masih terbuka</h2>
  <ol>
    <li>Apakah satu subjek diabetes baru cukup sebagai studi kasus eksternal, atau perlu dua sampai tiga subjek dengan catatan bahwa jumlahnya tidak untuk generalisasi?</li>
    <li>Apakah ambang ${warningKpa} kPa perlu dibulatkan ke angka klinis lain (misalnya 50 kPa) sebelum pengambilan data subjek baru?</li>
    <li>Untuk Bab IV, apakah Bapak/Ibu menganggap sapuan gain dan uji subjek baru sudah cukup, atau perlu pengukuran ulang tekanan statis (berdiri) untuk menguji durasi?</li>
    <li>Apakah hasil negatif model sesi (AUC ${m.session.auc.toFixed(3).replace('.', ',')}) sebaiknya masuk Bab IV sebagai pembanding, atau cukup di lampiran?</li>
  </ol>
</section>

<section>
  <h2>Kalau ditanya</h2>
  <table>
    <tbody>
      <tr><td><strong>Kenapa hanya dua kelas?</strong></td><td>Karena tidak ada data untuk kelas ketiga dan sensornya tidak mampu mengukurnya; melewati ambang, pasien neuropati sudah kehilangan sensasi pelindung sehingga tindakannya sama.</td></tr>
      <tr><td><strong>Kenapa ${warningKpa} kPa?</strong></td><td>Persentil ke-95 tekanan pasien diabetes DFN-DS, masih di dalam rentang FSR 402 (≈5,7 N), dan menandai ${id(totals.patientsAtOrAbove.warning)} dari ${id(totals.patients)} pasien.</td></tr>
      <tr><td><strong>Akurasi 100% mencurigakan?</strong></td><td>Betul, dan itu sudah dicatat sebagai keterbatasan. Karena itu ada pembanding aturan, sapuan gain, kontrak tingkat, dan uji DFN vs DM.</td></tr>
      <tr><td><strong>Kenapa Random Forest kalau hasilnya sama dengan aturan?</strong></td><td>Karena kontribusinya bukan menyalin aturan, melainkan menunjukkan bahwa batas itu memang yang paling mudah dipelajari dari data, dan menyediakan skor kontinu; kelemahannya dilaporkan, bukan disembunyikan.</td></tr>
      <tr><td><strong>Bagaimana dengan durasi?</strong></td><td>Tetap fitur model dan tetap ditampilkan, tetapi tidak menaikkan tingkat; data acuan tidak punya tumpu panjang untuk diuji.</td></tr>
    </tbody>
  </table>
</section>

<section>
  <h2>Lampiran angka</h2>
  <ul>
    <li>Sampel ≥ ${warningKpa} kPa: ${id(totals.atOrAbove.warning)} (${pct(totals.atOrAbove.warning / totals.samples)}); ≥ 50 kPa: ${id(totals.atOrAbove.fifty)}; ≥ 70 kPa: ${id(totals.atOrAbove.seventy)}.</li>
    <li>Pasien yang pernah melewati ambang: ${id(totals.patientsAtOrAbove.warning)} dari ${id(totals.patients)}; puncak dataset ${id(totals.maxPeak, 2)} kPa.</li>
    <li>Figshare DFU: ${id(m.figshare.at_or_above_warning_pct || 0, 1)}% pengukuran ≥ ${warningKpa} kPa dan ${id(m.figshare.at_or_above_70_pct || 0, 1)}% ≥ 70 kPa.</li>
    <li>DFN vs DM, validasi silang ${m.session.folds} lipatan: AUC ${m.session.auc.toFixed(3).replace('.', ',')} (${fast ? 'lulus' : 'tidak lulus'} gerbang ${m.session.gate.floor.toFixed(3).replace('.', ',')}).</li>
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
  .chip { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 12.5px; font-weight: 600; }
  .chip.safe { background: #e7f5ee; color: #04644c; }
  .chip.warning { background: #fdf0d5; color: #8a5a00; }
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
  const warningKpa = meta.labelRule.warningKpa;
  const model = JSON.parse(fs.readFileSync(RF_MODEL, 'utf8'));
  let last = Date.now();
  const step = (label) => {
    const now = Date.now();
    console.log(`  ${label}: ${((now - last) / 1000).toFixed(1)} s`);
    last = now;
  };

  console.log('Menghitung audit data...');
  const auditData = audit(patients, meta, warningKpa);
  step('audit');

  console.log(`Menjalankan validasi silang ${FOLDS} lipatan...`);
  const cv = crossValidation(patients, warningKpa);
  step('validasi silang');

  console.log('Menguji ketahanan input...');
  const robust = robustness(patients, model, warningKpa);
  step('ketahanan');

  console.log('Menyusun kontrak dan peta tingkat...');
  const contract = contractCases(model, warningKpa);
  const map = scoreMap(model, warningKpa);
  step('kontrak');

  console.log('Memvalidasi ambang terhadap Figshare DFU...');
  const figshare = figshareNumbers(warningKpa);
  step('figshare');

  console.log('Menjalankan evaluasi sesi DFN vs DM...');
  const session = sessionEvidence();
  step('sesi DFN/DM');

  const modelInfo = modelFacts(model, warningKpa);
  step('fakta model');

  const m = {
    meta: {
      generatedBy: 'scripts/evidence.js',
      seed: SEED,
      folds: FOLDS,
      warningKpa,
      levels: LEVELS,
      scoreBands: SCORE_BANDS,
    },
    audit: auditData,
    cv,
    robustness: robust,
    contract,
    scoreMap: map,
    session,
    figshare,
    model: modelInfo,
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
  fs.writeFileSync(path.join(OUT_DIR, 'konsultasi-1-halaman.html'), renderConsultation(m));

  const readme = `# Paket Bukti Model Random Forest

> Dihasilkan otomatis oleh \`scripts/evidence.js\`. Jangan diedit manual.

Folder ini memuat pengukuran mandiri atas model klasifikasi risiko tekanan
plantar dua kelas (${warningKpa} kPa): kondisi dataset, hasil pengujian, dan bukti
untuk tiap temuan.

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
\`models/session-dataset.json\`, serta memanggil protokol validasi silang dari
\`scripts/train-model.js\`. Model produksi tidak diubah.

## Ringkasan temuan

- ${id(auditData.totals.atOrAbove.warning)} dari ${id(auditData.totals.samples)} sampel (${pct(auditData.totals.atOrAbove.warning / auditData.totals.samples)}) mencapai ambang label ${warningKpa} kPa, dari ${id(auditData.totals.patientsAtOrAbove.warning)} pasien; rasio kelas ${id(auditData.totals.imbalance, 1)}:1.
- Ketiga skema (aturan murni, RF berbobot kelas, RF + SMOTE) memberi macro-F1 ${pct(cv.schemes.find((s) => s.key === 'RF + SMOTE').macroF1)} pada ${FOLDS} lipatan berkelompok per pasien, karena labelnya berasal dari aturan itu sendiri (label melingkar).
- Galat penguatan paling menentukan: macro-F1 turun ke ${pct(cv.gain.find((row) => row.gain === 0.9).schemes['RF + SMOTE'].macroF1)} pada ×0,9 dan ${pct(cv.gain.find((row) => row.gain === 1.2).schemes['RF + SMOTE'].macroF1)} pada ×1,2.
- Tidak ada level di atas Waspada: ${id(auditData.totals.atOrAbove.seventy)} sampel mencapai 70 kPa dan 0 mencapai 200 kPa; FSR 402 berhenti di ≈79 kPa.
- DFN vs DM, validasi silang ${session.folds} lipatan: AUC ${session.auc.toFixed(3).replace('.', ',')} (${session.gate.passed ? 'lulus' : 'tidak lulus'} ambang ${session.gate.floor.toFixed(3).replace('.', ',')}).

## Batasan

- Waktu inferensi di laptop, bukan ESP32.
- Belum ada data subjek baru; uji eksternal dilakukan terpisah sebagai studi kasus.
- Label sampel berasal dari aturan, sehingga metrik klasifikasi mengukur
  kesesuaian terhadap aturan, bukan generalisasi.
`;

  fs.writeFileSync(path.join(OUT_DIR, 'README.md'), readme);

  console.log('\nSelesai.');
  console.log(`  audit     : ${id(auditData.totals.samples)} sampel, puncak ${id(auditData.totals.maxPeak, 2)} kPa`);
  console.log(`  CV        : aturan ${pct(cv.schemes[0].macroF1)} | class-weight ${pct(cv.schemes[1].macroF1)} | SMOTE ${pct(cv.schemes[2].macroF1)}`);
  console.log(`  gain      : ${cv.gain.map((row) => `x${row.gain.toFixed(1)} ${pct(row.schemes['RF + SMOTE'].macroF1)}`).join(' | ')}`);
  console.log(`  kontrak   : ${contract.filter((item) => item.pass).length}/${contract.length} lolos`);
  console.log(`  sesi      : AUC ${session.auc.toFixed(3)} (${session.gate.passed ? 'lulus' : 'tidak lulus'})`);
  console.log(`  grafik    : ${written.svg.length} SVG, ${written.png.length} PNG`);
  if (written.skippedPng.length) console.log(`  PNG dilewati: ${written.skippedPng.join(', ')}`);
  console.log(`  keluaran  : ${path.relative(ROOT, OUT_DIR)}/`);
}

module.exports = {
  loadPatients,
  audit,
  crossValidation,
  robustness,
  contractCases,
  scoreMap,
  sessionEvidence,
  figshareNumbers,
  modelFacts,
  infer,
};

if (require.main === module) main();
