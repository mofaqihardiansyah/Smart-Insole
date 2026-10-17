---
phase: 02-defect-fixes
plan: 04
subsystem: ui
tags: [i18n, copy-guard, vitest, react, dashboard, admin, kualitas-teks]

# Dependency graph
requires:
  - phase: 02-defect-fixes
    provides: "02-02's `a11y.test.jsx`, 02-03's `DashboardPage.states.test.jsx` and rewritten `DashboardPage.jsx`, and 02-06's `ErrorBoundary.jsx`/`App.jsx` — task 1 walks every `.jsx` under `src/` and task 2 walks every `.jsx`/`.js`, so both observe the wave-1 and wave-2 output; tasks 2 and 3 also render `DashboardPage.jsx`"
provides:
  - "web-dashboard/src/copy.test.js — the shipped-copy dash guard (`.jsx` walk, comment-stripped match, non-vacuous count, scratch page excluded by directory) plus the positive assertion that the admin users-table fallbacks read from `common.notAvailable`"
  - "the two `AdminPage.jsx` users-table fallbacks localised through the dictionary, so the existing `i18n.test.js` dash gate now covers text it previously could not see"
  - "the FIX-05 standing-action lock (exactly two header buttons, stable across a state change) and the FIX-07 data-source lock (banner present on the simulator, absent on the live-but-silent path, wording from the dictionary) in `DashboardPage.test.jsx`"
affects: [02-defect-fixes, phase-03-composites, GATE-03, dashboard, admin]

# Actuals (#2632) — pairs with the plan's `estimate` to calibrate future estimates.
# Same estimateTokens scale (chars/4 over the realized diff), never a harness token count.
actuals:
  tokens: 3267    # chars/4 over the 13071 diff bytes of the 3 task commits
  tasks: 3
  commits: 3
plan_head_before: 26017868ddb433ec3a9fb0c61c7a1812a16b39ff
plan_head_after: 54e48b94869d8d78f7d7e43a6dab47c12c5766b2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Two-stage comment stripping (block comments first, then line comments with a preceding-character guard) before matching shipped copy — the only way to tell a dash in JSDoc prose from a dash in shipped JSX"
    - "Non-vacuous directory walk: assert the collected count before asserting the per-file verdict, so a broken walk fails loudly instead of passing on an empty set"
    - "Self-referential source guard: banned labels are assembled from parts (`['Export','PDF'].join(' ')`) and the doc comment avoids the literals, so the scan does not match its own file"
    - "Dictionary-resolved expectations (`t(key, language)`) so an assertion fails when the dictionary entry is removed, not only when the rendered text changes"

key-files:
  created:
    - web-dashboard/src/copy.test.js
  modified:
    - web-dashboard/src/pages/AdminPage.jsx
    - web-dashboard/src/pages/DashboardPage.test.jsx

key-decisions:
  - "The two new describes were nested inside the existing top-level `describe(\"DashboardPage controls\")` so they inherit its `beforeEach` (localStorage clear + `ctxRef` reset) rather than duplicating the harness"
  - "`renderDashboard` was parameterised (`{ autoConnect = true } = {}`) instead of adding a second render helper — existing callers are unchanged, and the simulator case needs the same harness with one flag flipped"
  - "The dead-control source scan assembles its banned labels from parts and its doc comment avoids the literals; without that the scan matches its own file and can never pass"
  - "The FIX-07 dictionary case adds `hasKey(\"source.simTitle\"/\"source.simBody\")` on top of the rendered-text comparison, so removing the dictionary entry fails the test — the plan's stated intent"
  - "The guard excludes `src/__oil_ui_eval__/` by directory name rather than by filename, so a future file added to that scratch page is excluded too"
  - "`AdminPage.jsx`'s JSDoc dash at line 25 is deliberately retained: it is a source comment, not shipped copy, and `stripComments` is exactly what separates the two"

patterns-established:
  - "`copy.test.js` is the shipped-copy half of the dash rule: `i18n.test.js` gates dictionary values, this gates the JSX that bypasses the dictionary, and VALIDATION.md's Wave 0 gap \"Copy guard for em dashes (FIX-09)\" is now closed"

requirements-completed: [FIX-05, FIX-07, FIX-09]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "The two admin users-table fallbacks resolve through `common.notAvailable`, so the table's empty-cell text is localised and the declaration can no longer be deleted and replaced with a literal"
    requirement: FIX-09
    verification:
      - kind: unit
        ref: "web-dashboard/src/copy.test.js#resolves the admin users-table fallbacks through the dictionary"
        status: pass
    human_judgment: false
  - id: D2
    description: "No shipped `.jsx` source carries an em or en dash after comment stripping, over a walk whose collected count is asserted non-vacuous and which excludes the `__oil_ui_eval__` scratch page"
    requirement: FIX-09
    verification:
      - kind: unit
        ref: "web-dashboard/src/copy.test.js#walks the shipped .jsx sources rather than an empty list"
        status: pass
      - kind: unit
        ref: "web-dashboard/src/copy.test.js#ships no dash separator in any comment-stripped .jsx source"
        status: pass
    human_judgment: false
  - id: D3
    description: "The dashboard header exposes exactly two standing actions, and still exactly two after a reading-state change — the count is a property of the markup, not of the render"
    requirement: FIX-05
    verification:
      - kind: unit
        ref: "web-dashboard/src/pages/DashboardPage.test.jsx#exposes exactly two standing actions in the header"
        status: pass
      - kind: unit
        ref: "web-dashboard/src/pages/DashboardPage.test.jsx#still exposes exactly two after the reading state changes"
        status: pass
    human_judgment: false
  - id: D4
    description: "Neither dead-control label appears in any `.jsx`/`.js` module under `src/` (`dist/` is never read)"
    requirement: FIX-05
    verification:
      - kind: unit
        ref: "web-dashboard/src/pages/DashboardPage.test.jsx#ships neither dead control label in any module under src"
        status: pass
    human_judgment: false
  - id: D5
    description: "The Simulation banner is present when the source is the simulator (with the dictionary's title and body), and absent when a Firebase connection has not answered — an unanswered device is never labelled as live"
    requirement: FIX-07
    verification:
      - kind: unit
        ref: "web-dashboard/src/pages/DashboardPage.test.jsx#labels the simulator source with the Simulation banner"
        status: pass
      - kind: unit
        ref: "web-dashboard/src/pages/DashboardPage.test.jsx#does not label an unanswered device as a simulator"
        status: pass
      - kind: unit
        ref: "web-dashboard/src/pages/DashboardPage.test.jsx#ships the Simulation wording straight from the dictionary"
        status: pass
    human_judgment: false
  - id: D6
    description: "Visual click-through of the dashboard at 360px, 768px and 1280px: with the simulator running the Simulation banner reads correctly, and the admin users table shows a localised \"not available\" fallback rather than a dash"
    verification: []
    human_judgment: true
    rationale: "jsdom has no layout engine and cannot run the ESP32 simulator or a live Firebase connection, so the composed runtime surface — banner geometry, and the simulator's own provider state at three viewports — is the plan's own manual `<verification>` item. GATE-03 re-runs it."

# Metrics
duration: 7min
completed: 2026-10-17
status: complete
---

# Phase 02 Plan 04: Shipped-copy guard and dashboard action/source locks Summary

**FIX-09 closed on both halves — the two admin fallbacks now read from the dictionary, and `src/copy.test.js` walks every shipped `.jsx` with comments stripped so a dash separator fails `npm test` — while FIX-05 and FIX-07 are pinned in `DashboardPage.test.jsx` as exactly-two-actions, no-dead-controls, and always-labelled data source**

## Performance

- **Duration:** 7 min (measured from the plan-head ledger at `2026-10-17T13:15:56Z` to the final task commit at `13:22:31Z`)
- **Started:** 2026-10-17T13:15:56Z
- **Completed:** 2026-10-17T13:22:31Z
- **Tasks:** 3
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments

- **FIX-09's two halves.** FIX-09 already had a gate, but only over the dictionary file — which is exactly why these two fallbacks escaped it: they bypassed `t(key, language)` entirely and put a raw separator character straight into JSX, out of reach of the existing `i18n.test.js` dash gate. Both now resolve through `common.notAvailable`, the same idiom `HistoryPage.jsx` already uses, and `copy.test.js` extends the rule to the shipped JSX the dictionary gate cannot see.
- **The guard is comment-aware, which is the whole difficulty.** `stripComments` runs in two stages (block comments first, then line comments with a preceding-character guard that keeps `//` inside a string literal from being mistaken for a comment). Without it the ~29 `.jsx` files carrying dashes inside JSDoc prose would all read as offenders and the guard would be noise — and a noisy guard gets disabled, which is the failure mode the plan's threat model calls out (`T-02-11`).
- **The guard is non-vacuous and self-exempting.** The walk collects 54 `.jsx` files and asserts `> 40` before asserting any per-file verdict, so a broken walk fails loudly rather than passing on an empty set. The scan excludes `src/__oil_ui_eval__/` by directory (a git-tracked scratch page imported by no production source) rather than by filename, so a future addition there is excluded too.
- **FIX-05 is now a property, not an eyeball.** The rendered page header is asserted to hold exactly two `role="button"` descendants, named by accessible name, with the two reference dead-control labels asserted absent from the whole document *and* from every `.jsx`/`.js` module under `src/`. The second case re-asserts the count after a reading-state change, which is the idempotency proof: a transition that adds a control fails it.
- **FIX-07's two states can no longer be conflated.** The Simulation banner is asserted present on the simulator path (with the dictionary's own title and body) and asserted absent while a Firebase connection is unanswered — the fabrication `T-02-10` exists to prevent. The added `hasKey` assertions mean the test fails if the dictionary entry is removed, not only if the rendered string changes.
- **VAL-01's Wave 0 gap is closed.** `02-VALIDATION.md:66` lists "Copy guard for em dashes (FIX-09)" as an open Wave 0 gap; `copy.test.js` is that guard.

## Task Commits

Each task was committed atomically:

1. **Task 1: End-to-end copy guard — a dash separator in shipped JSX fails the suite, and the two admin fallbacks resolve through the dictionary** (`type="tracer"`) — `6115bdb9` (fix)
2. **Task 2: Lock FIX-05 — only Export CSV and Mark as read stand as dashboard actions** — `b3ab6b91` (test)
3. **Task 3: Lock FIX-07 — the data source is always explicitly labelled, measured or Simulation** — `54e48b94` (test)

**Plan metadata:** committed separately as the `docs(02-04): complete …` commit that carries this file, STATE.md, ROADMAP.md and REQUIREMENTS.md.

## Files Created/Modified

- `web-dashboard/src/copy.test.js` — **created.** Three tests in one describe: the non-vacuous walk count, the comment-stripped dash match over every shipped `.jsx` (failure message names the file via `path.relative(SRC, file)`), and the positive admin-fallback assertion. Imports the `node:fs`/`node:path`/`fileURLToPath` shape and `SRC` convention from `designTokens.test.js:1-27`, and reuses its recursive walk at `:39-50` filtered to `.jsx`.
- `web-dashboard/src/pages/AdminPage.jsx` — `const unavailable = t("common.notAvailable", language);` hoisted beside the other derived consts, and the two users-table fallbacks at `:201` and `:204` now read `|| unavailable`. The JSDoc dash at `:25` is untouched by design; the `StatusChip` in the same table is untouched.
- `web-dashboard/src/pages/DashboardPage.test.jsx` — two new describes (`(FIX-05)` and `(FIX-07)`, 6 tests) plus `renderDashboard` parameterised with `{ autoConnect = true } = {}`, a `hasKey` import, and a `collectSources` walk with `node:fs`/`node:path`/`fileURLToPath`/`t`. No existing case changed.

## Decisions Made

- **The new describes nest inside the existing top-level `describe("DashboardPage controls")`.** They inherit its `beforeEach` (localStorage clear + `ctxRef` reset) and `afterEach`, so the harness is reused rather than restated — and the FIX-07 simulator case depends on that localStorage clear for its determinism, exactly as the plan's dependency rationale claims.
- **`renderDashboard` was parameterised, not duplicated.** `{ autoConnect = true } = {}` keeps all six existing call sites byte-identical while giving the FIX-07 case the one flag it needs. A sibling helper would have been a second source of truth for the same harness.
- **The dead-control scan assembles its labels from parts, and its doc comment avoids the literals.** A source scan that names its own banned strings self-matches and can never pass. `['Export','PDF'].join(' ')` inside the assertion plus prose-only comment phrasing keeps the scan honest — proven by `grep -rn 'Export PDF\|New Session' src` returning no match while the assertion runs.
- **`hasKey` supplements the rendered-text comparison.** Comparing `toHaveTextContent(t("source.simTitle","id"))` to itself would still pass if the dictionary entry vanished (both sides would be the same fallback), so the plan's intent — "the assertion fails if the dictionary entry is removed" — needed the explicit key presence check.
- **`copy.test.js` asserts the admin fix positively as well as negatively.** The dash match alone would pass if the `unavailable` const were deleted *and* the fallbacks replaced with clean but non-localised literals; asserting the const's declaration and its two uses closes that gap.
- **Tracer gate resolved to interactive mode, row 3.** `human_verify_mode` is unset (defaults to `end-of-phase`) and auto mode is off, so the tracer's feedback gate called for a re-run of the automated `<verify>` rather than a human checkpoint: `npx vitest run src/copy.test.js` was re-run green after `6115bdb9`, logged "⚡ Tracer verified end-to-end — expanding", and the expansion proceeded.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The FIX-05 source scan matched its own file**
- **Found during:** Task 2
- **Issue:** The scan's doc comment and its banned-label fixture named the dead-control labels literally, so the file that defines the rule also violated it — `grep -rn 'Export PDF\|New Session' src` would have matched the test file itself, making the plan's acceptance criterion (`returns no match`) unsatisfiable without weakening the assertion.
- **Fix:** The doc comment now describes the labels in prose without naming them, and the assertion builds each banned string from parts (`["Export","PDF"].join(" ")`). The scan's behaviour is unchanged; only its own text is.
- **Files modified:** `web-dashboard/src/pages/DashboardPage.test.jsx`
- **Verification:** `grep -rn 'Export PDF\|New Session' web-dashboard/src` returns no match; the scan still fails on a probe file containing the literal label (proven with a throwaway module, then deleted).
- **Committed in:** `b3ab6b91` (part of the task commit)

**2. [Rule 2 - Missing critical functionality] The FIX-07 dictionary assertion could not fail on dictionary removal**
- **Found during:** Task 3
- **Issue:** Comparing `toHaveTextContent(t(key,"id"))` against text the component also renders from the same `t(key,"id")` compares a value to itself — the assertion passes even if the dictionary entry is deleted, which is the opposite of the plan's stated purpose ("the assertion then fails if the dictionary entry is removed, which is the point").
- **Fix:** Added `hasKey("source.simTitle")` and `hasKey("source.simBody")` assertions alongside the rendered-text comparison, so a removed entry fails explicitly.
- **Files modified:** `web-dashboard/src/pages/DashboardPage.test.jsx`
- **Verification:** Suite green (12 tests in the file); `grep -c "source.simTitle\|source.simBody"` returns ≥ 2 as the plan requires.
- **Committed in:** `54e48b94` (part of the task commit)

**3. [Rule 3 - Blocking] Verification build regenerated tracked `dist/` output**
- **Found during:** plan-level verification
- **Issue:** `web-dashboard/dist/` is tracked, so the AGENTS.md-mandated `npm run build` rewrote hashed asset filenames (`index-Bpmgy9Y9.css` / `index-CBuoZPws.js` where HEAD carries `index-D9kyTNPW.css` / `index-DjDnPPar.js`), dirtying the tree with output no task in this plan owns.
- **Fix:** Left `dist/` out of every commit and restored it to `HEAD` after verification, so this plan's diff contains exactly its three declared files. Consistent with the repo's convention of batching dist output into separate tracking commits.
- **Files modified:** none (restored)
- **Verification:** `git status --short -- web-dashboard/dist` returns no entries.
- **Committed in:** n/a

---

**Total deviations:** 3 auto-fixed (2 blocking, 1 missing critical functionality)
**Impact on plan:** Deviations 1 and 2 were preconditions for the plan's own acceptance criteria to mean anything — without them the FIX-05 grep could not pass and the FIX-07 assertion could not fail. Deviation 3 keeps the diff scoped. No scope creep, no requirement softened.

## Issues Encountered

- **`gsd_run` is not available in this environment.** Every SDK verb the workflow names (`state.advance-plan`, `state.record-metric`, `state.add-decision`, `state.record-session`, `roadmap.update-plan-progress`, `requirements.mark-complete`, `query commit`) had to be replaced with direct edits to `STATE.md`, `ROADMAP.md` and `REQUIREMENTS.md` plus an ordinary `git commit`. The content the verbs would have written is present; the mechanism differs. Recorded here so `/gsd-verify-work` does not read the hand-edited rows as authored by the SDK.
- **The plan's `<automated>` commands contain an unquoted absolute path with a space.** `cd /home/qihh/Documents/Tugas Akhir/smart-insole-ta/web-dashboard && …` fails with `cd: too many arguments` in a real shell. Not a deviation — the plan's text, not its intent — but the commands were executed with the shell's workdir parameter / a quoted path instead. Flagged for the plan template.
- **The guard's non-vacuity was proven, not assumed.** A throwaway `src/__copy_probe.jsx` containing a single em dash failed the task-1 case and named itself in the failure message; the file was deleted immediately and the suite re-run green.
- **The pre-existing dashes in ~29 `.jsx` files are all inside comments.** Confirmed by the walk: after `stripComments` the only offenders were the two admin fallbacks, which is why no file needs a copy change beyond `AdminPage.jsx`. A raw (unstripped) grep would have demanded edits to dozens of JSDoc headers, contradicting the task's own criterion.

## Known Stubs

None. Every assertion reads the real shipped component or the real shipped source; no fixture data reaches a UI surface and no placeholder text was introduced.

## Threat Flags

None. This plan adds test coverage and localises two fallback strings. It introduces no new network endpoint, auth path, file access pattern, or schema change at a trust boundary. The one trust boundary it strengthens — device → clinician, via the always-present source label — was already declared as `T-02-10` in the plan's threat model.

## Threat Model Verification

| Threat ID | Disposition | Where the mitigation landed |
|-----------|-------------|-----------------------------|
| T-02-10 (Spoofing, `sourceBanner`) | mitigate | FIX-07 cases 1 and 2: banner present on the simulator, absent on the live-but-silent path, so the two states cannot be conflated |
| T-02-11 (Tampering, shipped JSX copy) | mitigate | `copy.test.js`: comment-stripped `.jsx` walk with a non-vacuous count and a directory-scoped exclusion |
| T-02-12 (Repudiation, header actions) | mitigate | FIX-05 cases 1–3: rendered exactly-two count, post-state-change count, and the source scan for both dead-control labels |
| T-02-SC (Tampering, installs) | mitigate | No package was installed; no `package.json` change in this plan's diff |

## Auth Gates

None. No authentication or external-service step was required.

## Next Phase Readiness

- **The phase's final plan.** With `02-04` landed the phase's six plans are all executed and its union file list (`02-04-PLAN.md`'s "Phase artifacts") is complete on disk, so GATE-03 can read the final tree rather than a partial one.
- **One item is for a human, and it is the plan's own:** the manual click-through of the dashboard at 360px, 768px and 1280px with the simulator running, and of the admin users table's localised fallback (coverage `D6`). jsdom has neither layout nor a live device, so `GATE-03` re-runs it.
- No blockers. `npm test` (19 files / 214 tests) and `npm run build` both pass with zero errors; `npx vitest run src/utils/i18n.test.js` remains green, confirming no dictionary change was needed.

---
*Phase: 02-defect-fixes*
*Completed: 2026-10-17*

## Self-Check: PASSED

- FOUND: web-dashboard/src/copy.test.js
- FOUND: .planning/phases/02-defect-fixes/02-04-SUMMARY.md
- FOUND: 6115bdb9 (Task 1), b3ab6b91 (Task 2), 54e48b94 (Task 3)
