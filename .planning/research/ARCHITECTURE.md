# Architecture Research

**Domain:** Clinical dashboard UI/UX design system integration (React 18 + Vite 5 + Tailwind CSS 3)
**Researched:** Sat Oct 17 2026
**Confidence:** MEDIUM

This research addresses how a design system integrates into the existing web-dashboard, with oil-ui evaluated as a candidate design-system input. Critical finding (verified against the official oil-ui GitHub README, MEDIUM confidence): **oil-ui is an AI interface design *skill* (`npx skills add oil-oil/oil-ui`), not an npm React component library.** It produces design directions, comparison pages, and screenshot refinements — there is no `import { Button } from "oil-ui"` and nothing to `npm install`. The production component layer therefore stays the in-house system defined by DESIGN.md + tailwind.config.js + index.css + the Glass* primitives.

## Standard Architecture

### System Overview

The existing stack already functions as a design system. Layers flow one way: tokens → Tailwind utilities → component primitives → page composition → shell/providers. oil-ui sits *outside* this flow as an external design-decision input; its outputs are captured in DESIGN.md before they ever reach a component.

```
┌─────────────────────────────────────────────────────────────────────┐
│                      DESIGN DECISION INPUT (external)               │
│  oil-ui skill (npx skills add oil-oil/oil-ui) — comparison pages,   │
│  screenshots, direction choices. Captured into DESIGN.md first.     │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓ (decisions recorded, not code)
┌─────────────────────────────────────────────────────────────────────┐
│                    TOKEN LAYER (authoritative: DESIGN.md)           │
│  src/index.css  :root CSS variables (--bg, --surface, --safe …)     │
│  tailwind.config.js theme.extend via token() helper                 │
│  Light-only: no .dark block, no color-scheme: dark                  │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓ (theme.extend maps vars → utils)
┌─────────────────────────────────────────────────────────────────────┐
│              TAILWIND UTILITY LAYER (Tailwind CSS 3)                │
│  bg-surface text-fg border-border-control rounded-card shadow-panel │
│  Utility classes are the only styling mechanism; no inline styles.  │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓ (components consume utilities)
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  GlassCard   │  │ GlassButton  │  │ GlassInput   │  │ StatusChip   │
│  GlassTable  │  │ GlassForm    │  │ Chip         │  │ PageHeader   │
│  (src/ui/*)  │  │  barrel:     │  │ TrendChart   │  │ LoadDonut    │
│              │  │ GlassComponents│  │ RowMenu    │  │ StatePanel   │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │                 │
└──────┴─────────────────┴─────────────────┴─────────────────┴────────┘
│                    PAGE COMPOSITION LAYER                           │
│  DashboardPage, MonitoringPage, HistoryPage, Device, Settings,      │
│  Profile, Notifications, Login, Register, Landing (src/pages/*)     │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓ (shell + providers)
┌─────────────────────────────────────────────────────────────────────┐
│                    SHELL & CONTEXT LAYER                            │
│  AppLayout / AppSidebar / AppTopbar / AppSearch                     │
│  UserContext, InsoleContext (auth + realtime telemetry)             │
│  react-router-dom routes                                            │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|---------------|------------------------|
| src/index.css | Source of truth for measured design tokens as CSS variables (:root + .landing-scope) | Hand-authored RGB variables with contrast comments |
| tailwind.config.js | Maps CSS variables → Tailwind utilities via `token()` helper; extends (never replaces) defaults | theme.extend.colors/fontFamily/fontSize/borderRadius/boxShadow |
| GlassComponents barrel | Single import point for UI primitives so a primitive can move without touching every page | Re-exports from src/components/ui/* |
| GlassCard / GlassButton / GlassInput / GlassTable / GlassForm | Surface primitives; one rule each (radius, edge, lift); `flush`/`elevated` escape hatches | Tailwind classes + `as` prop polymorphism |
| StatusChip / Chip | Semantic state tokens (safe/warning/danger/secondary) with ink-on-tint pairs | Tint bg + ink text; never arbitrary colour prop |
| TrendChart / LoadDonut / PlantarHeatmap | Data viz; series colours from single `SERIES` source (Okabe-Ito); CVD-safe | SVG/canvas, tabular-nums |
| AppLayout / AppSidebar / AppTopbar / AppSearch | Reference shell: 288px rail, 72px top bar, combobox search, bell (notifications state, not a route) | React Router + context consumers |
| UserContext / InsoleContext | Single auth listener and single telemetry provider, shared by shell and pages | Context providers above the auth gate |

## Recommended Project Structure

Keep the existing layout and add an explicit design-system boundary. Do not create a separate `design-system/` package — the tokens *are* the app's theme, so they live next to the app.

```
web-dashboard/
├── src/
│   ├── index.css                 # Token layer: :root + .landing-scope CSS variables (authoritative)
│   ├── tailwind.config.js        # Token → utility mapping (theme.extend only)
│   ├── main.jsx                  # React + Router entry
│   ├── App.jsx                   # Routes, shell, provider wiring
│   ├── designTokens.test.js      # Build gate: every Tailwind class in src/ has a generated rule
│   │
│   ├── components/
│   │   ├── ui/                   # Design-system primitives (Glass*, Chip, StatusChip, …)
│   │   │   ├── GlassComponents.jsx   # barrel import
│   │   │   ├── GlassCard.jsx
│   │   │   └── ...
│   │   ├── layout/               # Shell: AppLayout, AppSidebar, AppTopbar, AppSearch
│   │   ├── dashboard/            # Page-specific panels (LoadDonut, TrendChart, RowMenu…)
│   │   ├── monitoring/           # TelemetryChart, PlantarHeatmap
│   │   ├── notifications/, profile/, settings/, device/, history/, auth/
│   │   └── pages/                # Route page components (thin: compose primitives + context)
│   │
│   ├── context/                  # UserContext, InsoleContext (shared state)
│   ├── hooks/                    # useAuth, useRoute
│   ├── services/                 # Firebase realtime + config
│   ├── utils/                    # i18n, randomForestRisk, fuzzyRisk, exportCsv, audioAlert
│   │
│   └── __oil_ui_eval__/          # scratchpad for oil-ui comparison pages (NOT shipped)
│       └── comparisons/          # oil-ui output baselines, deleted after decision
│
├── postcss.config.js
├── vite.config.js
└── package.json                  # React 18, Tailwind 3, Vitest, no dark-mode deps
```

### Structure Rationale

- **src/index.css + tailwind.config.js:** The token layer stays co-located with the app. DESIGN.md is the normative source; these two files are its machine-readable rendering. `designTokens.test.js` already fails the build if any class lacks a generated rule — keep this gate.
- **components/ui/ barrel:** GlassComponents.jsx is the established pattern. New primitives (and any oil-ui-validated replacements) are added here, exported by name, never renamed (design brief forbids renaming Glass* exports).
- **__oil_ui_eval__/:** oil-ui produces comparison pages and screenshots. These are *evaluation artifacts*, not product code. Keep them in a clearly-named scratch directory, gitignored or removed after the adopt/don't-adopt decision, so they never leak into the build or bundle.
- **No separate design-system package:** Publishing an internal package adds versioning, changelog, and publish friction for a single-consumer dashboard. Co-location is lower complexity and matches the existing convention.

## Architectural Patterns

### Pattern 1: Token Layer → Tailwind → Component (existing, keep it)

**What:** Measured design tokens live as CSS variables in `:root` (src/index.css). tailwind.config.js exposes them via `theme.extend` using the `token()` helper (`rgb(var(--name) / <alpha-value>)`). Components consume only Tailwind utilities (`bg-surface`, `text-fg`, `rounded-card`, `shadow-panel`).

**When to use:** Always, for every colour, radius, shadow, and type scale value in this project. This is the existing, working pattern and DESIGN.md enforces it with measured contrast values.

**Trade-offs:**
- Pro: Single source of truth; changing `--danger` updates every risk surface at once; no dark-mode divergence to maintain (light-only by product decision).
- Con: Requires discipline — no hardcoded hex in JSX, no inline styles, no arbitrary `bg-[#hex]` values. The build test enforces this.

**Example:**
```jsx
// Good: token flows through config → utility
<GlassCard elevated className="border border-border">
  <StatusChip tone="safe">Aman</StatusChip>
</GlassCard>

// Bad: hardcoded hex breaks the token layer and contrast measurements
<div style={{ backgroundColor: "#DC2626" }}>...</div>
```

### Pattern 2: Wrapper / Adapter Component Layer (barrel + className escape hatch)

**What:** Primitives are small, variant-driven components (cva-style variant props where useful). Customisation happens in order: built-in variant → Tailwind `className` override → new variant → wrapper component as last resort. All primitives re-exported through `GlassComponents.jsx`.

**When to use:** When adding or replacing primitives during the UI/UX rebuild, or when wrapping an adopted third-party primitive so the app owns its surface API.

**Trade-offs:**
- Pro: Pages import from one barrel; a primitive can be reimplemented or swapped without touching pages; className escape hatch handles one-off layout needs without forking.
- Con: Wrapper layers add indirection; over-wrapping (a wrapper for every primitive) bloats the layer. Prefer variant + className first.

**Example:**
```jsx
// Preferred: built-in variant + className
<GlassButton variant="danger" className="w-full">Mark as read</GlassButton>

// Last resort: wrapper (only when variant + className cannot express it)
const AlertDismissButton = ({ children, ...props }) => (
  <GlassButton variant="outline" size="sm" {...props}>{children}</GlassButton>
);
```

### Pattern 3: Design Decision Capture (oil-ui → DESIGN.md → components)

**What:** oil-ui is not consumed as code. It produces comparison pages/screenshots and design-direction recommendations. A human records the accepted decisions in DESIGN.md (tokens, radius, motion, register), then those decisions are implemented in tailwind.config.js / index.css / components. DESIGN.md remains authoritative; oil-ui output is reference only.

**When to use:** During the oil-ui evaluation phase only. After the adopt/don't-adopt decision, this flow pauses unless re-evaluating.

**Trade-offs:**
- Pro: Keeps the production stack unchanged regardless of oil-ui outcome; DESIGN.md stays the single normative source; no risk of shipping un-reviewed AI-generated UI.
- Con: Adds a manual transcription step from oil-ui output to DESIGN.md/tokens; oil-ui's design opinions must be re-checked against the clinical accessibility contract (contrast, 44px targets, risk-not-by-colour-alone).

**Example flow:**
```
oil-ui comparison page  →  choose direction  →  record tokens in DESIGN.md
                                                        ↓
                                              update index.css :root vars
                                                        ↓
                                              update tailwind.config.js theme.extend
                                                        ↓
                                              rebuild primitives in components/ui/
```

## Data Flow

### Design Token Flow

```
DESIGN.md (measured values, author)
      ↓ (hand-transcribed)
src/index.css :root { --bg: 248 250 252; … }
      ↓
tailwind.config.js theme.extend { bg: token("bg"), … }
      ↓ (utility classes)
components/ui/*.jsx (GlassCard uses bg-surface rounded-card shadow-panel)
      ↓ (page composition)
src/pages/*.jsx
```

### oil-ui Evaluation Data Flow (no prod code)

```
oil-ui skill (external, npx skills add)
      ↓ produces
comparison pages + screenshots in src/__oil_ui_eval__/
      ↓ (human decision)
DESIGN.md updated with accepted tokens/rules
      ↓
token layer + primitives rebuilt (see Build Order)
      ↓ (eval artifacts removed)
src/__oil_ui_eval__/ deleted or gitignored
```

### State / Runtime Data Flow (unchanged by design-system work)

```
User action → Page handler → Context (UserContext/InsoleContext)
                                             ↓
                                    Firebase Realtime / services
                                             ↓
                                    Context re-renders dependent pages
```

No data-flow changes are required to integrate a design system. The design-system work is purely presentational: token layer, primitives, shell, pages. Context providers, Firebase services, risk inference (`randomForestRisk`), and routing remain untouched.

### Key Data Flows

1. **Theme application:** A token change in `:root` propagates through `tailwind.config.js` utilities to every component using that utility — no JavaScript theme provider needed (light-only, no `dark:` variants).
2. **Risk colour:** `danger`/`warning`/`safe` tokens + `*-ink` pairs are used by `StatusChip` and risk surfaces; colour is never the sole carrier of meaning (icon + text + colour always).
3. **Live values:** Pressure/kPa figures carry `tabular-data` (`tabular-nums`) so once-per-second updates do not cause layout twitch.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (single dashboard, ~10 pages, light-only) | No changes needed. Token layer + primitives scale fine at this size. |
| Multiple dashboards / white-label variants | Extract tokens to a shared `src/design-tokens/` module imported by index.css; keep Tailwind config as the consumer. Consider a published internal package only if >1 app consumes it. |
| Dark mode added later | Introduce a `.dark` block and a theme provider; this is a deliberate, product-owned decision — not a default. Would break the current "light-only" contract and requires re-measuring every contrast pair. |

### Scaling Priorities

1. **First bottleneck:** Token drift — designers tweak DESIGN.md but tailwind.config.js / index.css fall out of sync. `designTokens.test.js` is the mitigation; keep it enforced in CI.
2. **Second bottleneck:** Primitive proliferation — each new one-off component diverges from the Glass* vocabulary. Mitigate via the GlassComponents barrel and the variant → className → variant → wrapper preference order.

## Anti-Patterns

### Anti-Pattern 1: Treating oil-ui as an installable component library

**What people do:** `npm install oil-ui` and `import { Button } from "oil-ui"`, expecting consumable React components.

**Why it's wrong:** oil-ui is an AI design skill (`npx skills add oil-oil/oil-ui`), not an npm package. It generates design directions and comparison pages; there are no React components to import. Attempting this wastes the evaluation and confuses the build.

**Do this instead:** Run oil-ui as an external skill, capture chosen directions in DESIGN.md, implement them in the in-house token layer + Glass* primitives.

### Anti-Pattern 2: Scattering hardcoded hex / inline styles

**What people do:** `style={{ color: "#DC2626" }}` or `bg-[#dc2626]` to ship a colour quickly.

**Why it's wrong:** Bypasses the measured token layer. Contrast values in DESIGN.md no longer apply; `designTokens.test.js` cannot validate it; a future token change misses the hardcoded value.

**Do this instead:** Use only Tailwind utilities backed by `theme.extend` tokens; if a needed token is missing, add it to index.css + tailwind.config.js (measured), then use the utility.

### Anti-Pattern 3: Renaming Glass* exports

**What people do:** Rename `GlassCard` → `Card`, `GlassButton` → `Button` during the rebuild.

**Why it's wrong:** The design brief forbids renaming exports; every page imports them by name. Renaming requires touching every page and breaks the historical-identifier contract.

**Do this instead:** Retain `Glass*` names (they are historical identifiers, not surface descriptions); change only the styling implementation inside them.

### Anti-Pattern 4: Mixing the two visual registers

**What people do:** Apply landing warm-dialect tokens (warm-canvas, 24px cards, pill nav, scroll reveals) to app pages, or app clinical tokens to the landing.

**Why it's wrong:** DESIGN.md defines two registers that are never mixed inside one surface. Mixing destroys the clinical console's calm, legible register and the landing's warm dialect.

**Do this instead:** Keep app register (pale slate, 16px cards, rail + top bar) and landing register (warm grey, larger radii, pill nav) separated; `.landing-scope` scopes landing tokens and closes at the landing root.

### Anti-Pattern 5: Dead controls and decorative colour

**What people do:** Export PDF / New Session buttons that do nothing; metric tiles tinted by position (indigo/blue/grey/mint); colour used without an icon or text label.

**Why it's wrong:** Antislop constraints and the accessibility contract: no dead controls, colour is a vital sign (risk only), risk never by colour alone.

**Do this instead:** Only ship real actions (export CSV, mark alert as read); tint metric icon tiles by semantic state (sage/amber/red); always pair risk colour with icon + text label.

## Integration Points

### oil-ui (external, design input)

| Integration Point | Pattern | Notes |
|-------------------|---------|-------|
| Installation | `npx skills add oil-oil/oil-ui` (external agent skill) | Not npm; no package.json entry; Python 3 required; version check hits ui.oiloil.org ≤ once/10 min |
| Output capture | Comparison pages/screenshots → `src/__oil_ui_eval__/` (scratch, not shipped) | Review, choose a direction, record in DESIGN.md, then delete artifacts |
| Pro consideration | Oil UI Pro ($9.99 one-time) for existing-project redesign polish | Open source suffices for direction exploration; Pro adds stricter review and usability polish |
| Related skills | oil-motion (scroll-driven animation), oil-tone (copy rewriting) | Not needed for this clinical dashboard (MOTION 1 forbids decorative animation; copy is product-real, not machine-generated) |

### Internal boundaries (design system → app)

| Boundary | Communication | Notes |
|----------|---------------|-------|
| DESIGN.md → src/index.css | Hand transcription of measured tokens | DESIGN.md is authoritative; index.css is its rendering |
| src/index.css → tailwind.config.js | `token()` helper maps CSS var → Tailwind utility | Use `extend`, never replace defaults |
| tailwind.config.js → components/ui/* | Utility classes (`bg-surface`, `rounded-card`) | Components consume utilities only; no inline styles |
| components/ui/* (GlassComponents barrel) → src/pages/* | Named imports from barrel | Pages compose primitives; pages are thin |
| Context providers → pages | React context (UserContext, InsoleContext) | Unchanged by design-system work |

### New components (suggested, to be built/rebuilt)

| Component | New or Modified | Purpose | Notes |
|-----------|-----------------|---------|-------|
| GlassCard | Modified | Surface primitive; align radius/edge/lift to DESIGN.md (16px card, hairline edge, shadow-panel) | Keep name, `flush`/`elevated` props |
| GlassButton | Modified | Action primitive; primary/outline/danger variants; 44px touch target | Keep name |
| GlassInput / GlassSelect / GlassSwitch | Modified | Form controls; border-control outline, labels above, errors below | Keep names |
| StatusChip | Modified | Semantic state chip (safe/warning/danger/secondary) with ink-on-tint | Keep name |
| Chip | Modified | Filter/delta/state token; semantic tones only, no arbitrary colour | Keep name |
| TrendChart / LoadDonut / PlantarHeatmap | Modified | Data viz; single SERIES source; CVD-safe Okabe-Ito | Keep names |
| RowMenu | Modified | Per-row overflow menu; real trigger, keyboard operable | Keep name |
| AppLayout / AppSidebar / AppTopbar / AppSearch | Modified | Shell; 288px rail, 72px top bar, combobox search | Keep names; FloatingNavbar already removed |
| New: Alert/Banner primitive | New | Unified loading/empty/error/danger banner (one per data view) | Does not exist yet; accessibility contract requires named cause + next action |
| __oil_ui_eval__/comparisons | New (scratch) | oil-ui comparison baselines during evaluation | Deleted after decision |

## Build Order (Suggested)

Dependencies respected: tokens first, then primitives, then shell, then pages; oil-ui evaluation runs in parallel scratch space and does not block production.

1. **Token audit & lock (Phase 1).** Freeze DESIGN.md tokens into src/index.css `:root` and tailwind.config.js `theme.extend`. Verify `designTokens.test.js` passes and `npm run build` is clean. Light-only confirmed: no `.dark` block.
   - *Addresses:* token layer integrity; prevents drift before any component changes.

2. **oil-ui evaluation sandbox (Phase 1, parallel).** Install `npx skills add oil-oil/oil-ui`; generate design-direction comparison pages for the dashboard in `src/__oil_ui_eval__/`; choose a direction; record accepted decisions in DESIGN.md. Scratch only — nothing shipped.
   - *Addresses:* evaluate oil-ui as candidate design-system input; no prod risk.

3. **Primitive rebuild (Phase 2).** Rebuild GlassCard, GlassButton, GlassInput, GlassTable, GlassForm, StatusChip, Chip against DESIGN.md. Add the missing Alert/Banner primitive. Verify 44px touch targets, focus rings, ink-on-tint pairs.
   - *Addresses:* core UI/UX defects; all pages depend on these primitives.

4. **Shell rebuild (Phase 3).** Rebuild AppLayout, AppSidebar, AppTopbar, AppSearch (288px rail, 72px top bar, combobox search, bell unread dot). Keep route structure in App.jsx unchanged.
   - *Addresses:* navigation structure; shell is shared by every page.

5. **Page-by-page rebuild (Phase 4).** Rebuild Dashboard, Monitoring, History, Device, Settings, Profile, Notifications, Login, Register, Landing using primitives + shell. Landing keeps `.landing-scope` warm dialect; app pages keep clinical register. No register mixing.
   - *Addresses:* page-level UI/UX; two surfaces never mixed.

6. **Accessibility gate & Delivery Gate (Phase 5).** `npm test` (Vitest) zero errors, `npm run build` zero errors, click-through at 360px / 768px / 1280px, verify 44px targets, keyboard operability, risk never by colour alone, reduced-motion respected. Delete `src/__oil_ui_eval__/` artifacts.
   - *Addresses:* AGENTS.md delivery requirements; accessibility contract.

## Sources

- oil-ui official README (GitHub, oil-oil/oil-ui): AI interface design skill, `npx skills add`, not an npm component library — MEDIUM confidence (primary source)
- shadcn/ui theming docs: CSS variables → Tailwind utilities → components, semantic pairs, cn() helper, cva variants, wrapper as last resort — MEDIUM confidence (context7)
- Tailwind CSS docs (functions/directives): @theme, @theme inline, @apply, theme.extend pattern — MEDIUM confidence (context7)
- DESIGN.md (project, repo root): measured design tokens, two visual registers, accessibility contract, antislop constraints — HIGH confidence (authoritative project source)
- tailwind.config.js + src/index.css (project): existing token layer implementation — HIGH confidence (project source)

---
*Architecture research for: Smart Insole IoT Dashboard web-dashboard design-system integration*
*Researched: Sat Oct 17 2026*
