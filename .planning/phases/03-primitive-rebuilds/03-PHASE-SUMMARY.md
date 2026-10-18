# Phase 3 — Primitive rebuilds: phase summary

Closed 2026-10-18. Seven plans, all landed. **34 test files, 314 tests, all
passing. `npm run build` exits 0.**

This phase's per-plan SUMMARYs exist only because the ROADMAP's progress counter
reads them. They are short. This is the one document that describes the phase.

## What changed on screen

The phase's job was to make the *primitives* right, so the visible change is
broad and cheap rather than showy. Six things a reader can see:

1. **The eight landing CTAs render the landing register again.** They had been
   silently falling back to the app-register navy button since before Phase 2,
   because `warm` and `warmOutline` were declared nowhere in `GlassButton`'s
   variant map. The two visual registers no longer bleed into each other.
2. **The load donut's three arcs are the Okabe-Ito series colours, and they
   cannot lie about which zone they represent.** Each arc resolves its colour
   from its own zone key through one module, instead of being handed a colour by
   the dashboard.
3. **A wrong key is now loud in development.** `GlassButton`, `Chip`,
   `StatusChip`, `StatePanel` and the banner all keep their benign production
   fallback — a blank panel is worse than a correct-looking one on a clinical
   console — and all of them now name the key they did not know, in development,
   where the mistake was written.
4. **The loading skeleton no longer pulses.** A skeleton that animates forever
   competes with the risk announcement for a clinician's attention. The bars keep
   their height, radius and computed width, so the reserved space is identical.
5. **Two measured AA contrast failures are fixed**: the raised table column head
   moves off the muted ink, and the state panel's description line moves off it
   too (it sits on a tone tint).
6. **Fourteen admin feedback surfaces now say what to do next**, not only what
   went wrong. `StatePanel` gained a next-step tier, and the five `/admin` sites
   were repaired: the access-denied guard and the error and empty arms for users
   and for devices.

## What is now enforced, rather than intended

The phase's real output is gates. Five of them, each proved failing before it was
trusted:

| Gate | Fails on |
|---|---|
| `variantKeys.test.js` | an undeclared literal `variant=`, `level=` or `tone=` anywhere in the shipped `.jsx` |
| `seriesQuarantine.test.js` | a raw `--series-N` outside `index.css` and `utils/series.js`, in `.jsx` or `.js` |
| `radiusScale.test.js` | a bare `rounded` or an undeclared radius step under `src/components/ui/` |
| `liveRegion.test.js` | a fifth polite region, a live number inside a live region, or a changed `InsoleContext` guard |
| `designTokens.test.js` | (Phase 2's, widened in practice) any utility class the real Tailwind config generates no rule for |

The pattern behind them: this codebase's defect shape is the **silent fallback**.
A primitive that does not know a key does not fail — it renders something
plausible. Every gate above exists because "plausible" was mistaken for "correct"
at least once.

## Decisions made while executing

Three of the plans' own instructions could not be followed to the letter. Each was
resolved toward the invariant the plan was protecting, and each is recorded in
`WINDOWS.md`:

- **The bento icon tile keeps its `h-12 w-12` square.** 03-06 asked for "no height
  utility at all … and the same for the icon tile inside it", while its own
  acceptance criteria require `git diff BentoGrid.jsx` to be empty. The
  content-driven floor applies to the CELL; the tile is a decorative glyph frame
  that holds no copy that could be clipped. The lock asserts the full property on
  the cell and no floor, ceiling or stretch on the tile.
- **`aria-live="off"` was not added.** Success criterion 5 is phrased with that
  attribute and no such attribute exists anywhere under `src/`. The live numbers
  are simply outside every live region, which is the stronger form of the rule.
  The gate asserts the absence, so both adding an `off` attribute and adding a
  real region fail.
- **The quarantine gate strips comments.** Without it, a chart's own header
  comment naming the property it reads would fail its own gate. The alternative —
  exempting every chart file by name — would have weakened the rule to "charts may
  reference series properties".

## Deliberately NOT fixed

Recorded, not absorbed. Each has an owner.

- **WR-02** (the `InsoleContext` connect guard mismatch) stays open. Phase 3 does
  not touch it, and `liveRegion.test.js` now asserts the guard verbatim so a later
  "cleanup" fails a gate rather than changing when the device connects.
- **Eight feedback panels with no next step** — `DashboardPage.jsx:515`,
  `DashboardPage.jsx:557`, `DevicePage.jsx:142`, `HistoryPage.jsx:305`,
  `MonitoringPage.jsx:137`, `ProfilePage.jsx:82`, `ProfilePage.jsx:185`,
  `SettingsPage.jsx:303`. Phase 5's work. `StatePanel` warns about them meanwhile.
- **F-01** (`DESIGN.md:518-541`) is reported, not fixed. No palette hex value
  changed in this phase.
- **`App.jsx:111`'s `animate-spin`** still violates MOTION 1. Phase 4 (N-05).
- **`web-dashboard/dist/` is tracked**, so every build dirties the tree. Every
  Phase 3 build was reverted rather than staged. Repo-hygiene decision, not a
  plan's.

## Awaiting the owner

`DESIGN.md`'s two amendments — the `Single source` clause naming
`src/utils/series.js`, and the `TrendChart` non-identity carve-out record — are
**awaiting countersignature**. Non-blocking: the code side of D-04 and D-05 is
enforced by the quarantine gate and by 03-04's tests.

## Not verifiable here

The three-viewport click-through (360 / 768 / 1280 px) that `AGENTS.md` requires
was not run for any Phase 3 change: **this environment has no browser.** jsdom has
no layout engine, so it can prove structure, semantics and class lists, and it
cannot prove that anything looks right. Every phase left the same entry in
`WINDOWS.md`. The structural half is locked by unit tests; the visual half needs a
human pass.

## What Phase 4 inherits

The primitives are now correct and gated, so Phase 4's shell can be assembled from
them rather than re-decided. What Phase 4 must still do: build the rail, top bar,
combobox search and mobile drawer; remove `App.jsx:111`'s spin; and carry the
`aria-live` contract into the shell unchanged.
