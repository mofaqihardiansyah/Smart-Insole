---
phase: 03-primitive-rebuilds
plan: 06
subsystem: ui
tags: [react, tailwind, vitest, jsdom, design-tokens, dev-warning, call-site-gate, contrast]

# Dependency graph
requires:
  - phase: 03-primitive-rebuilds
    provides: "03-01's `variantKeys.test.js` walk, exclusions and floors, plus `utils/devWarn.js`; 03-03's `AlertBanner` tone vocabulary"
provides:
  - "both chips warning in development on an undeclared key, keeping their declared fallbacks (`Chip` → `neutral`, `StatusChip` → `safe`/`md`) (D-01, D-03)"
  - "the `tone=` half of the call-site key gate, reading the chip vocabulary from `Chip.jsx` and the banner vocabulary from `AlertBanner.jsx` (D-01)"
  - "`Chip.test.jsx` — the tone-pair lock, the borrow lock, the unknown-tone warning lock and the long-label lock"
  - "the raised column head on `fg-2` instead of the muted ink (M-01a, T-03-17)"
  - "`GlassTable.test.jsx` — the ink lock, the head's style lock and the single-scroller lock"
  - "the positive lock on a bento cell's content-driven floor (T-03-18)"
affects: [03-05, 05-page-rebuild, 06-delivery-gate]

# Actuals (#2632) — realized diff, same chars/4 scale as the plan's estimate.
actuals:
  tokens: 9400
  tasks: 3
  commits: 3
---

## What shipped

- `Chip.jsx` warns through `devWarn` when `tone` is not a key of `TONES`, then
  falls through to `TONES.neutral` exactly as before. The tone values, the
  radius branch, the type branch and the exported vocabulary are unchanged; the
  component moved from an expression body to a block body so the check can run
  before the class string is built.
- `StatusChip.jsx` does the same for an undeclared `level` and an undeclared
  `size`. `LEVELS`, `SIZES`, the three redundant channels and the exported
  vocabulary are untouched — `git diff` on the file adds the import, the two
  guards and their comments and nothing else. In particular the pre-existing
  benign-fallback case at `StatusChip.test.jsx:81-87` still passes unchanged; it
  now also prints the warning it was always entitled to print.
- `variantKeys.test.js` widens to a third attribute. The `tone=` vocabulary is
  the union of two owners — `Chip`'s tones and the banner tones on `AlertBanner`
  — because the prop is shared by more components than any other key here. Both
  maps are read with the existing `mapKeys`, which throws rather than returning
  empty, and a `TONE_FLOOR` of 2 sits beside the existing floors. The header
  paragraph that said the half was deferred is replaced by one naming both
  owners.
- `GlassTable.jsx:70`: the column head's ink moves from `text-muted` to
  `text-fg-2`, because that cell sits on the raised `bg-surface-2` tint where
  `muted` falls under AA. The one-line diff changes that token and nothing else.
- `Chip.test.jsx`, `GlassTable.test.jsx` and three new cases on
  `BentoGrid.test.jsx`: the height lock, the icon-tile lock and the long-copy
  lock.

## Verification

- `git diff StatusChip.jsx` does not touch `LEVELS`, `SIZES` or the three
  redundant channels. `git diff GlassTable.jsx` is the single ink token — the
  off-grid `py-3.5` on the same element is left to backlog 999.3.
  `git diff BentoGrid.jsx` is **empty**.
- The widened gate passes with 14 literal `tone=` values across nine pages, all
  of them declared by one of the two owners.
- New locks: `Chip.test.jsx` 8 tests, `GlassTable.test.jsx` 4 tests,
  `StatusChip.test.jsx` 4 added (12 total), `BentoGrid.test.jsx` 3 added
  (11 total), `variantKeys.test.js` 1 added (4 total).
- Full suite: **31 files, 298 tests, all passing.** `npm run build` exits 0.

## The phase's one unresolved UI consideration, resolved

`03-UI-SPEC.md`'s `long-text` row for the tile value and caption. Resolution:
**accept the content-driven floor and add no minimum height.** A tile is not an
interactive target, so the 44px floor does not apply to it, and any minimum
chosen here would be a number with no measurement behind it. The enforcement is
the three new cases: neither an inert nor an actionable cell carries a height
utility, a long value and a long caption both render in full with no clipping,
and `a11y.test.jsx:271-272`'s existing note stays true.

## Deviations

- **The icon tile keeps `h-12 w-12`, against the letter of the plan.** Task 3
  asked for "no height utility at all … and the same for the icon tile inside
  it", while the same task's acceptance criteria require `git diff
  BentoGrid.jsx` to be empty. The two cannot both hold: the icon tile's square
  is deliberate. The lock therefore asserts the full no-height property on the
  cell (min, fixed, max) and on the icon tile asserts no floor, no ceiling and
  no stretch, pinning its decorative square positively instead. The invariant
  the plan is protecting — that a long localised value plus a caption grows the
  tile rather than being clipped — is unaffected, because the icon tile holds no
  copy.
- **`GlassTable.test.jsx` is a new file outside the plan's `files_modified`.**
  The plan allowed the rendered assertion in "the gate's file or the existing
  table coverage", and no table coverage existed. A source-scanning static gate
  is the wrong owner for a jsdom render assertion, so the table's contract lives
  in the table's own file, following the `Chip.test.jsx` precedent.
