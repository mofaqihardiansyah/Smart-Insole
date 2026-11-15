# Paket Bukti Model Random Forest

> Dihasilkan otomatis oleh `scripts/evidence.js`. Jangan diedit manual.

Folder ini memuat pengukuran mandiri atas model klasifikasi risiko tekanan
plantar dua kelas (45 kPa): kondisi dataset, hasil pengujian, dan bukti
untuk tiap temuan.

## Berkas

| Berkas | Isi |
| --- | --- |
| `hasil-pengujian-model.html` | Laporan lengkap (A4, siap cetak/PDF) dengan seluruh angka dan grafik |
| `konsultasi-1-halaman.html` | Versi ringkas tanpa istilah teknis, untuk dibawa saat bimbingan |
| `metrics.json` | Seluruh angka mentah yang dipakai laporan |
| `charts/*.svg` | Grafik vektor untuk laporan web |
| `charts/*.png` | Grafik raster untuk disalin ke Word |

## Reproduksi

```bash
node scripts/evidence.js
```

Skrip menghitung ulang semua angka dari `models/training-data.json` dan
`models/session-dataset.json`, serta memanggil protokol validasi silang dari
`scripts/train-model.js`. Model produksi tidak diubah.

## Ringkasan temuan

- 4.347 dari 81.000 sampel (5,4%) mencapai ambang label 45 kPa, dari 93 pasien; rasio kelas 17,6:1.
- Ketiga skema (aturan murni, RF berbobot kelas, RF + SMOTE) memberi macro-F1 100,0% pada 5 lipatan berkelompok per pasien, karena labelnya berasal dari aturan itu sendiri (label melingkar).
- Galat penguatan paling menentukan: macro-F1 turun ke 78,4% pada ×0,9 dan 69,7% pada ×1,2.
- Tidak ada level di atas Waspada: 31 sampel mencapai 70 kPa dan 0 mencapai 200 kPa; FSR 402 berhenti di ≈79 kPa.
- DFN vs DM, validasi silang 5 lipatan: AUC 0,536 (tidak lulus ambang 0,650).

## Batasan

- Waktu inferensi di laptop, bukan ESP32.
- Belum ada data subjek baru; uji eksternal dilakukan terpisah sebagai studi kasus.
- Label sampel berasal dari aturan, sehingga metrik klasifikasi mengukur
  kesesuaian terhadap aturan, bukan generalisasi.
