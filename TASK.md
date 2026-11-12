# TASK.md

Work ledger. The agent updates this after every completed task: add a Done
entry (date + short ref), move items through In progress, and keep Next to the
five nearest items. Cap: about 30 Done entries; older months collapse into one
summary line per month.

## Done

- **2026-11-12 — Bab III + 13 diagram Mermaid.**
  `docs/bab-iii-kegiatan-pelaksanaan.md` (531 baris): 3.1 metode (Waterfall +
  CRISP-DM), 3.2 kebutuhan (13 FR, 7 NFR), 3.3 perancangan (UML, arsitektur,
  skema Firebase, flowchart, wiring, antarmuka), 3.4 model Random Forest,
  3.5 rancangan pengujian, plus 16 tabel, Lampiran A–E. `docs/diagram/` kini
  memuat 13 `.mmd` + `README.md`: nomor diurutkan ulang mengikuti urutan
  kemunculan (3.9 diagram blok, 3.10 component, 3.11 deployment, 3.12 ERD,
  3.13 flowchart sistem, 3.14 flowchart inferensi). Keputusan yang dikunci:
  ambang firmware (200 kPa) sebagai acuan sehingga Tabel 2.4 Bab II tinggal
  diubah 70 → 200 kPa (syarat 0,1 detik sudah sesuai `DANGER_SUSTAINED_RAW` = 1),
  ALERT tetap turunan tanpa node baru, 16 halaman (12 publik+pengguna, 4 admin),
  jenjang D3 dengan gelar Ahli Madya. Verifikasi: 13 berkas lolos render Kroki
  (HTTP 200), rasio gambar diukur untuk saran lebar di README, `id_language_check.py`
  bersih dari `kalimat_panjang` dan `konjungsi` (179 temuan sisa semuanya palsu:
  171 nomor subbab, 6 baris lanjutan APA, 1 frekuensi kata "data", 1 peringatan
  generik). Ekspor DOCX belum: `pandoc` tidak terpasang. (working tree)

- **2026-11-12 — Model 3D insole & pouch: OpenSCAD + gambar kerja CADCraft.**
  Folder baru `docs/3d/`: `params.md` (satu sumber angka), `build-cad.py`
  (gambar kerja 2D lewat `cadcraft-cli`: denah insole, potongan, pola pouch,
  perakitan pouch → DXF/SVG/PDF/PNG di `cadcraft/out/`), empat model OpenSCAD
  (`insole.scad` dengan mode `LIFT` dan `GHOST`, `pouch.scad`, `pouch-contents.scad`,
  `assembly.scad`), dan `build-3d.sh` yang membangun ulang semuanya: 4 gambar
  kerja, 6 render (`render/`), 2 STL (`stl/insole.stl`, `stl/pouch-shell.stl`).
  Panduan `docs/hardware-build-guide.html` mendapat lampiran `#model3d`
  (Gambar 5–9) berisi keenam render, tabel letak isi pouch, penyimpangan
  channel, dan cara membangun ulang; `docs/guidebook.html` mencatat folder
  `docs/3d/`. Asumsi yang dipakai: insole EU 42 (L 270, lebar bola 95, tumit
  62), sensor di garis tengah pada 22,5 / 52,5 / 82,5 % dari ujung depan,
  rongga pouch 65 × 80 × 20 mm. Penyimpangan yang disengaja: channel 3,5 × 1,5
  mm (panduan 3 × 1–2) karena bundel 6 inti AWG 30 berukuran Ø ± 3,2 mm;
  kedalaman total tetap 3,0 mm dengan relief 1,5 mm di bawah cover.
  Verifikasi: `./docs/3d/build-3d.sh` selesai tanpa galat, STL dilaporkan
  `Simple: yes` oleh OpenSCAD, keempat DXF lolos `cadcraft-cli info`, dan
  keenam render diperiksa satu per satu. (working tree)

- **2026-11-12 — Paket bukti model RF (`scripts/evidence.js`).**
  Generator baru menghitung ulang semua angka dari `models/training-data.json`
  dan `models/session-dataset.json`, lalu menulis `docs/evidence/` (laporan
  HTML A4, halaman konsultasi satu halaman, `metrics.json`, 12 grafik SVG +
  PNG). Model produksi tidak disentuh. Temuan yang sekarang terbukti dengan
  angka: 0/81.000 sampel mencapai 200 kPa (puncak 87,06 kPa), 31 sampel ≥70 kPa
  hanya di 3 pasien dan semuanya data latih, 0 sampel validasi ≥70 kPa
  (puncak 62,99 kPa), sehingga kelas Bahaya tidak bisa dilatih maupun
  divalidasi. Model 20 pohon ternyata 20 tunggul kedalaman 1 (60 simpul, 19
  split pada `sustained`, 1 pada `peak` 34,97 kPa) — bukti bahwa RF hanya
  menyalin aturan ambang. Uji tambahan: aturan vs pohon tunggal vs RF identik
  (macro-F1 100%), CV 5 lipatan per pasien 100% ± 0, uji ketahanan (gain ×1,2
  mengubah 22,4% keputusan, sensor midfoot mati 0,02%), dan DFN vs DM
  out-of-fold AUC 0,503 (tidak lulus gerbang 0,650; demografi 0,525).
  Dua skenario ambang (200 dan 70 kPa) dilaporkan berdampingan, termasuk
  kontrak klinis `[70 kPa, 1 s]` → Waspada (200) / Bahaya (70).
  Verifikasi: `node scripts/evidence.js` selesai tanpa galat, 12 SVG lolos
  parser XML, 12 PNG tertulis, `undefined`/`NaN` nol di kedua halaman HTML.
  (working tree)

- **2026-11-11 — Sitasi: daftar pustaka terverifikasi, 5 slot `[sitasi]` diisi.**
  Ekspor Mendeley grup TA (`docs/refs/ta.ris`, 19 entri) diurai, lalu setiap
  entri ber-DOI diperiksa ulang ke Crossref/OpenAlex. Hasilnya
  `docs/daftar-pustaka.md`: 23 entri APA 7 + audit metadata. Enam kesalahan
  ekspor dikoreksi (Najafi 2018 sebenarnya *Wound Care Management* 1(1), bukan
  JDST; DOI Ramirez-Bautista, Alali, dan Veran dilengkapi; URI Ahsan rusak;
  `e26161` di `RENCANA-PERBAIKAN.md` keliru, yang benar `10(9), e29672`). Empat
  entri yang sebelumnya belum lengkap dilengkapi: Ahmadinia 2026 (Master's
  thesis, Metropolia University of Applied Sciences, Theseus), Lapono 2024
  (*Jurnal Fisika* 9(2), 6–9), Maharani 2026 (*Jurnal Ilmiah Kesehatan Rustida*
  13(2), 168–185), Supriyatin 2023 (SNPPKM 3(1), 20–26; DOI penerbit 404 di
  doi.org, jadi dipakai URL laman artikel). Empat referensi ditambahkan di luar
  grup: Zhong dkk. 2025 (MSSDA/DFN-DS), Chinarro dkk. 2026 (dataset OptiTrack v2
  di Zenodo, DOI 10.5281/zenodo.22936249), Ngui dkk. 2025 (dataset DFU, DOI
  `10.25954/e6yc-n159`), dan Breiman 2001. `docs/thesis-methodology.md`:
  §3.2.1 → Zhong dkk. 2025, §3.2.2 → Chinarro dkk. 2026, §3.2.3 → Ngui dkk.
  2025, §3.4 → Breiman 2001, §3.9.1 → Castro-Martins dkk. 2024 (kutipan
  verbatim "below 200 kPa" diverifikasi di PMC11064085). `datasets/README.md`
  juga mengoreksi OptiTrack menjadi Zenodo (`10.5281/zenodo.22936249`) dan
  mencatat lisensi ketiga dataset.
  Verifikasi: 19 DOI resolve, `docs/README.md` diberi indeks, code fence
  seimbang, tanpa baris >90 di `thesis-methodology.md`. (working tree)

- **2026-11-11 — Panduan hardware: penyederhanaan bahasa & aturan commit besar.**
  Menulis ulang langkah-langkah di `docs/hardware-build-guide.html` (bahan/elektronik,
  potong kabel silikon 30 AWG & soldering FSR, fabrikasi insole EVA 5 mm & cover 2 mm,
  serta pouch neoprene/rubber sheet) dengan istilah praktis ramah perakit/pemula.
  Menambahkan aturan di `AGENTS.md` agar commit tidak dilakukan terlalu sering untuk
  perubahan kecil, melainkan dikumpulkan menjadi commit bermakna besar saat diminta.
  (working tree)

- **2026-11-10 — Landing: motion dan struktur ulang; konsol admin: copy error.**
  Landing pecah menjadi `components/landing/landingData.ts` (isi), `SectionIntro`
  (pembuka bagian berulang), `HowItWorks` (tiga langkah + vignette), dan
  `hooks/useLandingMotion.ts` (tiga efek); `LandingPage.tsx` tinggal komposisi.
  Motion diperluas, mesinnya CSS saja karena `shell.test.tsx` melarang
  `framer-motion` dan `index.css` sudah punya blok `prefers-reduced-motion`:
  kartu ikut `scale(0.985)`, garis pembuka bagian menggambar `scaleX` 400 md,
  eyebrow/judul/lead masuk berurutan 80/160/240 md, chip level risiko cross-fade
  180 md, skor `RiskExplorer` menghitung naik 300 md hanya saat preset diklik
  (drag slider langsung mengikuti model), sheet menu 160 md, ikon kartu ikut
  terangkat 150 md. `pagesContract.test.js` sekarang memindai
  `components/landing/*` juga, supaya ekstraksi tidak melemahkan gerbang token.
  Konsol admin: `utils/adminErrors.ts` memetakan kode Firestore/RTDB ke
  sebab + langkah berikutnya (tidak pernah mencetak pesan SDK berbahasa Inggris),
  Ringkasan memakai skeleton alih-alih `0`/tanda pisah sebagai klaim, band audit
  kosong membawa `body`, header aksi Insiden memakai kunci sendiri, role tampil
  sebagai "Admin"/"Pengguna", judul perangkat "Perangkat {id}", konfirmasi
  menyebut nama (dan role) akun yang disentuh, kegagalan mirror/audit menjadi
  satu slot peringatan (bukan "tindakan gagal"), target sentuh AdminLayout 44 px.
  Verifikasi: `npm test` 50 file / 430 tes, `tsc --noEmit`, build ke direktori
  sementara. (working tree)

- **2026-11-10 — Audit frontend: klaim landing, motion, dan konsistensi layout.**
  Landing berhenti mengklaim 10 pembacaan/detik (firmware 1 Hz), ambang bahaya
  70 kPa/0,1 dtk (mesin 200 kPa pada satu sampel), dan fitur yang sudah dihapus
  (ambang yang bisa diatur, getaran, notifikasi peramban); tile laju sampel di
  `docs/guidebook.html` ikut 1 Hz. Entrance animation di shell (250 md) dan
  stagger Dasbor (80 md/kartu) dihapus karena `DESIGN.md` melarang entrance
  animation di MOTION 1; kartu fitur landing memindahkan `data-reveal` ke
  wrapper supaya hover kembali 150 md dan shadow tidak melompat. Tombol "Simpan
  profil" kini menyimpan sungguhan: `users/<uid>.displayName` → `updateProfile`
  → state, dengan banner gagal yang jujur, dikunci 3 tes baru di
  `useAuth.test.tsx`. Label ambang Settings dipendekkan dan angka rata bawah,
  tabel admin tidak lagi scroll ganda, sel aksi Dasbor `px-6`, aria durasi
  slider membawa desimal, import `PageHeader` mati dihapus, panel statistik
  Profile memakai "Belum ada insiden tercatat". Verifikasi: `npm test` 49 file /
  426 tes, `tsc --noEmit`, build ke direktori sementara. (working tree)

- **2026-11-10 — Ambang jadi konstanta + hapus akun sungguhan.** Ambang risiko
  (35/200 kPa, 20 dtk) sekarang satu konstanta klinis di web dan firmware:
  editor Settings, override `riskThresholds.v2`, node `config/global`,
  `setGlobalConfig`/`subscribeToGlobalConfig`, halaman dan tab Konfigurasi admin
  dihapus; Settings menampilkan tiga nilai sebagai fakta. Penghapusan akun
  dipindah ke Profile (pemilik): re-auth kata sandi → hapus mirror RTDB
  (termasuk pairing) → hapus dokumen Firestore → `deleteUser`, dengan pemulihan
  profil bila langkah terakhir gagal; akun admin ditolak. Tombol Hapus di konsol
  admin dihapus, Nonaktifkan tetap. Rules `database.rules.json` dan
  `firestore.rules` di-deploy ke `sole-3b2e8`. `DESIGN.md`, `docs/AFD.md`, dan
  `web-dashboard/README.md` diselaraskan (empat tab, Settings baca saja, hapus
  akun); PRD lama `tasks/` dibiarkan sebagai riwayat. Verifikasi: `npm test` 49
  file / 423 tes, `tsc --noEmit`, build ke direktori sementara, rules
  syntax+compile lolos. (working tree)

- **2026-11-08 — Firmware flashed, boot terverifikasi.** Board ESP32-D0WD-V3
  ter-flash dan boot bersih: WiFi tersambung, `Firebase configured`,
  `RandomForest model loaded (20 trees)`, sampel live dengan transisi
  `warning`/`safe` dan buzzer. Tiga penghalang ditutup: port tidak terdeteksi
  (USB dicolok, `/dev/ttyUSB0` CP2102 `10C4:EA60`), izin (`qihh` masuk grup
  `uucp` permanen), dan port sibuk (serial monitor lama, PID 127660). Di
  `firmware/platformio.ini`: `[platformio] default_envs = esp32dev` supaya
  `pio run` tidak ikut membangun env `native` tanpa `main()`, dan
  `upload_speed` 921600 → 460800 karena 921600 gagal `Unable to verify flash
  chip connection`. Flash 83,1% (1089753 / 1310720 byte). `READY.md`
  diselaraskan (path `pio`, grup `uucp`, baud, ambang danger 200 kPa).
  Verifikasi: `pio run` SUCCESS 46,5 s, upload SUCCESS 28,9 s, log boot di
  atas. (working tree)
- **2026-11-08 — Dokumen: batas penggunaan + koreksi klaim metodologi.**
  `docs/thesis-methodology.md`: §3.3 tidak lagi mengklaim label per grup pasien
  (label sebenarnya `peak >= 35 kPa`; klausa `sustained >= 200 sampel` tidak
  pernah tercapai karena run terpanjang 30 sampel), §3.1 laju data 10 Hz
  menjadi 1 Hz, §3.4 mencatat batas yang dipelajari berimpit dengan ambang
  label, §3.5 `minSamples` 2/5 menjadi 4, §3.6 kasus kontrak 80 kPa menjadi
  199/210 kPa, §3.7 dan §3.8 memuat catatan sirkularitas, §3.9 diperluas
  menjadi indikasi, arti ambang di luar populasi, risiko negatif palsu, dan
  prasyarat pemakaian. `docs/guidebook.html` §13 mengikuti. Verifikasi: HTML
  seimbang, code fence seimbang. (working tree)
- **2026-11-08 — Model sesi DFN/DM diuji, gagal gerbang, tidak dipakai.**
  Dua skrip baru: `scripts/prepare-session-dataset.py` membangun
  `models/session-dataset.json` (135 sesi, 1 baris per pasien, 17 fitur
  tekanan), dan `scripts/train-session-model.js` melatihnya dengan 5-fold
  cross-validation berstrata. Gerbang ditetapkan sebelum melihat hasil:
  OOF AUC >= 0,65 **dan** >= AUC fitur tunggal terbaik + 0,03. Hasil: AUC 0,503,
  akurasi 60,7% (baseline mayoritas 69,6%), fitur tunggal terbaik 0,531.
  Kontrol demografi (umur/sex/durasi DM/BMI) hanya 0,525, jadi bukan pipeline
  yang rusak. `models/session-model.json` **tidak diekspor**. Mesin pohon
  diekstrak ke `scripts/lib/forest.js`; `models/rf-model.json` yang dihasilkan
  ulang identik byte-per-byte. (working tree)
- **2026-11-06 — Dokumentasi: aturan guidebook, 6 dokumen spesifikasi baru.**
  `AGENTS.md` ditambah aturan "jaga `docs/guidebook.html` tetap mutakhir pada
  perubahan material" (rules + tabel markdown upkeep; diedit atas permintaan
  pemilik). `docs/` ditambah `PRD.md`, `TRD.md`, `AFD.md`, `DBD.md`, `BSD.md`,
  `IPD.md`; `docs/README.md` dan `CHANGELOG.md` diperbarui; `guidebook.html`
  disinkronkan (struktur folder + tabel dokumen terkait). `README.md` root
  menambah indeks 6 dokumen. Bersih-bersih: `DESIGN1.md` dan `WORKFLOW.md`
  (root, duplikat/scratch, untracked) dihapus. Verifikasi: anchor
  guidebook utuh, 0 em dash, semua code fence `.md` seimbang, tautan internal
  resolve. (working tree)
- **2026-11-06 — Guidebook HTML lengkap di `docs/guidebook.html`.** Satu berkas
  mandiri (tanpa CDN) yang mengikuti token `DESIGN.md`: kanvas `#EFEFEC`, kartu
  putih, aksen sage, tanpa heks liar di komponen. Empat belas bagian untuk tiga
  audiens (dosen/pembimbing, developer, pengguna akhir): gambaran & tujuan,
  dasar teori (DM, DPN, DFU, FSR, agregasi region), arsitektur & alur data,
  metode hybrid Random Forest + aturan klinis (DFN-DS, praproses, konfigurasi,
  pita skor, kontrak klinis, metrik), cara kerja firmware & web, tech stack,
  struktur folder, mulai cepat, kontrak data & Firebase, validasi (OptiTrack,
  Figshare, edge case), troubleshooting, batasan & etika, referensi. Semua
  angka dari `rf-model-report.md`, `validation-report.md`,
  `thesis-methodology.md`, dan `randomForestRisk.ts`. Verifikasi: 14/14 anchor
  TOC cocok, tag seimbang, 0 em dash, render Chrome headless bersih di 1440px.
  Tak ada sumber web yang disentuh; `dist/` utuh. (working tree)
- **2026-11-06 — Desain Dashboard di FigCraft, 1440 + 375.** File baru
  `design/smart-insole-dashboard.figcraft`. Token `DESIGN.md` dibuat sebagai
  variabel warna bernama (koleksi "Token"), semua isian memakai `$var`, tanpa
  heks di layer. Dua artboard mengikuti komposisi `DESIGN.md` §311: header
  (brand pill, nav pill 6 tujuan, cari, lonceng, akun), hero (sapaan, tanggal,
  status berlabel teks, ekspor CSV, tandai dibaca, timeline buffer), meter band
  4 kartu dengan satu kartu terbalik untuk puncak, Station 01/02 tren + beban
  zona, Station 03 feed terbuka, Station 04 peta tekanan + legenda kPa. Ambang
  legenda diambil dari `randomForestRisk.ts` (< 35 / 35–199 / ≥ 200 kPa).
  Catatan: DM Sans dan Plus Jakarta Sans tidak terpasang dan unduhan font
  dimatikan, jadi teks memakai Inter + Fira Code (pengganti). Layar belum
  diverifikasi di browser. Tak ada sumber web yang disentuh, `dist/` utuh.
  (working tree)
- **2026-11-05 — Konsol admin dipisah dari aplikasi pengguna.** `/admin/*`
  memakai `AdminLayout` + `RequireAdmin`: lima tab (Ringkasan, Pengguna,
  Perangkat, Insiden, Konfigurasi), tanpa nav pill, bell, pencarian, atau alert
  modal. `AdminPage.tsx` dihapus. Fitur baru: penegakan `active` (Firestore +
  mirror RTDB + blokir rute + rules), manajemen role dengan anti self-demotion
  dan proteksi admin terakhir, pairing perangkat, armada `/devices`, audit log
  `/audit`, retensi riwayat dengan arsip JSON, dan triase insiden `/triage`.
  `npx vitest run` 48 file / 421 tes, `tsc`, build; `dist/` dikembalikan.
  (working tree)
- **2026-11-05 — Telemetri per-perangkat + editor ambang disembunyikan.**
  Firmware menulis ke `devices/<DEVICE_ID>/readings/{latest,history}`; web
  membaca perangkat yang dipasangkan admin di `users/<uid>/devices`, dengan
  fallback ke `/readings` selama firmware lama masih jalan. Rules baru: reading
  perangkat hanya untuk pemilik, user boleh membaca node `users/<uid>` sendiri.
  Akun non-admin tidak lagi melihat editor ambang sama sekali, hanya dua nilai
  sebagai fakta. Override lokal pindah ke `riskThresholds.v2` agar nilai 70 kPa
  lama tidak bertahan. `npx vitest run` 47 file / 418 tes, `tsc`, build;
  `dist/` dikembalikan. (working tree)
- **2026-11-05 — Akses akun pengguna dijujurkan.** Ambang klinis hanya bisa
  diubah admin; pengguna melihat nilai aktif, field terkunci, dan alasannya.
  Kartu izin notifikasi browser dihapus karena tidak ada pengirim notifikasi
  (`new Notification` nol di `src/`). Tandai-dibaca disimpan di localStorage
  sehingga tidak muncul lagi setelah reload. Ringkasan riwayat menyebut
  "jendela perangkat" saat snapshot terpotong. `npx vitest run` 47 file / 416
  tes, `tsc --noEmit`, build; `dist/` dikembalikan. (working tree)
- **2026-11-05 — Lonceng jadi dialog, Notifikasi masuk Pengaturan.** Bell di
  header desktop dan bar mobile membuka `AlertBell` (dialog ringkas: insiden
  terbaru, status koneksi, tandai dibaca, tautan ke Pengaturan) dengan Escape,
  klik luar, dan fokus kembali ke tombol. Kartu izin browser dan status koneksi
  pindah ke `SettingsPage`; `/notifications` jadi redirect ke `/settings`.
  `npx vitest run` 46 file / 412 tes, `tsc --noEmit`, build; `dist/`
  dikembalikan. (working tree)
- **2026-11-05 — Halaman Riwayat: filter, urut, header lengket.** H-02 filter
  level (Semua/Bahaya/Waspada, `aria-pressed`), H-03 urut kolom Waktu
  (`aria-sort`, default terlama), H-04 `GlassTable maxHeight` dengan header dan
  kolom Waktu beku. Summary tetap menghitung seluruh register; filter kosong
  memakai `StatePanel`. `npx vitest run` 46 file / 414 tes, `tsc --noEmit`,
  build; `dist/` dikembalikan. (working tree)
- **2026-11-05 — Riwayat: batas render + "muat lebih banyak".** Halaman Riwayat
  kini menggambar 20 baris per halaman (PAGE_SIZE), tombol "Muat lebih banyak"
  menambah 20, dan baris keterangan "Menampilkan X dari Y insiden" selalu
  tampil. Ringkasan dan ekspor CSV tetap melihat seluruh register. Kalau
  snapshot perangkat menyentuh `STORED_HISTORY_LIMIT` (200), halaman
  mengakuinya lewat catatan pembatas. 407 tes web (dari 401), typecheck
  bersih, build lolos, `dist/` dikembalikan. (working tree)
- **2026-11-05 — Riwayat insiden bertahan setelah refresh.** Halaman Riwayat
  kini membaca `readings/history` lewat `subscribeToHistory` (sebelumnya tak
  dipanggil siapa pun) dan menyusunnya ulang jadi register insiden di
  `src/utils/incidents.ts`. Register tersimpan dipisah dari `incidentLogs`
  live supaya modal alert tidak muncul lagi saat refresh. Maks 200 baris
  terakhir; insiden = transisi level, bukan tiap sampel; verdict device menang.
  401 tes web (dari 384), typecheck bersih, build lolos, `dist/` dikembalikan
  ke versi commit. (working tree)
- **2026-11-05 — Ambang danger 200 kPa + audit fixes.** Danger naik dari 70
  menjadi 200 kPa (Castro-Martins dkk., Heliyon 2024) dengan satu sumber angka:
  `train-model.js` → `models/rf-model.json` → header C++ dan salinan web. Turut
  ditutup: filter median 3 sampel di ADC firmware, bug count leaf pada fallback
  `train-model.js`, clip class weight 10x, kontrol durasi mati di Settings, dan
  `train-model.js` yang menimpa laporan model. Dokumen diselaraskan (model,
  validasi, roadmap, bab III, slide). `npm test` 384 tes, typecheck, build,
  `pio test -e native` 13/13. (working tree)
- **2026-11-04 — Random Forest only, fuzzy removed.** Deleted
  `fuzzyRisk.ts` and its test; `RISK_THRESHOLDS`, `SCORE_BANDS`, and
  `alignScoreToLevel` moved into `randomForestRisk.ts`. Wire field
  `fuzzy_risk_score` renamed to `risk_score` in firmware, types, and realtime
  mapper. Removed the RF-vs-fuzzy agreement metric from docs; RF accuracy and
  clinical contract remain. 383 web tests pass, typecheck clean, build ok,
  `pio test -e native` 13/13, `dist/` untouched. (working tree)
- **2026-11-03 — Telemetry live from the ESP32.** After the hotspot moved from
  5 GHz to 2,4 GHz (ESP32-WROOM-32 has no 5 GHz radio), the board joined
  `hiqaffyed`, printed `Firebase configured`, and `firebase database:get`
  showed `readings/latest` advancing every 2 s with 80 history rows. One
  transient push failure at boot recovered on its own. (working tree)
- **2026-11-03 — Firmware build and flash verified locally.** PlatformIO 6.2.0
  installed in `~/.venvs/platformio`; `pio test -e native` 13/13, `pio run
  -e esp32dev` ok, image flashed to ESP32-D0WD-V3 (`80:f3:da:5c:c9:28`); serial
  shows boot, model load, and live FSR readings. Telemetry still blocked:
  `config.h` carries the template placeholders. (working tree)
- **2026-11-03 — Markdown upkeep rule.** `AGENTS.md` gained a mandatory
  *Markdown upkeep check*: after every task the agent asks which root `.md`
  files need updating, naming candidates. Living files (`TASK.md`,
  `CHANGELOG.md`, `READY.md`, `DECISIONS.md`) are checked every time; frozen
  files (`AGENTS.md`, `DESIGN.md`, `README.md`, `docs/**`, `tasks/**`) are only
  offered when the task touches what they own. Definition of done gained item
  6. Docs gate passes; no code touched. (working tree)
- **2026-11-03 — One content width.** Device, Settings, Profile, Notifications
  and Admin dropped their own `max-w-3xl`/`max-w-5xl` + `mx-auto` caps, so their
  cards match the 1400px column the nav pill sits in; the freed width went into
  content (threshold form 4 columns from `xl`, Profile fields side by side from
  `sm`, device fact rows label/value from `sm`, prose on `max-w-prose`).
  `DESIGN.md` gained the rule, `DECISIONS.md` ADR-006. 430 tests pass,
  typecheck clean, build ok, `dist/` untouched. (working tree)
- **2026-11-02 — Tests under the type checker.** All 28 `*.test.jsx` renamed to
  `*.test.tsx` so `tsc --noEmit` covers them for the first time (334 errors
  fixed, none by assertion change). `a11y.test.tsx` now sweeps `.jsx` and
  `.tsx` alike, so the outline gate keeps covering the screens; `main.tsx`
  imports `./App` without the stale extension. 430 tests pass, typecheck clean,
  build ok, `dist/` unchanged. (`21235c5b`)
- **2026-11-02 — Data and model provenance.** `datasets/README.md` and
  `models/README.md` document source, licence, schema, and regeneration;
  `rf-model.json` carries a generated `provenance` block; `rf-modelSync.test.js`
  fails if the web copy drifts; `prepare-dataset.py` label/split comments
  corrected (no `danger` samples exist). 430 tests pass. (`1d51b262`)
- **2026-11-02 — Fase 3 validation.** OptiTrack gait check (310 recordings, 902
  stance phases, heel-before-forefoot 99,9%), Figshare DFU thresholds (1.296
  measurements, 1,4% >= 70 kPa), edge cases, and 90,72% RF-vs-rule agreement on
  81.000 samples. New `scripts/validate-datasets.py`,
  `web-dashboard/src/utils/riskAgreement.test.js`, and
  `docs/validation-report.md`. (working tree)

- **2026-11-02 — Fase 6 documentation.** `DESIGN.md` now states the DFN-DS
  training set and the 20x8 forest; added `docs/thesis-methodology.md` (Bab III
  draft) and `docs/thesis-defense.md` (slides 6.3 + demo script 6.4). Roadmap
  checkboxes updated. (working tree)

- **2026-11-02 — Ledger and changelog sync.** Recorded the agent-docs commit
  hash, added the `[Unreleased]` Fixed entries for the audit cleanup, and named
  the Storage-bucket gap in `READY.md`. (working tree)

- **2026-11-01 — Agent documentation.** Created `AGENTS.md`, `READY.md`,
  `TASK.md`, `CHANGELOG.md`, `DECISIONS.md`; linked them from `README.md`.
  (`3d0e97f6`)
- **2026-11-01 — Documentation restructure.** Aligned 8 markdown files with the
  real tree; fixed broken fences, stale paths, stale roadmap checkboxes.
  (`70afbb94`)
- **2026-11-01 — TypeScript migration (web).** Utils/services/i18n,
  contexts/hooks, UI primitives, components/pages, `feedbackState`, test
  environment shim. (`4978dbf0`, `29255cdc`, `fde894d2`, `3004f608`,
  `a6a84e3b`, `375267a6`)
- **2026-11-01 — Firmware fixes.** Dropped unused `subscribeToBattery` from
  `firebaseRealtime.ts`; fixed stale comment in `firmware/src/main.cpp`
  referencing a removed `.js` file. `pio run -e esp32dev` succeeds (run outside
  this machine; `pio` is absent locally). (`e193064e`)
- **2026-11-01 — Audit Tier 2/3.** Removed dead `subscribeToBattery`; firmed
  firmware wire-comment; no speculative debt remains beyond the pre-existing
  scratch page and 28 `.jsx` test files kept on purpose. (`e193064e`)
- **2026-11-01 — Firmware.** Local alarm and Firebase telemetry upload; native
  unit tests build and run; telemetry pushed at the sampling cadence.
  (`5fc266b7`, `b08c4086`, `f049de18`)
- **2026-11-01 — Risk engine.** Configurable peak thresholds, paired verdicts,
  true sustained durations. (`855426bf`)
- **2026-11-01 — Admin and contracts.** AdminPage survives a hard refresh at
  `/admin`; typed firmware-dashboard data contract. (`2b2409f7`, `63cc40a7`)
- **2026-11-01 — Firebase rules.** Versioned RTDB, Firestore, and Storage
  rules. (`b9b83c44`)
- **2026-10-30 — Auth and motion.** Email verification flow, forgot password,
  framer motion on landing and dashboard. (`35133e39`)

## In progress

- **Web live check** — RTDB already carries fresh data (`readings/latest` plus
  80 history rows); the dashboard needs a refresh to confirm it leaves `error`
  and settles on `live`.

## Next

1. **Uji hapus akun** — buat akun uji, hapus dari Profile dengan kata sandi,
   lalu pastikan login gagal `auth/user-not-found`; dokumen Firestore dan mirror
   `users/<uid>` harus hilang.
2. **Pairing** — pasangkan device ke akun
   (`firebase database:set /users/<uid>/devices/insole-01 true`). Firmware
   sudah ter-flash dan menulis ke `devices/<DEVICE_ID>/readings`; tanpa
   pairing dashboard tidak menemukan perangkatnya.
3. **Kalibrasi sensor** — `ADC_OFFSET`/`ADC_TO_KPA` di `config.h` masih nilai
   template, jadi bacaan tanpa beban melompat 0–125 kPa. Ikuti prosedur di
   `docs/HARDWARE-SPEC.md`, lalu catat konstanta hasil kalibrasi.
4. **Thesis docs** — klaim metodologi sudah dikoreksi 2026-11-08 dan sitasi
   2026-11-11. Sisa: subbab hasil negatif model sesi (OOF AUC 0,503, kontrol
   demografi 0,525) sebagai alasan memilih Bentuk 1 — angkanya sudah tersedia
   di `docs/evidence/metrics.json` dan narasinya di
   `docs/evidence/hasil-pengujian-model.html`; lalu render slide, dan angkat
   `docs/HARDWARE-SPEC.md` dari Draft setelah perangkat divalidasi.
5. **Riwayat RTDB tumbuh tanpa batas** — firmware push 1 Hz, node
   `readings/history` tak pernah dibersihkan; putuskan retensi/arsip.

> Update rule: Done entries carry a date and a commit hash or `(working tree)`.
> Keep entries short — detail belongs in the commit message or `CHANGELOG.md`.
