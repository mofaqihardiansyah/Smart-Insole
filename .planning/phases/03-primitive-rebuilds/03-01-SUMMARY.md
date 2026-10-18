---
phase: 03-primitive-rebuilds
plan: 01
subsystem: ui
tags: [react, tailwind, vitest, jsdom, design-tokens, class-string-gate, dev-warning]

# Dependency graph
requires:
  - phase: 01-design-system-audit-token-lock
    provides: the locked token names the warm pair uses (`warm-accent-deep`, `warm-line`, `warm-card`, `warm-ink`, `warm-raised`) and the audit that named the CTA collapse
  - phase: 02-defect-fixes
    provides: the read-the-vocabulary-from-source test idiom (`BentoGrid.test.jsx:20-31`), the source-slice assertion (`:183-202`), and the `MemoryRouter` + `InsoleProvider` page-render pattern with the `useAuth` / `firebaseRealtime` mock pair
provides:
  - "`warm` and `warmOutline` declared in `GlassButton`'s `VARIANTS`, so the eight landing CTAs render the landing register again (D-01)"
  - "`BUTTON_VARIANTS` exported as the declared key set the gate reads"
  - "`web-dashboard/src/utils/devWarn.js` — one development-only warning channel, read at call time"
  - "`web-dashboard/src/variantKeys.test.js` — the gate that fails on any undeclared literal `variant=` / `level=` call-site key"
  - "the rendered lock on the landing register (`landingCta.test.jsx`) and the primitive-level lock on the warm pair, the declared fallback and the removed press translate (`GlassButton.test.jsx`, `devWarn.test.js`)"
affects: [03-02, 03-03, 03-06, 03-07, 04-shell-rebuild]

# Actuals (#2632) — same estimateTokens scale as the plan's `estimate` (chars/4 over the realized diff).
actuals:
  tokens: 8164
  tasks: 3
  commits: 3

plan_head_before: 2fd022f7467f4c81654b2971c97c8bb06a4ddf03
plan_head_after: 22b26229cf2ff643a73aea7bc6703fee5d6b927f

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Gate a call site against the primitive's own declaration: read the vocabulary out of the primitive's source with an anchored regex, throw when it cannot be read, then fail any literal call-site key outside the union it belongs to"
    - "Assert absence of a Tailwind utility by its prefix inside the class list, never by matching a whole class string"
    - "One shared development-only warning channel whose flag is read at call time, so `vi.stubEnv` takes effect per test"
    - "Non-vacuity floors asserted BEFORE the verdict — a floor of walked files and of collected literals, so a broken walk fails loudly instead of passing silently"

key-files:
  created:
    - web-dashboard/src/utils/devWarn.js
    - web-dashboard/src/utils/devWarn.test.js
    - web-dashboard/src/variantKeys.test.js
    - web-dashboard/src/pages/landingCta.test.jsx
    - web-dashboard/src/components/ui/GlassButton.test.jsx
  modified:
    - web-dashboard/src/components/ui/GlassButton.jsx

key-decisions:
  - "The fix and its gate ship in one commit (D-01): the defect shape here is a silent fallback that ships a wrong-but-plausible surface, so the correction cannot land without the mechanism that makes the next one impossible."
  - "`hover:opacity-90` is retained on `warm` as instant state feedback, not a transition, so it sits outside MOTION 1's transition list — and no declared warm hover-fill token exists, so replacing it would have meant inventing a value."
  - "`danger`'s `hover:bg-danger-hover` was deleted rather than re-valued: `--danger-hover` (`index.css:58`) is byte-identical to `--danger` (`:57`), so the utility was a no-op and giving `danger` a distinct hover is a token decision, not a primitive-rebuild side effect. Recorded against ROADMAP backlog 999.3, which already names this exact deletion (`ROADMAP.md:178-181`)."
  - "The gate's `tone=` half deliberately does not ship here: its vocabulary is the banner tone set, which the new primitive owns in 03-03 and gates in 03-06. Noted in the test file header so the omission is not read as an oversight."
  - "Task 3 is `tdd=\"true\"` but produced no RED commit: Task 1 ships the behaviour by plan design, so all nine assertions were green on first run. Recorded honestly rather than fabricating a RED/GREEN pair — `workflow.tdd_mode` is not enabled and the plan is `type: execute`, so no gate contract was violated."
  - "`web-dashboard/dist/` was restored to HEAD after the AGENTS.md-mandated build: it is tracked, no plan owns it, and the project regenerates it once per phase as a dedicated `build(0X):` commit (precedent `6996889`). Recurrence of the already-open WINDOWS #4."

patterns-established:
  - "Anti-silent-fallback gate: a primitive's declared vocabulary is the source of truth for its call sites, and the gate reads it from the source rather than restating it"
  - "Vocabulary export: a primitive exports its key set (`BUTTON_VARIANTS`) so both the gate and its own tests read one declaration instead of re-typing strings"
  - "Development-only diagnostics: one shared helper, never a bare `console.warn` at a call site"

requirements-completed: [COMP-01]

coverage:
  - id: D1
    description: "The eight landing CTAs render the warm register again — the hero's primary and secondary actions are two different buttons, and none of the eight paints the app-register fill"
    requirement: COMP-01
    verification:
      - kind: unit
        ref: "web-dashboard/src/pages/landingCta.test.jsx#paints all eight CTAs in the warm register, none in the app register"
        status: pass
      - kind: unit
        ref: "web-dashboard/src/pages/landingCta.test.jsx#gives the hero two different actions rather than one button twice"
        status: pass
    human_judgment: false
  - id: D2
    description: "An undeclared literal `variant=` or `level=` key at any call site fails an automated gate, so the silent `VARIANTS[variant] || VARIANTS.filled` collapse cannot ship again"
    requirement: COMP-01
    verification:
      - kind: unit
        ref: "web-dashboard/src/variantKeys.test.js#declares every literal variant= key a call site passes"
        status: pass
      - kind: unit
        ref: "web-dashboard/src/variantKeys.test.js#declares every literal level= key a call site passes"
        status: pass
      - kind: unit
        ref: "web-dashboard/src/variantKeys.test.js#walks the shipped .jsx sources and collects a non-vacuous literal set"
        status: pass
    human_judgment: false
  - id: D3
    description: "An unknown key warns once in development through one shared helper, warns never outside development, and still renders the declared fallback in both cases"
    requirement: COMP-01
    verification:
      - kind: unit
        ref: "web-dashboard/src/utils/devWarn.test.js#names the component and carries the message, once, in development"
        status: pass
      - kind: unit
        ref: "web-dashboard/src/utils/devWarn.test.js#stays silent outside development"
        status: pass
      - kind: unit
        ref: "web-dashboard/src/utils/devWarn.test.js#reads the flag when it is called, not when the module loaded"
        status: pass
      - kind: unit
        ref: "web-dashboard/src/components/ui/GlassButton.test.jsx#renders the declared fallback and warns once in development"
        status: pass
      - kind: unit
        ref: "web-dashboard/src/components/ui/GlassButton.test.jsx#renders the same fallback and stays silent outside development"
        status: pass
    human_judgment: false
  - id: D4
    description: "`GlassButton` carries no press translate for any size or variant; press feedback is colour and border only (MOTION 1, C-01), while the 44px floor and the desktop release hold"
    requirement: COMP-01
    verification:
      - kind: unit
        ref: "web-dashboard/src/components/ui/GlassButton.test.jsx#holds the floor, the release and the focus pair on every size and variant"
        status: pass
    human_judgment: false
  - id: D5
    description: "A long localised `GlassButton` label wraps within the button at 360px and the page gains no horizontal overflow"
    requirement: COMP-01
    verification:
      - kind: unit
        ref: "web-dashboard/src/pages/landingCta.test.jsx#lets a long label grow its CTA instead of clipping it"
        status: pass
    human_judgment: true
    rationale: "jsdom has no layout engine, so wrapping and horizontal overflow at 360px cannot be observed here. The structural half — no fixed-height utility on any CTA class list — is locked by unit test; the visual half needs a human click-through, and is recorded as an unrun verify in `.planning/WINDOWS.md`."

# Metrics
duration: 26min
completed: 2026-10-18
status: complete
---

# Phase 3 Plan 01: Primitive rebuilds Summary

**The eight landing CTAs render the warm register again, and a source gate now fails on any call-site key no primitive declares — with one shared development-only warning channel behind it**

## Performance

- **Duration:** 26 min
- **Started:** 2026-10-18T02:59:13Z (Phase 3 execution start)
- **Completed:** 2026-10-18T03:25:00Z
- **Tasks:** 3
- **Files modified:** 6 (5 created, 1 modified)

## Accomplishments

- **The landing register is restored.** `warm` and `warmOutline` are declared in `GlassButton`'s `VARIANTS` from the class strings recovered out of git history, so the eight landing CTAs resolve through `VARIANTS[variant]` instead of falling back to `VARIANTS.filled`. The hero's primary and secondary actions are two visually different buttons again (`01-UI-SPEC.md:89`).
- **The collapse now fails a test.** `web-dashboard/src/variantKeys.test.js` reads each primitive's declared vocabulary out of its *own source* — `BUTTON_VARIANTS` from `GlassButton.jsx`, the handled variant set from `StatePanel.jsx`, `STATUS_LEVELS` from `StatusChip.jsx` — collects every literal `variant=` and `level=` in the walked `.jsx` set, and fails on any value outside the union it belongs to. Observed failing once by hand with `warm` removed from `VARIANTS` (`pages/LandingPage.jsx passes variant="warm"` ×4), then restored.
- **Non-vacuity is enforced before the verdict.** The gate asserts floors first — more than 40 walked `.jsx` files, at least 8 `variant=` literals, at least 2 `level=` literals — so a broken walk or a broken regex fails loudly rather than passing silently. Measured in the walked set: 54 `.jsx` files (excluding the `__oil_ui_eval__` directory), 52 `variant=` literals, 3 `level=` literals.
- **A bad key degrades instead of blanking a view.** `web-dashboard/src/utils/devWarn.js` is the one development-only warning channel; `GlassButton` calls it from its unknown-key branch and then falls through to the declared `filled` fallback, so production behaviour is unchanged and benign.
- **One motion violation removed.** `active:translate-y-[1px]` is gone while `transition-colors duration-150` is retained: press feedback belongs to colour and border, and a translate is not in MOTION 1's permitted list.
- **Seven new assertions were added across four files, and the full suite is green.** 4-file run: 15/15 pass in 4 files. Full suite: 23 files / 229 tests pass. `npm --prefix web-dashboard run build` succeeded (2002 modules, 13.68s, only the pre-existing >500 kB chunk advisory).

## Task Commits

Each task was committed atomically:

1. **Task 1 (tracer): End-to-end "a call-site key must be declared" — one literal variant through one primitive to one gate** - `f9e902d9` (feat)
2. **Task 2: Lock the rendered landing register — two distinct CTAs, not one button eight times** - `edc30737` (test)
3. **Task 3: The primitive contract — declared fallback in production, a warning in development** - `22b26229` (test)

**Plan metadata:** `docs(03-01): complete ...` (plan summary + STATE/ROADMAP/REQUIREMENTS)

_Note: Task 1 carries the implementation and its gate in one commit by design (D-01). Task 3 carries no RED commit — see Deviations._

## Files Created/Modified

- `web-dashboard/src/utils/devWarn.js` - the one development-only warning channel: single export `devWarn(component, message)`, reads `import.meta.env?.DEV` at call time, tolerates a replaced `console.warn`, never throws
- `web-dashboard/src/utils/devWarn.test.js` - the helper's contract: warns once with both values in development, silent outside it, read-at-call-time proven, and does not throw when `console.warn` is gone
- `web-dashboard/src/components/ui/GlassButton.jsx` - `warm` + `warmOutline` restored to `VARIANTS`; `active:translate-y-[1px]` removed; the no-op `danger` hover deleted; `export { GlassButton, VARIANTS as BUTTON_VARIANTS }` added; the unknown-key `devWarn` branch added
- `web-dashboard/src/variantKeys.test.js` - the cross-cutting source gate over literal `variant=` / `level=` call-site keys, with the walked-file and literal floors
- `web-dashboard/src/pages/landingCta.test.jsx` - the rendered lock on the landing register: 8-CTA count floor, the warm fill and warm outline pair, the two hero actions proven different, and no fixed height
- `web-dashboard/src/components/ui/GlassButton.test.jsx` - the primitive-level lock: floors and focus pair per size and variant, each variant rendering exactly its own declaration, the warm pair on warm tokens, the unknown-key pair across both `DEV` states

## Decisions Made

- **Fix and gate in one commit (D-01).** The defect shape is a silent fallback that ships a wrong-but-plausible surface. Landing the correction without the mechanism that makes the next one impossible would leave the same class of bug one call site away.
- **`hover:opacity-90` retained on `warm`.** It is instant state feedback, not a transition, so it is outside MOTION 1's transition list. No declared warm hover-fill token exists, so replacing it would have meant inventing a value — which the prohibitions forbid.
- **`danger`'s `hover:bg-danger-hover` deleted, not re-valued.** `--danger-hover` (`index.css:58`) is byte-identical to `--danger` (`:57`, per `token-inventory.md:60`), so the utility was a no-op. A distinct `danger` hover is a token decision and is recorded against ROADMAP backlog 999.3 (UI-SPEC §4 option b), which already documents this deletion at `ROADMAP.md:178-181`; no hex was invented.
- **The `tone=` half of the gate does not ship here.** Its vocabulary is the banner tone set, which the new primitive owns in 03-03 and gates in 03-06. The test file header says so, so a reader does not mistake the omission for an oversight.
- **The warm keys are whole literal class strings.** No interpolation, so Tailwind can see every class it must emit.
- **`dist/` restored to HEAD.** It is tracked in git, no plan owns it, and the project regenerates it once per phase as a dedicated `build(0X):` commit (precedent `6996889`). Recurrence of the already-open WINDOWS #4.
- **ROADMAP 999.1 required no edit.** Its supersede note is already recorded at `ROADMAP.md:152-153` naming Phase 3 COMP-01 and D-01.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `console.warn` cannot be deleted in Vitest's jsdom console**
- **Found during:** Task 3 (the primitive contract)
- **Issue:** The plan asks for a case that "removes `console.warn` and proves `devWarn` does not throw". `delete console.warn` does not remove the property in Vitest 2.1.9's jsdom environment — the assertion that it was gone failed, which would have left the case passing vacuously.
- **Fix:** The case sets `console.warn = undefined` and asserts `expect(console.warn).toBeUndefined()` before calling `devWarn`, so the guard cannot pass an empty check. The helper's tolerance of a missing `console.warn` is unchanged and still proven.
- **Files modified:** `web-dashboard/src/utils/devWarn.test.js`
- **Verification:** 4/4 cases in the file pass; the explicit `toBeUndefined()` guard is in the case.
- **Committed in:** `22b26229` (Task 3 commit)

**2. [Rule 3 - Blocking] `web-dashboard/dist/` dirtied by the mandated build**
- **Found during:** plan-level verification
- **Issue:** AGENTS.md requires `npm run build` before handover, but `dist/` is tracked and no plan owns it, so the build left modified tracked files plus two new untracked assets.
- **Fix:** Restored `dist/` to HEAD and removed the two new untracked assets, matching the precedent set for 02-02. This is a recurrence of the already-open WINDOWS #4 (`dist/` tracking policy undecided), so no new ledger entry was added.
- **Files modified:** none committed (restored, not changed)
- **Verification:** `git status --short` shows no modification to any tracked `web-dashboard/` file.
- **Committed in:** n/a (restored, not committed)

**3. [Rule 3 - Blocking] The broken-windows ledger refused every append**
- **Found during:** recording this plan's defects
- **Issue:** `windows append` rejected the write because the ledger's fenced JSON and its rendered table disagreed on row 6: the JSON description had lost `` `<automated>` ``'s backticks and the whole `` (`cd … && …`) `` parenthetical, while the table row still carried them. The mismatch is pre-existing (WINDOWS.md was unmodified before this plan) and blocks *any* future append, not just this one.
- **Fix:** Took the remedy the tool itself names — "Edit the fenced JSON block directly" — and synced row 6's JSON description back to the richer table text. The rendered table was not hand-edited. Then both this plan's entries appended cleanly.
- **Files modified:** `.planning/WINDOWS.md`
- **Verification:** `windows status` parses and reports `total_count: 8`; the two new entries (ids 7, 8) are present with the table regenerated from JSON.
- **Committed in:** the plan metadata commit

---

**Total deviations:** 3 auto-fixed (3 blocking)
**Impact on plan:** No scope creep. All three were environment, repository-hygiene, or ledger-integrity obstacles that blocked the plan's own verification and record-keeping steps; none changed the shipped behaviour.

### Planned-but-not-applicable: Task 3's RED gate

Task 3 carries `tdd="true"`, and the plan's own action says "the primitive is already edited by Task 1, so expect the class assertions to pass and the two warning cases to drive `devWarn.js`'s call-time `DEV` read". Because of that sequencing, **no honest RED commit exists**: all nine assertions were green on the first run. Rather than fabricate a RED/GREEN pair, this is recorded as-is. `workflow.tdd_mode` is not enabled in `.planning/config.json` and the plan frontmatter is `type: execute`, so no RED-gate contract applied. Logged as a `deviation` entry in `.planning/WINDOWS.md`.

### Prohibitions verified as held

- **No new runtime dependency** — `package.json` untouched; every assertion uses Vitest and the existing jsdom environment.
- **No invented hex or token** — the warm pair reads only `warm-accent-deep`, `warm-line`, `warm-card`, `warm-ink` and `warm-raised`.
- **No export renamed** — `GlassButton`'s default export and named export are intact; `BUTTON_VARIANTS` is an addition, not a rename.
- **No interpolated class** — both warm keys are whole literal strings.

## Issues Encountered

- **Non-vacuity probes were run by hand and reverted.** Removing `warm` from `VARIANTS` makes `variantKeys.test.js` fail with `pages/LandingPage.jsx passes variant="warm"` ×4. Removing both warm keys makes `landingCta.test.jsx` fail 2 of 3 cases while the 8-CTA floor still passes — the floor is deliberately variant-independent, so it proves the walk, not the register. Re-adding `active:translate-y-[1px]` fails the translate assertion. Hoisting the `DEV` read to module scope in `devWarn.js` fails 2 devWarn cases. All four probes were reverted; `git status` confirms no tracked `web-dashboard/` file is modified.
- **The `variant=` gate is a floor, not a proof.** The gate catches a key that no primitive declares. It cannot catch a key that resolves to the *wrong* declared variant — that requires the rendered assertions in `landingCta.test.jsx`. The two files are deliberately complementary.
- No authentication gates, no checkpoints, no user setup.

## Known Stubs

| Stub | File | Reason | Owner |
|------|------|--------|-------|
| The gate's `tone=` half is not implemented | `web-dashboard/src/variantKeys.test.js` | Its vocabulary is the banner tone set, which moves to the new primitive in 03-03; the half cannot be written against a primitive that does not exist yet. Documented in the file header. | 03-06 (`ROADMAP.md:86`, "the `tone=` gate half") |

No other stubs: every assertion in the four new test files reads real, shipped behaviour, and nothing in this plan renders placeholder or hardcoded-empty data.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **The gate exists and is extensible.** `web-dashboard/src/variantKeys.test.js` reads vocabularies from source and asserts floors before verdicts, so 03-06 adds the `tone=` half by adding one vocabulary read and one union — not by restructuring the walk.
- **`BUTTON_VARIANTS` is the pattern to copy.** 03-03, 03-06 and 03-07 rebuild the remaining primitives; exporting each one's key set is what lets its gate and its tests read a single declaration.
- **The warm pair is locked from both sides.** The rendered lock (`landingCta.test.jsx`) and the primitive lock (`GlassButton.test.jsx`) both fail if the landing register collapses again.
- **Carried forward, open by design:** the off-grid spacing residuals and the missing distinct `--danger-hover` value belong to ROADMAP backlog 999.3, and the 360/768/1280 visual click-through of the rebuilt landing register is now an unrun verify in `.planning/WINDOWS.md` (no browser in this environment).
- **Blockers:** none.

---
*Phase: 03-primitive-rebuilds*
*Completed: 2026-10-18*

## Self-Check: PASSED

- All 5 created source/test files and this SUMMARY exist on disk.
- All 3 task commits (`f9e902d9`, `edc30737`, `22b26229`) are ancestors of HEAD.
- Ledger measurement: `plan_head_before` `2fd022f7` → `plan_head_after` `22b26229`, `commits: 3` (matches the 3 task commits).
