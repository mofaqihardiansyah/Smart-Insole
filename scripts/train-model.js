#!/usr/bin/env node
/**
 * train-model.js — 2 kelas (safe/warning) dari DFN-DS.
 *
 * Fase 2 dari roadmap: memilih skema latih dengan validasi silang
 * berkelompok per pasien, bukan satu split latih/validasi. Seluruh 135
 * pasien DFN-DS adalah data latih; data uji eksternal adalah subjek baru
 * yang diukur sendiri, jadi tidak ada bagian dataset publik yang boleh
 * diklaim sebagai "test".
 *
 * Tiga skema dibandingkan pada lipatan yang sama:
 *
 *   aturan murni     — `peak >= 45 kPa` langsung, tanpa model
 *   RF class-weight  — bobot kelas terbalik, bootstrap berbobot
 *   RF + SMOTE       — minoritas disintesis di ruang 3 region, di dalam
 *                      lipatan latih saja
 *
 * Aturan label: `warning <=> peak >= 45 kPa`. Durasi tidak dipakai; run
 * terpanjang di atas 45 kPa di DFN-DS hanya 1,3 detik, sehingga syarat
 * 5 detik akan menghasilkan nol sampel positif (lihat prepare-dataset.py).
 *
 * Skenario yang diharapkan: karena label berasal dari aturan ambang, RF
 * akan meniru aturan dan mendekati 100%. Itu hasil yang jujur, bukan
 * kegagalan — kontribusi tesis ada pada ketahanan terhadap noise/gain/
 * peletakan ulang, perbandingan SMOTE, dan perilaku pada subjek baru.
 *
 * Ekspor model produksi belum dilakukan di sini: `models/rf-model.json`
 * masih 3 tingkat sampai kontrak web + firmware ikut disederhanakan.
 *
 * Usage: node scripts/train-model.js
 */

const fs = require('fs');
const path = require('path');

const { createRng, trainForest, voteCounts } = require('./lib/forest');

const ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'models', 'training-data.json');
const OUTPUT_FILE = path.join(ROOT, 'models', 'rf-model.json');

const LEVELS = ['safe', 'warning'];
const FEATURES = ['peak', 'sustained'];
const FOLDS = 5;
const SEED = 42;

// Sama dengan model 20 pohon yang sekarang dipakai produksi, supaya
// perbandingan tidak tercampur perubahan arsitektur.
const FOREST = { nTrees: 20, maxDepth: 8, minSamples: 4 };

// SMOTE: k tetangga terdekat, hanya dari pasien yang sama.
const SMOTE_K = 5;
const SMOTE_ATTEMPTS_PER_SAMPLE = 10;

// Galat penguatan sensor. Kalibrasi FSR 402 masih nilai template, jadi
// pembacaan bisa bergeser 10-30% hanya karena resistor pembagi atau
// peletakan sensor berubah. Kedua fitur ikut bergeser: `peak` diskalakan,
// dan `sustained` dihitung ulang dari deret yang sudah diskalakan, persis
// seperti firmware menghitungnya dari pembacaan yang sama.
const GAINS = [0.9, 1.0, 1.1, 1.2, 1.3];

// ------------------------------------------------------------- utilities ---

const round2 = (x) => Math.round(x * 100) / 100;

function countBy(samples, key) {
  const counts = {};
  for (const s of samples) counts[s[key]] = (counts[s[key]] || 0) + 1;
  return counts;
}

/**
 * Dataset menyimpan label di `level`, sedangkan `lib/forest` membaca `label`.
 * Dinormalkan sekali di sini supaya tidak ada dua nama untuk satu hal.
 */
function toSample(patientId, sample) {
  return {
    patient: patientId,
    peak: sample.peak,
    sustained: sample.sustained,
    forefoot: sample.forefoot,
    midfoot: sample.midfoot,
    heel: sample.heel,
    label: sample.level,
  };
}

function predict(trees, sample) {
  const totals = voteCounts(trees, sample, LEVELS);
  return totals.warning > totals.safe ? 'warning' : 'safe';
}

/**
 * Terapkan galat penguatan pada satu pasien, lalu hitung ulang `sustained`
 * dari deret yang sudah tergeser.
 *
 * Menghitung ulang itu wajib. Kalau `peak` digeser sementara `sustained`
 * dibiarkan, model menerima satu fitur yang masih membawa nilai asli — dan
 * perangkat tidak punya informasi itu, karena firmware menghitung
 * `sustained` dari peak yang sama-sama salah kalibrasi. Hasil seperti itu
 * akan menyanjung model tanpa dasar.
 */
function perturbPatient(patient, gain, thresholdKpa) {
  let run = 0;
  return patient.samples.map((s) => {
    const peak = round2(s.peak * gain);
    run = peak >= thresholdKpa ? run + 1 : 0;
    return {
      patient: patient.patient,
      peak,
      sustained: run,
      forefoot: round2(s.forefoot * gain),
      midfoot: round2(s.midfoot * gain),
      heel: round2(s.heel * gain),
      label: s.level,
    };
  });
}

// ------------------------------------------------------ lipatan per pasien ---

/**
 * StratifiedGroupKFold sederhana: pasien diacak di dalam stratanya, lalu
 * dibagikan bergiliran ke lipatan. Stratanya "pasien punya minimal satu
 * sampel warning" vs "tidak punya", karena 42 dari 135 pasien tidak pernah
 * melewati 45 kPa — tanpa stratifikasi, satu lipatan bisa kehilangan
 * seluruh contoh positif.
 *
 * Batas yang tidak bisa dilanggar: satu pasien hanya muncul di satu lipatan,
 * sehingga skor tidak pernah melihat baris dari pasien yang sama.
 */
function groupedFolds(patients, k, seed) {
  const rng = createRng(seed);
  const shuffle = (list) => {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const strata = new Map();
  for (const p of patients) {
    const key = p.samples.some((s) => s.level === 'warning') ? 'has-warning' : 'no-warning';
    if (!strata.has(key)) strata.set(key, []);
    strata.get(key).push(p);
  }

  const folds = Array.from({ length: k }, () => []);
  for (const group of strata.values()) {
    shuffle(group).forEach((p, i) => folds[i % k].push(p));
  }
  return folds;
}

// ------------------------------------------------------------------ smote ---

function regionDistance(a, b) {
  const dForefoot = a.forefoot - b.forefoot;
  const dMidfoot = a.midfoot - b.midfoot;
  const dHeel = a.heel - b.heel;
  return dForefoot * dForefoot + dMidfoot * dMidfoot + dHeel * dHeel;
}

/**
 * SMOTE untuk kelas minoritas (warning), dengan dua batas:
 *
 *   1. Tetangga hanya dari pasien yang sama. Menyilangkan dua pasien
 *      menghasilkan titik yang tidak pernah ada di dunia nyata dan membuat
 *      sintesis membocorkan identitas pasien.
 *   2. Sintesis di ruang (forefoot, midfoot, heel), lalu `peak` dihitung
 *      ulang sebagai max ketiganya. Menginterpolasi `peak` langsung bisa
 *      menghasilkan kombinasi mustahil.
 *
 * Sampel sintetis yang setelah dihitung ulang ternyata `peak` di bawah
 * ambang label dibuang, karena labelnya tidak lagi warning. Jumlah yang
 * dibuang dicatat, bukan disembunyikan.
 */
function smoteWarning(warningSamples, targetCount, thresholdKpa, rng) {
  const byPatient = new Map();
  for (const s of warningSamples) {
    if (!byPatient.has(s.patient)) byPatient.set(s.patient, []);
    byPatient.get(s.patient).push(s);
  }

  const sources = [];
  let patientsSkipped = 0;
  for (const arr of byPatient.values()) {
    if (arr.length < SMOTE_K + 1) {
      patientsSkipped++;
      continue;
    }
    for (const base of arr) {
      const neighbours = arr
        .filter((other) => other !== base)
        .map((other) => ({ other, dist: regionDistance(base, other) }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, SMOTE_K)
        .map((entry) => entry.other);
      sources.push({ base, neighbours });
    }
  }

  const synthetic = [];
  let rejected = 0;
  let cursor = 0;
  if (sources.length === 0) {
    // Tidak ada pasien dengan cukup contoh untuk mencari k=5 tetangga.
    // Mengembalikan nol sampel akan membuat skema SMOTE diam-diam menjadi
    // "class-weight" tanpa keterangan, jadi lebih baik gagal terang-terangan.
    throw new Error(
      `SMOTE tidak bisa dijalankan: tidak ada pasien dengan >= ${SMOTE_K + 1} contoh warning ` +
      `(${patientsSkipped} pasien dilewati). Periksa ambang label atau pembagian lipatan.`
    );
  }
  const budget = targetCount * SMOTE_ATTEMPTS_PER_SAMPLE;

  for (let attempt = 0; attempt < budget && synthetic.length < targetCount; attempt++) {
    const { base, neighbours } = sources[cursor % sources.length];
    cursor++;
    const neighbour = neighbours[Math.floor(rng() * neighbours.length)];
    const lambda = rng();
    const forefoot = base.forefoot + lambda * (neighbour.forefoot - base.forefoot);
    const midfoot = base.midfoot + lambda * (neighbour.midfoot - base.midfoot);
    const heel = base.heel + lambda * (neighbour.heel - base.heel);
    const peak = round2(Math.max(forefoot, midfoot, heel));

    if (peak < thresholdKpa) {
      rejected++;
      continue;
    }

    synthetic.push({
      patient: base.patient,
      peak,
      forefoot: round2(forefoot),
      midfoot: round2(midfoot),
      heel: round2(heel),
      // Fitur turunan, bukan label: peak >= 45 berarti run minimal 1 sampel.
      sustained: Math.max(1, Math.round(base.sustained + lambda * (neighbour.sustained - base.sustained))),
      label: 'warning',
      synthetic: true,
    });
  }

  return { synthetic, sources: sources.length, patientsSkipped, rejected };
}

/** Ambang dibaca dari dataset, jadi smote tidak menyimpan salinan angka. */

// ---------------------------------------------------------------- metrik ---

function summarise(pairs) {
  const per = {};
  for (const level of LEVELS) per[level] = { tp: 0, fp: 0, fn: 0, tn: 0 };

  for (const { actual, predicted } of pairs) {
    for (const level of LEVELS) {
      if (predicted === level && actual === level) per[level].tp++;
      else if (predicted === level && actual !== level) per[level].fp++;
      else if (predicted !== level && actual === level) per[level].fn++;
      else per[level].tn++;
    }
  }

  let macroF1 = 0;
  const metrics = {};
  for (const level of LEVELS) {
    const { tp, fp, fn } = per[level];
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    metrics[level] = { precision, recall, f1, support: tp + fn, tp, fp, fn };
    macroF1 += f1;
  }

  const correct = pairs.filter((p) => p.actual === p.predicted).length;
  return {
    accuracy: pairs.length ? correct / pairs.length : 0,
    macroF1: macroF1 / LEVELS.length,
    perLevel: metrics,
  };
}

const pct = (x) => `${(x * 100).toFixed(1)}%`;

// ------------------------------------------------------------------ main ---

/**
 * Protokol validasi silang, satu sumber untuk pelatihan dan paket bukti.
 *
 * `scripts/evidence.js` memanggil fungsi ini alih-alih menyimpan salinannya,
 * supaya angka di laporan dan angka di log pelatihan tidak bisa berbeda
 * protokol. Fungsi ini tidak menulis berkas apa pun.
 */
function crossValidate(patients, thresholdKpa) {
  const folds = groupedFolds(patients, FOLDS, SEED);
  const schemes = ['aturan murni', 'RF class-weight', 'RF + SMOTE'];
  const pooled = Object.fromEntries(schemes.map((name) => [name, []]));
  const perFold = schemes.map(() => []);
  const gainPairs = {};
  for (const gain of GAINS) {
    gainPairs[gain] = Object.fromEntries(schemes.map((name) => [name, []]));
  }
  const foldLog = [];

  folds.forEach((testPatients, foldIndex) => {
    const testIds = new Set(testPatients.map((p) => p.patient));
    const trainSamples = [];
    const testSamples = [];
    for (const p of patients) {
      const target = testIds.has(p.patient) ? testSamples : trainSamples;
      for (const s of p.samples) {
        target.push(toSample(p.patient, s));
      }
    }

    const foldCounts = countBy(trainSamples, 'label');
    const rng = createRng(SEED + foldIndex);

    // 1. aturan murni
    const rulePredict = (s) => (s.peak >= thresholdKpa ? 'warning' : 'safe');

    // 2. RF dengan bobot kelas
    const n = trainSamples.length;
    const classWeights = {
      safe: Math.min(10, n / (2 * foldCounts.safe)),
      warning: Math.min(10, n / (2 * foldCounts.warning)),
    };
    const weightTrees = trainForest(
      trainSamples, FEATURES, classWeights,
      FOREST.nTrees, FOREST.maxDepth, FOREST.minSamples, createRng(SEED + foldIndex)
    );

    // 3. RF + SMOTE, disintesis hanya dari lipatan latih
    const warnings = trainSamples.filter((s) => s.label === 'warning');
    const smoteCount = foldCounts.safe - foldCounts.warning;
    const smote = smoteWarning(warnings, smoteCount, thresholdKpa, rng);
    const augmented = trainSamples.concat(smote.synthetic);
    const smoteTrees = trainForest(
      augmented, FEATURES, null,
      FOREST.nTrees, FOREST.maxDepth, FOREST.minSamples, createRng(SEED + foldIndex)
    );

    const predictors = {
      'aturan murni': rulePredict,
      'RF class-weight': (s) => predict(weightTrees, s),
      'RF + SMOTE': (s) => predict(smoteTrees, s),
    };

    const foldPairs = schemes.map((name) =>
      testSamples.map((s) => ({ actual: s.label, predicted: predictors[name](s) }))
    );
    const foldResults = foldPairs.map(summarise);

    // Ketahanan terhadap galat penguatan: deret tiap pasien digeser, lalu
    // `sustained` dihitung ulang, lalu diprediksi tanpa melatih ulang.
    for (const gain of GAINS) {
      const perturbed = testPatients.flatMap((p) => perturbPatient(p, gain, thresholdKpa));
      for (const name of schemes) {
        gainPairs[gain][name].push(
          ...perturbed.map((s) => ({ actual: s.label, predicted: predictors[name](s) }))
        );
      }
    }
    schemes.forEach((name, i) => {
      pooled[name].push(...foldPairs[i]);
      perFold[i].push(foldResults[i]);
    });

    foldLog.push({
      fold: foldIndex + 1,
      patients: testPatients.length,
      samples: testSamples.length,
      warningSamples: countBy(testSamples, 'label').warning || 0,
      trainSamples: trainSamples.length,
      trainWarning: foldCounts.warning,
      smote: {
        synthetic: smote.synthetic.length,
        target: smoteCount,
        rejected: smote.rejected,
        patientsSkipped: smote.patientsSkipped,
      },
      results: foldResults,
    });
  });

  return { folds, schemes, pooled, perFold, gainPairs, foldLog };
}

// ------------------------------------------------------------------ main ---

function main() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const patients = data.patients;
  const thresholdKpa = data.labelRule.warningKpa;

  const allSamples = patients.flatMap((p) => p.samples.map((s) => toSample(p.patient, s)));
  const counts = countBy(allSamples, 'label');

  console.log(`Dataset: ${patients.length} pasien, ${allSamples.length} sampel`);
  console.log(`Aturan label: ${data.labelRule.expression}`);
  console.log(`  safe ${counts.safe}, warning ${counts.warning} (rasio ${(counts.safe / counts.warning).toFixed(1)}:1)`);
  console.log(`Lipatan: ${FOLDS} kelompok per pasien, seed ${SEED}`);
  console.log(`Hutan: ${FOREST.nTrees} pohon, kedalaman ${FOREST.maxDepth}, minSamples ${FOREST.minSamples}`);
  console.log('');

  const { schemes, pooled, perFold, gainPairs, foldLog } = crossValidate(patients, thresholdKpa);

  for (const entry of foldLog) {
    console.log(
      `Lipatan ${entry.fold}: latih ${entry.trainSamples} sampel ` +
      `(${entry.trainWarning} warning), uji ${entry.samples} sampel ` +
      `(${entry.warningSamples} warning)`
    );
    console.log(
      `  SMOTE: ${entry.smote.synthetic} sintetis (target ${entry.smote.target}), ` +
      `${entry.smote.rejected} ditolak karena peak < ${thresholdKpa}, ` +
      `${entry.smote.patientsSkipped} pasien dilewati (contoh < ${SMOTE_K + 1})`
    );
    entry.results.forEach((m, i) => {
      console.log(
        `  ${schemes[i].padEnd(16)} macro-F1 ${pct(m.macroF1)}  ` +
        `recall(warning) ${pct(m.perLevel.warning.recall)}  ` +
        `presisi(warning) ${pct(m.perLevel.warning.precision)}  ` +
        `akurasi ${pct(m.accuracy)}`
      );
    });
    console.log('');
  }

  console.log('Ringkasan gabungan semua lipatan\n');
  const header = 'skema'.padEnd(17) + 'macro-F1'.padStart(10) + 'recall'.padStart(9) +
    'presisi'.padStart(9) + 'akurasi'.padStart(9) + 'FP'.padStart(8) + 'FN'.padStart(8);
  console.log(header);
  console.log('-'.repeat(header.length));
  for (const name of schemes) {
    const m = summarise(pooled[name]);
    const w = m.perLevel.warning;
    console.log(
      name.padEnd(17) +
      pct(m.macroF1).padStart(10) +
      pct(w.recall).padStart(9) +
      pct(w.precision).padStart(9) +
      pct(m.accuracy).padStart(9) +
      String(w.fp).padStart(8) +
      String(w.fn).padStart(8)
    );
  }

  console.log('\nRecall warning per lipatan');
  for (let i = 0; i < FOLDS; i++) {
    console.log(
      `  lipatan ${i + 1}: ` +
      perFold.map((runs, s) => `${schemes[s]} ${pct(runs[i].perLevel.warning.recall)}`).join('  |  ')
    );
  }

  console.log(
    '\nGalat penguatan sensor: macro-F1 terhadap label asli (FP = alarm palsu)'
  );
  console.log('gain'.padEnd(8) + schemes.map((name) => name.padStart(20)).join(''));
  console.log('-'.repeat(8 + 20 * schemes.length));
  for (const gain of GAINS) {
    const cells = schemes.map((name) => {
      const m = summarise(gainPairs[gain][name]);
      return `${pct(m.macroF1)} (FP ${m.perLevel.warning.fp})`.padStart(20);
    });
    console.log(`x${gain.toFixed(1)}`.padEnd(8) + cells.join(''));
  }

  exportModel({ patients, data, allSamples, counts, thresholdKpa, pooled });
}

// ----------------------------------------------------------------- ekspor ---

function exportModel({ patients, data, allSamples, counts, thresholdKpa, pooled }) {
  const finalCounts = countBy(allSamples, 'label');
  const smote = smoteWarning(
    allSamples.filter((s) => s.label === 'warning'),
    finalCounts.safe - finalCounts.warning,
    thresholdKpa,
    createRng(SEED)
  );
  const trees = trainForest(
    allSamples.concat(smote.synthetic), FEATURES, null,
    FOREST.nTrees, FOREST.maxDepth, FOREST.minSamples, createRng(SEED)
  );

  // Metrik yang dilaporkan adalah hasil validasi silang, bukan resubstitusi:
  // model final dilatih pada semua pasien, jadi mengukurnya pada data latih
  // sendiri tidak berarti apa pun.
  const cv = summarise(pooled['RF + SMOTE']);

  const model = {
    version: '2.0',
    features: FEATURES,
    levels: LEVELS,
    rule: { warningKpa: thresholdKpa },
    calibration: data.calibration,
    combo: FOREST,
    cv: {
      folds: FOLDS,
      seed: SEED,
      scheme: 'smote',
      accuracy: cv.accuracy,
      macroF1: cv.macroF1,
      perLevel: cv.perLevel,
    },
    provenance: {
      dataset: data.source,
      datasetVersion: data.version,
      patients: patients.length,
      samples: allSamples.length,
      warningSamples: counts.warning,
      syntheticSamples: smote.synthetic.length,
      preparedBy: 'scripts/prepare-dataset.py',
      trainedBy: 'scripts/train-model.js',
      seed: SEED,
    },
    trees,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(model));
  console.log('');
  console.log(`Model diekspor: ${OUTPUT_FILE} (${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(0)} KB)`);
  console.log(`  skema: RF + SMOTE, ${trees.length} pohon, ${smote.synthetic.length} sampel sintetis`);
  console.log(`  ambang label ${thresholdKpa} kPa`);
  console.log(`  macro-F1 validasi silang ${pct(cv.macroF1)}`);
}

if (require.main === module) main();

module.exports = {
  crossValidate,
  groupedFolds,
  perturbPatient,
  toSample,
  predict,
  summarise,
  smoteWarning,
  countBy,
  LEVELS,
  FEATURES,
  FOREST,
  FOLDS,
  SEED,
  GAINS,
};
