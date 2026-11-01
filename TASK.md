# TASK.md

Work ledger. The agent updates this after every completed task: add a Done
entry (date + short ref), move items through In progress, and keep Next to the
five nearest items. Cap: about 30 Done entries; older months collapse into one
summary line per month.

## Done

- **2026-11-01 — Agent documentation.** Created `AGENTS.md`, `READY.md`,
  `TASK.md`, `CHANGELOG.md`, `DECISIONS.md`; linked them from `README.md`.
  (working tree)
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

- Nothing claimed. Pick from Next.

## Next

1. **Firmware 5.4** — flash to ESP32 and test with real sensors. Blocked
   locally: `pio` is not installed.
2. **Validation (Fase 3)** — OptiTrack cross-check, Figshare thresholds, edge
   cases (empty/NaN/500 kPa), ≥90% agreement with expert rules.
3. **Thesis (Fase 6)** — methodology chapter, fuzzy-vs-RF slide, end-to-end
   demo script.
4. **Docs polish** — `docs/HARDWARE-SPEC.md` is still Draft; promote it once
   the hardware is validated.

> Update rule: Done entries carry a date and a commit hash or `(working tree)`.
> Keep entries short — detail belongs in the commit message or `CHANGELOG.md`.
