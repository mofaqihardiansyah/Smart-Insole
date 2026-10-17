---
phase: "03"
slug: primitive-rebuilds
status: approved
reviewed_at: "2026-10-18"
shadcn_initialized: false
preset: none
contract_source: .planning/phases/01-design-system-audit-token-lock/01-UI-SPEC.md
contract_status: approved
design_authority: DESIGN.md
reused_by_decision: true
delta_only: true
created: "2026-10-18"
---

# Phase 03 — UI Design Contract: Primitive rebuilds

> **Provenance: this file is the delta layer, not a second contract.**
> The authoritative visual and interaction contract is
> `.planning/phases/01-design-system-audit-token-lock/01-UI-SPEC.md` (`status: approved`,
> verified by `gsd-ui-checker`), whose design authority is `DESIGN.md`. Phase 02 established
> the project's precedent (`02-UI-SPEC.md`): a phase that only *applies* an approved
> contract reuses it verbatim rather than authoring a phase-local copy, so nothing can drift
> out of sync.
>
> Phase 3 is that shape with five locked deltas. Every template section is present below;
> where a value is unchanged it **cites** its authoritative section in `01-UI-SPEC.md` and
> does not restate it. Where Phase 3 changes the contract, the change is stated concretely
> with its locked source (`03-CONTEXT.md` D-01…D-05), its measured consequence, and the
> gate that must stay green.

---

## Phase 3 Deltas at a Glance

| # | Delta | Locked by | Surface | Upstream authority |
|---|-------|-----------|---------|--------------------|
| D-01 | `GlassButton` regains `warm` + `warmOutline` (landing CTA register); the anti-silent-fallback gate case ships in the same commit; backlog 999.1 marked superseded, not deleted | `03-CONTEXT.md` D-01 | `src/components/ui/GlassButton.jsx` + the gate test | `DESIGN.md:436` (`warm-accent-deep` = button fill); 01-UI-SPEC `## Visual Registers` |
| D-02 | One new Alert/Banner primitive owns the tone→role matrix; `StatePanel` keeps the centred-block register untouched; `StatusBanner` becomes a delegate; both legacy names stay exported | `03-CONTEXT.md` D-02 | the new primitive, `StatusBanner.jsx`, `StatePanel.jsx` | COMP-03, COMP-05; 01-UI-SPEC `## Accessibility Contract` |
| D-03 | A named cause **and** a next action are both required on every feedback surface; the next action is an `action` element **or** an explicit `nextAction` string; test-enforced, dev-warned, benign production fallback; the five `AdminPage` call sites repaired in-phase | `03-CONTEXT.md` D-03 | the new primitive, `AdminPage.jsx`, `i18n.js` | `DESIGN.md:366-367`; FIX-08 |
| D-04 | One CVD-safe `SERIES` source moves to `src/utils/series.js`; `TelemetryChart`, `TrendChart`, `LoadDonut` consume it; the donut's caller-supplied arc colours are deleted; quarantine gate | `03-CONTEXT.md` D-04 | `series.js` + colocated test, three charts, `DashboardPage.jsx:386/392/398` | `DESIGN.md:161-182` (amended by D-04) |
| D-05 | `TrendChart`'s trace stays the non-identity `--secondary` sage line, carved out of the series set | `03-CONTEXT.md` D-05 | `src/components/monitoring/TrendChart.jsx` | `DESIGN.md:349` (amended by D-05) |
| C-01 | Undeclared motion resolved at the two carried-forward sites | `03-CONTEXT.md` carry-forward | `GlassButton.jsx:58`, `StatePanel.jsx:41` | `DESIGN.md:283-302` (MOTION 1) |
| C-02 | Every radius in the `Glass*`/chip primitives resolves to the declared scale | `03-CONTEXT.md` carry-forward | `src/components/ui/*.jsx` | 01-UI-SPEC `## Radius Scale`; `DESIGN.md:254-262` |
| C-03 | The pre-existing half-step (6/10/14px) spacing inside this phase's own primitives is carried **unchanged** and enumerated in full as an owned non-conformance set; the phase authors no new step and no exception | `03-CONTEXT.md` carry-forward (spacing is outside the Phase 2 deferral ledger, `02-CONTEXT.md` D-11) | the `Glass*`/chip primitive files | 01-UI-SPEC `## Spacing Scale` |
| M-01 | Ink-per-surface rule: secondary text on a tint or a raised surface takes `fg-2`, never `muted` | derived (measured default, not a user decision) | `GlassTable.jsx:70`, `StatusBanner.jsx:64`, `StatePanel.jsx:75` | `DESIGN.md:359` ("measured, never eyeballed") + the ink-pair rule `DESIGN.md:128-144` |
| F-01 | `DESIGN.md`'s white-surface contrast column disagrees with a re-measurement on **five** chromatic tokens; four verdicts flip (`safe`, `warning`, `secondary`, `tertiary`) and one holds (`danger`) | reported, needs an owner-signed amendment | the palette table, not a component | see `## Reported Non-Conformances` |

---

## Design System

Unchanged from 01-UI-SPEC `## Design System`. Phase 3 introduces no dependency, no preset and no registry.

| Property | Value |
|----------|-------|
| Tool | none (no shadcn, no `components.json`, no design-system package — custom token layer) |
| Preset | not applicable |
| Component library | none (first-party `Glass*` primitives; `Tool: none` means no CLI/registry, not no design system) |
| Icon library | `lucide-react@1.55.0` (resolved from `web-dashboard/package.json`) |
| Font | Plus Jakarta Sans (headings), DM Sans (body/labels/data), Fira Code (vitals/code) |

Phase 3 adds **no** new runtime dependency. `framer-motion` and `swiper` are installed but
imported by nothing under `src/`; they are not part of this phase and must not be adopted here.

---

## Component Inventory

Enumerated by `ls src/components/ui/*.jsx src/components/dashboard/*.jsx src/components/monitoring/*.jsx src/components/PlantarHeatmap.jsx | grep -v '\.test\.' | wc -l` — 20 components — first-party (no package; app resolves as `smart-insole-web-dashboard@0.1.0` from `web-dashboard/package.json`) — 2026-10-18.

Phase 01 ran the same gate and recorded `Could not enumerate:` with source-inspection provenance; this line replaces it with a re-runnable command now that the primitives are the subject of the phase. The table is **non-exhaustive** and never a closed allowlist.

| Component | Import path | Phase 3 disposition |
|-----------|-------------|---------------------|
| GlassCard | `src/components/ui/GlassCard.jsx` | COMP-01 — conform; no contract change |
| GlassButton | `src/components/ui/GlassButton.jsx` | COMP-01 + **D-01** (two variants restored) + **C-01** (motion) |
| GlassInput | `src/components/ui/GlassInput.jsx` | COMP-01 — conform; no contract change |
| GlassTable | `src/components/ui/GlassTable.jsx` | COMP-01 + **M-01** (column-head ink) |
| GlassForm | `src/components/ui/GlassForm.jsx` | COMP-01 — conform; no contract change |
| StatusChip | `src/components/ui/StatusChip.jsx` | COMP-02 — conform (three channels are the contract) |
| Chip | `src/components/ui/Chip.jsx` | COMP-02 — conform; tone vocabulary unchanged |
| StatusBanner | `src/components/ui/StatusBanner.jsx` | **D-02** delegate + **M-01** |
| StatePanel / StateRetry | `src/components/ui/StatePanel.jsx` | **D-02** keeps its register + **C-01** motion + **M-01** |
| Alert/Banner (new) | name is the planner's (`03-CONTEXT.md` discretion) | **D-02 + D-03** — the new primitive |
| GlassIcon, PanelHeader | `src/components/ui/GlassCard.jsx` (`:107` exports `{ GlassCard, GlassIcon, PanelHeader }`) | consumed; unchanged |
| PageHeader | `src/components/ui/PageHeader.jsx` (its own file; `:35` exports `{ PageHeader }`) | consumed; unchanged |
| GlassComponents barrel | `src/components/ui/GlassComponents.jsx` | COMP-05 — every legacy name stays exported |
| GlassForm's second barrel | `src/components/ui/GlassForm.jsx:111-120` | COMP-05 — zero consumers today; Phase 4's shell starts using it |
| TrendChart | `src/components/monitoring/TrendChart.jsx` | **D-04** consumes the source + **D-05** carve-out |
| TelemetryChart | `src/components/monitoring/TelemetryChart.jsx` | **D-04** — stops being the palette authority |
| LoadDonut | `src/components/dashboard/LoadDonut.jsx` | **D-04** — caller colours deleted |
| PlantarHeatmap | `src/components/PlantarHeatmap.jsx` | **COMP-04**: shares zone keys, imports no series colour — already satisfied, no change |
| BentoGrid / BentoCell | `src/components/dashboard/BentoGrid.jsx` | phase-owned file; height assertion left to the planner (see `## UI Considerations`) |
| `series.js` (new) | `src/utils/series.js` + colocated test | **D-04** — the single source |

---

## Theme Contract

Unchanged from 01-UI-SPEC `## Theme Contract`. Light only; `color-scheme: light` on `:root`
and `.landing-scope`; no `.dark` block, no `dark:` utility, no theme toggle. Phase 3 adds
nothing and removes nothing here.

---

## Visual Registers (never mixed within one surface)

Unchanged from 01-UI-SPEC `## Visual Registers`. Phase 3's only register change is **D-01**,
and it is a repair rather than a new register: the landing's CTAs currently render the
app-register navy button at all eight call sites, because `VARIANTS` carries neither
`warm` nor `warmOutline` (`GlassButton.jsx:20-28`; the keys were dropped by `8d9dd996`, before
the Phase 2 base). `VARIANTS[variant] || VARIANTS.filled` then silently substitutes the app
fill, so the two registers bleed together on `/`.

Restored keys, verbatim from D-01:

| Key | Classes | Register |
|-----|---------|----------|
| `warm` | `bg-warm-accent-deep text-white hover:opacity-90 border border-transparent` | landing only |
| `warmOutline` | `border border-warm-line bg-warm-card text-warm-ink hover:bg-warm-raised` | landing only |

Contract for the pair:

- `warm` / `warmOutline` are **landing-register-only**. Never passed from an app page.
- The eight call sites (`LandingPage.jsx:227,235,279,286,391,400,730,739`) already pass both keys; **no page edit is required** in this phase.
- Both keys keep the shared control contract: `rounded-control` (8px), the `min-h-[44px]` floor
  with its `lg` release, and the `focus-visible:ring-2 ring-primary ring-offset-surface` pair.
  `a11y.test.jsx:203-225` asserts those on the shared component, so a landing-only variant is
  what would have broken them; restoring keys cannot.
- `warm` is a filled button on `warm-accent-deep` `#C93A24`; white on it measures 5.13:1
  (`DESIGN.md:436`) and is the landing's only text-safe accent. `warm-accent` `#E34A32` is
  graphics-only and never a button fill or a label.
- The mechanism rejected by D-01 is not to be used: `.landing-scope` must **not** remap
  `--primary-btn` (`index.css:272` already does), because `LanguageToggle` renders inside that
  scope (`LandingPage.jsx:225`) and nine non-button `bg-primary-btn` consumers share the token.

---

## Spacing Scale

Inherited from 01-UI-SPEC `## Spacing Scale` (xs 4 / sm 8 / md 16 / lg 24 / xl 32 / 2xl 48 /
3xl 64; multiples of 4 only).

**Phase 3's spacing rule is multiples of 4 only: the phase authors no new step and declares no
exception.** Every value Phase 3 writes or changes lands on the scale. The half-step values
that survive in this phase's files are therefore not an exception authored here — they are an
inherited, measured, pre-existing **non-conformance** set, enumerated in full under C-03,
carried unchanged, and owned. One posture is stated, not two.

Two inherited statements carry forward verbatim:

- Touch targets: every interactive control keeps its `min-h-[44px]` floor on touch, releasing
  to 36/40px only from `lg` (`GlassButton.jsx:31-32`, `GlassInput.jsx:58`,
  `GlassForm.jsx:38`, `StateRetry`, `StatusBanner`'s dismiss at `h-11 w-11`). The new
  Alert/Banner's dismiss control takes the same `h-11 w-11` floor.
- Panel padding stays on the scale (`p-6` card, `px-6 py-4` data cells, `px-6 pb-3 pt-5`
  header) **with one exception that is not an exception**: the column-head cell takes
  `px-6 py-3.5` (14px). That is C-03's first row and is listed there, not here.

### C-03 — carried spacing non-conformances (complete for this phase's files)

Measured 2026-10-18 across the primitives COMP-01/COMP-02 rebuild (`GlassCard`, `GlassButton`,
`GlassInput`, `GlassTable`, `GlassForm`, `StatusChip`, `Chip`) plus the two other in-scope
files that carry a half-step value (`PageHeader`, `StatePanel`). `GlassCard.jsx` and
`GlassButton.jsx` carry none. Every off-grid value is listed; none is a declared exception and
none is cleared by Phase 3.

Phase 3 carries all nine rows **unchanged**. Normalising them to `sm`/`md` moves every
primitive's measured height across the app and is a spacing decision with its own
three-breakpoint click-through, not a side effect of COMP-01/COMP-02. The list is complete so
the planner cannot mistake a retained violation for a settled value.

| Site | Off-grid value (px) | Owner |
|------|---------------------|-------|
| `Chip.jsx:36` | `gap-1.5` (6), `px-2.5` (10) | Backlog 999.x (source phase 03) |
| `GlassForm.jsx:16` | `space-y-1.5` (6) | Backlog 999.x (source phase 03) |
| `GlassInput.jsx:41` | `space-y-1.5` (6) | Backlog 999.x (source phase 03) |
| `GlassInput.jsx:58` | `px-3.5` (14), `py-2.5` (10) — the field; its `min-h-[44px]` floor is on the scale | Backlog 999.x (source phase 03) |
| `GlassTable.jsx:67` | `px-6 py-3.5` — the `th` cell (14); the `td` branch's `py-4` is on the scale | Backlog 999.x (source phase 03) |
| `PageHeader.jsx:22` | `mt-1.5` (6) | Backlog 999.x (source phase 03) |
| `StatePanel.jsx:75` | `mt-1.5` (6) | Backlog 999.x (source phase 03) |
| `StatusChip.jsx:35` | `gap-1.5` (6), `px-2.5` (10), `h-3.5 w-3.5` (14) — the `sm` box and icon | Backlog 999.x (source phase 03) |
| `StatusChip.jsx:37` | `px-3.5` (14), `py-1.5` (6) — the `lg` box; its `gap-2` is on the scale | Backlog 999.x (source phase 03) |

**Owner.** These are the class of violation Phase 01's review scored at pillar 5 (2/4), and no
locked decision covers them: `02-CONTEXT.md` D-11's deferral ledger named motion and radius
only, and no phase in `ROADMAP.md` owns a spacing pass — COMP-01/COMP-02 rebuild these files
"against `DESIGN.md`", which declares no spacing scale at all. The owner is therefore a single
backlog item on the project's existing 999.x pattern (`Source phase: 03`, the slot `999.1` /
`999.2` occupy), opened by the planner; Phase 6's GATE-04 sweep is the net that proves this
enumeration is complete. Naming the owner is what keeps the finding from evaporating at plan
time.

---

## Typography

Unchanged from 01-UI-SPEC `## Typography` (the full locked scale, deferred to `DESIGN.md` as
authoritative). Phase 3 declares **no new size and no new weight**: every size and weight
used by an in-scope primitive arrives through a token that already carries it.

| Token used by the primitives | Size | Weight | Where in Phase 3 |
|------------------------------|------|--------|------------------|
| `label` | 12px | 600 | table column heads, banner eyebrow |
| `chip` | 12px | 600 | StatusChip, Chip, deltas |
| `caption` | 12px | 500 | stat captions, timestamps |
| `body-sm` | 14px | 400 | banner body, field hint/error, card subtitle |
| `data` | 14px | 400 | inputs, tabular cells |
| `body-base` | 15px | 400 | table cells, nav labels, page subtitle |
| `card-title` | 20px | 700 | every `PanelHeader` |
| `stat` | 30px | 700 | metric values |

Uppercase stays reserved for table column heads and chips (`DESIGN.md:211-214`). Every kPa
figure keeps `tabular-data` / `tabular-nums`.

⚠ Reported, not owned: `LoadDonut.jsx:79,89` hand-rolls SVG type with raw
`fontSize="26"` / `fontSize="10"` + `letterSpacing="0.1em"` instead of a token — the 10px
unit label is below the declared 12px caption floor and below `micro` (11px), which matters
for this product's elderly audience. `designTokens.test.js` scans Tailwind classes, so raw SVG
attributes sit outside the token gate. Not in D-04's alignment scope; flagged for the planner
(cheapest conforming move: the ring-centre unit takes the declared `micro` metrics).

---

## Color

Unchanged from 01-UI-SPEC `## Color`: the 60/30/10 split (`bg` `#F8FAFC` dominant; `surface` /
`surface-2` / `surface-3` secondary; `primary` `#0F172A` accent), the accent-reserved-for list
(solid primary button fill, text links, focus ring, active nav highlight — never decorative),
and the risk semantics with their `-ink` pairs. Colour is a vital sign: nothing decorative is
saturated.

### Phase 3 colour deltas

**1. The series set becomes one source and stays quarantined (D-04).** Okabe-Ito, measured
against white: `series-1` `#0072B2` 5.19:1, `series-2` `#D55E00` 3.87:1, `series-3` `#009E73`
3.42:1. All three are lines/strokes, so all three clear the 3:1 graphical-object bar.
`src/utils/series.js` owns key + `varName` + dash; every stroke, dot, legend swatch and
screen-reader table row reads from it. **Quarantine rule (`DESIGN.md:178-179`):** the three
series colours appear *only* inside the charts — never in a button, badge, navigation item or
heading. The donut's arcs move from caller-supplied colours to the series source
(`DashboardPage.jsx:386/392/398` deletes them), which also closes a live defect: the
`--border-strong` arc resolves to `#E2E8F0`, 1.3:1 (`DESIGN.md:118`), failing the 3:1 bar,
where `--series-3` measures 3.42:1. `PlantarHeatmap` keeps the risk tokens by design (it
encodes pressure magnitude, not identity) and imports no series colour.

**2. `TrendChart` is carved out of the series set (D-05).** Its single peak trace keeps the
declared `--secondary` sage line and the 12% sage area tint. It is a non-identity trace: the
panel answers "is the peak climbing", and drawing it from `--series-1` would falsely read
"blue = forefoot" on a panel that is deliberately not zone-identified. The carve-out is
written into `DESIGN.md` beside the D-04 amendment. Note: `--secondary` `#059669` is a
**stroke/graphic token only** — it measures 3.77:1 on white (see F-01), so it clears the 3:1
a graphical object needs and must never carry a label. D-05's decision is unaffected.

**3. The landing action colour (D-01).** `warm` fills on `warm-accent-deep` `#C93A24` with
white text (5.13:1, `DESIGN.md:436`). `warmOutline` takes `border-warm-line` + `text-warm-ink`
on `warm-card` (`warm-ink` on white measures 13.22:1). `warm-accent` is never a fill behind
text and never a label.

**4. Destructive.** The `danger` GlassButton is the only destructive fill: `#DC2626` with white
text, measured **4.83:1** (passes AA for normal text; do not restate `DESIGN.md`'s 5.9:1 — see
F-01). `danger-ink` may not be used as a fill: `DESIGN.md:141-144` gives one meaning exactly one
pair, and the ink is for text **on** that meaning's tint.

⚠ unresolved — planner must treat as assumption. **The danger hover fill is a no-op.**
`--danger-hover: 220 38 38` (`index.css:58`) is byte-identical to `--danger`, so
`hover:bg-danger-hover` (`GlassButton.jsx:27`) changes nothing on hover, and `DESIGN.md`
declares no `danger-hover` token at all. The phase must either (a) give the token its own
darker red as an owner-signed `DESIGN.md` addition — the same posture as the D-04 amendment,
and the value must measure ≥4.5:1 against white text — or (b) ship the danger variant with no
hover step and record it as a defect for the owner. Do **not** invent a hex inside
`GlassButton.jsx`: no component hard-codes a colour in this codebase, and `danger-ink` is not
available for this use.

### Ink per surface — measured 2026-10-18

The primitives ship several text/background pairs that were never measured as pairs (only the
values were). Re-measured with the WCAG 2.x relative-luminance formula — the same method
reproduces `DESIGN.md`'s ink-pair table exactly (danger-ink 6.56, warning-ink 6.10, safe-ink
6.03, secondary-ink 6.40, `#059669` on its tint 3.14, `#16A34A` on its tint 2.78). The rule
below is the contract; it holds under either reading of the white-surface column (F-01).

| Surface | Secondary text ("subtitle, description, caption") | Measured | Verdict |
|---------|---------------------------------------------------|----------|---------|
| `surface` `#FFFFFF` | `muted` | 4.76:1 | passes AA |
| `bg` `#F8FAFC` | `muted` | 4.55:1 | passes AA |
| `surface-2` `#F1F5F9` | `muted` | **4.35:1** | **fails AA** → use `fg-2` (9.45:1) |
| `surface-3` `#E2E8F0` | `muted` | **3.86:1** | **fails AA** → use `fg-2` |
| any risk/`.info` 15% tint | `muted` | **3.75–4.11:1** | **fails AA** → use `fg-2` (8.17–8.93:1) |
| any 15% tint | the tone's own `-ink` | 6.03–6.56:1 | the declared pair; use it for the tone's own text and glyphs |
| white `/` `#FFFFFF` | `fg` 17.85:1, `fg-2` 10.35:1 | — | primary and secondary ink on a white plane |

Consequences that are now contract:

- **M-01a — table column head.** `GlassTable.jsx:70` renders `bg-surface-2` + `text-muted`
  = 4.35:1 at 12px, which fails AA. The head takes `fg-2` (9.45:1) and keeps `text-label
  uppercase`. This is the one visible ink change in `GlassTable`.
- **M-01b — feedback body on a tint.** `StatusBanner.jsx:64` and `StatePanel.jsx:75` render
  their body/description in `text-muted` on a tone tint: 3.75:1 on `bg-danger/15` (the error
  and danger registers), 4.09:1 on warning, 4.02:1 on safe, 4.11:1 on info. All four fail AA.
  The description takes `fg-2` (8.17–8.93:1 on the same tints). The title keeps `fg`
  (14.08–15.36:1) and the tone's icon keeps its `-ink`.
- **M-01c — accents are not text tokens.** Measured as text on white: `safe` 3.30:1,
  `warning` 2.94:1, `secondary` 3.77:1, `tertiary` 2.77:1 — none may carry 12–14px text
  (all four are re-measurements that disagree with `DESIGN.md`; see F-01).
  `danger` measures 4.83:1 and passes, so `GlassInput`'s field error
  (`GlassInput.jsx:86`, `text-danger` on `surface`) may stay exactly as it is. Risk text is
  always the tone's `-ink` on that tone's tint.
- **M-01d — glyphs on a tint.** The dismiss `X` and every banner/chip glyph stays ≥3:1 on its
  tint: `muted` (3.75–4.11:1) is the floor and is acceptable for a glyph, the `-ink` pair
  (6.03–6.56:1) is what carries meaning.

---

## Radius Scale

Unchanged from 01-UI-SPEC `## Radius Scale` (sm 4 / control 8 / tile 12 / card 16 / full) plus
the landing set. Phase 3's delta is the carried-forward **C-02**, now stated as a rule:

| Element in Phase 3's files | Radius | Token |
|----------------------------|--------|-------|
| Buttons, inputs, selects, chips (filter), switch hit area, banner action, dismiss | 8px | `rounded-control` |
| Icon tiles, inner panels, dropdown/drawer items | 12px | `rounded-tile` |
| Cards, panels, banner surface, modal | 16px | `rounded-card` |
| Status pills (StatusChip), the switch track and thumb | full | `rounded-full` |
| Badges, small tags | 4px | `rounded-sm` |

- No arbitrary value (`rounded-[…]`) may appear in `src/components/ui/` — there is none today,
  and this keeps it that way.
- No default-scale alias may appear either: `rounded-xl` (= 12px) and `rounded-2xl` (= 16px)
  name one value twice and are exactly the ambiguity the shadow rename removed. Use
  `rounded-tile` / `rounded-card`.
- **Bare `rounded` is not allowed in these files** (DEFAULT 8px duplicates `control`; one value,
  two names). Today's one site is `StatePanel.jsx:41` (skeleton bar) — it becomes
  `rounded-sm` (4px, a bar) or `rounded-control`; either is a declared step.
- The switch track's `rounded-full` (`GlassForm.jsx:93`; the thumb's own is at `:101`) is the
  one documented exception, explained in the block comment at `GlassForm.jsx:59-61`: a
  toggle's shape convention carries meaning. Cards are never pills.

---

## Elevation

Unchanged from 01-UI-SPEC `## Elevation` (app: `panel` / `sm` / DEFAULT / `md` / `lg` /
`overlay` / `fab`; landing: `card` / `lift` / `nav` / `glow`; one elevated token per surface).

Phase 3's delta is a constraint, not a value:

- The rebuilt `GlassCard`, `GlassTable` frame and `StatePanel` keep `shadow-panel`
  (or `shadow-md` for `elevated`). No new elevation token and no new shadow utility.
- The new Alert/Banner is an **inline row, not a floating surface**: it draws a 1px tone border
  and a 15% tone tint on the card surface and takes **no shadow**. `overlay` stays modal-only
  (`AlertModal`); `lg` stays the dropdown token (`RowMenu`, `AppSearch`).
- Hover must not add elevation anywhere in this phase's primitives.

---

## Motion (MOTION 1)

Unchanged from 01-UI-SPEC `## Motion`. `DESIGN.md:283-297` permits only colour/border and the
single `scale-105` on the floating control, on hover and focus, at ≤150ms; the heatmap
danger-node pulse; number transitions on value change; and one reduced-motion-aware scroll.
Phase 3 resolves the two carried-forward violations (**C-01**) and adds nothing:

| Site | Today | Phase 3 contract |
|------|-------|------------------|
| `GlassButton.jsx:58` | `transition-colors duration-150 active:translate-y-[1px]` | Keep `transition-colors duration-150`. **Remove `active:translate-y-[1px]`** — a translate is not in MOTION 1's permitted list, and press feedback belongs to colour/border. |
| `StatePanel.jsx:41` | `h-4 animate-pulse rounded bg-surface-3` | **Remove `animate-pulse`.** The skeleton bars stay (they reserve the space so the layout does not jump) and become static. Nothing inside the loading register animates; `role="status"` + `aria-live="polite"` remain the announcement channel. |

Verified scope: `animate-pulse` at `StatePanel.jsx:41` is the only `animate-*` in the app
outside `PlantarHeatmap`'s danger-node pulse, which `DESIGN.md:290` permits and
`PlantarHeatmap.jsx:55` already gates behind `prefers-reduced-motion: reduce`. No primitive
adds a scroll listener.

Not owned, reported once: `GlassForm.jsx:101` transitions the switch thumb
(`transition-transform duration-150`). It is outside the deferral ledger; the thumb's
*position* carries state, so a strict MOTION 1 reading would keep the position change and drop
the transition. Planner's call, not a Phase 3 obligation.

---

## Accessibility Contract

Unchanged from 01-UI-SPEC `## Accessibility Contract`. Phase 3's deltas:

**1. One tone→role matrix, owned by the new primitive (D-02).** Today `role` is chosen in two
separate files — by tone in `StatusBanner.jsx:53`, by variant in `StatePanel.jsx:50-63`. The
new Alert/Banner owns a single shared config and both registers read it:

| Register state / tone | `role` | Announced |
|-----------------------|--------|-----------|
| `error`, `danger` | `alert` | immediately |
| `loading`, `info`, `success`, `warning` | `status` | at the next pause |
| `empty` | none (ordinary content with a heading) | in reading order |

- The config lives in one place (a new module, or an export of the new primitive that
  `StatusBanner` imports — planner's discretion). No second copy of the matrix may exist.
- A `status`/`alert` element exists **only while there is something on screen to announce**.
  Nothing in this phase may mount an always-on polite region: the single risk-change region
  stays `DashboardPage.jsx:423`, and a second always-mounted one is a regression (`03-CONTEXT.md`
  D-02 rejected the option that risked exactly that).
- `StatusBanner` becomes a delegate so all **13** call sites in **8** files keep working
  (`grep -ro '<StatusBanner' src/`); its props stay `tone`, `title`, `children`, `action`,
  `onDismiss`, `dismissLabel`. Its dismiss control keeps `h-11 w-11` and a localised
  `aria-label` (`common.dismiss` = `Tutup`).
- `StatePanel` keeps its register untouched, including the `ErrorBoundary.jsx:2` direct-path
  import, so **FIX-08 and FIX-10 provably cannot regress**. All **33** occurrences in **10**
  files keep working. The five repaired call sites in `AdminPage.jsx` gain a cause + next
  action; they do not change register.

**2. Cause AND next action, two-tier (D-03).** Every feedback surface carries a named cause
**and** a next action. The next action is satisfied by either an `action` element (a retry
button) or an explicit `nextAction` string for states that legitimately have no button.
`loading` is exempt from the next-action half by nature — it still requires a named cause.
Enforcement: test-enforced, dev-warned, and a benign declared production fallback, so a bad key
degrades to a declared default and **never blanks a clinical view**. The existing assertions
that encode the benign fallback (`StatusChip.test.jsx:81`, `StatePanel.test.jsx:106`) stay
valid — they must not be inverted.

**3. Anti-silent-fallback gate (D-01).** `VARIANTS[variant] || VARIANTS.filled`
(`GlassButton.jsx:61`) is the defect shape of this codebase: it produced both shipped defects
(the eight collapsed CTAs and a grey tile for a healthy reading). The gate case that fails on an
undeclared literal `variant` / `tone` / `level` key at every call site ships **in the same commit**
as the restored keys. The same posture covers `Chip.jsx:39`, `StatusChip.jsx:46` and
`StatePanel`'s unknown-variant branch. A computed key warns in development and resolves to the
declared fallback in production.

**4. Risk is never colour alone** — preserved unchanged: `StatusChip` keeps three redundant
channels (a distinct icon shape per level, a text label, the colour), asserted per level in
`StatusChip.test.jsx`.

**5. Focus, targets and reduced motion** — preserved: the `focus-visible:outline-none` +
`focus-visible:ring-2` pair (`RING_PAIR`, `a11y.test.jsx:75`) on every interactive element,
the 44px floor with its `lg` release, and `prefers-reduced-motion` respect.

**6. Preserve-only: the realtime data contract (success criterion 5).** Unchanged and not to be
"improved": `aria-live="off"` on live pressure numbers, **exactly one** `aria-live="polite"`
region for risk-level changes (`DashboardPage.jsx:423`), and
`autoConnect={Boolean(user)}` (`InsoleContext.jsx:319-326`) intact. **Do not correct that guard
in this phase** — its mismatch is WR-02, deliberately deferred and still `open`.

---

## Copywriting Contract

Language: **Indonesian only** (Bahasa Indonesia), no language switch (`LANG-01` is Phase 5).
No em dashes in shipped copy — a middot `·` or a pipe `|` separates ideas. No "No data". No
fabricated telemetry.

Phase 3 authors two kinds of copy and nothing else: the state strings D-03 requires, and the
labels the new primitive surfaces. Everything else is cited from upstream.

| Element | Copy | Source |
|---------|------|--------|
| Primary CTA | none authored in Phase 3. The restored `warm` / `warmOutline` variants render the eight existing landing labels unchanged; the phase's own action labels are the existing `common.retry` = `Coba lagi` and `common.dismiss` = `Tutup` | D-01; `i18n.js:467-468` |
| Empty state heading (users) | `Belum ada pengguna terdaftar.` | existing key `admin.users.empty` |
| Empty state body / next step (users) | `Minta pengguna mendaftar akun agar muncul di daftar ini.` | **authored here** (new key, planner names it) — the site at `AdminPage.jsx:182` currently ships a title only |
| Empty state heading (devices) | `Belum ada perangkat yang melaporkan data.` | existing key `admin.devices.empty` |
| Empty state body / next step (devices) | `Periksa sambungan perangkat, atau tunggu kiriman data pertama.` | **authored here** (new key) — `AdminPage.jsx:266` ships a title only |
| Error state (access denied) | cause `Akses ditolak` + `Halaman ini hanya untuk administrator.` + next action `Hubungi administrator bila Anda memerlukan akses.` | causes are existing keys `admin.accessDenied` / `admin.accessDeniedBody`; the next action is **authored here** (new key) for `AdminPage.jsx:61` |
| Error state (users) | cause `Gagal memuat pengguna` + next action `Muat ulang halaman untuk mencoba lagi.` (or a retry button labelled `Coba lagi` if the planner wires one — no reload function exists today) | cause is existing key `admin.users.error`; next action **authored here**; `AdminPage.jsx:180` |
| Error state (devices) | cause `Gagal membaca status perangkat` + next action `Muat ulang halaman untuk mencoba lagi.` | cause is existing key `admin.devices.error`; next action **authored here**; `AdminPage.jsx:264` |
| Destructive confirmation | none in Phase 3. The `danger` variant carries its verb (`Hapus`) and its confirmation lives at the call site; the primitives do not own confirmation copy | out of scope (AdminPage/AlertModal copy is Phase 5) |
| Punctuation / separators | middot `·` or pipe `|`; never an em dash | `DESIGN.md:383`; `copy.test.js` |
| Unavailable values | `Tidak tersedia` (`common.notAvailable`), never an ASCII placeholder | `i18n.js:470` |

Copy rules for the authored strings:

- One sentence, ≤ ~120 characters, so each fits the state block without a second line of prose.
- Cause names what failed; next action names what the reader can do. Neither ever says "No data"
  or "Data kosong".
- The strings live in `i18n.js` and pass the dash guard; they are not literals in JSX.
- **Scope fence:** this phase repairs the five cause-with-no-next-action sites only. The five
  English error fallbacks on the same file (`AdminPage.jsx:81,102,125,135,149`) are backlog
  **999.2** and must not be absorbed, and CR-01 (hooks after the early return) stays `open`.

---

## UI Considerations

> Populated by the ui-phase UI-consideration probe (Step 9.5) and lifted by plan-phase's
> `## UI Considerations` lift rule via the identical rule as SPEC `## Edge Coverage`.
> Shape-rooted UI *state* coverage (empty / loading / error / populated / partial / overflow /
> zero-one-many / long-text). Empty-state and error-state COPY live in `## Copywriting
> Contract` above — this section covers state coverage and REFERENCES those rows rather than
> restating the copy.

Applicable state considerations resolved: 16 covered, 1 backstop, 1 unresolved.

| Category | Element(s) | Status | Resolution / Reason |
|----------|------------|--------|---------------------|
| empty | StatePanel, the new Alert/Banner's empty register (`list-collection`) | ✅ covered | A zero-row data view renders StatePanel's empty register with a title and a next action (`StateRetry` or a declared string), never a bare paragraph. The five `AdminPage` branches are the last title-only sites and are repaired in-phase per `## Copywriting Contract`. |
| empty | LoadDonut (`media`) with all three zone values at zero | ✅ covered | With `sum === 0` the share is 0 for every segment, so no arc is drawn and the ring centre states the whole as 0. The share computation never divides by zero (`LoadDonut.jsx:40`). |
| empty | TrendChart / TelemetryChart (`media`) with an empty ring buffer | ✅ covered | An empty buffer renders no plot at all (`if (!history.length) return null` in both charts); the caller shows StatePanel's empty register. An empty chart is never drawn as an empty axis frame. |
| loading | StatePanel loading register, charts while the source is connecting | ✅ covered | Loading announces itself with `role="status"` + `aria-live="polite"` and reserves space with skeleton rows shaped like the incoming content. After the Motion delta nothing inside it animates. |
| error | StatePanel error, banner `danger`, GlassInput field error | ✅ covered | Every failure renders `role="alert"`, a named cause and a next action (element or string), and its description ink is the measured ink for the surface behind it (see `## Color`). Field errors also set `aria-invalid` + `aria-describedby`. |
| populated | charts, feedback surfaces | ✅ covered | A populated chart renders its plot, its legend and the screen-reader table from one model (a screen reader cannot read a polyline). A populated banner keeps its icon, title, body and exactly one action. |
| partial | TrendChart / TelemetryChart with fewer points than the window | ✅ covered | A partially filled buffer draws only the points it has: the X scale is `count <= 1` guarded, the area polygon closes only when `count > 1`, and no value is interpolated, repeated or invented to fill the window. |
| partial | GlassForm with some fields filled and others untouched | ✅ covered | State is per field: an untouched field renders its label and hint with no error text, and a field error renders below its own input (never as a form-level banner only). Labels stay above, errors stay below, in text. |
| overflow | GlassTable (`list-collection`) below `md` | ✅ covered | Below `md` the same rows render as stacked definition rows; the table's own wrapper is the only scroll container (`overflow-x-auto`), so the page never scrolls sideways. Carried from 01-UI-SPEC's overflow row. |
| overflow | charts at 360px (`media`) | ✅ covered | Both chart SVGs are `viewBox` + `h-auto w-full`, so the plot scales with its container and introduces no horizontal overflow at any width. |
| zero-one-many | SERIES (3) and the donut's segments (3) | ✅ covered | Both sets are fixed-cardinality: the chart renders exactly the three series and the donut exactly the three zones its caller passes. Neither grows or shrinks with the record count, so the layout does not reflow between a one-record and a many-record session. |
| long-text | GlassButton / Chip / banner labels (`interactive-control`, `static-content`) | ✅ covered | No primitive sets `truncate`, `line-clamp` or a fixed height on its label, so a long localised string wraps and the control grows in height; the floor is always `min-h`, never a `h-*`. The only `whitespace-nowrap` under `src/components/ui/` is GlassTable's column head, which is a declared structural label. |
| long-text | chart axis and legend labels (`media`) | ✅ covered | Chart labels are fixed-width clock strings and kPa numerals, and legend text renders in ink colours rather than the series colour, so a label stays readable whatever line it describes. |
| long-text | GlassButton label at 360px | 🧪 backstop | `{ statement: "A long localised GlassButton label at 360px wraps within the button and the page gains no horizontal overflow.", verification: backstop }` |
| long-text | BentoCell value + caption (`static-content`) | ⚠ unresolved | `03-CONTEXT.md`'s discretion leaves the height assertion to the planner: pin a `min-h`/`min-h-[…]` on the tile, or accept a content-driven floor. The cell is not an interactive target, so the 44×44px floor does not apply to it. Planner must treat as assumption. |
| error | the new Alert/Banner under `.landing-scope` | ✅ covered | The primitive declares no landing-register variant: no landing call site exists in this phase, and `.landing-scope` already re-declares the semantic tokens, so it renders through the same measured pairs if Phase 5 adds one. |
| (manual review) tone→role matrix | every feedback surface | ✅ covered | One shared tone→role config decides `role` for both registers (see `## Accessibility Contract`); no second copy of that decision exists, and no always-on polite region is introduced. |
| (manual review) focus and 44px floors | the new primitive, the restored variants | ✅ covered | `RING_PAIR` + the `min-h-[44px]` floor with its `lg` release hold on the new banner's action and dismiss controls, asserted by `a11y.test.jsx:203-249`. |

---

## Reported Non-Conformances

Measured 2026-10-18 while scouting this phase. None is a locked decision; each is surfaced so
the planner treats it explicitly instead of rediscovering it. None blocks Phase 3.

**F-01 — `DESIGN.md`'s white-surface contrast column does not reproduce.** Re-measured with
the WCAG 2.x formula, which reproduces the ink-pair table exactly (`DESIGN.md:123-126`,
`:136-139`) but not the white-surface column. That column is wrong for **five** chromatic
tokens, not three:

| Token | `DESIGN.md` | Re-measured | Verdict impact |
|-------|-------------|-------------|----------------|
| `safe` `#16A34A` | 4.5:1 (AA) | **3.30:1** | flips: fails AA as text; still clears the 3:1 graphical bar |
| `warning` `#CA8A04` | 4.6:1 (AA) | **2.94:1** | flips: fails AA as text **and** the 3:1 graphical bar on white |
| `danger` `#DC2626` | 5.9:1 (AA) | **4.83:1** | unchanged: still passes AA as text |
| `secondary` `#059669` | 4.6:1 (AA) | **3.77:1** | flips: fails AA as text — this is the figure `## Color` §2 and M-01c point here for; still clears the 3:1 graphical bar, which is all a stroke needs |
| `tertiary` `#0EA5E9` | 3.0:1 | **2.77:1** | flips: fails the 3:1 graphical bar on white; it was already declared unusable as a 12px label (M-01c) |
| `fg` / `fg-2` / `muted` | 18.1 / 12.6 / 4.8 | 17.85 / 10.35 / 4.76 | values differ, verdicts unchanged |

Read together: five chromatic tokens disagree with `DESIGN.md`, four verdicts flip (`safe`,
`warning`, `secondary`, `tertiary`) and one holds (`danger`).

The Phase 3 rule set holds under **either** reading (it forbids every chromatic token as 12–14px
text and routes every tint to the `-ink` pair), so no in-scope primitive depends on which number
is right. What does depend on it is `PlantarHeatmap`'s `warning` fill and `AppSidebar`'s status
text, both outside this phase. Action: an owner-signed `DESIGN.md` amendment re-measuring the
column (the same posture as the D-04 amendment), or a swap of the shipped
`safe`/`warning`/`secondary`/`tertiary` values for their darker equivalents. Do not silently
change a hex in Phase 3.

**N-02 — `RowMenu.jsx:104`** renders `text-safe` (`#16A34A`) as 14px text on the menu surface:
3.30:1, fails AA. Not in this phase's files (a dropdown leaf, not a COMP primitive). Owner:
**Phase 5 / PAGE-01** — `RowMenu` has exactly one consumer, `DashboardPage.jsx:33`, rendering
it at `:632` and `:669`, and PAGE-01 rebuilds the dashboard. Assigned here so the finding does
not evaporate before Phase 6's GATE-04 sweep.

**N-03 — `AppSidebar.jsx:90`** renders `text-safe` / `text-warning` on the rail (`bg` `#F8FAFC`):
3.15:1 / 2.81:1, both fail AA. Owner: **Phase 4** (SHELL-02 rebuilds the sidebar).

**N-04 — `LoadDonut.jsx:79,89`** hand-rolled SVG type (see `## Typography`). Owner: planner's
call within this phase, or Phase 5.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required (shadcn not initialized; custom token layer, `Tool: none`) |
| Third-party registries | none | not applicable (no third-party blocks declared; no vetting required) |

No third-party registry, block or preset is used. No `npx shadcn view` vetting was required, and
the shadcn initialization gate was deliberately not run: `01-UI-SPEC.md` frontmatter records
`shadcn_initialized: false` and the contract records `Tool: none` — asking again would re-litigate
a settled decision.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS
- [ ] Dimension 7 Inventory Provenance: PASS

**Approval:** pending
