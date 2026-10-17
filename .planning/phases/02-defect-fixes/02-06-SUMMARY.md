---
phase: 02-defect-fixes
plan: 06
subsystem: ui
tags: [react, error-boundary, error-handling, i18n, accessibility, vitest]

# Dependency graph
requires:
  - phase: 02-defect-fixes
    provides: FIX-08's StatePanel error composition and StateRetry 44px affordance (02-03), the token layer normalized by 02-01, and the two-dictionary structure guarded by i18n.test.js
provides:
  - "ErrorBoundary: the application-level crash surface, mounted above every view, provider and the auth hook"
  - "error.boundary.title / .body / .action in both dictionaries, inside the parity and dash gates"
  - "an app-level proof that a throwing view replaces the shell instead of blanking the console"
affects: [02-02, verify-work, ship]

# Actuals (#2632) — pairs with the plan's estimate. Same estimateTokens scale
# (chars/4 over the realized diff), never a harness token count.
actuals:
  tokens: 4333    # chars/4 over the realized src+planning diff (dist excluded)
  tasks: 3
  commits: 3
plan_head_before: 93cc1d2f69f0721b35c7b5199b7d325048411414
plan_head_after: 2aef40eccd4572cda5fda7620b31e0026ce222fb

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "React error boundary as the one class component: getDerivedStateFromError derives the render, componentDidCatch reports"
    - "A boundary mounted above the providers resolves its copy through the dictionary's default language instead of a context hook"
    - "A crash surface reuses the in-product error composition (StatePanel + StateRetry) rather than inventing a second one"

key-files:
  created:
    - web-dashboard/src/components/ui/ErrorBoundary.jsx
    - web-dashboard/src/components/ui/ErrorBoundary.test.jsx
    - web-dashboard/src/App.errorBoundary.test.jsx
  modified:
    - web-dashboard/src/utils/i18n.js
    - web-dashboard/src/App.jsx
    - web-dashboard/dist/**

key-decisions:
  - "The fallback reuses StatePanel's error branch and StateRetry rather than re-composing the icon/title/body/action markup: the codebase already owns that shape, and a second copy would drift"
  - "The boundary is mounted above AppShell (inside Router, outside the providers) so a throw from the auth hook or either provider is caught, which is why its copy reads t(key) with the language omitted rather than a context value"
  - "The caught error is reported under a stable label ('[ErrorBoundary] render error') so the reporting assertion can find the boundary's own call and not React's re-throw"

patterns-established:
  - "A src/ .jsx file may not contain a partial Tailwind class token: designTokens.test.js extracts utility-shaped tokens from every .jsx and requires a generated rule for each"
  - "A recovered boundary stays armed: clearing the error state re-renders the child rather than disarming the boundary"

requirements-completed: [FIX-10]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "ErrorBoundary.jsx — a class boundary with getDerivedStateFromError for the render and componentDidCatch for the report, exporting the same class named and default"
    requirement: FIX-10
    verification:
      - kind: unit
        ref: "tests/src/components/ui/ErrorBoundary.test.jsx#exports the same class under both the named and the default binding"
        status: pass
      - kind: unit
        ref: "tests/src/components/ui/ErrorBoundary.test.jsx#renders the fallback, not the child, when a child throws during render"
        status: pass
    human_judgment: false
  - id: D2
    description: "error.boundary.title / .body / .action present in both dictionaries with no dash separators, so the key-parity and dash gates stay green"
    requirement: FIX-10
    verification:
      - kind: unit
        ref: "tests/src/utils/i18n.test.js#has exactly the same key set in both languages"
        status: pass
      - kind: unit
        ref: "tests/src/utils/i18n.test.js#ships no em dashes or en dashes"
        status: pass
      - kind: unit
        ref: "command: grep -c 'error.boundary' web-dashboard/src/utils/i18n.js → 6"
        status: pass
    human_judgment: false
  - id: D3
    description: "The fallback is the product's own page-shaped surface: role=alert, an aria-hidden icon, a readable-measure body, and a 44px keyboard-operable recovery control"
    requirement: FIX-10
    verification:
      - kind: unit
        ref: "tests/src/components/ui/ErrorBoundary.test.jsx#names the cause and the next action in the shipped copy"
        status: pass
      - kind: unit
        ref: "tests/src/components/ui/ErrorBoundary.test.jsx#draws the fallback icon as decoration for assistive technology"
        status: pass
      - kind: unit
        ref: "tests/src/components/ui/ErrorBoundary.test.jsx#fills the viewport the way a page does, rather than a strip above a blank document"
        status: pass
      - kind: unit
        ref: "tests/src/components/ui/ErrorBoundary.test.jsx#recovers the wrapped subtree through a real, keyboard-operable button"
        status: pass
    human_judgment: false
  - id: D4
    description: "The boundary is mounted above every view, provider and the auth hook, so a throwing view replaces the shell instead of blanking the console"
    requirement: FIX-10
    verification:
      - kind: integration
        ref: "tests/src/App.errorBoundary.test.jsx#replaces a view that throws instead of blanking the console"
        status: pass
      - kind: integration
        ref: "tests/src/App.errorBoundary.test.jsx#replaces the shell rather than rendering the fallback inside a broken one"
        status: pass
      - kind: integration
        ref: "tests/src/App.errorBoundary.test.jsx#offers a recovery action that brings the view back"
        status: pass
      - kind: unit
        ref: "tests/src/App.test.jsx#offers a skip link as the first focusable element"
        status: pass
    human_judgment: false
  - id: D5
    description: "The crash surface is legible and page-shaped at the project's 360px / 768px / 1280px breakpoints, and the recovery reads as operable to a human"
    requirement: FIX-10
    verification: []
    human_judgment: true
    rationale: "No browser is available to this execution environment, so the AGENTS.md click-through at the three breakpoints and the plan's manual step (make a page throw, see the fallback, activate the action, restore the page) are outstanding human verification. The DOM-level equivalent is automated in App.errorBoundary.test.jsx, which cannot judge legibility."

# Metrics
duration: 17min
completed: 2026-10-17
status: complete
---

# Phase 02 Plan 06: Application-level ErrorBoundary Summary

**A render throw anywhere in the tree now renders the product's own page-shaped crash surface with a named cause and a working recovery action, instead of a blank console.**

## Performance

- **Duration:** 17 min
- **Started:** 2026-10-17T12:12:00Z
- **Completed:** 2026-10-17T12:29:00Z
- **Tasks:** 3
- **Files modified:** 5 source/planning files (3 created, 2 modified) plus regenerated `dist/` build output

## Accomplishments

- `ErrorBoundary.jsx` — the one class component in the codebase, with `getDerivedStateFromError` deriving the fallback for the render and `componentDidCatch` reporting the error and its component stack under a stable label.
- The fallback is a page, not a string: a `min-h-[100dvh] bg-bg` shell wrapping the `StatePanel` error composition, so the crash surface reads as part of the product and needs no provider, router hook or language context to render.
- The recovery action genuinely recovers: `StateRetry` clears the boundary's error state and the wrapped subtree renders again; a second throw is still caught, and a nested boundary contains the blast radius to its own subtree.
- Three new dictionary keys in both languages (`error.boundary.title` / `.body` / `.action`), dash-free, so the key-parity and dash gates stay green.
- `App.jsx` mounts the boundary above `AppShell` — above every view, both providers and the auth hook — with the reason recorded in the comment beside the mount. The skip link, the providers, the route table and the shell are untouched.
- `App.errorBoundary.test.jsx` proves at the app level that a throwing view replaces the shell rather than rendering the fallback inside a broken one, and that the recovery action brings the view back.

## Task Commits

Each task was committed atomically:

1. **Task 1: End-to-end — a throwing child renders a named cause and a working recovery action** (tracer) — `a94178b9` (feat)
2. **Task 2: Mount the boundary above the whole view tree, and prove a throwing view does not blank the console** — `d055461b` (fix)
3. **Task 3: Lock the fallback's shell, accessibility contract, reporting and re-arming** — `2aef40ec` (test)

**Plan metadata:** see the `docs(02-06)` commit below (docs: complete plan)

## Files Created/Modified

- `web-dashboard/src/components/ui/ErrorBoundary.jsx` — the class boundary, its page-shaped fallback and the recovery action
- `web-dashboard/src/components/ui/ErrorBoundary.test.jsx` — the throw-to-fallback assertion, the recovery proof, the shell and role contract, the reporting assertion, the re-arm and the nested-scoping case
- `web-dashboard/src/App.errorBoundary.test.jsx` — the app-level proof that a throwing view does not blank the console
- `web-dashboard/src/App.jsx` — the boundary mounted above the whole view tree
- `web-dashboard/src/utils/i18n.js` — `error.boundary.title` / `.body` / `.action` in both dictionaries
- `web-dashboard/dist/**` — regenerated `npm run build` output (hashed asset names)

## Decisions Made

- **Reuse over re-composition.** The fallback uses `StatePanel`'s error branch and `StateRetry` rather than re-composing the icon/title/body/action markup. The codebase already owns that surface (FIX-08), and a second copy would drift from it. `StateRetry` is itself the documented "shared retry affordance, so error states do not each invent one".
- **Mount point above the providers.** `<Router><ErrorBoundary><AppShell /></ErrorBoundary></Router>`. Inside `AppShell` the boundary would only catch a page throw; above it, a throw from `useAuth` or from either provider is caught too, which is the case FIX-10 exists for. The cost is that the fallback cannot read a context, so its copy resolves through `t(key)` with the language argument omitted — the dictionary's own default, Indonesian (D-05). This is why it is not a hook and why the reason is stated plainly in the component's comment.
- **A stable report label.** `componentDidCatch` logs `"[ErrorBoundary] render error"` as its first argument so the reporting assertion can find the boundary's call rather than React's own re-throw, which also reaches `console.error`.
- **The offset-colour probe is two complete class tokens, not a pattern.** `designTokens.test.js` extracts utility-shaped tokens from every `.jsx` file under `src/` and requires a generated rule for each; a partial token such as a regex alternative is read as a class name and fails the gate. See the deviation below.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Partial Tailwind class token in the new test file failed the design-token gate**

- **Found during:** Task 3 (Lock the fallback's shell, accessibility contract, reporting and re-arming), in the plan-level `npm test` run
- **Issue:** The action-contract case asserted the ring's offset colour with `expect(recovery.className).toMatch(/focus-visible:ring-offset-(bg|surface)/)`. `designTokens.test.js`'s `UTILITY` regex matches `ring-offset-(bg` inside that literal (its character class admits `-` and `(`), so the token `ring-offset-(bg` was reported as a class with no generated rule: `AssertionError: expected [ Array(1) ] to deeply equal []` → `ring-offset-(bg  <-  components/ui/ErrorBoundary.test.jsx`. One test failed, 197 passed.
- **Fix:** Replaced the pattern with a probe over the two **complete** class tokens (`'focus-visible:ring-offset-bg'`, `'focus-visible:ring-offset-surface'`) via `Array.prototype.find`, preserving the assertion's intent (the ring is complete only with an offset colour) without introducing a token the gate cannot resolve. `expect(offsetColour).toBeDefined()`.
- **Files modified:** `web-dashboard/src/components/ui/ErrorBoundary.test.jsx`
- **Verification:** `npm test` → 17 files, 198 tests, 0 failures. `npm run build` → success, zero errors.
- **Committed in:** `2aef40ec` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug, caused by this plan's own test file)
**Impact on plan:** No scope creep. The fix is confined to the assertion's instrumentation; the contract it asserts (44px target travelling with a complete focus ring) is unchanged and still enforced.

## Issues Encountered

- The plan's `<automated>` commands are written as `cd /home/qihh/Documents/Tugas Akhir/smart-insole-ta/web-dashboard && …` without quoting. The checkout path contains a space (`Tugas Akhir`), so the command as written fails with `cd: too many arguments`. Every command was run with the path quoted instead; the semantics are identical. Recorded here because a future executor meets the same plan text.
- No other problems. The tracer gate re-ran clean on the first attempt, and no assertion revealed a gap in `ErrorBoundary.jsx`, so the component was not changed by Task 3.

## Known Stubs

None. No placeholder values, no `TODO`/`FIXME`, no component wired to empty or mock data. The three dictionary strings are real shipped copy.

## Threat Flags

None. No new endpoint, auth path, file access or schema boundary. The plan's `T-02-SC` supply-chain row holds: nothing was installed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- FIX-10 is complete and gated by 12 new assertions (9 component, 3 app-level).
- **Outstanding:** the plan's manual verification step — temporarily make a page throw, confirm the console shows the fallback with its cause and action, activate the action, confirm the view recovers, then restore the page — and the AGENTS.md click-through at 360px / 768px / 1280px. No browser is available in this execution environment; both are recorded in `.planning/WINDOWS.md` for the end-of-phase human verification.
- `02-02` declares this plan as a dependency: `<App />` now renders the boundary above the shell, and the skip link at `App.jsx:77` is unchanged, so a11y assertions against the shell are unaffected.

## Verification Evidence

| Check | Result |
|---|---|
| `npx vitest run src/components/ui/ErrorBoundary.test.jsx src/App.errorBoundary.test.jsx src/utils/i18n.test.js` | 3 files, 24 tests, pass |
| `npx vitest run src/App.test.jsx` | 10 tests, pass (mocks untouched) |
| `npm test` | 17 files, 198 tests, 0 failures |
| `npm run build` | built in 12.03s, zero errors |
| `grep -c 'getDerivedStateFromError' ErrorBoundary.jsx` | 2 |
| `grep -c 'componentDidCatch' ErrorBoundary.jsx` | 2 |
| `grep -c 'error.boundary' utils/i18n.js` | 6 (three keys, two dictionaries) |
| `grep -c 'ErrorBoundary' App.jsx` | 3 (import + mount open + mount close) |
| `grep -c 'Route path=' App.jsx` | 15, unchanged by this plan |
| `grep -c '<AppShell />' App.jsx` | 1, with `ErrorBoundary` as its only wrapper |

---
*Phase: 02-defect-fixes*
*Completed: 2026-10-17*

## Self-Check: PASSED

- Created files exist: `ErrorBoundary.jsx`, `ErrorBoundary.test.jsx`, `App.errorBoundary.test.jsx` — all `FOUND`.
- Commits are ancestors of HEAD: `a94178b9`, `d055461b`, `2aef40ec` — all `FOUND`.
- Plan-level verification re-run green: 24 tests across the three plan-owned test files; `npm test` 198/198; `npm run build` zero errors.
- Note: the workflow SDK (`gsd_run` / `gsd-tools`) is not installed in this environment, so `state.advance-plan`, `state.record-metric`, `roadmap.update-plan-progress` and `requirements.mark-complete` could not be invoked. The equivalent planning-file updates were made directly.
