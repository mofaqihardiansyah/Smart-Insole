# TASK.md

Work ledger. The agent updates this after every completed task: add a Done
entry (date + short ref), move items through In progress, and keep Next to the
five nearest items. Cap: about 30 Done entries; older months collapse into one
summary line per month.

## Done

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

1. **Deploy rules** — `firebase deploy --only database`, lalu uji satu akun
   non-admin dan satu admin. Rules kini menolak `active === false` dan memberi
   admin baca `/devices`, `/audit`, `/triage`.
2. **Pairing** — pasangkan device ke akun
   (`firebase database:set /users/<uid>/devices/insole-01 true`). Firmware
   sudah ter-flash dan menulis ke `devices/<DEVICE_ID>/readings`; tanpa
   pairing dashboard tidak menemukan perangkatnya.
3. **Kalibrasi sensor** — `ADC_OFFSET`/`ADC_TO_KPA` di `config.h` masih nilai
   template, jadi bacaan tanpa beban melompat 0–125 kPa. Ikuti prosedur di
   `docs/HARDWARE-SPEC.md`, lalu catat konstanta hasil kalibrasi.
4. **Thesis docs** — klaim metodologi sudah dikoreksi 2026-11-08. Sisa: subbab
   hasil negatif model sesi (OOF AUC 0,503, kontrol demografi 0,525) sebagai
   alasan memilih Bentuk 1, isi semua `[sitasi]` (§3.9.1 ambang 200 kPa belum
   punya rujukan), render slide, dan angkat `docs/HARDWARE-SPEC.md` dari Draft
   setelah perangkat divalidasi.
5. **Riwayat RTDB tumbuh tanpa batas** — firmware push 1 Hz, node
   `readings/history` tak pernah dibersihkan; putuskan retensi/arsip.

> Update rule: Done entries carry a date and a commit hash or `(working tree)`.
> Keep entries short — detail belongs in the commit message or `CHANGELOG.md`.
