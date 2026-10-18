---
phase: 03-primitive-rebuilds
plan: 03
subsystem: ui
tags: [react, tailwind, vitest, jsdom, live-region, feedback-primitive, i18n]

# Dependency graph
requires:
  - phase: 02-defect-fixes
    provides: the shared `roleFor`-style single-decision idiom, the `StateRetry` primitive and the `MemoryRouter` + `InsoleProvider` page-render pattern
provides:
  - "`web-dashboard/src/components/ui/feedbackState.js` — the one `roleFor(state)` decision that maps a state onto its ARIA role and live-region politeness (D-02)"
  - "`web-dashboard/src/components/ui/AlertBanner.jsx` — the Alert/Banner primitive that owns the tone-to-role matrix and the two-tier next action (D-03)"
  - "`StatusBanner` reduced to a delegate: same name, same seven props, both exports, so the thirteen call sites in eight files are untouched"
  - "`common.nextStep` in both dictionaries, the copy half of the two-tier next action"
affects: [03-06, 03-07, 04-shell-rebuild, 05-page-rebuild]

# Actuals (#2632) — realized diff, same chars/4 scale as the plan's estimate.
actuals:
  tokens: 9500
  tasks: 3
  commits: 4
---

## What shipped

The interrupted dispatch landed all three tasks before it was cut off during
bookkeeping; the code was re-verified here rather than re-executed.

- `feedbackState.js` holds `roleFor(state)` as the single role decision. Both
  `alert` and `status` outcomes are proven from it, so a state cannot be
  announced one way in one component and another way in a second.
- `AlertBanner.jsx` owns the tone-to-role matrix, the cause plus next-action
  content model and the dismiss control's floor, ring and localised label. It
  warns through `devWarn` in development when the next-action half is missing,
  with a benign production fallback (D-03).
- `StatusBanner.jsx` is now 39 lines that delegate to `AlertBanner`. Its prop
  signature is byte-identical to the pre-plan version — `tone`, `title`,
  `children`, `action`, `onDismiss`, `dismissLabel`, `className` — and both
  `export { StatusBanner }` and `export default` survive, which is what keeps
  thirteen call sites in eight files working unchanged.
- `GlassComponents.jsx` re-exports `AlertBanner` beside `StatusBanner`.
- `i18n.js` gains `common.nextStep` in both dictionaries.

## Verification

- `TONES` no longer exists in `StatusBanner.jsx` (0 matches): the tone vocabulary
  has one owner.
- `grep -rc '<StatusBanner'` totals 13 across 8 files, and `aria-live` appears
  nowhere in `AlertBanner.jsx` — the live-region role comes from `roleFor` alone.
- Focused run: 5 files, 70 tests, all passing.
- Full suite: 27 files, 262 tests, all passing. `npm run build` exits 0.

## Deviations

- The dispatch was aborted after its last commit and before it wrote any
  tracking. No behavior or file differs from the plan; only the SUMMARY, the
  ROADMAP checkbox and the `WINDOWS.md` ledger entry were missing, and all three
  were written here.
- `WINDOWS.md` (31 lines from this plan) is committed with the phase ledger
  rather than with the plan's own commits.
