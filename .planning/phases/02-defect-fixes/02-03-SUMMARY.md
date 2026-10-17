---
phase: 02-defect-fixes
plan: 03
subsystem: ui
tags: [react, vitest, accessibility, semantic-colour, design-tokens, testing-library]

# Dependency graph
requires:
  - phase: 01-design-system-audit-token-lock
    provides: the designTokens.test.js build gate (every utility in src/ must have a generated rule) and DESIGN.md's tile-tone identity rule (colour is a vital sign, not a position)
provides:
  - Dashboard trend panel branches connecting/error/settled-empty over the retained data arm, mirroring MonitoringPage.jsx:119-144 (FIX-08)
  - Dashboard activity feed renders a StatePanel empty region with a cause and a next action instead of a bare line of muted text (FIX-08)
  - StatusChip.test.jsx locks FIX-04's three redundant risk channels against the module's own STATUS_LEVELS
  - BentoGrid.test.jsx locks FIX-06's tone-follows-the-card invariant plus a source lock over DashboardPage's `tiles` slice
  - DashboardPage.states.test.jsx proves the score tile's semantic tone per reachable verdict
  - The score tile maps the `safe` verdict to the `success` tone, so a good reading renders sage, not the neutral fallback
affects: [03-primitive-rebuilds, 04-shell-rebuild, 05-page-rebuild, 06-delivery-gate]

# Actuals (#2632) — pairs with the plan's `estimate` (30000 tokens, 3 tasks).
actuals:
  tokens: 7282          # chars/4 over the realized diff (29128 chars)
  tasks: 3
  commits: 3
plan_head_before: af8fe9be1fb10c2732d58233f9cc8532f74c269c
plan_head_after: 2633091a22e6d0263d779f8f11e998f65752b44c

# Tech tracking
tech-stack:
  added: []            # No packages installed — three test files and one page edit
  patterns:
    - "Read a component's own source vocabulary (ICON_TONES via fs.readFileSync) instead of re-typing it, so an unexported map cannot silently drift"
    - "Rendered tone proof keyed to the verdict, plus a source lock over the caller's slice, for a defect the component cannot detect"
    - "Permutation case that makes a positional tint impossible to pass"

key-files:
  created:
    - web-dashboard/src/pages/DashboardPage.states.test.jsx
    - web-dashboard/src/components/ui/StatePanel.test.jsx
    - web-dashboard/src/components/ui/StatusChip.test.jsx
    - web-dashboard/src/components/dashboard/BentoGrid.test.jsx
  modified:
    - web-dashboard/src/pages/DashboardPage.jsx

key-decisions:
  - "The empty/loading/error rewrite keeps the data arm outermost (history.length > 0 renders TrendChart with every prop unchanged), so the state panels branch around the chart rather than replacing it"
  - "The page sweep is anchored on the ternary shape (a zero-data branch that renders an element), not a bare `length === 0` scan, so guards and validation (`if (rows.length === 0) return;`, `disabled={...}`) are correctly out of scope"
  - "ICON_TONES is not exported, so BentoGrid.test.jsx parses it from the component's source rather than re-typing the pairs"
  - "The score tile's fix lives at the caller (DashboardPage.jsx), mirroring the peak tile, because the component absorbs an unmapped tone key silently by design"

patterns-established:
  - "Source-vocabulary lock: assert a caller's literals against the vocabulary the component itself declares, with equality-test operands excluded as domain values"
  - "Data-driven tone proof: one rendered case per reachable verdict, each asserting the semantic pair present and the neutral fallback pair absent"

requirements-completed: [FIX-04, FIX-06, FIX-08]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "Dashboard trend panel answers a settled, empty session with an actionable empty state (monitoring.empty / monitoring.emptyBody) instead of a skeleton that never resolves"
    requirement: FIX-08
    verification:
      - kind: unit
        ref: "web-dashboard/src/pages/DashboardPage.states.test.jsx#answers a settled, empty session with an actionable empty state"
        status: pass
    human_judgment: false
  - id: D2
    description: "Dashboard trend panel reserves loading for the genuinely in-flight connection and keeps the chart when there is data to draw"
    requirement: FIX-08
    verification:
      - kind: unit
        ref: "web-dashboard/src/pages/DashboardPage.states.test.jsx#announces an in-flight connection as loading"
        status: pass
      - kind: unit
        ref: "web-dashboard/src/pages/DashboardPage.states.test.jsx#keeps the chart when there is data to draw"
        status: pass
    human_judgment: false
  - id: D3
    description: "Dashboard activity feed renders a StatePanel empty region with a cause and a next action, not a bare line of muted text"
    requirement: FIX-08
    verification:
      - kind: unit
        ref: "web-dashboard/src/pages/DashboardPage.states.test.jsx#answers a settled, empty session with an actionable empty state"
        status: pass
    human_judgment: false
  - id: D4
    description: "StatePanel's three variants lock their announcement contract (polite loading, alert error with a real retry, empty out of every live region, unknown variant benign) and the page-layer sweep finds no page shipping a bare text zero-data branch"
    requirement: FIX-08
    verification:
      - kind: unit
        ref: "web-dashboard/src/components/ui/StatePanel.test.jsx#announces loading politely and reserves the space with skeletons"
        status: pass
      - kind: unit
        ref: "web-dashboard/src/components/ui/StatePanel.test.jsx#announces an error as an alert and offers a real retry control"
        status: pass
      - kind: unit
        ref: "web-dashboard/src/components/ui/StatePanel.test.jsx#keeps an empty view out of every live region"
        status: pass
      - kind: unit
        ref: "web-dashboard/src/components/ui/StatePanel.test.jsx#owns a state primitive rather than shipping a bare line of text"
        status: pass
    human_judgment: false
  - id: D5
    description: "StatusChip renders three redundant channels per level (distinct aria-hidden icon shape, translated text label, tone pair) read from STATUS_LEVELS, with mutually distinct tones and icons"
    requirement: FIX-04
    verification:
      - kind: unit
        ref: "web-dashboard/src/components/ui/StatusChip.test.jsx#renders three redundant channels for every level"
        status: pass
      - kind: unit
        ref: "web-dashboard/src/components/ui/StatusChip.test.jsx#gives every level its own tone pair and its own icon"
        status: pass
    human_judgment: false
  - id: D6
    description: "The dashboard's score tile paints each reachable risk verdict with its own semantic tone (safe -> sage, warning -> amber, danger -> red) and never reaches the neutral fallback"
    requirement: FIX-06
    verification:
      - kind: unit
        ref: "web-dashboard/src/pages/DashboardPage.states.test.jsx#paints a good reading with the sage tone, never the neutral fallback"
        status: pass
      - kind: unit
        ref: "web-dashboard/src/pages/DashboardPage.states.test.jsx#paints a warning reading with the warning tone"
        status: pass
      - kind: unit
        ref: "web-dashboard/src/pages/DashboardPage.states.test.jsx#paints a danger reading with the danger tone"
        status: pass
    human_judgment: false
  - id: D7
    description: "BentoGrid's tile tone is a pure function of the card (follows the card under permutation, neutral fallback, no tile without an icon), and the DashboardPage tiles slice declares only vocabulary keys — no decorative accent, no colour literal, no raw verdict passed through"
    requirement: FIX-06
    verification:
      - kind: unit
        ref: "web-dashboard/src/components/dashboard/BentoGrid.test.jsx#keeps each tile's tone tied to its card when the cards are permuted"
        status: pass
      - kind: unit
        ref: "web-dashboard/src/components/dashboard/BentoGrid.test.jsx#declares one tone per tile through the component's own vocabulary"
        status: pass
      - kind: unit
        ref: "web-dashboard/src/components/dashboard/BentoGrid.test.jsx#never hands the risk verdict through as if it were a tone"
        status: pass
    human_judgment: false
  - id: D8
    description: "A tile is only focusable and hoverable when it has something to do: the actionable path is a real button with a paired focus ring, the dead path is a plain div with no button role, and neither carries a min-h utility"
    requirement: FIX-06
    verification:
      - kind: unit
        ref: "web-dashboard/src/components/dashboard/BentoGrid.test.jsx#makes an actionable tile a real button with a visible focus ring"
        status: pass
      - kind: unit
        ref: "web-dashboard/src/components/dashboard/BentoGrid.test.jsx#gives a tile without an action no control role"
        status: pass
    human_judgment: false
  - id: D9
    description: "The plan's manual verification: with the device unplugged, the trend panel reads the empty state rather than an endless skeleton at 360px and 1280px, and the risk tile for a good reading is sage, not grey"
    requirement: FIX-08
    verification:
      - kind: manual_procedural
        ref: "plan 02-03 <verification> manual step; to be confirmed at GATE-03 (three-breakpoint click-through)"
        status: unknown
    human_judgment: true
    rationale: "Visual confirmation across the 360px and 1280px breakpoints on a live connection is a judgment automation does not cover; the rendered tests prove the class contract, not the rendered appearance."

duration: 13 min
completed: 2026-10-17
status: complete
---

# Phase 2 Plan 03: Lock the semantic-colour vocabulary, caller to component Summary

**The dashboard's two dishonest zero-data views were fixed — the trend panel now answers a settled empty session with an actionable empty state and the feed renders a `StatePanel` region — and the semantic-colour vocabulary for risk was locked end to end: `StatusChip`'s three redundant channels, `BentoGrid`'s tone-follows-the-card rule, and the score tile's `safe → sage` mapping that stops a good reading rendering grey.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-10-17T11:42:23Z
- **Completed:** 2026-10-17T11:55:14Z
- **Tasks:** 3
- **Files modified:** 5 (+ regenerated `web-dashboard/dist/` build output)

## Accomplishments
- **FIX-08 (page-local state gaps).** The trend panel's one-arm `history.length === 0 ? loading : chart` check became the `MonitoringPage.jsx:119-144` shape with the data arm kept outermost: populated renders `<TrendChart>` with every prop unchanged, `connecting` renders the loading panel, `error` renders an error panel with a `StateRetry` whose `onRetry` is the provider's `reconnect`, and a settled empty session renders `monitoring.empty` / `monitoring.emptyBody`. The activity feed's bare line of muted text became a `StatePanel variant="empty"` region inside the feed card, so the zero row now carries an icon, a cause and a next action.
- **FIX-04 (colour-alone risk).** `StatusChip.test.jsx` asserts, per level and against the module's own `STATUS_LEVELS`, that a chip renders exactly one `aria-hidden` icon, the visible text label, and both tokens of its declared tone pair — plus that the three tones and the three icons are pairwise distinct, so a level whose only difference is the colour name fails.
- **FIX-06 (semantic tile tone).** Two halves. The caller fix: the score tile at `DashboardPage.jsx` now maps the verdict through the same `safe → "success"` expression the peak tile already uses, making the expression total over the three levels `StatusChip` defines and leaving no reachable verdict to the component's neutral fallback. The proof: `BentoGrid.test.jsx` makes a positional tint impossible to pass (tones follow the card under permutation) and locks the `tiles` slice to the component's own `ICON_TONES` vocabulary; `DashboardPage.states.test.jsx` renders one case per reachable verdict and asserts the score tile's own semantic pair plus the absence of the neutral pair.
- **Page-layer sweep (anti-pattern).** A guarded sweep over `src/pages` for zero-data branches that render a bare element found 6 matching pages, every one of which already imports `StatePanel` — so no page needed fixing. The sweep skips `*.test.jsx`, and is anchored on the ternary shape so guards and validation are correctly out of scope.

## Task Commits

Each task was committed atomically:

1. **Task 1: Answer a settled empty dashboard with an actionable empty state (tracer)** - `6b8dda65` (fix)
2. **Task 2: Lock the three-variant state contract and sweep the page layer** - `3085eb9d` (test)
3. **Task 3: Lock the semantic-colour vocabulary, caller to component** - `2633091a` (test)

**Plan metadata:** the plan-completion `docs(02-03)` commit (SUMMARY.md + STATE.md + ROADMAP.md + REQUIREMENTS.md + regenerated `dist/`).

_Note: Task 1 was a `type="tracer"` task. The tracer feedback gate was evaluated (interactive mode, `end-of-phase`, the `<verify>` carrying only an `<automated>` step) — the verify was re-run green, so execution expanded without a checkpoint, per the gate's row 3._

## Files Created/Modified
- `web-dashboard/src/pages/DashboardPage.states.test.jsx` - new; rendered assertions for the dashboard's data states (FIX-08) and one case per reachable risk verdict for the score tile's semantic tone (FIX-06)
- `web-dashboard/src/components/ui/StatePanel.test.jsx` - new; the three-variant announcement contract (polite loading, alert error with a real retry, empty outside every live region, unknown benign) plus the page-layer anti-pattern sweep
- `web-dashboard/src/components/ui/StatusChip.test.jsx` - new; FIX-04's three redundant channels asserted against the module's own `STATUS_LEVELS`
- `web-dashboard/src/components/dashboard/BentoGrid.test.jsx` - new; tone-follows-the-card under permutation, neutral fallback, missing-icon, the interactive/non-interactive split, and the `tiles`-slice source lock
- `web-dashboard/src/pages/DashboardPage.jsx` - trend/feed state branches (FIX-08) and the score tile's semantic tone (FIX-06: `risk === "safe" ? "success" : risk`)
- `web-dashboard/dist/**` - regenerated build output (CSS/JS hashes + `index.html`), committed with the plan-tracking commit per the repo's existing convention (`af8fe9be`, `71200e99`)

## Decisions Made
- **Data arm outermost.** The state rewrite branches *around* the chart rather than replacing it: `history.length > 0` still renders `<TrendChart>` with every prop unchanged, so the three-state contract cannot displace the data view it exists for.
- **Sweep anchored on the ternary shape.** A naive `length === 0` scan would have wrongly demanded `StatePanel` imports from `LoginPage` / `RegisterPage` / `LandingPage`; anchoring on the rendered-element ternary keeps guards (`if (rows.length === 0) return;`), `disabled={...}` and `Object.keys(x).length === 0` out of scope. The sweep ignores `*.test.jsx`.
- **`ICON_TONES` read, not re-typed.** The map is not exported, so the test parses it from `BentoGrid.jsx` with `fs.readFileSync` and compares the caller's literals against that vocabulary, excluding equality-test operands (a domain value being tested is not a tone).
- **The fix belongs at the caller.** The component absorbs an unmapped tone key into `neutral` by design and cannot detect the defect, so the production change is one line at `DashboardPage.jsx` (mirroring the peak tile) and the proof is rendered, not structural.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected the relative path used by the source-lock reads**
- **Found during:** Task 3 (semantic-colour vocabulary)
- **Issue:** The first run of `BentoGrid.test.jsx` failed to collect: `readSource("../pages/DashboardPage.jsx")` resolved against the test file's URL at `src/components/dashboard/`, yielding the non-existent `src/components/pages/DashboardPage.jsx`.
- **Fix:** Changed the path to `../../pages/DashboardPage.jsx` so it resolves to `src/pages/DashboardPage.jsx`.
- **Files modified:** `web-dashboard/src/components/dashboard/BentoGrid.test.jsx`
- **Verification:** `npx vitest run src/components/dashboard/BentoGrid.test.jsx` — 8/8 green.
- **Committed in:** `2633091a` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** The fix was confined to the new test file's file-resolution path; no scope creep, no production change beyond the planned one line.

## Issues Encountered
- **`gsd_run` / `gsd-tools` unavailable in this environment** (command not found), so STATE.md, ROADMAP.md and REQUIREMENTS.md were updated with direct edits and committed, rather than via the `gsd-tools query` state handlers. The required content (position, decisions, metric row, requirement status) was applied manually — the same fallback recorded in `02-01-SUMMARY.md`.
- **The build regenerated tracked `web-dashboard/dist/`.** An expected consequence of the plan's `npm run build` verification. It is committed with the plan-tracking commit, matching the repo's convention (`71200e99 … dist build output`) and plan 02-01's handling.
- **Pre-existing, out of scope:** the suite emits `Error: Not implemented: navigation (except hash changes)` from the exported-CSV test. It is stderr noise, not a failure, and predates this plan.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- **FIX-08, FIX-04 and FIX-06 are complete at the page/primitive contract layer.** The dashboard's state branches are the reference implementation for plans 02-04 (source labelling, standing actions) and the Phase 3 primitive rebuilds.
- **A regression now fails tests, not review:** a colour-alone risk channel fails `StatusChip.test.jsx`; a positional or unmapped tile tone fails `BentoGrid.test.jsx`; a bare-text zero-data branch fails the sweep; and a good reading rendering grey fails the rendered verdict cases.
- **Manual confirmation outstanding:** the plan's manual step (trend empty state + sage tile at 360px and 1280px on an unplugged device) is recorded as coverage item `D9` and is to be confirmed at GATE-03.
- **Full suite green:** 184 tests across 15 files; `designTokens.test.js` 5/5; `npm run build` with zero errors (chunk-size advisory only).

---

## Self-Check: PASSED

- All 5 plan deliverables exist on disk (`DashboardPage.states.test.jsx`, `StatePanel.test.jsx`, `StatusChip.test.jsx`, `BentoGrid.test.jsx`, `DashboardPage.jsx`).
- All 3 task commits (`6b8dda65`, `3085eb9d`, `2633091a`) are ancestors of HEAD.
- Plan-level verification re-run green: the four plan test files 24/24, `designTokens.test.js` 5/5, full suite 184/184, `npm run build` zero errors, `grep -c 'variant="empty"' DashboardPage.jsx` = 2.

---
*Phase: 02-defect-fixes*
*Completed: 2026-10-17*
