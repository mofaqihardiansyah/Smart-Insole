# Phase 02 — UI Review

**Audited:** 2026-10-17
**Baseline:** `01-UI-SPEC.md` (status: approved) — reused verbatim by `02-UI-SPEC.md`, which is a provenance stub only — with `DESIGN.md` as design authority and `02-CONTEXT.md` D-01…D-13 as the locked decisions.
**Screenshots:** **NOT captured.** A Vite dev server answered on `localhost:5173` (HTTP 200), but this environment has no capture tool: `npx playwright` is not installed and no `google-chrome` / `google-chrome-stable` / `chromium` / `chromium-browser` / `chrome` binary resolves (`command -v` → none; no macOS Chrome; no `PROGRAMFILES` Chrome). Code-only audit: Tailwind class audit, generated-CSS/`dist` bundle inspection, string audit, state-handling and variant-resolution analysis.
**Interaction captures:** off (`workflow.ui_interaction_capture` = false) — every interaction finding below is code-derived, never observed.

> Every claim cites `file:line` and, where it matters, the **shipped artifact** (`web-dashboard/dist/assets/index-*.js|css`), not just source. No finding is inferred from a screenshot, because none exists. The phase's own UAT records the same limitation from the other side: `02-UAT.md:117` — "the three-viewport **visual** judgement was waived, not performed. No browser is available to this environment." This audit is therefore the first read of the phase's output against the contract that does not rest on `jsdom`.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 2/4 | Phase 1's em-dash defect is **closed**, but five hardcoded **English** error strings render in the shipped UI (`AdminPage.jsx:81,102,125,135,149` → `:180,:264`) in an Indonesian-only product, invisible to every gate |
| 2. Visuals | 2/4 | **New:** all 8 landing CTAs pass `variant="warm"` / `"warmOutline"`, keys that no longer exist in `GlassButton` — every one falls back to the app's navy filled button, so the hero's primary and secondary CTAs are visually identical and the declared warm button fill never ships (`bg-warm-accent-deep` = 0 occurrences in `dist`) |
| 3. Color | 3/4 | Phase 1's **BLOCKER is closed** at all five sites (no `35 36 39` anywhere in `src/` or `tailwind.config.js`), `lg`/`overlay` de-duplicated; residuals: `.nav-scrolled` geometry still off-inventory (IN-01), decorative `bg-primary/10` ×5 and `warm-accent-2`-as-label carried as deferred |
| 4. Typography | 2/4 | Unchanged by design (D-13): the landing still runs **49 non-token size classes against 2 token classes**, plus `text-[1.0625rem]` and a declared-but-unused `font-data` |
| 5. Spacing | 2/4 | The 44px half of Phase 1's spacing finding is **closed** (drawer trigger `h-11 w-11`, four anchor groups at `min-h-[44px]`, explicit rings); the declared-scale half is untouched — **42 half-step classes across 23 files** against "multiples of 4 only / Exceptions: none" |
| 6. Experience Design | 3/4 | Large real gains (app-level `ErrorBoundary` with re-arm, dashboard three-state trend branches, feed empty region, exactly-two standing actions, source labelling); residuals: the dashboard's `error` arm is **unreachable** for signed-in users (WR-02, still `open`), undeclared motion + the landing scroll listener carried, and the crash surface's "Muat ulang tampilan" resets state instead of reloading |

**Overall: 14/24**

> **The total is lower than Phase 1's 16/24, and that is not a regression.** Phase 02's own diff is strictly better on every axis it touched (see the closure ledger below). The three-point shift comes from two defects Phase 1 did not see (the landing CTA variant collapse, the English error copy) and from holding the two pillars whose drivers Phase 02 explicitly deferred to PAGE-10. Pillar 1 and Pillar 2 each drop one point on those newly surfaced defects; Pillars 4 and 5 are held at Phase 1's scores with their drivers recorded as carried.
>
> **No pillar scores 1 and no finding breaks task completion**, so this audit files **0 BLOCKERs**. It files 8 WARNINGs (2 of them newly surfaced, ranked 1 and 2 below).

---

## Top 3 Priority Fixes

1. **Restore the landing's button variants — 8 CTAs currently render as the app register's navy filled button** — `LandingPage.jsx:227,235,279,286,391,400,730,739` pass `variant="warm"` / `variant="warmOutline"`, but `GlassButton.jsx:20-28` declares no such keys, so `VARIANTS[variant] || VARIANTS.filled` (`GlassButton.jsx:61`) silently renders `bg-primary-btn text-primary-on …` every time. The hero's "primary" and "secondary" CTAs (`:391`, `:400`) are therefore the *same* navy pill, the nav pill and mobile sheet show two identical buttons side by side, and the warm fill DESIGN.md reserves for this exact job (`warm-accent-deep` `#C93A24`, `DESIGN.md:436` "text-safe accent, **button fill**") is unreachable: `grep -c bg-warm-accent-deep dist/assets/index-*.js` → **0**. User impact: on the public surface a visitor cannot tell the primary action from the secondary one, and the warm marketing register is mixed with the clinical one on the same canvas — the one thing `01-UI-SPEC.md:89` forbids ("Registers are never mixed inside one surface"). Fix: re-add the two variants to `VARIANTS` — `warm: "bg-warm-accent-deep text-white hover:opacity-90 border border-transparent"`, `warmOutline: "border border-warm-line bg-warm-card text-warm-ink hover:bg-warm-raised"` (both existed verbatim before `8d9dd996` deleted them) — and add a case to `a11y.test.jsx` or a new `landing.test.jsx` that renders each landing CTA and asserts a *resolved* fill class, so an unknown `variant` can never fall back silently again.
2. **Localise the five English error strings in `AdminPage`** — `AdminPage.jsx:81` `"Failed to load users"`, `:102` `"Device read failed"`, `:125` `"Update failed"`, `:135` `"Delete failed"`, `:149` `"Save failed"`. Two of them are not console noise: `usersError` and `deviceError` are passed straight into the visible error state's description (`AdminPage.jsx:180`, `:264`), so a failed Firestore read paints an Indonesian title over an English body, on an error path a carer will actually hit. None of it is reachable by the phase's own copy guard (`copy.test.js` matches only `\u2014`/`\u2013`) or by `i18n.test.js` (dictionary values only), and `window.alert`/`window.confirm` (`:120,125,130,135,149`) bypass the product's error-state contract entirely. User impact: the primary audience reads an error message in a language the product says it does not ship — the exact contradiction D-05 was written to remove — with no named next action. Fix: add `admin.users.errorBody` / `admin.devices.errorBody` / `admin.*.failed` keys and resolve each literal through `t(key, language)`; then widen the copy guard to flag a quoted ASCII prose literal in a `.jsx` `window.alert`/`setError` argument, so this class cannot recur invisibly.
3. **Make the dashboard's `error` arm reachable, or delete it (WR-02, still `open`)** — `DashboardPage.jsx:502-516` adds an error state with a real `StateRetry`, and `:274-279` adds a danger source banner; neither can ever paint for a signed-in user. `InsoleContext.jsx:319-326` sets `connectionState = 'error'` and then, because `autoConnect` is `Boolean(user)` (`App.jsx:82`), calls `setSource(SIMULATOR)` — which the `[source]` effect at `InsoleContext.jsx:347-348` rewrites to `'simulated'` on the next pass. Worse, the comment at `:322-324` claims "An explicit manual selection is left alone so the failure stays visible", but the guard reads `autoConnect`, not `manualSourceRef.current` — so a clinician who deliberately selects the live device and gets a failure is silently swapped to simulated data, with only the warning banner saying so. User impact: a retry affordance no user can reach, a comment that describes a guard that does not exist, and a manual live-reading failure that never stays on screen. Fix: key the fallback on the manual flag — `if (autoConnect && !manualSourceRef.current) setSource(SOURCE.SIMULATOR);` — and add the missing error-arm case to `DashboardPage.states.test.jsx` (`:121` covers settled-empty, `:147` covers connecting, nothing covers error).

---

## Detailed Findings

### Pillar 1: Copywriting (2/4)

**CLOSED — the em-dash defect that drove Phase 1's copy score.** `AdminPage.jsx:158` now derives `const unavailable = t("common.notAvailable", language);` and the two users-table fallbacks at `:206`/`:209` read `|| unavailable`. `grep -nP "\x{2014}|\x{2013}" src/utils/i18n.js` → no match. `src/copy.test.js` extends the rule to the shipped JSX the dictionary gate cannot see, over a non-vacuous walk (`copy.test.js:72` asserts the collected count), with comments stripped so the ~29 JSDoc dashes do not read as offenders. Good work: the guard is self-exempting by construction and was proven non-vacuous with a probe file.

**WARNING (new, not in Phase 1) — five English error strings ship in an Indonesian-only product.** `AdminPage.jsx:81`, `:102`, `:125`, `:135`, `:149` (details in Priority Fix 2). Two are rendered: `AdminPage.jsx:180` `description={usersError}` and `:264` `description={deviceError}`. `01-UI-SPEC.md:273` declares "Language: Indonesian only … no language switch / i18n toggle"; D-05 declares that contract *authoritative* and reconciles `DESIGN.md` to it. The phase touched this exact file, and neither its new guard nor the existing `i18n.test.js` dash/parity gates can see an English literal that never entered the dictionary. `useAuth.jsx` also mixes languages in its console messages (`:62,88,120,126` Indonesian vs `:45,94,132,148,174` English) — console-only, so lower stakes, but the same drift.

**WARNING — two ASCII `--` value placeholders bypass the product's own localised convention.** `BentoGrid.jsx:68` (`{card.value ?? "--"}`) and `DashboardPage.jsx:366` (the battery tile) render `--`, while `AdminPage.jsx:272/281/303`, `HistoryPage.jsx`, `MonitoringPage.jsx:183` and `ProfilePage.jsx:98/101` all resolve an absent value through `t("common.notAvailable", language)` ("Tidak tersedia"). The new dash guard cannot see it (it matches only the em and en dash), so it is a leak of exactly the class FIX-09 exists to close — the code review's IN-02 flagged the dashboard site, and the `BentoGrid` default is the same defect one layer down. UAT item 7 explicitly blesses `'--'` for unmeasured battery (`02-UAT.md:47`), so this is a WARNING, not a breach of the anti-slop telemetry rule (the value does read as unavailable and carries `device.simulatedNote`).

**PASS — no generic labels.** Zero matches for `>Submit<`, `Click Here`, `>OK<`, `>Cancel<`, `>Save<`, `No data`, `went wrong`, `try again` in shipped JSX (all hits are comment prose).

**PASS — empty and error states name a cause and a next action.** `dashboard.noMatch` "Belum ada pembacaan masuk" + `source.noDeviceBody` "…Setelah terkirim, halaman ini akan memperbarui sendiri." (`DashboardPage.jsx:562-563`); `monitoring.empty`/`emptyBody` (`:520-521`); `source.errorTitle`/`errorBody` (`:276-277`); `error.boundary.title`/`body`/`action` (`i18n.js:479-482`).

**PASS — no em dashes; separators are `|`.** `i18n.js` contains zero `\u2014`/`\u2013` and zero middot; shipped copy separates with `|` (`DashboardPage.jsx:432,663`), which `01-UI-SPEC.md:278` explicitly permits.

**WARNING (carried deferral, LANG-01 / Phase 5) — the shipped build is still switchable.** `LanguageToggle` remains mounted at `AppSidebar.jsx:181`, `AppTopbar.jsx:27`, `AppLayout.jsx:200` and `LandingPage.jsx:225`, and `setLanguage('en')` still writes through and renders English (`InsoleContext.test.jsx` proves the write-through; `PlantarHeatmap.test.jsx` proves English is still reachable via the context setter). Phase 02's D-06 narrowed the *read* path only (`InsoleContext.jsx:166-176` now forces `'id'` and writes the correction back, tolerating a throwing storage) — so a returning user is no longer stranded, but the toggle still switches the live UI out of the contract language. Correctly owned and recorded; it does not by itself drive the score below 2.

### Pillar 2: Visuals (2/4)

**WARNING (new, highest-severity finding of this audit) — the landing's action hierarchy is collapsed and the two registers are mixed.** Full evidence in Priority Fix 1. The mechanical proof, all from the repo's own artifacts:

| Check | Command | Result |
|---|---|---|
| Do the keys exist? | `grep -n "warm" src/components/ui/GlassButton.jsx` | no match — `VARIANTS` = `filled/outline/ghost/quiet/danger` (`:20-28`) |
| What does the fallback do? | `GlassButton.jsx:61` | `VARIANTS[variant] \|\| VARIANTS.filled` → `bg-primary-btn text-primary-on hover:bg-primary-hover` (`:22`) |
| How many call sites? | `grep -c 'variant="warm' src/pages/LandingPage.jsx` | 8 (`:227,235,279,286,391,400,730,739`) |
| Did the fill ever ship? | `grep -c 'bg-warm-accent-deep' dist/assets/index-*.js` | **0** |
| Was it always so? | `git log -p -S'warmOutline' -- GlassButton.jsx` | `warm`/`warmOutline` were deleted in `8d9dd996`; the landing call sites were left dangling |
| Does any gate see it? | `a11y.test.jsx`, `designTokens.test.js` | no — the fallback classes all have generated rules, and the call sites carry a valid ring |

The two hero CTAs (`LandingPage.jsx:391` and `:400`) differ only by an icon and, arguably, by their accessible names; both are `size="lg" rounded-pill` navy pills. `--primary-btn` inside `.landing-scope` is re-declared as navy `15 23 42` (`index.css:272`), so this is not even a token miss — it is the app register's button rendering on the warm canvas.

**WARNING (carried deferral, D-11 → SHELL-01 / COMP-01 / PAGE-10) — the radius hierarchy is still bypassed.** 7 arbitrary radii and 10 duplicate Tailwind default radii remain, unchanged: `rounded-[6px]` (`LanguageToggle.jsx:34`), `rounded-[10px]` (`AppLayout.jsx:94`), `rounded-[26px]` ×2 (`LandingPage.jsx:630,680` — in neither the declared landing set 24/28/32/36 nor the app set), `rounded-2xl` ×7 and `rounded-xl` ×3 (`LandingPage.jsx`), each duplicating a named token (`rounded-card`/`rounded-panel` = 16px, `rounded-tile` = 12px). The `01-UI-SPEC.md:208` landing set (16/28/40 + pill) is partly honoured (`rounded-hero`, `rounded-hero-lg`, `rounded-[28px]`, `rounded-[32px]`, `rounded-[36px]` are on-set), so this is drift at the edges rather than a broken hierarchy.

**CLOSED — the "one elevated token per surface" breach.** `tailwind.config.js:185` now gives `lg` its own value (`0 6px 24px rgb(15 23 42 / 0.08)`), numerically between `md` and the modal-only `overlay` (`:187`), and `designTokens.test.js` `#gives every shadow step its own value` locks pairwise uniqueness. Phase 1's Visuals finding on `lg` ≡ `overlay` is closed.

**PASS — clear focal point and a documented funnel.** `PageHeader.jsx` renders exactly one `text-h1` per page; every panel takes `text-card-title`; `BentoGrid.jsx:67` renders metric values at `text-stat` + `tabular-data`; the dashboard composition (`DashboardPage.jsx:427,467,471,544,704`) follows `DESIGN.md:228-238` — trend two-thirds beside the donut, then the full-width feed, then the full-width map, with the 56px FAB hidden below `lg` (`:778`).

**PASS — no orphaned icon-only control.** Landing drawer trigger (`LandingPage.jsx:244`, `sr-only` label at `:257`), topbar/mobile/rail bells (`AppTopbar.jsx:31`, `AppLayout.jsx:107,131,172`), `RowMenu` (`aria-haspopup`/`aria-expanded`/`aria-label`), the search clear button (`AppSearch.jsx:170`, `sr-only` at `:178`), and the map FAB (`DashboardPage.jsx:781`, `sr-only`). The new crash surface is icon + text, not an orphan glyph.

**PASS — the crash surface is page-shaped, not a strip.** `ErrorBoundary.jsx:57` `flex min-h-[100dvh] items-center justify-center bg-bg px-4 py-10` wrapping `StatePanel variant="error"` at `max-w-md` — it reads as a page and reuses the product's own error composition rather than inventing a second one.

### Pillar 3: Color (3/4)

**CLOSED — Phase 1's BLOCKER.** `grep -rn "35 36 39\|232427" src tailwind.config.js` → **no match**. The four landing shadows carry the declared ink (`tailwind.config.js:191-194`, `rgb(23 23 25 / …)` with the alphas 25/30/25/35% byte-unchanged) and `index.css:336` `.landing-scope .nav-scrolled` is now `23 23 25`. `warm-dark` is `23 23 25` (`index.css:118`), matching `DESIGN.md:439`. The gate was **inverted and extended**, not weakened: `designTokens.test.js` went 3 → 5 cases (12 `expect()` calls), with a positive declared-ink assertion and a negative undeclared-literal scan, plus the pairwise shadow-uniqueness case — so "fixed four of five sites" now fails rather than passes. The inventory's false closing claim (`token-inventory.md:70`) is replaced by a five-site statement (`:75`).

**WARNING (IN-01, still `open`) — `.nav-scrolled` carries a fifth shadow geometry that is in no token.** `index.css:336` is `0 18px 44px -14px` — not `nav` (`0 10px 30px -14px`) and not one of the other three (`tailwind.config.js:191-194`). D-03 widened FIX-01 to "cover the shadow surface in `tailwind.config.js` and `index.css`", and the ink is now conformant there, but the *value* is still off-inventory: the tokens are a closed set of four and this is a fifth. The gate checks the colour triplet only, so it cannot see it. Fix: `@apply shadow-nav` at that rule, or declare it as a fifth step. Note also that the inventory's own row (`token-inventory.md:73`) still prints the pre-fix `rgb(35 36 39 / 0.25)` value with status `flagged` — deliberate per `02-01-SUMMARY.md:127`, but it means the inventory no longer states the shipped value for that row.

**WARNING (carried deferral, D-11 → PAGE-04/06/08/09) — decorative accent.** `bg-primary/10` on 5 elements — `LoginPage.jsx:93`, `LoginPage.jsx:166` (hover), `RegisterPage.jsx:82`, `RegisterPage.jsx:165` (hover), `ProfilePage.jsx:91` — against `01-UI-SPEC.md:157` "Accent reserved for: solid primary button fill, text links, focus-ring indicator, active navigation highlight. Never decorative." `DevicePage.jsx:164`'s solid `bg-primary` progress bar is outside this grep's pattern but the same clause.

**WARNING (carried deferral, D-11 → PAGE-10)** — `warm-accent-2` (`#F05A3C`, declared "dark-panel icons | decorative", `DESIGN.md:438`) is used as the text colour of a numeric section label at `LandingPage.jsx:638`. Passes AA on `warm-dark`; the deviation is role, not legibility.

**PASS — the palette rule holds where it matters.** Zero raw Tailwind palette utilities anywhere (`bg-slate-*`, `text-gray-*`, `bg-blue-*` → no matches). Zero hardcoded hex/rgb literals in JSX: every match is `rgb(var(--…))` (`PlantarHeatmap.jsx:35-67`, `LoadDonut.jsx:81,92`, `TelemetryChart.jsx:71,119-218`, `TrendChart.jsx:119-164`, `SimulatorControl.jsx:55`). Okabe-Ito series colours appear only in `TelemetryChart.jsx:26-28`. Risk always ships as accent + `-ink` pairs (`StatusChip.jsx:22-31`, `Chip.jsx:20-22`, `BentoGrid.jsx:37`, `StatePanel.jsx:54-56`).

**PASS — the 60/30/10 split and the "colour is a vital sign" identity hold.** Dominant `--bg` `#F8FAFC` canvas/rail, secondary white/`surface-2`/`surface-3` on every card and panel, near-monochrome navy accent on actions/links/focus/active nav; saturation appears only in risk states and the landing's warm accent. 22 accent-utility usages total across 8 files — not overuse.

**PASS — the FIX-06 semantic-tone fix is real.** `DashboardPage.jsx:323` and `:353` both map `risk === "safe" ? "success" : risk`, so the peak and score icon tiles are total over the three `STATUS_LEVELS` and no reachable verdict falls into `ICON_TONES.neutral` (`BentoGrid.jsx:36`). Phase 1's "no decorative tints by position" requirement is now enforced by `BentoGrid.test.jsx`'s permutation case.

### Pillar 4: Typography (2/4)

**WARNING (score driver, carried deferral D-13 → PAGE-10) — the landing is still off the locked scale.** Measured this audit: `src/pages/LandingPage.jsx` carries **49** non-token size classes and **2** token classes.

| Non-token class | Count | Token class | Count |
|---|---|---|---|
| `text-sm` | 11 | `text-display` | 1 |
| `text-base` | 8 | `text-body-sm` | 1 |
| `text-4xl` | 8 | | |
| `text-5xl` | 7 | | |
| `text-lg` | 6 | | |
| `text-xs` | 3 | | |
| `text-2xl` | 3 | | |
| `text-xl` / `text-6xl` / `text-3xl` | 1 each | | |

Identical to Phase 1's finding (49 / 2), i.e. unchanged: section headings still land at 36px (`:461,500,536,575`) and 48px (`:479`) with no token behind them, and the app's largest declared heading token is `h1` 30px. `01-UI-SPEC.md:117-138` declares the scale "locked 1:1" and `DESIGN.md` gives no landing type scale. **No other file in `src/` contributes a non-token size** — every non-token size in the phase's diff and in the app register is zero, which is why the score is 2 and not 1.

**WARNING (carried) — one undeclared arbitrary size in the app.** `AppSidebar.jsx:67` `text-[1.0625rem]` (17px) for the brand line, where `h4` (16px/500) is the declared token for exactly that job.

**WARNING (carried) — a declared font family is dead config.** `tailwind.config.js:108` declares `data: ["Fira Code", …]` and `DESIGN.md:189` documents it for kPa readouts; `grep -rn "font-data" src` → **0 usages**. `font-heading` carries 27 usages, `font-sans` 2. The fixed-width requirement itself is met by 26 `tabular-data`/`tabular-nums` sites.

**PASS — the app register is scale-disciplined and Phase 02 added no new deviation.** Token classes outside the landing: `body-sm` 69, `body-base` 18, `label` 12, `caption` 8, `h4` 7, `chip` 5, `data` 4, `h3` 3, `body` 3, `stat` 2, `micro` 2, `h1`/`display` 1 each. Every string the phase added (`ErrorBoundary.jsx:61-66` via `StatePanel`'s `text-body-sm`/`text-label`, the dashboard's error/empty panels, the landing's `min-h-[44px]` anchors) uses declared tokens.

**PASS — weight discipline.** Four weights only: `font-semibold` 37, `font-medium` 35, `font-bold` 10, `font-normal` 1 — the declared 400/500/600/700 set, no `extrabold`/`black` leakage.

### Pillar 5: Spacing (2/4)

**CLOSED — the 44px half of Phase 1's spacing finding.** Both named targets are fixed and now gated:
- `LandingPage.jsx:244` — drawer trigger `h-10 w-10` (40px) → **`h-11 w-11`** (44×44), `md:hidden`, with an explicit `focus-visible:ring-2 … ring-offset-warm-card` pair. This is the plan's D-12 fix exactly.
- `LandingPage.jsx:217` — the four desktop nav links gained **`min-h-[44px]`** with a ring pair and `ring-offset-warm-card` (the offset colour matching the surface beneath, which the summary flags as a deliberate decision).
- Also brought to the floor in the same pass: the brand anchor `:201`, the mobile sheet links `:272` (ring only; `py-3` + `text-base` already clear 44px), and all four footer nav links `:765`.
- The app register's floor is pinned by test: `GlassButton.jsx:31-33` (`sm`/`md` `min-h-[44px]` with the `lg`-only release, `lg` 48px), `GlassInput.jsx:58`, `StatePanel.jsx:89` (`StateRetry`), `GlassForm.jsx:38`, `AppSearch.jsx:249,281`, `AppLayout.jsx:71,148`, `BentoGrid`'s actionable branch. `a11y.test.jsx` asserts the rendered DOM, and the phase-wide sweep makes `outline-none` without `ring-2` on the same line a test failure (verified: `grep -rn "outline-none" src --include="*.jsx" | grep -v "ring-2"` → empty).

**WARNING (score driver) — 42 half-step (2px-grid) classes contradict "multiples of 4 only".** `01-UI-SPEC.md:95` declares the scale as "multiples of 4 only; Tailwind 8-point scale" with "**Exceptions: none**". Measured: **42** such classes across **23 files** — `px-3.5` 5, `mt-0.5` 5, `py-2.5` 4, `mt-1.5` 4, `gap-2.5` 4, `py-3.5` 3, `mb-1.5` 3, `gap-1.5` 3, `space-y-1.5` 2, `py-1.5` 2, `px-2.5` 2, then one each of `space-y-2.5`, `pr-2.5`, `p-0.5`, `mx-1.5`, `ml-1.5`. Heaviest: `LandingPage.jsx` 8, `AdminPage.jsx` 6, `StatusChip.jsx` 4, `GlassInput.jsx` 3. Identical to Phase 1's count — nothing in Phase 02 addressed this, and no plan's `files_modified` owned it. Individually harmless, collectively it means the "locked" scale describes intent, not the code.

**WARNING (carried) — viewport units where the contract names `100dvh`.** `01-UI-SPEC.md:247`: "Nothing is `100vh`; full-height sections use `min-h-[100dvh]`." Actual: `min-h-[100dvh]` 4× (`App.jsx:86,109`, `ErrorBoundary.jsx:57`, `AppLayout.jsx:80`, plus `LandingPage.jsx:183`), `h-[100dvh]` 1× (`AppLayout.jsx:82`), **`min-h-[100svh]` 1×** (`LandingPage.jsx:299`, the hero — defensible, the mobile URL-bar decision, but not the declared value), `max-h-[60vh]` 1× (`AppSearch.jsx:189`).

**Other off-scale one-offs (carried):** `AppSidebar.jsx:148` `min-h-[46px]`; `AppLayout.jsx:153` `w-[19rem]`; `LanguageToggle.jsx:34` `min-w-[44px]` (width, not height — above the floor, off the scale). Landing decorative wells: `h-[720px]`, `h-[640px]`, `h-[420px]/w-[560px]`, `h-[520px]/w-[520px]`, `h-[420px]/w-[420px]`, `max-h-[400px]` — all non-interactive, so below the touch-target rule but outside the declared scale.

**WARNING (accepted deferral, FIX-03 residual) — `AppSearch.jsx:170` clear button is `h-8 w-8` (32px)**, below the 44px floor, inside a popup reachable on touch. Owned by Phase 4 by explicit decision (`02-UAT.md:84-87`, item 15).

**PASS — the dominant rhythm is scale-conformant and the app's shell geometry is exact.** Dominant classes are all 8-point multiples (`px-6` 41, `gap-2` 37, `gap-3` 29, `px-4` 21, `mt-3` 20, `mt-4` 17, `pb-6` 16, `py-4` 13, `px-3` 13, `space-y-5` 12); rail `AppLayout.jsx:82` `w-72` = 288px, gutters `:223` `lg:px-8` = 32px, content cap `:225/:227` `max-w-[1400px]`, top bar `AppTopbar.jsx:23` `h-[72px]` — all matching `01-UI-SPEC.md:52` and `DESIGN.md:226`.

### Pillar 6: Experience Design (3/4)

**CLOSED / NEW — an application-level crash surface exists and is mounted above everything.** `ErrorBoundary.jsx` is the one class component; `App.jsx:56-67` mounts it inside `<Router>` and **outside** both providers and the `useAuth` hook, so a throw from the auth hook or either provider is caught too — the placement FIX-10 exists for, and the reason its copy resolves `t(key)` with no language argument. It reuses `StatePanel`'s error arm + `StateRetry` rather than re-composing, reports under a stable label (`:39-43`), exports named and default, and is locked by 12 assertions across `ErrorBoundary.test.jsx` and `App.errorBoundary.test.jsx` (including a nested-boundary scoping case). Phase 1's "no ErrorBoundary anywhere" finding is closed.

**WARNING (new) — the recovery action cannot recover a deterministic render error.** The button is labelled `error.boundary.action` = "Muat ulang tampilan" ("reload this view", `i18n.js:482`) and the body says "Tekan tombol di bawah untuk memuat ulang tampilan ini." (`:480-481`), but `ErrorBoundary.jsx:47-49` `handleReset` only does `this.setState({ hasError: false })` — no document reload. If the throw is deterministic (a data-shape bug in a page, which is the realistic clinical failure), the subtree re-renders, throws again, and the same panel returns: the control appears to act but cannot escape. The component's own test admits the narrow case — `ErrorBoundary.test.jsx:150` "The throw was transient, so the boundary's own recovery is enough". Fix: match the label to the behaviour and give the user a real escape — either `window.location.reload()` for the action, or two actions ("Coba lagi" reset + "Muat ulang halaman" reload). A crash surface with one unrecoverable action is a soft dead control on the surface built to end them.

**WARNING (WR-02, still `open`, unowned) — the dashboard's error arm is unreachable and its comment lies.** See Priority Fix 3 for the full chain (`InsoleContext.jsx:319-326`, `:347-348`, `App.jsx:82`, `DashboardPage.jsx:274-279`, `:502-516`). Two consequences beyond the dead branch: FIX-08's claim that the trend panel covers "settled-empty **and** error" is only half-testable (`DashboardPage.states.test.jsx:121` empty, `:147` connecting, no error case), and a deliberate manual live-device selection that fails is silently swapped to the simulator — a truthfulness risk on a clinical instrument, mitigated only because the simulator banner does announce itself (`DashboardPage.jsx:284-290`).

**WARNING (carried deferral, D-11 → COMP-01 / COMP-03 / PAGE-10) — undeclared motion.** `App.jsx:111` `animate-spin` (splash), `StatePanel.jsx:41` `animate-pulse` (loading skeletons), `GlassButton.jsx:58` `active:translate-y-[1px]`, `LandingPage.jsx:514` `transition-all` + `hover:-translate-y-1`, `LandingPage.jsx:632` `scale-[1.04]` (declared value is `scale-105`), `DashboardPage.jsx:778` `scale-105` (this one is sanctioned). `index.css:234-243` neutralises all of it under `prefers-reduced-motion`, so this is budget drift, not an accessibility failure. Note the new `ErrorBoundary`/`StatePanel` error surfaces add **no** motion.

**WARNING (carried deferral, D-11 → PAGE-10) — `window.addEventListener("scroll", …)` is still live on the landing.** `LandingPage.jsx:166` drives `.nav-scrolled` (`index.css:335-337`) and is not in either declared motion budget, nor gated on `prefers-reduced-motion`.

**PASS — state coverage is genuinely thorough and Phase 02 closed the two dishonest zero-data views.** The trend panel now keeps the data arm outermost (`DashboardPage.jsx:485-523`): `history.length > 0` → `TrendChart` with every prop unchanged; `connecting` → loading panel; `error` → error panel with `StateRetry`→`reconnect`; settled-empty → `monitoring.empty`/`emptyBody`. The feed's bare muted line became `StatePanel variant="empty"` with a cause and a next action (`:558-565`). All 8 data views still route through `StatePanel`'s three variants, `StatePanel.jsx:30-31` keeps loading `role="status"` + `aria-live="polite"` and `:56` error `role="alert"`, and `StatePanel.test.jsx` now locks that an empty view stays out of every live region — a real improvement on Phase 1.

**PASS — dead controls are gone, exactly two standing actions stand.** `DashboardPage.jsx:443-460` renders Export CSV (`:449`) and Mark acknowledge (`:457-459`) only, both disabled when they cannot act (`:446` `history.length === 0`, `:454` `unreadIncidentCount === 0`), and `DashboardPage.test.jsx` asserts exactly two `role="button"` descendants before **and** after a reading-state change, plus the absence of both reference dead-control labels from the document and from every `.jsx`/`.js` under `src/`. `grep -rn "Export PDF\|New Session" src --include="*.jsx"` → no match.

**PASS — the data source is always labelled (FIX-07).** `DashboardPage.jsx:284-290` renders `source.simTitle`/`simBody` whenever the source is the simulator, `:281-283` shows loading while a Firebase connection is unanswered, and the tile badge/caption carry the source (`:370-375`). The simulator control only appears when the simulator is the active source (`:750`) and the source is surfaced in the rail and on Device/Monitoring/History too.

**PASS — ARIA-live discipline, disabled semantics and native semantics are intact.** Live numbers stay silent; one `aria-live="polite"` region announces the risk level only (`DashboardPage.jsx:423-425`). Table→stacked-rows reflow holds (`:569` `hidden … md:block` / `:645` `md:hidden`). `RowMenu` remains a real menu; `AlertModal` remains a real `role="alertdialog"`; the skip link is present (`App.jsx:87-89`, `index.css:202-215`); `forced-colors` keeps `state.status-chip` and `.force-border` (`index.css:246-251`).

**WARNING (out of phase scope — do not score as a Phase 02 defect) — CR-01.** `AdminPage.jsx:56-67` early-returns before the `useEffect`s at `:70`, `:91`, `:108`, so a signed-in admin deep-linking to `/admin` renders 0 hooks then 3 and React throws; the new `ErrorBoundary` now converts that into a visible crash panel on first paint. The code review reproduced it and `02-REVIEW-DISPOSITION.md:6-10` records it `open`; the phase's diff only added the `unavailable` const to this file. Mentioned because FIX-10 made a pre-existing crash *user-visible*, and because the fix (move every hook above the guard, guard only the JSX) is a four-line move.

### Phase 01 finding disposition (required ledger)

| Phase 1 finding | Pillar | Disposition in Phase 02 | Evidence |
|---|---|---|---|
| Token inventory incomplete + false closing claim; widen FIX-01 | 3 | **CLOSED** | `tailwind.config.js:191-194`, `index.css:336`, `token-inventory.md:68-75`; gate 3 → 5 cases |
| `lg` byte-identical to `overlay` | 2 | **CLOSED** | `tailwind.config.js:182-187`; uniqueness case added |
| Landing type scale off the locked scale | 4 | **DEFERRED** (D-13 → PAGE-10, carry-forward in ROADMAP + GATE-03) | still 49 / 2; no landing scale declared |
| Landing radius off-scale values | 2 | **DEFERRED** (D-11 → SHELL-01 / COMP-01 / PAGE-10) | 7 arbitrary + 10 duplicate radii present |
| `AppSidebar.jsx:67` `text-[1.0625rem]` | 4 | **CARRIED, unowned** | present |
| `font-data` declared, 0 usages | 4 | **CARRIED, unowned** | `grep font-data` → 0 |
| Two phone touch targets < 44px | 5 | **CLOSED** | `LandingPage.jsx:217,244`; `a11y.test.jsx` |
| 42 half-step spacing classes | 5 | **CARRIED, unowned** | measured 42 across 23 files |
| `100svh` / `60vh` / `min-h-[46px]` / `w-[19rem]` | 5 | **CARRIED, unowned** | `LandingPage.jsx:299`, `AppSearch.jsx:189`, `AppSidebar.jsx:148`, `AppLayout.jsx:153` |
| Em dash in admin copy | 1 | **CLOSED** | `AdminPage.jsx:158,206,209`; `copy.test.js` |
| Indonesian-only not met (toggle ×4, EN dictionary) | 1 | **PARTIAL** — read path forced (D-06), switch removal deferred to LANG-01 / Phase 5 | `InsoleContext.jsx:166-176`; toggle still mounted ×4 |
| Undeclared motion; landing scroll listener | 6 | **DEFERRED** (COMP-01 / COMP-03 / PAGE-10) | present |
| No ErrorBoundary | 6 | **CLOSED** | `ErrorBoundary.jsx`; `App.jsx:56-67` |
| Decorative `bg-primary/10` ×5; `warm-accent-2` as label | 3 | **DEFERRED** (PAGE-04/06/08/09; PAGE-10) | present |
| **New this audit (not in Phase 1)** | 2 | landing CTA variants resolve to `filled` — 8 sites | `dist` bundle proof above |
| **New this audit (not in Phase 1)** | 1 | five English error strings in shipped `AdminPage` | `AdminPage.jsx:81,102,125,135,149` → `:180,:264` |
| **New this audit (not in Phase 1)** | 6 | crash-surface action cannot recover a deterministic throw | `ErrorBoundary.jsx:47-49` vs `i18n.js:482` |

---

## Files Audited

**Shipped source (read in full):** `src/App.jsx`, `src/main.jsx`, `src/index.css`, `tailwind.config.js`, `src/components/ui/ErrorBoundary.jsx`, `StatePanel.jsx`, `GlassButton.jsx`, `StatusChip.jsx`, `Chip.jsx`, `src/components/dashboard/BentoGrid.jsx`, `src/pages/DashboardPage.jsx`, `src/pages/AdminPage.jsx` (guard/hooks/fallbacks/alert paths), `src/pages/LandingPage.jsx` (nav, hero, CTAs, footer, motion effects), `src/context/InsoleContext.jsx` (stored-preference reader, source/connection effects, actions), `src/utils/i18n.js` (both dictionaries, key usage cross-check), `src/components/layout/{AppLayout,AppSidebar,AppTopbar,AppSearch,LanguageToggle}.jsx`.

**Gates and tests read (as evidence of what is and is not caught):** `src/designTokens.test.js` (5 cases / 12 `expect()`), `src/a11y.test.jsx`, `src/copy.test.js`, `src/components/ui/{StatePanel,StatusChip,ErrorBoundary}.test.jsx`, `src/components/dashboard/BentoGrid.test.jsx`, `src/pages/DashboardPage.states.test.jsx`, `src/pages/DashboardPage.test.jsx`, `src/context/InsoleContext.test.jsx`, `src/App.errorBoundary.test.jsx`.

**Shipped artifact inspected:** `web-dashboard/dist/assets/index-Bpmgy9Y9.css`, `index-CBuoZPws.js` (class-emission order and variant-map absence). `src/__oil_ui_eval__/` excluded from scoring per instructions; its only interaction with shipped code is the UAT's own note that its 8 unlabelled `StatusChip`s are unreached scratch (`02-UAT.md:112-114`).

**Baseline and upstream read:** `01-UI-SPEC.md`, `02-UI-SPEC.md` (provenance stub), `DESIGN.md`, `02-CONTEXT.md`, `01-UI-REVIEW.md`, `02-01…02-06-SUMMARY.md` and `-PLAN.md` (frontmatter, `must_haves`, `files_modified`, verification evidence), `02-REVIEW.md`, `02-REVIEW-DISPOSITION.md`, `02-UAT.md`, `02-VERIFICATION.md` (findings/limitations sections), `COVERAGE.md`, `.planning/phases/01-…/token-inventory.md`, `AGENTS.md`.

**Registry Safety:** `components.json` is absent (no shadcn CLI/registry; the design system is a custom token layer) and `01-UI-SPEC.md:308-315` declares no third-party registries or blocks, so no block vetting was possible or required.

**Tooling limitations, stated plainly:** no Playwright and no Chrome/Chromium binary, so no screenshot or interaction capture was possible even though a dev server answered on `5173`; `02-UAT.md:117` records the same waver for the phase. Findings that only rendered pixels could settle (the visual weight of the landing CTA pair, the nav pill's height once its links hold 44px, ring clipping between adjacent 44px targets) are reported as untested rather than assumed, and every scored claim above rests on source, generated CSS, or the shipped bundle.

## UI REVIEW COMPLETE
