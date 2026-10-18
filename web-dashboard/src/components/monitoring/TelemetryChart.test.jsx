import { describe, it, expect } from "vitest";
import { render, within } from "@testing-library/react";
import React from "react";
import TelemetryChart from "./TelemetryChart";
import { SERIES } from "../../utils/series";

/**
 * The lock on the one-model rule (D-04, threat T-03-05).
 *
 * A screen reader cannot read a polyline, so this chart renders the same window
 * three ways: the plot, the legend readout, and a screen-reader-only table. If
 * those three resolve from different data, a sighted reader and a screen-reader
 * user are told different things about the same foot. The assertions below read
 * the series set from the module the component imports and prove all three
 * views agree for it, entry by entry.
 *
 * The non-vacuity rule this file follows: the rendered series count is asserted
 * against the module's own entry count FIRST, so a component that rendered
 * nothing fails here instead of passing every per-entry loop by finding nothing.
 *
 * Buffers are deterministic and tiny on purpose: `count <= 1` and `count > 1`
 * are different code paths in the X scale, so both ends are driven explicitly.
 */

const LABELS = {
  chartTitle: "Grafik tekanan",
  threshold: "Ambang bahaya",
  axisTime: "Waktu",
  axisPressure: "Tekanan",
  samples: "sampel",
  forefoot: "Depan kaki",
  midfoot: "Tengah kaki",
  heel: "Tumit",
};

const RECORD = (index) => ({
  timestamp: `t${index}`,
  readings: {
    forefoot: 10 + index,
    midfoot: 20 + index,
    heel: 30 + index,
  },
});

const bufferOf = (count) => Array.from({ length: count }, (_, i) => RECORD(i));

const renderChart = (history) =>
  render(<TelemetryChart history={history} labels={LABELS} />);

const plotLines = (container) => Array.from(container.querySelectorAll("polyline"));

const dashesOf = (lines) =>
  lines.map((line) => line.getAttribute("stroke-dasharray"));

describe("TelemetryChart", () => {
  it("renders all three declared series, so the counts below cannot pass vacuously", () => {
    // `series.test.js` owns the module's cardinality. It is asserted again here
    // because every count assertion below compares against `SERIES.length`: if
    // the import were ever silently shrunk to two, those comparisons would stay
    // self-consistent and this file would pass on a two-series chart. The
    // literal three is the floor the threat register names (T-03-05), asserted
    // before any per-series verdict.
    expect(SERIES).toHaveLength(3);

    const { container } = renderChart(bufferOf(3));
    expect(plotLines(container)).toHaveLength(3);
  });

  it("renders nothing at all for an empty buffer, not an empty axis frame", () => {
    const { container } = renderChart([]);

    expect(container.querySelector("figure")).toBeNull();
    expect(container.querySelector("svg")).toBeNull();
    // No axis titles either: an axis with no data is a chart-shaped no.
    expect(container.textContent).toBe("");
  });

  it("draws only the points a one-record buffer has", () => {
    const { container } = renderChart(bufferOf(1));

    const lines = plotLines(container);
    expect(lines).toHaveLength(SERIES.length);

    for (const entry of SERIES) {
      const line = lines.find((el) => el.getAttribute("stroke")?.includes(entry.varName));
      expect(line, `${entry.key} has no polyline`).toBeDefined();
      // One record, one point: nothing interpolated, repeated or invented to
      // fill the window.
      const points = line.getAttribute("points").trim().split(/\s+/);
      expect(points, entry.key).toHaveLength(1);
    }

    // The area fill closes only past one record, and this chart draws no area
    // element at all, so a closed polygon here would be a new unguarded shape.
    expect(container.querySelectorAll("polygon")).toHaveLength(0);
  });

  it("renders one plot line per declared series at every record count", () => {
    const one = renderChart(bufferOf(1));
    const many = renderChart(bufferOf(7));

    // Fixed cardinality: the layout cannot reflow between a one-record and a
    // many-record session.
    expect(plotLines(one.container)).toHaveLength(SERIES.length);
    expect(plotLines(many.container)).toHaveLength(SERIES.length);
  });

  it("resolves the plot, the legend and the accessible table from one array", () => {
    const { container } = renderChart(bufferOf(3));

    const legend = container.querySelector("figcaption");
    const table = container.querySelector("table");
    expect(legend).not.toBeNull();
    expect(table).not.toBeNull();

    // Non-vacuity: three series found before any per-series claim.
    const lines = plotLines(container);
    expect(lines).toHaveLength(SERIES.length);

    const heads = Array.from(table.querySelectorAll("thead th")).map(
      (th) => th.textContent
    );

    for (const entry of SERIES) {
      const name = LABELS[entry.key];

      // The plot reads the series' own variable name.
      expect(
        lines.some((el) => el.getAttribute("stroke")?.includes(entry.varName))
      ).toBe(true);

      // The legend and the screen-reader table are told the same name.
      expect(within(legend).getByText(name), entry.key).toBeInTheDocument();
      expect(heads, entry.key).toContain(name);
    }
  });

  it("keeps each series' own stroke pattern in the plot and the legend", () => {
    const { container } = renderChart(bufferOf(4));

    // The dash is the redundant channel for colour vision deficiency, so it has
    // to survive the move to the shared module on the line AND on the swatch
    // that describes that line.
    const declared = SERIES.map((entry) => entry.dash ?? null);

    expect(dashesOf(plotLines(container))).toEqual(declared);
    expect(
      dashesOf(Array.from(container.querySelector("figcaption").querySelectorAll("line")))
    ).toEqual(declared);
  });

  it("labels the svg with the sample count and repeats the numbers in a table", () => {
    const history = bufferOf(3);
    const { container } = renderChart(history);

    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("role", "img");

    const accessibleName = svg.getAttribute("aria-label");
    expect(accessibleName).toBeTruthy();
    expect(accessibleName).toContain(
      `${LABELS.axisTime}: ${history.length} ${LABELS.samples}`
    );
    expect(accessibleName).toContain(LABELS.axisPressure);

    // The same window, row per record, is available to assistive tech.
    const rows = container.querySelectorAll("table tbody tr");
    expect(rows).toHaveLength(history.length);
    for (const row of rows) {
      expect(row.querySelectorAll("td")).toHaveLength(SERIES.length);
    }
  });
});
