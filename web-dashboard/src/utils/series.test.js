import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SERIES, NON_IDENTITY_TRACE } from "./series";

/**
 * The lock on the single series source (D-04).
 *
 * `--series-1/2/3` are declared once in `index.css` and were re-listed inside
 * `TelemetryChart.jsx`, with `MonitoringPage` reaching them through an alias.
 * Three consumers, one truth, three places to drift. This file pins the shape
 * of the module those consumers now read, so a fourth re-listing or a silently
 * dropped stroke pattern fails here rather than on a chart nobody re-measured.
 *
 * Every assertion reads the module's own declaration. Nothing in this file
 * re-types a key, a variable name or a dash, because a re-typed copy is the
 * defect the file exists to catch.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.join(here, "series.ts");

describe("series source", () => {
  it("declares exactly three entries", () => {
    // Asserted first, on purpose: an empty or one-entry array would let every
    // per-entry verdict below find nothing and still pass.
    expect(SERIES).toHaveLength(3);
  });

  it("names the three zones in forefoot, midfoot, heel order", () => {
    expect(SERIES.map((entry) => entry.key)).toEqual([
      "forefoot",
      "midfoot",
      "heel",
    ]);
  });

  it("names the three declared series custom properties in order", () => {
    // The variable names are the only route to the measured palette; the values
    // stay in index.css and are never restated here.
    expect(SERIES.map((entry) => entry.varName)).toEqual([
      "--series-1",
      "--series-2",
      "--series-3",
    ]);
  });

  it("gives every entry its own stroke pattern", () => {
    // The dash is a redundant channel for colour vision deficiency, not
    // decoration: a pattern used twice removes the redundancy it exists for.
    const dashes = SERIES.map((entry) => entry.dash);
    expect(new Set(dashes).size).toBe(SERIES.length);
  });

  it("keeps the non-identity trace outside the series set", () => {
    expect(NON_IDENTITY_TRACE).toBe("--secondary");
    expect(SERIES.map((entry) => entry.varName)).not.toContain(
      NON_IDENTITY_TRACE
    );
  });

  it("carries no hex literal, so the palette stays in index.css", () => {
    const source = fs.readFileSync(SOURCE, "utf8");
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });
});
