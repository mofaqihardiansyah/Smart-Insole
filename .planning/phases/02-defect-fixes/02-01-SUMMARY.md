---
phase: 02-defect-fixes
plan: 01
subsystem: ui
tags: [tailwind, design-tokens, box-shadow, css-variables, vitest, build-gate]

# Dependency graph
requires:
  - phase: 01-design-system-audit-token-lock
    provides: token inventory (token-inventory.md), the designTokens.test.js build gate, and the DESIGN.md elevation table
provides:
  - Landing shadow set (card, lift, nav, glow) and `.landing-scope .nav-scrolled` normalized to the declared `warm-dark` ink (23 23 25)
  - `boxShadow.lg` given its own value, distinct from the modal-only `overlay`
  - designTokens.test.js hardened — positive declared-ink assertion, negative undeclared-literal scan, pairwise shadow uniqueness
  - token-inventory.md corrected (four shadow rows, `--inner-glow-a`, `warm-*` re-sourced to `:root`, honest closing claim)
affects: [03-primitive-rebuilds, 04-shell-rebuild, 05-page-rebuild]

# Actuals (#2632) — pairs with the plan's `estimate`.
actuals:
  tokens: 2418          # chars/4 over the four named files' realized diff
  tasks: 3
  commits: 3
plan_head_before: 54ae72a71c0f8c8712e17cad02fd4309b76e8d9f
plan_head_after: 85d1691ecf42a362fbb3821f5fc4e318a653ad0b

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Declared-ink positive assertion + undeclared-literal negative source scan in the token gate"
    - "Pairwise uniqueness assertion across boxShadow values"

key-files:
  created: []
  modified:
    - web-dashboard/tailwind.config.js
    - web-dashboard/src/index.css
    - web-dashboard/src/designTokens.test.js
    - .planning/phases/01-design-system-audit-token-lock/token-inventory.md

key-decisions:
  - "The undeclared fifth neutral shipped at five sites, not one — config and index.css normalized together with the test inversion in a single commit (D-04 atomicity)"
  - "lg resolves to `0 6px 24px rgb(15 23 42 / 0.08)`, numerically between md and the modal-only overlay; overlay string untouched"
  - "The four new inventory rows are recorded `matched` (post-fix), while the `.nav-scrolled` row keeps its Phase 1 `flagged` status as the finding that opened FIX-01"

patterns-established:
  - "Token gate: assert the declared ink positively AND scan the source negatively, so fixing 4 of 5 sites cannot pass"

requirements-completed: [FIX-01]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "All five landing shadow sites (tailwind.config.js card/lift/nav/glow + .landing-scope .nav-scrolled) carry the declared warm-dark ink; the undeclared fifth neutral appears in neither source file"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "web-dashboard/src/designTokens.test.js#keeps the two elevation languages apart"
        status: pass
      - kind: unit
        ref: "web-dashboard/src/designTokens.test.js#declares no shade outside the token inventory"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every boxShadow step has its own value; lg is no longer byte-identical to the modal-only overlay"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "web-dashboard/src/designTokens.test.js#gives every shadow step its own value"
        status: pass
    human_judgment: false
  - id: D3
    description: "token-inventory.md records the four shadow rows, the --inner-glow-a declaration, the correct :root provenance for warm-*, and an honest closing claim"
    requirement: FIX-01
    verification:
      - kind: other
        ref: "grep-based structure check from the plan's task-3 <automated> (5 greps) — PASS"
        status: pass
    human_judgment: true
    rationale: "Structural presence is machine-checked, but the accuracy of the corrected provenance and closing claim is a documentation-judgment a human must read."

duration: 3 min
completed: 2026-10-17
status: complete
---

# Phase 2 Plan 01: Normalize the undeclared fifth neutral at all five sites Summary

**The five landing shadow sites and the `lg`/`overlay` elevation duplicate were fixed: every landing shadow now resolves to the declared `warm-dark` ink, the token gate asserts the declared ink positively and scans for the undeclared literal negatively, `lg` has its own elevation step, and the token inventory that mis-scoped FIX-01 is corrected.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-10-17T11:30:42Z
- **Completed:** 2026-10-17T11:33:46Z
- **Tasks:** 3
- **Files modified:** 4 (+ regenerated `web-dashboard/dist/` build output)

## Accomplishments
- The undeclared fifth neutral (`#232427` / `35 36 39`) is gone from `tailwind.config.js` and `index.css`; the four landing shadows (`card`, `lift`, `nav`, `glow`) and `.landing-scope .nav-scrolled` all use the declared `warm-dark` ink (`23 23 25`). Offsets, blurs, spreads and alphas (25/30/25/35%) are byte-for-byte unchanged.
- The build gate was inverted and extended: `designTokens.test.js` now asserts `boxShadow.card` matches the *declared* ink and scans both source files for the undeclared literal, so fixing 4 of 5 sites fails rather than passing silently.
- `boxShadow.lg` was byte-identical to the modal-only `overlay`; it now carries its own value, and a pairwise shadow-uniqueness assertion locks the contract.
- `token-inventory.md` now records the shadow surface it never inventoried, the missing `--inner-glow-a` row, the correct `:root` provenance for the `warm-*` group, and an honest closing claim (five sites, not one).

## Task Commits

Each task was committed atomically:

1. **Task 1: End-to-end token conformance — declared ink at all five sites, gate inverted atomically (tracer)** - `4c552607` (fix)
2. **Task 2: Give `lg` its own elevation so no two shadow tokens are byte-identical** - `622b47f7` (fix)
3. **Task 3: Correct token-inventory.md** - `85d1691e` (docs)

**Plan metadata:** `HEAD` (docs: complete 02-01 plan)

_Note: Task 1 was a `type="tracer"` task; the tracer feedback gate was evaluated (interactive, `end-of-phase`, automated-only `<verify>`) — verify re-run green, expanded without a checkpoint._

## Files Created/Modified
- `web-dashboard/tailwind.config.js` - landing shadows `card`/`lift`/`nav`/`glow` normalized to `rgb(23 23 25 / …)`; `lg` given its own value `0 6px 24px rgb(15 23 42 / 0.08)`
- `web-dashboard/src/index.css` - `.landing-scope .nav-scrolled` shadow normalized to `rgb(23 23 25 / 0.25)`
- `web-dashboard/src/designTokens.test.js` - elevation assertion inverted to the declared ink; negative undeclared-literal source scan added; pairwise shadow-uniqueness case added
- `.planning/phases/01-design-system-audit-token-lock/token-inventory.md` - four shadow rows + `--inner-glow-a` row added; `warm-*` rows re-sourced to `:root`; closing claim replaced
- `web-dashboard/dist/**` - regenerated build output (CSS/JS hashes + `index.html`), committed per the repo's existing convention (`71200e99`)

## Decisions Made
- **Atomic config + test + css change** (D-04): the ink normalization in `tailwind.config.js` + `index.css` and the test inversion land in one commit (`4c552607`), so `npm test` is never red on either side of a split.
- **`lg` value choice**: `0 6px 24px rgb(15 23 42 / 0.08)` sits numerically between the declared `md` step (4px/16px, navy 7%) and the modal-only `overlay` step (8px/32px, navy 10%), stays on the declared navy ink, and stops a dropdown from reading at modal elevation. `overlay` is untouched.
- **Inventory row statuses**: the four new `tailwind.config.js` shadow rows are recorded `matched` (they hold the post-fix value); the `.nav-scrolled` row keeps its Phase 1 `flagged` status as the finding that opened FIX-01, and the closing claim states the five-site count explicitly.
- **`--inner-glow-a` provenance**: recorded as `web-dashboard/src/index.css (:root)` per task-3 action item 2 (it is declared at `index.css:100` and re-declared at `:288`; neither declaration was removed).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- **`gsd_run` / `gsd-tools` unavailable in this environment** (exit 127), so STATE.md, ROADMAP.md and REQUIREMENTS.md were updated with direct edits and commits rather than the `gsd-tools query` handlers. The plan's required content (position, decisions, requirement status) was applied manually.
- **The build regenerated tracked `web-dashboard/dist/`** (committed build output). This is an expected consequence of the plan's `npm run build` verification step. It is committed with the plan's tracking commit, matching the repo's existing convention (`71200e99 … dist build output`).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- FIX-01 is complete at the token layer; the corrected `boxShadow` tokens propagate to Phases 3-5 for free.
- The token gate now catches the defect class (declared ink positive + undeclared literal negative + shadow uniqueness), so a regression fails `npm test`.
- Full suite (160 tests, 11 files) and `npm run build` are green.

---
*Phase: 02-defect-fixes*
*Completed: 2026-10-17*

## Self-Check: PASSED

- All 5 expected files exist on disk (4 plan deliverables + SUMMARY.md).
- All 3 task commits (`4c552607`, `622b47f7`, `85d1691e`) are ancestors of HEAD.
- Plan-level verification re-run green: `designTokens.test.js` 5/5, full suite 160/160, `npm run build` zero errors, no `35 36 39` in `tailwind.config.js`/`index.css`.
