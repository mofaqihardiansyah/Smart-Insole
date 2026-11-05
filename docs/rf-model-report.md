# Laporan Model Random Forest

> Terakhir diperbarui: 1 November 2026.

Model inferensi risiko tekanan plantar untuk dashboard web dan firmware ESP32.
Arsitekturnya **hybrid RF + rule**: Random Forest menangani batas _safe_ /
_warning_, sedangkan aturan klinis menangani _danger_.

## Dataset

- Sumber: **DFN-DS** — 135 pasien, 81.000 sampel.
- Fitur: _peak pressure_ (kPa) dan _sustained duration_ (detik).

## Metode

- **RF classifier** untuk batas `safe` / `warning` (data-driven).
- **Rule-based** untuk `danger`: peak ≥ 200 kPa pada satu sampel (Castro-Martins dkk., Heliyon 2024). Tidak ada syarat durasi.
- _Class weighting_: inverse frequency, dipotong maksimum 10x.
- Hyperparameter terbaik: `n_trees=20`, `max_depth=8`.

## Hasil Validasi (RF saja: `safe` vs `warning`)

- Accuracy: **100,0%**
- Macro-F1: **100,0%**

| Kelas | Precision | Recall | F1 | Support |
| --- | --- | --- | --- | --- |
| `safe` | 100,0% | 100,0% | 100,0% | 12.934 |
| `warning` | 100,0% | 100,0% | 100,0% | 3.866 |

## Clinical Contract (RF + Rule)

| Input | Ekspektasi | Hasil |
| --- | --- | --- |
| 40 kPa, 1 s | `warning` | Lolos |
| 210 kPa, 31 s | `danger` | Lolos |
| 20 kPa, 0 s | `safe` | Lolos |
| 30 kPa, 0 s | `safe` | Lolos |

## Rasional

DFN-DS tidak memiliki satu pun sampel `danger`: puncak tertinggi 87,06 kPa,
sedangkan ambang in-shoe paling konsensus adalah 200 kPa (Castro-Martins dkk.,
Heliyon 2024). Tidak ada contoh untuk dilatih, jadi `danger` ditentukan
rule-based.

Catatan kejujuran: label `safe`/`warning` juga diturunkan dari ambang
`peak >= 35`, sehingga RF di sini mereproduksi ambang tersebut. Angka 100%
berarti konsisten terhadap aturan label, bukan bukti generalisasi.

## Kenapa ambang danger bisa diubah tanpa retraining

`scripts/train-model.js` memakai data, fitur, dan label untuk membangun pohon;
`dangerRule` baru dibaca setelah pohon selesai (`predictWithRule`) dan saat
ekspor. Label per sampel tidak berubah saat ambang danger berubah, jadi keluaran
latih juga tidak berubah. Diuji pada regenerasi 5 November 2026:

| Keluaran | Model lama | Model baru |
| --- | --- | --- |
| Hash `trees` | `94478a0e5c7fd0e7` | `94478a0e5c7fd0e7` |
| `metrics`, `combo` | identik | identik |
| Field berubah | — | `dangerRule`, `calibration` |

Hash adalah SHA-256 dari JSON `trees` dengan kunci terurut, 16 karakter pertama.

Syaratnya dua. Pertama, label tidak berubah: `peak >= 35` tetap batas
`safe`/`warning`. Kedua, tidak ada sampel yang berpindah kelas: DFN-DS tidak
punya sampel >= 200 kPa (puncak 87,06 kPa). Perubahan 70 -> 200 justru
menghapus konflik lama: 31 sampel di 70-87 kPa dulu berlabel `warning` padahal
aturan eksekusi menyebut `danger`.

Retraining baru relevan kalau label diganti (misalnya diagnosis DFN/DM) atau
ada data >= 200 kPa. Tanpa itu, retrain hanya menghasilkan artefak yang sama.

## Reproduksi

```bash
python3 scripts/prepare-dataset.py       # dataset → models/training-data.json
node scripts/train-model.js              # training → models/rf-model.json
node scripts/export-model-cpp.js         # export → firmware/include/rf-model-data.h
```

Artefak yang dihasilkan:

| Path | Isi |
| --- | --- |
| `models/training-data.json` | Training set hasil persiapan data |
| `models/rf-model.json` | Model ter-ekspor (JSON) |
| `web-dashboard/src/utils/rf-model.json` | Salinan model untuk web |
| `firmware/include/rf-model-data.h` | Model sebagai array C++ |
