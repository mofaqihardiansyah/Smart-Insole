# DESIGN.md - Smart Insole IoT Dashboard

> Direction document. It decides *what to build*. Every rule below is
> enforceable, and every value carries a one-line reason.

## Read this first: two surfaces, one product

This app has **two visual registers**, and they are never mixed inside one
surface:

| Surface | Register | Where |
|---|---|---|
| The **app** (signed in, and the auth forms that share its tokens) | Cadra light clinical console. Warm `#EFEFEC` canvas, white cards, one floating dark nav pill over a 1400px content column. | Dashboard, Monitoring, History, Device, Settings, Profile, Notifications, Login, Register |
| The **landing** (public) | The app's palette at marketing scale: same light canvas, ink and navy CTAs, larger radii, deeper shadows. | `/` for a signed-out visitor |

Both draw on one token layer. The landing re-declares its own values under
`.landing-scope`, so the shared components (GlassCard, GlassButton, StatusChip)
keep their measured light form there instead of being restyled twice.

The app register follows the Cadra light reference the owner supplied
(`docs/reference-design/DefaultVersion_ExporttoFigma...Dashboard · Cadra.svg`),
re-read for this product: its composition and its stat-card vocabulary are
adopted; its clinic content is not.

---

## Design Read

Reading this as a realtime clinical plantar-pressure console for elderly
diabetic patients and their caregivers, in a calm, warm, trustworthy clinical
language: **ENERGY 2 / RHYTHM 2 / MOTION 1**.

| Dial | Value | Why |
|---|---|---|
| ENERGY | 2 | It is an instrument, not a marketing page. Calm and legible. Above 1 only because risk states must be able to shout. |
| RHYTHM | 2 | A consistent tile-and-card grid, broken deliberately in one place: the pressure map and the live feed are full width while everything above them is a grid. Variation that is everywhere is noise. |
| MOTION | 1 | Numbers already update every second. Decorative motion competes with the data, so only hover, focus, value transitions and one reduced-motion-aware scroll move. |

## The identity motif

**Colour is a vital sign.**

The chrome is near-monochrome ink, white and warm grey. Saturation is reserved
*exclusively* for pressure and risk. Nothing decorative is ever saturated.

That single rule does four jobs at once: it makes the pressure map the
unambiguous focal point, it resolves the palette-count limit, it survives a
logo swap (the design is still recognisable with the wordmark removed), and it
means that when something on screen is coloured, it is because a foot needs
attention.

**This is why the pastel tints are assignments, not rhythm.** The Cadra
reference paints its stat cards with four decorative pastels by position: four
hues doing no work. Here each pastel is *assigned to one job by plan* and used
by name: sage for the score tile, cream for the duration tile, blue for the
informational battery and totals. Two hard rules ride along: every tinted card
still takes the semantic ink for its verdict-bearing parts, so the reading
never depends on the pastel, and the one risk-count card stays on plain white
(a cream card behind a danger count would read as decoration over a vital
sign). The darkest surface on the page, `#141414`, exists for exactly one job:
the headline metric the user is watching.

## Risk inference: Random Forest

The risk verdict is computed by a **Random Forest** classifier
(`src/utils/randomForestRisk.js`), replacing the earlier fuzzy logic
inference. The forest is trained on a synthetic dataset labelled by the
clinical expert rules (the 3x3 pressure x duration rule base), so the
decision boundary is **data-driven** rather than hand-tuned membership
functions, while the expert rules remain the source of the clinical
contract:

- peak < 35 kPa, not sustained -> safe
- peak >= 35 kPa -> at least warning, immediately
- peak > 70 kPa, under ~30 s -> warning
- peak > 70 kPa, past ~30 s -> danger
- any peak sustained past ~20 s -> at least warning

Training: a deterministic grid over the clinical input space (0-150 kPa
x 0-60 s, 1 kPa / 1 s steps) labelled by the expert rules, 30 trees with
bootstrap aggregation, Gini impurity splits, depth 10. Inference is a
majority vote; the reported score is the vote proportion mapped onto the
existing bands (safe 0-47, warning 48-74, danger 75-100). The PRNG is a
seeded LCG, so the model is identical on every load and in every test.

The clinical contract is asserted in `randomForestRisk.test.js` across
the whole sweep: if a future change makes a 40 kPa reading "safe", the
test fails before a patient is told they are fine.

The expert rules themselves are kept in `src/utils/fuzzyRisk.js` as the
labelling function for the training data — they are the clinical source
of truth, not the runtime inference path.

## Theme: light, and only light

Chosen by the product owner. The written reason: patients and clinicians read
this in daylight, and elderly users benefit more from dark ink on a light
surface than from the reverse.

Because exactly one theme ships, there is no half-built toggle to break, and
no `dark:` variants exist anywhere. `index.html` carries no theme class and
`color-scheme: light` only. The one dark surface in the app is a single
metric card per page (the inverted tile), which is a card fill, not a theme.

## Palette

Maximum one chromatic chrome colour (the sage accent) plus the three risk
semantics. Neutrals do not count toward that limit.

| Token | Hex | Role | Measured |
|---|---|---|---|
| `bg` | `#EFEFEC` | page canvas | fg on it 17.14:1 (AAA) |
| `surface` | `#FFFFFF` | card, hero card, nav row | fg on it 19.75:1 (AAA) |
| `surface-2` | `#F7F7F5` | table head, search field, hover rows | muted on it 8.70:1 (AAA) |
| `surface-3` | `#EBEBE7` | inset well, avatar fallback, meter track | decorative |
| `fg` | `#0A0A0F` | primary ink | 19.75:1 on white (AAA) |
| `fg-2` | `#282832` | secondary text | 14.59:1 on white (AAA) |
| `muted` | `#46464F` | captions, units, idle | 9.34:1 on white (AAA) |
| `primary` | `#0A0A0F` | ink: actions, links, focus | 19.75:1 on white (AAA) |
| `primary-hover` | `#000000` | button hover fill | - |
| `secondary` | `#04644C` | sage: interactive, positive states | 7.16:1 on white, 6.22:1 on bg (AA) |
| `tertiary` | `#0987B8` | info blue | 4.06:1 on white, 3.53:1 on bg: tints and large text only, never a 12px label |
| `border` | `#E4E4E0` | card edge, hairline | 1.11:1 on bg - decorative only |
| `border-strong` | `#DCDCD8` | panel and row divider edge | decorative |
| `border-control` | `#78787F` | input and control outlines | 3.80:1 on bg (passes non-text) |
| `safe` | `#15803D` | risk: Aman / Safe | 5.02:1 on white (AA) |
| `warning` | `#A16207` | risk: Waspada / Warning | 4.92:1 on white (AA) |
| `danger` | `#B41E1E` | risk: Bahaya / Danger | 6.68:1 on white (AA) |
| `danger-hover` | `#961414` | danger button hover fill | white on it 8.72:1 (AAA) |
| `safe-ink` | `#12552D` | written ON `bg-safe/15` | 7.25:1 (AA) |
| `warning-ink` | `#823700` | on `bg-warning/15` | 6.90:1 (AA) |
| `danger-ink` | `#821414` | on `bg-danger/15` | 7.89:1 (AA) |
| `secondary-ink` | `#054B37` | sage text/glyph on `bg-secondary/15` | 8.03:1 (AA) |

### The Cadra stat-card tints

Pastel card fills for the meter band and informational strips. Decorative by
role: the meaning on a tinted card still travels through the fg/ink pairs,
and the ink on every tint is the primary `#0A0A0F` ramp:

| Tint | Hex | Assigned to | fg on it |
|---|---|---|---|
| `tint-cream` | `#F3DFA6` | the duration tile | 13.53:1 |
| `tint-mint` | `#CBE8D4` | the score tile | 13.63:1 |
| `tint-blue` | `#CADCF1` | the battery tile, the history total | 12.77:1 |

### The inverted card

One metric tile per page renders on `#141414` with its own text ramp, so the
darkest surface is reliably the one place the headline number lives:

| Token | Hex | Measured on `#141414` |
|---|---|---|
| `inverted-fg` | `#FFFFFF` | 18.42:1 (AAA) |
| `inverted-muted` | `#A9A9A6` | 7.82:1 (AAA) |
| `inverted-safe` | `#22C55E` | 8.08:1 on dark; 6.17:1 over the `bg-white/10` chip fill |
| `inverted-warning` | `#EAB308` | 9.61:1; 7.33:1 over `bg-white/10` |
| `inverted-danger` | `#F87171` | 6.66:1; 5.08:1 over `bg-white/10` |
| `inverted-secondary` | `#34D399` | 9.58:1; 7.31:1 over `bg-white/10` |

### Why there are ink tokens at all

Every accent above is measured against **white**. A status chip is that accent
at 15 percent, and the meaning is written on top of the tint, where the accent
drops below what 12px text needs:

| Pair | Measured | Verdict |
|---|---|---|
| `#15803D` on `bg-safe/15` | 4.09:1 | fails AA text |
| `#A16207` on `bg-warning/15` | 4.04:1 | fails AA text |
| `#B41E1E` on `bg-danger/15` | 5.17:1 | passes text, still one voice short |
| `#04644C` on `bg-secondary/15` | 5.66:1 | passes text |

So one meaning owns exactly one **pair**: the bright accent for strokes, fills
and text on a white surface, and the ink for anything sitting on that meaning's
tint. The chip label, the chip glyph, the stat-card icon tile and the banner
icon all take the ink. Nothing else may use either.

The bright risk values (`#22C55E`, `#EAB308`, `#EF4444`) fail AA as text on
light surfaces (roughly 2.2 to 3.3:1). They are therefore used only inside the
inverted card's own ramp, where the `#141414` fill reverses the math and each
measures 5:1 or better. No bright green, yellow or red exists on any light
surface.

Two further documented refusals:

- The Cadra reference labels its stat captions in `#94A3B8`, which measures
  **2.6:1** on white. It fails AA for text. Captions ship in `muted`
  (9.3:1) with an italic voice, so the register still reads lighter without
  dropping below 4.5:1.
- The reference's "in progress" chip is light blue with `#3B82F6` text. The
  informational chip here keeps the blue tint but takes **navy ink**, because
  `tertiary` as a 12px label fails AA.

### Data visualisation

Three series colours, Okabe-Ito, chosen because it is the standard
colour-vision-deficiency-safe categorical set:

| Series | Hex | Passes as a line |
|---|---|---|
| Forefoot | `#0072B2` | 5.19:1 |
| Midfoot | `#D55E00` | 3.87:1 |
| Heel | `#009E73` | 3.42:1 |

**Single source:** these three values are defined once, in the `SERIES` array in
`web-dashboard/src/utils/series.js`. Every consumer reads that module: the live
waveform (`TelemetryChart`) and the peak trend (`TrendChart`). The values
themselves stay in `index.css` as `--series-1`, `--series-2` and
`--series-3`, so this module names those custom properties and
never a hex. The Heatmap uses the risk tokens instead, because the heatmap
encodes pressure magnitude, which is a risk question, not a series-identity
question.

`TrendChart` draws one trace that is deliberately *not* one of these three. It is
the non-identity `--secondary` sage line, because that panel answers "is the peak
climbing", never "which zone is worst", and giving it a series key would re-encode
one trend as a three-series categorical chart. The same sage carries the
stat-card sparkline for the same reason: a sparkline under one score is one
trend, not three series. The carve-out is recorded rather than removed.

**Quarantine rule:** the three series colours appear *only* inside the chart.
They never touch buttons, badges, navigation or headings. An automated gate walks
the shipped `.jsx` and `.js` sources and fails on a raw `--series-N` reference in
any file other than `index.css` and `utils/series.js`, so the rule is enforced
rather than intended. The zone-load funnel takes no series colour: each bar is
one accent, and the sensor point's identity travels in its row label, so the
palette cannot imply a categorical chart where there is none.

---

## Typography

| Use | Family | Reason |
|---|---|---|
| Headings, big numerals | Plus Jakarta Sans | Geometric and slightly condensed, so large clinical numerals read as instrument readouts rather than marketing type. |
| Body, labels, data | DM Sans | Neutral in long clinical strings and, with `tabular-nums`, gives figures a fixed width, so a value updating every second does not make the layout twitch. |
| Vitals, code | Fira Code | Monospace for tabular numeral alignment in kPa readouts. |

Every kPa figure carries `tabular-data` (or Tailwind's `tabular-nums`).

Type scale:

| Token | Size | Weight | Where it is used |
|---|---|---|---|
| `display` | `clamp(2.5rem, 5vw, 4.5rem)` | 700 | Landing hero only |
| `landing-h2` | `clamp(1.875rem, 2.2vw + 0.9rem, 3rem)` | 600 | Landing section headings and the closing CTA |
| `stat` | 30px | 700 | A metric value (the four dashboard tiles) |
| `h1` | 30px | 700 | One per page. On the dashboard it is the hero greeting. |
| `h2` | 24px | 600 | Rare; a nested section title |
| `card-title` | 20px | 700 | Every `PanelHeader` |
| `h4` | 16px | 500 | Compact card headings, mobile brand line |
| `body-base` | 15px | 400 | Table cells, nav labels, subtitles |
| `body` | 16px | 400 | Long-form paragraphs |
| `body-sm` | 14px | 400 | Panel subtitles, helper text |
| `chip` | 12px | 600 | Status and delta chips, uppercase, tracking 0.05em |
| `label` | 12px | 600 | Table column heads, uppercase, tracking 0.08em |
| `caption` | 12px | 500 | Stat captions, timestamps |
| `micro` | 11px | 600 | The brand tagline and nowhere else |

The `<h1>` element is one per page. Data pages set it at the `h1` size through
`PageHeader` (dashboard uses the hero card's own `h1`); the auth pages (Login,
Register, Verify OTP) keep one form card under the mark, so their `h1` renders
at the `h2` size, one step above `card-title` instead of tying with it. The
same count semantic (readings, warnings) renders at the `stat` size on both
the History summary strip and the Profile session blocks, so one metric is one
size everywhere it appears.

Sentence-case headings everywhere except table column heads and chips. The
archive sets its decorative labels in wide-tracked uppercase; uppercase is
reserved here for things that are genuinely a column or a state.

---

## Layout and breakpoints

Breakpoints are placed where the content stops working, not at device widths.

| Width | State |
|---|---|
| `< 640px` | One column. Sticky top bar: compact brand, bell and a Menu drawer. Tables become stacked definition rows. |
| `640px - 1023px` | Same bar; two-column tile grid. Search stays in the drawer. |
| `>= 1024px` | One sticky header over the warm canvas: white brand card on the left, the dark nav pill beside it, search, bell and the account menu on its right. The content column caps at 1400px with 32px gutters. |

**The shell is a header, not a rail.** The earlier 288px left rail is gone.
Destinations live in one place: the dark nav pill. A brand card anchors its
left, and three state controls (search, bell, account) close its right. The
header is sticky so the controls never scroll away, and it paints in the
canvas colour rather than white, so the cards below it stay the brightest
terrain on the page.

Dashboard composition, top to bottom:

1. **The hero card.** Greeting `h1`, long date, the risk verdict as a large
   `StatusChip` directly under it (icon, `risk.*` label, level tint), the two
   standing actions (Export CSV, Mark as read) pinned right, and across the
   card's foot the real buffer's event strip (`HeroTimeline`).
2. **The meter band.** The four readings as Cadra stat cards: pastel-tinted
   fills, rounded corners, soft shadows, with one inverted dark card for the
   headline peak. The duration and battery tiles carry proportion meters; the
   score tile carries the buffer's sparkline.
3. **Station 01 / 02:** the trend panel (two thirds) beside the zone-load
   funnel (one third). These are cards, because each holds a plot surface.
4. **Station 03:** the live reading feed, full width and OPEN: a ruled section
   with no card walls, because a running tape held inside a white box is
   decoration around data. Each row's pressure reads against the danger
   threshold as a mini bar painted by that row's own verdict.
5. **Station 04:** the pressure map, full width, in a card, with the colour
   legend under it.

**Station numbers.** Each numbered panel carries its index (01 to 04) in
tabular numerals beside the panel title, hidden from the accessibility name;
the feed repeats the motif in its own open header. The numbers are
wayfinding, not copy: they give every panel an unambiguous name that carries
into conversation and tests the way numbered stations do on an instrument.

The order is the order the questions are asked: how is it now, which way is it
going, where is the load, what just happened, and where exactly.

The map sits last even though it is the product's focal visual, because the
page reads better as a funnel than as a map with footnotes. A 56px floating
control in the bottom-right jumps to it, and that control is hidden below
`lg`, where the map is one short scroll away and the button would cover the
content it exists to reveal.

Nothing is `100vh`; full-height sections use `min-h-[100dvh]`. No horizontal
overflow is permitted at any width, and nothing is clipped at 200% zoom.

---

## Radius and elevation

| Element | Radius |
|---|---|
| Badges, status tags, filter chips | 4px (`rounded-sm`) |
| Buttons, inputs, controls | 8px (`rounded-control`) |
| Icon tiles, meter-band tiles, the FAB | 12px (`rounded-tile`) |
| Cards, modals, dialogs | 16px (`rounded-card`) |
| The nav pill, the brand card, the account trigger | full (`rounded-pill`) |
| Mobile nav drawer | 24px (`rounded-rail`) |
| Avatars and indicator dots | full (`rounded-full`) |

The pill radius exists for **three named elements**: the nav pill, the brand
card that anchors it, and the avatar roundel that opens the account menu. That
is the whole list. A pill radius elsewhere in the app is caught in review
against this comment rather than the build gate, because the shapes it
duplicates are exactly the ones the no-pill law existed to refuse. Circles
are still reserved for avatars and indicator dots.

**Atmosphere.** No decorative gradients and no blurred glow blobs, on either
register. Saturation belongs to data (risk, series, the heatmap), flat
surfaces carry the rest. The gradients that remain are functional: the
heatmap's node fills, the trend chart's area fill, and the chart plot grid.

**Elevation.** The app and the landing use two separate shadow languages, and
conflating them is what previously left the landing with flat panels:

| Token | Shadow | Owner | Use |
|---|---|---|---|
| `panel` | 1px offset, 2px blur, ink 4% | app | every card and nav pill. The card reads as a panel because of edge plus this one lift, not because it floats. |
| `md` | 4px offset, 16px blur, ink 7% | app | a genuinely elevated card |
| `overlay` | 8px 32px, ink 10% | app | modal dialogs only |
| `fab` | 10px 30px sage 45% | app | the single floating control |
| `card` | 14px 30px, ink 25% | landing | landing panels |
| `lift` | 24px 44px, ink 30% | landing | hovered and hero panels |
| `nav` | 10px 30px, ink 25% | landing | the sticky nav bar |
| `glow` | 18px 35px, ink 35% | landing | dark feature panels |

One elevated token per surface. A page where everything floats has no
hierarchy left to express.

---

## Motion

`MOTION 1`. Permitted motion, each with its reason:

- Colour, border and the single `scale-105` on the floating control, on hover
  and focus (state feedback, at or under 150ms).
- The heatmap's danger-node pulse (draws the eye to the point that needs
  relief).
- Number transitions on value change (so the eye can follow the update).
- One scroll to the pressure map, and only when
  `prefers-reduced-motion: no-preference`. It jumps instantly otherwise.

Forbidden on the app pages: scroll reveals, parallax, entrance animations,
floating elements, `window.addEventListener('scroll')`, tailwind `animate-*`
utilities, and anything that ignores `prefers-reduced-motion`.

The landing keeps its own, separately documented motion budget below.

---

## Navigation structure

Six destinations in the nav pill, each a distinct task rather than a page
type: Dashboard, Monitoring, History, Device, Settings, Profile.

**Notifications is not in the pill.** It lives on the bell at the header's
right (with a live unread dot), and on the same bell in the mobile header,
because an alert queue is a state of the app rather than a place in it.
Listing it in the pill too would be two controls for one destination.

**The pill owns every destination exactly once.** The brand card is not a
link: the pill's first item is the dashboard, and a clickable logo would make
`a[href="/"]` a repeat. The drawer and the account menu ship their menus
closed, so no destination link is ever mounted twice below `lg` either.

The header's right group carries the three things that are about *state*
rather than *place*: search, the bell, and the account menu (profile link,
sign out). The language switch existed here and is gone: the interface speaks
Indonesian only (LANG-01, closed 2026-10-18), so a second language would be a
dead control, which this page's own rules refuse.

Mobile uses a drawer rather than a bottom bar. A six-item bottom row cannot
hold a readable label at 360px, and an icon-only row is the failure mode this
product's elderly audience cannot afford.

**The account menu is a disclosure.** Its trigger states its name and its
state (`aria-expanded`, `aria-controls`), lists the two account acts it owns
(profile, sign out), closes on Escape with focus returned to the trigger, and
closes on an outside click. Keyboard users never lose their place when it
shuts.

### The search is real

The header search is a combobox, not decoration. It offers two kinds of
result, because this product has exactly two things worth jumping to:

- **Pages**: the six destinations, matched by label.
- **Records**: the readings still in the live buffer, matched by sensor point,
  risk level, clock time or value. Choosing one opens the history page.

Arrow keys, Enter, Escape and the outside-click all work. Every result
navigates somewhere that exists, which is what separates it from the
archive's placeholder field.

---

## Component naming

The `Glass*` component names are retained (`GlassCard`, `GlassButton`,
`GlassInput`, `GlassTable`, `GlassForm`) because the design brief forbids
renaming exports and the pages import them by name. The styling is not glass:
all `backdrop-blur` was removed. The names are historical identifiers, not a
description of the surface treatment. The same applies to `BentoGrid`, which
carries the meter band rather than a mosaic.

Primitives, with the reason each exists:

| Component | Why it exists |
|---|---|
| `Chip` | Filter labels, deltas and state tokens need one tint vocabulary. Tones are the semantic set only; there is no arbitrary colour prop. |
| `TrendChart` | The dashboard's trend panel. One series, because the funnel and the map already answer "which zone". Its single trace is the non-identity `--secondary` sage carve-out, not one of the three series values. |
| `Sparkline` | The stat card's small trend, drawn from the real buffer. Skips dropped samples, draws nothing under two points, and takes only the non-identity sage stroke. |
| `HeroTimeline` | The hero card's event strip: one dot per buffered reading over elapsed time, painted by that reading's verdict, with a summary label built from real counts. |
| `FunnelBars` | The zone-load panel: one row per sensor point, its share as a bar, its real kPa beside it. One accent; identity in labels. Replaced `LoadDonut`. |
| `RowMenu` | The per-row actions overflow. A real menu, so the trigger is not a dead glyph. |
| `AppLayout` / `AppNavPill` / `AppTopbar` / `AppSidebar` / `AppSearch` | The Cadra shell. `AppSidebar` survives only as a helper module (icon registry, initials, the drawer's account card); `AppTopbar` is the header's right group; `AppNavPill` owns the destinations. |
| `UserContext` | One auth listener, read by the shell and the pages, instead of one listener per caller. |

---

## Accessibility contract

- Every text/background pair is measured, never eyeballed. Values above.
- Every interactive target is at least 44x44px on touch, and only drops to
  34 to 40px from `lg`, where a pointer is doing the clicking.
- Every interactive element is reachable and operable by keyboard, with a
  visible focus ring at 3:1 or better. The nav pill's focus ring is white and
  inset, because the pill itself is the darkest surface a Tab order ever
  crosses.
- Risk is never conveyed by colour alone: icon **and** text label **and**
  colour, always. On the inverted card the same rule holds through the
  `inverted-*` ramp.
- Every data view has a loading, empty and error state, and the copy names the
  cause and the next action rather than saying "No data". The timeline and the
  sparkline degrade the same way: an empty buffer leaves a bare line and draws
  nothing, never an invented shape.
- Live pressure numbers are `aria-live="off"`. Only a *change in risk level* is
  announced, through one `aria-live="polite"` region. Announcing three numbers
  every second would make the page unusable with a screen reader, and no
  second live region exists anywhere in the shell.
- A `<table>` is only rendered from `md` up; below that the same rows render as
  stacked definition rows, because a table cannot reflow and horizontal scroll
  on a phone is not a layout.
- The mobile drawer is a real dialog: focus moves in, Tab is trapped, Escape
  closes, the page behind cannot scroll, and focus returns to the trigger.
- The account menu is a disclosure with the same guarantees, minus the scroll
  lock a popover does not need.
- Forms label above the input, errors below in text. Fields scroll into view
  above the on-screen keyboard.

---

## Anti-slop constraints specific to this product

- No em dashes in shipped copy. The shipped copy is Indonesian only, so one
  dictionary holds to this rule. A middot or a pipe separates ideas instead.
- No fabricated telemetry. There is exactly one data source, the real insole
  through Firebase. An unanswered device shows the honest empty states and
  connection banners, never invented numbers. Values with no source read as
  unavailable. The restyle's new shapes obey the same law: the timeline's dots
  are buffered readings, the sparkline is buffer peaks, the funnel bars are
  zone loads with the total stated, and each shape collapses to its empty
  state when the data has not arrived.
- The Cadra reference's invented patient rows, its revenue figure and its
  "Clinic status: Optimal" line are content from a different product. The
  composition is adopted; the content is not. "BUY THIS TEMPLATE" and any
  comparable banner has no counterpart here.
- The two chips that look like trend markers are computed from the real ring
  buffer (mean peak of the newer half against the older half, with a 3 percent
  dead band), not written into the markup.
- No invented statistics, testimonials, compliance claims or user counts. This
  is a thesis instrument; the only evidence shown is real measured output.
- No dead controls. A button that cannot act is a defect, not decoration. The
  two standing actions are the two this product actually has: export the
  session buffer to CSV, and mark the alert queue as read.
- A filled button is a to-do, not furniture. The alert acknowledge carries the
  filled rank only while the alert queue has unread items and the quiet rank
  otherwise, so the loudest control on the page is the one asking for an act.
  Permanent urgency is no urgency. The same rule scales up the app: a page
  with nothing that needs doing shows no filled button at all.
- No skeleton or placeholder blocks used as a product screenshot: the landing
  page shows the real heatmap component running.

---

## Landing page variant

The public landing page shares the app's colour system and differs only in
scale: larger radii, longer type steps, its own shadows. The one token family
it owns (`warm-*`) is a landing-only scope, so an app page can never pick up a
landing value and the two never mix within one surface.

Structure: a flat rectangular nav bar that sits flush on the top edge of the
page and lifts into a floating bar once the visitor scrolls, a full-viewport
flat hero with drifting tiles and the real heatmap, "why" section with the
warning signs and the spec numbers in one ruled strip, six-feature grid, a dark
audience panel, three "how it works" rows plus one dense technical subsection
(pipeline, model facts, and an interactive risk simulator that runs the real
inference module), a three-step start flow, an FAQ, and a closing CTA panel.
The landing carries no gradient atmosphere and no pill shapes: its hero and CTA
bands are flat raised surfaces, its nav and CTAs are rectangles. The copy is
this product's real content: no studio branding, no fabricated testimonials, no
sample pricing, no fake customer logos.

**Hero contract (above the fold).** The fold answers four questions in reading
order, one text slot each: the eyebrow tag names the category (what this is),
the headline fuses what it does with why it matters, the subtitle names WHO it
is for, and the CTAs are the next step (register first). The measured numbers
appear exactly once on the page, in the Mengapa band; repeating them in the
hero duplicates copy, dilutes the answer-first fold, and pushes the heatmap
below the fold.

The landing is **light-only by design**. `.landing-scope` in `src/index.css`
re-declares the light semantic tokens, so every in-app component (GlassCard,
StatusChip, GlassButton focus rings) renders in its measured light form on the
shared app surface. There is no theme switch on the landing: on a light-only
page it would be a dead control. The language switch is still present and still
works, but the stored-preference reader now forces Indonesian for any preference
left behind, and removing the switch is the Indonesian-only requirement owned by
Phase 5 (LANG-01).

Palette, all measured on `#F1F5F9` raised:

| Token | Hex | Role | Measured |
|---|---|---|---|
| `warm-canvas` | `#F8FAFC` | page canvas (app `bg`) | - |
| `warm-raised` | `#F1F5F9` | hero panel, spec band (app `surface-2`) | - |
| `warm-card` | `#FFFFFF` | cards, nav bar (app `surface`) | - |
| `warm-ink` | `#0F172A` | headings (app `fg`) | 16.30:1 on raised (AAA) |
| `warm-body` | `#334155` | body text (app `fg-2`) | 9.45:1 on raised (AAA) |
| `warm-caption` | `#5E6D7E` | captions | 4.83:1 on raised (AA) |
| `warm-accent-deep` | `#0F172A` | labels and button fill (app `primary`) | 16.30:1 on raised; white on it 17.85:1 (AAA) |
| `warm-accent` | `#0F172A` | graphics only (app `primary`) | decorative |
| `warm-accent-2` | `#0EA5E9` | dark-panel icons (app `tertiary`) | 5.28:1 on `warm-panel` |
| `warm-dark` | `#0F172A` | dark panels, featured card (app `primary`) | - |
| `warm-panel` ... `warm-panel-4` | `#1E293B`-`#475569` | dark panel cells | white/55 on panel is about 5.7:1 |

`warm-caption` is one slate step darker than `#64748B` (4.34:1 on `#F1F5F9`,
just under AA), so the landing caption ships at 4.83:1. The teal in the
product mark (`#1D7B80`) stays a brand colour: it is not used for UI text or
controls.

Radius: landing tiles use `rounded-tile` (12px), inner icon chips the same
tile step, small panels and drifting-tile tiles `rounded-panel` (16px),
cards 24px (`rounded-3xl`), dark-panel cells and "how it works" rows
`rounded-cell` (28px), section bands `rounded-section` (32px) with the dark
wrapper at `rounded-section-lg` (36px), hero `rounded-hero` (28px, 40px on
`sm`+ via `rounded-hero-lg`), and nav links, CTAs and the nav bar at
`rounded-tile`. The app's `rounded-pill` is an app-shell hook only; no pill
step exists in the landing's markup. Every radius on the page resolves to one
of these named hooks: no raw `rounded-[26px]`-style values remain, and
`rounded-2xl`/`rounded-xl` built-ins are folded into the `panel`/`tile` hooks
they duplicated.

Landing headings resolve to three steps and nothing else: `display` (hero),
`landing-h2` (every section heading and the closing CTA; 30px rising to 48px,
one fluid step so no heading jumps size at a breakpoint), and the app-wide
`h2` / `card-title` steps for sub-panel headings. Body copy uses the declared
`body`, `body-lg`, `body-sm` and `caption` tokens; `text-sm`, `text-base`,
`text-lg`, `text-xs` built-ins are deleted from the page.

Motion budget: hero rise-in (420ms), scroll reveal via one IntersectionObserver
(700ms, opacity and translate only), hover and focus transitions at 150ms, the
nav's one state change from attached to floating (300ms, interpolating its own
width, radius and shadow), drifting headline tiles (one rAF loop), smooth
scrolling. All of it is disabled under `prefers-reduced-motion`. No WebGL, no
parallax, no char-weight rAF: the reference export's continuous animations were
removed because the audience includes elderly users on low-end devices, and the
app pages stay at MOTION 1.

Deliberately not adopted from the reference: fabricated testimonials, fake
customer logos, sample pricing, external stock photos, and the placeholder
disclaimer that admits the numbers are fake. A thesis instrument shows real
measured output only.

**Token parity note.** The previous layout pass deleted the `warm.*` colour
group, `rounded-panel`, `rounded-hero`, `rounded-hero-lg`, `rounded-pill`,
`shadow-card`, `shadow-lift`, `shadow-nav` and `shadow-glow` from
`tailwind.config.js` while the landing page still referenced every one of them,
so a large part of that page was rendering with no colour, radius or elevation
at all. They are restored, and the app's own card lift is renamed `shadow-panel`
so one name can no longer mean two different shadows. `design-tokens.test.js`
now fails the build if any Tailwind class used in `src/` has no generated rule.
