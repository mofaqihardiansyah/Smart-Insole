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
- **Rule-based** untuk `danger`: peak ≥ 70 kPa **dan** sustained ≥ 0,1 detik.
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
| 80 kPa, 31 s | `danger` | Lolos |
| 20 kPa, 0 s | `safe` | Lolos |
| 30 kPa, 0 s | `safe` | Lolos |

## Rasional

DFN-DS hanya memiliki 31 sampel `danger` (0,05%) dari 3 pasien. Jumlah ini
tidak cukup bagi RF untuk mempelajari pola `danger` yang dapat
digeneralisasi. Karena itu `danger` ditentukan secara rule-based — ambangnya
sudah _well-defined_ secara klinis (tekanan > 70 kPa dalam durasi signifikan
sudah berbahaya). RF tetap data-driven untuk batas `safe` / `warning` yang
mencakup 99,95% data.

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
