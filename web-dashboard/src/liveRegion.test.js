import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Success criterion 5: the realtime data contract is preserved, not improved.
 *
 * Three things have to stay true together, and each of them looks like a defect
 * to a later reader who is trying to help:
 *
 * 1. Exactly one polite region announces RISK-level changes. Live pressure
 *    numbers must not be announced: a figure that updates every second inside a
 *    live region turns a screen reader into an unusable stutter. The criterion
 *    is written as `aria-live="off"` on the numbers, and no such attribute
 *    exists in the source today — the numbers are simply outside every live
 *    region, which is the stronger form of the same rule. This gate asserts the
 *    absence, so adding an `off` attribute AND adding a real region both fail.
 * 2. The polite-region set is exact. The allowlist below names every region
 *    and the purpose it serves, so an unreviewed region fails. The first four
 *    are the realtime contract; the last two are the only static-page controls
 *    that speak, each on a threshold rather than on every value.
 * 3. `InsoleContext`'s failure contract holds. WR-02 used to pin the old guard
 *    that silently fell back to the fabricated simulator stream on failure;
 *    that trade was REVERSED when the simulator was removed. The contract now
 *    moves the other way: both failure paths (transport error and the grace
 *    timeout) must report the connection as `error` and neither may switch to
 *    a source that invents readings.
 *
 * Comments are stripped before counting, so the docs that describe the rule
 * cannot be mistaken for an occurrence of it.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = here;

const stripComments = (source) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*\/\/.*$/gm, "");

const collect = (dir) => {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      out.push(...collect(full));
    } else if (/\.(jsx?|tsx?)$/.test(entry.name) && !entry.name.includes(".test.")) {
      out.push(full);
    }
  }
  return out;
};

const FILES = collect(SRC);
const read = (rel) => stripComments(fs.readFileSync(path.join(SRC, rel), "utf8"));

const countPolite = (source) => (source.match(/aria-live="polite"/g) || []).length;

/**
 * The four polite regions, each with the purpose it serves. The list is exact:
 * a new region has to be added here deliberately and pass review.
 */
const POLITE_REGIONS = [
  {
    file: "App.tsx",
    purpose: "the splash, so the first paint is announced once while the app boots",
  },
  {
    file: "components/ui/StatePanel.tsx",
    purpose: "the loading register, so a reader is told data is coming",
  },
  {
    file: "pages/DashboardPage.tsx",
    purpose: "the risk-level announcement: the only thing on this page that speaks",
  },
  {
    file: "pages/DevicePage.tsx",
    purpose: "the connection line, so a link drop is noticed",
  },
  {
    file: "components/auth/PasswordStrength.tsx",
    purpose: "the strength band, so a screen reader hears the label cross a threshold",
  },
  {
    file: "components/landing/RiskExplorer.tsx",
    purpose: "the simulated risk level, so a slider change is announced once per level",
  },
];

describe("the realtime data contract", () => {
  it("keeps only the reviewed polite regions, one entry per occurrence", () => {
    expect(FILES.length, "the walk collected no sources").toBeGreaterThan(20);

    // One entry per OCCURRENCE, not per file: a second polite region added
    // beside the device page's connection line is a new region, and a
    // file-set comparison would have missed it.
    const found = [];
    for (const file of FILES) {
      const rel = path.relative(SRC, file).split(path.sep).join("/");
      const count = countPolite(read(rel));
      for (let i = 0; i < count; i += 1) found.push(rel);
    }

    expect(found.sort()).toEqual(
      POLITE_REGIONS.map((region) => {
        // The purpose is the allowlist's whole value: a region added without a
        // reason is a region added without review.
        expect(region.purpose, region.file).toBeTruthy();
        return region.file;
      }).sort()
    );
  });

  it("announces risk changes from the dashboard and nothing else on that page", () => {
    const dashboard = read("pages/DashboardPage.tsx");

    expect(countPolite(dashboard)).toBe(1);

    // The one region is the risk announcement, not a copy of the numbers.
    const region = dashboard.slice(dashboard.indexOf('aria-live="polite"'));
    expect(region.slice(0, 200)).toContain("risk.status");
  });

  it("keeps every live number outside a live region", () => {
    // The tiles carry the live figures, and the grid that renders them is the
    // component a well-meant fix would add a live region to.
    const grid = read("components/dashboard/BentoGrid.tsx");
    expect(grid).not.toMatch(/aria-live/);

    const dashboard = read("pages/DashboardPage.tsx");
    const tiles = dashboard.slice(
      dashboard.indexOf("const tiles = ["),
      dashboard.indexOf("];", dashboard.indexOf("const tiles = [")) + 2
    );
    expect(tiles).not.toBe("");
    expect(tiles).not.toMatch(/aria-live/);
  });

  it("preserves the provider's failure contract (WR-02, policy reversed)", () => {
    const context = read("context/InsoleContext.tsx");

    // Both failure paths report `error`: the transport error handler and the
    // grace timeout (whose guard only keeps a live connection alive).
    expect(context).toMatch(/setConnectionState\('error'\);/);
    expect(context).toMatch(/prev === 'live' \? prev : 'error'/);

    // And no fabricated fallback exists anywhere in the file. Comments are
    // stripped by read(), so the historical note about the old simulator is
    // not matched either.
    expect(context).not.toMatch(/simulator|scenario/i);
  });
});
