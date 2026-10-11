# DESIGN.md - Smart Insole IoT Dashboard

> Direction document. It decides *what to build*; `antislop.md` decides what is
> allowed to ship. Every rule below is enforceable, and every value carries a
> one-line reason (antislop R-31).

## Design Read

Reading this as a realtime clinical plantar-pressure console for elderly
diabetic patients and their caregivers, in a light clinical-documentation
language (measurement-first, instrument panel), dial
**ENERGY 2 / RHYTHM 2 / MOTION 1**.

| Dial | Value | Why |
|---|---|---|
| ENERGY | 2 | It is an instrument, not a marketing page. Calm and legible. Above 1 only because risk states must be able to shout. |
| RHYTHM | 2 | A consistent grid, broken deliberately in one place: the heatmap. Variation that is everywhere is noise. |
| MOTION | 1 | Numbers already update every second. Decorative motion competes with the data, so only hover, focus and value transitions move. |

## The identity motif

**Colour is a vital sign.**

The chrome is near-monochrome ink on paper. Saturation is reserved
*exclusively* for pressure and risk. Nothing decorative is ever saturated.

That single rule does four jobs at once: it makes the heatmap the unambiguous
focal point on every screen, it resolves the palette-count limit, it survives a
logo swap (the design is still recognisable with the wordmark removed), and it
means that when something on screen is coloured, it is because a foot needs
attention.

## Theme: light, and only light

Chosen by the product owner. The written reason: patients and clinicians read
this in daylight, and elderly users benefit more from dark ink on a light
surface than from the reverse.

Because exactly one theme ships, there is no half-built toggle to break
(antislop R-34 does not apply), and no `dark:` variants exist anywhere.

## Palette

Maximum one chromatic chrome colour (the accent) plus the three risk semantics.
Neutrals do not count toward that limit.

| Token | Hex | Role | Measured |
|---|---|---|---|
| `bg` | `#F7F8FA` | page canvas | - |
| `card` | `#FFFFFF` | card surface | - |
| `fg` | `#14161A` | primary ink | 18.11:1 on white, 17.04:1 on bg (AAA) |
| `muted` | `#5A6270` | secondary ink | 6.15:1 on white, 5.79:1 on bg (AA) |
| `primary` | `#1D4ED8` | the one accent: actions, links, focus | 6.70:1 with white, both directions (AA) |
| `border` | `#DCE0E6` | hairlines, decorative only | 1.33:1 - never the sole carrier of meaning |
| `border.control` | `#7C8695` | input and control outlines | 3.47:1 on bg (passes non-text) |
| `safe` | `#047857` | risk: Aman / Safe | 5.48:1 on white, 5.21:1 on `safe.tint` |
| `warning` | `#B45309` | risk: Waspada / Warning | 5.02:1 on white, 4.84:1 on `warning.tint` |
| `danger` | `#B91C1C` | risk: Bahaya / Danger | 6.47:1 on white, 5.91:1 on `danger.tint` |

The brief's dark-theme risk values (`#10B981`, `#F59E0B`, `#EF4444`) fail AA as
text on light surfaces (roughly 2.2 to 3.3:1), and they also measure under the
3:1 a graphical object needs against the light sole fill the heatmap draws on
(2.14, 1.81 and 3.18). They are therefore not shipped at all. The darkened
versions above are used everywhere a risk colour appears: the status chips, the
heatmap node fills, the legend swatches, the score meter. Measured against the
sole fill they come out at 4.63, 4.24 and 5.46.

This is deliberate: one meaning, one colour. There is no bright chart-only
variant that could drift out of sync with the chip that says the same thing.

Each risk colour also owns a tint (`safe.tint` `#ECFDF5`, `warning.tint`
`#FFFBEB`, `danger.tint` `#FEF2F2`) for badge backgrounds, always paired with
the matching dark text.

### Data visualisation

Three series colours, Okabe-Ito, chosen because it is the standard
colour-vision-deficiency-safe categorical set:

| Series | Hex | Passes as a line |
|---|---|---|
| Forefoot | `#0072B2` | 5.19:1 |
| Midfoot | `#D55E00` | 3.87:1 |
| Heel | `#009E73` | 3.42:1 |

The midfoot and heel values are under the 4.5:1 that text needs, and that is
intentional: a polyline is a graphical object, so the bar is 3:1, and they clear
it. Anything that reads as text in the chart (axis ticks, the threshold label,
the legend labels) uses `fg` or `muted` instead, never a series colour.

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
| Headings, big numerals | Manrope | Geometric and slightly condensed, so large clinical numerals read as instrument readouts rather than marketing type. |
| Body, labels, data | Inter | Neutral in long clinical strings and, with `tabular-nums`, gives figures a fixed width, so a value updating every second does not make the layout twitch. |

Every kPa figure carries `tabular-kpa` (or Tailwind's `tabular-nums`).

Type scale moves up one step at `md` and `lg` (`text-2xl md:text-3xl`), so
desktop headings are slightly larger without mobile inheriting desktop sizes.

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
No horizontal overflow is permitted at any width, and nothing is clipped at
200% zoom.

## Radius and elevation

One documented scale, applied everywhere:

| Element | Radius |
|---|---|
| Cards, panels, modals | `10px` (`rounded-card`) |
| Inputs, buttons, selects | `8px` (`rounded-control`) |
| Status pills and dots | full (`999px`) |

Pills are reserved for status, which is the only thing that *is* pill-shaped in
this product. Cards are never pills.

**Elevation:** cards use a `1px` border and no shadow. Exactly one shadow token
exists (`shadow-overlay`, plus `shadow-nav` for the fixed bar) and it is
reserved for things that genuinely float above the page: the alert modal, the
simulator sheet, the navigation bar. A page where everything floats has no
hierarchy left to express.

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

- No em dashes in shipped copy (antislop R-02), in either language.
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
navigation and actions; the instrument pages keep their tight 2-4px
scale. One shadow scale: `card`, `lift`, `nav`, `glow`.

Motion budget: hero rise-in (420ms), scroll reveal via one
IntersectionObserver (700ms, opacity and translate only), hover and
focus transitions at 150ms, drifting headline tiles (one rAF loop),
smooth scrolling. All of it is disabled under
`prefers-reduced-motion`. No WebGL, no parallax, no char-weight
rAF: the reference export's continuous animations were removed
because the audience includes elderly users on low-end devices, and
the instrument pages stay at MOTION 1.

Deliberately not adopted from the reference: fabricated
testimonials, fake customer logos, sample pricing, external stock
photos, and the placeholder disclaimer that admits the numbers are
fake. A thesis instrument shows real measured output only.

The landing nav is a floating pill at the top, distinct from the
app's bottom bar: the landing is a marketing surface with four
anchor links, the app is a task surface with six destinations.

