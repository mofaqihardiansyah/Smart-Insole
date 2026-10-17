# Phase 2: Defect fixes - Context

**Gathered:** 2026-10-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 corrects the defects identified by the Phase 1 audit and the 6-pillar UI review (`01-UI-REVIEW.md`) so that Phases 3–5 rebuild from a clean, spec-conformant baseline. Requirements are FIX-01…FIX-09 (contrast, focus rings, 44×44px touch targets, colour-never-alone risk, dead controls, decorative stat tints, fabricated telemetry, loading/empty/error states, em-dash copy), plus one new requirement accepted in this discussion, FIX-10 (app-level ErrorBoundary).

Scope discipline: the phase boundary is FIXED by ROADMAP.md. This discussion clarified **how** to implement FIX scope and **where** the newly-surfaced audit findings belong; it did not add capabilities that belong to another phase. Findings owned by a later phase are recorded in `<deferred>` with a named owner, never silently dropped.

</domain>

<decisions>
## Implementation Decisions

### Token inventory completeness and the build gate (audit BLOCKER)

- **D-01:** Normalize the undeclared literal `#232427` (`rgb(35 36 39 / …)`) to the declared warm token `warm-dark` `#171719` (`DESIGN.md:436`) at all five shipping sites: `web-dashboard/tailwind.config.js:188-191` (shadows `card`, `lift`, `nav`, `glow`) and `web-dashboard/src/index.css:336` (`.nav-scrolled`). The four shadow alphas (25 / 30 / 25 / 35%) are already correct per `DESIGN.md:273-276` and are not changed — only the ink. — **Reversibility:** costly — reverting re-introduces an undeclared fifth neutral across every landing shadow and requires re-auditing the inventory; the change spans config, `index.css`, and the test in lockstep.
- **D-02:** Correct `token-inventory.md`: add the four `tailwind.config.js:188-191` shadow rows, add the missing `--inner-glow-a` row (`index.css:100`), re-source rows 34-48 from `.landing-scope` to `:root` (the `warm-*` group lives at `index.css:110-125`; `.landing-scope` starts at `index.css:258` and does not re-declare it), and correct the line-70 closing claim.
- **D-03:** Widen **FIX-01** to cover the shadow surface in `tailwind.config.js` and `index.css`, not just component-level contrast. Amend the FIX-01 sentence in `.planning/REQUIREMENTS.md:21` so the wider scope is legible in the tracker. Do NOT reopen Phase 1 — it is Complete and gated, and `D-06` of Phase 1 was explicitly flag-only.
- **D-04:** Invert `web-dashboard/src/designTokens.test.js:74-77`, which currently asserts the off-DESIGN.md `35 36 39` value as correct. Replace it with a positive assertion on the declared ink (`warm-dark` / `23 23 25`) plus a negative assertion that `35 36 39` appears nowhere in `tailwind.config.js` or `index.css`. The existing two-language inequality assertions (`card !== panel`, `panel` matches `15 23 42`) are preserved. The config change and the test change land in the **same commit** or `npm test` goes red. — **Reversibility:** costly — the test encodes the conformance contract; undoing it re-opens the defect class the gate exists to close.

### Language contract

- **D-05:** Indonesian-only is the authoritative contract, per the recorded user decision (`REQUIREMENTS.md:77`, `01-UI-SPEC.md:273`, ROADMAP Phase 5 criterion 5). `DESIGN.md:421` ("Language stays switchable") and the `DESIGN.md:383` "in either language" clause are stale; reconcile both in Phase 2 as **documentation-only** edits. Full removal of the toggle and the English dictionary remains **LANG-01 (Phase 5)**, because it is rewrite-scale (455 two-arg `t(key, language)` call sites, the 445-line EN dictionary at `i18n.js:479-933`, language state/persistence and `document.documentElement.lang` in `InsoleContext.jsx:168-262`, `LanguageToggle` plus its four mounts, a ProfilePage select, and the i18n parity tests) and Phases 3–5 rewrite those call sites anyway. — **Reversibility:** reversible — a documentation edit.
- **D-06:** Add a one-line stored-language migration forcing `'id'` (`InsoleContext.jsx:168`) so no returning user with `language='en'` in localStorage is stranded in English before Phase 5 removes the switch.
- **D-07:** **FIX-09 is scoped to the two language-neutral fallbacks** at `AdminPage.jsx:201,204` (`"—"` → a middot `·` or an accessible placeholder), plus a grep-based copy guard. Both dictionaries already contain zero em dashes (`i18n.test.js:80-90` gates this), and remaining em dashes live in JSDoc header comments, which are not shipped copy. The requirement's "both ID and EN, if retained" clause therefore resolves to **no English work**.

### Scope fence for the unowned audit findings

- **D-08:** Ownership fence. Phase 2 absorbs only findings that are orphaned or global (config-level, or owned by no later phase); everything owned by a later phase is deferred **with a named owner** — no ownerless backlog file.
- **D-09:** Fold the elevation-contract breach into the widened FIX-01: `tailwind.config.js:182` defines `lg` byte-identical to `overlay` (`0 8px 32px rgb(15 23 42 / 0.10)`) although `overlay` is reserved for modal dialogs. Add a shadow-uniqueness assertion to `designTokens.test.js`. The two dropdown call-sites (`RowMenu.jsx:86`, `AppSearch.jsx:179`) are re-pointed for free when those files are rebuilt by PAGE-05 / SHELL-04.
- **D-10:** New requirement **FIX-10 — app-level ErrorBoundary.** Zero matches for `ErrorBoundary` / `componentDidCatch` / `getDerivedStateFromError` exist in `src/`. This is outside FIX-08's letter ("every data view", already satisfied) but inside its spirit: on a clinical instrument, a render throw must not white-screen the console.
- **D-11:** Deferral ledger with owners (also recorded in `<deferred>`): radius-scale bypass → SHELL-01 / COMP-01 / PAGE-10; undeclared motion → COMP-01 / COMP-03 / PAGE-10; landing `window.addEventListener("scroll")` (`LandingPage.jsx:166`, `index.css:335-337`) → PAGE-10; decorative `bg-primary/10` → PAGE-04 / 06 / 08 / 09; `warm-accent-2` used as a text label (`LandingPage.jsx:638`) → PAGE-10; `animate-spin` splash (`App.jsx:101`) → PAGE-10 (already neutralised by the reduced-motion block at `index.css:234-243`).

### Landing surface

- **D-12:** Fix the two accessibility-critical landing touch targets in Phase 2, keeping FIX-03 unqualified and global: `LandingPage.jsx:244` drawer trigger `h-10 w-10` (40px) → `h-11 w-11`; `LandingPage.jsx:217` nav links (~36px) → `min-h-[44px]`. The trigger is `md:hidden`, so it only ever renders at phone widths where touch is certain, for the elderly audience named in the Design Read. Because PAGE-10 re-derives these lines anyway, the overwrite cost is ≈ 0.
- **D-13:** Defer the landing **type scale** (49 non-token size classes; section headings at 36 / 48px with no declared landing scale) and the landing **radius** values (`rounded-[26px]`, `rounded-2xl`/`rounded-xl` duplicates) to PAGE-10, with explicit carry-forward criteria added to PAGE-10 and GATE-03: "landing nav ≥44px touch targets: drawer trigger `h-11 w-11`, nav links `min-h-[44px]`; landing heading scale and radius re-derived against a declared landing scale." Without the carry-forward, D-12's deferral degrades into "defer everything", which would ship a 40px target in front of the audience the contract protects.

### the agent's Discretion

None — every gray area was decided by the user.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design authority
- `DESIGN.md` — measured tokens, two visual registers, radius/elevation scale, motion budget, accessibility contract, antislop constraints. Amend `:421` and `:383` per D-05.
- `web-dashboard/src/index.css` — token layer (`:root` + `.landing-scope`), measured contrast in comments; D-01 touches `:336`, D-02 touches the `warm-*` block at `:110-125`.
- `web-dashboard/tailwind.config.js` — `token()` helper, `fontSize`/`borderRadius`/`boxShadow` scales; D-01 and D-09 touch the `boxShadow` block at `:176-192`.
- `web-dashboard/src/designTokens.test.js` — the hard build gate; D-04 and D-09 change its assertions at `:74-77`.

### Audit evidence (the source of this phase's decisions)
- `.planning/phases/01-design-system-audit-token-lock/01-UI-REVIEW.md` — 6-pillar audit, 16/24, overall findings + the BLOCKER closed by D-01/D-02.
- `.planning/phases/01-design-system-audit-token-lock/token-inventory.md` — the inventory corrected by D-02.
- `.planning/phases/01-design-system-audit-token-lock/01-UI-SPEC.md` — approved design contract; `:273` language, `:157` accent use, `:198-208` radius, `:222` overlay rule.

### Phase research and requirements
- `.planning/phases/02-defect-fixes/02-RESEARCH.md` — defect-by-defect research; already files the shadow defect under FIX-01 (`:171,276`).
- `.planning/REQUIREMENTS.md` — FIX-01…FIX-09; D-03 amends `:21`, D-10 adds FIX-10, D-05 reconciles with LANG-01 `:77`.
- `.planning/ROADMAP.md` — Phase 2 goal + 9 success criteria; D-13 adds a carry-forward clause to PAGE-10 and GATE-03.
- `.planning/PROJECT.md` — milestone goal, constraints (light-only, Delivery Gate at 3 breakpoints, antislop filter), Key Decisions table.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `GlassButton.jsx:31-32` — the `min-h-[44px]` touch-target pattern (44px on touch, drops to 36/40 only at `lg`); the reference implementation for FIX-03 and D-12.
- `StatePanel.jsx` — the loading/empty/error primitive with `role="status"` / `role="alert"` and a centralised `StateRetry`; FIX-08 is already satisfied through it in all 8 data views, so FIX-08 work is verification + any gaps, not new construction.
- `StatusChip.jsx:22-31`, `Chip.jsx:20-22` — accent + `-ink` pair vocabulary; the reference for FIX-04 colour-never-alone.
- `token()` helper in `tailwind.config.js` — resolves CSS variables to Tailwind utilities; the one-way flow D-01 must preserve.
- `designTokens.test.js` — the existing build gate; D-04/D-09 extend it rather than adding a new gate.

### Established Patterns
- One-way token flow: CSS variables (`index.css`) → `token()` → components → pages. D-01 changes a config shadow literal, so it must resolve through a declared CSS variable to stay inside this flow.
- Light-only theme; no `.dark` block, no `dark:` utilities (carried from Phase 1/THEME-01).
- `aria-live="off"` on live pressure numbers; one polite region for risk-level changes only. Preserve in every FIX touch.
- Okabe-Ito series colours quarantined to the chart, single `SERIES` source in `TelemetryChart.jsx:26-28`. Not touched by Phase 2.
- Glass* component names are frozen (pages import by name).

### Integration Points
- `tailwind.config.js` `boxShadow` block feeds every app card and every landing panel — D-01/D-09 changes propagate to Phases 4 and 5 for free.
- `designTokens.test.js` runs on build; D-04 must land atomically with the config change.
- `InsoleContext.jsx:168-262` owns language state and persistence — D-06's migration connects here; the provider itself is otherwise untouched by design-system work.
- `App.jsx` is the render root — FIX-10's ErrorBoundary wraps here.

</code_context>

<specifics>
## Specific Ideas

No new references beyond the decisions above. The discussion was driven by the Phase 1 audit evidence, which is the canonical source for every decision taken.

</specifics>

<deferred>
## Deferred Ideas

Each item below is owned by a later phase and is carried forward as that phase's acceptance criteria, not as an ownerless backlog entry.

| Finding | Evidence | Owner |
|---|---|---|
| Radius-scale bypass — 7 arbitrary radii + 10 duplicate Tailwind default radii | `LanguageToggle.jsx:34`, `AppLayout.jsx:94`, `LandingPage.jsx:630,680`, `LandingPage.jsx:350,352,360,362,370,372,516,551,599,682` | SHELL-01 / COMP-01 / PAGE-10 |
| Undeclared motion (pulse, spin, `transition-all`, hover translate, `scale-[1.04]`) | `StatePanel.jsx:41`, `App.jsx:101`, `LandingPage.jsx:433,514,632`, `GlassButton.jsx:58` | COMP-01 / COMP-03 / PAGE-10 |
| Landing `window.addEventListener("scroll")` driving `.nav-scrolled` | `LandingPage.jsx:166`, `index.css:335-337` | PAGE-10 |
| Decorative `bg-primary/10` (5 elements) + solid `bg-primary` bar | `LoginPage.jsx:93,165,166`, `RegisterPage.jsx:82`, `ProfilePage.jsx:91`, `DevicePage.jsx:164` | PAGE-04 / 06 / 08 / 09 |
| `warm-accent-2` used as a text label (role, not legibility — passes AA) | `LandingPage.jsx:638` | PAGE-10 |
| Landing type scale — 49 non-token size classes, headings 36/48px, `text-[1.0625rem]` | `LandingPage.jsx`, `AppSidebar.jsx:67` | PAGE-10 (D-13 carry-forward) |
| Landing radius off-scale values | `LandingPage.jsx:630,680` + `rounded-2xl`/`rounded-xl` duplicates | PAGE-10 (D-13 carry-forward) |

None of these are dropped: Phase 6 GATE-04 is the safety net that proves nothing was lost.

</deferred>

---

*Phase: 2-Defect fixes*
*Context gathered: 2026-10-17*
