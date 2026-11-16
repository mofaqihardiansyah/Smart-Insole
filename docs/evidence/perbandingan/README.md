# Perbandingan algoritma — ringkasan

Dataset DFN-DS: 135 pasien, 81000 sampel, 4347 waspada (5.4%). Validasi silang berkelompok 5 lipatan, seed 42.

| Model | Macro-F1 | Recall waspada | AUC | Jurnal |
| --- | --- | --- | --- | --- |
| Decision Tree | 1,000 ± 0,000 | 1,000 ± 0,000 | 1,000 | Sheikh dkk. 2025, Scientific Reports 15:20962 |
| ANN | 0,995 ± 0,005 | 1,000 ± 0,001 | 1,000 | Darwich dkk. 2023, Baghdad Science Journal 20(6) |
| SVM | 0,995 ± 0,005 | 1,000 ± 0,001 | 1,000 | Agrawal dkk. 2023, IEEE Access 11:23119-23126 |
| AdaBoost | 1,000 ± 0,000 | 1,000 ± 0,000 | 1,000 | Agrawal dkk. 2024, Technologies 12:231 |
| Fuzzy Cognitive Map | 0,995 ± 0,005 | 1,000 ± 0,001 | 1,000 | Ramirez-Bautista dkk. 2022, IEEE Latin America Transactions 20(7) |

Model terbaik: **Decision Tree** (1,000 ± 0,000).

## Berkas

- `index.html` — laporan lengkap (12 bagian, 11 gambar)
- `metrics.json` — metrik per lipatan, confusion matrix, kurva, sapuan gain
- `config.json` — seed, versi pustaka, hiperparameter, hash dataset dan folds
- `charts/` — sebelas gambar, SVG dan PNG
- `ringkasan-konsultasi.html` — satu halaman untuk bimbingan

## Reproduksi

```bash
node scripts/export-folds.js
uv run --with scikit-learn --with matplotlib python scripts/compare-models.py
```
