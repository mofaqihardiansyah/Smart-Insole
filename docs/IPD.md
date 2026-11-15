# IPD - Implementation Plan Documentation

> Smart Insole IoT · Rencana implementasi dan status.
> Rujukan: [`ROADMAP-RF.md`](ROADMAP-RF.md), [`PRD.md`](PRD.md),
> [`../TASK.md`](../TASK.md).

## 1. Ringkasan

Pengerjaan dibagi menjadi enam fase, dari persiapan data sampai dokumentasi dan
sidang. Sebagian besar selesai; yang tersisa adalah uji pada perangkat fisik
dan demo ujung-ke-ujung. Asumsi tempo: 2-3 jam kerja per hari.

## 2. Fase dan status

| Fase | Isi | Status |
| --- | --- | --- |
| 1. Data Preparation | Parse DFN-DS, agregasi 3 region, ekstrak fitur, tanpa split | Selesai |
| 2. Model Training | Latih RF dua kelas, sweep hyperparameter, ekspor portable | Selesai |
| 3. Validasi | OptiTrack, Figshare DFU, edge case, kontrak klinis | Selesai |
| 4. Integration Web | Model asli jalan di dashboard | Selesai |
| 5. Integration Firmware | Ekspor C++, `RandomForest.cpp`, uji native | 5.1-5.3 selesai, 5.4 belum |
| 6. Dokumentasi & Sidang | Bab metodologi, slide, skrip demo | 6.1-6.3 selesai, 6.4 menunggu 5.4 |

## 3. Rincian per fase

### Fase 1 - Data Preparation

- Parse 135 file `.xls` (6001 baris x 17 kolom).
- Agregasi 8 sensor/kaki menjadi 3 region.
- Fitur per sampel: `peakPressure` dan `sustainedDuration`.
- Label: `peak >= 45` menjadi `warning`, selain itu `safe`; durasi tidak dipakai.
- Semua 135 pasien masuk data latih; validasi silang 5 lipatan berkelompok per pasien.

### Fase 2 - Model Training

- Training di Node.js (`scripts/train-model.js`).
- Sweep: n_trees {20, 50}, max_depth {8, 12}, min_samples {2, 5}.
- Tiga skema pada lipatan yang sama: aturan murni, RF berbobot kelas, RF + SMOTE.
- Evaluasi per kelas, kontrak tingkat dua arah, dan sapuan galat penguatan (gain 0,9-1,3).
- Ekspor ke `models/rf-model.json`.

### Fase 3 - Validasi

- OptiTrack v2: 310 rekaman, 902 fase tumpu, tumit mendahului forefoot 99,9%.
- Figshare DFU: 1.296 pengukuran, 9,8% >= 45 kPa, 1,4% >= 70 kPa.
- Edge case: kosong, `NaN`, negatif, 500 kPa tanpa galat.

### Fase 4 - Integration Web

- `randomForestRisk.ts` memuat model terlatih.
- Antarmuka sama: `inferRisk({ peakPressure, sustainedDuration })`.
- Suite tes penuh hijau.

### Fase 5 - Integration Firmware

- Ekspor C++ (`scripts/export-model-cpp.js`).
- `RandomForest.cpp`: kontrak dua arah `peak >= 45 kPa`, skor dari suara pohon, tanpa dependensi.
- Uji native 10/10 lolos.
- **Tersisa:** flash ke ESP32 dan uji dengan data sensor nyata.

### Fase 6 - Dokumentasi & Sidang

- Bab metodologi (`thesis-methodology.md`).
- Slide dan skrip demo (`thesis-defense.md`).
- **Tersisa:** eksekusi demo ujung-ke-ujung setelah 5.4.

## 4. Pekerjaan tersisa

| Item | Ketergantungan |
| --- | --- |
| 5.4 Flash dan uji insole fisik | Perangkat keras + `pio` |
| 6.4 Demo ESP32 -> Firebase -> Dashboard | 5.4 |

## 5. Gate verifikasi

```bash
# Web
cd web-dashboard && npm test && npm run typecheck && npm run build

# Firmware
pio test -e native    # bila PlatformIO absen: lewati dan sebutkan

# Dokumentasi
# code fence seimbang, tautan internal resolve, tabel render
```

## 6. Urutan dan dependensi

1. Web dan model sudah stabil; perubahan perilaku hanya lewat
   `randomForestRisk.ts`.
2. Firmware memakai model yang sama; ekspor ulang bila model berubah.
3. Uji fisik mendahului demo sidang.

## 7. Risiko dan mitigasi

| Risiko | Mitigasi |
| --- | --- |
| Tidak ada contoh tekanan di atas 200 kPa | Hanya dua kelas; ambang 45 kPa dan FSR 402 (≈79 kPa) |
| Ambang keliru bila FSR tidak dikalibrasi | Sapuan gain dilaporkan; kalibrasi prasyarat sebelum klaim kPa |
| 8 sensor latih vs 3 sensor insole | Agregasi regional, divalidasi pada OptiTrack |
| Model terlalu besar untuk ESP32 | 20 pohon, kedalaman 8, header < 100 KB |
| Overfitting | Validasi silang berkelompok per pasien, kontrak klinis, uji subjek baru |

## 8. Definisi selesai

1. Perilaku yang diminta terimplementasi sebagai perubahan terkecil yang cukup.
2. Gate area yang disentuh lolos.
3. `TASK.md` diperbarui.
4. `READY.md` diperbarui hanya bila environment/stack/path berubah.
5. Hand-over menyebut isi, bukti, dan risiko yang belum selesai.
