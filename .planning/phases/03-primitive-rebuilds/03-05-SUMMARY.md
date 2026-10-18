---
phase: 03-primitive-rebuilds
plan: 05
subsystem: ui
tags: [react, vitest, design-tokens, colour-vision-deficiency, documentation, quarantine-gate]

# Dependency graph
requires:
  - phase: 03-primitive-rebuilds
    provides: "03-02's `src/utils/series.js` and 03-04's three consumers reading it, so the gate could be proved against real sources rather than against a plan"
provides:
  - "`web-dashboard/src/seriesQuarantine.test.js` — the gate that fails a raw `--series-N` reference outside `index.css` and `utils/series.js`, walking `.jsx` and `.js` alike"
  - "`DESIGN.md`'s `Single source` clause naming `src/utils/series.js`, and its `Quarantine rule` clause recording that a gate enforces it"
  - "`DESIGN.md`'s `TrendChart` rows recording the non-identity `--secondary` carve-out and its reason (D-05)"
affects: [05-page-rebuild, 06-delivery-gate]
requirements: [COMP-04, COMP-05]

# Actuals (#2632) — realized diff, same chars/4 scale as the plan's estimate.
actuals:
  tokens: 7200
  tasks: 3
  commits: 2
---

## What shipped

- `seriesQuarantine.test.js` walks every `.jsx` and every `.js` under `src/`,
  excluding `*.test.*` and the `__oil_ui_eval__` directory by name with the same
  reason `copy.test.js` records. Comments are stripped before the search,
  because the rule is about a value that reaches a surface and a doc comment
  renders nothing; without stripping, a chart's own header comment would fail its
  own gate.
- Four cases: the walk's floors, the verdict, the declaration site, and the two
  `index.css` blocks. Each is asserted before the verdict it enables.
- `DESIGN.md`'s `Single source` clause now names `src/utils/series.js`, names the
  three consumers, and states that the values themselves stay in `index.css`.
  The `Quarantine rule` clause records that a gate walks the shipped sources. The
  `TrendChart` rows record the carve-out and why it exists.

## Verification

- **The gate was observed failing in both directions before it was trusted**,
  which is the whole point of writing it:
  - a temporary `src/components/ui/__probeChip.jsx` using
    `rgb(var(--series-2))` failed with
    `components/ui/__probeChip.jsx:2 names --series-2 outside the chart set`;
  - a temporary `src/utils/__probeLeak.js` failed with
    `utils/__probeLeak.js:1 names --series-3 outside the chart set`.
  The second probe is the one that matters: it is a `.js` file, and it proves the
  widened walk reaches what `designTokens.test.js`'s `.jsx`-only walk would have
  skipped. Both probes were removed and the tree is clean.
- Floors on the real tree: 54 walked files (floor 40), 11 of them `.js`
  (floor 1).
- Acceptance: `grep -c 'src/utils/series.js' DESIGN.md` is 1,
  `grep -c 'TelemetryChart.jsx' DESIGN.md` is 0, `--secondary` appears twice,
  and the enforcement sentence is present.
- `git diff DESIGN.md` contains no palette hex, no contrast figure and no em or
  en dash.
- Full suite: **34 files, 314 tests, all passing.** `npm run build` exits 0.

## Task 3: owner countersignature

Presented to the owner in this session, as exact before and after. Both clauses
are **awaiting countersignature** — the code side of D-04 and D-05 is already
enforced by the gate and by 03-04's tests, so this does not hold anything open.

**Clause 1, the `Single source` paragraph.** Before: "these three values are
defined once, in the `SERIES` array in
`web-dashboard/src/components/monitoring/TelemetryChart.jsx`. Every stroke, dot,
legend swatch and screen-reader table row reads from it." After: "these three
values are defined once, in the `SERIES` array in
`web-dashboard/src/utils/series.js`. Every consumer reads that module: the live
waveform (`TelemetryChart`), the peak trend (`TrendChart`) and the zone donut
(`LoadDonut`). The values themselves stay in `index.css` as `--series-1`,
`--series-2` and `--series-3` …".

**Clause 2, the carve-out.** Added to the same paragraph and to the `TrendChart`
row: the trace is the non-identity `--secondary` sage line, deliberately not one
of the three series values, because that panel answers "is the peak climbing"
rather than "which zone is worst".

## Deviations

- Comments are stripped before the quarantine search. The plan's action text did
  not say to strip them, and without it `TelemetryChart.jsx:12` — a header
  comment naming `--series-*` — would have failed a gate it should pass. The
  alternative, exempting every chart file by name, would have weakened the rule
  to "charts may reference series properties", which is not the rule.
- `DESIGN.md:518-541` F-01 is reported, not fixed. No palette value was touched.
