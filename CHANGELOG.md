# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Agent documentation: `AGENTS.md`, `READY.md`, `TASK.md`, `CHANGELOG.md`,
  `DECISIONS.md`.
- `docs/validation-report.md` (Fase 3): OptiTrack gait cross-check, Figshare DFU
  thresholds, edge cases, and RF-vs-rule agreement.
- `scripts/validate-datasets.py` to reproduce the 3.1 and 3.2 numbers directly
  from the committed archives.
- `docs/thesis-methodology.md` (Bab III draft) and `docs/thesis-defense.md`
  (fuzzy-vs-RF slides and the end-to-end demo script).
- `src/utils/riskAgreement.test.js`: the 90% agreement gate, an assertion that
  every grid disagreement sits in a documented band, and the edge-case set.
- `datasets/README.md`: source, licence, contents, and limits of the three raw
  datasets, plus the reproduction commands.
- `models/README.md`: artifact map, field-level schema, provenance chain, and
  fresh-regeneration steps.
- `src/utils/rf-modelSync.test.js`: fails if the web copy of `rf-model.json`
  stops matching `models/rf-model.json`.

### Changed

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

- Removed the unused `subscribeToBattery` helper from the realtime service.
- Corrected the wire-contract comment in `firmware/src/main.cpp`, which still
  pointed at a `.js` service file that no longer exists.

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
