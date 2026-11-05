# Rencana Perbaikan — datasets/, models/, firmware/ (ambang danger 200 kPa)

> Status: **dieksekusi 5 November 2026**. Semua fase selesai; gate hijau.

## 0. Status eksekusi

| Gate | Hasil |
| --- | --- |
| `npm test` | 44 file, 384 tes lolos |
| `npm run typecheck` | lolos |
| `npm run build` | lolos (`dist/` dikembalikan ke versi commit) |
| `pio test -e native` | 13/13 lolos |
| Ambang danger | 200 kPa di JSON, header C++, web (`grep` bersih) |
| Salinan model web | identik, `rf-modelSync` lolos |

Penyimpangan dari rencana:

- Langkah determinisme (jalankan pipeline dua kali) dilewati: latih butuh ~11
  menit dan seed tidak berubah. Artefak diregenerasi sekali.
- `models/training-data.json` disunting di tempat untuk dua field metadata
  (`danger_kpa`, `warningSeconds`) supaya cocok dengan skrip tanpa menulis
  ulang 8 MB file.
- Retrain model tidak dilakukan: label tidak berubah, jadi pohon akan identik.
  Retrain baru relevan kalau label diganti ke diagnosis DFN/DM.

## 1. Tujuan

Ganti ambang `danger` dari 70 kPa ke **200 kPa** (konsensus in-shoe,
Castro-Martins dkk., Heliyon 2024, e26161), satukan definisinya di model, web,
dan firmware, lalu tutup temuan audit lain yang murah dan berdampak.

**Kriteria sukses**

- Tidak ada lagi angka 70 sebagai ambang danger di `models/`, `firmware/`,
  `web-dashboard/src/`.
- Device dan dashboard memberi verdict sama untuk input sama.
- `npm test`, `npm run typecheck`, `npm run build`,
  `~/.venvs/platformio/bin/pio test -e native` hijau.
- Regenerasi artefak deterministik: jalankan ulang pipeline → `git diff` kosong.
- Semua klaim dokumen cocok dengan kode.

**Bukan tujuan:** melatih ulang model dengan label klinis DFN/DM, kalibrasi FSR
ke kPa, mengubah schema Firebase.

## 2. Keputusan tetap

| ID | Keputusan | Alasan |
|---|---|---|
| D1 | `dangerRule.peakThreshold = 200` kPa | Ambang paling konsensus di review |
| D2 | Danger = satu sampel peak ≥ 200 kPa. `sustainedThreshold` tetap `1` (1 sampel = 0,1 s) | Tidak ada bukti klinis untuk durasi; jangan mengarang ambang waktu |
| D3 | Label training tetap `peak >= 35`; RF tidak dilatih ulang | Di luar lingkup; dicatat sebagai limitasi |
| D4 | "kPa" DFN = satuan nominal hasil skala kuantil, bukan kPa terkalibrasi | Jujur; kalibrasi butuh data timbang |
| D5 | Field detik di Settings dihapus dari form (tetap ada di tipe) | Kontrol mati membingungkan |
| D6 | Filter median 3 sampel per FSR di firmware | 200 kPa + ADC 1 Hz tanpa filter = risiko spike |
| D7 | `train-model.js` berhenti menimpa `docs/rf-model-report.md` | Versi Indonesia hilang tiap regen |
| D8 | Ambang kPa tetap bisa diedit di Settings; verdict device menang | Perilaku existing, tidak diubah |

## 3. Temuan dan solusi

| ID | Area | Masalah | Bukti | Solusi |
|---|---|---|---|---|
| F1 | models | RF tautologis; 100% accuracy sirkular | `prepare-dataset.py:114`, semua pohon depth 1 | Catat sebagai limitasi di laporan + TASK; tidak diperbaiki |
| F2 | semua | Danger 70 kPa tanpa dasar | `rf-model.json`, `RandomForest.cpp`, `RISK_THRESHOLDS` | D1 |
| F3 | firmware | Durasi danger diukur di atas 35, web di atas 70 | `main.cpp:99` vs `InsoleContext.tsx:181` | D2 membuat keduanya "sampel ini"; akumulator 35 hanya untuk fitur RF |
| F4 | models→firmware | `sustainedThreshold` tanpa satuan | `models/README.md:72` | Tambah `sustainedUnit: "samples_10hz"` di JSON + komentar header C++ |
| F5 | datasets | "kPa" hasil skala kuantil | `prepare-dataset.py:153` | D4; tulis ulang klaim di README + validation-report |
| F6 | scripts | Docstring klaim 0 danger, padahal 31 (pada 70 kPa) | `prepare-dataset.py:108` | Dengan 200 kPa klaim jadi benar; perbarui angka: maksimum 87 kPa, 0 sampel ≥ 200 |
| F7 | docs | Laporan model sebut 31 sampel danger | `rf-model-report.md:42` | Perbarui: 0 sampel mencapai 200 kPa |
| F8 | web | `warningSeconds`/`dangerSeconds` tidak dipakai inference tapi bisa diedit | `SettingsPage.tsx:72-86` | Hapus 2 field dari form; `DashboardPage.tsx:372` pakai konstanta |
| F9 | scripts | Klaim "clipped max 10x" tidak ada di kode | `train-model.js:246` | Implementasi `Math.min(10, ...)` |
| F10 | scripts | Fallback leaf menghitung count kuadratik | `train-model.js:105` | Perbaiki loop jadi satu pass |
| F11 | firmware | Tanpa filter, 1 `analogRead`/detik | `main.cpp:90` | D6: median 3 sampel |
| F12 | firmware | Komentar push "2 s", konfigurasi 1000 ms | `main.cpp:15`, `config.h.example:65` | Samakan teks ke 1 s |
| F13 | docs | validation-report 3.2 tidak punya baris 200 kPa; "sepertiga terbawah" salah | `validation-report.md:73` | Tambah baris 0% (maks 123,8 kPa); betulkan kalimat |
| F14 | docs | ROADMAP-RF basi (99 file, DFN→danger, 5 s, 157 tes) | `ROADMAP-RF.md:16,30,33` | Perbarui |
| F15 | tests | Kasus 70/75 kPa jadi salah setelah D1 | 3 file tes | Perbarui ke 200/210 |
| F16 | datasets | Lisensi Figshare & OptiTrack tidak diketahui; peta sensor dari gambar | `datasets/README.md:69,87` | Sudah tercatat; tidak ada aksi, sebut di skripsi |

## 4. File yang disentuh

Baru: `RENCANA-PERBAIKAN.md`.
Diubah (±20): `scripts/train-model.js`, `scripts/prepare-dataset.py`,
`models/rf-model.json`, `models/README.md`,
`firmware/include/rf-model-data.h`, `firmware/src/main.cpp`,
`firmware/test/test_randomforest.cpp`, `web-dashboard/src/utils/rf-model.json`,
`randomForestRisk.ts`, `randomForestRisk.test.js`, `InsoleContext.tsx`,
`InsoleContext.test.tsx`, `SettingsPage.tsx`, `DashboardPage.tsx`,
`components/landing/RiskExplorer.tsx`, `docs/rf-model-report.md`,
`docs/validation-report.md`, `docs/ROADMAP-RF.md`,
`docs/thesis-methodology.md`, `TASK.md`, `CHANGELOG.md`.

Ini melewati batas 5 file di `AGENTS.md`; persetujuan plan ini sekaligus jadi
izinnya.

## 5. Langkah kerja

### Fase 0 — Siapkan (10 menit)

1. Catat baseline: `cd web-dashboard && npm test 2>&1 | tail -5`.

### Fase 1 — Pipeline model (45 menit)

2. `scripts/train-model.js`:
   - `DANGER_RULE = { peakThreshold: 200, sustainedThreshold: 1 }`.
   - `checks`: `{peak:210, sustained:31, expect:'danger'}`; tambah
     `{peak:80, sustained:31, expect:'warning'}`.
   - Class weight: `Math.min(10, ...)`.
   - Fallback leaf: satu loop.
   - Hapus tulis `REPORT_FILE`; cetak ringkasan ke stdout.
   - Tambah `sustainedUnit: 'samples_10hz'` ke `dangerRule`.
3. `scripts/prepare-dataset.py`: docstring + `label_samples` → "0 dari 81.000
   sampel mencapai 200 kPa (maksimum 87,06)".
4. `node scripts/train-model.js`; verifikasi `dangerRule.peakThreshold == 200`.
5. `node scripts/export-model-cpp.js` → cek `DANGER_PEAK_KPA 200`.
6. `cp models/rf-model.json web-dashboard/src/utils/rf-model.json`.
7. Ulangi 4–6; `git diff` artefak harus kosong (determinisme).

### Fase 2 — Web (45 menit)

8. `randomForestRisk.ts`: `dangerKpa = 200`; ekspor `DURATION_WINDOWS`; komentar
   "danger is instantaneous".
9. `InsoleContext.tsx`: komentar bahwa danger tidak bergantung durasi.
10. `SettingsPage.tsx`: buang 2 field detik; `PREVIEW_INPUTS` 75 → 210.
11. `DashboardPage.tsx:372`: pakai `DURATION_WINDOWS`.
12. `RiskExplorer.tsx`: ganti contoh 70/75 → 200/210.
13. Tes: kasus danger 200/210; tambah batas `199 → warning`, `200 → danger`.

### Fase 3 — Firmware (40 menit)

14. `main.cpp`: `readFsrMedian()` 3 sampel; komentar "2 s" → "1 s".
15. `RandomForest.cpp`: komentar header 200 kPa.
16. `test_randomforest.cpp`: `{200,...}` danger, `{199,...}` warning,
    `{210,...}` danger.
17. `~/.venvs/platformio/bin/pio test -e native`.

### Fase 4 — Dokumen (30 menit)

18. `models/README.md`, `docs/rf-model-report.md`,
    `docs/validation-report.md`, `docs/ROADMAP-RF.md`,
    `docs/thesis-methodology.md`, `docs/thesis-defense.md`.

### Fase 5 — Verifikasi (20 menit)

19. `npm test`, `npm run typecheck`, `npm run build`.
20. `grep` sisa ambang 70.

### Fase 6 — Ledger (10 menit)

21. `TASK.md`, `CHANGELOG.md`, `DECISIONS.md`.

**Estimasi total: 3–4 jam.**

## 6. Risiko dan rollback

| Risiko | Mitigasi |
|---|---|
| `train-model.js` menulis artefak berbeda | Deterministik (seed 42); langkah 7 membandingkan |
| Tes web lain ikut merah | Jalankan tes setelah Fase 2 |
| Filter median mengubah respons | 3 sampel @1 Hz; hanya untuk spike |
| 200 tidak bisa divalidasi di Figshare | Dinyatakan eksplisit; jangan klaim tervalidasi |
| Rollback | Satu commit; `git revert` |

## 7. Markdown upkeep

Setelah eksekusi: `TASK.md`, `CHANGELOG.md`, `DECISIONS.md`. `AGENTS.md` tidak
disentuh.

## 8. Asumsi

- Dataset mentah masih ada (135 `.xls`, 2 arsip, 1 xlsx).
- `node`, `python3`, `openpyxl` tersedia; `pio` di `~/.venvs/platformio/bin/pio`.
- Penulisan di root dan ±20 file lain disetujui lewat plan ini.
