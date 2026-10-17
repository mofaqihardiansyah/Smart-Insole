# Phase 3: Primitive rebuilds - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-17
**Phase:** 3-Primitive rebuilds
**Areas discussed:** CTA register variants, Feedback primitive shape, SERIES single source, Primitive API contract, COMP-04 follow-up (TrendChart trace)
**Mode:** advisor (research-backed comparison tables; calibration `full_maturity`)

---

## CTA register variants

Does the COMP-01 GlassButton rebuild own the landing's `warm`/`warmOutline` variants, or does Phase 3 keep GlassButton app-register-only and leave backlog 999.1 to a later phase?

| Option | Description | Selected |
|--------|-------------|----------|
| Register keys, 999.1 superseded | Re-add both keys to `GlassButton.jsx`'s `VARIANTS` and ship the gate case in the same commit; mark 999.1 superseded-by-COMP-01 with a pointer. 1 component file + 1 test, 0 page edits | ✓ |
| Landing-only component | A separate `LandingButton`; clean register boundary but needs a `DESIGN.md:337` amendment, duplicates the focus-ring/44px contract, and rewrites 8 imports | |
| Scope token remap, no variant key | Remap the fill inside `.landing-scope`; smallest component diff, but measured bleed through `LanguageToggle` at `LandingPage.jsx:225` and a shared `--primary-btn` token | |
| Phase 3 does not own it | Leave GlassButton app-register-only; 999.1 stays an independently schedulable backlog phase | |

**User's choice:** Register keys, 999.1 superseded
**Notes:** Research agent verified the deletion was incidental rather than deliberate — `c46fa83c` added both keys and `8d9dd996` (an unrelated rewrite of `VARIANTS` and its docblock) dropped them, so the classes to restore are git-provable. `warm-accent-deep` occurs 0 times in `dist/`. Research also surfaced that `.landing-scope` already remaps `--primary-btn` at `index.css:272` and that `LanguageToggle` renders inside that scope, which is what ruled out the token-remap mechanism on measured evidence rather than taste.

---

## Feedback primitive shape

COMP-03 asks for a new unified Alert/Banner with a named cause and next action, while `StatusBanner` (8 files) and `StatePanel` (9 files) already ship.

| Option | Description | Selected |
|--------|-------------|----------|
| A. Absorb all into one primitive | One `FeedbackBanner`; both existing primitives become thin delegates; both legacy names stay exported | |
| B. Two registers, one contract | New surface owns the tone→role matrix; `StatePanel` keeps the block register untouched (9 sites + the direct-path `ErrorBoundary` import, so FIX-08/FIX-10 cannot regress); `StatusBanner` delegates so its 8 sites keep working | ✓ |
| C. Add it beside both | Nothing migrated; but it ships with zero consumers, triplicates the role matrix, and risks a second always-on polite region | |
| D. Extend StatePanel instead | Smallest diff and honest reuse; arguably fails COMP-03's wording and would need supervisor sign-off | |

**User's choice:** B. Two registers, one contract
**Notes:** Research established that the two existing primitives are two **layouts**, not duplicates — an inline dismissible row versus a centred block that owns a data view's loading/empty/error arms. It also found `ErrorBoundary.jsx:2` imports `StatePanel` by direct path rather than through the barrel, which is what makes B's "no migration" claim checkable rather than aspirational.

---

## Cause + next action contract strength

| Option | Description | Selected |
|--------|-------------|----------|
| Two-tier: required, test-enforced | Cause and next action both required; next action satisfied by an `action` element or an explicit string; test-enforced, dev-warned, benign production fallback | ✓ |
| CI/test-enforced only | One hard mechanism, but needs an exemption list for states with legitimately no user action | |
| Advisory only | Optional prop plus a DESIGN.md convention — this is the status quo that shipped `admin.users.empty` with no next step | |
| Runtime refusal | The primitive refuses to render without a next action; a blank clinical view is worse than the defect, and `loading` has no next action by nature | |

**User's choice:** Two-tier: required, test-enforced
**Notes:** Research found no gate exists for this contract today while the codebase already ships five violations (`AdminPage.jsx:61`, `:180`, `:264` errors with a cause and no action; `:182`, `:266` empties with a title only) with `npm test` green — which is the evidence that advisory is insufficient. Repairing those call sites in-phase is a consequence of the enforcement choice, not a new capability.

---

## SERIES single source

| Option | Description | Selected |
|--------|-------------|----------|
| B. Dedicated utils module + real gate | New `src/utils/series.js` (key + `varName` + dash) with a colocated test; three charts consume it; donut caller-supplied colours deleted; quarantine sweep with allowlist, non-vacuity assertion, file-count floor and `.js` in its walk; DESIGN.md sentence amended | ✓ |
| C. Token layer owns the values | `--series-1/2/3` become the only declared values; JS holds no hex; enforcement extends `designTokens.test.js` instead of a new sweep | |
| A. Literal: import from TelemetryChart | Keep `SERIES` where DESIGN.md says it is, consume the existing 0-importer `TELEMETRY_SERIES` export; quarantine stays prose | |
| D. Chart-scoped CSS classes | `.chart-series-N` stroke classes; strongest separation, but a var→class→JS indirection with no precedent here | |

**User's choice:** B. Dedicated utils module + real gate
**Notes:** DESIGN.md's "defined once, in the `SERIES` array in `TelemetryChart.jsx`" sentence was found to be already false for two of the three charts (`TrendChart` strokes `--secondary`; `LoadDonut` receives each arc's colour from its caller at `DashboardPage.jsx:533`), so an amendment is forced in every option. The donut fix is a three-line deletion that also closes a live defect: the `--border-strong` arc resolves to `#E2E8F0` (1.3:1), failing the 3:1 graphical-object bar, where `--series-3` measures 3.42:1. `PlantarHeatmap` is settled by DESIGN.md rather than by this discussion — it keeps risk tokens because it encodes pressure magnitude.

---

## Primitive API contract

| Option | Description | Selected |
|--------|-------------|----------|
| Hybrid: gate + dev-warn + benign fallback | Vocabulary may change; a new `apiContract.test.jsx` enumerates every literal `variant`/`tone`/`level` at every call site across both barrels against keys read from the module exports; dev-only warn-once for the computed cases a static scan cannot see; production keeps a declared fallback | ✓ |
| Structural gate only | Same gate, no warn mechanism; simpler, but blind to computed `tone`/`level` values | |
| Frozen props + dev warn-once | Props frozen; warn at the four fallback sites; no build-time failure and the shipped-defect class stays reproducible | |
| Props evolve + fail loudly (dev throw) | Throws on an undeclared key behind `import.meta.env.DEV`; requires inverting three tests that encode the fallback, and any production leak blanks a console | |

**User's choice:** Hybrid: gate + dev-warn + benign fallback
**Notes:** Research identified the two questions as coupled — an unknown-key strategy is only worth its cost in proportion to how much prop churn is permitted, and the Area 1 choice already granted the minimum churn the landing CTA needs. Its first row (props frozen, landing CTA fixed by a `.landing-scope` token remap) was excluded twice over: it contradicts the Area 1 decision, and its own bleed finding rules it out. Three existing assertions encode the fallback as intended (`StatusChip.test.jsx:81`, `StatePanel.test.jsx:106`, plus the tone fallback the BentoGrid proof rests on) — the hybrid keeps them valid, the rejected throw would have inverted them. Only `LandingPage.jsx` and `AlertModal.jsx` import modules directly, and `GlassForm.jsx`'s second barrel has zero consumers today, but Phase 4's shell starts using it, so the gate is cheap now and expensive after ten pages stack on top.

---

## COMP-04 follow-up — TrendChart trace

| Option | Description | Selected |
|--------|-------------|----------|
| Keep `--secondary`, document the carve-out | The trace stays a non-identity trace at 4.60:1 and the carve-out is written into DESIGN.md; zero code change | ✓ |
| Draw it from the series source | `--series-1` (5.19:1) — better contrast, but implies "blue = forefoot" on a panel that is deliberately not zone-identified | |
| Add a dedicated identity-free token | Cleanest semantics, but adds a token whose only consumer is this one line | |

**User's choice:** Keep `--secondary`, document the carve-out
**Notes:** DESIGN.md:349 already documents the trend panel as "One series, because the donut and the map already answer 'which zone'", which is what makes the carve-out the semantically correct reading rather than a concession.

---

## the agent's Discretion

No area was delegated — the user chose every one. Left to the planner, and recorded in CONTEXT.md under *the agent's Discretion*:

- The Alert/Banner primitive's export and prop names, and where the shared tone→role config module lives.
- `series.js`'s export names and shape, and whether `TelemetryChart` keeps its 0-importer `TELEMETRY_SERIES` re-export as an alias or drops it.
- The dev-warn helper's shape and location, given four fallback sites need it.
- Whether `BentoCell` needs a height assertion at all (Phase 2 declined to pin one because the file belongs to this phase).

## Deferred Ideas

- **WR-02** — the unreachable dashboard error arm and the `InsoleContext.jsx:319-326` source-fallback guard. Offered as a fifth area at the close of the discussion; deliberately not taken. Success criterion 5 says the guard is preserved, so this phase leaves it intact. Stays `open` in `02-REVIEW-DISPOSITION.md`.
- **CR-01** — `AdminPage.jsx` hooks after a conditional early return. Untouched.
- **999.2** — `AdminPage.jsx`'s five English error fallbacks. D-03 repairs adjacent call sites on the same file but does not absorb this; it stays a backlog phase.
- **WR-01** (token gate substring match), **IN-01** (`.nav-scrolled` shadow geometry), **IN-02** (battery tile ASCII placeholder), **IN-03** (sweeps without a file-count assertion). All `open` in `02-REVIEW-DISPOSITION.md`.
- **PAGE-10 carry-forwards** — landing type scale and landing radius, per Phase 2 D-13.
