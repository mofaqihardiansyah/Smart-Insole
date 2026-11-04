# TASK.md

Work ledger. The agent updates this after every completed task: add a Done
entry (date + short ref), move items through In progress, and keep Next to the
five nearest items. Cap: about 30 Done entries; older months collapse into one
summary line per month.

## Done

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

1. **Firmware 5.4** — flash with real credentials and test with real sensors.
   Unblocks the end-to-end demo (Fase 6.4).
2. **Docs polish** — `docs/HARDWARE-SPEC.md` is still Draft; promote it once
   the hardware is validated.
3. **Thesis review** — fill the `[sitasi]` placeholders in
   `docs/thesis-methodology.md` and render the slide outline into real slides.
4. **RF limitation** — the forest stays `warning` on 35-69 kPa held for over
   20 s where the rule base says `danger`; revisit if sustained-load use is in
   scope.

> Update rule: Done entries carry a date and a commit hash or `(working tree)`.
> Keep entries short — detail belongs in the commit message or `CHANGELOG.md`.
