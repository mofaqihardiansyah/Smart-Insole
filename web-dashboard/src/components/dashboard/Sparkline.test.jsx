import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Sparkline } from "./Sparkline";

/**
 * The sparkline is a decorative summary of data the page already shows as a
 * number, so the whole thing is aria-hidden: the value beside it is the
 * accessible read, and a polyline announced as "image" would be noise.
 *
 * It reads the REAL ring buffer only. Fewer than two finite points is an empty
 * state, not an invented line: a sparkline drawn from one sample or from
 * nothing would be fabricated telemetry, which this product forbids.
 *
 * Its stroke is the non-identity sage (`--secondary`) by default. Series
 * colours are quarantined to chart components; the sparkline names the plain
 * token, never a `--series-N` variable.
 */

const readSource = () =>
  fs.readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), "Sparkline.tsx"),
    "utf8"
  );

describe("Sparkline", () => {
  it("draws one polyline through the given data", () => {
    const { container } = render(<Sparkline data={[10, 30, 20, 40]} />);

    const polylines = container.querySelectorAll("polyline");
    expect(polylines).toHaveLength(1);

    // The points carry every sample, in order: the first point is the first
    // sample, the last point the last one.
    const pairs = polylines[0]
      .getAttribute("points")
      .trim()
      .split(/\s+/)
      .map((pair) => pair.split(",").map(Number));
    expect(pairs.length).toBe(4);
    expect(pairs[0][0]).toBeLessThan(pairs[3][0]);
  });

  it("renders the sage token stroke by default and honours an explicit stroke", () => {
    const { container } = render(<Sparkline data={[1, 2, 3]} />);
    expect(container.querySelector("polyline").getAttribute("stroke")).toBe(
      "var(--secondary)"
    );

    const custom = render(<Sparkline data={[1, 2, 3]} stroke="var(--tertiary)" />);
    expect(
      custom.container.querySelector("polyline").getAttribute("stroke")
    ).toBe("var(--tertiary)");
    custom.unmount();
  });

  it("renders nothing for empty, single-point, or non-array data", () => {
    for (const data of [[], [42], "not an array"]) {
      const { container } = render(<Sparkline data={data} />);
      expect(container.querySelector("svg")).toBeNull();
      expect(container.textContent).toBe("");
    }
  });

  it("skips a dropped mid-series sample instead of drawing through it", () => {
    // A ring buffer record can be missing a sample. The honest line skips the
    // gap: [5, null-ish, 9] is two readings, not a slope between them.
    const { container } = render(<Sparkline data={[5, Number.NaN, 9]} />);
    expect(container.querySelectorAll("polyline")[0].getAttribute("points").trim().split(/\s+/)).toHaveLength(2);
  });

  it("is decorative: hidden from the accessibility tree and inert", () => {
    const { container } = render(
      <Sparkline data={[1, 2, 3]} className="w-20" />
    );
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
    expect(svg.tagName.toLowerCase()).toBe("svg");

    // The sizing class lands on the element itself, so the caller places it
    // inside the stat card without a wrapper.
    expect(svg.getAttribute("class")).toContain("w-20");
  });

  it("keeps series colours out of its source by construction", () => {
    expect(readSource()).not.toMatch(/--series-/);
  });
});
