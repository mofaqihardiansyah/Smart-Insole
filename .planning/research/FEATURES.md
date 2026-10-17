# Feature Landscape

**Domain:** Clinical plantar-pressure dashboard UI/UX audit, fix, rebuild
**Project:** Smart Insole IoT Dashboard (web-dashboard)
**Researched:** Sat Oct 17 2026
**Overall confidence:** HIGH

## Context (from PROJECT.md + DESIGN.md)

- Stack: React 18 + Vite 5 + Tailwind CSS 3, Firebase Realtime Database
- Product: realtime clinical plantar-pressure console for elderly diabetic patients and caregivers
- Pages: Dashboard, Monitoring, History, Device, Settings, Profile, Login, Register, Notifications, Landing (+ Admin)
- DESIGN.md is authoritative; every token carries measured contrast values
- Two visual registers (clinical app + warm landing), never mixed
- Three dials: ENERGY 2 / RHYTHM 2 / MOTION 1 — calm instrument, consistent grid, minimal motion
- Theme: light-only, no dark mode toggle
- Accessibility contract: 44x44px touch targets, keyboard operability, risk never by colour alone, loading/empty/error states with actionable copy
- Delivery Gate: `npm test` (Vitest) + `npm run build` (zero errors) + click-through at 360px, 768px, 1280px
- Antislop filter applies to UI, copy, people, mobile layout, code comments
- oil-ui (https://github.com/oil-oil/oil-ui) raised as a candidate design system to evaluate

---

## Table Stakes

Features users expect. Missing = product feels incomplete or unsafe. These are non-negotiable for a clinical console serving an elderly audience.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Uniform token application across all 10 pages | DESIGN.md is authoritative; inconsistency breaks clinical trust | High | Every page imports Glass* components by name; tokens must map 1:1 to DESIGN.md values |
| Risk communicated by icon **and** text label **and** colour (never colour alone) | Elderly users may have colour-vision deficits; colour is a vital sign | Medium | risk tokens: safe #16A34A / warning #CA8A04 / danger #DC2626; ink variants for text-on-tint |
| 44x44px touch targets on every interactive element | Accessibility contract; elderly motor precision | Medium | 34–40px only from `lg` up where a pointer is clicking |
| Keyboard operability with visible focus ring (3:1 or better) | Accessibility contract; screen-reader users | Medium | focus-visible:ring-2 ring-primary pattern already established in AppTopbar/AppLayout |
| Loading, empty, and error states on every data view | Copy names cause + next action, never "No data" | Medium | Applies to heatmap, trend chart, live feed, device list |
| Light-only theme, no dark mode toggle | Owner decision; elderly benefit from dark ink on light; toggle would be a dead control | Low | `color-scheme: light` only; no `dark:` variants anywhere |
| Real measured data only — no fabricated telemetry | Antislop constraint; this is a thesis instrument | Low | Simulation label required if value not measured; no random numbers dressed as live |
| Responsive breakpoints <640 / 640–1023 / >=1024px | DESIGN.md layout spec; content-driven not device-driven | High | Mobile = one column + drawer; tablet = two-column tile grid; desktop = 288px rail + 72px top bar |
| Nav rail (desktop) + drawer (mobile); notifications on bell, not in rail | DESIGN.md navigation structure; avoids two controls for one destination | Medium | Mobile drawer is a real dialog: focus in, Escape closes, body can't scroll, focus returns |
| Skip-to-content link + ARIA labels + screen-reader-friendly | Accessibility contract; live numbers are `aria-live="off"`, only risk changes announced | Low | Skip link already present in AppShell |
| Two actions only: Export CSV + Mark as read | Antislop: no dead controls; Export PDF / New Session are decoration from a different product | Low | AlertModal already handles dismiss/mute; no "dead glyph" triggers |
| Consistent component naming (Glass* exports retained) | Design brief forbids renaming exports; pages import by name | Low | GlassCard, GlassButton, GlassInput, GlassTable, GlassForm retained as historical identifiers |

## Differentiators

Features that set the product apart. Not expected, but valued. These are the clinical-trust moat.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Measured contrast values baked into every token, build fails if missing | Testable design system; `design-tokens.test.js` fails build on any Tailwind class with no generated rule | Medium | Already partially implemented; audit must verify coverage across all components |
| oil-ui AI design skill evaluation (direction exploration, not component-library adoption) | Side-by-side design directions, screenshot refinement, comparison page | Medium | **Critical finding:** oil-ui is an AI agent skill (`npx skills add oil-oil/oil-ui`), NOT a drop-in React component library. Cannot be "adopted" as a design system in the traditional sense. Evaluate as a design-direction tool only. |
| Random Forest risk classifier with clinical contract assertions | Data-driven risk boundary; test fails if 40 kPa reads "safe" | Medium | Already implemented in `randomForestRisk.js` + `randomForestRisk.test.js`; rebuild must not break it |
| Pressure heatmap as unambiguous focal point with semantic colour | Colour means a foot needs attention; nothing decorative is saturated | High | Heatmap uses risk tokens; OKABE-ITO series colours quarantined to charts only |
| `tabular-nums` on all kPa figures so live updates don't twitch layout | Values update every second; layout stability is a clinical usability issue | Low | DM Sans body font with tabular-nums; Fira Code for vitals/code |
| Real heatmap component running on landing page (no skeleton/placeholder) | Antislop: no placeholder blocks as product screenshot | Low | Landing already shows real heatmap; must survive rebuild |
| No em dashes in shipped copy; middot/pipe separators | Antislop copy rule; clinical register reads cleaner | Low | Applies to both languages (i18n) |
| Combobox search that jumps to pages AND records (not a decorative field) | Two things worth jumping to: destinations + live-buffer records | Medium | AppSearch already exists; arrow keys, Enter, Escape, outside-click all work |

## Anti-Features

Features that seem good but are problematic for this product. Explicitly do not build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Dark mode toggle | Light-only by owner decision; toggle is a dead control on a light-only page | Keep `color-scheme: light`; no `dark:` variants |
| Decorative pastel stat-card tints (indigo/blue/grey/mint) | Four hues doing no work; colour must mean risk, not decoration | Icon tile takes the metric's own semantic colour (sage while good, amber/red when not) |
| Export PDF / New Session buttons | Dead controls from a reference product; antislop forbids dead controls | Export CSV + Mark as read only |
| Fabricated telemetry / random numbers as live data | Antislop constraint; thesis instrument shows real measured output only | Unavailable state or explicit Simulation label |
| Bottom nav bar on mobile | Six-item row can't hold readable label at 360px; icon-only is the failure mode for elderly users | Drawer with labelled items |
| Scroll reveals, parallax, entrance animations, continuous rAF | MOTION 1 forbids; numbers already update every second; decorative motion competes with data | Hover/focus/value-transition only, ≤150ms, respects `prefers-reduced-motion` |
| Bright risk colours (#22C55E, #EAB308, #EF4444) | Fail AA as text on light surfaces (~2.2–3.3:1) and under 3:1 graphical-object bar | Darkened risk tokens (#16A34A, #CA8A04, #DC2626) + ink variants everywhere risk appears |
| Fabricated testimonials, compliance claims, user counts, sample pricing | Thesis instrument; only real measured output shown | Real content only |
| oil-ui as drop-in component-library "adoption" | oil-ui is an AI design skill, not a React component library; no installable UI kit | Evaluate oil-ui as a design-direction/exploration tool only; do not migrate components to it |
| Skeleton/placeholder blocks as product screenshot | Antislop; landing must show real heatmap component | Real heatmap on landing |

## Feature Dependencies

```
DESIGN.md token audit → component inventory → defect fixes → component rebuilds → per-page rebuilds → Delivery Gate (test + build + click-through)
                                                     ↑
                                              accessibility verification (44px, keyboard, colour-alone)
                                                     ↑
                                              oil-ui evaluation (independent; decision gates adoption)
```

- **Token mapping precedes component rebuilds** — components reference tokens; rebuilds cannot match DESIGN.md until tokens are inventoried and mapped.
- **Audit precedes fix** — cannot fix what has not been audited against DESIGN.md.
- **Fix precedes rebuild** — rebuild target is the fixed, spec-conformant component, not the defective one.
- **Accessibility verification blocks rebuild sign-off** — 44x44px targets, keyboard operability, colour-alone rule must pass before a rebuilt component ships.
- **Delivery Gate blocks handoff** — `npm test` + `npm run build` + click-through at 360/768/1280px must pass for each rebuilt page/component before moving on.
- **oil-ui evaluation is independent** of the audit/fix/rebuild chain but must complete before any adoption decision is recorded in PROJECT.md Key Decisions.
- **Random Forest risk classifier must not regress** — rebuilds touching risk display must keep `randomForestRisk.test.js` passing.

## MVP Recommendation

Prioritize (ruthless minimum — ship to validate):

1. **Token audit across all pages** — inventory every colour/radius/shadow/type value used in `src/` and map to DESIGN.md tokens; flag every hard-coded value.
2. **Defect fixes from audit** — contrast failures, missing focus rings, touch targets under 44px, colour-only risk, dead controls, decorative tints.
3. **Component rebuilds to DESIGN.md spec** — GlassCard, GlassButton, GlassInput, GlassTable, GlassForm, PanelHeader, StatusChip, AppLayout/AppSidebar/AppTopbar/AppSearch, plus page-level layouts (Dashboard composition order, metric tiles, trend panel, load donut, live feed, pressure map).
4. **oil-ui evaluation** — install skill, generate design directions for the app register, compare side by side, record adopt / do-not-adopt decision in PROJECT.md.
5. **Delivery Gate pass** — `npm test` zero errors, `npm run build` zero errors, click-through at 360px, 768px, 1280px.

Defer:
- **oil-ui Pro adoption** ($9.99 one-time): not needed for MVP; open-source skill is sufficient for direction exploration.
- **Any new features** (additional pages, new charts, user preferences, theme switcher): out of scope for this milestone.
- **Dark mode**: explicitly out of scope (light-only).
- **Additional differentiators beyond measured tokens + real heatmap on landing**: nice-to-have, not minimum.

## Sources

- PROJECT.md — project context, milestone scope, constraints, key decisions
- DESIGN.md — design authority: two registers, three dials, palette with measured contrast, typography, layout/breakpoints, radius/elevation, motion budget, navigation structure, accessibility contract, anti-slop constraints, landing variant
- App.jsx, AppLayout.jsx, AppTopbar.jsx, AppSidebar.jsx — existing shell structure and navigation decisions
- GlassCard.jsx — existing component pattern and naming constraints
- package.json — React 18 + Vite 5 + Tailwind CSS 3 dependency baseline
- oil-ui GitHub repo (https://github.com/oil-oil/oil-ui) — oil-ui is an AI agent design skill, not a React component library; open source + Pro tiers
- "How to audit a design system before you rebuild" (clearly.design) — inventory tokens, components, trace through Figma/code
- "Migrating a React Codebase Incrementally" (medium.com/@ripaldarji16) — incremental migration without big-bang rewrite
- "Design system migrations" (maecapozzi.com newsletter #75) — build replacement, stop bleeding, automate replacement
- Healthcare UX best practices (fuselabcreative, kitrum) — accessibility, intuitive design for clinical/patient products
- Elderly diabetes monitoring UX research (PMC, Frontiers, Regenstrief) — large touch targets, high contrast, colour-vision considerations for older adults
- AGENTS.md (project) — antislop filter, DESIGN.md read-before-UI, Delivery Gate requirements
