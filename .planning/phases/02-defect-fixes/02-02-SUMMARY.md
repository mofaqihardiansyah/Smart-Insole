---
phase: 02-defect-fixes
plan: 02
subsystem: ui
tags: [a11y, focus-visible, touch-targets, vitest, tailwind, react, landing]

# Dependency graph
requires:
  - phase: 02-defect-fixes
    provides: "02-03's semantic-colour vocabulary and 02-06's error-boundary App.jsx rewrite — this plan renders `<App />` and walks every `.jsx` under `src/`, so it observes both plans' output"
provides:
  - "landing anchors (brand, 4 desktop, 4 footer) and the icon-only drawer trigger at >=44x44px carrying explicit focus-visible ring utilities"
  - "web-dashboard/src/a11y.test.jsx — the automated FIX-02/FIX-03 contract for both the landing and the app register"
affects: [02-defect-fixes, phase-03-composites, GATE-03, landing, dashboard]

# Actuals (#2632) — pairs with the plan's `estimate` to calibrate future estimates.
# Same estimateTokens scale (chars/4 over the realized diff), never a harness token count.
actuals:
  tokens: 3482    # chars/4 over the added+removed lines of the 3 task commits
  tasks: 3
  commits: 3
plan_head_before: 966fce0f96034a39f55bb9927cd31e5a401398af
plan_head_after: 06cf8761e5663f6fafc1b15860ea5155d1c74b09

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Rendered-DOM assertion in preference to a source grep: a class grep cannot prove a class reached an element"
    - "Phase-wide `.jsx` source sweep as the enforcement half of a UI contract (outline reset without a ring; positive tabIndex)"

key-files:
  created:
    - web-dashboard/src/a11y.test.jsx
  modified:
    - web-dashboard/src/pages/LandingPage.jsx
    - web-dashboard/src/components/ui/ErrorBoundary.test.jsx
    - web-dashboard/src/components/dashboard/BentoGrid.test.jsx

key-decisions:
  - "Swept every `.jsx` under `src/` — test fixtures included — rather than only non-test sources, keeping the sweep and the acceptance grep measuring the same set"
  - "Landing drawer trigger moved 40x40 -> `h-11 w-11` (44x44) and gained explicit `focus-visible:ring-2` instead of leaning on the global outline"
  - "Mobile sheet links got the ring pair only; no `min-h-[44px]` — `py-3` + `text-base` already clears 44px and the plan forbade touching the padding"
  - "`ring-offset-warm-card` on the landing nav, because the nav sits on the warm card surface"
  - "No `min-h` assertion for `BentoCell` — it is a Phase 3 primitive with a content-driven floor and appears in no plan's `files_modified`"

patterns-established:
  - "`a11y.test.jsx` is the Wave 0 accessibility assertion file the validation strategy requires: it owns the FIX-02/FIX-03 contract for both registers, not just the landing"

requirements-completed: [FIX-02, FIX-03]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "Landing nav anchors (1 brand + 4 desktop + 4 footer) sit at `min-h-[44px]` with an explicit focus ring, asserted against the rendered DOM"
    requirement: FIX-03
    verification:
      - kind: unit
        ref: "web-dashboard/src/a11y.test.jsx#measures every landing nav anchor at 44px tall with an explicit focus ring"
        status: pass
    human_judgment: false
  - id: D2
    description: "The icon-only landing drawer trigger measures 44x44 (`h-11 w-11`) with an explicit focus ring and keeps its disclosure semantics"
    requirement: FIX-03
    verification:
      - kind: unit
        ref: "web-dashboard/src/a11y.test.jsx#measures the icon-only drawer trigger at 44x44 with an explicit focus ring"
        status: pass
    human_judgment: false
  - id: D3
    description: "Phase-wide `.jsx` lock: no line resets the outline without putting a ring back, and the global `:focus-visible` floor stays non-`none` in both colour-scheme scopes"
    requirement: FIX-02
    verification:
      - kind: unit
        ref: "web-dashboard/src/a11y.test.jsx#pairs every outline reset with a ring, and keeps the global floor alive"
        status: pass
    human_judgment: false
  - id: D4
    description: "No positive `tabIndex` anywhere under `src/` — keyboard focus order stays DOM order, while `tabIndex={-1}` programmatic targets remain legal"
    requirement: FIX-02
    verification:
      - kind: unit
        ref: "web-dashboard/src/a11y.test.jsx#keeps tab order to the natural document order"
        status: pass
    human_judgment: false
  - id: D5
    description: "Shared controls hold the 44px floor with an `lg`-only release: `GlassButton` sm/md/lg, `GlassInput`, `StateRetry`, and `BentoCell`'s button semantics when (and only when) it is actionable"
    requirement: FIX-03
    verification:
      - kind: unit
        ref: "web-dashboard/src/a11y.test.jsx#holds the 44px floor on every GlassButton size and releases it only at lg"
        status: pass
      - kind: unit
        ref: "web-dashboard/src/a11y.test.jsx#holds the 44px floor and a ring on the shared input and retry control"
        status: pass
      - kind: unit
        ref: "web-dashboard/src/a11y.test.jsx#gives a bento tile button semantics only when it has something to do"
        status: pass
    human_judgment: false
  - id: D6
    description: "Visual click-through of the landing at 360px, 768px and 1280px: the drawer trigger measures 44x44, nav links do not shrink below 44px, and Tab paints a visible ring on each"
    verification: []
    human_judgment: true
    rationale: "jsdom has no layout engine and no paint, so a physically measured 44x44 box and a visibly painted focus ring at three viewports cannot be proven by this suite. This is the plan's own manual `<verification>` item, and GATE-03 re-runs it."

# Metrics
duration: 12min
completed: 2026-10-17
status: complete
---

# Phase 02 Plan 02: Landing and shared-control accessibility Summary

**FIX-02 and FIX-03 locked in `src/a11y.test.jsx`: the landing anchors and the icon-only drawer trigger brought to 44x44px with explicit focus rings, plus a phase-wide `.jsx` sweep that fails any line resetting the outline without putting a ring back**

## Performance

- **Duration:** 12 min
- **Started:** 2026-10-17T12:54:42Z
- **Completed:** 2026-10-17T13:06:41Z
- **Tasks:** 3
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments

- The two genuinely non-conformant elements are fixed. The landing drawer trigger moved from 40x40 to `h-11 w-11` (44x44), and it and the four desktop nav links now carry explicit `focus-visible:ring-2` utilities rather than leaning on the global outline alone — the exact defect class FIX-02 names for an icon-only control.
- `web-dashboard/src/a11y.test.jsx` created: the Wave 0 accessibility assertion file the validation strategy requires. It asserts the **rendered DOM** where a class grep would be insufficient (the plan's own reasoning: a grep cannot prove a class reached an element), and scans source for the two shapes that silently delete a floor.
- The `outline-none`/`ring-2` pairing is enforced across every `.jsx` under `src/`, so a future edit that drops a ring fails `npm test` instead of shipping. The global `:focus-visible` floor in `index.css` is asserted to survive in both colour-scheme scopes.
- Positive `tabIndex` is now forbidden by test, so keyboard focus order stays DOM order; the two legitimate `tabIndex={-1}` programmatic targets (`RowMenu.jsx:98`, `DashboardPage.jsx:705`) keep passing.
- Shared controls — `GlassButton` at all three sizes, `GlassInput`, `StateRetry`, and `BentoCell`'s actionability branch — are pinned to the 44px floor with the `lg`-only release, so the "34-40px allowance applies only from `lg`" truth in the plan's `must_haves` cannot drift down into a touch width.

## Task Commits

Each task was committed atomically:

1. **Task 1: End-to-end landing accessibility — every landing anchor and the drawer trigger at 44px with an explicit ring** (`type="tracer"`) — `31fcc921` (feat)
2. **Task 2: Lock the app register's focus indicator — no `outline-none` without its ring** — `4060daba` (test)
3. **Task 3: Lock the 44px floor and the `lg` allowance on the shared controls** — `06cf8761` (test)

**Plan metadata:** committed separately as the `docs(02-02): complete …` commit that carries this file, STATE.md and ROADMAP.md.

## Files Created/Modified

- `web-dashboard/src/a11y.test.jsx` — **created.** Seven tests in three describes: landing nav anchors at 44px + ring, the drawer trigger at 44x44 + ring, the phase-wide outline/ring sweep, the positive-`tabIndex` sweep, and the shared-control floor block (GlassButton / GlassInput / StateRetry / BentoCell).
- `web-dashboard/src/pages/LandingPage.jsx` — brand anchor `:201`, desktop nav `:217`, drawer trigger `:244`, mobile sheet links `:272`, footer nav `:765`: floor and ring utilities added.
- `web-dashboard/src/components/ui/ErrorBoundary.test.jsx` — one fixture literal re-wrapped so the outline token and its ring sit on one line (see Deviations #1).
- `web-dashboard/src/components/dashboard/BentoGrid.test.jsx` — one assertion re-wrapped for the same reason (see Deviations #1).

## Decisions Made

- **Swept every `.jsx` under `src/`, test files included.** This is faithful to `designTokens.test.js`'s walk, whose `collectSources` shape the plan mirrors, and it keeps the two measures whole: the plan's acceptance grep counts test files too, so excluding them in the sweep would have left the sweep and the grep disagreeing about what "every line" means.
- **`ring-offset-warm-card`, not `ring-offset-surface`, on the landing nav.** The nav sits on the warm card; the offset colour has to match the surface beneath it or the ring reads as a stray outline. `warm-card` is declared at `tailwind.config.js:73`.
- **Mobile sheet links received the ring pair but not `min-h-[44px]`/`inline-flex`.** `py-3` plus `text-base` already clears 44px here, and the plan explicitly said not to change the padding — adding height utilities would have been an unrequested layout change to a line the plan only asked to give a ring.
- **No `min-h` assertion for `BentoCell`.** It is a Phase 3 primitive whose floor is content-driven (the `h-12` icon tile plus the value and caption block), it appears in no plan's `files_modified`, and pinning a height here would require an undeclared write to a Phase 3 file. The contract that exists is asserted; the contract that does not is left alone.
- **Tracer gate resolved to interactive mode, row 3.** `human_verify_mode` is unset and defaults to `end-of-phase`; the tracer task's `<verify>` is automated-only, so the gate called for a re-run of the verify rather than a human checkpoint. It passed, and the expansion task proceeded. Recorded here rather than taken as a checkpoint.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Two test-fixture literals re-wrapped onto one line**
- **Found during:** Task 2 (outline/ring source lock)
- **Issue:** `ErrorBoundary.test.jsx` and `BentoGrid.test.jsx` hold `focus-visible:outline-none` inside fixtures whose array elements / assertion arguments had been wrapped across lines, so the outline token and `ring-2` sat on different physical lines. Both the new sweep and the plan's acceptance grep (`grep -rn 'outline-none' src --include=*.jsx | grep -vc 'ring-2'`, which must return 0) work per line, so these two files read as offenders even though their *shipped* pairing is correct. Without the fix the plan's own acceptance criterion could not pass.
- **Fix:** Joined the two literals so each offending line carries both tokens. Array contents and assertion semantics are byte-for-byte unchanged; no test behaviour altered.
- **Files modified:** `web-dashboard/src/components/ui/ErrorBoundary.test.jsx:107`, `web-dashboard/src/components/dashboard/BentoGrid.test.jsx:178`
- **Verification:** Full suite green (205 tests / 18 files); acceptance grep returns 0.
- **Committed in:** `4060daba` (part of the task commit)

**2. [Rule 3 - Blocking] Verification build regenerates tracked `dist/` output**
- **Found during:** plan-level verification
- **Issue:** `web-dashboard/dist/` is tracked in git, so the AGENTS.md-mandated `npm run build` rewrites hashed asset filenames and dirties the working tree with output that no task in this plan owns. Committing it would have put unplanned files in the plan's diff; leaving it dirty would have left a tracked-artifact modification behind.
- **Fix:** Left `dist/` out of every commit and restored it to `HEAD` after verification, so this plan's diff contains exactly the files its tasks name. Flagged in `WINDOWS.md` for whoever owns `dist/`'s tracking policy — the repo's own convention (e.g. `71200e99`) is to batch dist output into a separate tracking commit, not per plan.
- **Files modified:** none (restored)
- **Verification:** `git status --short -- web-dashboard/dist` returns no entries.
- **Committed in:** n/a

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Neither alters the delivered contract. Deviation 1 was a precondition for the plan's own acceptance grep to hold at all; deviation 2 keeps the plan's diff scoped and leaves the working tree as it was found. No scope creep.

## Issues Encountered

- **The test file is inside the sweep it defines.** Every non-comment line in `a11y.test.jsx` carrying the literal `outline-none` must also carry `ring-2` on that same line, or the file fails its own rule *and* the acceptance grep. Handled with a single `RING_PAIR = ['focus-visible:outline-none', 'focus-visible:ring-2']` constant written on one line and consumed via `RING_PAIR.forEach(...)`, so no assertion line ever names one token alone.
- **Both sweeps were proven non-vacuous.** A throwaway `src/__a11y_probe.jsx` containing a lone `focus-visible:outline-none` failed the Task 2 sweep; a throwaway `.jsx` containing `tabIndex={3}` failed the new tab-order sweep (reported `__tabindex_probe.jsx:2`). Both probes were deleted immediately and the suite re-run green, so the sweeps fail loudly rather than matching nothing.
- **One design-token landmine avoided.** `designTokens.test.js` treats any util-shaped hyphenated word as a class, prose included — an early comment word containing a reserved prefix broke its "no stray utilities" assertion. The comment was reworded to plain prose ("outline reset").

## Known Stubs

None. Every assertion reads the real shipped component; no fixture data reaches a UI surface and no placeholder text was introduced.

## Threat Flags

None. This plan adds test coverage and focus/touch utilities to existing elements. It introduces no new network endpoint, auth path, file access pattern, or schema change at a trust boundary.

## Auth Gates

None. No authentication or external-service step was required.

## Next Phase Readiness

- **Ready for Phase 3 composites.** `BentoCell` and the other shared controls now have their floor and focus contract pinned, so a composite that composes them inherits both rather than re-deriving them.
- **One item is for a human, and it is the plan's own:** the manual click-through of the landing at 360px, 768px and 1280px (coverage `D6`). jsdom has no layout engine, so the painted ring and the measured 44x44 box are asserted as utilities, never as pixels. GATE-03 re-runs it; recording it here so it cannot be mistaken for covered.
- No blockers. `npm test` (205 tests / 18 files) and `npm run build` both pass with zero errors, and `designTokens.test.js` is green, so every class added to `LandingPage.jsx` generates a rule.

---
*Phase: 02-defect-fixes*
*Completed: 2026-10-17*
