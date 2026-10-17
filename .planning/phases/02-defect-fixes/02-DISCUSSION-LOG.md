# Phase 2: Defect fixes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-17
**Phase:** 02-defect-fixes
**Areas discussed:** Token inventory & the build gate, Language contract, Scope fence for the extra findings, Landing surface

**Advisor mode:** active (`gsd-core/USER-PROFILE.md` present); calibration tier `full_maturity` (`vendor_philosophy: thorough-evaluator`); `NON_TECHNICAL_OWNER = false`. Each area was researched by a `gsd-advisor-researcher` subagent and presented as a comparison table before selection.

---

## Token inventory & the build gate

| Option | Description | Selected |
|--------|-------------|----------|
| A — Normalize to warm-dark | Replace `#232427` with `warm-dark` `#171719` at the 5 sites; correct the inventory rows; widen FIX-01 to `tailwind.config.js` + `index.css`; invert `designTokens.test.js:74-77` to assert `warm-dark` and forbid `35 36 39`. | ✓ |
| B — Promote `#232427` to a `warm-shadow` token | Add `--warm-shadow: 35 36 39` to `index.css` and the DESIGN.md warm registry; repoint the 5 sites; test asserts the new token. | |
| E — Normalize to `warm-panel` `#202024` | Numerically closest declared token (Δ≈3/4/3); reuses an existing value but repurposes a surface shade as shadow ink. | |
| D — Doc-only close | Correct the inventory + neutralize the assertion, keep the literal shipping. | |

**User's choice:** A — Normalize to warm-dark
**Notes:** Resolves the researcher's open question (which declared token owns the "warm" in `DESIGN.md:273-276`) in favour of `warm-dark`, so no DESIGN.md token is added and no owner confirmation is needed. The four shadow alphas already match DESIGN.md and are unchanged; only the ink moves. Config + test must land in one commit.

---

## Language contract

| Option | Description | Selected |
|--------|-------------|----------|
| 1 — Defer removal to LANG-01 + amend DESIGN.md | Indonesian-only is the contract; Phase 2 reconciles `DESIGN.md:421` as a doc fix and adds a one-line stored-language migration to `'id'`. Toggle + EN dictionary removal stays in Phase 5. | ✓ |
| 2 — Pull LANG-01 forward into Phase 2 | Remove toggle + EN dictionary + language state now; rewrite-scale work that Phases 3–5 redo. | |
| 3 — Half-step: unmount toggle, keep dictionary | A returning user hydrates `'en'` with no way back — strictly worse. | |
| 4 — Keep bilingual, reverse LANG-01 | `DESIGN.md:421` wins; contradicts the recorded user decision and expands FIX-09 to EN. | |
| 5 — Mitigate now: force `'id'`, hide the control | Closes the harm cheaply but leaves a temporary branch and non-conforming markup. | |

**User's choice:** 1 — Defer removal to LANG-01 + amend DESIGN.md
**Notes:** Language scope is a product decision owned by REQUIREMENTS.md, not a token decision owned by DESIGN.md, so Indonesian-only wins and DESIGN.md is reconciled. FIX-09 therefore reduces to the two language-neutral `AdminPage.jsx:201,204` fallbacks plus a grep copy guard; both dictionaries already contain zero em dashes, so "EN, if retained" is no work.

---

## Scope fence for the extra findings

| Option | Description | Selected |
|--------|-------------|----------|
| B — Ownership fence | Phase 2 takes only orphaned/global findings: widen FIX-01 to the shadow config (also fixes `lg`≡`overlay`) and add FIX-10 for an app-level ErrorBoundary. Defer the rest to named owners with a deferral table. | ✓ |
| A — Fix all 7 in Phase 2 | New FIX-10…FIX-16; cleanest literal baseline but ~10 files, 10 of 14 instances in files Phases 3–5 rewrite or delete. | |
| C — Existing-requirement-only + backlog | Smallest Phase 2; leaves shadow/radius ambiguity for later phases and orphans the ErrorBoundary. | |
| D — Defer all 7, no roadmap change | Findings 2/5 + `App.jsx:101` orphan past every phase. | |
| E — Gate-first only | Assert conformance in `designTokens.test.js` without hand-fixing instances; brittle alone. | |

**User's choice:** B — Ownership fence
**Notes:** Net Phase 2 growth is exactly two items: the widened FIX-01 (shadow ink + `lg`/`overlay` uniqueness) and new FIX-10 (ErrorBoundary). Everything else defers to a named owner, and Phase 6 GATE-04 is the safety net. No backlog file — an ownerless entry has no trigger and no phase that reads it.

---

## Landing surface

| Option | Description | Selected |
|--------|-------------|----------|
| C — Fix a11y-critical targets now, defer the rest | 2-line fix for the drawer trigger (`h-11 w-11`) and nav links (`min-h-[44px]`); defer type scale + radius to PAGE-10 with explicit carry-forward criteria. | ✓ |
| B — Scope FIX-03 to the app register | Zero landing churn but ships a 40px target at 360px and makes Phase 2 & 6 fail their own written criteria. | |
| A — Fix everything on the landing now | ~60 class edits; DESIGN.md declares no landing type scale, so this either breaks the two-register contract or invents sizes without PAGE-10 context. | |
| D — Fix targets + declare landing tokens | Also declares landing heading/radius tokens; registry churn against a page about to be rewritten. | |

**User's choice:** C — Fix a11y-critical targets now, defer the rest
**Notes:** The compensating control is mandatory: PAGE-10 + GATE-03 gain a landing clause ("drawer trigger `h-11 w-11`, nav links `min-h-[44px]`; heading scale + radius re-derived against a declared landing scale"), or C degrades into option B. FIX-03 stays unqualified and global.

---

## the agent's Discretion

None — every gray area was decided by the user.

## Deferred Ideas

- Radius-scale bypass → SHELL-01 / COMP-01 / PAGE-10
- Undeclared motion (pulse, spin, `transition-all`, hover translate, `scale-[1.04]`) → COMP-01 / COMP-03 / PAGE-10
- Landing `window.addEventListener("scroll")` → PAGE-10
- Decorative `bg-primary/10` + solid `bg-primary` bar → PAGE-04 / 06 / 08 / 09
- `warm-accent-2` used as a text label → PAGE-10
- Landing type scale + landing radius values → PAGE-10 (D-13 carry-forward)
