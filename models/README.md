# models/ — artefak model

Dua file di sini adalah **hasil generate**, bukan sumber kebenaran. Sumbernya
data mentah di `datasets/` dan skrip di `scripts/`. Jangan edit manual: setiap
regenerasi akan menimpanya.

| Artefak | Ukuran | Dibuat oleh | Konsumen |
|---|---|---|---|
| `training-data.json` | 8,2 MB | `scripts/prepare-dataset.py` | `scripts/train-model.js` |
| `rf-model.json` | 3,6 KB | `scripts/train-model.js` | web (salinan), `scripts/export-model-cpp.js` |
| `web-dashboard/src/utils/rf-model.json` | 3,6 KB | salinan byte-identik dari `rf-model.json` | `src/utils/randomForestRisk.ts` (impor TS) |
| `firmware/include/rf-model-data.h` | 7,7 KB | `scripts/export-model-cpp.js` | `firmware/src/RandomForest.cpp` |

Rantai provenance:

```
datasets/dfn-ds/*.xls + final_135_5_total_info.xlsx
        │  prepare-dataset.py  (kalibrasi kuantil, label 45 kPa, tanpa split)
        ▼
models/training-data.json  (v2.0)
        │  train-model.js     (validasi silang 2 kelas: aturan / class-weight / SMOTE)
        ▼
models/rf-model.json  (v2.0, 2 kelas, ambang 45 kPa)
        ├─ cp ──────────────► web-dashboard/src/utils/rf-model.json
        └─ export-model-cpp ► firmware/include/rf-model-data.h
```

> Skema yang diekspor adalah **RF + SMOTE**. Ketiga skema (aturan murni, RF
> berbobot kelas, RF + SMOTE) memberi skor identik pada label ini; SMOTE dipakai
> karena diminta dan karena rasio kelas 17,6:1.

## `training-data.json` (v2.0)

| Field | Tipe | Keterangan |
|---|---|---|
| `version` | string | versi skema/set data, `"2.0"` |
| `source` | string | `"DFN-DS (Zenodo MSSDA)"` |
| `calibration` | object | `method`, `anchorKpa`, `p75_raw`, `p90_raw`, `scale_factor` |
| `labelRule` | object | `warningKpa: 45`, `expression: "peak >= warningKpa"`, `durationUsed: false` |
| `features` | string[] | `["peak", "sustained", "forefoot", "midfoot", "heel"]` |
| `levels` | string[] | `["safe", "warning"]` |
| `patients` | object[] | 135 pasien — seluruh data publik, tanpa split validasi |

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

Dua angka yang mirip tapi berbeda, dan tidak boleh dipertukarkan:

- `calibration.anchorKpa` = 35 — jangkar skala: p75 seluruh peak mentah
  dipetakan ke 35 kPa. Ini hanya mendefinisikan arti "kPa" pada data.
- `labelRule.warningKpa` = 45 — batas operasional Aman/Waspada.

`sustained` adalah panjang run (dalam sampel) di atas `labelRule.warningKpa`.
Ia **fitur**, bukan penentu label: run terpanjang di DFN-DS hanya 13 sampel
(1,3 detik), karena data ini rekaman berjalan dan satu kaki menapak < 1 detik
per langkah. Syarat "bertahan 5 detik" karena itu tidak pernah terpenuhi dan
tidak dipakai sebagai aturan label.

Tidak ada `train`/`validation` lagi: seluruh 135 pasien dipakai berlatih, dan
satu-satunya data uji adalah subjek diabetes yang diukur sendiri. Validasi
selama pengembangan memakai lipatan berkelompok per pasien
(`scripts/train-model.js`), bukan potongan dataset yang disisihkan.

Catatan: metadata pasien (`age`, `sex`, `bmi`, `duration_min`) sudah ikut di
setiap entri. Karena itu tidak ada file manifest pasien terpisah — daftar
pasien bisa dibaca langsung dari `training-data.json`, dan satu file tambahan hanya
akan menjadi salinan yang bisa *drift*.

## `rf-model.json` (v2.0)

Model dua kelas. Tingkat ditentukan kontrak `peak >= 45 kPa`; suara pohon hanya
menempatkan skor di dalam pita tingkat itu, jadi tidak ada tingkat ketiga.

| Field | Isi |
|---|---|
| `version` | `"2.0"` |
| `features` | `["peak", "sustained"]` — dua fitur yang dipakai pohon |
| `levels` | `["safe", "warning"]` |
| `rule` | `{ warningKpa: 45 }` — ambang yang dipakai web dan firmware |
| `calibration` | identik dengan `training-data.json` (skala kPa) |
| `combo` | `{ nTrees: 20, maxDepth: 8, minSamples: 4 }` |
| `cv` | `folds`, `seed`, `scheme`, `accuracy`, `macroF1`, `perLevel` |
| `trees` | 20 pohon; node `{ leaf }` atau `{ feature, threshold, left, right }` |
| `provenance` | dari mana model ini dibuat (lihat di bawah) |

Pohon yang diekspor berhenti di kedalaman 1 (60 simpul): 18 pohon memisah pada
`sustained`, 2 pohon pada `peak` di 44,97 kPa. Daun menyimpan hitungan
`uint32_t` karena SMOTE membuat hitungan per daun melewati batas `uint16_t`.

`provenance` ditulis otomatis oleh `scripts/train-model.js`:

```json
{ "dataset": "DFN-DS (Zenodo MSSDA)", "datasetVersion": "2.0",
  "patients": 135, "samples": 81000, "warningSamples": 4347,
  "syntheticSamples": 72306,
  "preparedBy": "scripts/prepare-dataset.py",
  "trainedBy": "scripts/train-model.js", "seed": 42 }
```

Tidak ada timestamp di sini dengan sengaja: artefak harus deterministik agar
diff git hanya berubah ketika model benar-benar berubah. Waktu latih tercatat
di riwayat commit.

> Metrik `accuracy: 1.0` / `macroF1: 1.0` **bukan** bukti model sempurna —
> label DFN-DS diturunkan dari sinyal yang sama dengan fiturnya (lihat
> `docs/rf-model-report.md`). Label per sampel adalah `peak >= 45`, jadi pohon
> hanya mempelajari ambang itu sendiri; sebut ini aturan ambang, bukan
> classifier yang menemukan pola. Kinerja di kaki nyata harus diukur ulang.

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
python3 scripts/prepare-dataset.py   # butuh datasets/dfn-ds/ mentah (~30 detik)
node    scripts/train-model.js       # 5 lipatan × 3 skema, ~10 menit
cp models/rf-model.json web-dashboard/src/utils/rf-model.json
node    scripts/export-model-cpp.js  # header C++ hanya memakai `trees`
cd web-dashboard && npm test
```

`train-model.js` menulis `models/rf-model.json` memakai skema terpilih
(`RF + SMOTE`) dan mencetak ringkasan lipatan ke stdout.

`export-model-cpp.js` membaca `rule`, `combo`, dan `trees`, jadi menambah field
seperti `provenance` tidak mengubah header firmware. Kalau jumlah pohon atau
ambang berubah, header ikut berubah dan firmware harus di-flash ulang.

`train-model.js` tidak lagi menulis `docs/rf-model-report.md`; laporan itu
disunting manual supaya versi Indonesia tidak tertimpa. Skrip hanya mencetak
ringkasan ke stdout.
