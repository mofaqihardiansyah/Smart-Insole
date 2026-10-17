# Roadmap: Smart Insole IoT Dashboard

## Milestones

- 🚧 **v1.0 Audit, Fix, Rebuild UI/UX Design** — in planning (Phases 1–6)

## Phases

- [ ] **Phase 1: Design-system audit & token lock** - Audit DESIGN.md tokens and lock them into index.css/tailwind.config.js; oil-ui evaluation sandbox runs in parallel scratch space
- [ ] **Phase 2: Defect fixes** - Fix contrast, focus rings, touch targets, colour-alone risk, dead controls, telemetry, loading/empty/error states, copy
- [ ] **Phase 3: Primitive rebuilds** - Rebuild Glass* primitives, StatusChip/Chip, Alert/Banner primitive, chart SERIES source; preserve realtime data contract
- [ ] **Phase 4: Shell rebuild** - Rebuild AppLayout, AppSidebar, AppTopbar, AppSearch; mobile drawer as real dialog
- [ ] **Phase 5: Page-by-page rebuild** - Rebuild all 10 pages + landing; two visual registers never mixed; Indonesian only
- [ ] **Phase 6: Delivery Gate & oil-ui go/no-go** - npm test/build, three-breakpoint click-through, accessibility; oil-ui adoption decision recorded

## Phase Details

### Phase 1: Design-system audit & token lock

**Goal**: Every colour/radius/shadow/type value in src/ is inventoried and locked 1:1 to DESIGN.md tokens; light-only theme confirmed; designTokens.test.js build gate green; oil-ui design directions generated in a scratch sandbox that cannot regress production.
**Depends on**: Nothing (first phase)
**Requirements**: TOKEN-01, TOKEN-02, TOKEN-03, TOKEN-04, THEME-01, OIL-01, OIL-02
**Success Criteria** (what must be TRUE):
  1. Every colour/radius/shadow/type value used in src/ is inventoried and mapped 1:1 to a DESIGN.md token
  2. Every hard-coded value not present in DESIGN.md is flagged
  3. Tokens are locked into src/index.css (:root + .landing-scope) and tailwind.config.js
  4. designTokens.test.js fails the build if any Tailwind class in src/ has no generated rule
  5. Light-only theme confirmed: no .dark block, no dark: variants, color-scheme: light only
  6. oil-ui skill installed outside the project (zero package.json impact); design directions generated in src/__oil_ui_eval__/ scratch sandbox (not shipped)

**Plans**: 5 plans

Plan list:
- [x] 01-01-PLAN.md — TOKEN-01 + TOKEN-02: token inventory mapping document (wave 1)
- [x] 01-02-PLAN.md — TOKEN-03: lock tokens into index.css + tailwind.config.js (wave 1)
- [x] 01-03-PLAN.md — TOKEN-04 + THEME-01: designTokens.test.js build gate + light-only theme (wave 1)
- [x] 01-04-PLAN.md — OIL-01 + OIL-02: oil-ui install + scratch directions (wave 2, depends 01-01)
- [ ] 01-05-PLAN.md — TOKEN-01 + TOKEN-02 gap closure: complete token inventory + flag nav-scrolled (wave 2, depends 01-01)

### Phase 2: Defect fixes

**Goal**: All audit-identified defects corrected so rebuilds start from a clean, spec-conformant baseline; fix precedes rebuild.
**Depends on**: Phase 1
**Requirements**: FIX-01, FIX-02, FIX-03, FIX-04, FIX-05, FIX-06, FIX-07, FIX-08, FIX-09
**Success Criteria** (what must be TRUE):
  1. All contrast failures meet DESIGN.md measured values (fg 18.1:1 AAA, muted 4.8:1 AA)
  2. Visible focus rings (3:1 or better) on every interactive element
  3. Every interactive touch target at least 44×44px
  4. Risk communicated by icon AND text label AND colour — never colour alone
  5. Dead controls removed; only Export CSV and Mark as read remain as standing actions
  6. Decorative pastel stat-card tints removed; icon tile takes the metric's semantic colour
  7. Fabricated telemetry replaced with real measured output or an explicit Simulation label
  8. Actionable loading, empty, and error states on every data view (named cause + next action)
  9. No em dashes in shipped copy; middot or pipe separators used

**Plans**: TBD

### Phase 3: Primitive rebuilds

**Goal**: Glass* primitives, StatusChip/Chip, and the new Alert/Banner primitive rebuilt to DESIGN.md spec; charts aligned to a single CVD-safe SERIES source; realtime Firebase data contract preserved.
**Depends on**: Phase 2
**Requirements**: COMP-01, COMP-02, COMP-03, COMP-04, COMP-05
**Success Criteria** (what must be TRUE):
  1. GlassCard, GlassButton, GlassInput, GlassTable, GlassForm rebuilt against DESIGN.md; Glass* naming retained (pages import by name)
  2. StatusChip and Chip rebuilt against DESIGN.md
  3. New Alert/Banner primitive built — unified loading/empty/error/danger banner with named cause + next action
  4. TrendChart, LoadDonut, PlantarHeatmap aligned to single Okabe-Ito SERIES source (CVD-safe, quarantined to charts)
  5. Realtime data contract preserved: aria-live="off" on live numbers, one polite region for risk changes, autoConnect={Boolean(user)} guard intact

**Plans**: TBD
**UI hint**: yes

### Phase 4: Shell rebuild

**Goal**: Shell (rail, top bar, search, drawer) rebuilt to consume the fixed primitives; navigation structure and keyboard operability defined.
**Depends on**: Phase 3
**Requirements**: SHELL-01, SHELL-02, SHELL-03, SHELL-04, SHELL-05, SHELL-06
**Success Criteria** (what must be TRUE):
  1. AppLayout rebuilt — 288px rail, 72px top bar, content column capped at 1400px with 32px gutters
  2. AppSidebar rebuilt — clinical register, six destinations; Notifications on bell only, not in rail
  3. AppTopbar and AppSearch rebuilt — combobox search (pages + records), bell with unread dot, account controls; arrow keys, Enter, Escape, outside-click work; every result navigates somewhere that exists
  4. Mobile drawer as real dialog — focus moves in, Escape closes, page behind cannot scroll, focus returns to trigger
  5. Skip-to-content link + ARIA labels; live pressure numbers aria-live="off"; one polite region for risk-level changes

**Plans**: TBD
**UI hint**: yes

### Phase 5: Page-by-page rebuild

**Goal**: All 10 pages plus Landing rebuilt as thin composers of fixed primitives and shell; two visual registers never mixed; Indonesian language only.
**Depends on**: Phase 4
**Requirements**: PAGE-01, PAGE-02, PAGE-03, PAGE-04, PAGE-05, PAGE-06, PAGE-07, PAGE-08, PAGE-09, PAGE-10, PAGE-11, PAGE-12, LANG-01
**Success Criteria** (what must be TRUE):
  1. Dashboard rebuilt — greeting row, 4 metric tiles, trend panel, load donut, live feed, pressure map (in that order)
  2. Monitoring, History, Device, Settings, Profile, Notifications, Login, and Register pages rebuilt
  3. Landing rebuilt — warm dialect under .landing-scope, real PlantarHeatmap component (no skeleton/placeholder)
  4. Responsive breakpoints <640 / 640–1023 / >=1024px on every page
  5. Two visual registers never mixed (clinical app vs warm landing); Indonesian language only; no language switch

**Plans**: TBD
**UI hint**: yes

### Phase 6: Delivery Gate & oil-ui go/no-go

**Goal**: Final verification before handoff; oil-ui go/no-go decision recorded with token-mapping table; components wrapped to emit DESIGN.md tokens if adopted.
**Depends on**: Phase 5
**Requirements**: GATE-01, GATE-02, GATE-03, GATE-04, OIL-03, OIL-04
**Success Criteria** (what must be TRUE):
  1. npm test — Vitest, zero errors
  2. npm run build — zero errors
  3. Click-through verified at 360px, 768px, and 1280px
  4. Accessibility verified — 44×44px targets, keyboard operability, colour-never-alone risk, prefers-reduced-motion respected
  5. oil-ui go/no-go decision recorded in PROJECT.md Key Decisions with token-mapping table; components wrapped to emit DESIGN.md tokens (not oil-ui defaults) if adopted

**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Design-system audit & token lock | 4/4 | In Progress | - |
| 2. Defect fixes | TBD | Not started | - |
| 3. Primitive rebuilds | TBD | Not started | - |
| 4. Shell rebuild | TBD | Not started | - |
| 5. Page-by-page rebuild | TBD | Not started | - |
| 6. Delivery Gate & oil-ui go/no-go | TBD | Not started | - |
