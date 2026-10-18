# Roadmap: Smart Insole IoT Dashboard

## Milestones

- 🚧 **v1.0 Audit, Fix, Rebuild UI/UX Design** — in planning (Phases 1–6)

## Phases

- [x] **Phase 1: Design-system audit & token lock** - Audit DESIGN.md tokens and lock them into index.css/tailwind.config.js; oil-ui evaluation sandbox runs in parallel scratch space (completed 2026-10-17)
- [x] **Phase 2: Defect fixes** - Fix contrast, focus rings, touch targets, colour-alone risk, dead controls, telemetry, loading/empty/error states, copy (completed 2026-10-17)
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

**Plans**: 5/5 plans complete

Plan list:
- [x] 01-01-PLAN.md — TOKEN-01 + TOKEN-02: token inventory mapping document (wave 1)
- [x] 01-02-PLAN.md — TOKEN-03: lock tokens into index.css + tailwind.config.js (wave 1)
- [x] 01-03-PLAN.md — TOKEN-04 + THEME-01: designTokens.test.js build gate + light-only theme (wave 1)
- [x] 01-04-PLAN.md — OIL-01 + OIL-02: oil-ui install + scratch directions (wave 2, depends 01-01)
- [x] 01-05-PLAN.md — TOKEN-01 + TOKEN-02 gap closure: complete token inventory + flag nav-scrolled (wave 2, depends 01-01)

### Phase 2: Defect fixes

**Goal**: All audit-identified defects corrected so rebuilds start from a clean, spec-conformant baseline; fix precedes rebuild.
**Depends on**: Phase 1
**Requirements**: FIX-01, FIX-02, FIX-03, FIX-04, FIX-05, FIX-06, FIX-07, FIX-08, FIX-09, FIX-10
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
  10. A render throw in any view is caught by an app-level ErrorBoundary — named cause + recovery action, never a white screen

**Plans**: 6/6 plans complete — phase NOT complete. Verification returned `human_needed` (40/46 must-haves). 15 human-verification items are persisted in `02-UAT.md`; run `/gsd-verify-work 2` to walk them and complete the phase.

Plan list:
- [x] 02-01-PLAN.md — FIX-01: normalize the undeclared fifth neutral to the declared `warm-dark` token at all five sites, split the duplicate `lg`/`overlay` elevation, harden the token gate and correct the token inventory (wave 1)
- [x] 02-02-PLAN.md — FIX-02 + FIX-03: lock the landing's focus indicators and 44×44px touch targets as an automated contract (wave 2)
- [x] 02-03-PLAN.md — FIX-04 + FIX-06 + FIX-08: close the dashboard's two genuine empty/loading gaps; lock StatusChip's three redundant channels and BentoGrid's data-driven tone (wave 1)
- [x] 02-04-PLAN.md — FIX-05 + FIX-07 + FIX-09: shipped-JSX dash guard plus localised admin fallbacks; lock the two standing actions and the always-labelled data source (wave 3)
- [x] 02-05-PLAN.md — FIX-09 (D-05, D-06): force Indonesian on read and reconcile DESIGN.md's stale language clauses (wave 1)
- [x] 02-06-PLAN.md — FIX-10: app-level ErrorBoundary with a named cause and a working recovery action (wave 1)

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

**Plans:** 7/7 plans executed
**Outcome**: complete 2026-10-18. Full suite 34 files / 314 tests green; `npm run build` exit 0. See `.planning/phases/03-primitive-rebuilds/03-PHASE-SUMMARY.md`.

Plan list:
- [x] 03-01-PLAN.md — COMP-01: restore the landing button variants and land the `variant=`/`level=` dev-warning gate (wave 1)
- [x] 03-02-PLAN.md — COMP-04: single `src/utils/series.js` source for the CVD-safe series values, read by the chart and its only page consumer (wave 1)
- [x] 03-03-PLAN.md — COMP-03 + COMP-05: `AlertBanner` primitive with one shared `roleFor(state)` decision, `StatusBanner` reduced to a delegate (wave 1)
- [x] 03-04-PLAN.md — COMP-04 + COMP-01: donut and trend trace onto the series source; caller-supplied arc colours deleted (wave 2, depends 03-02)
- [x] 03-06-PLAN.md — COMP-02 + COMP-01 + COMP-05: chip rebuilds, the `tone=` gate half, raised-surface ink fix (wave 2, depends 03-01, 03-03)
- [x] 03-07-PLAN.md — COMP-03 + COMP-05: `StatePanel` reads the shared role decision; five admin feedback sites repaired; radius + live-region gates (wave 2, depends 03-03)
- [x] 03-05-PLAN.md — COMP-04 + COMP-05: series-quarantine gate and `DESIGN.md` single-source clause (wave 3, depends 03-04)

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

**Plans**: executed directly, without plan files (see the outcome line)
**Outcome**: complete 2026-10-18. The shell was already built; what was missing was proof, so
this phase is mostly a gate plus the four defects the gate found. Five commits. Full suite 35
files / 338 tests green; `npm run build` exit 0. See
`.planning/phases/04-shell-rebuild/04-PHASE-SUMMARY.md`.
**UI hint**: yes

### Phase 5: Page-by-page rebuild

**Goal**: All 10 pages plus Landing rebuilt as thin composers of fixed primitives and shell; two visual registers never mixed; Indonesian language only.
**Depends on**: Phase 4
**Requirements**: PAGE-01, PAGE-02, PAGE-03, PAGE-04, PAGE-05, PAGE-06, PAGE-07, PAGE-08, PAGE-09, PAGE-10, PAGE-11, PAGE-12, LANG-01
**Success Criteria** (what must be TRUE):
  1. Dashboard rebuilt — greeting row, 4 metric tiles, trend panel, load donut, live feed, pressure map (in that order)
  2. Monitoring, History, Device, Settings, Profile, Notifications, Login, and Register pages rebuilt
  3. Landing rebuilt — warm dialect under .landing-scope, real PlantarHeatmap component (no skeleton/placeholder); heading scale and radius re-derived against a declared landing scale, and the landing nav keeps ≥44px touch targets (drawer trigger `h-11 w-11`, nav links `min-h-[44px]`)
  4. Responsive breakpoints <640 / 640–1023 / >=1024px on every page
  5. Two visual registers never mixed (clinical app vs warm landing); Indonesian language only; no language switch

**Plans**: executed directly, without plan files (see the outcome line)
**Outcome**: complete 2026-10-18. Eight commits (five code, three ledger/bookkeeping). The ten app pages already
composed the fixed primitives, so the work was the sweep the ledger owned: all 14 empty/error
panels on 8 pages now name their next step; `StatusBanner` forwards `nextAction`; AdminPage
traded its blocking `alert()` dialogs and raw inputs for banner + `GlassInput`; the landing's
49 built-in size classes and 6 raw radii resolved onto the newly declared `landing-h2` and
`cell`/`section`/`section-lg` hooks (`DESIGN.md` records the mapping). New gate:
`pagesContract.test.js` (responsive vocabulary, register separation, two-tier feedback),
three probes proved failing first. Full suite 36 files / 342 tests green; build exit 0.
The three-viewport click-through is owner-run and ledgered as `unrun-verify`.
See `.planning/phases/05-page-rebuild/05-PHASE-SUMMARY.md`.
**UI hint**: yes

### Phase 6: Delivery Gate & oil-ui go/no-go

**Goal**: Final verification before handoff; oil-ui go/no-go decision recorded with token-mapping table; components wrapped to emit DESIGN.md tokens if adopted.
**Depends on**: Phase 5
**Requirements**: GATE-01, GATE-02, GATE-03, GATE-04, OIL-03, OIL-04
**Success Criteria** (what must be TRUE):
  1. npm test — Vitest, zero errors
  2. npm run build — zero errors
  3. Click-through verified at 360px, 768px, and 1280px — including the landing nav at ≥44px touch targets and the landing heading scale and radius carried forward from Phase 5 criterion 3
  4. Accessibility verified — 44×44px targets, keyboard operability, colour-never-alone risk, prefers-reduced-motion respected
  5. oil-ui go/no-go decision recorded in PROJECT.md Key Decisions with token-mapping table; components wrapped to emit DESIGN.md tokens (not oil-ui defaults) if adopted

**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Design-system audit & token lock | 5/5 | Complete    | 2026-10-17 |
| 2. Defect fixes | 6/6 | Complete    | 2026-10-17 |
| 3. Primitive rebuilds | 7/7 | In Progress | - |
| 4. Shell rebuild | TBD | Not started | - |
| 5. Page-by-page rebuild | TBD | Not started | - |
| 6. Delivery Gate & oil-ui go/no-go | TBD | Not started | - |

## Backlog

### Phase 999.1: Landing CTA variant collapse — 8 landing call sites render the app-register button (BACKLOG)

**Goal:** Restore the landing register's button variants. `LandingPage.jsx:227,235,279,286,391,400,730,739` pass `variant="warm"` / `variant="warmOutline"`, but `GlassButton.jsx:20-28`'s `VARIANTS` carries neither key, so `VARIANTS[variant] || VARIANTS.filled` renders the app-register navy `filled` button at every landing CTA. The hero's primary and secondary actions are visually identical, and `01-UI-SPEC.md:89` forbids mixing the two registers. Pre-existing: the keys were added by `c46fa83c` and deleted by `8d9dd996` (2026-10-13), both before the Phase 2 diff base `54ae72a7`. Surfaced by the Phase 02 UI audit (`02-UI-REVIEW.md`, top priority fix 1).
**Superseded:** by Phase 3 COMP-01 — see `.planning/phases/03-primitive-rebuilds/03-CONTEXT.md` D-01. Kept for the audit trail; do not promote as an independent phase.
**Fix shipped in:** `.planning/phases/03-primitive-rebuilds/03-01-PLAN.md` (Phase 3, wave 1) — restores the `warm` and `warmOutline` keys and lands `src/variantKeys.test.js`, so the collapse cannot recur silently.
**Source phase:** 02
**Surfaced at:** 2026-10-17 during /gsd-verify-work 02 completion
**Evidence:** `bg-warm-accent-deep` occurs 0 times in `dist/` and in no `variant` string; `VARIANTS` at `54ae72a7` already lacks both keys.
**Requirements:** TBD
**Plans:** 0 plans

Plans:
- [ ] TBD (promote with /gsd-review-backlog when ready)

### Phase 999.2: `AdminPage.jsx` ships five English error fallbacks against the Indonesian-only contract (BACKLOG)

**Goal:** Route the five literals — `"Failed to load users"` (`:81`), `"Device read failed"` (`:102`), `"Update failed"` (`:125`), `"Delete failed"` (`:135`), `"Save failed"` (`:149`), rendered at `:180` and `:264` — through `i18n.js` keys, and extend `copy.test.js` so a Latin-sentence literal on an admin failure branch fails the guard. `copy.test.js` currently scans only for dashes, so it cannot see language. Pre-existing at the Phase 2 diff base `54ae72a7`. Surfaced by the Phase 02 UI audit (`02-UI-REVIEW.md`, top priority fix 2). Related: CR-01 (`AdminPage.jsx:56-67`, hooks after the early return) is a separate open finding in `02-REVIEW-DISPOSITION.md` on the same file.
**Source phase:** 02
**Surfaced at:** 2026-10-17 during /gsd-verify-work 02 completion
**Requirements:** TBD
**Plans:** 0 plans

Plans:
- [ ] TBD (promote with /gsd-review-backlog when ready)

### Phase 999.3: Primitive token-value residuals — nine off-grid spacing rows + the `--danger-hover` no-op (BACKLOG)

**Goal:** Normalise the half-step spacing values carried unchanged through the Phase 3 primitive
rebuild, and resolve the one token whose two names hold the same value. `DESIGN.md` declares no
spacing scale, so COMP-01/COMP-02's "rebuilt against `DESIGN.md`" cannot settle these; and
`--danger-hover` (`index.css:58`) is byte-identical to `--danger` (`:57`), documented as such in
`01-design-system-audit-token-lock/token-inventory.md:60`, so `GlassButton`'s `hover:bg-danger-hover`
was a no-op and Phase 3 deleted the utility rather than inventing a darker hex. Phase 3 leaves both
findings open by design: normalising the spacing moves every primitive's measured height across the
app, which is a spacing decision with its own three-breakpoint click-through, not a side effect of a
primitive rebuild. The nine rows are complete for the phase's file set (see `03-UI-SPEC.md` §C-03),
so a retained violation is not mistaken for a settled value.

| Site | Off-grid value (px) | Residual |
|------|---------------------|----------|
| `Chip.jsx:36` | `gap-1.5` (6), `px-2.5` (10) | spacing |
| `GlassForm.jsx:16` | `space-y-1.5` (6) | spacing |
| `GlassInput.jsx:41` | `space-y-1.5` (6) | spacing |
| `GlassInput.jsx:58` | `px-3.5` (14), `py-2.5` (10) | spacing |
| `GlassTable.jsx:67` | `px-6 py-3.5` (14) | spacing |
| `PageHeader.jsx:22` | `mt-1.5` (6) | spacing |
| `StatePanel.jsx:75` | `mt-1.5` (6) | spacing |
| `StatusChip.jsx:35` | `gap-1.5` (6), `px-2.5` (10), `h-3.5 w-3.5` (14) | spacing |
| `StatusChip.jsx:37` | `px-3.5` (14), `py-1.5` (6) | spacing |
| `index.css:58` | `--danger-hover` identical to `--danger` | declare a distinct value or retire the alias |

**Source phase:** 03
**Surfaced at:** 2026-10-18 during `/gsd-plan-phase 03` (UI-SPEC §C-03 enumeration; `GlassButton` hover no-op)
**Evidence:** every listed class occurs at the named line; `--danger` and `--danger-hover` resolve to the same hex.
**Requirements:** TBD
**Plans:** 0 plans

Plans:
- [ ] TBD (promote with /gsd-review-backlog when ready)
