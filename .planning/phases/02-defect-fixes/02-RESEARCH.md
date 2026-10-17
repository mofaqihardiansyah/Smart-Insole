# Phase 02: Defect fixes - Research

**Researched:** 17 Oct 2026
**Domain:** Accessibility defect remediation in a React 18 + Vite 5 + Tailwind CSS 3 clinical dashboard
**Confidence:** HIGH

## Summary

Phase 02 corrects every defect flagged during the Phase 01 design-system audit so that Phase 03 rebuilds start from a clean, spec-conformant baseline. The nine fixes (FIX-01 through FIX-09) are all accessibility and copy defects inside the existing `web-dashboard/` codebase: contrast, focus rings, 44×44px touch targets, colour-never-alone risk, dead controls, decorative stat-card tints, fabricated telemetry, missing loading/empty/error states, and em dashes in shipped copy. No new packages are required — the work is CSS, component, and i18n copy edits against DESIGN.md's measured token values. The existing test suite (Vitest 2.1.3, 158 tests) already passes and `design-tokens.test.js` (TOKEN-04) guards against orphan Tailwind classes.

**Primary recommendation:** Audit each FIX against the code, apply the measured DESIGN.md tokens and the existing `GlassButton`/`StatusChip`/`StatePanel` patterns, then verify with `npm test`, `npm run build`, and click-through at 360/768/1280px before handoff.

## <phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FIX-01 | Fix all contrast failures to meet DESIGN.md measured values (fg 18.1:1 AAA, muted 4.8:1 AA, etc.) | WCAG 1.4.3 [CITED: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html]; token measurements in `src/index.css` [VERIFIED: src/index.css:25-126] |
| FIX-02 | Add missing visible focus rings (3:1 or better) on every interactive element | WCAG 2.4.13 Focus Appearance [CITED: https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html]; existing `GlassButton` pattern [VERIFIED: src/components/ui/GlassButton.jsx:59] |
| FIX-03 | Bring every interactive touch target to at least 44×44px (34–40px only from `lg` up) | WCAG 2.5.5 Target Size Enhanced [CITED: https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html]; existing `min-h-[44px]` pattern [VERIFIED: src/components/ui/GlassButton.jsx:31] |
| FIX-04 | Replace colour-only risk with icon **and** text label **and** colour on every risk element | WCAG 1.4.1 Use of Color [CITED: https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html]; existing `StatusChip` pattern [VERIFIED: src/components/ui/StatusChip.jsx:19-64] |
| FIX-05 | Remove dead controls; keep only Export CSV and Mark as read as the two standing actions | Antislop R-27 / DESIGN.md anti-slop constraints [VERIFIED: DESIGN.md:381-401] |
| FIX-06 | Remove decorative pastel stat-card tints; icon tile takes the metric's semantic colour | DESIGN.md identity motif [VERIFIED: DESIGN.md:40-56] |
| FIX-07 | Replace fabricated telemetry with real measured output or explicit Simulation label | DESIGN.md anti-slop constraints [VERIFIED: DESIGN.md:381-401]; existing `StatusBanner`/`source.simTitle` pattern [VERIFIED: src/pages/DashboardPage.jsx:282-288] |
| FIX-08 | Add actionable loading, empty, and error states to every data view (names cause + next action, never "No data") | DESIGN.md accessibility contract [VERIFIED: DESIGN.md:357-377]; existing `StatePanel` [VERIFIED: src/components/ui/StatePanel.jsx:19-96] |
| FIX-09 | Remove em dashes from all shipped copy; use middot or pipe separators (both ID and EN, if retained) | DESIGN.md anti-slop constraints [VERIFIED: DESIGN.md:383]; existing pipe usage in `DashboardPage.jsx` [VERIFIED: src/pages/DashboardPage.jsx:234] |

</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Visual styling (contrast, focus rings, touch targets) | Browser / Client | — | CSS/Tailwind classes resolve in the browser; no server involvement |
| Colour-never-alone risk (icon + text + colour) | Browser / Client | — | `StatusChip` renders redundant channels client-side |
| Loading/empty/error states | Browser / Client | API / Backend | `StatePanel` is client-side; data availability comes from Firebase |
| Telemetry source (real vs Simulation) | API / Backend | Browser / Client | Firebase connection state drives the source banner; client renders the label |
| Copy (em dashes, language) | Browser / Client | — | i18n dictionary shipped to the client |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.3.1 [VERIFIED: npm registry] | UI framework | Locked stack; `package.json` [VERIFIED: web-dashboard/package.json:22] |
| Vite | 5.4.10 [VERIFIED: package.json] | Build/dev server | Locked stack; `package.json` [VERIFIED: web-dashboard/package.json:39] |
| Tailwind CSS | 3.4.14 [VERIFIED: npm registry] | Utility-first CSS | Locked stack; token layer maps utilities to DESIGN.md CSS variables [VERIFIED: web-dashboard/tailwind.config.js:20] |
| Vitest | 2.1.3 [VERIFIED: npm registry] | Test runner | Locked stack; `package.json` [VERIFIED: web-dashboard/package.json:39] |
| @testing-library/react | 16.3.3 [VERIFIED: package.json] | Component testing | Already installed; used by existing tests |
| lucide-react | 1.55.0 [VERIFIED: npm registry] | Icon library | Already used by `StatusChip`, `GlassButton`, `StateRetry` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| firebase | 10.14.1 [VERIFIED: package.json] | Realtime DB + auth | Data source for real-vs-simulated telemetry (FIX-07) |
| react-router-dom | 7.18.4 [VERIFIED: package.json] | Client-side routing | Navigation between pages; not modified in this phase |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| New accessibility audit axe/pa11y | Manual measurement against DESIGN.md | DESIGN.md tokens are already measured; adding a tool adds config for zero new signal |
| New colour-contrast library | `rgb(var(--token))` CSS variables already measured | Tokens carry measured ratios in `src/index.css` comments [VERIFIED: src/index.css:110-126] |

**Installation:** No new packages. This phase edits existing files only.

**Version verification:** All packages above exist on the npm registry at the `package.json` versions [VERIFIED: npm view react@18.3.1, tailwindcss@3.4.14, vitest@2.1.3, lucide-react@1.55.0]. The working tree's `package.json` pins these exact versions [VERIFIED: web-dashboard/package.json:13-25]. No cross-ecosystem confusion applies (single npm ecosystem).

## Package Legitimacy Audit

> This phase installs no external packages. All fixes use the existing locked stack (React, Vite, Tailwind, Vitest, lucide-react, firebase, react-router-dom), all already present in `node_modules/` and `package.json`. The Package Legitimacy Gate is not triggered; no install steps are planned.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| — | — | — | — | — | — | No new packages in Phase 02 |

## Architecture Patterns

### System Architecture Diagram

```
User (keyboard/touch)
     │
     ▼
┌─────────────────┐
│  Browser tier   │  React 18 + Tailwind + Vitest (jsdom)
│  - Focus rings  │  - 44×44px touch targets
│  - Colour+icon  │  - Loading/empty/error panels
│  - i18n copy    └─────────────────┘
└─────────────────┘
     │ Firebase Realtime DB / Auth
     ▼
┌─────────────────┐
│  API/Backend    │  firebase@10.14.1 (data source for FIX-07 source banner)
│  - live vs      │    connection state drives "Simulation" label
│    simulated    │
│  - readings     │
└─────────────────┘
```

### Recommended Project Structure

No structural changes. Defect fixes are in-place edits within the existing layout:

```
web-dashboard/src/
├── index.css             # measured token layer (FIX-01 contrast source)
├── tailwind.config.js    # token → utility mapping (no new utilities needed)
├── components/ui/
│   ├── GlassButton.jsx   # focus ring + 44px pattern (FIX-02, FIX-03)
│   ├── StatusChip.jsx    # icon + text + colour (FIX-04)
│   ├── StatePanel.jsx    # loading/empty/error (FIX-08)
│   └── StateRetry.jsx    # shared retry affordance (FIX-08)
├── components/dashboard/
│   └── BentoGrid.jsx     # stat-card icon tiles (FIX-06 semantic colour)
├── pages/
│   ├── DashboardPage.jsx # standing actions, Simulation banner (FIX-05, FIX-07)
│   ├── AdminPage.jsx     # em dash fallback removal (FIX-09)
│   └── ...               # audit each page for FIX-02/FIX-03/FIX-09
├── utils/
│   └── i18n.js           # dictionary copy — remove em dashes (FIX-09)
└── designTokens.test.js  # TOKEN-04 gate (unchanged)
```

### Pattern 1: Focus ring + 44px touch target (GlassButton)

**What:** Every interactive control uses `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-<token> focus-visible:ring-offset-2` plus `min-h-[44px]` (dropping to 34–40px only from `lg`).

**When to use:** On every button, link, and input the user can tap or keyboard-focus.

**Example:**
```tsx
// Source: src/components/ui/GlassButton.jsx [VERIFIED: src/components/ui/GlassButton.jsx:57-60, 31-34]
<button
  type="button"
  className={[
    "inline-flex items-center justify-center gap-2 rounded-control font-semibold",
    "transition-colors duration-150 active:translate-y-[1px]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
    "disabled:opacity-45 disabled:pointer-events-none",
    "min-h-[44px] lg:min-h-[36px] px-3 text-body-sm",
  ].filter(Boolean).join(" ")}
>
```

### Pattern 2: Colour-never-alone risk (StatusChip)

**What:** Risk is always conveyed by three redundant channels: icon shape (circle/triangle/octagon), translated text label, and colour. The label uses the ink token on the 15% tint so it clears 4.5:1.

**When to use:** On every risk readout (status chips, legend swatches, heatmap nodes).

**Example:**
```tsx
// Source: src/components/ui/StatusChip.jsx [VERIFIED: src/components/ui/StatusChip.jsx:19-64]
<span className="status-chip inline-flex items-center rounded-full font-semibold uppercase bg-safe/15 text-safe-ink gap-2 px-3 py-1 text-chip">
  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
  <span>Aman</span>
</span>
```

### Pattern 3: Loading/empty/error state (StatePanel)

**What:** Every data view renders one of three states with a named cause and next action. Loading uses `role="status" aria-live="polite`; error uses `role="alert`; empty is ordinary content with a heading. A shared `StateRetry` button avoids reinventing retries.

**When to use:** On every data view (trend chart, history table, device status, etc.).

**Anti-Patterns to Avoid**
- **Contrast by eye:** Never pick a hex without measuring against DESIGN.md. The `.nav-scrolled` shadow `rgb(35 36 39 / 0.25)` (#232427) was flagged as non-token in Phase 1 and is carried as FIX-01 [VERIFIED: .planning/phases/01-design-system-audit-token-lock/token-inventory.md:68-70].
- **Dead controls:** Do not ship Export PDF, New Session, or any button that cannot act. Keep only Export CSV and Mark as read [VERIFIED: DESIGN.md:396-399].
- **Colour-only risk:** Never signal safe/warning/danger by colour alone; always pair with an icon shape and a text label [CITED: WCAG 1.4.1].
- **Bright risk colours:** `#22C55E`, `#EAB308`, `#EF4444` fail AA as text and under 3:1 as graphical objects; they are refused and not shipped [VERIFIED: DESIGN.md:146-150].
- **Em dashes in copy:** No em dashes in shipped copy in either language; use `·` middot or `|` pipe [VERIFIED: DESIGN.md:383-384].

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Contrast checking | Custom colour-contrast calculator | DESIGN.md measured tokens + `rgb(var(--token))` | Tokens carry measured ratios (fg 18.1:1, muted 4.8:1, safe 4.5:1, etc.) [VERIFIED: src/index.css:38-57] |
| Touch-target sizing | Ad-hoc `min-height` values | `GlassButton`/`GlassInput` `min-h-[44px]` pattern | Single source; drops to 34–40px only from `lg` [VERIFIED: src/components/ui/GlassButton.jsx:31-34, src/components/ui/GlassInput.jsx:58] |
| Focus rings | Custom `:focus` styles | `focus-visible:ring-2` pattern with `ring-offset` | WCAG 2.4.13: 2px perimeter, 3:1 change-of-contrast [CITED: https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html] |
| Retry affordance | Per-error retry buttons | `StateRetry` shared component | One retry pattern, keyboard-operable, 44px [VERIFIED: src/components/ui/StatePanel.jsx:85-94] |
| CSV export | Per-page CSV logic | `exportCsv.js` `downloadCsv` shared utility | Quoted cells, UTF-8 BOM, dated filename [VERIFIED: src/utils/exportCsv.js:12-35] |
| Loading/empty/error | Ad-hoc "No data" text | `StatePanel` with cause + next action | Centralised; announces via aria-live [VERIFIED: src/components/ui/StatePanel.jsx:19-96] |

**Key insight:** The component library already exists (`Glass*`, `StatePanel`, `StatusChip`, `StateRetry`, `exportCsv.js`). Phase 02 applies it consistently rather than inventing one-off fixes per page.

## Runtime State Inventory

Not applicable — this is a defect-fix (code/config) phase, not a rename, refactor, or migration. No stored data, live service config, OS-registered state, secrets, or build artifacts are affected.

## Common Pitfalls

### Pitfall 1: Unknown Tailwind classes silently produce no rule
**What goes wrong:** A deleted or mistyped utility class (e.g. a removed `warm.*` colour, `shadow-panel`, or radius step) renders with no style at all — invisible in review, caught only by users.
**Why it happens:** Tailwind ignores unknown classes rather than erroring; a previous pass deleted the `warm.*` group while `LandingPage.jsx` still referenced it.
**How to avoid:** Rely on `design-tokens.test.js` (TOKEN-04), which fails the build if any Tailwind class in `src/` has no generated rule [VERIFIED: src/designTokens.test.js:56-79]. Run `npm test` after every edit.
**Warning signs:** `design-tokens.test.js` failure; a card or colour that appears flat/missing.

### Pitfall 2: Bright risk colours dressed as semantic
**What goes wrong:** Using `#22C55E`/`#EAB308`/`#EF4444` for risk text or small graphical objects.
**Why it happens:** These are the "obvious" green/amber/red but they measure ~2.2–3.3:1 as text on light surfaces and under 3:1 as graphical objects.
**How to avoid:** Use the darkened ink/accent tokens (`--safe`/#16A34A, `--warning`/#CA8A04, `--danger`/#DC2626 on white; `--safe-ink`/`--warning-ink`/`--danger-ink` on tints) [VERIFIED: DESIGN.md:120-126, 146-150; src/index.css:55-88].
**Warning signs:** Any hex literal in component JSX (all colour must resolve through CSS variables [VERIFIED: .planning/phases/01-design-system-audit-token-lock/token-inventory.md:74]).

### Pitfall 3: Touch targets below 44px on mobile
**What goes wrong:** Buttons/links under 44×44px on touch screens fail WCAG 2.5.5 and are hard for elderly users to activate.
**Why it happens:** Desktop-first sizing carried to mobile without `min-h-[44px]` / `min-w-[44px]`.
**How to avoid:** Audit every interactive element; apply 44px minimum on touch, 34–40px only from `lg` [VERIFIED: DESIGN.md:360-361; src/components/ui/GlassButton.jsx:31-34].
**Warning signs:** Any interactive element without an explicit min-height/min-width on mobile.

### Pitfall 4: Em dashes in shipped copy
**What goes wrong:** An em dash (`—`) appears in user-facing strings in either language.
**Why it happens:** Copy carried from the reference product or JSDoc conventions leaking into strings.
**How to avoid:** Grep `src/` for `\u2014` in string values (not comments); replace with `·` middot or `|` pipe [VERIFIED: DESIGN.md:383-384; existing pipe usage at src/pages/DashboardPage.jsx:234]. AdminPage.jsx uses `—` as a fallback [VERIFIED: src/pages/AdminPage.jsx:201, 204].
**Warning signs:** `—` character in any `t(...)` value or rendered JSX text.

### Pitfall 5: Fabricated telemetry presented as live
**What goes wrong:** Random numbers or "sample" data shown without a Simulation label.
**How to avoid:** Every non-measured value must read as unavailable or carry an explicit `source.simulator`/`source.simTitle`/`source.simBody` label [VERIFIED: src/utils/i18n.js:116-123; src/pages/DashboardPage.jsx:282-288].
**Warning signs:** Numbers updating without a Firebase `isLive` source; no "Mode simulasi" banner.

## Code Examples

### Contrast-correct token usage (FIX-01)
```tsx
// Source: DESIGN.md measured tokens [VERIFIED: DESIGN.md:104-126; src/index.css:25-126]
// fg #0F172A = 18.1:1 AAA on white; muted #64748B = 4.8:1 AA on white
<span className="text-fg">Primary ink</span>
<span className="text-muted">Caption at 4.8:1 AA</span>
```

### Focus ring on every interactive element (FIX-02)
```tsx
// Source: src/components/ui/GlassButton.jsx [VERIFIED: src/components/ui/GlassButton.jsx:57-60]
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface
```

### 44px touch target (FIX-03)
```tsx
// Source: src/components/ui/GlassButton.jsx [VERIFIED: src/components/ui/GlassButton.jsx:31-32]
sm: "min-h-[44px] lg:min-h-[36px] px-3 text-body-sm",
md: "min-h-[44px] lg:min-h-[40px] px-4 text-body-sm",
```

### Colour + icon + text risk (FIX-04)
```tsx
// Source: src/components/ui/StatusChip.jsx [VERIFIED: src/components/ui/StatusChip.jsx:19-64]
<StatusChip level="warning" label={t("risk.warning", language)} size="sm" />
```

### Loading/empty/error with cause + next action (FIX-08)
```tsx
// Source: src/components/ui/StatePanel.jsx [VERIFIED: src/components/ui/StatePanel.jsx:19-96]
<StatePanel variant="error" title={t("history.errorTitle", language)} description={...} action={<StateRetry onRetry={...} label={t("common.retry", language)} />} />
```

### Semantic stat-card icon tile (FIX-06)
```tsx
// Icon tile takes the metric's semantic colour: sage while good, amber/red when not
// Source: DESIGN.md identity motif [VERIFIED: DESIGN.md:51-56]
<Chip tone={risk === "safe" ? "secondary" : "danger"}>...</Chip>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fuzzy logic risk inference | Random Forest (`randomForestRisk.js`) + rule-based danger override | Phase 0 (pre-existing) | Data-driven boundary, expert rules remain contract |
| Ad-hoc per-page defects | Centralised `Glass*`/`StatePanel`/`StatusChip`/`exportCsv.js` patterns | Phase 0 (pre-existing) | One source per concern; no hand-rolled fixes |
| Bright `#22C55E`/etc. risk colours | Darkened ink/accent tokens measuring 4.5:1+ | Phase 0 (refused in DESIGN.md) | AA pass on light surfaces |

**Deprecated/outdated:**
- `.nav-scrolled` shadow `rgb(35 36 39 / 0.25)` (#232427): not a DESIGN.md token; flagged FIX-01 [VERIFIED: .planning/phases/01-design-system-audit-token-lock/token-inventory.md:68-70]
- Em dash `—` fallback in AdminPage.jsx: replace with middot/pipe [VERIFIED: src/pages/AdminPage.jsx:201, 204]

## Assumptions Log

> All claims in this research were verified against files read this session or cited from official W3C WCAG documentation. No `[ASSUMED]` claims remain; no user confirmation is required before planning.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| — | None — all claims verified or cited | — | — |

## Open Questions (RESOLVED)

1. **Whether any interactive element beyond those already audited lacks a 44px target or focus ring.**
   - What we know: `GlassButton`, `GlassInput`, `StateRetry`, and the jump-to-map button all use the 44px + focus-visible pattern [VERIFIED: GlassButton.jsx, GlassInput.jsx, StatePanel.jsx, DashboardPage.jsx:744-751].
   - What's unclear: Whether every page (Login, Register, Settings, Device, Profile, Monitoring, History, Notifications, Landing) uses these shared components exclusively, or whether some have one-off inline buttons/links.
   - Recommendation: Grep `src/` for `<button`, `<a`, and `<input` not using the shared components during execution; add `min-h-[44px]` + `focus-visible:ring-2` where missing.
   - **RESOLVED — plan `02-02`, tasks 1 and 2, plus plan `02-06` task 1.** The two genuinely non-conformant sites are on the landing nav (`LandingPage.jsx:244` drawer trigger at 40px, `:217` nav links at ~36px); task 1 brings every landing anchor and the trigger to the floor with an explicit ring and asserts it in the rendered DOM. The open-ended part of the question — "does any *other* one-off element exist?" — is answered by task 2's source sweep over every `src/**/*.jsx`, which fails on any `outline-none` without a `ring-2` on the same line, so a future one-off is caught rather than audited by hand. The one new control this phase introduces (the `02-06` recovery button) is specified to reuse the `GlassButton` 44px + ring classes. No hand-audit remains open.

2. **Whether the em-dash sweep covers i18n EN values as well as ID.**
   - What we know: i18n dictionary uses `|` separators, no em dashes in values [VERIFIED: src/utils/i18n.js:18-933]. AdminPage.jsx `—` fallback is the only shipped em dash found [VERIFIED: src/pages/AdminPage.jsx:201, 204].
   - What's unclear: None remaining after the grep.
   - Recommendation: Confirm the grep for `\u2014` in string values (excluding JSDoc comments) returns zero during execution.
   - **RESOLVED — plan `02-04`, task 1.** The dictionary half is already gated (`i18n.test.js:80-90`, which reads both dictionaries and therefore the EN values too) and stays green; D-07 scopes FIX-09 to the two language-neutral fallbacks, so this phase ships no English work. The coverage gap was that the *dictionary-only* gate cannot see a raw separator typed straight into JSX, which is exactly how the two admin fallbacks escaped it: task 1 creates `src/copy.test.js`, which walks every shipped `.jsx` under `src/` with comments stripped and a non-vacuous walk count, and it excludes the git-tracked scratch page by directory. The execution-time grep is therefore a durable test, not a one-off check.

3. **Whether FIX-07 requires any change beyond the existing Simulation label.**
   - What we know: The simulator path already renders `StatusBanner` with `source.simTitle`/`source.simBody` and the landing footer note states simulator data [VERIFIED: src/pages/DashboardPage.jsx:282-288, src/pages/LandingPage.jsx].
   - What's unclear: Whether any page shows numeric readings without a source indicator.
   - Recommendation: Audit each data view for a source indicator during execution.
   - **RESOLVED — plan `02-04`, task 3, with plan `02-03` task 1 closing the view-level gaps.** The audit answer is that the source indicator is present on every data view, so FIX-07 needs a regression lock rather than a source change: task 3 asserts the Simulation banner renders on the simulator, is absent on a live-but-silent connection (so the two states cannot be conflated), and that its title and body resolve from the dictionary. The one related source gap the audit did surface is not the label but the *views* it labels — the dashboard's trend panel and activity feed answered "no readings" dishonestly — and that is FIX-08 work, closed by plan `02-03` task 1.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | `npm test`, `npm run build` | ✓ | v26.7.0 | — |
| npm | Package manager | ✓ | 12.0.2 | — |
| Vitest | Test execution | ✓ | 2.1.3 | — |
| `npm test` suite | Delivery Gate GATE-01 | ✓ | 158 tests, 0 failures | — |
| Browser (for click-through) | Delivery Gate GATE-03 (360/768/1280px) | ✓ (assumed) | — | Manual device testing |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** Click-through at 360/768/1280px requires a browser or responsive dev-tool; if no graphical browser is available, fall back to DevTools device emulation and document the limitation.

## Validation Architecture

> `workflow.nyquist_validation` is absent from `.planning/config.json` [VERIFIED: .planning/config.json:1-5], so validation is treated as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.3 [VERIFIED: web-dashboard/package.json:39] |
| Config file | `web-dashboard/vite.config.js` `test` block [VERIFIED: web-dashboard/vite.config.js:46-51] |
| Quick run command | `cd web-dashboard && npm test` (vitest run) |
| Full suite command | `cd web-dashboard && npm test` (same; vitest run executes all) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| FIX-01 | Contrast meets DESIGN.md values | Visual/manual + token gate | `npm test` (design-tokens.test.js) | ✅ `src/designTokens.test.js` |
| FIX-02 | Focus rings 3:1 on every interactive | Component test | `npm test` | ❌ Wave 0 gap — no dedicated focus-ring test |
| FIX-03 | Touch targets 44×44px | Component test | `npm test` | ❌ Wave 0 gap — no dedicated touch-target test |
| FIX-04 | Risk = icon + text + colour | Component test | `npm test` | ❌ Wave 0 gap — StatusChip has no test file |
| FIX-05 | Only Export CSV + Mark as read actions | Page test | `npm test` | ⚠️ `DashboardPage.test.jsx` exists; verify coverage |
| FIX-06 | Semantic stat-card colours | Component test | `npm test` | ❌ Wave 0 gap — BentoGrid has no test file |
| FIX-07 | Real telemetry or Simulation label | Source audit + component test | `npm test` | ⚠️ no dedicated source-banner test |
| FIX-08 | Loading/empty/error states | Component test | `npm test` | ❌ Wave 0 gap — StatePanel has no test file |
| FIX-09 | No em dashes in shipped copy | Lint/grep | `grep -P '\u2014' src/` | ❌ Wave 0 gap — no copy test |

### Sampling Rate
- **Per task commit:** `cd web-dashboard && npm test` (quick run, < 30s)
- **Per wave merge:** `cd web-dashboard && npm test && npm run build` (full suite)
- **Phase gate:** Full suite green + build zero errors + click-through at 360/768/1280px before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] No dedicated test for `StatusChip` (FIX-04 icon+text+colour)
- [ ] No dedicated test for `StatePanel` (FIX-08 loading/empty/error)
- [ ] No dedicated test for `BentoGrid` (FIX-06 semantic colours)
- [ ] No automated check for focus rings / 44px targets (FIX-02/FIX-03)
- [ ] No automated copy check for em dashes (FIX-09) — use grep as a pre-commit step

## Security Domain

> `security_enforcement` is absent from `.planning/config.json` [VERIFIED: .planning/config.json:1-5], so the security domain is required (absent = enabled).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Firebase Auth (pre-existing, out of phase scope) |
| V3 Session Management | no | Firebase session (pre-existing, out of phase scope) |
| V4 Access Control | no | Role-based UI (AdminPage) — out of phase scope |
| V5 Input Validation | yes | `GlassInput` with `aria-invalid`, error text below field [VERIFIED: src/components/ui/GlassInput.jsx:55-89] |
| V6 Cryptography | no | No crypto introduced in this phase |

### Known Threat Patterns for React + Tailwind stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Missing focus indicator (keyboard users locked out) | Repudiation / Accessibility | `focus-visible:ring-2` on every interactive [CITED: WCAG 2.4.13] |
| Colour-only risk (colour-blind users miss state) | Accessibility | Icon + text + colour via `StatusChip` [CITED: WCAG 1.4.1] |
| Contrast below AA (low-vision users cannot read) | Accessibility | DESIGN.md measured tokens [VERIFIED: src/index.css:38-57] |
| Touch target too small (motor-impaired users) | Accessibility | `min-h-[44px]` [CITED: WCAG 2.5.5] |
| "No data" without cause/action (confusion, mistrust) | Accessibility | `StatePanel` with named cause + next action [VERIFIED: src/components/ui/StatePanel.jsx:19-96] |

## Sources

### Primary (HIGH confidence)
- `src/index.css` — measured token layer with contrast ratios [VERIFIED: src/index.css:25-126, read this session]
- `web-dashboard/tailwind.config.js` — token → utility mapping [VERIFIED: web-dashboard/tailwind.config.js:1-205, read this session]
- `web-dashboard/package.json` — locked dependency versions [VERIFIED: web-dashboard/package.json:1-41, read this session]
- `DESIGN.md` — design authority: measured palette, contrast, accessibility contract, anti-slop [VERIFIED: DESIGN.md:1-467, read this session]
- `web-dashboard/src/components/ui/GlassButton.jsx` — focus ring + 44px pattern [VERIFIED: read this session]
- `web-dashboard/src/components/ui/StatusChip.jsx` — icon+text+colour risk [VERIFIED: read this session]
- `web-dashboard/src/components/ui/StatePanel.jsx` — loading/empty/error [VERIFIED: read this session]
- `web-dashboard/src/pages/DashboardPage.jsx` — standing actions, Simulation banner [VERIFIED: read this session]
- `.planning/phases/01-design-system-audit-token-lock/token-inventory.md` — flagged `.nav-scrolled` value, FIX-01 reference [VERIFIED: read this session]
- `.planning/REQUIREMENTS.md` — FIX-01 through FIX-09 requirement text [VERIFIED: read this session]
- `.planning/STATE.md` — phase 2 status, Phase 01 flag-only decision [VERIFIED: read this session]
- `.planning/config.json` — workflow config (no nyquist_validation key) [VERIFIED: read this session]
- W3C WCAG 2.2 SC 1.4.3 Contrast (Minimum): 4.5:1 text / 3:1 large text [CITED: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html]
- W3C WCAG 2.2 SC 2.5.5 Target Size (Enhanced): 44×44 CSS pixels [CITED: https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html]
- W3C WCAG 2.1 SC 1.4.1 Use of Color: color not the only means [CITED: https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html]
- W3C WCAG 2.2 SC 2.4.13 Focus Appearance: 2px perimeter, 3:1 change-of-contrast [CITED: https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html]

### Secondary (MEDIUM confidence)
- None — all critical claims verified or cited above.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — package versions verified against npm registry and `package.json` read this session
- Architecture: HIGH — component patterns read from source files this session; WCAG criteria cited from official W3C docs
- Pitfalls: HIGH — grounded in read source files and DESIGN.md; one item (one-off inline buttons on other pages) flagged as an open question

**Research date:** 17 Oct 2026
**Valid until:** 30 days (stable stack; DESIGN.md is the design authority)
