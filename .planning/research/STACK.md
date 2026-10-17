# Technology Stack

**Project:** Smart Insole IoT Dashboard — web-dashboard UI/UX rebuild (oil-ui evaluation)
**Researched:** Sat Oct 17 2026
**Domain:** Clinical plantar-pressure console for elderly diabetic patients + caregivers

## Recommended Stack

The existing stack is current and adequate. **oil-ui requires zero stack additions** — it is an AI agent design skill, not an installable component library (see the oil-ui evaluation below). Recommended changes are limited to minor version bumps and, optionally, a Tailwind v3-compatible component layer if the oil-ui evaluation surfaces a gap that custom Tailwind components cannot fill.

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | ^18.3.1 | UI framework, runtime | Latest 18.x (18.3.1). Stable, matches existing code; no React 19 migration needed for this milestone. |
| React DOM | ^18.3.1 | DOM renderer | Paired with React 18.3.1. |
| Vite | ^5.4.10 | Build tool / dev server | Latest 5.x is 5.4.21; installed 5.4.10 is one patch behind — bump to ^5.4.21 at rebuild start. Fast HMR suits iterative UI rebuild. |
| @vitejs/plugin-react | ^4.7.0 | React plugin for Vite | Matches Vite 5. |

### Styling (Design System Layer)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | ^3.4.14 → ^3.4.19 | Utility-first CSS, design token carrier | Latest 3.x is 3.4.19; installed 3.4.14. **Stay on Tailwind v3** (PostCSS-based, already configured). Do NOT migrate to Tailwind v4/@tailwindcss/vite for this milestone — no benefit, adds migration risk. DESIGN.md tokens live here as arbitrary-value utilities / config theme extension. |
| PostCSS | ^8.4.47 | Tailwind v3 processor | Required by existing Tailwind v3 setup. Keep. |
| autoprefixer | ^10.4.20 | Vendor prefixing | Required by existing Tailwind v3 setup. Keep. |

**Component layer decision:** Do not add a component library by default. Implement components directly in Tailwind v3 per DESIGN.md (measured tokens, measured contrast, 44×44 touch targets, light-only theme). If the oil-ui evaluation reveals recurring patterns (buttons, inputs, cards, dialogs) that justify a shared class layer, add **daisyUI v4.12.24** (the only daisyUI major compatible with Tailwind v3) as a `devDependency` — see Alternatives Considered. Otherwise, do not add it.

### Icons, Motion, Routing, Backend, Testing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| lucide-react | ^1.55.0 | Icon library | Already installed; consistent, tree-shakable SVG icons. Keep. |
| framer-motion | ^14.1.0 | Animation / motion | Already installed. DESIGN.md specifies MOTION 1 (a restrained motion budget) — use framer-motion sparingly, only where DESIGN.md calls for motion. |
| react-router-dom | ^7.18.4 | Client-side routing | Already installed; Dashboard/Monitoring/History/Device/Settings/Profile/Login/Register/Notifications routes. Keep. |
| firebase | ^10.14.1 | Backend / realtime | Already installed; telemetry and device data. Keep. |
| swiper | ^14.3.0 | Carousel / touch slider | Already installed; may be used for history/heatmap carousels. Keep. |
| Vitest | ^2.1.3 | Test runner | Already installed; `npm test` must pass zero errors. Keep. |
| @testing-library/react | ^16.3.3 | Component testing | Already installed. Keep. |
| @testing-library/jest-dom | ^6.9.1 | DOM assertions | Already installed. Keep. |
| @testing-library/user-event | ^14.5.2 | Interaction testing | Already installed. Keep. |
| jsdom | ^25.0.1 | Test DOM | Already installed. Keep. |

## oil-ui Evaluation — Candidate Design System

### What oil-ui is (and is not)

**oil-ui (oil-oil/oil-ui) is NOT a React component library, design-system npm package, or Tailwind plugin.** It is an interface-design **skill for AI agents** (Claude Code, Codex), installed via:

```bash
npx skills add oil-oil/oil-ui
```

Key facts from the official repository (README, https://github.com/oil-oil/oil-ui, https://ui.oiloil.org):

- It explores distinct design directions side by side, lets you choose one, then refines it against real screenshots.
- **"It does not require a fixed component library or template. The agent implements the interface within your project constraints."**
- It has no npm package, no React components, no Tailwind integration, no runtime bundle impact, no providers, no hooks, no context.
- Open source is free; Oil UI Pro ($9.99 one-time) adds stricter review, usability, and existing-project-refresh workflows — not new components.
- Companion skills: oil-motion (scroll/drag-controlled web animation), oil-tone (copy rewriting).

### What adopting oil-ui means for this stack

| Aspect | Impact |
|--------|--------|
| package.json dependencies | **None.** No `npm install` required for oil-ui itself. |
| React version compatibility | N/A — oil-ui emits no React components; it is a design method the agent follows. |
| Tailwind CSS compatibility | N/A — oil-ui does not generate Tailwind classes or a theme. The agent implements designs using the existing Tailwind v3 + DESIGN.md tokens. |
| Vite / build | Unaffected. |
| Runtime bundle | Unaffected (zero bytes added). |
| Design authority | DESIGN.md remains authoritative (measured contrast tokens, light-only, antislop). oil-ui informs *direction exploration*; DESIGN.md governs *token values and constraints*. |
| Workflow change | Agent uses oil-ui during the UI/UX rebuild to generate 2–3 distinct design directions, compare them on a built-in comparison page, then refine the chosen direction against real screenshots before implementing in React + Tailwind. |

### Recommendation on oil-ui

**Evaluate oil-ui as a process/tooling addition, not a dependency.** Adopting it requires no changes to `.planning/research/STACK.md` library recommendations, no package.json edits, and no version-compatibility concerns with React 18 / Vite 5 / Tailwind v3.

The oil-ui evaluation milestone task should:
1. Install the skill (`npx skills add oil-oil/oil-ui`) in the agent environment — not in the project.
2. Use it to generate design directions for the clinical console + warm landing registers defined in DESIGN.md.
3. Compare directions on the built-in comparison page; select one.
4. Implement the selected direction in the existing React 18 + Vite 5 + Tailwind v3 stack per DESIGN.md tokens and antislop constraints.
5. Verify via `npm test`, `npm run build`, and click-through at 360px / 768px / 1280px.

**Do not** add oil-ui to package.json, do not expect React components from it, and do not treat it as a replacement for DESIGN.md.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Design-system method | oil-ui (agent skill, no install) | daisyUI component library | daisyUI brings its own theme/tokens that may conflict with DESIGN.md's measured palette; only add if evaluation finds a justified gap. |
| Tailwind component layer (if needed) | daisyUI v4.12.24 (Tailwind v3) | daisyUI v5 (5.7.50) | daisyUI v5 requires Tailwind CSS v4 — incompatible with current PostCSS-based Tailwind v3 setup; migration not justified for this milestone. |
| Build styling | Tailwind v3 + PostCSS (current) | @tailwindcss/vite + Tailwind v4 | Tailwind v4 is a different config/runtime model; migrating adds risk with no UX benefit for a clinical console. |
| Component library | Custom Tailwind components per DESIGN.md | shadcn/ui (Radix-based) | shadcn/ui is React-primitive heavy, not Tailwind-native, and pulls many dependencies; overkill for this dashboard and conflicts with DESIGN.md token authority. |
| Heavy UI framework | None (keep Tailwind) | MUI / Chakra UI | Not Tailwind-native, large bundle, theming model diverges from DESIGN.md measured tokens. |
| Dark mode | None (light-only per constraint) | dark-mode toggle | PROJECT.md constraint: light-only, no dark mode toggle. |

## What NOT to Add

- **daisyUI v5** — requires Tailwind CSS v4; incompatible with existing Tailwind v3 / PostCSS setup.
- **@tailwindcss/vite + Tailwind CSS v4** — different build/config model; migration risk, no milestone benefit.
- **shadcn/ui** — Radix-based, not Tailwind-native, heavy dependency footprint, diverges from DESIGN.md.
- **MUI / Chakra UI / Ant Design** — not Tailwind-native, large bundles, theming conflicts with DESIGN.md measured palette.
- **dark-mode support** — violates PROJECT.md light-only constraint.
- **oil-ui as an npm dependency** — oil-ui is not an npm package; adding it to package.json is meaningless.

## Version Compatibility

| Pair | Compatible? | Notes |
|------|-------------|-------|
| React 18.3.1 + Vite 5.4.x | YES | @vitejs/plugin-react ^4.7.0 bridges them. |
| Tailwind CSS v3.4.x + PostCSS 8.4.x | YES | Existing working setup; keep. |
| Tailwind CSS v3 + daisyUI v4.12.24 | YES | Only compatible daisyUI major for Tailwind v3. |
| Tailwind CSS v3 + daisyUI v5 | NO | daisyUI v5 requires Tailwind v4. |
| Tailwind CSS v3 + @tailwindcss/vite | NO | @tailwindcss/vite is the Tailwind v4 plugin. |
| React 18 + React 19 libraries | PARTIAL | Avoid libraries that require React 19; pin to React 18-compatible releases. |
| oil-ui + any stack | YES (neutral) | oil-ui installs outside the project; no runtime or build integration. |

## Installation

**No `npm install` is required for oil-ui itself.** Install the skill in the agent environment:

```bash
npx skills add oil-oil/oil-ui
```

If (and only if) the evaluation justifies a Tailwind component layer later:

```bash
# Tailwind v3-compatible component layer — optional, deferred
npm install -D daisyui@^4.12.24
# then in CSS: @import "tailwindcss"; @plugin "daisyui";
```

Optional version bumps (low risk, do at rebuild start):

```bash
npm install -D tailwindcss@^3.4.19 vite@^5.4.21
```

## Sources

- oil-ui repository & README: https://github.com/oil-oil/oil-ui (confirmed: agent design skill, `npx skills add oil-oil/oil-ui`, no component library, no fixed template)
- Oil UI guide: https://ui.oiloil.org/en/guide/
- daisyUI React + Tailwind v3 install: https://daisyui.com/docs/install/react/ (daisyUI v4 with Tailwind CSS v3; `daisyui@4`)
- daisyUI v5 release notes (Tailwind v4 required): https://daisyui.com/docs/v5/
- Installed versions verified against package.json (React 18.3.1, Vite 5.4.10, Tailwind 3.4.14, PostCSS 8.4.47, lucide-react 1.55.0, framer-motion 14.1.0, react-router-dom 7.18.4, firebase 10.14.1, Vitest 2.1.3) and npm latest checks (React 18.3.1 latest, Tailwind 3.4.19 latest, Vite 5.4.21 latest, daisyUI v4.12.24 latest).
