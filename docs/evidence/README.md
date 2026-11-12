# Paket Bukti Model Random Forest

> Dihasilkan otomatis oleh `scripts/evidence.js`. Jangan diedit manual.

Folder ini memuat pengukuran mandiri atas model klasifikasi risiko tekanan
plantar: kondisi dataset, hasil pengujian, dan bukti untuk tiap temuan.

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
`models/session-dataset.json`. Model produksi tidak diubah.

## Ringkasan temuan

- Kelas Bahaya tidak punya contoh: 0 dari 81.000 sampel mencapai 200 kPa; puncak dataset 87,06 kPa.
- Tidak ada sampel validasi di atas 70 kPa, sehingga kelayakan ambang 70 kPa
  belum bisa diuji pada data uji.
- Random Forest dan aturan ambang memberi keputusan identik pada
  100,0% sampel validasi, karena labelnya berasal dari aturan itu sendiri (label melingkar).
- Ambang 200 kPa di luar jangkauan FSR 402 (200 kPa ≈ 25,4 N, sensor 0,1–10 N).
- DFN vs DM, validasi silang 5 lipatan: AUC 0,503 (tidak lulus ambang 0,650).

## Batasan

- Waktu inferensi di laptop, bukan ESP32.
- Tidak ada data pasien nyata dan tidak ada validasi klinis.
- Label sampel berasal dari aturan, sehingga metrik klasifikasi mengukur
  kesesuaian terhadap aturan, bukan generalisasi.
