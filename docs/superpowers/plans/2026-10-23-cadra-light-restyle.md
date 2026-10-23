# Cadra Light Restyle Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the signed-in app (shell + all app pages) to the Cadra light reference (`docs/reference-design/DefaultVersion_ExporttoFigma _ demo.codeandchill.store _ Dashboard · Cadra.svg`): warm `#EFEFEC` canvas, floating dark nav pill (no 288px rail), pastel-tinted stat cards with sparklines, one inverted dark metric card, a timeline of real event dots, and funnel-style load bars. Auth pages (Login, Register, Forgot, Verify) and the Landing page are NOT touched.

**Architecture:** Same React SPA. The shell's rail is replaced by a top header: brand card left, dark nav pill center (lg+), search + bell + avatar menu right; the existing mobile drawer survives below `lg`. All visual values flow through the token layer in `src/index.css` and `tailwind.config.js`.

**Tech Stack:** React 18, Vite, Tailwind CSS 3, Vitest, RTL.

**Spec:** `DESIGN.md` (rewritten toward Cadra light in Task 6) and the reference SVG named above. Content rules carry over unchanged: every number is measured or explicitly unavailable, risk is icon + label + colour, no fabricated telemetry.

## Global Constraints

- Light-only: no `dark:` utility anywhere, `color-scheme: light` preserved (`designTokens.test.js`, `a11y.test.jsx`).
- The added visual vocabulary is config-stage recorded, contrast-measured before it ships: canvas `#EFEFEC`, pastel tints carry `#0F172A` ink, the inverted card carries white ink on `#141414`.
- `a11y` floors survive every phase: 44px touch targets, `focus-visible:ring-2` pairs, no positive tabindex, every interactive element named.
- `liveRegion.test.js` allowlist is frozen: no new `aria-live` region is added by the redesign.
- `copy.test.js`: Indonesian copy only, no em/en dashes.
- `seriesQuarantine.test.js`: sparklines use the non-identity `--secondary` sage stroke, never `--series-N`; series colours stay inside chart components.
- No `animate-*` utilities (`shell.test.jsx`).
- App pages must not use `warm-*` tokens (`pagesContract.test.js`); the new tints are app-scope tokens declared in `:root`.

## Review Focus

- The rewritten `shell.test.jsx` must keep the accessibility contract of the old rail: six destinations reachable with `aria-current="page"`, sign-out reachable on desktop, drawer is a real modal below `lg`, nav precedes `main` in DOM order.
- The inverted card and pastel tints must not break risk semantics: role still `color + icon + label` on every risk display.
- Sparklines read the real ring buffer only; an empty buffer yields an empty state, not an invented line.
- At 360px the nav pill is absent (drawer takes over); at 768px the pill is not yet shown and nothing overflows; at 1280px the pill carries all destinations without wrapping.

---

### Task 1: Token layer — canvas, tints, inverted card, pill radius

**Files:**
- Modify: `web-dashboard/src/index.css` (`:root` token block)
- Modify: `web-dashboard/tailwind.config.js`

- [ ] **Step 1: Fold the pending uncommitted neutral-palette work into the Cadra values**: `--bg` → `239 239 236` (#EFEFEC), keep `--surface` white for cards, adjust `--border` to hold a hairline on the warm canvas, re-record measured contrast comments.
- [ ] **Step 2: Add tint tokens** (`--tint-cream`, `--tint-mint`, `--tint-blue` with `#0F172A` ink ≈ 15:1, measured) and inverted tokens (`--inverted-bg` `#141414`, `--inverted-fg` white, `--inverted-muted` for captions on dark).
- [ ] **Step 3: Declare Tailwind mappings** (`tint.*`, `inverted.*`, `borderRadius.pill` for the nav pill only) and designTokens.test "generates a rule" sweep passes with these names.
- [ ] **Step 4: Run the design-token suite**: `npm test -- designTokens` — Expected: pass (config exception under TDD; the gate suite is the proof the tokens resolve).

### Task 2: Shell — nav pill header replaces the rail

**Files:**
- Modify: `web-dashboard/src/components/layout/AppLayout.jsx`
- Create: `web-dashboard/src/components/layout/AppNavPill.jsx`
- Modify: `web-dashboard/src/components/layout/AppSidebar.jsx` (keep `AccountCard`, `renderIcon`, `initialsOf` exports; delete the rail nav + `SourceReadout`)
- Delete rail assembly + `railOpen` state from `AppLayout`
- Test: rewrite `web-dashboard/src/components/layout/shell.test.jsx` first

**Interfaces:**
- Produces: header contract — one `<header>` containing brand card, `<nav aria-label>` "navigasi utama" pill with the six admin-conditional links and `aria-current="page"`, `AppSearch` combobox, bell link to `/notifications` with unread dot, avatar `button` opening an account menu holding Profil + Keluar.
- Consumes: `renderIcon`, `links` (name, to, icon, accessibilityLabel), `useInsole` for language.

- [ ] **Step 1: RED — rewrite `shell.test.jsx`** to the new contract (pill nav present, six links, aria-current, bell, account menu with Keluar reachable, drawer modal below lg, nav before `#main-content`, no `w-72`/`lg:pl-72`/rail toggle, no `animate-`). Run: `npm test -- shell` — Expected: fail (old rail still present).
- [ ] **Step 2: RED — update `App.test.jsx`** sign-out path (open avatar menu, click Keluar) and `shell.test.jsx` search contract stays. Run: Expected: fail on old shell.
- [ ] **Step 3: GREEN — implement the header + pill + account menu**, delete the rail assembly, keep the mobile drawer and its focus-trap tests passing. Run: `npm test -- shell App` — Expected: pass.
- [ ] **Step 4: Full suite**: `npm test` — Expected: green (fixing fallout outside the shell files as part of this task).

### Task 3: Primitives — Sparkline + BentoGrid tints and inverted card

**Files:**
- Create: `web-dashboard/src/components/dashboard/Sparkline.jsx` + test
- Modify: `web-dashboard/src/components/dashboard/BentoGrid.jsx` + test
- Modify: `web-dashboard/src/components/ui/PageHeader.jsx` (Cadra header rhythm; API unchanged)

**Interfaces:**
- `Sparkline({ data: number[], stroke?: string, className?: string })`: plain SVG polyline, uses `var(--secondary)` by default, renders nothing when `data.length < 2`, `aria-hidden` (decorative; the value beside it is the accessible read).
- `BentoGrid` card vocabulary gains: `tint` (`cream | mint | blue`), `inverted` (bool), `spark` (ReactNode), `meter` (`{ value, max }`) — rendered within the same cell and tone etc.

- [ ] **Step 1: RED — `Sparkline.test.jsx`**: renders a polyline given data; empty/short data renders nothing; default stroke is `var(--secondary)`; quarantined series vars never appear. Run: Expected: fail (component missing).
- [ ] **Step 2: GREEN — implement Sparkline.** Run: pass.
- [ ] **Step 3: RED — `BentoGrid.test.jsx` additions**: tint card returns its tint class and not the others; inverted renders the dark card classes; spark/meter slots render. Run: fail.
- [ ] **Step 4: GREEN — extend BentoGrid.** Run: `npm test -- BentoGrid Sparkline` pass, then `npm test` full suite green.

### Task 4: Dashboard — hero timeline, meter band, funnel, feed bars

**Files:**
- Modify: `web-dashboard/src/pages/DashboardPage.jsx`
- Create: `web-dashboard/src/components/dashboard/HeroTimeline.jsx` + test
- Create: `web-dashboard/src/components/dashboard/FunnelBars.jsx` + test
- Modify: `web-dashboard/src/pages/DashboardPage.states.test.jsx` first (RED)
- Delete: `web-dashboard/src/components/dashboard/LoadDonut.jsx` + test (verify no other page imports it first; if the landing does, leave it and record a ruling)
- Modify: `web-dashboard/src/utils/i18n.js` (new Indonesian copy for timeline/funnel labels; no em dashes)

- [ ] **Step 1: RED — states/bento assertions retargeted** to the new tile classes (peak = inverted, duration = cream tint + meter, score = mint tint + spark, battery = blue tint + meter). Run: fail.
- [ ] **Step 2: RED — `HeroTimeline.test.jsx`**: dots from real history rows colored by risk; time marker present; empty buffer renders the line alone; no `aria-live`. Run: fail.
- [ ] **Step 3: RED — `FunnelBars.test.jsx`**: three zone bars with label, proportion bar, kPa value from `readings`; zero total renders empty state. Run: fail.
- [ ] **Step 4: GREEN — implement HeroTimeline, FunnelBars, DashboardPage recomposition** (hero card with greeting/actions/risk chip/timeline; meter band via new Bento vocabulary; funnel panel replaces donut; feed rows gain pressure-vs-threshold mini bars). Run: full `npm test` green.
- [ ] **Step 5: Delete AdaptedLayout.jsx scratch demo (already failing designTokens) and LoadDonut if unused.** Run: `npm test` green.

### Task 5: Remaining pages — pass through the new primitives

**Files:**
- Modify: `web-dashboard/src/pages/HistoryPage.jsx` (summary strip → tinted stat cards)
- Modify: `web-dashboard/src/pages/DevicePage.jsx` (battery meter to the new meter style)
- Modify: `web-dashboard/src/pages/MonitoringPage.jsx`, `SettingsPage.jsx`, `ProfilePage.jsx`, `NotificationsPage.jsx`, `AdminPage.jsx` (spacing/rhythm only where the primitives carry it; no API changes)
- Modify: `web-dashboard/src/components/ui/GlassCard.jsx` (softened edge/shadow per Cadra card look)

- [ ] **Step 1: Confirm no page changes beyond class vocabulary break contracts**: run `npm test -- pages StatePanel GlassTable Shell Chip StatusChip GlassButton` — Expected: green; adjust code where assertions pin legitimate behaviour, keeping the semantic inks.
- [ ] **Step 2: Full suite green** + manual contrast sanity of tint/ink pairs documented in DESIGN.md (Task 6).

### Task 6: DESIGN.md rewrite + final verification

**Files:**
- Rewrite: `DESIGN.md` (Cadra-light direction; antislop section revised: pastel tints, inverted card, sparkline, timeline, pill nav documented as the product's own language; data-fabrication, a11y, copy and live-region contracts unchanged)
- Modify: `web-dashboard/dist/` regenerated by the build

- [ ] **Step 1: Write DESIGN.md rewrite** matching what shipped (tokens with measured pairs, shell description, meter band, funnel, feed).
- [ ] **Step 2: `npm test`** — Expected: 100% green suite.
- [ ] **Step 3: `npm run build`** — Expected: zero errors.
- [ ] **Step 4: Click-through at 360px, 768px, 1280px** (dev server) verifying Review Focus items.

## Verification Commands

- `cd web-dashboard && npm test -- <file>` per step; `npm test` full at task end; `npm run build` at Task 6.

## Review Focus (for the final reviewer)

- Verify no `aria-live` region was added and the dashboard announces only risk changes.
- Verify the account menu keeps sign-out keyboard-reachable and Escape-closable.
- Verify the timeline and sparklines degrade honestly (empty buffer = empty states, not silent placeholder data).
- Verify app pages use no `warm-*` token and the landing suite was untouched.
