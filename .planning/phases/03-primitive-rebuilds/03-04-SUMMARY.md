---
phase: 03-primitive-rebuilds
plan: 04
subsystem: ui
tags: [react, svg, vitest, jsdom, design-tokens, chart, colour-vision-deficiency]

# Dependency graph
requires:
  - phase: 03-primitive-rebuilds
    provides: "03-02's `web-dashboard/src/utils/series.js` — the three keys, their `varName`s and `NON_IDENTITY_TRACE`"
provides:
  - "`LoadDonut` resolving every arc and caption swatch from the zone key through `../utils/series`, with no colour prop left to supply (D-04)"
  - "the donut's unknown-key rule: no arc, one development warning naming the key and the declared keys, caption row kept on a neutral swatch so the ring's gap and the list never disagree (T-03-10)"
  - "the donut's two hand-rolled SVG sizes resolved to the declared scale: `text-stat` for the whole, `text-micro` for the unit (N-04)"
  - "`TrendChart` importing `NON_IDENTITY_TRACE` instead of naming the sage variable at the call site, so the single-series carve-out is provable (D-05, T-03-12)"
  - "`LoadDonut.test.jsx` and `TrendChart.test.jsx` — the arc/caption agreement lock, the zero-sum lock, the unknown-key lock, the point-count lock and the carve-out lock"
affects: [03-05, 05-page-rebuild]

# Actuals (#2632) — realized diff, same chars/4 scale as the plan's estimate.
actuals:
  tokens: 7800
  tasks: 3
  commits: 2
---

## What shipped

- `LoadDonut.jsx` builds a `SERIES_BY_KEY` lookup once and resolves each
  segment's `varName` from its `key`. Stroke and caption swatch read the same
  resolved name, so a wedge can no longer be painted for a different zone than
  its caption claims.
- The unknown-key path is the plan's benign outcome: no arc is drawn, the offset
  still advances so the ring shows a gap rather than closing over the missing
  third, `devWarn` names the key and the declared set once, and the caption keeps
  its row on `rgb(var(--muted))` — a neutral, so an unavailable zone cannot be
  read as one of the three series.
- Zero-sum: `share` stays 0, so no arc renders, the centre still states the whole,
  and the caption reads `0%` rather than `NaN%`. That is the existing divide guard
  at `LoadDonut.jsx:40` made visible.
- **Resolved type sizes (N-04):** the centre whole took `fontSize="26"` and now
  takes the declared `stat` — 1.875rem / 30px / 700. The unit label took
  `fontSize="10"` with `letterSpacing="0.1em"` and now takes the declared `micro`
  — 0.6875rem / 11px / 600 / 0.09em. Both are applied as the scale's own classes
  rather than as two numbers chosen in place, so they cannot drift from the scale.
- `TrendChart.jsx` imports `NON_IDENTITY_TRACE` and derives one `TRACE_INK` used
  by the line, both gradient stops and the last-point ring. Its header now states
  why the trace is the deliberate carve-out and why a later reader must not give
  it a series key.
- `DashboardPage.jsx`: the three `color` properties are deleted from
  `donutSegments`. `git diff` on the file is three deleted lines inside the donut
  block and nothing else.

## Verification

- `grep -c 'color'` over the donut segment block returns 0; `segment.color` /
  `arc.color` return 0 in `LoadDonut.jsx`; `--series-` returns 0 in
  `TrendChart.jsx`.
- **Live regions unchanged:** `aria-live="polite"` appears in four rendered
  regions under `src/` (`App.jsx:108`, `StatePanel.jsx:31`,
  `DashboardPage.jsx:420`, `DevicePage.jsx:99`) before and after this plan. The
  dashboard's single risk-change region at `:420` is still the only one on that
  page that announces risk.
- New locks: `LoadDonut.test.jsx` 7 tests, `TrendChart.test.jsx` 9 tests, each
  asserting its count floor before any per-item verdict.
- Dashboard task 3: `DashboardPage.test.jsx`, `DashboardPage.states.test.jsx`,
  `pages.test.jsx` — 3 files, 50 tests, passing.
- Full suite: **29 files, 278 tests, all passing.** `npm run build` exits 0.

## Deviations

- The donut carries no dash channel. `SERIES` entries also declare a `dash`, but
  a dashed stroke on a contiguous ring reads as a broken ring rather than as a
  redundant channel; identity on the donut is recovered from the labelled caption
  instead. The plan names only `varName` for the donut, so nothing was dropped.
- `DESIGN.md:171` still names `TelemetryChart.jsx` as the single source of the
  series set, which 03-02 moved to `src/utils/series.js`. 03-05 owns that
  sentence; it was deliberately not touched here.
- One test-file literal (`stroke-dasharray`) tripped `designTokens.test.js`'s
  utility sweep and was assembled from parts, following the idiom already
  documented in `TelemetryChart.test.jsx`.
- `web-dashboard/dist/` is tracked in git, so every `npm run build` dirties the
  tree with new hashed asset names. The build output was restored rather than
  staged; recorded as a broken window rather than fixed inside this plan.
