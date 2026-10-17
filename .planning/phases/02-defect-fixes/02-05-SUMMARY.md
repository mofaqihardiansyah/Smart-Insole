---
phase: 02-defect-fixes
plan: 05
subsystem: ui
tags: [react, i18n, localstorage, vitest, testing-library, design-document, d-05, d-06]

# Dependency graph
requires:
  - phase: 01-design-system-audit-token-lock
    provides: the approved copywriting contract (01-UI-SPEC.md:273, "Indonesian only ... no language switch") and the recorded user decision (REQUIREMENTS.md:77) that D-05 reconciles DESIGN.md against
provides:
  - readStoredLanguage forces the Indonesian contract value, writes it back so later readers agree, and still returns the default when storage throws
  - InsoleContext.test.jsx locks the inverted hydration assertion, the write-back, the throwing-storage tolerance and the idempotent second mount (D-06)
  - PlantarHeatmap.test.jsx locks at the component layer that a stored foreign preference does not switch the labels
  - DESIGN.md states the Indonesian-only contract at both stale sites and names Phase 5 (LANG-01) as the owner of the switch's removal (D-05)
affects: [03-primitive-rebuilds, 04-shell-rebuild, 05-page-rebuild, 06-delivery-gate]

# Actuals (#2632) — pairs with the plan's `estimate` (20000 tokens, 2 tasks).
actuals:
  tokens: 1694          # chars/4 over the realized diff (6778 chars of unified diff)
  tasks: 2
  commits: 2
plan_head_before: 89ba30cb03232644233d56c4ba44a02803ae6e46
plan_head_after: 5f34d9e410047daf732956e7410b2984eab14f50

# Tech tracking
tech-stack:
  added: []            # No packages installed — one function body, two test files and one document
  patterns:
    - "Read-time migration: a reader that receives an untrusted persisted value forces the contract value and writes the correction back, so every later read in the session agrees with what is on screen"
    - "Tolerated-storage contract: the forcing write sits inside the existing try/catch, so a storage implementation that throws on write degrades to the default instead of breaking the first render"
    - "Invert the assertion in the same commit as the behaviour change, so neither side of the split is red on its own"

key-files:
  created: []
  modified:
    - web-dashboard/src/context/InsoleContext.jsx
    - web-dashboard/src/context/InsoleContext.test.jsx
    - web-dashboard/src/components/PlantarHeatmap.test.jsx
    - DESIGN.md

key-decisions:
  - "The stored-language reader was narrowed from a two-value allow-list to an unconditional force: the only shipped language is Indonesian, so a value the app did not write has no standing at all. Storage is attacker-influenced, so 'trust it if it looks like one of ours' was the wrong shape and 'write the contract value and return it' is the right one"
  - "The forcing write lives inside the existing try and the return sits outside it, so the function keeps readStoredThresholds' one-try-one-catch shape and a private-mode storage (which throws on write) still yields the default rather than a white screen"
  - "The DESIGN.md reconciliation is documentation-only: it records where the switch currently stands, that the reader now forces Indonesian, and that Phase 5 (LANG-01) owns the removal. The honest statement of a deferred change beats a claim that it is already gone"
  - "The persistence effect, the language setter, the LanguageToggle and both dictionaries were deliberately left alone, so Phase 5's switch removal stays a coherent self-contained change rather than a half-done one"

patterns-established:
  - "Migration proof set: one case per property of a read-time migration — the forced value, the corrected stored copy, the followed documentElement.lang, a throwing storage, and a second independent mount"

requirements-completed: [FIX-09]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "A stored non-Indonesian language preference cannot change the rendered language: the provider renders Indonesian, the stored key is corrected on mount, and document.documentElement.lang follows"
    requirement: FIX-09
    verification:
      - kind: unit
        ref: "web-dashboard/src/context/InsoleContext.test.jsx#forces Indonesian and corrects the stored language when hydration finds a foreign value"
        status: pass
      - kind: unit
        ref: "web-dashboard/src/components/PlantarHeatmap.test.jsx#keeps Indonesian labels when storage holds a foreign language preference"
        status: pass
    human_judgment: false
  - id: D2
    description: "The stored-language reader survives a storage implementation that throws on write, so private-mode storage cannot break the provider's first render"
    requirement: FIX-09
    verification:
      - kind: unit
        ref: "web-dashboard/src/context/InsoleContext.test.jsx#survives storage that refuses writes and still forces Indonesian"
        status: pass
    human_judgment: false
  - id: D3
    description: "Indonesian is forced on every mount independently: mounting twice with the foreign value stored each time yields Indonesian both times"
    requirement: FIX-09
    verification:
      - kind: unit
        ref: "web-dashboard/src/context/InsoleContext.test.jsx#forces Indonesian on a second mount without depending on the first"
        status: pass
    human_judgment: false
  - id: D4
    description: "DESIGN.md states the Indonesian-only language contract at both stale sites and names Phase 5 (LANG-01) as the owner of the switch's removal"
    requirement: FIX-09
    verification:
      - kind: other
        ref: "grep -cP 'in\\s+either\\s+language|stays\\s+switchable' DESIGN.md returns 0; grep -c 'Indonesian only' and grep -c 'LANG-01' each return 1"
        status: pass
    human_judgment: false
  - id: D5
    description: "The language switch still works and the English dictionary is untouched, so Phase 5's removal remains a coherent, self-contained change"
    requirement: FIX-09
    verification:
      - kind: unit
        ref: "web-dashboard/src/context/InsoleContext.test.jsx#persists language and mute changes back to localStorage (setLanguage('en') still writes through)"
        status: pass
      - kind: unit
        ref: "web-dashboard/src/components/PlantarHeatmap.test.jsx#reads live readings and language from InsoleContext when no override is given (setLanguage('en') still renders 'Heel (Calcaneus)')"
        status: pass
      - kind: unit
        ref: "web-dashboard/src/utils/i18n.test.js — 12/12 pass (neither dictionary touched; the parity and dash gates are intact)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The plan's manual verification: seed the non-Indonesian value in the browser's local storage, load the app, and confirm the interface renders in Indonesian"
    requirement: FIX-09
    verification:
      - kind: manual_procedural
        ref: "plan 02-05 <verification> manual step; to be confirmed at the end-of-phase UAT / GATE-03"
        status: unknown
    human_judgment: true
    rationale: "Confirming a returning user's real browser storage and the rendered interface is a judgment a jsdom test does not cover: the unit cases prove the reader's contract and the mirrored context value, not what the browser paints from a preference written by an earlier build."

duration: 8 min
completed: 2026-10-17
status: complete
---

# Phase 2 Plan 05: Force Indonesian on read and reconcile the language contract Summary

**A stored foreign language preference can no longer decide what the app renders — `readStoredLanguage` now forces the Indonesian contract value and writes it back so every later read agrees, while a storage that throws on write still degrades to the default, and DESIGN.md's two stale clauses now state the Indonesian-only contract and name Phase 5 (LANG-01) as the owner of the switch's removal.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-10-17T12:01:14Z
- **Completed:** 2026-10-17T12:09:17Z
- **Tasks:** 2
- **Files modified:** 4 (+ regenerated `web-dashboard/dist/` build output)

## Accomplishments

- **D-06 (the migration).** `readStoredLanguage` was a two-value allow-list: it read `localStorage.language`, honoured `'id'` or `'en'`, and fell back to `'id'` only for anything else. A returning user whose storage held `'en'` was therefore served the English interface until they found the toggle — and the toggle's removal is two phases away (LANG-01, Phase 5). The reader now writes the Indonesian code to the key inside the existing `try` and returns it from outside the block, so the in-memory default and the persisted value cannot disagree after a mount. Storage is attacker-influenced input read during the provider's first render; forcing and correcting it is the fix the trust boundary calls for, rather than validating it more carefully.
- **The storage-failure path is preserved, not bypassed.** The forcing write sits inside the same `try`, and the `catch` still only comments, so a private-mode storage that throws on write yields the Indonesian default instead of throwing out of the `useState` initialiser and white-screening the provider. The function keeps `readStoredThresholds`' one-try-one-catch-one-return shape, so the two readers stay recognisable siblings.
- **The test set proves one property each.** `InsoleContext.test.jsx` gained three properties around the inverted hydration assertion: the stored key itself is corrected on mount, `document.documentElement.lang` follows the forced value, a storage whose `setItem` throws neither breaks the mount nor changes the rendered language, and a second mount is Indonesian whether or not the first one ran. The invalid-value case (`'fr'` → `'id'`) and the persistence case (`setLanguage('en')` still writes through) were left exactly as they were, which is what keeps the switch honest until Phase 5 removes it.
- **D-05 (the document).** `DESIGN.md:383` claimed the no-em-dash rule applied "in either language" and `:421` ended the landing paragraph with "Language stays switchable". Both contradicted the recorded decision (`REQUIREMENTS.md:77`, `01-UI-SPEC.md:273`, ROADMAP Phase 5 criterion 5). The dash rule now reads as Indonesian-only with one dictionary holding to it, and the landing paragraph states that the switch is still present and still works, that the stored-preference reader now forces Indonesian, and that Phase 5 (LANG-01) owns its removal. DESIGN.md is the design authority Phases 3 to 5 read, so a clause that says the language is switchable while the roadmap says it is not is exactly the contradiction that gets re-litigated later.

## Task Commits

Each task was committed atomically:

1. **Task 1: End-to-end language migration (tracer)** - `7565feb3` (fix) — the inverted/extended provider test and the `readStoredLanguage` source change in one commit, per the plan's atomicity requirement, plus the `PlantarHeatmap.test.jsx` inversion that the same behaviour change forced (see Deviations).
2. **Task 2: Reconcile the two stale language clauses in DESIGN.md** - `5f34d9e4` (docs)

**Plan metadata:** the plan-completion `docs(02-05)` commit (SUMMARY.md + STATE.md + ROADMAP.md + `.planning/WINDOWS.md` + regenerated `dist/`).

_Note: Task 1 was a `type="tracer"` task. The tracer feedback gate was evaluated — no `gate` attribute, auto mode inactive (`_auto_chain_active` and `auto_advance` both false), `workflow.human_verify_mode` = `end-of-phase` (default), and the task's `<verify>` carrying only an `<automated>` step. That is the gate's row 3: the verify was re-run green, so execution expanded into Task 2 without a checkpoint._

## Files Created/Modified

- `web-dashboard/src/context/InsoleContext.jsx` — `readStoredLanguage` (was :166-173) now writes the Indonesian code to the language key inside the existing `try`, leaves the storage-unavailable comment in the `catch`, and returns `'id'` from outside the block. The persistence effect at :255-264, the setter, `connectNonce`, `readStoredThresholds` and every data/source state are untouched.
- `web-dashboard/src/context/InsoleContext.test.jsx` — the hydration case inverted and extended (Indonesian plus the corrected stored key plus `documentElement.lang`), and two new cases: a read-only storage that throws on write, and a second mount independent of the first. The invalid-value case and the persistence case are byte-identical to before.
- `web-dashboard/src/components/PlantarHeatmap.test.jsx` — the "switches labels between languages" case asserted the reversed contract (a stored `'en'` should switch the labels); it now locks that a stored foreign preference does **not** switch them. English is still reachable through the context setter, which the neighbouring case already proves.
- `DESIGN.md` — the anti-slop dash rule at `:383` no longer claims to span two languages, and the landing paragraph at `:421` states where the switch stands and who removes it.
- `web-dashboard/dist/**` — regenerated build output (JS/CSS hashes + `index.html`), committed with the plan-tracking commit per the repo's existing convention (`af8fe9be`, `89ba30cb`).

## Decisions Made

- **Force rather than validate.** The reader's allow-list (`stored === 'id' || stored === 'en'`) was the defect's shape: it treated a value the app did not write as a candidate. With one shipped language there is nothing to choose between, so the reader writes the contract value and returns it. This is the same reasoning the plan's threat register records for T-02-13 (storage is spoofable and was trusted verbatim).
- **Write-back, not just force.** Forcing only the return value would leave the stale key in place, so the persistence effect and any later reader would disagree with what the first render showed. Writing the correction inside the same `try` collapses the two into one state with no extra effect and no ordering dependency.
- **Keep the switch working.** The D-05 boundary is explicit that removing the toggle is LANG-01 (Phase 5) and rewrite-scale (455 two-arg `t(key, language)` call sites, the 445-line EN dictionary, the toggle's four mounts, a profile select, and the i18n parity tests). So `setLanguage` still switches, both dictionaries are untouched, and only the *read path* was narrowed. That keeps Phase 5's removal a coherent single change instead of a half-finished one.
- **Reconciled clauses name the owner.** Both DESIGN.md edits state the current truth and name LANG-01 rather than pretending the switch is already gone, so a later reader of the design authority cannot derive a switchable-language requirement from it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `PlantarHeatmap.test.jsx` asserted the same reversed contract the plan inverts elsewhere**

- **Found during:** Task 1 (end-to-end language migration), at the plan's own `npm test` verification step — the full suite went red after the source change was correct.
- **Issue:** The plan's atomicity requirement named `InsoleContext.test.jsx:118-135` as the one assertion that blesses the non-Indonesian stored value. There was a second one: `PlantarHeatmap.test.jsx:132-152` ("switches labels between languages") seeded `localStorage.language = 'en'`, mounted a fresh provider and asserted the English label `Heel (Calcaneus)`. That is the pre-D-06 hydration contract, so it fails the moment the reader forces Indonesian — a genuine consequence of the planned behaviour change, not a pre-existing failure (the suite was green at `89ba30cb` before any edit).
- **Fix:** Inverted the case in the same commit as the source change, and renamed it to what it now proves — "keeps Indonesian labels when storage holds a foreign language preference". The test keeps its first half (a fresh mount renders `Tumit (Heel)`), then seeds `'en'` and asserts the labels stay Indonesian and `Heel (Calcaneus)` is absent. English is still reachable through the context setter, and the neighbouring case at `:154-182` (`ctxRef.setLanguage('en')` → `Heel (Calcaneus)`) still proves it, so the switch's own coverage is unchanged. No production code beyond the planned `readStoredLanguage` body was touched.
- **Files modified:** `web-dashboard/src/components/PlantarHeatmap.test.jsx`
- **Verification:** `cd web-dashboard && npx vitest run src/components/PlantarHeatmap.test.jsx` (9/9) and the full suite (`npm test`) — 186 tests across 15 files, all green; `npm run build` with zero errors.
- **Committed in:** `7565feb3` (Task 1 commit — the same commit as the reader change, so no revision of the tree has a red suite)
- **Ledger:** recorded as `.planning/WINDOWS.md` entry #1 (`kind: deviation`, status `fixed`).

---

**Total deviations:** 1 auto-fixed (1 bug).
**Impact on plan:** Confined to one test file's assertion, and forced by the plan's own behaviour change rather than chosen. It widens the plan's `files_modified` by one file (`web-dashboard/src/components/PlantarHeatmap.test.jsx`), which is the honest footprint of D-06; the alternative — leaving it — would have made `npm test` red, which the plan's own task-2 acceptance criterion forbids. No scope creep: no production file outside the planned `readStoredLanguage` body was edited, and the switch, the dictionaries and the toggle were not touched.

## Issues Encountered

- **`gsd_run` is not on `PATH` in this environment; `gsd-tools.cjs` is reachable directly.** The shell resolver finds nothing, but `/home/qihh/.config/opencode/gsd-core/bin/gsd-tools.cjs` exists and proves its identity (`{"packageName":"@opengsd/gsd-core","version":"1.16.0"}`), so the SDK verbs were driven as `node "$GSD_TOOLS" query <verb>`. Plans 02-01 and 02-03 recorded the same probe and fell back to direct edits; this run could use the handlers.
- **`state.advance-plan` was deliberately not run.** It increments the plan pointer, and this plan was dispatched out of order — 02-02 and 02-04 are still outstanding, so the current plan index is 5 rather than 4. `state.record-metric`, `state.add-decision` (×2), `state.record-session` and `roadmap.update-plan-progress` all ran through the SDK; the Current Position lines, the progress bar and the `progress.completed_plans` counter were then corrected by hand (`3 of 6` → `5 of 6`, `64%` → `73%`, `7` → `8`).
- **`state.update-progress` skipped itself** (`"phase scope is unscoped, not complete"`), leaving the Progress field untouched — which is why the bar was recalculated as part of the manual correction above.
- **`FIX-09` is not marked complete in `REQUIREMENTS.md`.** The requirement is declared by both 02-05 and 02-04, and 02-04 has not produced a SUMMARY, so the shared-ID gate reports `0/1 requirement(s) ready to mark complete`. The `requirements-completed: [FIX-09]` field above is copied verbatim from the plan's frontmatter, as the template requires; the checkbox and the traceability row stay `Pending` until 02-04 lands, which is the gate working as designed. This plan disposes only the requirement's language-scope half (D-05/D-07: the `DESIGN.md:383` clause that made the dash rule multilingual is gone, so "both ID and EN, if retained" resolves to no English work); the five probe rows are authored in 02-04.
- **Pre-existing, out of scope and left untouched:** the two deleted `.planning/phases/01-.../01-06-PLAN.md` and `01-07-PLAN.md` entries, and the untracked `.planning/config.json`, `.planning/state.json`, `.planning/milestone.lock` and `01-PATTERNS.md`. None were staged, reverted or committed by this plan.
- **Pre-existing, out of scope:** the suite emits `Error: Not implemented: navigation (except hash changes)` from the exported-CSV test. It is stderr noise, not a failure, and predates this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **D-06 is closed at read-time scale.** No returning user can be served the non-Indonesian interface by a stale stored preference, and the reader still survives storage being unavailable. Phase 5's removal of the switch is unaffected and stays self-contained.
- **D-05 is closed at documentation scale.** DESIGN.md carries the Indonesian-only contract and names LANG-01 as the owner of the switch's removal; both stale clauses are gone and the design authority no longer contradicts the roadmap.
- **A regression now fails tests, not review.** A stored foreign value changing the rendered language fails `InsoleContext.test.jsx`; the same at component level fails `PlantarHeatmap.test.jsx`; a migration that writes without catching fails the read-only-storage case; and a migration that depends on a previous mount fails the idempotency case.
- **Manual confirmation outstanding.** The plan's manual step (seed the non-Indonesian value in a browser's local storage, load the app, confirm the interface renders in Indonesian) is recorded as coverage item `D6` and is to be confirmed at the end-of-phase UAT / GATE-03, not mid-flight.
- **Requirement bookkeeping.** `FIX-09`'s checkbox in `REQUIREMENTS.md` becomes ready once 02-04 produces its SUMMARY — the shared-ID gate re-evaluates on the next plan completion in this phase.
- **Phase 02 is not finished:** 02-02 (FIX-02, FIX-03) and 02-04 (FIX-05, FIX-07, FIX-09) are still outstanding alongside 02-06 (FIX-10).
- **Full suite green:** 186 tests across 15 files; `InsoleContext.test.jsx` 14/14; `i18n.test.js` 12/12; `PlantarHeatmap.test.jsx` 9/9; `npm run build` with zero errors (chunk-size advisory only).

---

## Self-Check: PASSED

- All four plan deliverables exist on disk (`InsoleContext.jsx`, `InsoleContext.test.jsx`, `PlantarHeatmap.test.jsx`, `DESIGN.md`).
- Both task commits (`7565feb3`, `5f34d9e4`) are ancestors of HEAD.
- `gsd-tools check evaluation-scope --plan 02-05 --commits-only` resolves to `status: resolved` with both commits listed.
- Plan-level verification re-run green: `npx vitest run src/context/InsoleContext.test.jsx` 14/14; `npx vitest run src/utils/i18n.test.js` 12/12; `npm test` 186/186 across 15 files; `npm run build` zero errors; `grep -cP 'in\s+either\s+language|stays\s+switchable' DESIGN.md` = 0; `git show --stat 7565feb3` lists `InsoleContext.jsx` and `InsoleContext.test.jsx` together.

---
*Phase: 02-defect-fixes*
*Completed: 2026-10-17*
