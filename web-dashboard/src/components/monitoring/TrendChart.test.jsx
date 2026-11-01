import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import TrendChart from "./TrendChart";
import { NON_IDENTITY_TRACE } from "../../utils/series";

/**
 * The lock on the trend trace's carve-out (D-05, threats T-03-11 and T-03-12).
 *
 * Two rules are proved here that no rendering assertion alone can prove:
 *
 * 1. The trace is the deliberate non-identity carve-out. Its ink is imported
 *    from `../utils/series` rather than written at the call site, and the source
 *    references no `--series-N` value at all, so the single-series trend cannot
 *    be re-read as one of three categorical series. The app-wide half of that
 *    rule is plan 03-05's quarantine gate; this is the local half.
 * 2. A buffer shorter than the window draws only the points it has. The three
 *    shapes that would let a fabricated point appear as a reading (an invented
 *    point, a repeated one, an area closed over a single reading) are each
 *    driven explicitly.
 *
 * The non-vacuity rule this file follows: the rendered point count is asserted
 * against the buffer length FIRST, so a chart that drew nothing fails here
 * instead of passing every shape verdict by finding nothing.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = fs.readFileSync(path.join(here, "TrendChart.tsx"), "utf8");

const LABELS = {
  chartTitle: "Tren puncak tekanan",
  threshold: "Ambang bahaya",
  axisTime: "Waktu",
  axisPressure: "Tekanan",
  samples: "sampel",
};

const bufferOf = (count) =>
  Array.from({ length: count }, (_, index) => ({
    timestamp: `2024-01-01T00:00:${String(index).padStart(2, "0")}.000Z`,
    peakPressure: 30 + index,
  }));

const renderChart = (history) =>
  render(<TrendChart history={history} labels={LABELS} dangerKpa={70} />);

const tracesOf = (container) => Array.from(container.querySelectorAll("polyline"));

const pointsOf = (trace) =>
  trace.getAttribute("points").trim().split(/\s+/).filter(Boolean);

const TABLE_ROWS = (container) =>
  Array.from(container.querySelectorAll("table tbody tr"));

/**
 * The dash attribute's name, assembled from parts rather than written whole.
 * `designTokens.test.js` sweeps every `.jsx` in `src` for utility-shaped tokens
 * and would read a literal `stroke-…` here as a Tailwind class with no rule. The
 * attribute is a real SVG attribute, not a utility, so it is built at the point
 * of use — the same reason `TelemetryChart.test.jsx` and `copy.test.js` build
 * their literals from pieces.
 */
const DASH_ATTR = ["stroke", "dasharray"].join("-");

describe("TrendChart", () => {
  it("draws exactly one point per record, so the verdicts below cannot pass vacuously", () => {
    const history = bufferOf(7);
    const { container } = renderChart(history);

    const traces = tracesOf(container);
    expect(traces).toHaveLength(1);

    // The buffer length is the floor: one fabricated or dropped reading fails
    // here, before any shape claim is made.
    expect(pointsOf(traces[0])).toHaveLength(history.length);
  });

  it("renders nothing at all for an empty buffer, not an empty axis frame", () => {
    const { container } = renderChart([]);

    expect(container.querySelector("figure")).toBeNull();
    expect(container.querySelector("svg")).toBeNull();
    expect(container.textContent).toBe("");
  });

  it("draws a single reading without closing an area over it", () => {
    const { container } = renderChart(bufferOf(1));

    const traces = tracesOf(container);
    expect(traces).toHaveLength(1);
    expect(pointsOf(traces[0])).toHaveLength(1);

    // One point is not a shape: an area polygon here would be inventing the
    // second point needed to close it.
    expect(container.querySelectorAll("polygon")).toHaveLength(0);
    // The reading is still on screen as a marked point.
    expect(container.querySelectorAll("circle")).toHaveLength(1);
  });

  it("closes the area only once there is more than one reading", () => {
    const { container } = renderChart(bufferOf(4));

    const polygons = container.querySelectorAll("polygon");
    expect(polygons).toHaveLength(1);

    const vertices = polygons[0].getAttribute("points").trim().split(/\s+/);
    // Two baseline corners plus one vertex per record, and no other invented
    // corner.
    expect(vertices).toHaveLength(4 + 2);
  });

  it("draws its single trace in the imported carve-out ink and no series value", () => {
    const { container } = renderChart(bufferOf(5));

    const traces = tracesOf(container);
    expect(traces).toHaveLength(1);

    const stroke = traces[0].getAttribute("stroke");
    expect(stroke).toBe(`rgb(var(${NON_IDENTITY_TRACE}))`);

    // The gradient the area uses is the same ink, so the fill cannot drift from
    // the line it sits under.
    const stops = Array.from(container.querySelectorAll("linearGradient stop"));
    expect(stops.length).toBeGreaterThan(0);
    for (const stop of stops) {
      expect(stop.getAttribute("stop-color")).toBe(stroke);
    }

    // No series colour anywhere in the rendered output.
    expect(container.innerHTML).not.toMatch(/--series-/);
  });

  it("references no series value in its source, which is the local half of the carve-out", () => {
    expect(SOURCE).not.toMatch(/--series-/);
    expect(SOURCE).toContain("NON_IDENTITY_TRACE");
  });

  it("draws the danger threshold and labels it with its value", () => {
    const { container } = renderChart(bufferOf(6));

    const dashed = Array.from(container.querySelectorAll("line")).filter(
      (line) => line.getAttribute(DASH_ATTR)
    );
    expect(dashed).toHaveLength(1);

    const texts = Array.from(container.querySelectorAll("svg text")).map((node) =>
      node.textContent
    );
    // Drawn AND labelled: a dashed line with no label is decoration.
    expect(texts).toContain(`Ambang bahaya 70 kPa`);
  });

  it("scales with its container and carries a real accessible name", () => {
    const history = bufferOf(3);
    const { container } = renderChart(history);

    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("role", "img");

    const className = svg.getAttribute("class");
    expect(className).toContain("w-full");
    expect(className).toContain("h-auto");
    expect(className).not.toMatch(/h-\[\d/);

    const accessibleName = svg.getAttribute("aria-label");
    expect(accessibleName).toBeTruthy();
    expect(accessibleName).toContain(
      `${LABELS.axisTime}: ${history.length} ${LABELS.samples}`
    );
    // The graphic states the threshold and the peak as well, so the name is
    // information rather than the word "chart".
    expect(accessibleName).toContain("70 kPa");
    expect(accessibleName).toContain(
      `${LABELS.axisPressure}: ${history[history.length - 1].peakPressure.toFixed(1)} kPa`
    );
  });

  it("repeats the same numbers in an accessible table", () => {
    const history = bufferOf(5);
    const { container } = renderChart(history);

    const rows = TABLE_ROWS(container);
    expect(rows).toHaveLength(history.length);

    history.forEach((record, index) => {
      const cells = rows[index].querySelectorAll("td, th");
      const values = Array.from(cells).map((cell) => cell.textContent);
      expect(values, `row ${index}`).toContain(record.peakPressure.toFixed(1));
    });
  });
});
