---
phase: 03-primitive-rebuilds
plan: 02
subsystem: ui
tags: [react, tailwind, vitest, jsdom, data-viz, svg-chart, design-tokens, single-source]

# Dependency graph
requires:
  - phase: 01-design-system-audit-token-lock
    provides: the measured series palette (`--series-1/2/3` at 5.19/3.87/3.42 against white) and the quarantine rule the module now names
  - phase: 02-defect-fixes
    provides: the colocated-utils test convention (`randomForestRisk.test.js`), the source-sweep idiom (`designTokens.test.js`'s `collectSources` + `copy.test.js`'s non-vacuity floor), and the `MemoryRouter` + `InsoleProvider` page-render pattern
  - phase: 03-primitive-rebuilds
    plan: 01
    provides: `src/utils/devWarn.js` and the "read the vocabulary from the source" gate idiom (`variantKeys.test.js`) — the precedent this plan's module-plus-lock shape follows
provides:
  - "`web-dashboard/src/utils/series.js` — `SERIES` (forefoot/midfoot/heel with `--series-N` variable names and three distinct dash patterns) and `NON_IDENTITY_TRACE` (`--secondary`, the D-05 carve-out plan 03-04 imports)"
  - "`TelemetryChart` reads the shared module instead of declaring the palette, so it stops being the palette authority"
  - "`MonitoringPage` reads the module directly; no `TELEMETRY_SERIES` spelling survives anywhere under `src/`"
  - "`TelemetryChart.test.jsx` — the one-model lock: plot, legend and screen-reader table must agree, for an empty, a one-record and a many-record buffer"
affects: [03-04, 03-05, 04-shell-rebuild]

# Actuals (#2632) — pairs with the plan's `estimate` to calibrate future estimates.
# Same estimateTokens scale (chars/4), measured over the realized diff of this plan's
# own files (`git diff b5828527..d3a30326 -- web-dashboard/ | wc -c` = 14753 -> 3688).
# The added-content-only half of the same diff is 11936 chars -> 2984 tokens; the
# plan's `estimate: 58000` over-projected by roughly 16x either way.
actuals:
  tokens: 3688
  tasks: 3
  commits: 4

plan_head_before: b5828527f3f9aa0ec99447e5e44311f460e6d64b
plan_head_after: d3a30326105368bd890c803b215af33684960bff

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "One module owns a categorical colour set: it names the `--series-N` custom properties and never a hex, so the measured palette keeps one home in `index.css` and a component cannot become the palette authority"
    - "A chart's plot, its legend and its screen-reader table all resolve from the same array, and the test proves it entry by entry rather than by counting elements alone"
    - "A `SERIES.length` comparison is never the only floor: a literal count is asserted first, so a shrunken import cannot make a test file self-consistent"
    - "A literal SVG attribute name in a test is assembled from parts, because `designTokens.test.js` sweeps every `.jsx` for utility-shaped tokens and reads `stroke-dasharray` as a Tailwind class"

key-files:
  created:
    - web-dashboard/src/utils/series.js
    - web-dashboard/src/utils/series.test.js
    - web-dashboard/src/components/monitoring/TelemetryChart.test.jsx
  modified:
    - web-dashboard/src/components/monitoring/TelemetryChart.jsx
    - web-dashboard/src/pages/MonitoringPage.jsx

key-decisions:
  - "`series.js` exports `NON_IDENTITY_TRACE` rather than letting plan 03-04 hard-code the sage variable name: D-05's carve-out is then provable by import, and the name cannot quietly become a member of the series set."
  - "`series.js` declares no hex. The module names `--series-1/2/3` and the test fails on any hex literal in the source, which is what keeps `index.css` the only place the measured values are written."
  - "The `TELEMETRY_SERIES` alias and its one importer were removed in one task, after the importer moved: the alias was a stale published surface with exactly one consumer (`03-CONTEXT.md:49` had recorded it as zero-importer), so re-pointing and deleting are the same change."
  - "A literal three-series floor was added to `TelemetryChart.test.jsx` on top of the plan's `SERIES.length` comparison — the plan's own threat register (T-03-05) names 'asserts the three-series count' as the mitigation, and the `SERIES.length` form alone stayed green when `SERIES` was probed down to two entries."
  - "The empty-buffer case asserts `container.textContent === ''` rather than only checking for a missing `figure`: 'renders nothing' is the must-have truth, and axis text without a plot is exactly the chart-shaped no the UI-SPEC's empty row forbids."

patterns-established:
  - "Single-source colour module: key + variable name + redundant encoding (dash) in a `.js` module, values left in CSS, colocated test locking the keys, the order, the distinct patterns and the absence of hex"
  - "One-model chart test: assert the series count against a literal floor, then prove the plot, the legend and the accessible table each resolve the same entry"

requirements-completed: [COMP-04]

coverage:
  - id: D1
    description: "The three CVD-safe series values are declared once, in `src/utils/series.js`, and `TelemetryChart` reads that module instead of declaring them"
    requirement: COMP-04
    verification:
      - kind: unit
        ref: "web-dashboard/src/utils/series.test.js#declares exactly three entries"
        status: pass
      - kind: unit
        ref: "web-dashboard/src/utils/series.test.js#names the three declared series custom properties in order"
        status: pass
      - kind: unit
        ref: "web-dashboard/src/utils/series.test.js#carries no hex literal, so the palette stays in index.css"
        status: pass
      - kind: unit
        ref: "web-dashboard/src/components/monitoring/TelemetryChart.test.jsx#renders all three declared series, so the counts below cannot pass vacuously"
        status: pass
    human_judgment: false
  - id: D2
    description: "The chart's plot, its legend and its screen-reader table provably resolve the same three series, so a screen-reader user is told the same story as a sighted one (threat T-03-05)"
    requirement: COMP-04
    verification:
      - kind: unit
        ref: "web-dashboard/src/components/monitoring/TelemetryChart.test.jsx#resolves the plot, the legend and the accessible table from one array"
        status: pass
      - kind: unit
        ref: "web-dashboard/src/components/monitoring/TelemetryChart.test.jsx#keeps each series' own stroke pattern in the plot and the legend"
        status: pass
      - kind: unit
        ref: "web-dashboard/src/components/monitoring/TelemetryChart.test.jsx#labels the svg with the sample count and repeats the numbers in a table"
        status: pass
    human_judgment: false
  - id: D3
    description: "An empty buffer renders no plot at all and a one-record buffer draws only the point it has, with no closed area and no value invented to fill the window"
    requirement: COMP-04
    verification:
      - kind: unit
        ref: "web-dashboard/src/components/monitoring/TelemetryChart.test.jsx#renders nothing at all for an empty buffer, not an empty axis frame"
        status: pass
      - kind: unit
        ref: "web-dashboard/src/components/monitoring/TelemetryChart.test.jsx#draws only the points a one-record buffer has"
        status: pass
      - kind: unit
        ref: "web-dashboard/src/components/monitoring/TelemetryChart.test.jsx#renders one plot line per declared series at every record count"
        status: pass
    human_judgment: false
  - id: D4
    description: "`MonitoringPage` reads the series array from `../utils/series` and the `TELEMETRY_SERIES` name no longer exists under `src/`, with the page's window control, three statistics and session table unchanged"
    requirement: COMP-04
    verification:
      - kind: unit
        ref: "web-dashboard/src/pages/pages.test.jsx#MonitoringPage mounts with exactly one h1"
        status: pass
      - kind: unit
        ref: "web-dashboard/src/pages/pages.test.jsx#MonitoringPage renders no raw translation keys"
        status: pass
      - kind: other
        ref: "`grep -rn 'TELEMETRY_SERIES' web-dashboard/src/` returns nothing (hand-check, plan verification)"
        status: pass
      - kind: integration
        ref: "`npm --prefix web-dashboard run build` exits 0 (2002 modules, only the pre-existing >500 kB chunk advisory)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The rebuilt series path is clicked through at 360px, 768px and 1280px, as AGENTS.md's Delivery Gate requires"
    verification: []
    human_judgment: true
    rationale: "jsdom has no layout engine and this environment has no browser, so the three-breakpoint pass cannot be observed here. The structural half is locked by unit test; the visual half is recorded as an unrun verify in `.planning/WINDOWS.md`."

# Metrics
duration: 6min
completed: 2026-10-18
status: complete
---

# Phase 3 Plan 02: Primitive rebuilds Summary

**The three CVD-safe series values now live in one `src/utils/series.js` that `TelemetryChart` and its only page consumer both read, with the chart's plot, legend and screen-reader table provably resolving from that single array**

## Performance

- **Duration:** 6 min
- **Started:** 2026-10-18T03:34:24Z
- **Completed:** 2026-10-18T03:40:15Z
- **Tasks:** 3
- **Files modified:** 5 (3 created, 2 modified)

## Accomplishments

- **The palette has one home again.** `--series-1/2/3` were declared in `index.css` and re-listed inside `TelemetryChart.jsx`, while `MonitoringPage.jsx` reached them through a `TELEMETRY_SERIES` alias — three consumers, three places to drift. `web-dashboard/src/utils/series.js` now holds `SERIES` (key + variable name + dash) and the component imports it; `index.css` is the only place the measured values are written, and the test fails on any hex literal in the module.
- **The chart is no longer the palette authority.** `DESIGN.md:172-176` named `TelemetryChart.jsx` as the single source; this plan moves that role to a module that names custom properties only, which is what plan 03-04 needs before `TrendChart` and `LoadDonut` can consume it and what plan 03-05's quarantine gate will point at.
- **A screen reader and a sighted reader are provably told the same three series.** `TelemetryChart.test.jsx` asserts the rendered series count against a literal floor of three, then proves each entry's name appears in the legend *and* as a column head in the accessible table *and* that its `--series-N` name reached the plot markup. A component that rendered nothing fails rather than passing every loop by finding nothing.
- **The partial and empty buffers behave.** An empty buffer renders nothing at all (`container.textContent === ''` — no figure, no `svg`, no axis text); a one-record buffer draws exactly one point per series with no closed area and no interpolated or repeated value; the series count is fixed at three at every record count, so the layout cannot reflow between a one-record and a many-record session.
- **The last legacy spelling is gone.** `TELEMETRY_SERIES` appears nowhere under `src/`, and the re-export that carried it was deleted in the same task that re-pointed its only importer. The `SERIES` ordinal channel survives: each entry's dash pattern is asserted on the plot line *and* on the legend swatch that describes it, so three hues are still not the only separation.
- **Both new test files were probed non-vacuous by hand.** Shrinking `SERIES` to two entries fails `series.test.js` on three cases and now fails `TelemetryChart.test.jsx`'s floor; deleting `if (!history.length) return null` fails the empty-buffer case. All probes reverted, sources restored byte-identically.

## Task Commits

Each task was committed atomically:

1. **Task 1 (tracer): The module, its one consumer, and the lock between them** - `2ad4bef6` (feat)
2. **Task 2: Pin the one-model rule on the telemetry chart** - `a4628f66` (test)
3. **Task 3: Re-point `MonitoringPage` at the series module** - `c1d262d5` (refactor)
4. **Gate fix surfaced by plan-level verification** - `d3a30326` (fix)

**Plan metadata:** the docs commit this SUMMARY ships in (plan summary + STATE/ROADMAP/REQUIREMENTS/WINDOWS)

_Note: commit 4 is a Rule 1 fix to a Task-2 artefact that only the full-suite run could see — see Deviations._

## Files Created/Modified

- `web-dashboard/src/utils/series.js` — the single source: `SERIES` (three entries, `--series-1/2/3`, dashes `undefined` / `7 4` / `2 4`, copied verbatim from the component) and `NON_IDENTITY_TRACE` (`--secondary`, D-05's carve-out for `TrendChart`). Names custom properties only; carries no hex.
- `web-dashboard/src/utils/series.test.js` — the lock on the module: entry count asserted before the per-entry verdicts, keys and variable names in order, three distinct dash patterns, the carve-out outside the set, and no hex literal in the source.
- `web-dashboard/src/components/monitoring/TelemetryChart.test.jsx` — the one-model lock: the literal three-series floor, the empty and one-record buffers, the plot/legend/table agreement per entry, the dash on line and swatch, and the `role="img"` accessible name carrying the sample count.
- `web-dashboard/src/components/monitoring/TelemetryChart.jsx` — imports `SERIES` from `../../utils/series`; the local declaration is deleted, not shadowed; the `TELEMETRY_SERIES` re-export is removed. Geometry, model, plot, legend and table untouched.
- `web-dashboard/src/pages/MonitoringPage.jsx` — imports `SERIES` from `../utils/series` and reads it in the per-sensor statistics; the window control, the three statistics and the session table are unchanged.

## Decisions Made

- **`NON_IDENTITY_TRACE` is exported rather than left as a hard-coded variable name in plan 03-04.** D-05 keeps `TrendChart`'s peak trace on the sage `--secondary` line; exporting the name lets that carve-out be imported and asserted, and the module's own test proves it is not a member of the series set. A call site writing `--secondary` by hand would have read as a fourth series.
- **The alias and its importer moved together.** `03-CONTEXT.md:49` recorded `TELEMETRY_SERIES` as a zero-importer stale surface; the pattern map found exactly one consumer (`MonitoringPage.jsx:21,64`). Deleting the re-export while an importer existed would have broken the build (threat T-03-06), so both sides changed in one task and `pages.test.jsx` renders the page that consumed it.
- **A literal three-series floor, on top of the plan's `SERIES.length` comparison.** See Deviations item 2.
- **The empty-buffer assertion checks the whole rendered text, not just the absence of a `figure`.** The must-have is "entirely blank rather than an empty axis frame", and the lighter check would have passed a component that rendered axis labels with no plot.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The chart test's literal `stroke-dasharray` failed the token gate**
- **Found during:** plan-level verification (full suite), after Task 3 had been committed
- **Issue:** `designTokens.test.js` sweeps every `.jsx` under `src` for utility-shaped tokens and generates the real Tailwind stylesheet to confirm each one has a rule. The new test's `line.getAttribute("stroke-dasharray")` is a genuine SVG attribute, but the token assembly's `stroke-` prefix read it as a Tailwind class with no rule, so `generates a rule for every utility class used in src` failed with `stroke-dasharray <- components/monitoring/TelemetryChart.test.jsx`. The task-scoped `npm run test -- <path>` runs could not see this: the gate is a different file.
- **Fix:** The attribute name is assembled from parts at the point of use (`["stroke", "dasharray"].join("-")`) with the reason recorded in the code, the same posture `copy.test.js` already takes for its banned strings so a guard does not match its own file. No assertion changed.
- **Files modified:** `web-dashboard/src/components/monitoring/TelemetryChart.test.jsx`
- **Verification:** `npm --prefix web-dashboard run test -- src/components/monitoring/TelemetryChart.test.jsx src/designTokens.test.js` → 12/12 pass; full suite 25 files / 242 tests pass.
- **Committed in:** `d3a30326`

**2. [Rule 2 - Missing Critical] Added the literal three-series floor the threat register names**
- **Found during:** Task 2 (writing the one-model lock), and confirmed by a hand probe
- **Issue:** The plan's Task-2 action derives every count from `SERIES.length`, so probing `SERIES` down to two entries left `TelemetryChart.test.jsx` fully green — self-consistent, and therefore unable to catch a silently shrunken import (threat T-03-05). The plan's own threat register names the stronger form for this file: "asserts the three-series count before the per-series verdicts". The plan's `must_haves` truth is "SERIES has fixed cardinality three: the chart renders exactly three series at any record count".
- **Fix:** Added a case asserting `expect(SERIES).toHaveLength(3)` and `expect(plotLines(container)).toHaveLength(3)` before the per-series cases, so this file fails on a shrunken import even though `series.test.js` also catches it.
- **Files modified:** `web-dashboard/src/components/monitoring/TelemetryChart.test.jsx`
- **Verification:** Probe — shrinking `SERIES` to two entries now fails this file (`renders all three declared series`) as well as three cases in `series.test.js`; restored byte-identically.
- **Committed in:** `a4628f66` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical)
**Impact on plan:** Both were corrections to the plan's own test artefacts, discovered by the plan's own non-vacuity and full-suite checks. No scope creep: no component behaviour, no palette value, no page copy and no consumer outside `src/utils/series.js` was added or changed.

### Prohibitions verified as held

- **No series value added, dropped or re-ordered** — three entries, `forefoot` / `midfoot` / `heel`, copied verbatim from `TelemetryChart.jsx:25-29` before deletion.
- **No hex in `series.js`** — `grep -cE '#[0-9a-fA-F]{3,8}'` returns 0, asserted by the module's own test.
- **No non-chart consumer added** — the only files naming `--series-N` under `src/` are the module, its test, `index.css` and the chart; `MonitoringPage` consumes `series.key` only, never a colour.
- **No second copy left behind** — the component-local declaration was deleted, and `grep -rn 'TELEMETRY_SERIES' web-dashboard/src/` returns nothing.

## Issues Encountered

- **A green task-scoped run is not a green plan.** Task 2's verify command (`npm run test -- src/components/monitoring/TelemetryChart.test.jsx`) passed 7/7 while the token gate in a different file was failing. Only the plan-level full-suite run surfaced it. This is the second consecutive Phase 3 plan to hit an environment/gate obstacle that the task-scoped command cannot see (03-01 hit `dist/` and the ledger mismatch), which is worth carrying into the remaining plans' exit criteria rather than treating as a one-off.
- **`web-dashboard/dist/` was dirtied by the mandated build and restored to HEAD** — the build replaced a tracked CSS and JS asset, modified `dist/index.html` and emitted two new untracked assets. Restored with a path-scoped `git checkout -- web-dashboard/dist/` plus an explicit `rm` of the two new files (`git clean` deliberately not used). This is a recurrence of the already-open WINDOWS entry for `dist/` tracking policy, matching the 03-01 precedent, so no new ledger entry was added for it.
- No authentication gates, no checkpoints, no user setup.

## Known Stubs

None. Every assertion in the three new test files reads real, shipped behaviour, and nothing in this plan renders placeholder, mock or hardcoded-empty data. `NON_IDENTITY_TRACE` is exported but unconsumed until plan 03-04 — it is a declared constant with a named owner in this phase, not a stub: the alternative was a hard-coded variable name at the call site, which is the drift this module exists to prevent.

## User Setup Required

None - no external service configuration required. No package was installed (the plan's T-03-SC mitigation held: `package.json` untouched).

## Next Phase Readiness

- **Plan 03-04 has the source it needs.** `import { SERIES, NON_IDENTITY_TRACE } from "../utils/series"` is the whole interface; `TelemetryChart` is the worked example of consuming it, including the dash surviving on both the line and the swatch.
- **Plan 03-05 has a target for the quarantine gate.** The three variable names are reachable through exactly one module, so the gate's positive half (the allowlisted chart files actually reference the source) and negative half (no `--series-N` outside the chart set) both have a single, greppable anchor.
- **`series.js` is a `.js` module, which is why 03-05's gate must walk `.js`.** `designTokens.test.js:45`, `a11y.test.jsx:59` and `copy.test.js:41` collect `.jsx` only; this plan's own Rule 1 deviation is a live illustration of what life looks like on the wrong side of a sweep's extension filter.
- **Carried forward, open by design:** the 360/768/1280 click-through of the rebuilt series path is an unrun verify in `.planning/WINDOWS.md` (no browser in this environment), alongside the two deviations recorded above.
- **Blockers:** none.

---
*Phase: 03-primitive-rebuilds*
*Completed: 2026-10-18*

## Self-Check: PASSED

- All 5 source/test files and this SUMMARY exist on disk.
- All 4 commits (`2ad4bef6`, `a4628f66`, `c1d262d5`, `d3a30326`) are ancestors of HEAD.
- Ledger measurement: `plan_head_before` `b5828527` → `plan_head_after` `d3a30326`, `commits: 4` (matches the 4 commits above).
- No uncommitted change under `web-dashboard/src/`.
