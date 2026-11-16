#!/usr/bin/env node
/**
 * export-folds.js — ekspor pembagian lipatan per pasien ke models/folds.json.
 *
 * Satu sumber kebenaran untuk protokol validasi: lipatan dibuat oleh
 * `groupedFolds` di scripts/train-model.js, bukan dibuat ulang di Python.
 * Perbandingan algoritma di scripts/compare-models.py membaca berkas ini,
 * sehingga angka RF dari pipeline JS dan angka model pembanding dihitung
 * pada pasien uji yang sama persis.
 *
 * Usage: node scripts/export-folds.js
 */

const fs = require('fs');
const path = require('path');

const { groupedFolds, FOLDS, SEED } = require('./train-model');

const ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'models', 'training-data.json');
const OUTPUT_FILE = path.join(ROOT, 'models', 'folds.json');

const dataset = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const patients = dataset.patients;

if (!Array.isArray(patients) || patients.length === 0) {
  throw new Error('training-data.json tidak berisi daftar pasien');
}

const folds = groupedFolds(patients, FOLDS, SEED);

// Verifikasi yang membuat berkas ini layak dipercaya: setiap pasien muncul
// tepat satu kali, dan tidak ada id yang hilang atau berlebih.
const assignment = {};
const seen = new Set();
folds.forEach((foldPatients, foldIndex) => {
  for (const patient of foldPatients) {
    const id = String(patient.patient);
    if (seen.has(id)) throw new Error(`pasien ${id} muncul di lebih dari satu lipatan`);
    seen.add(id);
    assignment[id] = foldIndex;
  }
});

if (seen.size !== patients.length) {
  throw new Error(`lipatan memuat ${seen.size} pasien, dataset memuat ${patients.length}`);
}

const counts = folds.map((foldPatients) => {
  const samples = foldPatients.reduce((total, p) => total + p.samples.length, 0);
  const warnings = foldPatients.reduce(
    (total, p) => total + p.samples.filter((s) => s.level === 'warning').length,
    0
  );
  return { patients: foldPatients.length, samples, warnings };
});

const output = {
  version: dataset.version,
  seed: SEED,
  folds: FOLDS,
  dataset: path.relative(ROOT, DATA_FILE),
  patients: patients.length,
  samples: patients.reduce((total, p) => total + p.samples.length, 0),
  counts,
  assignment,
};

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2) + '\n');
console.log(
  `folds.json: ${FOLDS} lipatan, ${output.patients} pasien, ${output.samples} sampel`
);
counts.forEach((c, i) =>
  console.log(`  lipatan ${i}: ${c.patients} pasien, ${c.samples} sampel, ${c.warnings} warning`)
);
