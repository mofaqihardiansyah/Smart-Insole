# Phase 03: Primitive rebuilds — Pattern Map

**Mapped:** 2026-10-18
**Files analyzed:** 29 (19 modified/created source, 9 test/gate, 1 doc)
**Analogs found:** 26 / 29
**Scope source:** `03-CONTEXT.md` D-01…D-05 + code context; `03-UI-SPEC.md` Component Inventory and per-delta line refs; `REQUIREMENTS.md` COMP-01…COMP-05; `ROADMAP.md` Phase 3 success criteria.
**Research:** none for this phase (deliberately skipped — rebuild against the already-audited Phase 1 contract).

> **Tracked-source audit.** Every existing path below was verified with `git ls-files -- <path>` and is git-tracked. There is no nested submodule under `web-dashboard/`. The barrel the phase note guessed at (`src/components/ui/index.js`) **does not exist** — the real barrel is `src/components/ui/GlassComponents.jsx` (tracked). Not-yet-existing paths (`series.js`, the new primitive, the new gates) are new files and keep their intended paths.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/ui/GlassButton.jsx` (mod) | component | request-response | `src/components/ui/Chip.jsx` (map + fallback) + itself (control contract) | role-match |
| `src/components/ui/GlassCard.jsx` (mod) | component | render | `src/components/ui/GlassTable.jsx` (frame primitive) | exact |
| `src/components/ui/GlassInput.jsx` (mod) | component | request-response | `src/components/ui/GlassForm.jsx:32-51` (`GlassSelect`) | exact |
| `src/components/ui/GlassTable.jsx` (mod) | component | render (tabular) | `src/components/ui/Chip.jsx` (`-ink` pair discipline) | role-match |
| `src/components/ui/GlassForm.jsx` (mod) | component | request-response | `src/components/ui/GlassInput.jsx` (field contract) | exact |
| `src/components/ui/StatusChip.jsx` (mod) | component | render (risk readout) | `src/components/ui/Chip.jsx` (`TONES` map + `||` fallback) | exact |
| `src/components/ui/Chip.jsx` (mod) | component | render | `src/components/ui/StatusChip.jsx` (`LEVELS` map) | exact |
| `src/components/ui/StatePanel.jsx` (mod) | component | event-driven (live region) | `src/components/ui/StatusBanner.jsx` (tone→role register) | exact |
| `src/components/ui/StatusBanner.jsx` (mod → delegate) | component | event-driven (live region) | `src/components/ui/StatePanel.jsx` (register preserved) | exact |
| `src/components/ui/GlassComponents.jsx` (mod) | config (barrel) | re-export | `src/components/ui/GlassForm.jsx:111-120` (second barrel) | exact |
| `src/components/dashboard/BentoGrid.jsx` (mod, BentoCell) | component | render | itself; test contract `src/a11y.test.jsx:251-283` | role-match |
| `src/components/monitoring/TelemetryChart.jsx` (mod) | component | data-viz (buffer→SVG) | itself (`SERIES` at `:25-29` moves out) | exact |
| `src/components/monitoring/TrendChart.jsx` (mod, D-05 carve-out) | component | data-viz (buffer→SVG) | `src/components/monitoring/TelemetryChart.jsx` (sibling chart) | exact |
| `src/components/dashboard/LoadDonut.jsx` (mod, D-04) | component | data-viz (arcs) | `src/components/monitoring/TelemetryChart.jsx` (series consumption) | role-match |
| `src/pages/DashboardPage.jsx` (mod, `:381-400`) | page | request-response + data-viz call site | itself — 3-line deletion | exact |
| `src/pages/AdminPage.jsx` (mod, `:60,180,182,264,266`) | page | CRUD | `src/components/ui/ErrorBoundary.jsx:56-70` (cause + `StateRetry` action) | exact |
| `src/pages/MonitoringPage.jsx` (mod — **forced by D-04**) | page | consumer of series constants | `src/context/InsoleContext.jsx:10` (utils-constant import) | exact |
| `src/utils/i18n.js` (mod, new keys) | config (dictionary) | static map | itself — existing `admin.*` key block | exact |
| `DESIGN.md` (mod, D-04/D-05 amendment) | doc | prose authority | itself `:161-182` (the section being amended) | exact |
| **NEW** Alert/Banner primitive `src/components/ui/<Name>.jsx` | component | event-driven (feedback) | `src/components/ui/StatusBanner.jsx` | exact |
| **NEW** tone→role config (module or export) | config | static map | `src/components/ui/StatusChip.jsx:19-32` (`LEVELS`/`STATUS_LEVELS`) | exact |
| **NEW** dev-warn helper `src/utils/devWarn.js` | utility | transform (dev signal) | `src/utils/i18n.js:975` (`hasKey` tiny-export idiom) | partial |
| **NEW** `src/utils/series.js` | utility | static constants | `src/utils/randomForestRisk.js` | exact |
| **NEW** `src/utils/series.test.js` | test | unit | `src/utils/randomForestRisk.test.js` | exact |
| **NEW** quarantine gate test | test | source sweep | `src/designTokens.test.js` + `src/copy.test.js:68-73` | exact |
| **NEW** anti-silent-fallback gate test | test | source sweep (positive half) | `src/copy.test.js:82-93` | exact |
| **NEW** new-primitive test | test | rendered-DOM role assertions | `src/components/ui/StatePanel.test.jsx` | exact |
| **NEW** `src/components/ui/GlassButton.test.jsx` | test | rendered-DOM variant assertions | `src/components/ui/StatusChip.test.jsx` | exact |
| **NEW** `src/components/ui/StatusBanner.test.jsx` | test | delegate passthrough | `src/components/ui/StatePanel.test.jsx` | role-match |

---

## Pattern Assignments

### `src/components/ui/GlassButton.jsx` (component, request-response) — COMP-01 + D-01 + C-01

**Analogs:** `src/components/ui/Chip.jsx` (the map-with-fallback shape to fix) + itself (the frozen control contract).

**Current defect shape to change** (lines 20-28, 61):
```jsx
const VARIANTS = {
  filled: "bg-primary-btn text-primary-on hover:bg-primary-hover border border-transparent",
  outline: "border border-border-strong bg-surface text-fg hover:bg-surface-2",
  ghost: "text-fg-2 hover:bg-surface-2 border border-transparent",
  quiet: "border border-border-strong bg-surface-2 text-fg hover:bg-surface-3",
  danger: "bg-danger text-white hover:bg-danger-hover border border-transparent",
};
// ...
VARIANTS[variant] || VARIANTS.filled,   // :61 — the silent fallback (D-01)
```

**Keys to restore verbatim (D-01, `03-UI-SPEC.md` lines 120-121)** — landing-register-only, appended to the same `VARIANTS` object:
```jsx
warm: "bg-warm-accent-deep text-white hover:opacity-90 border border-transparent",
warmOutline: "border border-warm-line bg-warm-card text-warm-ink hover:bg-warm-raised",
```

**Control contract to KEEP untouched** (lines 31-34, 57-60) — `a11y.test.jsx:203-225` asserts the first two; the ring pair is the shared `RING_PAIR`:
```jsx
const SIZES = {
  sm: "min-h-[44px] lg:min-h-[36px] px-3 text-body-sm",
  md: "min-h-[44px] lg:min-h-[40px] px-4 text-body-sm",
  lg: "min-h-[48px] px-5 text-body-base",
};
// className array:
"inline-flex items-center justify-center gap-2 rounded-control font-semibold",
"transition-colors duration-150 active:translate-y-[1px]",   // :58 — REMOVE the translate (C-01)
"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
```

**C-01:** delete `active:translate-y-[1px]`, keep `transition-colors duration-150` (`03-UI-SPEC.md` line 368). **Do not** invent a `danger-hover` hex: `--danger-hover` is byte-identical to `--danger` (`index.css:58`) — resolve per `03-UI-SPEC.md` lines 266-274 (owner-signed token, or ship with no hover step; never a hard-coded hex).

**Analogy for the fallback fix** — `Chip.jsx:39` is the identical line (`TONES[tone] || TONES.neutral`); the D-01 gate and this fix are one posture applied to both.

---

### `src/components/ui/GlassCard.jsx` (component, render) — COMP-01 (conform)

**Analog:** `src/components/ui/GlassTable.jsx` — both are container/frame primitives sharing the exact frame recipe.

**Frame recipe** (`GlassCard.jsx:25-34`):
```jsx
<Tag className={[
    "rounded-card border border-border bg-surface",
    elevated ? "shadow-md" : "shadow-panel",
    flush ? "" : "p-6",
    className,
  ].filter(Boolean).join(" ")} {...props}>
```

`GlassTable.jsx:29-34` uses the same five tokens (`rounded-card border border-border bg-surface shadow-panel`) plus `overflow-x-auto`. No radius, elevation, motion or ink change is expected here — C-02 confirms it carries no off-scale radius (`03-UI-SPEC.md:166`). Keep `GlassIcon` (`:96-105`) and `PanelHeader` (`:50-88`) exports intact for COMP-05.

---

### `src/components/ui/GlassInput.jsx` (component, request-response) — COMP-01 (conform)

**Analog:** `src/components/ui/GlassForm.jsx:32-51` (`GlassSelect`) — the same field contract on a sibling control.

**Field contract** (`GlassInput.jsx:57-69`) — mirror it exactly in `GlassSelect` if it is touched:
```jsx
"tabular-data w-full min-h-[44px] rounded-control border bg-surface px-3.5 py-2.5",
"text-data text-fg placeholder:text-muted",
"transition-colors duration-150",
"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
error ? "border-danger" : "border-border-control hover:border-primary focus:border-primary",
```

**Ink exception to KEEP (M-01c):** the field error at `:86` is `text-danger` on `surface` = 4.83:1 — it **passes AA** and stays exactly as-is (`03-UI-SPEC.md:308-309`). The label/hint at `:45`/`:80` are `text-fg` / `text-muted` on white (4.76:1) — also fine. Only the off-grid `space-y-1.5` (6px) at `:41` and `px-3.5 py-2.5` at `:58` are the C-03 carried non-conformances — leave them, they are owned by the backlog item (`03-UI-SPEC.md:174-193`).

---

### `src/components/ui/GlassTable.jsx` (component, render) — COMP-01 + M-01a

**Analog:** `src/components/ui/Chip.jsx` — the repo's `-ink`-token discipline; the same "never `muted` on a non-white surface" rule.

**The one change (M-01a)** — `GlassTableCell`, lines 66-73, the `th` branch:
```jsx
Tag === "th" ? "px-6 py-3.5" : "px-6 py-4",
"align-middle",
Tag === "th"
  ? "bg-surface-2 text-label uppercase text-muted whitespace-nowrap"   // :70 — 4.35:1, fails AA
  : "tabular-data text-body-base text-fg-2",
```
Change `text-muted` → **`text-fg-2`** (9.45:1), keep `text-label uppercase`. `td` already uses `text-fg-2`. Leave `px-6 py-3.5` (C-03, owned by backlog). Frame at `:29-34` keeps `shadow-panel` (Elevation delta).

---

### `src/components/ui/GlassForm.jsx` (component, request-response) — COMP-01 (conform)

**Analog:** `src/components/ui/GlassInput.jsx` — the field contract primitives here delegate to.

**Second barrel to keep honest** (`:111-120`):
```jsx
export {
  GlassCard, GlassIcon, PanelHeader,
  GlassFormGroup, GlassLabel, GlassInput,
  GlassSelect, GlassSwitch, GlassButton,
};
```
Its `GlassSelect` (`:32-51`) and `GlassSwitch` (`:66-109`) are the field/toggle contract. `GlassSwitch`'s `h-11 w-11` hit area (`:83`) and the documented pill exception (`:59-61`, `rounded-full` at `:93`/`:101`) are **declared**, not violations. Its `space-y-1.5` at `:16` is C-03. The switch-thumb `transition-transform duration-150` at `:101` is reported-once, **not** a Phase 3 obligation (`03-UI-SPEC.md:376-379`).

---

### `src/components/ui/StatusChip.jsx` (component, render) — COMP-02

**Analog:** `src/components/ui/Chip.jsx` — the twin primitive (same `TONES`-map + fallback shape, one shared vocabulary).

**Config map + fallback** (`:19-32`, `:46`):
```jsx
const LEVELS = {
  safe:    { Icon: CheckCircle2,  tone: "bg-safe/15 text-safe-ink" },
  warning: { Icon: AlertTriangle, tone: "bg-warning/15 text-warning-ink" },
  danger:  { Icon: AlertOctagon,  tone: "bg-danger/15 text-danger-ink" },
};
// ...
const config = LEVELS[level] || LEVELS.safe;   // :46 — no dev signal today
```
The map is already exported as `STATUS_LEVELS` (`:67`) and the test reads it from there. **COMP-02 = conform, no vocabulary change** (`03-UI-SPEC.md:81`): three redundant channels (distinct icon shape + text label + colour) stay exactly. The D-01 gate wants a **dev warning** on the unknown `level` key here (today there is none); the resolution in production stays `LEVELS.safe`. Off-grid `gap-1.5 px-2.5 h-3.5 w-3.5` / `px-3.5 py-1.5` (`:35`,`:37`) are C-03 — leave them.

---

### `src/components/ui/Chip.jsx` (component, render) — COMP-02

**Analog:** `src/components/ui/StatusChip.jsx` — the map-with-fallback twin.

**Config map + fallback** (`:14-23`, `:39`):
```jsx
const TONES = {
  neutral: "bg-surface-2 text-fg-2",
  info: "bg-tertiary/15 text-primary",   // navy ink: tertiary-as-text fails AA (:16-18)
  success: "bg-safe/15 text-safe-ink",
  warning: "bg-warning/15 text-warning-ink",
  danger: "bg-danger/15 text-danger-ink",
};
// ...
TONES[tone] || TONES.neutral,   // :39 — D-01 fallback site
```
Tone vocabulary is unchanged (`03-UI-SPEC.md:82`). D-01 adds the dev warning on the unknown key; production fallback stays `neutral`. `gap-1.5 px-2.5` (`:36`) is C-03. The radius split at `:37` (`pill ? rounded-full : rounded-control`) is the declared hierarchy — keep.

---

### `src/components/ui/StatePanel.jsx` (component, event-driven) — D-02 + C-01 + M-01b

**Analog:** `src/components/ui/StatusBanner.jsx` — the other feedback register; the two now share one tone→role matrix.

**Register to preserve untouched** (`:50-63`) — `ErrorBoundary.jsx:2` imports this by direct path, so FIX-08/FIX-10 depend on the shape:
```jsx
const isError = variant === "error";
const config = isError
  ? { Icon: AlertTriangle, tone: "border-danger/50 bg-danger/15",
      iconTone: "text-danger-ink", role: "alert" }
  : { Icon: Inbox, tone: "border-border bg-surface shadow-panel",
      iconTone: "text-muted", role: undefined };
```
- **C-01** — `:41` `"h-4 animate-pulse rounded bg-surface-3"` → **remove `animate-pulse`**; `rounded` (bare) → `rounded-sm` or `rounded-control` (C-02, `03-UI-SPEC.md:335-336`). Skeleton bars stay (they reserve space). Loading keeps `role="status" aria-live="polite"` (`:29-33`) — **that is the one permitted polite region's sibling, not a second always-on region**.
- **M-01b** — `:75` `text-body-sm text-muted` on the error tint (3.75:1) → **`text-fg-2`**; title stays `text-fg`, tone icon keeps `-ink`.
- The tone→role decision (`role: "alert"` / `undefined`) should read from the **shared config** the new primitive owns (D-02); today it is duplicated here and in `StatusBanner.jsx:53`.
- `StateRetry` (`:85-94`) is the declared recovery action — the `AdminPage` repairs reuse it.

---

### `src/components/ui/StatusBanner.jsx` (component → delegate, event-driven) — D-02 + M-01b

**Analog:** `src/components/ui/StatePanel.jsx` — the register this delegate must keep compatible.

**Props that MUST stay** (`:39-47`, `03-UI-SPEC.md:404-405`): `tone`, `title`, `children`, `action`, `onDismiss`, `dismissLabel`. 13 call sites in 8 files depend on them.

**Current internals that move into the new primitive** (`:16-37` tone map, `:53` role pick, `:74` dismiss `h-11 w-11` + localised `aria-label`):
```jsx
const TONES = {
  info:    { Icon: Info,        tone: "border-border-control bg-surface-2", icon: "text-primary" },
  success: { Icon: CheckCircle2, tone: "border-safe/50 bg-safe/15",         icon: "text-safe-ink" },
  warning: { Icon: AlertTriangle,tone: "border-warning/50 bg-warning/15",   icon: "text-warning-ink" },
  danger:  { Icon: AlertOctagon, tone: "border-danger/50 bg-danger/15",     icon: "text-danger-ink" },
};
role={tone === "danger" ? "alert" : "status"}   // :53 — the second copy of the matrix
```
After D-02 this file **delegates** to the new primitive (keeping the name exported). **M-01b:** `:64` `text-body-sm text-muted` on a tone tint → `text-fg-2`. No shadow (inline row, Elevation delta).

---

### `src/components/ui/GlassComponents.jsx` (config, re-export) — COMP-05

**Analog:** `src/components/ui/GlassForm.jsx:111-120` — the second, overlapping barrel.

Two re-export paths must both stay honest. The D-02 primitive must be re-exported here (and/or via the new primitive's own export) so `Phase 4`'s shell can consume it; every **legacy** name (`GlassCard … StatePanel, StateRetry, StatusBanner, PageHeader`) stays exported (`03-UI-SPEC.md:88`). Add the new primitive name **without** removing any existing export.

---

### `src/components/dashboard/BentoGrid.jsx` (component, render) — planner's discretion

**Analog:** itself; the test contract already in place is `src/a11y.test.jsx:251-283`.

`BentoCell` (`:46-102`) is not an interactive target unless `card.onSelect` exists, so the 44px floor does not apply; `a11y.test.jsx:271-272` explicitly declines a height assertion. The discretion row (`03-UI-SPEC.md:502`) asks the planner to **pin a `min-h`** or **accept a content-driven floor**. If a `min-h` is added, it must be an on-scale step and must not chase the existing `p-5` (`:44`, on-scale). Resolve against the accessibility contract, not the deferral.

---

### `src/components/monitoring/TelemetryChart.jsx` (component, data-viz) — D-04

**Analog:** itself — the `SERIES` array at `:25-29` is the source being **moved out**, not changed:
```jsx
const SERIES = [
  { key: "forefoot", varName: "--series-1", dash: undefined },
  { key: "midfoot",  varName: "--series-2", dash: "7 4" },
  { key: "heel",     varName: "--series-3", dash: "2 4" },
];
```
**Consumption pattern to keep** (`:69-78`, `:193-212`, `:225-247`, `:250-274`): the array drives the polyline strokes, the end dots, the legend swatches **and** the screen-reader table — every one reads from `SERIES`. After the move, import from `../../utils/series`. `TelemetryChart` stops being the palette authority.

**Re-export decision (planner's discretion, `03-CONTEXT.md:49`) — has a real consumer:** `MonitoringPage.jsx:21,64` imports and uses `TELEMETRY_SERIES`. `export { TelemetryChart, SERIES as TELEMETRY_SERIES }` (`:279`) is **not** zero-importer — see the forced edit below.

---

### `src/components/monitoring/TrendChart.jsx` (component, data-viz) — D-05 carve-out

**Analog:** `src/components/monitoring/TelemetryChart.jsx` — the sibling chart (same `useMemo` model, `role="img"`, sr-only table).

**What must NOT change** (`:117-121`, `:171-178`) — the non-identity trace:
```jsx
<polygon points={model.area} fill="url(#trend-area)" />   // :169, 12% sage tint
<polyline points={model.points} fill="none"
  stroke="rgb(var(--secondary))" strokeWidth="3" ... />    // :174 — sage, NOT a series colour
```
`--secondary` `#059669` is a **stroke/graphic token only** (3.77:1) — it clears the 3:1 graphical bar and must never carry a label (`03-UI-SPEC.md:252-254`). TrendChart imports **no** series colour; the carve-out is written into `DESIGN.md` beside the D-04 amendment. Its threshold line (`:149-167`) keeps `var(--danger)`.

---

### `src/components/dashboard/LoadDonut.jsx` (component, data-viz) — D-04

**Analog:** `src/components/monitoring/TelemetryChart.jsx` — the series consumer pattern.

**Current consumption** (`:60-72`, `:100-106`): `arc.color` is a caller-supplied string used directly as `stroke={arc.color}` and `style={{ backgroundColor: arc.color }}`. After D-04, the arc colours come from the series source instead of the caller. The `sum === 0` guard at `:40` and the "no arc, whole = 0" empty behaviour are **preserved** (`03-UI-SPEC.md:493`).

Reported-once (N-04, planner's call): `:79` `fontSize="26"` and `:89` `fontSize="10" letterSpacing="0.1em"` are hand-rolled SVG type below the 12px floor — `designTokens.test.js` scans Tailwind classes, so raw SVG attrs sit outside the gate. Cheapest conforming move: ring-centre unit takes the declared `micro` metrics.

---

### `src/pages/DashboardPage.jsx` (page, request-response + data-viz call site) — D-04

**Analog:** itself — a 3-line deletion, not a rebuild.

**Delete** the caller-supplied colours at `:386`, `:392`, `:398`:
```jsx
const donutSegments = [
  { key: "forefoot", label: t("anatomy.forefoot.short", language), value: balance.perZone[0],
    color: "rgb(var(--secondary))" },        // :386  DELETE this line
  { key: "midfoot",  label: t("anatomy.midfoot.short", language),  value: balance.perZone[1],
    color: "rgb(var(--primary))" },          // :392  DELETE this line
  { key: "heel",     label: t("anatomy.heel.short", language),     value: balance.perZone[2],
    color: "rgb(var(--border-strong))" },    // :398  DELETE this line (resolves to #E2E8F0, 1.3:1)
];
```
The donut call site is `:533-534` (`<LoadDonut segments={donutSegments} …>`). **Preserve** the single always-mounted polite region at `:422-425`:
```jsx
<p className="sr-only" aria-live="polite">{`${t("risk.status", language)}: ${levelLabel}`}</p>
```
No second live region (success criterion 5). `AdminPage`/`RowMenu` in this file are out of scope.

---

### `src/pages/AdminPage.jsx` (page, CRUD) — D-03 call-site repairs

**Analog:** `src/components/ui/ErrorBoundary.jsx:56-70` — the canonical "named cause + `StateRetry` action" render:
```jsx
<StatePanel variant="error" title={t("error.boundary.title")}
  description={t("error.boundary.body")}
  action={<StateRetry onRetry={this.handleReset} label={t("error.boundary.action")} />} />
```

**The five sites to repair** (`03-UI-SPEC.md:458-463`; **copy goes in `i18n.js`, never a literal**):

| Site | Today | Repair |
|---|---|---|
| `:60-64` | `variant="error"` cause only (`admin.accessDenied` + body) | add `nextAction` string `Hubungi administrator bila Anda memerlukan akses.` (new key) |
| `:180` | `variant="error"` cause = `usersError` | add next action `Muat ulang halaman untuk mencoba lagi.` (or a `Coba lagi` retry button) |
| `:182` | `variant="empty"` title only (`admin.users.empty`) | add body/next step `Minta pengguna mendaftar akun agar muncul di daftar ini.` (new key) |
| `:264` | `variant="error"` cause = `admin.devices.error` | add next action `Muat ulang halaman untuk mencoba lagi.` |
| `:266` | `variant="empty"` title only (`admin.devices.empty`) | add body/next step `Periksa sambungan perangkat, atau tunggu kiriman data pertama.` (new key) |

**Scope fence:** the five English fallbacks at `:81,102,125,135,149` are backlog **999.2** — do **not** touch. CR-01 (`:56-67` hooks after early return) stays `open` — do **not** reorder.

---

### `src/pages/MonitoringPage.jsx` (page, series consumer) — **forced by D-04** (not in the phase note)

**Analog:** `src/context/InsoleContext.jsx:10` — the utils-constant import idiom:
```js
import { RISK_THRESHOLDS, inferRisk } from '../utils/randomForestRisk';
```

**Finding:** `MonitoringPage.jsx:21` imports `TELEMETRY_SERIES` from `TelemetryChart` and `:64` maps it:
```jsx
TELEMETRY_SERIES.map((series) => { const values = visible.map((r) => r.readings?.[series.key] ?? 0); … })
```
`03-CONTEXT.md:49` calls this re-export "currently-0-importer" — that is **inaccurate**; there is exactly one consumer. If the planner drops the re-export, `npm test`/`npm run build` break in Phase 3 (MonitoringPage is rebuilt in Phase 5, PAGE-02). Either (a) keep `export { TelemetryChart, SERIES as TELEMETRY_SERIES }` as a one-line alias, or (b) re-point this import to `../utils/series`. **Flag this decision explicitly in the plan.**

---

### `src/utils/i18n.js` (config, dictionary) — D-03 new keys

**Analog:** itself — the existing `admin.*` block at `:36-58` (id) with its parity twin at `:504-524` (en).

**Insertion shape** (`:38-43`, `:467-470`):
```js
'admin.accessDenied': 'Akses ditolak',
'admin.accessDeniedBody': 'Halaman ini hanya untuk administrator.',
// ...
'admin.users.empty': 'Belum ada pengguna terdaftar.',
// ...
'common.retry': 'Coba lagi',
'common.dismiss': 'Tutup',
'common.notAvailable': 'Tidak tersedia',
```
**Rules:** every new key must be added to **both** `id` and `en` (parity is asserted by `src/utils/i18n.test.js`); values ship as-is, so **no em dash** (the dash gate is `i18n.test.js` + `copy.test.js`); one sentence, ≤ ~120 chars; Indonesian only is the contract. `DICTIONARY` is a plain object (`:18`), `t(key, lang='id', vars)` at `:955`.

---

### `DESIGN.md` (doc, design authority) — D-04/D-05 amendment

**Analog:** itself, `:161-182` — the section being amended.

**Amend** the "Single source" paragraph (`:172-176`) to state: where the array lives (`web-dashboard/src/utils/series.js`), which charts must read it (`TelemetryChart`, `TrendChart`, `LoadDonut`), that `PlantarHeatmap` stays on risk tokens by design, and that `TrendChart`'s trace is carved out per D-05. The "Quarantine rule" (`:178-179`) stays. Phase 3 **proposes** the diff; the product owner signs (`03-CONTEXT.md:40`). Do not silently change any hex (F-01).

---

### NEW Alert/Banner primitive — `src/components/ui/<Name>.jsx` (component, event-driven)

**Analog:** `src/components/ui/StatusBanner.jsx` — **exact** role + data flow (inline feedback row, tone map, role-by-tone, dismiss control, action slot).

**Reuse directly** (`StatusBanner.jsx:52-79`):
```jsx
<div role={roleForTone(tone)}
  className={`flex items-start gap-3 rounded-card border p-4 ${config.tone} ${className}`.trim()}>
  <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${config.icon}`} aria-hidden="true" />
  <div className="min-w-0 flex-1">
    {title && <p className="font-medium text-fg">{title}</p>}
    {children && <div className="mt-1 text-body-sm text-fg-2">{children}</div>}  // M-01b: fg-2, not muted
    {action && <div className="mt-3">{action}</div>}
  </div>
  {onDismiss && (
    <button type="button" onClick={onDismiss} aria-label={dismissLabel}
      className="-m-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg">
      <X className="h-4 w-4" aria-hidden="true" />
    </button>
  )}
</div>
```
**Elevation:** no shadow (inline row, 1px tone border + 15% tone tint). **Radius:** `rounded-card` (16px). **Dismiss floor:** `h-11 w-11` + localised `aria-label` (`common.dismiss`) — asserted by `a11y.test.jsx:203-249` posture. **D-03:** require a named cause **and** a next action (an `action` element **or** an explicit `nextAction` string); `loading` is exempt from the next-action half only; a bad key degrades to a **declared** fallback and never blanks the view. Export name and prop names are the planner's (`03-CONTEXT.md:48`).

---

### NEW tone→role config module (config, static map)

**Analog:** `src/components/ui/StatusChip.jsx:19-32` — a module-level config map exported under a named alias (`export { StatusChip, LEVELS as STATUS_LEVELS }`, `:67`).

**The matrix** (`03-UI-SPEC.md:391-395`) — the single copy both registers read:
```js
// error, danger            -> role="alert"   (immediate)
// loading, info, success,
//   warning                 -> role="status"  (next pause)
// empty                     -> role: undefined (ordinary content)
```
Lives in **one** place (a new module, or an export of the new primitive `StatusBanner` imports) — `03-CONTEXT.md:48`. `StatePanel` and the new primitive both read it; no second copy may exist.

---

### NEW dev-warn helper `src/utils/devWarn.js` (utility, transform)

**Analog (partial):** `src/utils/i18n.js:975-979` — the tiny-exported-helper idiom:
```js
export const hasKey = (key) => …;
export const dictionaryKeys = () => Object.keys(DICTIONARY.id);
```
No dev-warn helper exists yet. Four fallback sites need it: `GlassButton.jsx:61`, `Chip.jsx:39`, `StatusChip.jsx:46` (no signal today) and `StatePanel`'s unknown-variant branch. Shape and location are the planner's (`03-CONTEXT.md:50`). Existing `console.warn` precedents are in `src/hooks/useAuth.jsx:45,62,88,120,126`. **Requirement:** warn in development, resolve to the declared fallback in production — never blank a clinical view.

---

### NEW `src/utils/series.js` (utility, static constants) — D-04

**Analog:** `src/utils/randomForestRisk.js` — a domain-constants module consumed by context and pages, with a colocated test.

**Module shape to copy** (`randomForestRisk.js:1-24`, `:143-147`):
```js
/** header block with the WHY, one reason per decision */
import { RISK_THRESHOLDS, SCORE_BANDS } from './fuzzyRisk';
export { RISK_THRESHOLDS, SCORE_BANDS };          // :24 — named re-export of the constants
export function inferRisk({ … } = {}) { … }        // :88
export function classifyRisk(peakPressure, sustainedDuration = 0) { … }   // :143
export default { RISK_THRESHOLDS, SCORE_BANDS, inferRisk, classifyRisk }; // :147
```
**Payload to move** (from `TelemetryChart.jsx:25-29`, verbatim): `{ key, varName, dash }` × 3 (`--series-1/2/3`). Export names/shape are the planner's (`03-CONTEXT.md:49`). The module must be `.js` (D-04 requires the quarantine gate to walk `.js`) — note `designTokens.test.js:45` collects **`.jsx` only**, which is exactly why a `.js` module needs its own guard.

---

### NEW `src/utils/series.test.js` (test, unit)

**Analog:** `src/utils/randomForestRisk.test.js` — the colocated test convention (import the module by relative path, assert the declared constants and the invariants).

**Import + assertion style** (`:1-7`, `:24`, `:44-46`):
```js
import { describe, it, expect } from 'vitest';
import { RISK_THRESHOLDS, SCORE_BANDS, inferRisk, classifyRisk } from './randomForestRisk';

it.each(cases)('peak %i kPa for %i s is %s', (pressure, duration, expected) => {
  expect(classifyRisk(pressure, duration)).toBe(expected);
});
```
5 of 7 utils modules ship a colocated test (`03-CONTEXT.md:94`). Assert: exactly three entries, keys `forefoot/midfoot/heel`, varNames `--series-1/2/3`, distinct dash patterns, no duplicate colours.

---

### NEW quarantine gate test (test, source sweep) — D-04

**Analogs:** `src/designTokens.test.js` (the sweep mechanics) + `src/copy.test.js:68-73` (the file-count floor).

**Sweep mechanics to copy** (`designTokens.test.js:39-50`, `:62-78`):
```js
const collectSources = (dir) => { /* recursive readdirSync, extensions filter */ };
// ... in the test:
const missing = [];
for (const file of collectSources(SRC)) { … if (!css.includes(escapeForCss(token))) missing.push(…); }
expect(missing).toEqual([]);
```
**Non-vacuity floor to copy** (`copy.test.js:66-73`):
```js
const files = collect(SRC);
it("walks the shipped .jsx sources rather than an empty list", () => {
  expect(files.length).toBeGreaterThan(40);   // a broken walk must fail loudly
});
```
**D-04 requires four properties:** a chart-file allowlist; a non-vacuity assertion that the allowlisted files **actually reference** `series.js`; a file-count floor; and **`.js` included in the walk** (existing sweeps walk `.jsx` only — `designTokens.test.js:45`, `a11y.test.jsx:59`, `copy.test.js:41`). Also assert the quarantine's negative half: the three series varNames appear **only** inside the allowed chart files (`DESIGN.md:178-179`). `IN-03` notes three sweeps lack the positive count — this gate adopts the idiom and may partly address it in passing.

---

### NEW anti-silent-fallback gate test (test, source sweep) — D-01

**Analog:** `src/copy.test.js:82-93` — the "positive half" assertion that would fail if a literal came back:
```js
const admin = fs.readFileSync(path.join(SRC, "pages", "AdminPage.jsx"), "utf8");
expect(admin).toMatch(/const\s+unavailable\s*=\s*t\(\s*["']common\.notAvailable["']/);
expect(admin.match(/\|\|\s*unavailable\b/g) || []).toHaveLength(2);
```
Plus the per-key assertions in `src/components/ui/StatusChip.test.jsx:24-66` (reads the module's own `STATUS_LEVELS` rather than re-typing). The gate fails on an undeclared literal `variant`/`tone`/`level` key at every call site (`03-UI-SPEC.md:421-427`) and **ships in the same commit** as the restored `warm`/`warmOutline` keys (D-01).

---

### NEW new-primitive test (test, rendered-DOM)

**Analog:** `src/components/ui/StatePanel.test.jsx` — exact: per-variant role assertions on a pure presentational component.

**Shape to copy** (`:24-113`):
```jsx
it("announces loading politely and reserves the space with skeletons", () => {
  render(<StatePanel variant="loading" title="Loading chart" />);
  const status = screen.getByRole("status");
  expect(status).toHaveAttribute("aria-live", "polite");
});
it("announces an error as an alert and offers a real retry control", async () => { … });
it("keeps an empty view out of every live region", () => {
  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.queryByRole("alert")).toBeNull();
});
it("treats an unknown variant as the benign empty shape", () => { … });   // :106 — the fallback contract
```
Assert for the new primitive: `alert` for error/danger, `status` for loading/info/success/warning, no live region for empty; the dismiss control is `h-11 w-11` with a localised `aria-label`; the action element is present or the `nextAction` string renders. `StatePanel.test.jsx:106` and `StatusChip.test.jsx:81` **encode the benign fallback and must not be inverted** (`03-CONTEXT.md:72`).

---

### NEW `src/components/ui/GlassButton.test.jsx` (test) — D-01

**Analog:** `src/components/ui/StatusChip.test.jsx:24-87` — per-key rendered-DOM assertions reading the module's own exported map.
```jsx
const toneTokens = (level) => STATUS_LEVELS[level].tone.split(" ");
// ... assert every token of the declared pair reached the element
```
Assert: `variant="warm"` and `variant="warmOutline"` each render their declared classes (`bg-warm-accent-deep` / `border-warm-line bg-warm-card text-warm-ink`), that neither falls back to `filled`, and that both keep `rounded-control` + `min-h-[44px]` + the `RING_PAIR`.

---

### NEW `src/components/ui/StatusBanner.test.jsx` (test) — D-02

**Analog:** `src/components/ui/StatePanel.test.jsx` — the delegate's register must be provably unchanged. Assert all six props (`tone/title/children/action/onDismiss/dismissLabel`) pass through and the role split still resolves from the shared matrix.

---

## Shared Patterns

### Shared focused-control contract (`RING_PAIR` + 44px floor)
**Source:** `src/components/ui/GlassButton.jsx:31-34,57-60` (reference implementation); asserted in `src/a11y.test.jsx:75,203-249`.
**Apply to:** every primitive touched here **and** the new Alert/Banner's action + dismiss controls.
```jsx
"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
// min-h-[44px] on touch, releasing to 36/40 only from `lg`; dismiss control: h-11 w-11
```
`a11y.test.jsx:136-175` is the source lock: any line that nulls the outline without a ring-2 fails.

### Class-composition idiom
**Source:** `src/components/ui/GlassCard.jsx:26-33` (also `Chip.jsx:35-43`, `GlassButton.jsx:56-67`).
**Apply to:** every new/modified primitive's className.
```jsx
className={[ "…", cond ? "…" : "…", className ].filter(Boolean).join(" ")}
```
Whole-literal class strings only — Tailwind cannot see interpolation (`BentoGrid.jsx:19-21,28-33`; `designTokens.test.js:56-79` fails a class with no generated rule).

### Module-level config map + exported alias
**Source:** `src/components/ui/StatusChip.jsx:19-32,67` (`LEVELS` → `STATUS_LEVELS`) and `Chip.jsx:14-23,52` (`TONES` → `CHIP_TONES`).
**Apply to:** the new tone→role config, `series.js`, and the dev-warn resolution.

### Ink-per-surface rule (M-01)
**Source:** the `-ink` pair discipline in `StatusChip.jsx:19-32`; measured table in `03-UI-SPEC.md:284-312`.
**Apply to:** `GlassTable.jsx:70` (→ `fg-2`), `StatusBanner.jsx:64` and `StatePanel.jsx:75` (→ `fg-2`), the new primitive's body. **Never** `muted` on `surface-2`/`surface-3`/any tone tint; never a chromatic token as 12–14px text (M-01c); the tone's own `-ink` on its own tint.

### One live-region discipline
**Source:** `src/pages/DashboardPage.jsx:422-425` (the single risk-change polite region); `StatePanel.jsx:27-33` (`role="status"` only while loading is on screen).
**Apply to:** the new primitive and every feedback surface. **No second always-mounted polite region** — success criterion 5.

### Comment-block-with-the-why
**Source:** every primitive (`GlassButton.jsx:3-19`, `GlassCard.jsx:3-16`, `StatusChip.jsx:4-18`, `LoadDonut.jsx:3-21`).
**Apply to:** every new file. This codebase documents the reason, not the mechanics; the planner's excerpts should carry the block.

### Colocated tests + filesystem source sweeps
**Source:** `src/utils/randomForestRisk.test.js` (colocated unit) and `src/designTokens.test.js` / `src/copy.test.js` / `src/a11y.test.jsx` (source sweeps with `collectSources` + a non-vacuity count).
**Config:** Vitest, `environment: 'jsdom'`, `globals: true`, `setupFiles: './src/setupTests.js'` (`vite.config.js:46-51`). Colocated `*.test.js(x)` beside the source.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| NEW dev-warn helper (`src/utils/devWarn.js`) | utility | transform | No dev-warn helper precedent; closest is the tiny-export idiom in `src/utils/i18n.js:975` and the `console.warn` usage in `hooks/useAuth.jsx`. Build from `03-CONTEXT.md:50` + D-01/D-03. |
| NEW quarantine gate test | test | source sweep | No existing gate walks `.js` or asserts an allowlist/quarantine; compose the idiom from `designTokens.test.js` + `copy.test.js:68-73`. |
| NEW anti-silent-fallback gate test | test | source sweep | No existing gate asserts a positive literal-key contract at call sites; compose from `copy.test.js:82-93`. |

## Forced Integration Edits (surface to the planner)

| File | Why it is in scope | Decision needed |
|---|---|---|
| `src/pages/MonitoringPage.jsx:21,64` | Consumes `TELEMETRY_SERIES`, the re-export D-04 relocates | Keep a one-line alias in `TelemetryChart.jsx`, **or** re-point the import to `../utils/series`. `03-CONTEXT.md:49` mislabels this re-export "0-importer". |
| `src/components/ui/GlassComponents.jsx` | Barrel must re-export the new primitive without dropping any legacy name (COMP-05) | Add the new name; change nothing else. |
| `DESIGN.md:161-182` | D-04/D-05 amendment (owner-signed) | Phase 3 proposes the diff; do not change any hex. |

## Preserve-Only (success criterion 5 — do not "improve")

- `DashboardPage.jsx:422-425` — the single `aria-live="polite"` region.
- Live pressure numbers stay `aria-live="off"`.
- `InsoleContext.jsx:319-326` — `autoConnect={Boolean(user)}` guard **intact**; its mismatch is WR-02, deliberately deferred (`03-CONTEXT.md:128`).

## Metadata

**Analog search scope:** `web-dashboard/src/components/ui/`, `web-dashboard/src/components/monitoring/`, `web-dashboard/src/components/dashboard/`, `web-dashboard/src/utils/`, `web-dashboard/src/pages/`, `web-dashboard/src/` (root gates), `DESIGN.md`.
**Files scanned:** 25 read in full or in targeted ranges; `git ls-files` verification on every named existing path (all tracked; no gitignored mirrors involved).
**Pattern extraction date:** 2026-10-18.
