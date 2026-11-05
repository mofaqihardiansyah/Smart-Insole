# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

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

### Changed

- The admin console is now a separate surface at `/admin/*` with its own shell,
  guard, and five tabs; the patient navigation no longer links to it.
- Deactivated accounts are actually blocked: the app shows a deactivated screen,
  and the database rules refuse reads when `users/<uid>/active` is false.
- Admins can pair a device to an account, see the whole fleet, change a role,
  export the user list as CSV, prune old history with a JSON archive, and triage
  danger incidents. Every successful action is written to `/audit`.
- A normal account no longer sees a threshold editor at all: the limits render
  as two plain values, with no fields, buttons, or "admin only" notice, so the
  editing capability is not advertised.
- Telemetry is per device: firmware writes `devices/<id>/readings/...`, the web
  reads the device paired in `users/<uid>/devices`, and accounts without a
  pairing keep the legacy `/readings` feed until the new firmware is flashed.
- The local threshold override moved to `riskThresholds.v2`; an old saved
  70 kPa limit is discarded instead of silently surviving the 200 kPa change.
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
