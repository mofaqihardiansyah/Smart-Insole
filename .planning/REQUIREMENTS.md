# Milestone v1.0 Requirements — Audit, Fix, Rebuild UI/UX Design

**Project:** Smart Insole IoT Dashboard (web-dashboard)
**Milestone:** v1.0 — Audit, Fix, Rebuild UI/UX Design
**Workstream:** web-dashboard
**Generated from:** research SUMMARY.md, FEATURES.md, DESIGN.md, PROJECT.md

---

## v1 Requirements

### TOKEN — Design-system token audit & lock

- [x] **TOKEN-01**: Inventory every colour/radius/shadow/type value used in `src/` and map 1:1 to DESIGN.md tokens
- [x] **TOKEN-02**: Flag every hard-coded value not present in DESIGN.md
- [x] **TOKEN-03**: Lock tokens into `src/index.css` (`:root` + `.landing-scope`) and `tailwind.config.js`
- [x] **TOKEN-04**: `design-tokens.test.js` fails the build if any Tailwind class in `src/` has no generated rule

### FIX — Defect fixes (fix precedes rebuild)

- [x] **FIX-01**: Fix all contrast failures to meet DESIGN.md measured values (fg 18.1:1 AAA, muted 4.8:1 AA, etc.); covers the shadow surface in `tailwind.config.js` + `index.css` — normalize the undeclared `#232427` to the declared `warm-dark` token and remove the `lg`/`overlay` duplication
- [x] **FIX-02**: Add missing visible focus rings (3:1 or better) on every interactive element
- [x] **FIX-03**: Bring every interactive touch target to at least 44×44px (34–40px only from `lg` up)
- [x] **FIX-04**: Replace colour-only risk with icon **and** text label **and** colour on every risk element
- [x] **FIX-05**: Remove dead controls; keep only Export CSV and Mark as read as the two standing actions
- [x] **FIX-06**: Remove decorative pastel stat-card tints; icon tile takes the metric's semantic colour (sage while good, amber/red when not)
- [x] **FIX-07**: Replace fabricated telemetry with real measured output or explicit Simulation label
- [x] **FIX-08**: Add actionable loading, empty, and error states to every data view (names cause + next action, never "No data")
- [x] **FIX-09**: Remove em dashes from all shipped copy; use middot or pipe separators (both ID and EN, if retained)
- [x] **FIX-10**: Add an app-level ErrorBoundary — a render throw in any view shows a named cause and a recovery action; the console never white-screens

### COMP — Component rebuilds to DESIGN.md spec

- [x] **COMP-01**: Rebuild GlassCard, GlassButton, GlassInput, GlassTable, GlassForm against DESIGN.md
- [ ] **COMP-02**: Rebuild StatusChip and Chip against DESIGN.md
- [ ] **COMP-03**: Build new Alert/Banner primitive — unified loading/empty/error/danger banner with named cause + next action
- [x] **COMP-04**: Align TrendChart, LoadDonut, PlantarHeatmap to single SERIES source (Okabe-Ito, CVD-safe, quarantined to charts)
- [ ] **COMP-05**: Retain Glass* component naming; never rename exports (pages import by name)

### SHELL — Shell rebuild

- [ ] **SHELL-01**: Rebuild AppLayout — 288px rail, 72px top bar, content column capped at 1400px with 32px gutters
- [ ] **SHELL-02**: Rebuild AppSidebar — clinical register, six destinations (Dashboard, Monitoring, History, Device, Settings, Profile); Notifications on bell only, not in rail
- [ ] **SHELL-03**: Rebuild AppTopbar — combobox search (pages + records), bell with unread dot, account controls
- [ ] **SHELL-04**: Rebuild AppSearch — arrow keys, Enter, Escape, outside-click all work; every result navigates somewhere that exists
- [ ] **SHELL-05**: Mobile drawer as real dialog — focus moves in, Escape closes, page behind cannot scroll, focus returns to trigger
- [ ] **SHELL-06**: Skip-to-content link + ARIA labels; live pressure numbers `aria-live="off"`, only risk-level changes via one polite region

### PAGE — Page-by-page rebuild

- [ ] **PAGE-01**: Rebuild Dashboard — greeting row, 4 metric tiles, trend panel, load donut, live feed, pressure map (in that order)
- [ ] **PAGE-02**: Rebuild Monitoring page
- [ ] **PAGE-03**: Rebuild History page
- [ ] **PAGE-04**: Rebuild Device page
- [ ] **PAGE-05**: Rebuild Settings page
- [ ] **PAGE-06**: Rebuild Profile page
- [ ] **PAGE-07**: Rebuild Notifications page
- [ ] **PAGE-08**: Rebuild Login page
- [ ] **PAGE-09**: Rebuild Register page
- [ ] **PAGE-10**: Rebuild Landing page — warm dialect under `.landing-scope`, real PlantarHeatmap component (no skeleton/placeholder); re-derive the landing heading scale and radius values against a declared landing scale (Phase 2 fixed the two a11y-critical touch targets; type scale + radius carry forward per 02-CONTEXT.md D-13)
- [ ] **PAGE-11**: Responsive breakpoints <640 / 640–1023 / >=1024px on every page
- [ ] **PAGE-12**: Two visual registers never mixed — clinical app (pale slate, 8px control scale) vs warm landing (warm grey, pill nav)

### OIL — oil-ui design-skill evaluation

- [x] **OIL-01**: Install oil-ui skill (`npx skills add oil-oil/oil-ui`) outside the project (zero `package.json` impact)
- [x] **OIL-02**: Generate design directions for the app register in scratch sandbox (`src/__oil_ui_eval__/`, not shipped)
- [ ] **OIL-03**: Compare directions side-by-side; record adopt / do-not-adopt decision in PROJECT.md Key Decisions
- [ ] **OIL-04**: If adopted, wrap components to emit DESIGN.md tokens (not oil-ui defaults); token-mapping table required

### GATE — Delivery Gate (per page/component before handoff)

- [ ] **GATE-01**: `npm test` — Vitest, zero errors
- [ ] **GATE-02**: `npm run build` — zero errors
- [ ] **GATE-03**: Click-through verified at 360px, 768px, 1280px — including the landing nav, where the drawer trigger stays `h-11 w-11` and nav links stay `min-h-[44px]`
- [ ] **GATE-04**: Accessibility verified — 44×44px targets, keyboard operability, colour-never-alone risk, `prefers-reduced-motion` respected

### LANG — Language (per user decision: Indonesian only, no language switch)

- [ ] **LANG-01**: Indonesian language only; remove English language switch / i18n toggle

### THEME — Theme (per user decision: default/light mode only, no dark mode)

- [x] **THEME-01**: Light-only theme; no dark mode toggle; no `dark:` variants anywhere; `color-scheme: light` only

---

## Future Requirements (deferred to v1.x / v2+)

- [ ] **OIL-05**: oil-ui Pro adoption ($9.99) — open-source skill sufficient for MVP
- [ ] **PAGE-13**: Additional pages beyond the 10 existing routes
- [ ] **THEME-02**: Dark mode — explicitly out of scope (light-only by owner decision)
- [ ] **NEW-01**: User preferences, theme switcher, additional charts — out of scope for this milestone

---

## Out of Scope (explicit exclusions with reasoning)

| Exclusion | Reason |
|-----------|--------|
| Dark mode toggle | Owner decision: light-only; toggle is a dead control on a light-only page (antislop) |
| Decorative pastel stat-card tints | Four hues doing no work; colour must mean risk, not decoration (antislop) |
| Export PDF / New Session buttons | Dead controls from a reference product; antislop forbids dead controls |
| Fabricated telemetry / random numbers as live data | Antislop; thesis instrument shows real measured output only |
| Bottom nav bar on mobile | Six-item row can't hold readable label at 360px; icon-only is the failure mode for elderly users |
| Scroll reveals, parallax, entrance animations, continuous rAF | MOTION 1 forbids; numbers already update every second |
| Bright risk colours (#22C55E, #EAB308, #EF4444) | Fail AA as text on light surfaces (~2.2–3.3:1) and under 3:1 graphical-object bar |
| Fabricated testimonials, compliance claims, user counts, sample pricing | Thesis instrument; only real measured output shown |
| oil-ui as drop-in component-library "adoption" | oil-ui is an AI design skill, not a React component library; evaluate as direction tool only |
| Skeleton/placeholder blocks as product screenshot | Antislop; landing must show real heatmap component |

---

## Traceability

| REQ-ID | Phase | Verified |
|--------|-------|----------|
| TOKEN-01 | Phase 1 | Pending |
| TOKEN-02 | Phase 1 | Pending |
| TOKEN-03 | Phase 1 | Pending |
| TOKEN-04 | Phase 1 | Pending |
| THEME-01 | Phase 1 | Pending |
| OIL-01 | Phase 1 | Pending |
| OIL-02 | Phase 1 | Pending |
| FIX-01 | Phase 2 | 02-01 |
| FIX-02 | Phase 2 | 02-02 |
| FIX-03 | Phase 2 | 02-02 |
| FIX-04 | Phase 2 | 02-03 |
| FIX-05 | Phase 2 | 02-04 |
| FIX-06 | Phase 2 | 02-03 |
| FIX-07 | Phase 2 | 02-04 |
| FIX-08 | Phase 2 | 02-03 |
| FIX-09 | Phase 2 | 02-04 |
| FIX-10 | Phase 2 | 02-06 |
| COMP-01 | Phase 3 | Pending |
| COMP-02 | Phase 3 | Pending |
| COMP-03 | Phase 3 | Pending |
| COMP-04 | Phase 3 | Pending |
| COMP-05 | Phase 3 | Pending |
| SHELL-01 | Phase 4 | Pending |
| SHELL-02 | Phase 4 | Pending |
| SHELL-03 | Phase 4 | Pending |
| SHELL-04 | Phase 4 | Pending |
| SHELL-05 | Phase 4 | Pending |
| SHELL-06 | Phase 4 | Pending |
| PAGE-01 | Phase 5 | Pending |
| PAGE-02 | Phase 5 | Pending |
| PAGE-03 | Phase 5 | Pending |
| PAGE-04 | Phase 5 | Pending |
| PAGE-05 | Phase 5 | Pending |
| PAGE-06 | Phase 5 | Pending |
| PAGE-07 | Phase 5 | Pending |
| PAGE-08 | Phase 5 | Pending |
| PAGE-09 | Phase 5 | Pending |
| PAGE-10 | Phase 5 | Pending |
| PAGE-11 | Phase 5 | Pending |
| PAGE-12 | Phase 5 | Pending |
| LANG-01 | Phase 5 | Pending |
| GATE-01 | Phase 6 | Pending |
| GATE-02 | Phase 6 | Pending |
| GATE-03 | Phase 6 | Pending |
| GATE-04 | Phase 6 | Pending |
| OIL-03 | Phase 6 | Pending |
| OIL-04 | Phase 6 | Pending |

---

*Requirements defined for milestone v1.0. Next: `/gsd-plan-phase [N]` to create execution plan.*
