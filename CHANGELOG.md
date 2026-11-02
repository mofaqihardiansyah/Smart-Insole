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

### Changed

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
