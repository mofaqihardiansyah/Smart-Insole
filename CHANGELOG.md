# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed

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

- `docs/bab-iii-kegiatan-pelaksanaan.md`: draf Bab III lengkap (3.1–3.5) dengan
  16 tabel, placeholder gambar, dan Lampiran A–E. Angka diambil dari kode, bukan
  hasil pengukuran; ambang memakai versi firmware (Bahaya ≥ 200 kPa,
  Waspada ≥ 35 kPa atau ≥ 20 detik).
- `docs/diagram/`: tiga berkas Mermaid baru, yaitu diagram blok arsitektur tiga
  lapis, flowchart sistem, dan flowchart inferensi Random Forest. Totalnya kini 13
  berkas `.mmd`. Nomor gambar diurutkan ulang mengikuti urutan kemunculan pada
  laporan: 3.9 diagram blok, 3.10 component, 3.11 deployment, 3.12 ERD,
  3.13 flowchart sistem, 3.14 flowchart inferensi.
- `docs/evidence/`: paket bukti model Random Forest, dihasilkan oleh
  `scripts/evidence.js` yang menghitung ulang semua angka dari
  `models/training-data.json` dan `models/session-dataset.json` (tidak ada angka
  yang diketik manual). Isinya satu laporan A4 (`hasil-pengujian-model.html`),
  satu halaman bimbingan (`konsultasi-1-halaman.html`), `metrics.json`, dan 12
  grafik SVG + PNG. Temuan utamanya: dua skenario ambang bahaya dilaporkan
  berdampingan (200 kPa yang sekarang dan 70 kPa usulan Bab II); 0 dari 81.000
  sampel mencapai 200 kPa dan 0 sampel validasi mencapai 70 kPa, jadi kelas
  Bahaya tidak bisa dilatih maupun divalidasi; model 20 pohon ternyata 20
  tunggul kedalaman 1 (60 simpul, 19 split pada `sustained`, 1 pada `peak`
  34,97 kPa), bukti bahwa Random Forest hanya menyalin aturan ambang; uji
  DFN vs DM memberi AUC out-of-fold 0,503 sehingga tidak lulus gerbang 0,650
  dan dilaporkan sebagai hasil negatif. Model produksi, header firmware, dan
  web tidak berubah.
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
