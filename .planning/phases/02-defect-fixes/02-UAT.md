---
status: testing
phase: 02-defect-fixes
source: [02-VERIFICATION.md]
started: 2026-10-17T14:07:34.177Z
updated: 2026-10-17T14:29:07.726Z
---
## Current Test

number: 5
name: Backstop-tagged truth (02-04): two concurrent renders of the dashboard cannot change the number of standing actions.
expected: |
  Exactly two standing actions under any render, transition or concurrent update.
awaiting: user response

## Tests

### 1. Backstop-tagged truth (02-01): reorder the `boxShadow` block in tailwind.config.js and confirm no call-site's resolved shadow changes (identity is by name, not declaration order).
expected: Resolved class output is identical for every consumer after reordering; no visual change on any surface.
result: pass
why_human: Declared `verification: backstop` (non-inferable). No held-out or property-based test exercises declaration-order independence; presence + wiring cannot qualify.

### 2. Backstop-tagged truth (02-01): re-run the token normalization over the already-normalized tailwind.config.js / src/index.css and confirm both files stay byte-identical.
expected: Second run is a no-op: no second-order substitution, no repeated rewrite, `git diff` empty.
result: pass
why_human: Declared `verification: backstop`. There is no idempotency property test and no referent for the hypothetical second run.

### 3. Backstop-tagged truth (02-02): tab through the landing nav and confirm a focused control flush against a 44px neighbour paints its own ring, unclipped and unmerged.
expected: Each element paints its own visible 2px focus indicator; no ring is clipped by the neighbour's box.
result: pass
why_human: Declared `verification: backstop`. jsdom has no layout engine or paint, so no test can observe clipping.

### 4. Backstop-tagged truth (02-03): compare StatusChip's icon shape and text label by code-point identity rather than locale collation.
expected: A level's non-colour channels read as distinct under every locale, never equal under one and distinct under another.
result: pass
why_human: Declared `verification: backstop`. Variant selection is outside jsdom's control; no cross-locale test exists.

### 5. Backstop-tagged truth (02-04): two concurrent renders of the dashboard cannot change the number of standing actions.
expected: Exactly two standing actions under any render, transition or concurrent update.
result: [pending]
why_human: Declared `verification: backstop`. The sequential state-change case is covered by DashboardPage.test.jsx ('still exposes exactly two after the reading state changes'); true concurrency is not exercised.

### 6. Backstop-tagged truth (02-04): two concurrent runs of the copy guard over the same tree reach the same verdict.
expected: Identical verdicts, no shared mutable state between files.
result: [pending]
why_human: Declared `verification: backstop`. Same-process concurrency is not exercised by the suite (the guard's statelessness is only readable from its source).

### 7. Unverified prohibition (all plans): no fabricated telemetry ships as live data - an unmeasured value reads as unavailable or sits under the explicit Simulation label.
expected: No number presented as measured unless it is measured; every simulator-derived figure carries the Simulation label.
result: [pending]
why_human: Non-authoritative LLM-judge verdict: APPEARS UPHELD. Source inspection shows the simulator generator is the only Math.random consumer (InsoleContext.jsx:61) and is gated behind `source === SOURCE.SIMULATOR`; the Simulation banner renders from the dictionary on DashboardPage.jsx:286-287, HistoryPage.jsx:237-238 and MonitoringPage.jsx:165; DevicePage.jsx:58 and AppSidebar.jsx:88 label the source; unmeasured battery renders '--' with device.simulatedNote. Recorded as unverified-prohibition - human review recommended.

### 8. Unverified prohibition (all plans): risk must never be conveyed by colour alone.
expected: No risk element ships without its icon shape and text label.
result: [pending]
why_human: Non-authoritative LLM-judge verdict: APPEARS UPHELD. StatusChip.jsx:19-32 maps each of the three levels to a distinct icon component (CheckCircle2 / AlertTriangle / AlertOctagon), a translated label and a distinct tone pair; every one of the 19 StatusChip call sites in shipped src/ passes a `label` prop; the dashboard header pairs STATUS_INK with a STATUS_TEXT label. Recorded as unverified-prohibition - human review recommended.

### 9. Unverified prohibition (all plans): the design-token gate was never weakened, bypassed or deleted to make a change pass.
expected: The gate grows; a failing assertion is fixed by correcting the source.
result: [pending]
why_human: Non-authoritative LLM-judge verdict: APPEARS UPHELD. designTokens.test.js moved from 3 assertions (Phase 1) to 5, adding a positive declared-ink assertion, a negative undeclared-literal scan and a pairwise shadow-uniqueness assertion; no assertion was deleted or loosened in the phase. Recorded as unverified-prohibition - human review recommended.

### 10. Landing click-through at 360px, 768px and 1280px (02-02 coverage D6 / plan manual step).
expected: The drawer trigger measures 44x44, nav links do not shrink below 44px, and Tab paints a visible ring on each.
result: [pending]
why_human: jsdom has no layout engine and no paint, so a physically measured box and a visibly painted ring at three viewports cannot be proven by the suite.

### 11. Dashboard click-through at 360px and 1280px with the device unplugged and with a good reading (02-03 coverage D9).
expected: The trend panel reads the empty state rather than an endless skeleton, and the score tile for a good reading is sage (success), not the neutral fallback.
result: [pending]
why_human: The rendered tests prove the class contract, not the rendered appearance; the live simulator connection is not available to jsdom.

### 12. Dashboard and Admin click-through at 360px, 768px and 1280px with the simulator running (02-04 coverage D6).
expected: The Simulation banner reads correctly with sane geometry, and the admin users table shows the localised 'Tidak tersedia' fallback rather than a dash.
result: [pending]
why_human: Composed runtime surface: banner geometry at three viewports and the simulator's own provider state are outside jsdom.

### 13. Returning-user language migration (02-05 coverage D6).
expected: Seed a non-Indonesian `language` value in browser local storage, load the app: the interface renders in Indonesian and the stored value is corrected.
result: [pending]
why_human: A jsdom test proves the reader's contract and the mirrored context value, not what a browser paints from a preference written by an earlier build.

### 14. Crash-surface click-through (02-06 coverage D5).
expected: Make a page throw, see the page-shaped fallback with a named cause, activate the recovery action, and have the page come back - legible at 360px / 768px / 1280px.
result: [pending]
why_human: No browser is available to this environment. The DOM-level equivalent is automated in App.errorBoundary.test.jsx, which cannot judge legibility.

### 15. Developer decision - residual FIX-03 target in AppSearch (deferred, see Deferred Items).
expected: Accept the deferral to Phase 4, or widen Phase 2 with the AppSearch clear button (h-8 w-8 = 32px, AppSearch.jsx:170) brought to >=44x44px.
result: [pending]
why_human: This is a scope question, not a code question: the target is not audit-identified, is owned by a later phase, and blocks nothing else.

## Summary

total: 15
passed: 4
issues: 0
pending: 11
skipped: 0
blocked: 0

## Gaps
