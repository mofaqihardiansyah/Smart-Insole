import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FunnelBars } from "./FunnelBars";

/**
 * The funnel (cadra-5): the zone-load panel's bars, replacing the donut.
 *
 * One row per sensor point: the row names the point, the bar shows its share
 * of the current total load, and the value next to it is the real kPa reading
 * the bar is drawn from. The bar is decorative over that text, so it is
 * aria-hidden. Zero total is an empty state: three empty bars would be three
 * drawn claims about readings that have not arrived, and one quiet sentence
 * is the honest shape.
 */

const SOURCE = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "FunnelBars.tsx"),
  "utf8"
);

const zones = (values) =>
  [
    { key: "forefoot", label: "Depan kaki" },
    { key: "midfoot", label: "Tengah kaki" },
    { key: "heel", label: "Tumit" },
  ].map((zone, i) => ({ ...zone, value: values[i] ?? 0 }));

const rows = (container) => [...container.querySelectorAll("[data-funnel-row]")];
const fillOf = (row) => row.querySelector("[data-funnel-fill]");

describe("FunnelBars", () => {
  it("renders one bar per sensor point with its label and real kPa value", () => {
    const { container } = render(
      <FunnelBars zones={zones([30, 20, 10])} language="id" />
    );

    expect(rows(container)).toHaveLength(3);

    const labels = rows(container).map((row) => row.textContent);
    expect(labels[0]).toContain("Depan kaki");
    expect(labels[0]).toContain("30.0 kPa");
    expect(labels[1]).toContain("20.0 kPa");
    expect(labels[2]).toContain("10.0 kPa");
  });

  it("sizes each bar to its share of the total, not to its raw value", () => {
    const { container } = render(
      <FunnelBars zones={zones([30, 20, 10])} language="id" />
    );

    const total = 60;
    rows(container).forEach((row, i) => {
      const expected = zones([30, 20, 10])[i];
      // The bar claims one decimal of precision, so the expected share is
      // rounded the same way; jsdom normalises "50.0%" to "50%".
      expect(Number.parseFloat(fillOf(row).style.width)).toBeCloseTo(
        Number(((Number(expected.value) / total) * 100).toFixed(1)),
        5
      );
    });
  });

  it("keeps the bars decorative: hidden from the tree, the text is the read", () => {
    const { container } = render(
      <FunnelBars zones={zones([30, 20, 10])} language="id" />
    );

    for (const fill of rows(container).map(fillOf)) {
      expect(fill.getAttribute("aria-hidden")).toBe("true");
    }
    // No bar introduces a new live region or an unlabelled role.
    expect(container.querySelectorAll("[aria-live]")).toHaveLength(0);
    expect(screen.queryAllByRole("img")).toHaveLength(0);
  });

  it("renders the empty state, and no bars, when nothing has arrived", () => {
    for (const values of [[0, 0, 0], []]) {
      const { container } = render(
        <FunnelBars zones={zones(values)} language="id" />
      );

      expect(rows(container)).toHaveLength(0);
      expect(
        container.querySelector("[data-funnel-empty]").textContent
      ).not.toBe("");
    }
  });

  it("paints every bar in one accent, never a quarantined series colour", () => {
    // Zone identity travels through the label, not through a colour code:
    // the series palette stays inside the real charts.
    expect(SOURCE).not.toMatch(/--series-/);
  });
});
