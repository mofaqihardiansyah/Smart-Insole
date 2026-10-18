---
gsd_state_version: "1.0"
milestone: v1.0
milestone_name: Audit, Fix, Rebuild UI/UX Design
current_phase: 4
current_phase_name: Shell rebuild
status: ready
stopped_at: Phase 3 closed — 7/7 plans, one phase summary, no per-plan ceremony
last_updated: "2026-10-18T11:35:00.000Z"
last_activity: 2026-10-18
last_activity_desc: Phase 3 closed (primitives rebuilt, gates landed)
state_head: e5315843
progress:
  total_phases: 6
  completed_phases: 3
  total_plans: 18
  completed_plans: 18
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-10-17)

**Core value:** Trustworthy, legible real-time plantar pressure monitoring that flags risk states clearly — nothing on screen is decorative colour; colour means a foot needs attention.
**Current focus:** Phase 4 — Shell rebuild

## Current Position

Phase: 3 (Primitive rebuilds) — COMPLETE
Plan: 7 of 7
Status: Ready for Phase 4
Last activity: 2026-10-18 — Phase 3 closed; all 7 plans landed and the full suite is green

Progress: [██████████] 100%

## Phase 3 outcome (closed directly, without the per-plan machinery)

Seven plans landed in one session after the GSD phase machinery was turned off.
Gate for every change: `npm --prefix web-dashboard test` and
`npm --prefix web-dashboard run build`. Final state: **34 test files, 314 tests,
build exit 0.** The phase summary lives in `03-PHASE-SUMMARY.md`; per-plan
SUMMARYs are short and exist only because the ROADMAP's progress counter reads
them.

Two design decisions were made while executing and are recorded, not absorbed:

- The bento icon tile keeps its decorative `h-12 w-12` square. The content-driven
  floor applies to the CELL (no min, fixed or max height); the tile holds no copy
  that could be clipped. 03-06's letter and its own acceptance criteria
  contradicted each other; the invariant won.
- `aria-live="off"` does not exist in the source and was not added. The criterion's
  stronger form — live numbers outside every live region — is what the
  `liveRegion.test.js` gate asserts.

## Performance Metrics

**Velocity:**
- Total plans completed: 11
- Average duration: - min
- Total execution time: - hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 5 | - | - |
| 2 | 6 | - | - |

**Recent Trend:**
- Last 5 plans: -
- Trend: -

*Updated after each plan completion*
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01 P05 | 5min | 2 tasks | 1 files |
| Phase 02 P01 | 3min | 3 tasks | 4 files |
| Phase 02 P03 | 13min | 3 tasks | 5 files |
| Phase 02 P05 | 8min | 2 tasks | 4 files |
| Phase 02 P06 | 17min | 3 tasks | 5 files |
| Phase 02 P02 | 12 | 3 tasks | 4 files |
| Phase 02 P04 | 7min | 3 tasks | 3 files |
| Phase 3 P01 | 26 | 3 tasks | 6 files |
| Phase 3 P02 | 6min | 3 tasks | 5 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:
- (milestone just started)
- [Phase 01]: Flag-only per D-06: no index.css/tailwind.config.js/component changes in Phase 1; #232427 left unchanged in source
- [Phase 01]: FIX-01 Phase 2 reference carried for .nav-scrolled #232427 (non-DESIGN.md value); not fixed in Phase 1
- [Phase 02 P01]: Undeclared fifth neutral shipped at 5 sites, not 1; normalized all five to declared `warm-dark` (23 23 25) with the test inversion in one commit (atomicity)
- [Phase 02 P01]: `boxShadow.lg` given its own value (0 6px 24px navy 8%), distinct from the modal-only `overlay`; overlay untouched
- [Phase 02 P01]: Token gate inverts the contract — asserts the declared ink positively and scans the source negatively, so a partial fix fails
- [Phase 02 P03]: Dashboard state rewrite keeps the data arm outermost — the chart branch is retained with every prop unchanged, so the loading/empty/error contract branches around the data view rather than replacing it
- [Phase 02 P03]: Both FIX-08 gaps were page-local in DashboardPage; the page-layer sweep found all 6 zero-data branches already on StatePanel, so no other page needed fixing
- [Phase 02 P03]: The score tile's `safe` verdict maps to the `success` tone at the caller, mirroring the peak tile; the component absorbs an unmapped key silently, so neither it nor review could catch the grey tile for a good reading
- [Phase 02]: The stored-language reader forces the contract value and writes it back, so the in-memory default and the persisted value cannot disagree after a mount; the write sits inside the existing try/catch so private-mode storage cannot white-screen the first render
- [Phase 02]: The DESIGN.md language reconciliation is documentation-only: it states where the switch currently stands and names Phase 5 (LANG-01) as the owner of its removal, leaving the toggle, its mounts and the English dictionary untouched
- [Phase 02 P06]: The crash fallback reuses StatePanel's error branch and StateRetry rather than re-composing the icon/title/body/action markup; the codebase already owns that surface (FIX-08) and a second copy would drift
- [Phase 02 P06]: The boundary is mounted above AppShell (inside Router, outside the providers), so a throw from the auth hook or either provider is caught; the cost is that the fallback reads the dictionary's default language rather than a context value, which is why it calls `t(key)` instead of a hook
- [Phase 02 P06]: `componentDidCatch` reports under the stable label "[ErrorBoundary] render error" so the reporting assertion can find the boundary's own call and not React's re-throw
- [Phase 02]: FIX-02/FIX-03 enforced as an automated contract in src/a11y.test.jsx rather than an eyeballed pass: rendered-DOM assertions where a class grep cannot prove a class reached an element, plus a phase-wide .jsx sweep for the two shapes that silently delete a floor (outline reset with no ring; positive tabIndex)
- [Phase 02]: Both sweeps walk every .jsx under src/ including test fixtures, so the sweep and the plan's acceptance grep measure the same set; two fixture literals were merged onto one line to satisfy that, and both sweeps were proven non-vacuous with throwaway probes
- [Phase 02]: Landing drawer trigger moved 40x40 to h-11 w-11 (44x44) with explicit focus-visible:ring-2 rather than leaning on the global outline; ring-offset-warm-card chosen because the nav sits on the warm card
- [Phase 02]: Mobile sheet links received the ring pair only: py-3 plus text-base already clears 44px and the plan forbade touching the padding, so no height utility was added
- [Phase 02]: BentoCell carries no min-h assertion: it is a Phase 3 primitive with a content-driven floor and appears in no plan's files_modified, so pinning a height would require an undeclared write to a Phase 3 file
- [Phase 02 P04]: The dash rule is now enforced on both sides — `i18n.test.js` gates dictionary values, `copy.test.js` gates the shipped JSX that bypasses the dictionary; the two admin users-table fallbacks moved onto `common.notAvailable` so they fall inside the existing gate rather than beside it
- [Phase 02 P04]: Comment stripping is mandatory, not an optimisation: ~29 `.jsx` files carry dashes in JSDoc prose, so a raw grep would demand edits to comments the requirement scopes out and would make the guard noisy enough to be disabled (threat T-02-11)
- [Phase 02 P04]: The copy guard's walk asserts its collected count (>40 of 54) before any per-file verdict, and excludes `src/__oil_ui_eval__/` by directory rather than filename so the exclusion cannot silently widen as files are added
- [Phase 02 P04]: FIX-05 is asserted as a property of the markup (exactly two header buttons, unchanged after a state transition) plus a source scan for the two reference dead-control labels; the scan assembles its banned strings from parts so it does not match its own file
- [Phase 02 P04]: FIX-07's dictionary case pairs `hasKey` with the rendered-text comparison, because comparing text rendered from `t(key)` against `t(key)` compares a value to itself and cannot detect a removed dictionary entry
- [Phase 02 P04]: `renderDashboard` parameterised (`{ autoConnect = true } = {}`) rather than duplicated, and the two new describes nested under the existing top-level describe so they inherit its localStorage-clearing `beforeEach` — the FIX-07 simulator determinism depends on it
- [Phase 3]: Fix and gate ship in one commit (D-01): a silent fallback that ships a wrong-but-plausible surface is the defect shape, so the correction cannot land without the mechanism that makes the next one impossible.
- [Phase 3]: hover:opacity-90 retained on warm as instant state feedback, not a transition, so it is outside MOTION 1's transition list; no declared warm hover-fill token exists, so replacing it would have meant inventing a value.
- [Phase 3]: danger's hover:bg-danger-hover deleted rather than re-valued: --danger-hover is byte-identical to --danger, so the utility was a no-op; a distinct danger hover is a token decision recorded against ROADMAP backlog 999.3 (UI-SPEC 4, option b) and no hex was invented.
- [Phase 3]: The variantKeys gate's tone= half does not ship in 03-01: its vocabulary is the banner tone set, owned by the new primitive in 03-03 and gated in 03-06.
- [Phase 3]: Task 3 is tdd=true with no RED commit: Task 1 ships the behaviour by plan design, so all nine assertions were green on first run. Recorded as-is rather than fabricating a RED/GREEN pair; tdd_mode is not enabled and the plan is type=execute.
- [Phase 3]: series.js is the single source for the three CVD-safe series values and exports the D-05 carve-out (NON_IDENTITY_TRACE = --secondary) so plan 03-04 proves it by import instead of hard-coding the variable name; the module names --series-N only and its test fails on any hex literal, which keeps index.css the only place the measured values are written.
- [Phase 3]: The TELEMETRY_SERIES alias and its single importer moved in one task: 03-CONTEXT.md:49 recorded the re-export as zero-importer but MonitoringPage.jsx:21,64 consumed it, so deleting the re-export first would have broken the build (threat T-03-06).
- [Phase 3]: A SERIES.length comparison is never the only floor in a chart test: probing SERIES down to two entries left TelemetryChart.test.jsx fully green, so a literal three-series assertion was added to complete the mitigation threat T-03-05 names. A green task-scoped run is not a green plan: the token gate in another file caught the new test's literal SVG dash attribute name, which only the plan-level full-suite run could see.
- [Phase 3]: `AlertBanner` owns the tone-to-role matrix and delegates the role decision to `feedbackState.roleFor`; `StatusBanner` is reduced to a 39-line delegate with a byte-identical prop signature and both exports, which is what keeps thirteen call sites in eight files working unchanged.
- [Phase 3]: The donut carries no dash channel. `SERIES` entries declare a `dash` for the line charts, but a dashed stroke on a contiguous ring reads as a broken ring rather than as a redundant channel, so identity on the donut is recovered from the labelled caption. The plan named only `varName` for the donut.
- [Phase 3]: The donut's unknowable case is a GAP, not a closed ring: an unknown zone key draws no arc while its offset still advances, and its caption row is kept on the neutral `--muted` ink, so the ring and the caption never disagree.
- [Phase 3]: The donut's two centre sizes resolve to the declared scale as classes (`text-stat` 30px, `text-micro` 11px) rather than as two numbers chosen in place, so they cannot drift from the scale.
- [Phase 3]: The `tone=` half of the call-site gate has TWO owners — `Chip`'s tone map and the banner tone map on `AlertBanner` — because the prop is shared by more components than any other key the gate covers. Both maps are read with `mapKeys`, which throws rather than returning empty.
- [Phase 3]: `GlassTable.test.jsx` is a new file outside 03-06's `files_modified`, chosen deliberately: a source-scanning static gate is the wrong owner for a jsdom render assertion, and the plan permitted either home.
- [Phase 3]: `StatePanel` keeps its register byte-identical while the role decision moves to `roleFor`; the second half of the two-tier contract arrives as `nextAction` plus an announced `nextActionLabel` prop, following `AlertBanner`'s `dismissLabel` precedent rather than a dictionary lookup inside a pure primitive.
- [Phase 3]: The quarantine gate strips comments before searching, so a chart's own header comment can name the property it reads. Without stripping, the alternative was exempting every chart file by name, which would have weakened the rule to "charts may reference series properties".
- [Phase 3]: Two new gates were proved failing before being trusted. The `liveRegion` probe caught a real weakness in the first version — it compared the set of files rather than occurrences, so a second region beside an existing one passed; it now pushes one entry per occurrence. The quarantine probe was run against a `.js` file specifically, to prove the widened walk reaches what `designTokens.test.js`'s `.jsx`-only walk skips.

### Phase 3 gates added

| Gate | File | What it fails on |
|---|---|---|
| Call-site keys | `variantKeys.test.js` | an undeclared literal `variant=`, `level=` or `tone=` in any shipped `.jsx` |
| Series quarantine | `seriesQuarantine.test.js` | a raw `--series-N` outside `index.css` and `utils/series.js`, in `.jsx` or `.js` |
| Radius scale | `radiusScale.test.js` | a bare `rounded` or an undeclared radius step under `src/components/ui/` |
| Live regions | `liveRegion.test.js` | a fifth polite region, a live number inside one, or a changed `InsoleContext` guard |

### Pending Todos

None yet.

### Blockers/Concerns

- ⚠️ [Phase 02] CR-01 — `AdminPage.jsx:56-67` early-returns before three `useEffect` hooks (`:70`,
  `:91`, `:108`), so an `/admin` deep link throws. Pre-existing; deliberately not fixed in Phase 02
  (out of the phase's scope fence) and recorded `open` in `02-REVIEW-DISPOSITION.md`.
- ⚠️ [Phase 02] WR-01 / WR-02 — two warnings from the Phase 02 code review, still `open` in
  `02-REVIEW-DISPOSITION.md`.
- ⚠️ [Phase 02] Landing CTA variant collapse — `LandingPage.jsx` passes `variant="warm"` /
  `"warmOutline"` at 8 call sites, but `GlassButton.jsx`'s `VARIANTS` carries neither key, so every
  landing CTA renders the app-register navy `filled` button and the two registers bleed together.
  Pre-existing (keys deleted in `8d9dd996`, before the Phase 02 base). Surfaced by the Phase 02 UI audit.
- ⚠️ [Phase 02] `AdminPage.jsx` ships five English error fallbacks (`:81`, `:102`, `:125`, `:135`,
  `:149`) against the Indonesian-only contract, and `copy.test.js` does not reach them. Pre-existing.
  Surfaced by the Phase 02 UI audit.
- ⚠️ [Phase 02] The dashboard error arm added by 02-03 is unreachable (`InsoleContext.jsx:319-326`,
  `:347-348`), so its retry path is untested. This is the code review's WR-02, independently
  confirmed by the UI audit. **Re-confirmed in Phase 3**: WR-02 is deliberately still open, and
  `liveRegion.test.js` now asserts the guard verbatim so a later "cleanup" fails a gate.
- ⚠️ [Phase 3] Eight feedback panels name a cause with no next step:
  `DashboardPage.jsx:515`, `DashboardPage.jsx:557`, `DevicePage.jsx:142`, `HistoryPage.jsx:305`,
  `MonitoringPage.jsx:137`, `ProfilePage.jsx:82`, `ProfilePage.jsx:185`, `SettingsPage.jsx:303`.
  Phase 3's repair set was AdminPage's five sites by plan scope; the sweep is scoped to that file
  for the same reason. **Owner: Phase 5.** `StatePanel` warns about them in development meanwhile.
- ⚠️ [Phase 3] `web-dashboard/dist/` is tracked in git, so every `npm run build` dirties the tree
  with new hashed asset names. Every Phase 3 build was reverted rather than staged. Not fixed here
  (it is a repo-hygiene decision, not a plan's), recorded as a broken window.
- ⚠️ [Phase 3] `DESIGN.md`'s two amendments (the `Single source` clause and the `TrendChart`
  carve-out record) are **awaiting owner countersignature**. Non-blocking: the code side of D-04 and
  D-05 is enforced by the quarantine gate and 03-04's tests.
- ⚠️ [Phase 3] `DESIGN.md:518-541` F-01 is reported, not fixed. No palette hex value was changed by
  Phase 3; an owner-signed amendment is that finding's remedy.
- ⚠️ [Phase 3] `App.jsx:111` `animate-spin` still violates MOTION 1. Owner: Phase 4 (N-05), carried
  from the Phase 3 UI contract.
- ⚠️ [Phase 3] `03-UI-SPEC.md` C-03's heading claims its off-grid-spacing list is complete but omits
  `StatusBanner.jsx:57 mt-0.5`, `BentoGrid.jsx:70 ml-1.5` and `LoadDonut.jsx:99 space-y-2.5`.
  Cosmetic spec defect; the list is not used by any gate.

## Deferred Items

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| *(none)* | | | | |

## Session Continuity

Last session: 2026-10-18T11:35:00.000Z
Stopped at: Phase 3 closed — 7/7 plans, full suite green (34 files / 314 tests), build exit 0
Resume file: `.planning/phases/03-primitive-rebuilds/03-PHASE-SUMMARY.md`

**Next:** Phase 4 (shell rebuild) — rail, topbar, search and drawer. `ROADMAP.md` still lists
Phases 4-6 with `Plans: TBD`; the remaining work is the shell, then the ten pages plus the landing
page, then the delivery gate. The three-viewport click-through (360/768/1280) is required by repo
convention and remains structurally unverifiable in this environment: there is no browser here, so
the user runs it.
