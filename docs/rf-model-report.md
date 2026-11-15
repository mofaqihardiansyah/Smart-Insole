# Laporan Model Random Forest

> Terakhir diperbarui: 13 November 2026.

Model inferensi risiko tekanan plantar untuk dashboard web dan firmware ESP32.
Model punya **dua kelas**: `safe` (Aman) dan `warning` (Waspada). Tidak ada
tingkat ketiga; alasannya ada di bagian *Rasional*.

## Dataset

- Sumber: **DFN-DS** — 135 pasien, 81.000 sampel.
- Fitur: _peak pressure_ (kPa) dan _sustained duration_ (sampel 10 Hz).
- Label: `peak >= 45 kPa` menjadi `warning`, selain itu `safe`. Durasi tidak
  ikut menentukan label.
- Sebaran: 76.653 `safe` / 4.347 `warning` (rasio 17,6 : 1), 93 dari 135 pasien
  pernah melewati ambang, 42 pasien tidak pernah.

Seluruh 135 pasien dipakai sebagai data latih. Data uji eksternal adalah subjek
diabetes baru yang direkam sendiri, bukan bagian dari DFN-DS.

## Metode

- **Random Forest dua kelas**, dilatih pada fitur yang sama yang dipakai
  perangkat.
- **Kontrak tingkat** menentukan kelas akhir: `peak >= 45 kPa -> warning`,
  `peak < 45 kPa -> safe`. Suara pohon hanya menempatkan skor di dalam pita
  tingkat itu (aman 0–47, waspada 48–74), sehingga angka dan tingkat tidak dapat
  bertentangan.
- **SMOTE** di dalam lipatan latih saja, per pasien, `k = 5`, seed 42. Target
  sintetis menyamakan jumlah kelas di sisi latih; 289.224 sampel sintetis
  dihasilkan di seluruh lipatan (sekitar 58.000 per lipatan).
- **Validasi silang**: 5 lipatan berkelompok per pasien. Tidak ada pasien yang
  muncul di sisi latih dan sisi uji pada lipatan yang sama.
- **Hyperparameter**: `n_trees=20`, `max_depth=8`, `min_samples=4`.

## Hasil Validasi (out-of-fold)

| Kelas | Precision | Recall | F1 | Support |
| --- | --- | --- | --- | --- |
| `safe` | 100,0% | 100,0% | 100,0% | 76.653 |
| `warning` | 100,0% | 100,0% | 100,0% | 4.347 |

Macro-F1 100,0% dan akurasi 100,0% pada kelima lipatan. Angka ini sama untuk
ketiga skema (aturan murni, RF berbobot kelas, RF + SMOTE) karena labelnya
berasal dari aturan yang sama dengan kontrak eksekusi.

## Clinical Contract

| Input | Ekspektasi | Hasil |
| --- | --- | --- |
| 20 kPa, 0 s | `safe` | Lolos |
| 40 kPa, 3 s | `safe` | Lolos |
| 44,9 kPa, 12 s | `safe` | Lolos |
| 45 kPa, 1 s | `warning` | Lolos |
| 60 kPa, 5 s | `warning` | Lolos |
| 80 kPa, 2 s | `warning` | Lolos |
| 210 kPa, 45 s | `warning` | Lolos |
| 500 kPa, 60 s | `warning` | Lolos |

## Ketahanan terhadap galat kalibrasi

Seluruh deret pasien digeser, lalu `sustained` dihitung ulang dari sinyal yang
sudah tergeser. Model tidak dilatih ulang.

| Gain | Macro-F1 | FP `warning` | FN `warning` |
| --- | --- | --- | --- |
| ×0,9 | 78,4% | 0 | 2.552 |
| ×1,0 | 100,0% | 0 | 0 |
| ×1,1 | 82,4% | 4.181 | 0 |
| ×1,2 | 69,7% | 10.067 | 0 |
| ×1,3 | 60,9% | 16.836 | 0 |

Ambang adalah batas keras: kesalahan gain langsung memindahkan sampel ke sisi
lain ambang. Kalibrasi FSR adalah prasyarat, bukan pelengkap.

## Rasional

DFN-DS tidak punya contoh di atas 200 kPa: puncak tertinggi 87,06 kPa, hanya 31
sampel (3 pasien) mencapai 70 kPa, dan FSR 402 sendiri berhenti di ≈79 kPa. Tidak
ada data untuk melatih tingkat ketiga, dan secara klinis pasien neuropati yang
melewati ambang sudah kehilangan sensasi pelindung sehingga tindakannya sama.
Karena itu model berhenti di dua kelas.

Ambang 45 kPa adalah persentil ke-95 tekanan DFN-DS (45,4 kPa, ≈5,7 N pada FSR
402) dan menandai 93 dari 135 pasien. Kalibrasi FSR memakai anchor 35 kPa;
ambang label adalah konstanta terpisah, jadi mengubah kalibrasi tidak mengubah
definisi kelas.

Catatan kejujuran: label `safe`/`warning` diturunkan dari aturan `peak >= 45`,
sehingga model mereproduksi ambang tersebut. Angka 100% berarti konsisten
terhadap aturan label, bukan bukti generalisasi. Bukti yang lebih jujur adalah
sapuan gain di atas dan uji subjek baru.

## Bentuk model

| Butir | Nilai |
| --- | --- |
| Pohon | 20 |
| Total simpul | 60 (setiap pohon berhenti di kedalaman 1) |
| Pembagian fitur | 18 pohon pada `sustained`, 2 pohon pada `peak` |
| Ambang `peak` yang dipelajari | 44,97 kPa |
| Ukuran JSON | 3,6 KB |
| Ukuran header C++ | 7,7 KB |
| Inferensi di laptop (proxy) | ≈1,1 µs per keputusan |

## Reproduksi

```bash
python3 scripts/prepare-dataset.py       # dataset -> models/training-data.json
node scripts/train-model.js              # training -> models/rf-model.json
node scripts/export-model-cpp.js         # export -> firmware/include/rf-model-data.h
node scripts/evidence.js                 # bukti -> docs/evidence/
```

Artefak yang dihasilkan:

| Path | Isi |
| --- | --- |
| `models/training-data.json` | Training set hasil persiapan data |
| `models/rf-model.json` | Model ter-ekspor (JSON) |
| `web-dashboard/src/utils/rf-model.json` | Salinan model untuk web |
| `firmware/include/rf-model-data.h` | Model sebagai array C++ |
| `docs/evidence/metrics.json` | Angka paket bukti |
