---
phase: 01-design-system-audit-token-lock
plan: 05
subsystem: ui
tags: [design-tokens, css, tailwind, token-inventory, audit]

# Dependency graph
requires:
  - phase: 01-01
    provides: token-inventory.md (D-03 six-column audit table, ~55 rows)
provides:
  - token-inventory.md updated with 8 missing :root variable rows, 3 hardcoded-class radius/shadow token mappings, and 1 flagged .nav-scrolled row (TOKEN-01, TOKEN-02)
affects:
  - Phase 02 FIX (FIX-01 defect carried forward)

# Actuals (#2632) — pairs with the plan's `estimate` (tokens: 18000, tasks: 2) on the chars/4 scale over the realized diff.
actuals:
  tokens: 419
  tasks: 2
  commits: 2
  plan_head_before: 05ed7e5d842a8ada4b6718b731f8cb0db8f14720
  plan_head_after: c9bce3b2e47470c633961ac9fc836e7d60f604a9

# Tech tracking
tech-stack:
  added: []
  patterns: [six-column token-inventory table (D-03), flag-only defect tracking with FIX phase references]

key-files:
  created: [.planning/phases/01-design-system-audit-token-lock/01-05-SUMMARY.md]
  modified: [.planning/phases/01-design-system-audit-token-lock/token-inventory.md]

key-decisions:
  - "Flag-only per D-06: no index.css, tailwind.config.js, or component changes in Phase 1; #232427 left unchanged in source"
  - "FIX-01 Phase 2 reference carried for .nav-scrolled #232427 (non-DESIGN.md value); not fixed in Phase 1"

requirements-completed: [TOKEN-01, TOKEN-02]

coverage:
  - id: D1
    description: "Token inventory closed: 8 missing :root vars mapped to DESIGN.md tokens, .card-surface/.inner-glow radius/shadow mapped, .nav-scrolled #232427 flagged with FIX-01"
    requirement: TOKEN-01, TOKEN-02
    verification:
      - kind: automated
        ref: "grep verify: 8 :root vars, radius: card x1, shadow: panel x2, nav-scrolled row, FIX-01 present, 'Zero flagged rows' count == 0"
        status: pass
    human_judgment: true
    rationale: "Inventory row mapping correctness against DESIGN.md hex values requires manual cross-check; automation only confirms row presence."

# Metrics
duration: 5 min
completed: 2026-10-17
status: complete
---

# Phase 01 Plan 05: Gap Closure — Design-system audit & token lock Summary

**Token inventory closed for TOKEN-01 and TOKEN-02: 8 missing :root CSS variables mapped 1:1 to DESIGN.md tokens by hex, .card-surface/.inner-glow hardcoded radius/shadow mapped to radius: card and shadow: panel, and .nav-scrolled #232427 flagged as non-DESIGN.md with FIX-01 carried to Phase 2 — doc-only, flag-only per D-06.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-10-17T07:04:24Z
- **Completed:** 2026-10-17T07:09:20Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Added inventory rows for the 8 missing :root CSS variables (--primary-btn, --primary-on, --primary-hover, --danger-hover, --sidebar, --inner-glow, --grid, --scrim), each mapped 1:1 to its exact DESIGN.md token by hex value with measured contrast where stated
- Mapped .card-surface border-radius 16px → radius: card (16px) and .card-surface/.inner-glow box-shadow → shadow: panel
- Flagged .nav-scrolled box-shadow #232427 as non-DESIGN.md (warm-dark is #171719) with FIX phase reference FIX-01 carried to Phase 2 FIX work
- Replaced the inventory closing claim so it no longer states "zero flagged rows"
- Left #232427 unchanged in index.css (flag-only per D-06; no source fixes in Phase 1)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add missing :root variable rows and map hardcoded class radius/shadow to tokens** - `d2d9891` (docs)
2. **Task 2: Flag .nav-scrolled #232427 and update inventory closing claim** - `c9bce3b2` (docs)

**Plan metadata:** execution results captured in SUMMARY.md, STATE.md, and ROADMAP.md

## Files Created/Modified
- `.planning/phases/01-design-system-audit-token-lock/token-inventory.md` - +13/-1 lines; 8 :root variable rows, 3 class mapping rows, 1 flagged nav-scrolled row, closing claim updated

## Decisions Made
- Flag-only per D-06: defects are flagged with FIX phase references and carried to Phase 2, not fixed in Phase 1
- #232427 left unchanged in index.css; only the inventory row is flagged

## Deviations from Plan

None - plan executed exactly as written. Both tasks (tracer + auto) completed and committed; all automated verification checks passed.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

TOKEN-01 and TOKEN-02 are unblocked. The .nav-scrolled #232427 flag (FIX-01) is carried forward to Phase 2 FIX work. Phase 1 design-system audit & token lock is complete.

## Self-Check: PASSED

- Created file `.planning/phases/01-design-system-audit-token-lock/01-05-SUMMARY.md` — FOUND
- Source file `token-inventory.md` — FOUND
- Commit `d2d9891` (Task 1) — ancestor of HEAD — FOUND
- Commit `c9bce3b2` (Task 2) — ancestor of HEAD — FOUND

---
*Phase: 01-design-system-audit-token-lock*
*Completed: 2026-10-17*
