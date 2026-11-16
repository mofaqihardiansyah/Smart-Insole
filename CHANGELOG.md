# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Five classifiers from five different journals (decision tree, ANN/MLP, SVM,
  AdaBoost, fuzzy cognitive map) are compared against Random Forest on the same
  patient-grouped folds. `scripts/export-folds.js` exports the fold assignment
  from `train-model.js`, and `scripts/compare-models.py` trains the models with
  scikit-learn via `uv`, selects each decision threshold on the training fold,
  and writes a twelve-section report with eleven charts to
  `docs/evidence/perbandingan/`. On clean data every model reaches macro-F1
  0.995-1.000; under a calibration gain sweep they fall together, and the rule
  baseline reproduces the previous evidence pack exactly.
- `docs/hardware-build-guide.html` §00 **"Posisi pekerjaan & sisa langkah"**:
  two cards separating what is already built (cut EVA, marked sensor points,
  glued pouch shell) from what is not, plus an eight-step order that links to
  the existing sections.
- §07 now explains how to carve: measure the sensor body instead of copying
  `14 × 14 mm`, stop the blade at 1 mm with masking-tape depth stops, score the
  outline before scooping, cut a 6 mm tail notch, and run a 3–3.5 mm wide by
  2–2.5 mm deep channel entirely in the 5 mm base. It also documents the
  no-pocket alternative, the 12-hour cover clamp, and the before/after-glue
  tests. A deviation callout marks the 3D appendix and `docs/3d/params.md` as
  illustrative.
- §08 gains cleaning before bonding, the Fox contact-cement procedure (thin
  coats on both faces, 5–10 minutes to tack, 30–60 minute clamp, 24 hours to
  full strength, no turning inside out), a hand-sewing procedure, a table of
  the three holes, a GPIO wiring table, pouch contents in two versions
  (**A** with a 3 × 4 cm perfboard, **B** with inline resistors), JST polarity,
  and velcro closure with a safety tether.
- §02 adds B-7000 as its own line, 3 mm foam, 25 mm webbing, nylon thread, and
  a tether; §04 adds the `B±`/`OUT±` wiring table and the charge-current table;
  §15 adds nine glossary terms.
- Sections 05 to 11 each open with a **"Bahan & alat bagian ini"** block, so a
  reader can gather only what a given stage needs instead of buying the whole
  BOM first. §05 also warns that heat shrink must be on hand before soldering,
  because the sleeve goes onto the wire before the joint is made.

### Changed

- Battery runtime in §11 corrected from 8–10 hours to **3–4 hours** for the
  600 mAh cell (ESP32 with Wi-Fi ≈ 130 mA, 80 % usable capacity).
- Buzzer is now optional everywhere: BOM row, bench gate G3, assembly checklist,
  QC list, and the alarm test are conditional.
- BOM corrections: measure the FSR body (12.7 mm on old datasheets, 14.7 mm on
  the current product page), TP4056 must show four pads `B+`/`B−`/`OUT+`/`OUT−`,
  perfboard is fiber single 5 × 7 cm × 2 cut to 3 × 4 cm, heat shrink is 3 mm for
  joints, and the 5-pin header must be 2.54 mm pitch.
- Pocket depth unified to **1 mm** (was 1–2 mm in text, 2–3 mm in a figure
  caption, 2 mm in the 3D model); channel depth unified to 2–2.5 mm in the base
  instead of splitting 1.5 mm into the 2 mm cover.
- §07 now also carries the chosen build variant: **no sensor pocket, cable
  channel kept** ("jalur pendek"). The callout lists the seven steps that
  replace pocket carving, keeps the 3–3.5 mm × 2–2.5 mm channel, mounts the
  sensor with 0.1 mm double-sided tape or B-7000 on the film edge, and records
  the 0.5 mm height deviation for Bab III.
- `docs/hardware-build-guide.html` now treats the perfboard as optional: the
  BOM gains a `PCB bolong 5 × 7 cm (opsional)` row, soldering step 1 is a
  choice with a "Tanpa PCB pun bisa" callout, and §08 lists the resistor board
  among the pouch contents. The buzzer callout states the firmware runs without
  it (sensors, inference, Firebase unaffected) and that only an **active**
  3.3 V part works with the HIGH/LOW drive on GPIO 27. A new power-path callout
  in §04 (`#daya`) explains that the AMS1117 needs ≈4.4 V input, so the direct
  LiPo → `VIN` link should be verified by measuring `3V3`–`GND` during a WiFi
  transmit, with an MT3608 boost added only on brownout (below 3.1 V or a
  spontaneous reboot); §05 step 5 links to it. `docs/guidebook.html` power line
  now reads `TP4056 → VIN (boost 5V only on brownout)` instead of always
  claiming a step-up module.

- Model rebuilt as **two classes (`safe`/`warning`) at `peak >= 45 kPa`**, no
  danger level anywhere (model, firmware, web, copy, docs). The label rule is
  applied two-sided from the contract in `randomForestRisk.ts` and
  `RandomForest.cpp`; forest votes only place the score inside the level's band.
  Legacy stored `danger` rows and legacy scores are folded into `warning`
  (`normaliseRiskLevel`, `alignScoreToLevel`). `models/rf-model.json` is v2.0,
  trained on all 135 DFN-DS patients with 5-fold grouped CV and SMOTE inside the
  training folds; the web copy and `firmware/include/rf-model-data.h` are
  regenerated from it. See `DECISIONS.md` ADR-021.
- `scripts/prepare-dataset.py` writes the v2.0 dataset (one `patients` array,
  `labelRule.warningKpa: 45`, no 107/28 split); `scripts/train-model.js`
  compares rule / class-weight / SMOTE on identical grouped folds and reports a
  gain-error sweep; `scripts/prepare-session-dataset.py` reads the new shape and
  uses 45 kPa for its `*_hi45` session features; `scripts/validate-datasets.py`
  reports the Figshare share at 45 kPa.
- `scripts/export-model-cpp.js` emits `WARNING_PEAK_KPA` instead of the danger
  defines, and leaf vote counts are `uint32_t` because SMOTE raises a leaf
  population past `uint16_t`.
- `docs/guidebook.html` rewritten for the two-class, 45 kPa system: dataset
  facts, cross-validation protocol, contract table, score bands, firmware
  buzzer/test counts, client inference snippet, Figshare thresholds, and the
  limitations list.
- `DESIGN.md` diselaraskan ke kontrak dua kelas: bagian inferensi ditulis ulang
  (ambang 45 kPa, tanpa level ketiga, kalibrasi 35 kPa sebagai jangkar skala,
  validasi silang berkelompok, SMOTE, pita skor 0–47/48–74), dan token `danger`
  kini dinyatakan sebagai galat/aksi destruktif, bukan level risiko. Nilai warna
  dan kontras tidak berubah.
- Dokumen kontrak lain diselaraskan ke dua kelas/45 kPa: `README.md`,
  `docs/PRD.md`, `docs/TRD.md`, `docs/AFD.md`, `docs/BSD.md`, `docs/DBD.md`,
  `docs/IPD.md`, `docs/ROADMAP-RF.md`, `docs/README.md`, `models/README.md`,
  `datasets/README.md`, `docs/thesis-defense.md`,
  `docs/hardware-build-guide.html` (uji alarm, kontrak acuan, batas FSR 402),
  `docs/rf-model-report.md` dan `docs/validation-report.md` (ditulis ulang untuk
  kontrak baru), `docs/diagram/README.md`, serta Mermaid
  `gambar-3-7/3-8/3-14`.
- `docs/hardware-build-guide.html` lampiran `#model3d` ditulis ulang: kesepuluh
  gambar berlabel (Gambar 5–14) menggantikan enam render sebelumnya, ditambah
  tabel legenda 21 komponen, bagian "cara membaca gambar", dan tabel berkas.
  Tabel legenda dihasilkan ulang dari `docs/3d/legend.json` oleh `annotate.py`,
  jadi nomor badge dan nomor tabel selalu sama.
- `docs/3d/insole.scad`: cover diberi jarak 0,02 mm di atas alas dan film FSR
  dinaikkan 0,05 mm dari dasar cerukan supaya tidak ada bidang berimpit (garis
  z-fighting pada cover tembus pandang); `ribbon()` memakai satu `offset()`
  polygon, bukan rantai `hull()`; potongan DETAIL menghormati `NOCABLE` dan
  mewarnai dinding potongan dengan warna alas.
- `docs/3d/annotate.py`: alpha bertahap di tepi siluet (tidak lagi ada garis
  pucat mengikuti tepi objek pada latar gradien), penata letak label berbasis
  biaya yang menghindari label lain, badge, dan siluet, kanvas/margin per gambar,
  serta pemotongan bingkai untuk gambar posisi pakai.
- `docs/3d/params.md` bertambah bagian nilai khusus render 3D, sumber legenda,
  dan nomor gambar lampiran; dimensi isi pouch disamakan urutannya
  (lebar × tinggi × tebal) dengan `legend.json`.
- `docs/hardware-build-guide.html` diperbarui dengan bahasa tutorial praktis yang
  ramah perakit pemula: memperjelas jenis kabel silikon lentur 30 AWG, fungsi
  heat shrink, teknik solder FSR cepat (< 2 detik), tahapan cerukan (pocket) & parit
  (channel) insole EVA, serta pembuatan dan pemasangan pouch neoprene/rubber sheet.
- `scripts/train-session-model.js` mengekspor helper validasi silangnya
  (`auc`, `binaryMetrics`, `stratifiedFolds`, `crossValidate`) dan hanya
  menjalankan `main()` saat dipanggil langsung, supaya `scripts/evidence.js`
  memakai jalur DFN/DM yang sama alih-alih salinannya. Hasilnya tidak berubah.
- `AGENTS.md` diperbarui dengan aturan frekuensi commit: hindari commit berlebihan
  untuk perubahan-perubahan kecil; kumpulkan ke dalam satu commit besar saat diminta.

### Added

- Web: an account with two paired insoles can choose which foot the dashboard
  reads. `usePairedDevice` returns every paired id plus the selected one
  (persisted per account, stale ids dropped), `DeviceSwitcher` appears in both
  header rows only when there is a choice, and `InsoleContext` clears the
  sample, history, and incident register on a switch so the previous foot's
  numbers never sit under the new label. UI copy is Indonesian; the wire
  contract, RTDB paths, and rules are unchanged.

- `firmware/platformio.ini` + `firmware/src/main.cpp`: a second board can
  publish under its own id. `main.cpp` honours `-DDEVICE_ID_OVERRIDE`, and the
  new `esp32_kanan` environment inherits `esp32dev` and sets it to
  `insole-02`, so flashing either foot is `pio run -e esp32dev -t upload` or
  `pio run -e esp32_kanan -t upload`, with no edits to the git-ignored
  `include/config.h` and no uncommenting between boards.
- `docs/bab-iii-kegiatan-pelaksanaan.md`: draf Bab III lengkap (3.1–3.5) dengan
  16 tabel, placeholder gambar, dan Lampiran A–E. Angka diambil dari kode, bukan
  hasil pengukuran; ambang memakai kontrak dua kelas (Waspada ≥ 45 kPa, Aman di
  bawahnya).
- `docs/diagram/`: tiga berkas Mermaid baru, yaitu diagram blok arsitektur tiga
  lapis, flowchart sistem, dan flowchart inferensi Random Forest. Totalnya kini 13
  berkas `.mmd`. Nomor gambar diurutkan ulang mengikuti urutan kemunculan pada
  laporan: 3.9 diagram blok, 3.10 component, 3.11 deployment, 3.12 ERD,
  3.13 flowchart sistem, 3.14 flowchart inferensi.
- `docs/evidence/`: paket bukti model dua kelas, dihasilkan oleh
  `scripts/evidence.js` yang menghitung ulang semua angka dari
  `models/training-data.json` dan `models/session-dataset.json` (tidak ada angka
  yang diketik manual) dan memanggil protokol validasi silang dari
  `scripts/train-model.js`. Isinya satu laporan A4
  (`hasil-pengujian-model.html`), satu halaman bimbingan
  (`konsultasi-1-halaman.html`), `metrics.json`, dan 11 grafik SVG + PNG.
  Temuannya: label berasal dari aturan 45 kPa sehingga ketiga skema (aturan
  murni, RF berbobot kelas, RF + SMOTE) identik 100%; 20 pohon berhenti di
  kedalaman 1 (60 simpul, 18 split pada `sustained`, 2 pada `peak` 44,97 kPa);
  sapuan gain ×0,9–×1,3 memberi macro-F1 78,4% / 100% / 82,4% / 69,7% / 60,9%;
  8 kasus kontrak lolos; uji DFN vs DM memberi AUC out-of-fold 0,536 sehingga
  tidak lulus gerbang 0,650 dan dilaporkan sebagai hasil negatif. Model
  produksi, header firmware, dan web tidak berubah.
- `scripts/lib/charts.js`: grafik SVG tanpa dependensi (histogram, batang, dot
  plot, matriks konfusi, garis, heatmap, rentang sensor, ROC, dan strip), lalu
  dikonversi ke PNG dengan `rsvg-convert`.

- `docs/3d/`: model 3D insole dan pouch. `params.md` menyimpan satu sumber
  angka; `build-cad.py` menghasilkan empat gambar kerja 2D lewat `cadcraft-cli`
  (denah insole, potongan, pola pouch, perakitan pouch) dalam DXF/SVG/PDF/PNG;
  `insole.scad`, `pouch.scad`, `pouch-contents.scad`, dan `assembly.scad`
  menghasilkan enam render dan dua STL cek cetak; `build-3d.sh` membangun ulang
  semuanya dalam satu perintah. Penyimpangan yang dicatat: channel 3,5 × 1,5 mm
  (panduan 3 × 1–2 mm) karena bundel 6 inti AWG 30 Ø ± 3,2 mm, dengan total
  kedalaman tetap 3,0 mm lewat relief 1,5 mm di bawah cover.
- `docs/daftar-pustaka.md`: 23 entri APA 7, setiap entri ber-DOI diverifikasi
  ulang ke Crossref (kecuali satu DOI yang tidak terdaftar, diperiksa lewat
  laman penerbitnya), plus tabel audit metadata dan kutipan penopang ambang
  200 kPa. Sumber awalnya ekspor grup "TA" Mendeley Desktop
  (`docs/refs/ta.ris`, 19 entri), yang kini ikut di-commit sebagai provenance.
- `docs/thesis-methodology.md` mengisi kelima tanda `[sitasi]`: dataset DFN-DS
  (Zhong dkk., 2025), dataset OptiTrack v2 (Chinarro dkk., 2026), dasar metode
  Random Forest (Breiman, 2001), ambang 200 kPa (Castro-Martins dkk., 2024), dan
  dataset DFU Figshare (Ngui dkk., 2025).
- `web-dashboard/src/utils/adminErrors.ts` maps a Firestore or Realtime Database
  error code to a cause and a next step, the same shape the auth pages use. The
  console no longer renders the SDK's English message, which named the failing
  path and sometimes the project id. Its test pins that a rules rejection keeps
  advice distinct from a connection failure and that every returned key exists
  in both dictionaries.
- The landing is split into `components/landing/landingData.ts` (content),
  `SectionIntro` (the repeated section opening), `HowItWorks` (three steps and
  their vignettes) and `hooks/useLandingMotion.ts` (the three effects);
  `LandingPage.tsx` is composition only. `pagesContract.test.js` follows the
  extracted files, so the warm-register gate still covers every landing source.
- Landing motion: cards settle with `scale(0.985)`, each section's hairline
  draws itself (`scaleX`, 400ms) before the eyebrow, heading and lead arrive at
  80/160/240ms offsets, grid items stagger 80ms apart, the risk chip cross-fades
  on a level change (180ms), the explorer's score counts up (300ms) on a preset
  click only, the mobile menu sheet opens at 160ms, and a feature card's icon
  answers its lift. All CSS, all inside the reduced-motion guard;
  `DESIGN.md`'s landing motion budget now lists each move with its timing.
- Real account deletion in Profile: password confirmation, then re-auth, RTDB
  mirror removal, Firestore profile removal, and Firebase Authentication
  `deleteUser`; the profile is recreated if the last step fails. Admin accounts
  cannot self-delete.
- `web-dashboard/src/hooks/useAuth.test.tsx` pins the deletion order, the admin
  refusal, the wrong-password abort, and the profile restore.
- History page draws 20 rows per page with a "load more" control, a "showing X
  of Y" line, and a note when the device snapshot itself is cut short. Summary
  counts and CSV export still cover the whole register.
- History page reads `readings/history` through `subscribeToHistory`, so the
  incident register survives a page reload instead of living only in memory.
  New `src/utils/incidents.ts` rebuilds the register (transition-based, device
  verdict first) and merges it with the live log; the stored copy is kept apart
  from `incidentLogs` so replaying it cannot re-open the alert modal.
- The header bell now opens an alert card (latest incidents, connection state,
  mark-as-read, link to Settings) instead of navigating to a page.
- History page: risk-level filter (All / Danger / Warning), a sortable Time
  column, and a sticky header with a frozen time column while the register
  scrolls. `GlassTable` gained an optional `maxHeight` for that.
- Agent documentation: `AGENTS.md`, `READY.md`, `TASK.md`, `CHANGELOG.md`,
  `DECISIONS.md`.
- `docs/validation-report.md` (Fase 3): OptiTrack gait cross-check, Figshare DFU
  thresholds, and edge cases.
- `scripts/validate-datasets.py` to reproduce the 3.1 and 3.2 numbers directly
  from the committed archives.
- `docs/thesis-methodology.md` (Bab III draft) and `docs/thesis-defense.md`
  (RF method slides and the end-to-end demo script).
- `datasets/README.md`: source, licence, contents, and limits of the three raw
  datasets, plus the reproduction commands.
- `models/README.md`: artifact map, field-level schema, provenance chain, and
  fresh-regeneration steps.
- `src/utils/rf-modelSync.test.js`: fails if the web copy of `rf-model.json`
  stops matching `models/rf-model.json`.
- Design artifact `design/smart-insole-dashboard.figcraft` (FigCraft): the
  dashboard at 1440 and 375, with `DESIGN.md` colours as named variables rather
  than literals. Text is set in Inter and Fira Code because DM Sans and Plus
  Jakarta Sans are not installed on the authoring machine (see
  `DECISIONS.md` ADR-011).
- Guidebook HTML lengkap `docs/guidebook.html` (satu berkas mandiri, tanpa CDN):
  teori, metode Random Forest, cara kerja firmware dan web, tech stack, struktur
  folder, mulai cepat, kontrak data Firebase, validasi, troubleshooting, dan
  batasan. Gaya mengikuti token `DESIGN.md`.
- Set dokumen spesifikasi di `docs/`: `PRD.md`, `TRD.md`, `AFD.md`, `DBD.md`,
  `BSD.md`, `IPD.md` (product, technical, app flow, design brief, backend
  schema, dan implementation plan).

### Changed

- The admin console's failures read as a cause and a next step instead of the
  SDK message, and a warning is no longer called a failure: when the Firestore
  write landed but the Realtime mirror or the audit entry did not, the tab says
  so in one warning slot. The users tab also explains the domain rejections
  (a malformed device id, a device already paired elsewhere) in that slot.
  Confirmation dialogs name the account they touch, roles render as
  "Admin"/"Pengguna", and each device section is titled "Perangkat {id}".
- The app shell no longer animates page changes: the router's 250ms fade/slide
  and the dashboard's 80ms-per-card stagger are gone. `DESIGN.md` forbids
  entrance animations at `MOTION 1`, because the numbers already move every
  second. Route remount on pathname change is kept.
- Saving the profile name now writes it: Firestore `users/<uid>.displayName`
  first (the auth listener and the admin console both read that copy), then the
  Firebase Auth profile, then the local state. The button reports a real
  failure instead of raising a success banner over a write that never happened.
- Risk thresholds are now clinical constants (35/200 kPa, 20 s), identical in
  the web engine and the firmware. Settings shows them read-only, with no
  editor, no local override, and no fleet configuration path.
- The admin console got its own visual register: one divided status strip
  instead of three equal stat cards, underline navigation instead of the patient
  pill, human-readable audit verbs, filter names that describe the filter, and
  stacked user rows below `md` instead of a sideways-scrolling table.
- The admin console is a separate surface at `/admin/*` with its own shell,
  guard, and four tabs (the Configuration tab is gone); the patient navigation
  no longer links to it.
- Deactivated accounts are actually blocked: the app shows a deactivated screen,
  and the database rules refuse reads when `users/<uid>/active` is false.
- Admins can pair a device to an account, see the whole fleet, change a role,
  export the user list as CSV, prune old history with a JSON archive, and triage
  danger incidents. Every successful action is written to `/audit`.
- A threshold editor is no longer advertised or reachable by any role: the three
  live values render as plain figures, so no account is shown a control that
  cannot reach the device.
- Telemetry is per device: firmware writes `devices/<id>/readings/...`, the web
  reads the device paired in `users/<uid>/devices`, and accounts without a
  pairing keep the legacy `/readings` feed until the new firmware is flashed.
- History summary reads "total in the device window" when the stored snapshot
  is capped, instead of implying an all-time count.
- Browser notification permission card removed until delivery ships: nothing in
  the app sends a browser notification, so the control promised a behaviour
  that did not exist.
- Mark-as-read persists in localStorage, so a reload no longer resurrects
  acknowledged alerts.
- Danger threshold raised from 70 kPa to 200 kPa, the most consensual in-shoe
  figure (Castro-Martins et al., Heliyon 2024, e26161). The number comes from
  one place: `scripts/train-model.js` → `models/rf-model.json`, then the C++
  header and the web copy. Duration is not a danger criterion; the schema keeps
  the field as `sustainedUnit: "samples_10hz"`.
- Agent workflow now ends with a Markdown upkeep question: which root `.md`
  files (`TASK.md`, `CHANGELOG.md`, `READY.md`, `DECISIONS.md`) need updating.
  Frozen documents (`AGENTS.md`, `DESIGN.md`, `README.md`, `docs/**`,
  `tasks/**`) are only offered when the task touches their subject.
- Every component test is now `.test.tsx` (28 files), so `tsc --noEmit` checks
  them instead of skipping them under `allowJs`. `a11y.test.tsx` sweeps `.jsx`
  and `.tsx` alike so the outline gate still covers every screen.
- `scripts/train-model.js` now writes a deterministic `provenance` block
  (dataset version, split sizes, sample counts, script names, seed) so
  regenerating does not lose the audit trail. Model trees are byte-identical.
- `scripts/prepare-dataset.py` comments now state the real label rule
  (peak >= 35 kPa or sustained >= 200 samples) and that DFN-DS contains zero
  `danger` samples; behaviour is unchanged.
- Documentation restructured to match the real repository: root `README.md`,
  `docs/README.md`, `firmware/README.md`, `web-dashboard/README.md`,
  `docs/ROADMAP-RF.md`, `docs/HARDWARE-SPEC.md`, and
  `docs/rf-model-report.md`.
- `DESIGN.md` now states the real training set (DFN-DS, 81.000 samples) and the
  forest that ships (20 trees, depth 8), replacing the synthetic-grid
  description.
- Hardware spec gained a table of contents and history entry v1.2.

### Fixed

- `datasets/README.md` mencatat sumber yang bisa dilacak untuk ketiga dataset:
  MSSDA (AAAI 2025, `10.1609/aaai.v39i21.34451`), DFU *offloading* (Ngui dkk.
  2025, Figshare University of Adelaide, `10.25954/e6yc-n159`), dan OptiTrack v2
  (Zenodo, `10.5281/zenodo.22936249`), masing-masing dengan lisensi CC BY 4.0.
  Sebelumnya dua dataset hanya menyebut "rujuk halaman Figshare dataset" tanpa
  tautan, dan OptiTrack disebut berasal dari Figshare padahal terbit di Zenodo.
- Metadata sitasi hasil ekspor Mendeley dikoreksi terhadap rekaman penerbit:
  Najafi 2018 terbit di *Wound Care Management* 1(1), bukan *Journal of Diabetes
  Science and Technology*; DOI Ramirez-Bautista (2022), Alali (2024), dan Veran
  (2026) dilengkapi atau dibetulkan; field URI Ahsan (2021) yang rusak diganti
  DOI-nya; nomor artikel Castro-Martins (2024) yang tercatat `e26161` di
  `RENCANA-PERBAIKAN.md` dikoreksi menjadi `e29672`. Empat entri yang masih
  menggantung dilengkapi: Ahmadinia (2026) menjadi tesis S2 Metropolia
  University of Applied Sciences; Lapono dkk. (2024) masuk *Jurnal Fisika*
  9(2), 6–9; Maharani dkk. (2026) masuk *Jurnal Ilmiah Kesehatan Rustida* 13(2),
  168–185; dan Supriyatin dkk. (2023) memakai judul serta halaman yang benar
  (SNPPKM 3(1), 20–26). DOI Supriyatin tidak terdaftar di doi.org (404), jadi
  entri itu bertaut ke laman artikelnya dan koreksinya dicatat.
- The admin overview no longer states a count before it knows one. The status
  strip started at `0` for every source, which is a claim, and a dash would have
  been a second invented value; each cell now holds a skeleton and announces the
  wait. The empty audit band also carries a next-step line, and the Incidents
  action column stopped borrowing the users table's header.
- The admin shell's tab, "Buka aplikasi" and sign-out links were 40px tall; they
  are now 44px, the same target the app's own controls use.
- The landing page no longer claims ten readings per second. The firmware samples
  at 1 Hz (`SAMPLE_INTERVAL_MS 1000`), and the dashboard already said so, so the
  hero, the spec tile, the "how it works" step and the technical pipeline were
  contradicting the product. All four now say once a second.
- The landing page no longer quotes a 70 kPa danger limit or a 0.1 s danger
  duration. The engine uses 200 kPa on a single reading; the risk explorer and
  the "Judge" step now say that.
- The landing page no longer advertises features that were removed: adjustable
  thresholds, vibration, and browser notifications. The feature card now states
  that the dashboard and device share one threshold set, and the FAQ names the
  alarm sound that actually exists.
- Settings' three threshold values now sit on one line. The third label wrapped
  to two lines at `sm`, so its number sat lower than the other two; the labels
  are shorter and the figures bottom-align in equal-height cells.
- Admin audit and incident tables no longer nest two horizontal scrollports.
  `GlassTable` already scrolls, so the extra wrapper is gone.
- The dashboard activity table's action cell matched the rest of the row
  (`px-4` against `px-6`).
- The landing feature cards lift at the 150ms hover step again. They were inside
  a `[data-reveal]` wrapper whose 700ms transition also governed the hover, so
  the lift was slow and the shadow snapped; the reveal moved to the wrapper.
- The risk explorer's duration slider announces the same value it shows
  (`12,5 detik`, not `13 detik`) to a screen reader.
- The profile statistics panel no longer reuses "Belum tersedia" for an empty
  incident list; it says no incidents are recorded.
- Removed dead `PageHeader` imports from the four admin pages.
- Every signed-in page now fills the shell's 1400px content column. Device,
  Settings, Profile, Notifications and Admin each capped and centred their own
  `<section>` (`max-w-3xl` / `max-w-5xl`), so their cards sat narrower than the
  nav pill with empty canvas on both sides. The caps are gone and the internals
  spread out instead: the threshold form is four columns from `xl`, the Profile
  name and email sit side by side from `sm`, the device fact rows put the label
  and the value on one line from `sm`, and prose keeps `max-w-prose`. See
  `DESIGN.md` ("One content width for every page") and `DECISIONS.md` ADR-006.
- Removed the unused `subscribeToBattery` helper from the realtime service.
- Corrected the wire-contract comment in `firmware/src/main.cpp`, which still
  pointed at a `.js` service file that no longer exists.

### Removed

- The danger level and everything that only existed for it: `DURATION_WINDOWS`,
  the 20 s duration meter and badge, the danger threshold row/cell, the second
  buzzer pattern, `history.dangerCount`, `settings.dangerKpa`,
  `settings.warningSeconds`, `alert.dangerTitle/Body`, `risk.danger`,
  `risk.advice.danger`, `dashboard.caption.durationLimit`,
  `dashboard.withinLimit/overLimit`, `landing.tech.sim.whyDanger`, `levelFromVotes`,
  and `AlertModal`'s `level` prop (both levels styled identically).
- The threshold editor and its local override (`riskThresholds.v2`), the
  `config/global` RTDB node and subscription, `setGlobalConfig`, the admin
  Configuration page and tab, and their i18n keys and tests.
- The admin console's "Hapus" action and its confirmation copy. The button
  deleted only the Firestore document, leaving the account able to sign in;
  "Nonaktifkan" is the admin's real lever and the owner erases their own account
  from Profile.
- Fuzzy logic inference (`src/utils/fuzzyRisk.ts` and its test) and the
  RF-vs-fuzzy agreement test. Random Forest is now the only risk algorithm.
- Renamed the wire field `fuzzy_risk_score` to `risk_score` in the firmware,
  the TypeScript contract, and the realtime mapper.

## [0.1.0] - 2026-11-01

### Added

- Firmware: local alarm and Firebase telemetry upload.
- Firmware: native unit tests (Unity) that build and run without hardware.
- Firebase: versioned Realtime Database, Firestore, and Storage rules.
- Auth: email verification flow and password reset.
- Landing and dashboard motion with framer motion.

### Changed

- Web codebase migrated to TypeScript: utils, services, i18n, contexts, hooks,
  UI primitives, components, pages, and the test environment shim.
- Risk engine: configurable peak thresholds, paired verdicts, and true
  sustained durations.

### Fixed

- AdminPage no longer crashes on a hard refresh at `/admin`.
- Firmware pushes telemetry at the sampling cadence.
