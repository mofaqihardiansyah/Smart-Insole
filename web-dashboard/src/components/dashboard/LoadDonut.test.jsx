import { describe, it, expect, afterEach, vi } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import LoadDonut from "./LoadDonut";
import { SERIES } from "../../utils/series";

/**
 * The lock on the donut's one colour rule (D-04, threat T-03-10).
 *
 * The ring used to be painted from a `color` field supplied by the dashboard,
 * which meant a wedge could stand for one zone and be coloured for another. The
 * assertions below read the series set from the module the component imports,
 * so what is proved is the arc-and-caption agreement for that declaration, not
 * for a list re-typed here.
 *
 * The non-vacuity rule this file follows: the rendered arc count is asserted
 * against the module's own entry count FIRST, so a component that drew nothing
 * fails here instead of passing every per-entry loop by finding nothing.
 */

const LABELS = ["Depan kaki", "Tengah kaki", "Tumit"];

const segmentsOf = (values = [40, 35, 25]) =>
  SERIES.map((entry, index) => ({
    key: entry.key,
    label: LABELS[index],
    value: values[index],
  }));

const renderDonut = (props) => render(<LoadDonut {...props} />);

const arcsOf = (container) => Array.from(container.querySelectorAll("circle"));

const rowsOf = (container) =>
  Array.from(container.querySelectorAll("figcaption dl > div"));

const swatchStyleOf = (row) =>
  row.querySelector("span[aria-hidden='true']").getAttribute("style") || "";

const centreTextsOf = (container) =>
  Array.from(container.querySelectorAll("svg text")).map((node) =>
    node.textContent.trim()
  );

describe("LoadDonut", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("draws one arc per declared zone, so the counts below cannot pass vacuously", () => {
    // `series.test.js` owns the module's cardinality; it is asserted again here
    // because every verdict below compares against `SERIES`.
    expect(SERIES).toHaveLength(3);

    const { container } = renderDonut({ segments: segmentsOf(), total: "100" });

    expect(arcsOf(container)).toHaveLength(SERIES.length);
  });

  it("resolves each arc's colour from its own zone key and no other key's", () => {
    const { container } = renderDonut({ segments: segmentsOf(), total: "100" });

    const strokes = arcsOf(container).map((arc) => arc.getAttribute("stroke"));
    expect(strokes).toHaveLength(SERIES.length);

    for (const entry of SERIES) {
      const mine = strokes.filter((stroke) => stroke.includes(entry.varName));
      expect(mine, `${entry.key} has no arc`).toHaveLength(1);

      for (const other of SERIES) {
        if (other === entry) continue;
        expect(
          mine[0].includes(other.varName),
          `${entry.key}'s arc also names ${other.key}`
        ).toBe(false);
      }
    }
  });

  it("keeps the caption and the ring in the same order", () => {
    const { container } = renderDonut({ segments: segmentsOf(), total: "100" });

    const strokes = arcsOf(container).map((arc) => arc.getAttribute("stroke"));
    expect(strokes).toEqual(
      SERIES.map((entry) => `rgb(var(${entry.varName}))`)
    );

    const labels = rowsOf(container).map((row) =>
      row.querySelector("dt").textContent.trim()
    );
    expect(labels).toEqual(LABELS);

    // Every swatch repeats the arc above it, so the caption is readable without
    // the ring.
    const swatches = rowsOf(container).map(swatchStyleOf);
    expect(swatches).toEqual(
      SERIES.map((entry) => expect.stringContaining(entry.varName))
    );
  });

  it("drops the arc, warns in development and keeps the caption row for an unknown key", () => {
    vi.stubEnv("DEV", true);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const segments = [
      segmentsOf()[0],
      { key: "toe", label: "Jari", value: 10 },
      segmentsOf()[2],
    ];
    const { container } = renderDonut({ segments, total: "100" });

    // Only the two declared keys drew, and the count is asserted before the
    // verdicts so a blank ring cannot pass.
    expect(arcsOf(container)).toHaveLength(SERIES.length - 1);

    expect(warn).toHaveBeenCalledTimes(1);
    const line = String(warn.mock.calls[0][0]);
    expect(line).toContain("LoadDonut");
    expect(line).toContain("toe");
    for (const entry of SERIES) {
      expect(line, entry.key).toContain(entry.key);
    }

    // The caption keeps its row, so the ring's gap and the list never disagree.
    const labels = rowsOf(container).map((row) =>
      row.querySelector("dt").textContent.trim()
    );
    expect(labels).toEqual([LABELS[0], "Jari", LABELS[2]]);

    const orphan = swatchStyleOf(rowsOf(container)[1]);
    for (const entry of SERIES) {
      expect(orphan, entry.key).not.toContain(entry.varName);
    }
  });

  it("draws no arc and still states the whole as zero when the segments sum to zero", () => {
    const { container } = renderDonut({
      segments: segmentsOf([0, 0, 0]),
      total: "0",
      unit: "kPa",
    });

    expect(arcsOf(container)).toHaveLength(0);
    expect(centreTextsOf(container)[0]).toBe("0");

    // Not `NaN%`: the divide guard is what keeps a real reading from becoming a
    // broken one on the frame the sensor settles.
    const shares = rowsOf(container).map((row) =>
      row.querySelector("dd").textContent.trim()
    );
    expect(shares).toEqual(["0%", "0%", "0%"]);
  });

  it("takes both centre sizes from the declared type scale", () => {
    const { container } = renderDonut({ segments: segmentsOf(), total: "100", unit: "kPa" });

    const [whole, unit] = Array.from(container.querySelectorAll("svg text"));
    expect(whole.getAttribute("class")).toContain("text-stat");
    expect(unit.getAttribute("class")).toContain("text-micro");
    // The unit keeps its own uppercase transform rather than the class's casing.
    expect(unit.textContent).toBe("KPA");
  });

  it("renders no hex literal as a colour", () => {
    const { container } = renderDonut({ segments: segmentsOf(), total: "100" });

    const colours = [
      ...arcsOf(container).map((arc) => arc.getAttribute("stroke")),
      ...rowsOf(container).map(swatchStyleOf),
    ];
    expect(colours.length).toBeGreaterThan(0);

    for (const colour of colours) {
      expect(colour).not.toMatch(/#[0-9a-f]{3,8}/i);
    }
  });
});
