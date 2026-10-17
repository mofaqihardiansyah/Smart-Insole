# DESIGN.md - Smart Insole IoT Dashboard

> Direction document. It decides *what to build*. Every rule below is
> enforceable, and every value carries a one-line reason.

## Read this first: two surfaces, one product

This app has **two visual registers**, and they are never mixed inside one
surface:

| Surface | Register | Where |
|---|---|---|
| The **app** (signed in) | Verdana Health clinical console. Pale slate canvas, white cards, 288px rail, 72px top bar with search. | Dashboard, Monitoring, History, Device, Settings, Profile, Notifications, Login, Register |
| The **landing** (public) | Warm marketing dialect. Warm grey canvas, larger radii, deeper shadows. | `/` for a signed-out visitor |

Both draw on one token layer. The landing re-declares its own values under
`.landing-scope`, so the shared components (GlassCard, GlassButton, StatusChip)
keep their measured light form there instead of being restyled twice.

The app register is the reference console the owner supplied
(`verdana-health-design-system-DESIGN.md` plus the desktop reference image).
The landing keeps the warm dialect it already had.

---

## Design Read

Reading this as a realtime clinical plantar-pressure console for elderly
diabetic patients and their caregivers, in a calm, light, trustworthy clinical
language: **ENERGY 2 / RHYTHM 2 / MOTION 1**.

| Dial | Value | Why |
|---|---|---|
| ENERGY | 2 | It is an instrument, not a marketing page. Calm and legible. Above 1 only because risk states must be able to shout. |
| RHYTHM | 2 | A consistent tile-and-card grid, broken deliberately in one place: the pressure map and the live feed are full width while everything above them is a grid. Variation that is everywhere is noise. |
| MOTION | 1 | Numbers already update every second. Decorative motion competes with the data, so only hover, focus, value transitions and one reduced-motion-aware scroll move. |

## The identity motif

**Colour is a vital sign.**

The chrome is near-monochrome navy and white. Saturation is reserved
*exclusively* for pressure and risk. Nothing decorative is ever saturated.

That single rule does four jobs at once: it makes the pressure map the
unambiguous focal point, it resolves the palette-count limit, it survives a
logo swap (the design is still recognisable with the wordmark removed), and it
means that when something on screen is coloured, it is because a foot needs
attention.

**This is why the metric tiles are not tinted by position.** The reference
image gives its four stat cards four decorative pastel icon tiles (indigo,
blue, grey, mint). That is four hues doing no work. Here the icon tile takes the
*metric's own semantic colour*: sage while the reading is good, amber or red
when it is not. The reference's visual rhythm survives, and the colour now means
something.

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

The expert rules themselves stay in `src/utils/fuzzyRisk.js` as the
labelling function for the training data — they are the clinical source
of truth, not the runtime inference path.

## Theme: light, and only light

Chosen by the product owner. The written reason: patients and clinicians read
this in daylight, and elderly users benefit more from dark ink on a light
surface than from the reverse.

Because exactly one theme ships, there is no half-built toggle to break, and
no `dark:` variants exist anywhere. `index.html` carries no theme class and
`color-scheme: light` only.

## Palette

Maximum one chromatic chrome colour (the accent) plus the three risk semantics.
Neutrals do not count toward that limit.

| Token | Hex | Role | Measured |
|---|---|---|---|
| `bg` | `#F8FAFC` | page canvas, rail | - |
| `surface` | `#FFFFFF` | card surface, top bar | - |
| `surface-2` | `#F1F5F9` | table head, search field, account card | - |
| `surface-3` | `#E2E8F0` | inset well, avatar fallback | - |
| `fg` | `#0F172A` | primary ink | 18.1:1 on white (AAA) |
| `fg-2` | `#334155` | secondary text | 12.6:1 on white (AAA) |
| `muted` | `#64748B` | captions, units, nav idle | 4.8:1 on white (AA) |
| `primary` | `#0F172A` | navy: actions, links, focus | 18.1:1 on white (AAA) |
| `primary-hover` | `#020617` | button hover fill | - |
| `secondary` | `#059669` | sage: interactive, positive states | 4.6:1 on white (AA) |
| `tertiary` | `#0EA5E9` | info blue | 3.0:1: tints and large text only, never a 12px label |
| `border` | `#EAEFF4` | card edge, hairline | 1.1:1 - decorative only |
| `border-strong` | `#E2E8F0` | panel and row divider edge | 1.3:1 - decorative only |
| `border-control` | `#7C8695` | input and control outlines | 3.47:1 on bg (passes non-text) |
| `safe` | `#16A34A` | risk: Aman / Safe, on white | 4.5:1 on white (AA) |
| `warning` | `#CA8A04` | risk: Waspada / Warning, on white | 4.6:1 on white (AA) |
| `danger` | `#DC2626` | risk: Bahaya / Danger, on white | 5.9:1 on white (AA) |
| `safe-ink` | `#166534` | the same meaning, written ON `bg-safe/15` | 6.03:1 (AA) |
| `warning-ink` | `#92400E` | on `bg-warning/15` | 6.10:1 (AA) |
| `danger-ink` | `#991B1B` | on `bg-danger/15` | 6.56:1 (AA) |
| `secondary-ink` | `#065F46` | sage text/glyph on `bg-secondary/15` | 6.40:1 (AA) |

### Why there are ink tokens at all

Every accent above is measured against **white**. A status chip is that accent
at 15 percent, and the meaning is written on top of the tint, where the accent
drops well below what 12px text needs:

| Pair | Measured | Verdict |
|---|---|---|
| `#16A34A` on `bg-safe/15` | 2.78:1 | fails AA text, fails the 3:1 a glyph needs |
| `#CA8A04` on `bg-warning/15` | 2.53:1 | fails both |
| `#DC2626` on `bg-danger/15` | 3.81:1 | fails AA text |
| `#059669` on `bg-secondary/15` | 3.14:1 | passes as a glyph, fails as text |

So one meaning owns exactly one **pair**: the bright accent for strokes, fills
and text on a white surface, and the ink for anything sitting on that meaning's
tint. The chip label, the chip glyph, the stat-card icon tile and the banner
icon all take the ink. Nothing else may use either.

The bright risk values (`#22C55E`, `#EAB308`, `#EF4444`) fail AA as text on
light surfaces (roughly 2.2 to 3.3:1), and they also measure under the 3:1 a
graphical object needs against the light sole fill the heatmap draws on. They
are therefore not shipped at all. The darkened versions above are used
everywhere a risk colour appears.

Two further documented refusals:

- The reference labels its stat captions in `#94A3B8`, which measures **2.6:1**
  on white. It fails AA for text. Captions ship in `muted` (4.8:1) with an
  italic voice, so the register still reads lighter without dropping below 4.5:1.
- The reference's "in progress" chip is light blue with `#3B82F6` text. The
  informational chip here keeps the blue tint but takes **navy ink**, because
  `tertiary` as a 12px label measures 3.0:1 and fails AA.

### Data visualisation

Three series colours, Okabe-Ito, chosen because it is the standard
colour-vision-deficiency-safe categorical set:

| Series | Hex | Passes as a line |
|---|---|---|
| Forefoot | `#0072B2` | 5.19:1 |
| Midfoot | `#D55E00` | 3.87:1 |
| Heel | `#009E73` | 3.42:1 |

**Single source:** these three values are defined once, in the `SERIES` array in
`web-dashboard/src/components/monitoring/TelemetryChart.jsx`. Every stroke, dot,
legend swatch and screen-reader table row reads from it. The Heatmap uses the
risk tokens instead, because the heatmap encodes pressure magnitude, which is a
risk question, not a series-identity question.

**Quarantine rule:** the three series colours appear *only* inside the chart.
They never touch buttons, badges, navigation or headings.

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
| `stat` | 30px | 700 | A metric value (the four dashboard tiles) |
| `h1` | 30px | 700 | One per page. On the dashboard it is the greeting. |
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

Sentence-case headings everywhere except table column heads and chips. The
reference sets its decorative labels in wide-tracked uppercase; uppercase is
reserved here for things that are genuinely a column or a state, which is what
antislop R-06 asks for.

---

## Layout and breakpoints

Breakpoints are placed where the content stops working, not at device widths.

| Width | State |
|---|---|
| `< 640px` | One column. Sticky 64px top bar with brand, bell and a Menu drawer. Tables become stacked definition rows. |
| `640px - 1023px` | Two-column tile grid. Search moves into the drawer. |
| `>= 1024px` | Fixed 288px rail, sticky 72px top bar with search and account controls, content column capped at 1400px with 32px gutters. |

Dashboard composition, top to bottom:

1. Greeting row: the greeting and the real date and status on the left, the two
   standing actions (Export CSV, Mark as read) on the right.
2. Four metric tiles.
3. Trend panel (two thirds) beside the load distribution donut (one third).
4. The live reading feed, full width.
5. The pressure map, full width, with the colour legend under it.

The order is the order the questions are asked: how is it now, which way is it
going, where is the load, what just happened, and where exactly.

The map sits last even though it is the product's focal visual, because the
reference composition is what the owner asked to match and because the page
reads better as a funnel than as a map with footnotes. A 56px floating control
in the bottom-right jumps to it, and that control is hidden below `lg`, where
the map is one short scroll away and the button would cover the content it
exists to reveal.

Nothing is `100vh`; full-height sections use `min-h-[100dvh]`. No horizontal
overflow is permitted at any width, and nothing is clipped at 200% zoom.

---

## Radius and elevation

| Element | Radius |
|---|---|
| Badges, small tags | 4px (`rounded-sm`) |
| Buttons, inputs, chips, filter chips | 8px (`rounded-control`) |
| Icon tiles, inner panels, dropdowns, drawer items | 12px (`rounded-tile`) |
| Cards, modals, dialogs | 16px (`rounded-card`) |
| Status pills, avatars, search field, FAB | full (`rounded-full`) |

The app cards are **16px**, matching the reference. Cards are never pills.

**Elevation.** The app and the landing use two separate shadow languages, and
conflating them is what previously left the landing with flat panels:

| Token | Shadow | Owner | Use |
|---|---|---|---|
| `panel` | 1px offset, 2px blur, navy 4% | app | every card. The card reads as a panel because of edge plus this one lift, not because it floats. |
| `md` | 4px offset, 16px blur, navy 7% | app | a genuinely elevated card |
| `overlay` | 8px 32px, navy 10% | app | modal dialogs only |
| `fab` | 10px 30px sage 45% | app | the single floating control |
| `card` | 14px 30px, warm 25% | landing | warm panels |
| `lift` | 24px 44px, warm 30% | landing | hovered and hero panels |
| `nav` | 10px 30px, warm 25% | landing | the floating nav pill |
| `glow` | 18px 35px, warm 35% | landing | dark feature panels |

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
floating elements, `window.addEventListener('scroll')`, and anything that
ignores `prefers-reduced-motion`.

The landing keeps its own, separately documented motion budget below.

---

## Navigation structure

Six destinations in the rail, each a distinct task rather than a page type:
Dashboard, Monitoring, History, Device, Settings, Profile.

**Notifications is not in the rail.** It lives on the bell in the top bar (with
a live unread dot), and on the same bell in the mobile header, because an alert
queue is a state of the app rather than a place in it. Listing it in both the
rail and the header would be two controls for one destination.

The top bar carries the two things that are about *state* rather than *place*:
search, and the account controls (language, notifications, profile).

Mobile uses a drawer rather than a bottom bar. A six-item bottom row cannot
hold a readable label at 360px, and an icon-only row is the failure mode this
product's elderly audience cannot afford.

### The search is real

The top bar search is a combobox, not decoration. It offers two kinds of
result, because this product has exactly two things worth jumping to:

- **Pages**: the six destinations, matched by label.
- **Records**: the readings still in the live buffer, matched by sensor point,
  risk level, clock time or value. Choosing one opens the history page.

Arrow keys, Enter, Escape and the outside-click all work. Every result
navigates somewhere that exists, which is what separates it from the
reference's placeholder field.

---

## Component naming

The `Glass*` component names are retained (`GlassCard`, `GlassButton`,
`GlassInput`, `GlassTable`, `GlassForm`) because the design brief forbids
renaming exports and the pages import them by name. The styling is not glass:
all `backdrop-blur` was removed. The names are historical identifiers, not a
description of the surface treatment. The same applies to `BentoGrid`, which is
now a plain four-up metric row rather than a mosaic.

New primitives added by this pass, with the reason each exists:

| Component | Why it exists |
|---|---|
| `Chip` | Filter labels, deltas and state tokens need one tint vocabulary. Tones are the semantic set only; there is no arbitrary colour prop. |
| `TrendChart` | The dashboard's trend panel. One series, because the donut and the map already answer "which zone". |
| `LoadDonut` | Three parts of one whole, with the whole stated in the ring's centre. |
| `RowMenu` | The per-row actions overflow. A real menu, so the trigger is not a dead glyph. |
| `AppLayout` / `AppSidebar` / `AppTopbar` / `AppSearch` | The reference shell. `FloatingNavbar` was removed with it: it had been a rail for three redesigns and the name had stopped describing anything. |
| `UserContext` | One auth listener, read by the shell and the pages, instead of one listener per caller. |

---

## Accessibility contract

- Every text/background pair is measured, never eyeballed. Values above.
- Every interactive target is at least 44x44px on touch, and only drops to
  34 to 40px from `lg`, where a pointer is doing the clicking.
- Every interactive element is reachable and operable by keyboard, with a
  visible focus ring at 3:1 or better.
- Risk is never conveyed by colour alone: icon **and** text label **and**
  colour, always.
- Every data view has a loading, empty and error state, and the copy names the
  cause and the next action rather than saying "No data".
- Live pressure numbers are `aria-live="off"`. Only a *change in risk level* is
  announced, through one `aria-live="polite"` region. Announcing three numbers
  every second would make the page unusable with a screen reader.
- A `<table>` is only rendered from `md` up; below that the same rows render as
  stacked definition rows, because a table cannot reflow and horizontal scroll
  on a phone is not a layout.
- The mobile drawer is a real dialog: focus moves in, Escape closes, the page
  behind cannot scroll, and focus returns to the trigger.
- Forms label above the input, errors below in text. Fields scroll into view
  above the on-screen keyboard.

---

## Anti-slop constraints specific to this product

- No em dashes in shipped copy. The shipped copy is Indonesian only, so one
  dictionary holds to this rule. A middot or a pipe separates ideas instead.
- No fabricated telemetry. If a value is not measured, it reads as unavailable
  or carries an explicit Simulation label. No random numbers dressed as live
  data.
- The reference's four decorative stat-card tints, its invented patient rows,
  its revenue figure and its "Clinic status: Optimal" line are all content
  from a different product. The layout is adopted; the content is not.
- The two chips that look like the reference's trend markers are computed from
  the real ring buffer (mean peak of the newer half against the older half,
  with a 3 percent dead band), not written into the markup.
- No invented statistics, testimonials, compliance claims or user counts. This
  is a thesis instrument; the only evidence shown is real measured output.
- No dead controls. A button that cannot act is a defect, not decoration. The
  reference's "Export PDF" and "New Session" become the two actions this
  product actually has: export the session buffer to CSV, and mark the alert
  queue as read.
- No skeleton or placeholder blocks used as a product screenshot: the landing
  page shows the real heatmap component running.

---

## Landing page variant (warm dialect)

The public landing page speaks a warmer register of the same language. The app
pages keep the clinical console above; the two scales are documented side by
side, never mixed within one surface.

Structure: floating pill nav, full-viewport hero with drifting tiles and the
real heatmap, "why" spec band, six-feature grid, dark capabilities panel, three
split "how it works" rows, three-step start flow, three-layer technology stack,
and a closing CTA panel. The copy is this product's real content: no studio
branding, no fabricated testimonials, no sample pricing, no fake customer logos.

The landing is **light-only by design**. `.landing-scope` in `src/index.css`
re-declares the light semantic tokens, so every in-app component (GlassCard,
StatusChip, GlassButton focus rings) renders in its measured light form on the
warm surface. There is no theme switch on the landing: on a light-only page it
would be a dead control. The language switch is still present and still works,
but the stored-preference reader now forces Indonesian for any preference left
behind, and removing the switch is the Indonesian-only requirement owned by
Phase 5 (LANG-01).

Palette, all measured on `#F4F5F5` raised:

| Token | Hex | Role | Measured |
|---|---|---|---|
| `warm-canvas` | `#ECEDEE` | page canvas | - |
| `warm-raised` | `#F4F5F5` | hero panel, spec band | - |
| `warm-card` | `#FFFFFF` | cards, nav pill | - |
| `warm-ink` | `#2E3034` | headings | 11.3:1 on canvas (AAA) |
| `warm-body` | `#55575c` | body text | 6.62:1 on raised (AA) |
| `warm-caption` | `#5A6270` | captions | 5.64:1 on raised (AA) |
| `warm-accent-deep` | `#C93A24` | text-safe accent, button fill | 4.70:1 on raised; white on it 5.13:1 (AA) |
| `warm-accent` | `#E34A32` | graphics only | 3.98:1: clears the 3:1 graphical-object bar, fails text AA |
| `warm-accent-2` | `#F05A3C` | dark-panel icons | decorative |
| `warm-dark` | `#171719` | dark panels, featured card | - |
| `warm-panel` ... `warm-panel-4` | `#202024`-`#34343a` | dark panel cells | white/55 on panel is about 6.4:1 |

`warm-caption` replaces the reference export's `#8a8c91`, which measured 3.1:1
and failed AA for 12px text. `warm-accent` is never used for a label;
`warm-accent-deep` is its text-safe form.

Radius scale (landing only): tile 12px, panel 16px, cards 24px
(`rounded-3xl`), inner cells 28px, big panels 32 to 36px, hero 28px
(40px on `sm`+), nav and CTAs pill (999px). Pills are the landing's navigation
and actions; the app register keeps its 8px control scale.

Motion budget: hero rise-in (420ms), scroll reveal via one IntersectionObserver
(700ms, opacity and translate only), hover and focus transitions at 150ms,
drifting headline tiles (one rAF loop), smooth scrolling. All of it is disabled
under `prefers-reduced-motion`. No WebGL, no parallax, no char-weight rAF: the
reference export's continuous animations were removed because the audience
includes elderly users on low-end devices, and the app pages stay at MOTION 1.

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
