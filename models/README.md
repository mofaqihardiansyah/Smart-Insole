# models/ — artefak model

Dua file di sini adalah **hasil generate**, bukan sumber kebenaran. Sumbernya
data mentah di `datasets/` dan skrip di `scripts/`. Jangan edit manual: setiap
regenerasi akan menimpanya.

| Artefak | Ukuran | Dibuat oleh | Konsumen |
|---|---|---|---|
| `training-data.json` | 7,8 MB | `scripts/prepare-dataset.py` | `scripts/train-model.js` |
| `rf-model.json` | 3,3 KB | `scripts/train-model.js` | web (salinan), `scripts/export-model-cpp.js` |
| `web-dashboard/src/utils/rf-model.json` | 3,3 KB | salinan byte-identik dari `rf-model.json` | `src/utils/randomForestRisk.ts` (impor TS) |
| `firmware/include/rf-model-data.h` | — | `scripts/export-model-cpp.js` | `firmware/src/RandomForest.cpp` |

Rantai provenance:

```
datasets/dfn-ds/*.xls + final_135_5_total_info.xlsx
        │  prepare-dataset.py  (kalibrasi kuantil, split per pasien)
        ▼
models/training-data.json  (v1.1)
        │  train-model.js     (RF safe/warning + rule danger)
        ▼
models/rf-model.json  (v1.0)
        ├─ cp ──────────────► web-dashboard/src/utils/rf-model.json
        └─ export-model-cpp ► firmware/include/rf-model-data.h
```

## `training-data.json` (v1.1)

| Field | Tipe | Keterangan |
|---|---|---|
| `version` | string | versi skema/set data, `"1.1"` |
| `source` | string | `"DFN-DS (Zenodo MSSDA)"` |
| `calibration` | object | `method`, `p75_raw`, `p90_raw`, `scale_factor`, `warning_kpa`, `danger_kpa` |
| `features` | string[] | `["peak", "sustained", "forefoot", "midfoot", "heel"]` |
| `levels` | string[] | `["safe", "warning", "danger"]` |
| `thresholds` | object | `warningKpa: 35`, `warningSeconds: 5` |
| `train`, `validation` | object[] | 107 dan 28 pasien — **split per pasien**, tanpa ID ganda |

Satu entri pasien:

```json
{
  "patient": "1",
  "group": "DFN",
  "meta": { "label": "DFN", "age": 80, "sex": "M", "duration_min": 15, "bmi": 25.5 },
  "samples": [
    { "peak": 14.29, "forefoot": 11.16, "midfoot": 9.12, "heel": 14.29,
      "sustained": 0, "level": "safe" }
  ]
}
```

Setiap pasien punya tepat 600 sampel (10 Hz setelah *downsample* dari 100 Hz),
jadi 135 × 600 = 81.000 sampel.

Catatan: metadata pasien (`age`, `sex`, `bmi`, `duration_min`) sudah ikut di
setiap entri. Karena itu tidak ada file manifest pasien terpisah — daftar
pasien bisa dibaca langsung dari `training-data.json`, dan satu file tambahan hanya
akan menjadi salinan yang bisa *drift*.

## `rf-model.json` (v1.0)

Model hibrida: RF memutuskan `safe`/`warning`, aturan klinis memutuskan
`danger`. Karena itu `levels` hanya berisi dua kelas.

| Field | Isi |
|---|---|
| `version` | `"1.0"` |
| `features` | `["peak", "sustained"]` — dua fitur yang dipakai pohon |
| `levels` | `["safe", "warning"]` |
| `dangerRule` | `{ peakThreshold: 70, sustainedThreshold: 1 }` kPa / detik |
| `calibration` | identik dengan `training-data.json` (skala kPa) |
| `combo` | `{ nTrees: 20, maxDepth: 8, minSamples: 4 }` |
| `metrics` | `accuracy`, `macroF1`, `perLevel` (precision/recall/f1/support) |
| `trees` | 20 pohon; node `{ leaf }` atau `{ feature, threshold, left, right }` |
| `provenance` | dari mana model ini dibuat (lihat di bawah) |

`provenance` ditulis otomatis oleh `scripts/train-model.js`:

```json
{ "dataset": "DFN-DS (Zenodo MSSDA)", "datasetVersion": "1.1",
  "trainPatients": 107, "validationPatients": 28,
  "trainSamples": 64200, "validationSamples": 16800,
  "preparedBy": "scripts/prepare-dataset.py",
  "trainedBy": "scripts/train-model.js", "seed": 42 }
```

Tidak ada timestamp di sini dengan sengaja: artefak harus deterministik agar
diff git hanya berubah ketika model benar-benar berubah. Waktu latih tercatat
di riwayat commit.

> Metrik `accuracy: 1.0` / `macroF1: 1.0` pada validasi bukan bukti model
> sempurna — label DFN-DS diturunkan dari sinyal yang sama dengan fiturnya
> (lihat `docs/rf-model-report.md`). Kinerja di kaki nyata harus diukur ulang.

## Kenapa ada salinan di `web-dashboard/src/utils/`

Vite mengimpor JSON lewat `import modelData from './rf-model.json'`, dan impor
tidak bisa menunjuk keluar root proyek. Jadi salinan itu **wajib** ada — tapi
harus identik dengan `models/rf-model.json`, kalau tidak web dan firmware
memakai model berbeda.

Salinan dijaga dua lapis:
`web-dashboard/src/utils/rf-modelSync.test.js` membandingkan isi kedua file,
dan langkah regenerasi di bawah selalu menyalin ulang.

## Regenerasi

```bash
python3 scripts/prepare-dataset.py   # butuh datasets/dfn-ds/ mentah
node    scripts/train-model.js       # deterministik (seed 42)
cp models/rf-model.json web-dashboard/src/utils/rf-model.json
node    scripts/export-model-cpp.js  # header C++ hanya memakai `trees`
cd web-dashboard && npm test
```

`export-model-cpp.js` hanya membaca `version` dan `trees`, jadi menambah field
seperti `provenance` tidak mengubah header firmware. Kalau jumlah pohon atau
ambang berubah, header ikut berubah dan firmware harus di-flash ulang.

Perhatian: `train-model.js` juga menulis ulang `docs/rf-model-report.md` dengan
template bawaan (bahasa Inggris). Versi yang di-commit sudah disunting manual
dalam bahasa Indonesia — setelah regenerasi, pulihkan dengan
`git checkout -- docs/rf-model-report.md` dan perbarui angkanya bila metrik
berubah.
