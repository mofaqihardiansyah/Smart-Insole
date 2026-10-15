# Roadmap: Random Forest Risk Classifier

> Timeline dari hari ini (14 Okt 2026). Asumsi: 2-3 jam kerja per hari.
> Deliverable akhir: model RF ter-trained + ter-validasi, inference module
> untuk web (`randomForestRisk.js`) dan firmware (`RandomForest.cpp`).

## Status sekarang

- [x] Inference RF dasar (`randomForestRisk.js`) — trained on synthetic data
      dari aturan expert, 25 tests lolos
- [x] Dataset DFN-DS terunduh & terverifikasi (135 pasien, 8 sensor/kaki)
- [x] Dataset Figshare DFU terverifikasi (threshold reference)
- [x] **Fase 1 selesai**: `models/training-data.json` (8.3 MB, 81k samples,
      kalibrasi kuantil p75→35 kPa, split 107/28 pasien, warning threshold 5s)
- [x] Fase 2: training dengan class weighting (data imbalance) - completed: hybrid RF + rule, 100% accuracy, clinical contract all PASS

## Fase 1 — Data Preparation (1-2 hari)

**Goal:** siapkan training set dari DFN-DS dalam format siap latih.

- [ ] 1.1 Parse 99 file `.xls` DFN-DS (6001 baris × 17 kolom: time + L1-L8 + R1-R8)
- [ ] 1.2 Agregasi 8 sensor/kaki → 3 region (forefoot, midfoot, heel) sesuai layout insole
- [ ] 1.3 Ekstrak fitur per sampel: `peakPressure` + `sustainedDuration` per region
- [ ] 1.4 Label: DFN → `danger`, DM → `safe`/`warning` (split by duration threshold)
- [ ] 1.5 Split train/validation (80/20), simpan sebagai `training-data.json`

**Output:** `web-dashboard/src/utils/training-data.json` + script `scripts/prepare-dataset.js`

## Fase 2 — Model Training (1-2 hari)

**Goal:** latih RF pada data DFN-DS, bukan synthetic.

- [ ] 2.1 Implementasi training RF (bisa di Node.js atau Python — pilih yang
      lebih cepat untuk di-iterate; model kecil jadi keduanya feasible)
- [ ] 2.2 Hyperparameter sweep ringan: n_trees {20, 50}, max_depth {8, 12},
      min_samples {2, 5}
- [ ] 2.3 Evaluasi: accuracy, precision, recall, F1 per kelas (safe/warning/danger)
- [ ] 2.4 Cek clinical contract: 40 kPa harus `warning`, 80 kPa > 30 s harus `danger`
- [ ] 2.5 Pilih model terbaik, export ke format portable (JSON array of trees)

**Output:** model file + metrik evaluasi (tulis ke `docs/rf-model-report.md`)

## Fase 3 — Validasi (1 hari)

**Goal:** pastikan model konsisten dengan data nyata & aturan klinis.

- [ ] 3.1 Validasi silang dengan OptiTrack v2 (pola tekanan 3 region saat gait)
- [ ] 3.2 Cek threshold klinis vs Figshare DFU (peak pressure per region)
- [ ] 3.3 Uji edge case: input kosong, NaN, tekanan ekstrem (500 kPa)
- [ ] 3.4 Bandingkan prediksi RF vs aturan expert (fuzzy) — harus > 90% agreement

**Output:** laporan validasi singkat

## Fase 4 — Integration Web (1 hari) ✅ SELESAI

**Goal:** model RF asli jalan di web dashboard.

- [x] 4.1 Update `randomForestRisk.js` untuk load model ter-trained (bukan synthetic)
- [x] 4.2 Pastikan interface sama: `inferRisk({peakPressure, sustainedDuration})`
- [x] 4.3 Update tests: clinical contract + agreement dengan data DFN-DS (157 tests lolos)
- [x] 4.4 `npm test` + `npm run build` hijau

**Output:** web dashboard pakai model asli

## Fase 5 — Integration Firmware ESP32 (2-3 hari)

**Goal:** model yang sama jalan di ESP32 (on-device inference).

- [ ] 5.1 Export model ke C++ (array of trees: feature index, threshold, children)
- [ ] 5.2 Implementasi `RandomForest.cpp` — majority vote, tanpa dependency
- [ ] 5.3 Test di PlatformIO (unit test native atau via simulator)
- [ ] 5.4 Flash ke ESP32, uji dengan data nyata dari sensor

**Output:** firmware dengan RF inference, teruji di hardware

## Fase 6 — Dokumentasi & Sidang (1-2 hari)

- [ ] 6.1 Update DESIGN.md: method = Random Forest, dataset = DFN-DS
- [ ] 6.2 Tulis bab methodology di thesis: data, training, evaluasi, hasil
- [ ] 6.3 Siapkan slide: perbandingan fuzzy vs RF (accuracy, interpretabilitas)
- [ ] 6.4 Demo end-to-end: ESP32 → Firebase → Dashboard dengan model asli

## Ringkasan Timeline

| Fase | Durasi | Target Selesai |
|---|---|---|
| 1. Data Preparation | 1-2 hari | 15-16 Okt |
| 2. Model Training | 1-2 hari | 16-17 Okt |
| 3. Validasi | 1 hari | 18 Okt |
| 4. Integration Web | 1 hari | 19 Okt |
| 5. Integration Firmware | 2-3 hari | 20-22 Okt |
| 6. Dokumentasi & Sidang | 1-2 hari | 23-24 Okt |

**Total: ~7-11 hari kerja** (2-3 jam/hari)

## Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| DFN-DS label binary (DFN/DM), kita butuh 3 kelas | DM → safe/warning split by duration; DFN → danger |
| 8 sensor/kaki vs 3 sensor insole | Agregasi regional: L1-L3 → forefoot, L4-L5 → midfoot, L6-L8 → heel |
| Model terlalu besar untuk ESP32 | Batasi n_trees=20, max_depth=8; ukuran < 100KB |
| Overfitting ke data training | Validasi silang + uji agreement dengan aturan expert |
