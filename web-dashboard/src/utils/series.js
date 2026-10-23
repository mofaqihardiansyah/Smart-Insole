/**
 * series — the single source for the chart series set.
 *
 * The three CVD-safe Okabe-Ito series colours are declared once, here, and
 * every consumer reads this module: the live waveform (`TelemetryChart`) and
 * the peak trend (`TrendChart`). The Cadra restyle removed the zone donut in
 * favour of `FunnelBars`, whose one-accent bars carry zone identity in their
 * row labels, not in series colours. The values
 * themselves stay in `index.css` as `--series-1`, `--series-2` and
 * `--series-3`; this module names those custom properties and never a hex, so
 * the measured palette keeps exactly one home and a chart cannot drift from the
 * set that was measured.
 *
 * Design decisions with reasons:
 * - Three entries, fixed cardinality. The chart renders exactly these three at
 *   any record count, so the layout does not reflow between a one-record and a
 *   many-record session.
 * - Each entry carries its own stroke pattern as well as its own hue. Three
 *   hues alone are not enough separation for every kind of colour vision
 *   deficiency, so the dash is a redundant channel rather than decoration: a
 *   duplicated pattern is a defect, and the colocated test fails on one.
 * - `NON_IDENTITY_TRACE` is deliberately NOT one of the three. `TrendChart`
 *   draws a single peak trace that answers "is the peak climbing", never "which
 *   zone", so it keeps the sage `--secondary` line. Exporting the variable name
 *   lets that carve-out be imported and asserted instead of hard-coded at the
 *   call site, where it would read as one of the series.
 *
 * `DESIGN.md`'s "Data visualisation" section carries the single-source rule and
 * the quarantine rule: the three series colours appear only inside the charts,
 * never in a button, badge, navigation item or heading. Plan 03-05 amends that
 * section to name this module, the charts that must read it, and the carve-out.
 */

export const SERIES = [
  { key: "forefoot", varName: "--series-1", dash: undefined },
  { key: "midfoot", varName: "--series-2", dash: "7 4" },
  { key: "heel", varName: "--series-3", dash: "2 4" },
];

/** The one trace that is deliberately outside the series set (see the header). */
export const NON_IDENTITY_TRACE = "--secondary";
