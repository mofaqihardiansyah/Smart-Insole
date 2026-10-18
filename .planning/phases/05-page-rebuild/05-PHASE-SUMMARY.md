# Phase 5: Page-by-page rebuild — Phase Summary

Milestone v1.0 · closed 2026-10-18 · executed directly, without plan files ·
the GSD per-plan machinery stays off for phases 4-6 (owner decision)

## What the phase found

Reading all eleven page files against `DESIGN.md` and the ledger turned the
phase from "rebuild ten pages" into "close the sweep the ledger already
owned". The pages already composed the fixed primitives from Phase 3 and the
gated shell from Phase 4: every page opens with a `PageHeader`, panels open
with a `PanelHeader`, feedback renders through `StatePanel`, `StatusBanner`
and `StatusChip`, and the dual table/list register for data pages was in
place. What was actually broken was narrower:

1. **Eight panels named a cause with no next step** (WINDOWS entry 20,
   carried from 03-07): Dashboard trend + feed empties, Device's
   no-device panel, History's empty register, Monitoring's empty chart,
   Profile's account + stats panels, Settings' preview empty arm.
2. **`StatusBanner` could not carry a next step at all**: it dropped the
   `nextAction` prop instead of forwarding it to `AlertBanner`.
3. **AdminPage was off-idiom**: failures surfaced as blocking
   `window.alert` dialogs, and the two global threshold fields were raw
   `<input>` elements with hand-rolled styling, outside the input
   vocabulary every other page uses.
4. **The landing still held Phase 2's D-13 carry-forward**: 49 built-in
   text-size classes, six raw pixel radii (`rounded-[26px]` ... 36px), and
   duplicated `rounded-2xl`/`rounded-xl` over `panel`/`tile`.

## What landed (five code commits)

- `41a6b954` - `StatusBanner` forwards `nextAction`; Login and Register
  danger banners name the step ("Periksa koneksi, lalu coba lagi."). Closed
  WINDOWS entry 13.
- `b232c8df` - the full two-tier sweep: all 14 `StatePanel`
  empty/error panels across 8 pages carry `action=` or `nextAction=`; 8 new
  dictionary keys (id + en), each wording flowing from that panel's own
  description. Closed WINDOWS entry 20. History's empty register is the one
  panel whose next step is deliberately "nothing to do" - its body explains
  why, the step says so in words ("tidak ada yang perlu diperbaiki").
- `a2d38550` - AdminPage: action failures are inline danger banners
  (Firebase detail as body, translated title, shared
  `nextStepCheckConnection` as the step); `window.confirm` stays native and
  is documented as deliberate; threshold fields are `GlassInput` with
  `min`/`max`/`inputMode`; the "Device read failed" fallback literal is
  gone. The error-detail pattern (raw Firebase string beneath a translated
  title, same as the login page) is recorded as accepted in the ledger.
- `eebb19e0` - landing re-derivation (D-13): new `landing-h2` font token
  (30px rising to 48px, one fluid step, weight 600) covers every section
  heading and the closing CTA; new `cell` (28px), `section` (32px),
  `section-lg` (36px) radius hooks; every built-in size class resolved to a
  declared token (`body-sm`, `body`, `body-lg`, `caption`, `h2`,
  `card-title`); the panel/tile duplicates folded. `DESIGN.md` now states
  the landing heading rule (pages resolve to `display` / `landing-h2` /
  `h2` / `card-title`, nothing else) and the named radius register.
- `da338a61` - `pagesContract.test.js`, a static gate over the page
  sources with four tests: every page carries breakpoint-scoped classes
  (PAGE-11), the warm register never appears on an app page and the
  clinical surface tokens never appear on the landing (PAGE-12), and every
  empty/error `StatePanel` in the app pages carries the next step.

## Gates

- All three new gates were proven failing first: warm-class contamination,
  a stripped `nextAction`, and a page with only one responsive class each
  failed the contract before being reverted.
- Final suite: **36 files / 342 tests green**; `npm run build` exit 0 after
  every commit; `web-dashboard/dist` restored to clean after each build.

## Deliberately not done

- `window.confirm` on destructive admin actions stays - native, accessible,
  and the confirmation flow works; replacing it with an inline pattern was
  out of scope for the sweep.
- Raw Firebase error strings as panel descriptions remain the accepted
  pattern (translated title above, technical detail beneath), same as the
  login page; recorded as a deviation in the ledger rather than translated,
  because the service layer is outside the dictionary's ownership.
- `DICTIONARY.en` keeps ~360 lines of dead weight - the a3 cleanup was
  declined at Phase 5 scoping (LANG-01 executed as a1 only).
- `copy.test.js`-forbidden dashes: checked; the phase's new sources carry
  none.

## Owed to the owner

- Visual pass at 360/768/1280 for every touched page; ledgered as
  `unrun-verify` entries (arkada: `web-dashboard/src/pages/AdminPage.jsx`,
  `web-dashboard/src/pages/LandingPage.jsx` ledger note for the re-derived
  scale, plus the pre-entry landing click-through entries 3 and 7).
- `DESIGN.md` countersignatures still pending: the Batch 0 amendment at
  `DESIGN.md:326`, the single-source clause naming `src/utils/series.js`,
  the `TrendChart` non-identity `--secondary` carve-out, and the landing
  scale/radius mapping added this phase (near the "Landing page variant"
  section).
- `DESIGN.md:518-541` F-01 remains reported, not fixed.

## State after the phase

- REQUIREMENTS: PAGE-01..12 and LANG-01 flipped to Complete; PAGE-13
  ticked (AdminPage beyond the 10 routes, owner decision). GATE/OIL rows
  stay for Phase 6.
- ROADMAP: Phase 5 outcome line written.
- Ledger: 39 open entries (2 fixed this phase), heavily skewed to
  `unrun-verify` visual-pass items owned by the human UAT in Phase 6.
