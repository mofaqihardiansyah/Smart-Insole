# PRD: Firebase Live Integration, Monitoring & Admin

## 1. Introduction/Overview

Dashboard Smart Insole IoT saat ini berjalan penuh dengan **mock/simulator** — semua data tekanan, baterai, dan riwayat dihasilkan di sisi client. Produk nyata butuh data dari perangkat keras (ESP32) yang mengirim pembacaan tekanan telapak kaki ke Firebase Realtime Database.

PRD ini mencakup tiga fitur yang saling terkait:

1. **Firebase RTDB Live Integration** — ganti simulator dengan data realtime dari ESP32
2. **Monitoring Page** — grafik tren 3 sensor (forefoot/midfoot/heel) secara live + riwayat sesi
3. **Admin Panel** — kelola pengguna, konfigurasi global, dan monitoring perangkat

## 2. Goals

- Data tekanan realtime dari ESP32 tampil di dashboard tanpa refresh
- Grafik tren 3 sensor dapat dibaca untuk analisis jangka pendek dan panjang
- Admin dapat mengelola pengguna dan perangkat tanpa menyentuh kode atau database
- Sistem tetap ramah untuk pengguna lansia dan aksesibel (WCAG AA)

## 3. User Stories

### US-001: ESP32 menulis data ke Firebase RTDB

**Description:** Sebagai perangkat ESP32, saya mengirim data pembacaan tekanan ke Firebase Realtime Database setiap detik agar dashboard menampilkan data secara realtime.

**Acceptance Criteria:**
- [ ] ESP32 menulis ke path `readings/{uid}` dengan struktur: `{ forefoot, midfoot, heel, timestamp }`
- [ ] ESP32 menulis ke path `devices/{uid}/status` dengan struktur: `{ battery, firmware, lastSeen, online }`
- [ ] Data dibaca oleh web dashboard menggunakan Firebase Realtime Database SDK
- [ ] Koneksi Firebase menggunakan konfigurasi yang sudah ada di `firebaseConfig.js`
- [ ] Rules RTDB memperbolehkan user membaca data miliknya sendiri

### US-002: Dashboard menampilkan data live

**Description:** Sebagai pasien, saya ingin melihat tekanan telapak kaki saya secara realtime agar tahu kondisi kaki saya sekarang.

**Acceptance Criteria:**
- [ ] Halaman Dashboard membaca dari `readings/{uid}` via Firebase SDK
- [ ] Angka tekanan (forefoot/midfoot/heel) update otomatis tanpa refresh
- [ ] Status koneksi menunjukkan "Live" atau "Simulator" secara jelas
- [ ] Jika Firebase tidak terhubung, fallback ke simulator dengan label "Simulasi" yang terlihat
- [ ] `npm test` passes
- [ ] Verify in browser using dev-browser skill

### US-003: Halaman Monitoring — grafik tren live

**Description:** Sebagai pasien, saya ingin melihat grafik tren tekanan 3 sensor secara live agar dapat melihat pola tekanan dalam 30-60 detik terakhir.

**Acceptance Criteria:**
- [ ] Grafik menampilkan 3 garis: Forefoot, Midfoot, Heel (menggunakan warna Okabe-Ito yang sudah ada)
- [ ] Data live mengalir setiap detik dari RTDB
- [ ] Rolling window 30-60 detik (data lama terhapus otomatis dari memori)
- [ ] Threshold line (batas aman/waspada) terlihat di grafik
- [ ] Label legenda menggunakan warna ink, bukan warna series
- [ ] SVG chart sudah ada (`TelemetryChart.jsx`) — reuse dan adaptasi
- [ ] `npm test` passes
- [ ] Verify in browser using dev-browser skill

### US-004: Halaman Monitoring — riwayat sesi

**Description:** Sebagai pasien, saya ingin melihat riwayat sesi pemantauan sebelumnya untuk memantau perkembangan kaki dari waktu ke waktu.

**Acceptance Criteria:**
- [ ] Riwayat sesi tersimpan di RTDB path `history/{uid}/{sessionId}`
- [ ] User dapat memilih sesi sebelumnya dari daftar
- [ ] Grafik menampilkan data historis sesi yang dipilih
- [ ] Tabel ringkasan sesi: tanggal, durasi, tekanan rata-rata, status risiko
- [ ] Tombol Export CSV berfungsi dengan data historis
- [ ] `npm test` passes
- [ ] Verify in browser using dev-browser skill

### US-005: Admin — kelola pengguna

**Description:** Sebagai admin, saya ingin mengelola akun pengguna agar dapat menonaktifkan akun yang tidak aktif atau menghapus akun yang tidak diinginkan.

**Acceptance Criteria:**
- [ ] Admin dapat melihat daftar semua pengguna (nama, email, status, tanggal daftar)
- [ ] Admin dapat menonaktifkan / mengaktifkan akun pengguna
- [ ] Admin dapat menghapus akun pengguna (dengan dialog konfirmasi)
- [ ] Peran admin disimpan di `users/{uid}/role` di Firestore atau RTDB
- [ ] Hanya user dengan role admin yang dapat mengakses halaman Admin
- [ ] `npm test` passes
- [ ] Verify in browser using dev-browser skill

### US-006: Admin — konfigurasi global

**Description:** Sebagai admin, saya ingin mengatur ambang batas risiko default yang berlaku untuk semua pengguna agar standar peringatan konsisten.

**Acceptance Criteria:**
- [ ] Admin dapat mengubah batas aman (default 30 kPa) dan batas waspada (default 70 kPa)
- [ ] Perubahan config tersimpan di path `config/global` di RTDB
- [ ] Semua user membaca threshold global ini sebagai default
- [ ] User tetap bisa menyesuaikan threshold个人 (di Settings)
- [ ] `npm test` passes
- [ ] Verify in browser using dev-browser skill

### US-007: Admin — monitoring perangkat

**Description:** Sebagai admin, saya ingin melihat status semua perangkat insole yang terdaftar agar dapat mendeteksi perangkat offline atau baterai rendah.

**Acceptance Criteria:**
- [ ] Admin dapat melihat daftar semua perangkat (ID perangkat, user, baterai, firmware, status online/offline, last seen)
- [ ] Perangkat offline ditandai dengan badge dan warna yang jelas
- [ ] Baterai rendah (<20%) mendapat peringatan visual
- [ ] `npm test` passes
- [ ] Verify in browser using dev-browser skill

## 4. Functional Requirements

### Firebase RTDB Integration

- FR-1: ESP32 mengirim data pembacaan ke `readings/{uid}` dengan struktur JSON: `{ "forefoot": <float>, "midfoot": <float>, "heel": <float>, "timestamp": <unix_ms> }`
- FR-2: ESP32 mengirim status perangkat ke `devices/{uid}/status`: `{ "battery": <int>, "firmware": "v<X.Y.Z>", "lastSeen": <unix_ms>, "online": <bool> }`
- FR-3: Web dashboard membaca `readings/{uid}` menggunakan `onValue` dari Firebase SDK
- FR-4: Web dashboard membaca `devices/{uid}/status` untuk menampilkan baterai dan status koneksi
- FR-5: Riwayat sesi disimpan di `history/{uid}/{sessionId}`: `{ "startTime": <unix_ms>, "endTime": <unix_ms>, "samples": [...] }`
- FR-6: Konfigurasi global disimpan di `config/global`: `{ "safeThreshold": 30, "dangerThreshold": 70 }`
- FR-7: Rules RTDB: user hanya bisa baca/tulis path miliknya sendiri; admin bisa baca semua

### Monitoring Page

- FR-8: Grafik tren menampilkan 3 series (forefoot, midfoot, heel) sebagai SVG polyline
- FR-9: Data live mengalir setiap detik dengan rolling window 30-60 detik
- FR-10: Threshold line ditampilkan sebagai garis horizontal dengan label
- FR-11: User dapat memilih sesi historis dari daftar riwayat
- FR-12: Grafik historis menampilkan semua sample dari sesi yang dipilih
- FR-13: Tabel ringkasan sesi menampilkan: tanggal, durasi, tekanan rata-rata per sensor, status risiko dominan
- FR-14: Tombol Export CSV mengunduh data sesi dalam format CSV

### Admin Panel

- FR-15: Halaman Admin hanya dapat diakses user dengan `role: "admin"` di Firestore
- FR-16: Daftar pengguna menampilkan: nama, email, status (aktif/nonaktif), tanggal daftar, jumlah perangkat
- FR-17: Admin dapat menonaktifkan akun (set `users/{uid}/active: false`) dengan dialog konfirmasi
- FR-18: Admin dapat menghapus akun (hapus data user dari Firestore dan RTDB) dengan dialog konfirmasi
- FR-19: Admin dapat mengubah threshold global dan perubahan langsung berlaku untuk semua user baru
- FR-20: Daftar perangkat menampilkan semua entry di `devices/*` dengan info user, baterai, firmware, status, last seen
- FR-21: Perangkat dengan `online: false` atau `lastSeen > 5 menit` ditandai "Offline"
- FR-22: Baterai < 20% mendapat badge peringatan kuning; < 10% badge merah

## 5. Non-Goals (Out of Scope)

- Tidak ada fitur registrasi admin (admin ditambahkan manual via Firestore console)
- Tidak ada fitur reset password dari admin
- Tidak ada fitur notifikasi push dari admin ke user
- Tidak ada fitur laporan PDF
- Tidak ada fitur manajemen firmware OTA (over-the-air update)
- Tidak ada fitur chat antara admin dan pasien
- Tidak ada fitur audit log aktivitas admin
- Firmware ESP32 tidak diubah dalam PRD ini (asumsi ESP32 sudah mengirim data dengan struktur yang benar)

## 6. Design Considerations

- **Design system:** Verdana Health (navy `#0F172A`, sage `#059669`, white cards, 8px radius, diffused shadows)
- **Aksesibilitas:** WCAG AA minimum; risk status selalu pakai icon + text + warna (bukan warna saja)
- **Responsive:** Mobile-first; grafik harus readable di layar 360px
- **Bilingual:** Semua label mendukung ID/EN via `t()` dictionary
- **Existing components yang di-reuse:**
  - `TelemetryChart.jsx` — SVG polyline chart, sudah ada, perlu adaptasi untuk live data
  - `GlassCard`, `GlassButton`, `GlassInput`, `StatusChip` — sudah ada, tinggal pastikan warna konsisten
  - `firebaseRealtime.js` — sudah ada, perlu ekspansi untuk reads history dan admin queries
  - `i18n.js` — tambahkan kunci terjemahan baru untuk halaman Admin dan Monitoring

## 7. Technical Considerations

- **Firebase SDK:** Sudah terpasang (`firebase` package), gunakan `firebase/database` untuk RTDB
- **Autentikasi admin:** Gunakan custom claims atau flag `role` di Firestore `users/{uid}`
- **Performance:** Rolling window 30-60 detik mencegah memory leak; data historis di-fetch hanya saat dipilih
- **Security rules:** RTDB rules harus memastikan user hanya bisa akses data miliknya; admin bypass via `role == "admin"`
- **Offline handling:** Jika Firebase tidak terhubung, fallback ke simulator dengan label "Simulasi" yang jelas
- **Testing:** Test Firebase integration dengan mock transport (pola yang sudah ada di `InsoleContext.test.jsx`)

## 8. Success Metrics

- Data live dari ESP32 tampil di dashboard dengan latency < 2 detik
- Grafik monitoring dapat dimengerti oleh pasien tanpa pelatihan (uji dengan 3+ pengguna lansia)
- Admin dapat menonaktifkan akun dalam < 3 klik
- Tidak ada error console terkait Firebase di production
- `npm test` passes 100%
- `npm run build` sukses

## 9. Open Questions — Decisions

1. **Batas sesi historis:** Ya — maksimal 90 hari, hapus otomatis sesi yang lebih tua. (FR tambahan: scheduled function atau cleanup saat query)
2. **Admin melihat detail pasien:** Ya — admin dapat membuka dashboard individual pasien secara detail (read-only), dengan akses log.
3. **Force disconnect perangkat:** Tidak perlu — di luar scope untuk proyek ini.
4. **Penunjukan admin pertama:** Assignment manual oleh developer via Firebase console atau Admin SDK script. Role disimpan di `users/{uid}/role` (Firestore) dan dicek saat akses halaman Admin. Tidak ada self-service admin. Ini pilihan paling aman untuk skala proyek ini — role tidak pernah ditentukan client-side.

## 10. ML Method: Random Forest (replaces Fuzzy Logic)

The risk classifier is a **Random Forest**, replacing the fuzzy logic
inference. Rationale: fuzzy membership functions are hand-tuned heuristics;
the forest learns the decision boundary from data.

**Training data:**
- **DFN-DS** (`/tmp/opencode/datasets/DFN-DS/`): 135 diabetes patients, 8 FSR
  sensors per foot, continuous walking recordings, binary label
  DFN (neuropathy, high risk) vs DM (no neuropathy). The clinical source
  of truth.
- **Figshare DFU offloading** (`figshare_dfu.xlsx`): peak plantar pressure
  and pressure-time integrals per foot region across offloading modalities.
  Used to justify the clinical thresholds.
- **OptiTrack v2** (`InsolesOpitrackDataset_v2.zip`, kept in repo root):
  dynamic gait plantar pressure. Used for gait-phase validation only.

**Excluded datasets** (different task, not usable for this classifier):
footanalytic (static 32x32), tg0uk (GRF estimation), CAPPIMU (activity
recognition), FSR_DATASET_FV (valgus only), Footscan (flatfoot norms).

**Training pipeline:**
1. Aggregate DFN-DS 8 sensors/foot into 3 regions (forefoot, midfoot,
   heel) matching the insole layout.
2. Derive per-sample features: peak pressure + sustained duration per region.
3. Label: DFN -> danger, DM -> safe/warning (split by duration threshold).
4. Train Random Forest (trees, Gini impurity, bootstrap), validate against
   OptiTrack gait patterns and Figshare thresholds.
5. Export model for inference (web dashboard and/or ESP32 firmware).

**Deliverable:** `randomForestRisk.js` inference module (web) and
`RandomForest.cpp` (ESP32 firmware), with the clinical contract asserted by
tests (a 40 kPa reading must never be "safe").
