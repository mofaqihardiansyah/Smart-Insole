# Phase 01 — UI Review

**Audited:** 2026-10-17
**Baseline:** `01-UI-SPEC.md` (status: approved) + `DESIGN.md` (design authority) + `token-inventory.md`
**Screenshots:** NOT captured — no dev server on localhost:3000/5173/8080 (all returned `000`), Playwright not installed (`npx --no-install playwright` → "canceled due to missing packages"), and no Chrome/Chromium binary resolved (`command -v` for google-chrome / chromium / chrome → none). Code-only audit path used: Tailwind class audit, string audit, state-handling check.
**Interaction captures:** off (`workflow.ui_interaction_capture` = false; no Chrome binary resolved)

> All visual-pillar scores below are derived from source and generated-class analysis, not from rendered pixels. Every claim cites `file:line`. No finding was inferred from a screenshot, because none exists.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Em dash ships in admin copy (`AdminPage.jsx:201,204`), violating the punctuation rule Phase 1 itself locked; ID/EN switch still mounted in 4 places |
| 2. Visuals | 3/4 | Clear focal point and hierarchy; but off-scale radii bypass the radius hierarchy (7 arbitrary radii, 10 duplicate Tailwind default radii) |
| 3. Color | 3/4 | Palette is DESIGN.md-conformant and series colours are properly quarantined; but `#232427` appears in 4 more places than the inventory flagged |
| 4. Typography | 2/4 | The landing surface uses 49 non-token type sizes against 2 token sizes — the locked scale is bypassed on one of the two shipped registers |
| 5. Spacing | 2/4 | 42 half-step (2px-grid) spacing classes contradict "multiples of 4 only"; 2 touch targets fall below the 44px floor on phone |
| 6. Experience Design | 3/4 | All 8 data views have loading/error/empty with real ARIA semantics; undeclared motion (scroll listener, `animate-*`, hover translate) escapes the MOTION 1 budget |

**Overall: 16/24**

---

## Top 3 Priority Fixes

1. **The token inventory is not complete, and its closing claim is false** — `token-inventory.md:70` states "One hard-coded (non-DESIGN.md) value flagged ... All other inventory rows are matched to DESIGN.md tokens", but `rgb(35 36 39 / …)` (`#232427`, the same non-DESIGN.md colour) is used four more times in `web-dashboard/tailwind.config.js:188-191` (shadows `card`, `lift`, `nav`, `glow`) and `--inner-glow-a: 0.7` (`index.css:100`) has no row at all. The inventory also mis-sources rows 34-48 to "index.css (.landing-scope)" when the `warm-*` tokens are declared at `:root` (`index.css:110-125`); `.landing-scope` (`index.css:258-291`) does not re-declare them. User impact: Phase 2 FIX work (FIX-01) is scoped from this table and will fix one instance of a defect that ships five times. Fix: add the 4 config-shadow rows, the `--inner-glow-a` row, correct the `warm-*` source column, and widen FIX-01 to cover `tailwind.config.js`. **BLOCKER** (breaks the phase deliverable: TOKEN-01/02 as written require every such value to be inventoried and flagged).

2. **Put the landing type scale back on the locked scale, or declare it** — `LandingPage.jsx` uses 49 non-token size classes (`text-sm` 19, `text-lg` 8, `text-base` 8, `text-4xl` 8, `text-5xl` 7, `text-2xl` 3, `text-xs` 4, `text-3xl`/`text-xl`/`text-6xl` 1 each) against only 2 token sizes (`text-display` 1, `text-body-sm` 1). Sections headings land at 36px and 48px (`LandingPage.jsx:461,479,500,536,575`) with no declared token, exceeding the app's `h1` token (30px). Plus `text-[1.0625rem]` (17px) at `AppSidebar.jsx:67`. User impact: the "locked 1:1 to DESIGN.md tokens" guarantee does not hold on the public surface, so any future palette/scale change silently skips it — the exact class of failure `designTokens.test.js` was built to catch. Fix: map each landing heading onto `h1`/`h2`/`display` (or add explicit landing heading tokens to `DESIGN.md` + `tailwind.config.js`) and replace `text-[1.0625rem]`. **WARNING**.

3. **Fix the phone touch targets on the landing nav** — `LandingPage.jsx:244` renders the mobile drawer trigger at `h-10 w-10` (40px) and `LandingPage.jsx:217` renders nav links at `px-3.5 py-2` (≈36px tall, visible from `md`, i.e. on touch tablets). Contract: "every interactive element at least 44×44px on touch; only drops to 34–40px from `lg`. No exceptions for Phase 1." The elderly phone user is the stated audience. Fix: `h-11 w-11` on the trigger, `min-h-[44px]` on the nav links. **WARNING**.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

**WARNING — em dash in shipped copy.** `AdminPage.jsx:201` (`{user.displayName || "—"}`) and `AdminPage.jsx:204` (`{user.email || "—"}`). `01-UI-SPEC.md:278` declares "No em dashes in shipped copy (either language); middot `·` or pipe `|` separators", and `DESIGN.md:383` repeats it under anti-slop. Phase 1 locked this rule and ships two violations of it. Note also that `i18n.js` contains **zero** `·` (middot) usages, so the declared preferred separator is not yet established either.

**WARNING — the "Indonesian only" contract is not met in the shipped build.** `01-UI-SPEC.md:273` declares "Language: Indonesian only (Bahasa Indonesia); no language switch / i18n toggle", and the Component Inventory lists `LanguageToggle` as "LANG-01: Indonesian only — remove i18n toggle in Phase 5". The toggle is still mounted in four places (`AppSidebar.jsx:181`, `AppTopbar.jsx:27`, `AppLayout.jsx:200`, `LandingPage.jsx:225`) and a full English dictionary ships (`i18n.js:503-923`). This is a documented Phase 5 deferral rather than a Phase 1 regression, so it does not drive the score below 3 — but the shipped build does not meet the stated contract, and `designTokens.test.js` has no counterpart that would notice an English string leaking into the Indonesian surface.

**PASS — no generic labels.** Zero matches for `>Submit<`, `Click Here`, `OK`, `Cancel`, `Save` across `src/`. Every action string is product-specific and routed through `i18n.js`.

**PASS — empty states name a cause and a next action, per FIX-08.** `i18n.js:214-216`: `'history.empty': 'Belum ada insiden tercatat'` with `'history.emptyBody': 'Insiden muncul di sini saat tekanan melewati batas aman. Riwayat kosong berarti tidak ada peringatan tercatat, bukan data yang hilang.'` — this is the contract's requirement met verbatim ("never 'No data'"). Same shape for `monitoring.empty`/`monitoring.emptyBody` (`i18n.js:194-195`), `admin.users.empty` (`i18n.js:43`), `admin.devices.empty` (`i18n.js:58`), `source.noDeviceTitle` (`i18n.js:127`), `dashboard.noMatch` (`i18n.js:167`). Search offers `'search.empty': 'Tidak ada yang cocok dengan'` plus the query (`AppSearch.jsx:182`).

**PASS — error states give a problem and a path.** `'source.errorTitle': 'Koneksi Firebase gagal'` (`i18n.js:124`), `'history.errorTitle': 'Riwayat gagal dimuat'` (`i18n.js:213`), `'common.retry': 'Coba lagi'` (`i18n.js:467`) bound to the shared `StateRetry` (`StatePanel.jsx:85`).

**PASS — no fabricated telemetry.** `'source.simulator': 'Mode simulasi'` (`i18n.js:116`) and `i18n.js:330` states plainly that the data is simulated rather than sensor-measured. Anti-slop mandate satisfied.

### Pillar 2: Visuals (3/4)

**WARNING — the radius scale, declared as a hierarchy tool, is bypassed.** `01-UI-SPEC.md:198-208` and `DESIGN.md:254-262` define a five-step scale (4/8/12/16/full) plus a landing set (12/16/24/28/32/36/40). In practice:
- 7 arbitrary radii off every declared step: `LanguageToggle.jsx:34` `rounded-[6px]`, `AppLayout.jsx:94` `rounded-[10px]`, `LandingPage.jsx:630,680` `rounded-[26px]` (not in the 24/28/32/36 landing set).
- 10 usages of Tailwind defaults that duplicate named tokens: `rounded-2xl` (7) and `rounded-xl` (3) at `LandingPage.jsx:350,352,360,362,370,372,516,551,599,682` — `rounded-2xl` = 16px = `rounded-card`/`rounded-panel`, `rounded-xl` = 12px = `rounded-tile`. Two names, one value: the exact ambiguity `designTokens.test.js` was written to prevent for shadows ("one name can no longer mean two different shadows") is unguarded for radius.

**WARNING — the elevation contract's "overlay: modal dialogs only" rule is not held.** `01-UI-SPEC.md:222` reserves `overlay` for modals. `tailwind.config.js:182` defines `lg: "0 8px 32px rgb(15 23 42 / 0.10)"` — byte-identical to `overlay` at line 184 — and it is applied to two dropdown surfaces: `RowMenu.jsx:86` (row action menu) and `AppSearch.jsx:179` (search listbox). A menu and a modal read at identical elevation, which is what "one elevated token per surface" is meant to prevent.

**PASS — clear focal point and hierarchy.** `PageHeader.jsx:20` renders exactly one `text-h1` (30px/700) per page; `GlassCard.jsx:73` gives every panel a `text-card-title` (20px/700) heading; `BentoGrid.jsx:67` renders metric values at `text-stat` (30px/700) with `tabular-data`; trend panel takes `lg:col-span-2` beside the one-third donut (`DashboardPage.jsx:41,71`), then the full-width live feed (`:88`) and the full-width pressure map (`:244`). This matches the declared composition and the DESIGN.md funnel rationale (`DESIGN.md:228-238`), with the FAB at `DashboardPage.jsx:747` (hidden below `lg`, per `DESIGN.md:241-245`).

**PASS — icon-only controls are not orphaned.** `AppTopbar.jsx:40-44` (bell, with the unread count in an `sr-only` span), `AppLayout.jsx:107-114` (mobile bell), `RowMenu.jsx:71-79` (`aria-haspopup="menu"`, `aria-expanded`, `aria-label`), `LandingPage.jsx:254` (menu trigger, `aria-expanded` + `aria-controls` + `sr-only`). `StatusChip.jsx:61-62` renders shape + label + colour, never colour alone.

### Pillar 3: Color (3/4)

**BLOCKER-contributing (filed under Fix 1) — a non-DESIGN.md colour ships four times more than the inventory records.** `token-inventory.md:68` flags `index.css:336` `.nav-scrolled` `rgb(35 36 39 / 0.25)` (`#232427`) as FIX-01 and `token-inventory.md:70` asserts every other row is matched. The same literal is hard-coded in `tailwind.config.js:188` (`card`), `:189` (`lift`), `:190` (`nav`), `:191` (`glow`). `DESIGN.md:273-276` describes these as "warm 25%"/"warm 30%"/"warm 35%", and `DESIGN.md:436` defines `warm-dark` as `#171719` — not `#232427`. So the palette has a fifth undeclared chromatic-neutral value, unfiled, in the config that generates every landing shadow. `designTokens.test.js:74-77` *asserts* `card` matches `/35 36 39/`, i.e. the gate locks the off-DESIGN.md value in as correct.

**WARNING — the accent is used decoratively, outside its sanctioned list.** `01-UI-SPEC.md:157` lists accent uses as "solid primary button fill (`#0F172A`), text links, focus-ring indicator, active navigation highlight. Never decorative." `bg-primary/10` appears as a decorative icon-tile/avatar tint on 5 elements (`LoginPage.jsx:93`, `RegisterPage.jsx:82`, `ProfilePage.jsx:91`, plus the two `hover:bg-primary/10` link states at `LoginPage.jsx:166`/`RegisterPage.jsx:165`), and `DevicePage.jsx:164` fills a progress bar with solid `bg-primary`. This is near-neutral navy, so the 60/30/10 split is not materially harmed — but the contract's "never decorative" clause is not enforced anywhere.

**WARNING (low) — `warm-accent-2` is used as a text label.** `DESIGN.md:435` declares `warm-accent-2` `#F05A3C` as "dark-panel icons (decorative)". `LandingPage.jsx:638` uses it as the text colour for the numeric section label ("01", "02", …). It measures ~5.3:1 on `warm-dark` so it passes AA — the deviation is role, not legibility.

**PASS — the palette rule holds where it matters.** Zero hardcoded hex or `rgb()` literals in component JSX (`grep` over `src/**/*.jsx`: every match is `rgb(var(--…))`). Zero raw Tailwind palette usage (`bg-slate-*`, `text-gray-*`, `bg-blue-*`, … all return nothing) — no rainbow chrome, so "colour is a vital sign" survives. Risk semantics always ship as accent + `-ink` pairs (`StatusChip.jsx:22-31`, `Chip.jsx:20-22`, `BentoGrid.jsx:37`, `StatePanel.jsx:54-56`). Okabe-Ito series colours are correctly quarantined to the chart: the only three references in the codebase are `TelemetryChart.jsx:26-28`, the declared single source.

**PASS — the 60/30/10 split is real.** Dominant `--bg` `#F8FAFC` on canvas, secondary white/`surface-2`/`surface-3` on every card, rail and top bar, and a near-monochrome navy accent. Saturation appears only in risk states and the landing's warm accent, as intended.

### Pillar 4: Typography (2/4)

**WARNING (score driver) — the locked type scale is bypassed on the whole landing surface.** `01-UI-SPEC.md:117-138` declares the scale "locked 1:1 into `tailwind.config.js` fontSize" and lists 16 tokens. Actual usage in `src/pages/LandingPage.jsx`: **49** non-token default-size classes against **2** token classes (`text-display` at `:340`, `text-body-sm` at one site). Distribution: `text-sm` 19, `text-lg` 8, `text-base` 8, `text-4xl` 8, `text-5xl` 7, `text-xs` 4, `text-2xl` 3, `text-3xl`/`text-xl`/`text-6xl` 1 each. Section headings therefore land at 36px (`:461,500,536,575`) and 48px (`:479`) with no token behind them, while the app's largest declared heading token is `h1` 30px. `DESIGN.md:195-214` gives no landing type scale — only the radius and motion budgets extend for the landing — so these sizes are outside the authority document entirely.

**WARNING — one undeclared arbitrary size in the app register.** `AppSidebar.jsx:67` `text-[1.0625rem]` (17px) for the brand line. Not in the scale, and it bypasses `h4` (16px/500) which is the declared token for exactly this job (`DESIGN.md:202`).

**WARNING — a declared font family is dead config.** `tailwind.config.js:108` declares `data: ["Fira Code", …]` and `DESIGN.md:189` states "Vitals, code | Fira Code | Monospace for tabular numeral alignment in kPa readouts". `font-data` has **zero** usages anywhere in `src/` — every kPa readout renders in DM Sans. The fixed-width requirement itself is met (26 `tabular-data`/`tabular-nums` sites, including `PlantarHeatmap.jsx:96` and the `kPa` glyph at `:231`), so this is a declared-but-unimplemented token rather than a legibility defect.

**PASS — weight discipline.** Only four weight utilities in use: `font-semibold` 37, `font-medium` 35, `font-bold` 10, `font-normal` 1 — exactly the declared 400/500/600/700 set, with no `extrabold`/`black` leakage.

**PASS — the app register itself is disciplined.** Token sizes carry 137 of the ~198 size usages outside the landing: `body-sm` 69, `body-base` 19, `label` 12, `caption` 8, `h4` 7, `chip` 5, `data` 4, `h3` 3, `body` 3, `stat` 2, `micro` 2, `h1`/`card-title`/`display` 1 each.

**Why 2 and not 1:** the clinical console (the product's primary surface) is scale-conformant, and the landing's own hierarchy is internally coherent. The gap is that the *lock* — this phase's entire deliverable — does not extend to the second shipped register.

### Pillar 5: Spacing (2/4)

**WARNING (score driver) — 42 half-step spacing classes contradict "multiples of 4 only".** `01-UI-SPEC.md:95` declares the spacing scale as "multiples of 4 only; Tailwind 8-point scale" with "Exceptions: none". Actual: `px-3.5` (14px) 5, `mt-0.5` (2px) 5, `py-2.5` (10px) 4, `mt-1.5` (6px) 4, `gap-2.5` (10px) 4, `py-3.5` (14px) 3, `mb-1.5` 3, `gap-1.5` 3, `space-y-1.5` 2, `py-1.5` 2, `px-2.5` 2, `space-y-2.5`/`pr-2.5`/`p-0.5`/`mx-1.5`/`ml-1.5` 1 each. Every one is a 2px-grid value sitting off the declared 4px grid. Individually harmless; collectively it means the "locked" scale is descriptive of intent, not of the code.

**WARNING — two touch targets fall below the 44px floor on phone.** `01-UI-SPEC.md:107`: "every interactive element at least 44×44px on touch; only drops to 34–40px from `lg` (pointer input). No exceptions for Phase 1."
- `LandingPage.jsx:244` — mobile drawer trigger `h-10 w-10` = **40px**, and it is `md:hidden`, i.e. only ever rendered at phone widths where touch is certain.
- `LandingPage.jsx:217` — nav links `rounded-pill px-3.5 py-2` with a 14px font ≈ **36px** tall. The container is `hidden … md:flex` (`LandingPage.jsx:212`), so they appear from 768px up, which includes touch tablets, where the contract's 34–40px allowance has not yet begun (`lg` = 1024px).

**WARNING — three viewport-height units where the contract names one.** `01-UI-SPEC.md:247`: "Nothing is `100vh`; full-height sections use `min-h-[100dvh]`." Actual: `min-h-[100dvh]` 4×, `h-[100dvh]` 1×, **`min-h-[100svh]` 1×** (`LandingPage.jsx:299`, the hero), `max-h-[60vh]` 1× (`AppSearch.jsx:189`). `100svh` is defensible for a hero (avoids the mobile URL-bar jump) but is not the declared value, and `designTokens.test.js` cannot see it because it is a valid generated class.

**Other off-scale one-offs:** `AppSidebar.jsx:148` `min-h-[46px]` (declared steps: 44 / 34–40 from `lg`); `AppLayout.jsx:153` `w-[19rem]`; `LanguageToggle.jsx:34` `min-w-[44px]`.

**PASS — the dominant rhythm is scale-conformant.** Top spacing classes are `px-6` 41, `gap-2` 37, `gap-3` 29, `px-4` 21, `mt-3` 20, `mt-4` 17, `pb-6` 16, `py-4` 13, `px-3` 13, `space-y-5` 12 — all 8-point multiples. Content gutters and the rail match the contract (`AppLayout.jsx:82` `w-72` = 288px rail, `:223` `lg:px-8` = 32px gutters, `:225` `max-w-[1400px]`).

**PASS — the 44px floor is held in the app.** 14 usages of `min-h-[44px]`; `GlassButton.jsx:31-32` keeps 44px on touch and drops to 36/40 only at `lg`; `AppLayout.jsx:71,148` nav items are 48/46px; `AppSearch.jsx:249,281` combobox options are `min-h-[44px]`. The 40px profile button at `AppTopbar.jsx:51` is inside a `hidden … lg:flex` header (`AppTopbar.jsx:23`), so it falls within the declared 34–40px pointer allowance.

### Pillar 6: Experience Design (3/4)

**WARNING — undeclared motion escapes the MOTION 1 budget.** `01-UI-SPEC.md:240-249` permits colour/border/single-`scale-105` transitions at ≤150ms, the heatmap pulse, and number transitions; the landing's separate budget names hero rise-in, one IntersectionObserver reveal, drifting tiles and smooth scrolling. In the code: `animate-pulse` skeleton bars (`StatePanel.jsx:41`), `animate-spin` splash (`App.jsx:101`), and `transition-all duration-150` with `hover:-translate-y-1` (`LandingPage.jsx:433,514`) — a hover *translate* is not in either permitted list, and `transition-all` is broader than "colour, border". Also `GlassButton.jsx:58` `active:translate-y-[1px]` and `LandingPage.jsx:632` `lg:scale-[1.04]` where the declared value is `scale-105`. The global reduced-motion block (`index.css:234-243`) does neutralise all of these, so this is budget drift, not an accessibility failure.

**WARNING — a `window.addEventListener("scroll", …)` is live on the landing.** `LandingPage.jsx:166`. `DESIGN.md:296-297` forbids `window.addEventListener('scroll')` on the app pages, and the landing budget (`DESIGN.md:448-453`) enumerates hero rise-in, one IntersectionObserver, hover/focus transitions, one rAF drift loop and smooth scrolling — a scroll listener driving the nav shadow (`.nav-scrolled`, `index.css:335-337`) is not among them and is not gated on `prefers-reduced-motion`.

**WARNING (low) — no ErrorBoundary anywhere.** Zero matches for `ErrorBoundary` / `componentDidCatch` / `getDerivedStateFromError` across `src/`. A render throw blanks the app with no recovery path, even though every data view received a considered error state. `DESIGN.md:366-367` requires a loading, empty and error state per data view (satisfied), so this is outside the letter of the contract but inside its spirit.

**PASS — state coverage is genuinely thorough.** All 8 data views route through `StatePanel` with all three variants: `DashboardPage.jsx:280,480`; `MonitoringPage.jsx:122,127,139`; `HistoryPage.jsx:249,293,305`; `DevicePage.jsx:123,128,142`; `AdminPage.jsx:173,175,177,259,261`; `ProfilePage.jsx:76,82,185`; `SettingsPage.jsx:290,303`; `NotificationsPage.jsx:236,241`. `StatePanel.jsx:30-31` gives loading `role="status"` + `aria-live="polite"`, `:56` gives error `role="alert"`. Retry is centralised (`StatePanel.jsx:85`) so no error state invents its own. This is well above the contract floor.

**PASS — disabled and destructive semantics.** 17 `disabled` usages, e.g. `HistoryPage.jsx:227` `disabled={isEmpty}` (a dead export button is prevented, matching "no dead controls"). No destructive actions exist, consistent with `01-UI-SPEC.md:155` ("Destructive: none declared").

**PASS — ARIA-live discipline is exactly as specified.** Live numbers are silent; one polite region announces risk-level change only (`DashboardPage.jsx:421`, `App.jsx:98`), matching `DESIGN.md:368-370`.

**PASS — the declared interaction contracts are implemented.** `RowMenu.jsx:71-79` is a real menu (`aria-haspopup`, `aria-expanded`, `aria-label`, arrow keys, Escape, outside-click) and only renders when actions exist (`:12-13`); `AlertModal.jsx:12-15` is a real `role="alertdialog"` with focus move-in and restore; the skip link exists (`App.jsx:77`, `index.css:202-215`); mobile drawer is a real dialog (`AppLayout.jsx:141`); `state.status-chip` / `.force-border` survive forced-colors (`index.css:246-251`).

---

## Registry Safety

`components.json` not present (confirmed by `01-UI-SPEC.md:6` `shadcn_initialized: false` and by filesystem check), and `01-UI-SPEC.md:308-315` declares no third-party registries and no blocks. Registry audit: **not applicable — no shadcn, no third-party blocks, nothing to vet.**

---

## Files Audited

**Token layer**
- `web-dashboard/src/index.css` (346 lines)
- `web-dashboard/tailwind.config.js` (205 lines)
- `web-dashboard/src/designTokens.test.js` (gate; 3 tests, verified PASS via `npx vitest run`)

**Components — ui**
- `GlassButton.jsx`, `GlassCard.jsx`, `Chip.jsx`, `StatusChip.jsx`, `StatePanel.jsx`, `PageHeader.jsx`, `GlassInput.jsx`, `GlassForm.jsx`, `GlassTable.jsx`, `StatusBanner.jsx`, `GlassComponents.jsx`

**Components — layout / dashboard / monitoring**
- `AppLayout.jsx`, `AppTopbar.jsx`, `AppSidebar.jsx`, `AppSearch.jsx`, `LanguageToggle.jsx`
- `RowMenu.jsx`, `BentoGrid.jsx`, `LoadDonut.jsx`, `SimulatorControl.jsx`, `AlertModal.jsx`
- `TrendChart.jsx`, `TelemetryChart.jsx`, `PlantarHeatmap.jsx`

**Pages**
- `LandingPage.jsx`, `DashboardPage.jsx`, `LoginPage.jsx`, `RegisterPage.jsx`, `ProfilePage.jsx`, `DevicePage.jsx`, `HistoryPage.jsx`, `MonitoringPage.jsx`, `SettingsPage.jsx`, `AdminPage.jsx`, `NotificationsPage.jsx`

**Supporting**
- `App.jsx`, `utils/i18n.js`, `src/__oil_ui_eval__/OilEvalRegister.jsx` (scratch sandbox — inspected for ship-contamination only; not part of the design contract)

**Planning artifacts read as baseline**
- `01-UI-SPEC.md`, `DESIGN.md`, `01-CONTEXT.md`, `01-01-PLAN.md`, `01-05-PLAN.md`, `01-01..01-05-SUMMARY.md`, `token-inventory.md`

**Invocation note:** `npx vitest run src/designTokens.test.js` → 3/3 PASS (tokens gate green at audit time).

**Sandbox contamination check:** `grep -rn "__oil_ui_eval__" src/` outside the sandbox directory → no matches; no oil-ui imports in production files. `01-04`'s "not shipped" claim holds.

## UI REVIEW COMPLETE
