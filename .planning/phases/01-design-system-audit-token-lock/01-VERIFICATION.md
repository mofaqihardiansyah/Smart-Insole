---
phase: 01-design-system-audit-token-lock
verified: 2026-10-17T14:14:47Z
status: passed
score: 10/10 must-haves verified
covered_files:
  - .planning/phases/01-design-system-audit-token-lock/01-01-PLAN.md
  - .planning/phases/01-design-system-audit-token-lock/01-01-SUMMARY.md
  - .planning/phases/01-design-system-audit-token-lock/01-02-PLAN.md
  - .planning/phases/01-design-system-audit-token-lock/01-02-SUMMARY.md
  - .planning/phases/01-design-system-audit-token-lock/01-03-PLAN.md
  - .planning/phases/01-design-system-audit-token-lock/01-03-SUMMARY.md
  - .planning/phases/01-design-system-audit-token-lock/01-04-PLAN.md
  - .planning/phases/01-design-system-audit-token-lock/01-04-SUMMARY.md
  - .planning/phases/01-design-system-audit-token-lock/01-05-PLAN.md
  - .planning/phases/01-design-system-audit-token-lock/01-05-SUMMARY.md
  - .planning/phases/01-design-system-audit-token-lock/token-inventory.md
  - web-dashboard/src/designTokens.test.js
  - web-dashboard/src/index.css
  - web-dashboard/tailwind.config.js
covered_digest: "v3:sha256:39e8a22beb39a4e106dd1f56980417d94d6df1a8ef3d1ce81952acc939f4c411"
behavior_unverified: 0
overrides_applied: 0
re_verification: true
previous_status: gaps_found
previous_score: 8/10
gaps_closed:
  - "TOKEN-01: all 8 missing :root CSS variables inventoried and mapped 1:1 to DESIGN.md tokens; .card-surface/.inner-glow hardcoded radius/shadow mapped to radius: card / shadow: panel; .nav-scrolled #232427 flagged"
  - "TOKEN-02: .nav-scrolled #232427 flagged as non-DESIGN.md with FIX-01 Phase 2 reference; inventory closing claim no longer states 'zero flagged rows'"
gaps_remaining: []
regressions: []
---

# Phase 01: Design-system audit & token lock — Verification Report (Re-verification)

**Phase Goal:** Every colour/radius/shadow/type value in src/ is inventoried and locked 1:1 to DESIGN.md tokens; light-only theme confirmed; designTokens.test.js build gate green; oil-ui design directions generated in a scratch sandbox that cannot regress production.

**Verified:** 2026-10-17T14:14:47Z
**Status:** passed
**Score:** 10/10 must-haves verified
**Re-verification:** Yes — after gap closure (previous status: gaps_found, score 8/10)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | token-inventory.md exists with all six D-03 columns | ✓ VERIFIED | File present at `token-inventory.md`; header row `source file \| current value \| DESIGN.md token \| measured contrast \| status \| FIX phase reference`; ~68 data rows covering :root and .landing-scope CSS variables plus component usages |
| 2 | Every colour/radius/shadow/type value used in src/ is inventoried and mapped 1:1 to a DESIGN.md token | ✓ VERIFIED | All 8 previously-missing :root vars now inventoried (lines 57-64): `--primary-btn → primary (#0F172A)`, `--primary-on → surface (#FFFFFF)`, `--primary-hover → primary-hover (#020617)`, `--danger-hover → danger (#DC2626)`, `--sidebar → bg (#F8FAFC)`, `--inner-glow → surface (#FFFFFF)`, `--grid → fg (#0F172A)`, `--scrim → fg (#0F172A)`. Hardcoded `.card-surface` border-radius 16px → `radius: card (16px)` (line 65); `.card-surface`/`.inner-glow` box-shadow → `shadow: panel` (lines 66-67). Every mapping cross-checked against DESIGN.md hex values — all match. |
| 3 | Every hard-coded value not present in DESIGN.md is flagged | ✓ VERIFIED | `.nav-scrolled` box-shadow `rgb(35 36 39 / 0.25)` (#232427) flagged as `none — warm-dark is #171719, not #232427`, status `flagged`, FIX phase reference `FIX-01` (line 68). Inventory closing line states "One hard-coded (non-DESIGN.md) value flagged" — no "zero flagged rows" claim (line 70). |
| 4 | Tokens locked into src/index.css (:root + .landing-scope) and tailwind.config.js | ✓ VERIFIED | index.css :root and .landing-scope declare CSS variables matching DESIGN.md hex values 1:1 (e.g. --bg #F8FAFC, --fg #0F172A, --safe #16A34A, warm-* values). tailwind.config.js `token()` maps every variable (colors, fontSize, borderRadius, boxShadow, backgroundImage). Unchanged by gap closure (flag-only per D-06). |
| 5 | Two registers separate (:root app clinical, .landing-scope landing warm; never mixed) | ✓ VERIFIED | index.css keeps :root = clinical slate register and .landing-scope = warm register; components consume `rgb(var(--...))`; LandingPage scopes under `.landing-scope` |
| 6 | designTokens.test.js green post-lock | ✓ VERIFIED | Ran `npx vitest run src/designTokens.test.js`: 3/3 pass (721ms). Full suite unchanged — no source files modified in gap closure, so gate sensitivity intact. |
| 7 | designTokens.test.js fails build on any Tailwind class with no generated rule | ✓ VERIFIED | Test logic: collects every utility-shaped token from src/*.jsx, generates real stylesheet via postcss+tailwindcss, `expect(missing).toEqual([])` fails when a class has no rule. No source changes in gap closure, so gate logic intact. |
| 8 | color-scheme: light on :root and .landing-scope | ✓ VERIFIED | index.css line 23 (`:root { color-scheme: light; }`) and line 259 (`.landing-scope { color-scheme: light; }`). Test asserts both blocks contain `color-scheme: light` and passes |
| 9 | No .dark block / no dark: utility variants anywhere | ✓ VERIFIED | Grep of src/*.{js,jsx,css}: no `.dark` block, no `dark:` variant. Only `dark:` substring matches are the test's own assertion text, the `warm-dark` color NAME in index.css/tailwind.config.js, and comments — none are a `dark:` utility variant or `.dark` block |
| 10 | oil-ui skill installed outside project, zero package.json impact; scratch directions in src/__oil_ui_eval__/ (not shipped, not imported by production) | ✓ VERIFIED | `git diff --exit-code -- package.json` clean (zero impact); package.json has no oil-ui dependency. `OilEvalRegister.jsx` present in `src/__oil_ui_eval__/`; grep confirms no production file imports it; no oil-ui component imports |

**Score:** 10/10 truths verified (2 previously failed gaps now closed; 0 regressions)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `.planning/phases/01-design-system-audit-token-lock/token-inventory.md` | Markdown table, 6 D-03 columns, every src/ value mapped or flagged | ✓ VERIFIED | Exists with all 6 columns; ~68 rows; all 8 missing :root vars added; .card-surface/.inner-glow radius/shadow mapped; .nav-scrolled #232427 flagged with FIX-01; no "zero flagged rows" claim |
| `web-dashboard/src/index.css` | CSS variable token layer (:root + .landing-scope), every value a DESIGN.md token | ✓ VERIFIED | :root and .landing-scope variables match DESIGN.md 1:1; `.nav-scrolled` #232427 left unchanged (flag-only per D-06, carried to Phase 2 FIX-01) |
| `web-dashboard/tailwind.config.js` | `token()` mappings for colors, fontSize, borderRadius, boxShadow | ✓ VERIFIED | `token(name)` → `rgb(var(--name) / <alpha-value>)`; mappings present for all variables |
| `web-dashboard/src/designTokens.test.js` | Hardened build gate; green; rejects dark:; asserts color-scheme: light | ✓ VERIFIED | 3 tests, all pass; includes dark: rejection + color-scheme: light assertions |
| `web-dashboard/src/__oil_ui_eval__/OilEvalRegister.jsx` | Scratch design-direction page; not imported by production | ✓ VERIFIED | Present; no production imports; build clean |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| index.css CSS variables | tailwind.config.js `theme.extend` | `token(name)` → `rgb(var(--name) / <alpha-value>)` | ✓ WIRED | Every :root/.landing-scope variable has a token() mapping |
| tailwind.config.js utilities | Components | Tailwind class names (`bg-bg`, `text-fg`, `shadow-panel`, `rounded-control`, etc.) | ✓ WIRED | Components use utilities that resolve to CSS variables |
| designTokens.test.js | tailwind.config.js + src/*.jsx | postcss generates real stylesheet; test asserts every utility class has a rule | ✓ WIRED | Test imports `../tailwind.config.js` and collects sources from `src` |
| LandingPage.jsx | `.nav-scrolled` class | `nav.classList.toggle("nav-scrolled", ...)` at line 164 | ✓ FLAGGED (not wired to token) | `.nav-scrolled` box-shadow uses #232427, not a DESIGN.md token; flagged in inventory with FIX-01 carried to Phase 2 — not fixed in Phase 1 per D-06 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| index.css :root | --bg … --series-3 | DESIGN.md palette tokens | Yes (hex values match DESIGN.md) | ✓ FLOWING |
| index.css .landing-scope | warm-canvas … warm-accent-2 | DESIGN.md landing palette | Yes (hex values match DESIGN.md) | ✓ FLOWING |
| tailwind.config.js | colors / fontSize / borderRadius / boxShadow | `token()` → index.css CSS variables | Yes | ✓ FLOWING |
| Components (GlassCard, etc.) | `rgb(var(--token))` | index.css CSS variables via Tailwind utilities | Yes | ✓ FLOWING |
| index.css `.nav-scrolled` | box-shadow color `rgb(35 36 39 / 0.25)` (#232427) | Hardcoded literal, #232427 | No — not a DESIGN.md token | ✗ DISCONNECTED (flagged FIX-01, carried to Phase 2) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| designTokens.test.js green | `npx vitest run src/designTokens.test.js` | 3/3 pass (721ms) | ✓ PASS |
| Full test suite passes (scratch page doesn't break production) | `npx vitest run` | Previously verified 158 tests pass; no source changes in gap closure | ✓ PASS (prior result, no regression possible — doc-only change) |
| Production build clean (oil-ui scratch cannot regress production) | `npm run build` | Previously verified built zero errors; gap closure modified only token-inventory.md (planning doc) | ✓ PASS (prior result, no source change) |
| designTokens.test.js fails on missing rule | Test logic `expect(missing).toEqual([])` | Code-verified: missing rule → empty array → test fails | ✓ PASS (deterministic, no server needed) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| TOKEN-01 | 01-01-PLAN.md (closed by 01-05-PLAN.md) | Inventory every colour/radius/shadow/type value in src/ and map 1:1 to DESIGN.md tokens | ✓ SATISFIED | Inventory now exhaustive: all 8 missing :root vars, .card-surface/.inner-glow radius/shadow mapped, every value matched or flagged |
| TOKEN-02 | 01-01-PLAN.md (closed by 01-05-PLAN.md) | Flag every hard-coded value not present in DESIGN.md | ✓ SATISFIED | `.nav-scrolled` #232427 flagged with FIX-01 Phase 2 reference; inventory no longer claims "zero flagged rows" |
| TOKEN-03 | 01-02-PLAN.md | Lock tokens into src/index.css (:root + .landing-scope) and tailwind.config.js | ✓ SATISFIED | CSS variables match DESIGN.md 1:1; token() mappings present for all variables |
| TOKEN-04 | 01-03-PLAN.md | designTokens.test.js fails build if any Tailwind class in src/ has no generated rule | ✓ SATISFIED | Test green (3/3); gate logic fails on missing rule |
| THEME-01 | 01-03-PLAN.md | Light-only theme; no dark mode toggle; no dark: variants; color-scheme: light only | ✓ SATISFIED | color-scheme: light on :root and .landing-scope; no .dark block; no dark: variants |
| OIL-01 | 01-04-PLAN.md | Install oil-ui skill outside project (zero package.json impact) | ✓ SATISFIED | package.json unchanged (git diff clean); no oil-ui dependency |
| OIL-02 | 01-04-PLAN.md | Generate design directions in src/__oil_ui_eval__/ scratch sandbox (not shipped) | ✓ SATISFIED | OilEvalRegister.jsx present; not imported by production; build clean |

### CONTEXT.md Decisions Honor Check

| Decision | Required | Honored? | Evidence |
|----------|----------|----------|----------|
| Light-only theme | color-scheme: light only, no dark: | ✓ Yes | index.css :root + .landing-scope; test asserts; grep confirms no dark: variants |
| oil-ui scratch-only | directions in src/__oil_ui_eval__/, not shipped | ✓ Yes | OilEvalRegister.jsx present; no production imports; build clean |
| Flag-only defects | defects flagged with FIX-XX, carried to Phase 2 | ✓ Yes | `.nav-scrolled` #232427 flagged FIX-01, left unchanged in index.css; Phase 1 is doc-only |
| Glass* naming retained | GlassCard/GlassButton/GlassInput/GlassTable/GlassForm not renamed | ✓ Yes | Components and pages import Glass* names unchanged |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| web-dashboard/src/index.css | 166, 172 | Hardcoded box-shadow `rgb(15 23 42 / 0.04)` in `.card-surface`/`.inner-glow` | ✓ MAPPED (not a defect) | Both mapped to `shadow: panel` token in inventory (lines 66-67) |
| web-dashboard/src/index.css | 166 | Hardcoded border-radius 16px in `.card-surface` | ✓ MAPPED (not a defect) | Mapped to `radius: card (16px)` token in inventory (line 65) |
| web-dashboard/src/index.css | 336 | Hardcoded box-shadow `rgb(35 36 39 / 0.25)` (#232427) in `.nav-scrolled` | ⚠️ Flagged FIX-01 | Non-DESIGN.md value; flagged in inventory with FIX-01 Phase 2 reference; NOT fixed in Phase 1 per D-06 |
| web-dashboard/src/components/ui/GlassButton.jsx | 9-15 | Literal hex colors in JSDoc comments | ℹ️ Info | Comments only, not runtime values; no impact |

### Human Verification Required

None. All gaps were code-level and programmatically identifiable; both are now closed via the updated token-inventory.md. No visual, real-time, or external-service checks needed.

### Gaps Summary

Zero gaps remain. Both previously-failed must-haves (TOKEN-01 and TOKEN-02) are fully satisfied:

1. **TOKEN-01 / ROADMAP SC 1** — All 8 missing :root CSS variables (`--primary-btn`, `--primary-on`, `--primary-hover`, `--danger-hover`, `--sidebar`, `--inner-glow`, `--grid`, `--scrim`) now have inventory rows mapped 1:1 to DESIGN.md tokens by hex value. Hardcoded `.card-surface` border-radius 16px → `radius: card (16px)` and `.card-surface`/`.inner-glow` box-shadow → `shadow: panel`. Every colour/radius/shadow/type value in src/ is inventoried and either matched or flagged.

2. **TOKEN-02 / ROADMAP SC 2** — `.nav-scrolled` #232427 is flagged as non-DESIGN.md (warm-dark is #171719, not #232427) with FIX phase reference FIX-01 carried to Phase 2. The inventory closing claim no longer states "zero flagged rows"; it states "One hard-coded (non-DESIGN.md) value flagged". #232427 is left unchanged in index.css (flag-only per D-06).

Phase 1 design-system audit & token lock fully achieves its stated goal. Ready to proceed to Phase 2.

_Verified: 2026-10-17T14:14:47Z_
_Verifier: the agent (gsd-verifier)_
