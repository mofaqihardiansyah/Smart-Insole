# DESIGN.md - Smart Insole IoT Dashboard

> Direction document. It decides *what to build*. Every rule below is
> enforceable, and every value carries a one-line reason.

## Design Read

Reading this as a realtime clinical plantar-pressure console for elderly
diabetic patients and their caregivers, in a calm, trustworthy health
language: **ENERGY 2 / RHYTHM 2 / MOTION 1**.

| Dial | Value | Why |
|---|---|---|
| ENERGY | 2 | It is an instrument, not a marketing page. Calm and legible. Above 1 only because risk states must be able to shout. |
| RHYTHM | 2 | A consistent grid, broken deliberately in one place: the heatmap. Variation that is everywhere is noise. |
| MOTION | 1 | Numbers already update every second. Decorative motion competes with the data, so only hover, focus and value transitions move. |

## The identity motif

**Colour is a vital sign.**

The chrome is near-monochrome navy and white. Saturation is reserved
*exclusively* for pressure and risk. Nothing decorative is ever saturated.

That single rule does four jobs at once: it makes the heatmap the unambiguous
focal point on every screen, it resolves the palette-count limit, it survives a
logo swap (the design is still recognisable with the wordmark removed), and
means that when something on screen is coloured, it is because a foot needs
attention.

## Theme: light, and only light

Chosen by the product owner. The written reason: patients and clinicians read
this in daylight, and elderly users benefit more from dark ink on a light
surface than from the reverse.

Because exactly one theme ships, there is no half-built toggle to break, and
no `dark:` variants exist anywhere.

## Palette

Maximum one chromatic chrome colour (the accent) plus the three risk semantics.
Neutrals do not count toward that limit.

| Token | Hex | Role | Measured |
|---|---|---|---|
| `bg` | `#F8FAFC` | page canvas | - |
| `surface` | `#FFFFFF` | card surface | - |
| `fg` | `#0F172A` | primary ink | 18.1:1 on white (AAA) |
| `fg-2` | `#334155` | secondary text | 12.6:1 on white (AAA) |
| `muted` | `#64748B` | captions, units | 4.8:1 on white (AA) |
| `primary` | `#0F172A` | navy: actions, links, focus | 18.1:1 on white (AAA) |
| `primary-hover` | `#020617` | button hover fill | - |
| `secondary` | `#059669` | sage: interactive, positive states | 4.6:1 on white (AA) |
| `tertiary` | `#0EA5E9` | info blue | 3.0:1: graphics and large text only |
| `border` | `#E2E8F0` | hairlines, decorative only | 1.1:1 - never the sole carrier of meaning |
| `border-strong` | `#CBD5E1` | card edge | 1.3:1 |
| `border-control` | `#7C8695` | input and control outlines | 3.47:1 on bg (passes non-text) |
| `safe` | `#16A34A` | risk: Aman / Safe | 4.5:1 on white (AA) |
| `warning` | `#CA8A04` | risk: Waspada / Warning | 4.6:1 on white (AA) |
| `danger` | `#DC2626` | risk: Bahaya / Danger | 5.9:1 on white (AA) |
| `danger-hover` | `#DC2626` | destructive button hover fill | - |

The bright risk values (`#22C55E`, `#EAB308`, `#EF4444`) fail AA as text on
light surfaces (roughly 2.2 to 3.3:1), and they also measure under the 3:1 a
graphical object needs against the light sole fill the heatmap draws on. They
are therefore not shipped at all. The darkened versions above are used
everywhere a risk colour appears: the status chips, the heatmap node fills,
the legend swatches, the score meter.

This is deliberate: one meaning, one colour. There is no bright chart-only
variant that could drift out of sync with the chip that says the same thing.

### Data visualisation

Three series colours, Okabe-Ito, chosen because it is the standard
colour-vision-deficiency-safe categorical set:

| Series | Hex | Passes as a line |
|---|---|---|
| Forefoot | `#0072B2` | 5.19:1 |
| Midfoot | `#D55E00` | 3.87:1 |
| Heel | `#009E73` | 3.42:1 |

The midfoot and heel values are under the 4.5:1 that text needs, and that is
intentional: a polyline is a graphical object, so the bar is 3:1, and they
clear it. Anything that reads as text in the chart (axis ticks, the threshold
label, the legend labels) uses `fg` or `muted` instead, never a series colour.

**Single source:** these three values are defined once, in the `SERIES` array in
`web-dashboard/src/components/monitoring/TelemetryChart.jsx`. Every stroke, dot,
legend swatch and screen-reader table row reads from it. The Heatmap uses the
risk tokens instead, because the heatmap encodes pressure magnitude, which is a
risk question, not a series-identity question.

**Quarantine rule:** the three series colours appear *only* inside the chart.
They never touch buttons, badges, navigation or headings, which keeps the chart
palette separate from the chrome palette instead of flooding the page with hues.

## Typography

| Use | Family | Reason |
|---|---|---|
| Headings, big numerals | Plus Jakarta Sans | Geometric and slightly condensed, so large clinical numerals read as instrument readouts rather than marketing type. |
| Body, labels, data | DM Sans | Neutral in long clinical strings and, with `tabular-nums`, gives figures a fixed width, so a value updating every second does not make the layout twitch. |
| Vitals, code | Fira Code | Monospace for tabular numeral alignment in kPa readouts. |

Every kPa figure carries `tabular-data` (or Tailwind's `tabular-nums`).

Type scale:

| Token | Size | Weight | Line height |
|---|---|---|---|
| Display | 40px | 700 | 1.15 |
| H1 | 32px | 700 | 1.2 |
| H2 | 24px | 600 | 1.25 |
| H3 | 20px | 600 | 1.3 |
| H4 | 16px | 500 | 1.35 |
| Body LG | 18px | 400 | 1.6 |
| Body | 16px | 400 | 1.6 |
| Body SM | 14px | 400 | 1.5 |
| Caption | 12px | 500 | 1.4 |
| Code | 14px | 400 | 1.6 |

Type scale moves up one step at `md` and `lg`, so desktop headings are
slightly larger without mobile inheriting desktop sizes.

## Layout and breakpoints

Breakpoints are placed where the content stops working, not at device widths.

| Width | State |
|---|---|
| `< 640px` | Single column. Bottom navigation. Heatmap first, metrics beneath it. |
| `640px - 1023px` | Two-column bento, table still reflows to cards, top navigation appears. |
| `>= 1024px` | Dashboard becomes two zones: heatmap spanning two columns on the left, metrics and risk on the right, telemetry full width below. Content capped at `max-w-7xl`. |

Mobile is a designed state, not a squeezed desktop: the table becomes stacked
definition rows (a `<table>` cannot reflow), the navigation becomes a bottom bar,
spacing and type drop one register.

Nothing is `100vh`; full-height sections use `min-h-[100dvh]` or content height.
No horizontal overflow is permitted at any width, and nothing is clipped at 200%
zoom.

## Radius and elevation

One documented scale, applied everywhere:

| Element | Radius |
|---|---|
| Badges, small tags | 4px (`rounded-sm`) |
| Buttons, cards, inputs | 8px (`rounded-control`) |
| Modals, dropdown panels | 12px (`rounded-md`) |
| Large containers, hero sections | 16px (`rounded-lg`) |
| Avatars, status indicators | full (`rounded-full`) |

Pills are reserved for navigation and primary actions. Cards are never pills.

**Elevation:** gentle, diffused shadows. Navy at low opacity, never black.

| Token | Shadow | Use |
|---|---|---|
| `sm` | 1px offset, 3px blur, navy 3% | Buttons, chips |
| `DEFAULT` | 2px offset, 6px blur, navy 5% | Cards, dropdowns |
| `md` | 4px offset, 16px blur, navy 7% | Elevated cards |
| `lg` | 8px offset, 32px blur, navy 10% | Modals, panels |

Cards use a 1px border and no shadow by default. Exactly one elevated card
shadow token exists and it is reserved for cards that genuinely float above the
page. A page where everything floats has no hierarchy left to express.

## Motion

`MOTION 1`. Permitted motion, each with its reason:

- Colour and border transitions on hover and focus (state feedback, <= 150ms).
- The heatmap's danger-node pulse (draws the eye to the point that needs relief).
- Number transitions on value change (so the eye can follow the update).

Forbidden: scroll reveals, parallax, entrance animations, floating elements,
`window.addEventListener('scroll')`, and anything that ignores
`prefers-reduced-motion`.

## Navigation structure

Six destinations, chosen because each is a distinct task rather than a page
type: Dashboard, Monitoring, History, Device, Settings, Profile. Notifications
is reached from the header, because it is a state of the app rather than a
place in it.

Mobile uses a bottom bar with icon **plus** a visible short label. The brief
described icon-only mobile navigation; that was changed deliberately, because
icon-only navigation excludes the elderly audience the product targets (it is
the same failure mode as an unlabelled hamburger). Labels are short enough to
sit under a 44px target on a 360px screen.

## Component naming

The `Glass*` component names are retained (`GlassCard`, `GlassButton`,
`GlassInput`, `GlassTable`, `GlassForm`) because the design brief forbids
renaming exports and the pages import them by name. The styling is no longer
glass: all `backdrop-blur` was removed. The names are historical identifiers,
not a description of the surface treatment.

## Accessibility contract

- Every text/background pair is measured, never eyeballed. Values above.
- Every interactive target is at least 44x44px on touch, with spacing between
  neighbours.
- Every interactive element is reachable and operable by keyboard, with a
  visible focus ring at 3:1 or better.
- Risk is never conveyed by colour alone: icon **and** text label **and**
  colour, always.
- Every data view has a loading, empty and error state.
- Live pressure numbers are `aria-live="off"`. Only a *change in risk level* is
  announced, through one `aria-live="polite"` region. Announcing three numbers
  every second would make the page unusable with a screen reader.
- Forms label above the input, errors below in text. Fields scroll into view
  above the on-screen keyboard.

## Anti-slop constraints specific to this product

- No em dashes in shipped copy, in either language.
- No fabricated telemetry. If a value is not measured, it reads as unavailable
  or carries an explicit Simulation label. No random numbers dressed as live
  data.
- No invented statistics, testimonials, compliance claims or user counts. This
  is a thesis instrument; the only evidence shown is real measured output.
- No dead controls. A button that cannot act is a defect, not decoration.
- No skeleton or placeholder blocks used as a product screenshot: the landing
  page shows the real heatmap component running.

## Landing page variant (SprintForge-adapted)

The public landing page speaks a warmer dialect of the same language.
The app pages keep the clinical instrument language above; the two
scales are documented side by side, never mixed within one surface.

Structure follows the SprintForge reference section for section:
floating pill nav, full-viewport hero with drifting tiles and the
real heatmap, "why" spec band, six-feature grid, dark capabilities
panel, three split "how it works" rows, three-step start flow,
three-layer technology stack, and a closing CTA panel. The copy is
this product's real content: no studio branding, no fabricated
testimonials, no sample pricing, no fake customer logos.

The landing is **light-only by design**. `.landing-scope` in
`src/index.css` re-declares the light semantic tokens, so every
in-app component (GlassCard, StatusChip, GlassButton focus rings)
renders in its measured light form on the warm surface, whatever
theme the visitor picked elsewhere. There is no theme switch on the
landing: on a light-only page it would be a dead control. Language
stays switchable.

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
| `warm-panel` … `warm-panel-4` | `#202024`–`#34343a` | dark panel cells | white/55 on panel ≈ 6.4:1 |

`warm-caption` replaces the reference export's `#8a8c91`, which
measured 3.1:1 and failed AA for 12px text. `warm-accent` is never
used for a label; `warm-accent-deep` is its text-safe form.

Radius scale (landing only): tile 12px, panel 16px, cards 24px
(`rounded-3xl`), inner cells 28px, big panels 32–36px, hero 28px
(40px on `sm`+), nav and CTAs pill (999px). Pills are the landing's
navigation and actions; the instrument pages keep their 8px scale.

Motion budget: hero rise-in (420ms), scroll reveal via one
IntersectionObserver (700ms, opacity and translate only), hover and
focus transitions at 150ms, drifting headline tiles (one rAF loop),
smooth scrolling. All of it is disabled under `prefers-reduced-motion`.
No WebGL, no parallax, no char-weight rAF: the reference export's
continuous animations were removed because the audience includes
elderly users on low-end devices, and the instrument pages stay at
MOTION 1.

Deliberately not adopted from the reference: fabricated
testimonials, fake customer logos, sample pricing, external stock
photos, and the placeholder disclaimer that admits the numbers are
fake. A thesis instrument shows real measured output only.

The landing nav is a floating pill at the top, distinct from the
app's bottom bar: the landing is a marketing surface with four
anchor links, the app is a task surface with six destinations.
