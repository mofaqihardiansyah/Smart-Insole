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
 * 2. The polite-region set is exact. The allowlist below names all four and the
 *    purpose each serves, so a fifth region fails and a removed one fails too.
 * 3. `InsoleContext`'s connect guard is untouched. That guard has a known
 *    mismatch — the codebase passes `autoConnect={Boolean(user)}` from the app
 *    while the provider treats the prop as a plain boolean — and the mismatch
 *    is WR-02, deliberately deferred and STILL OPEN. "Cleaning it up" changes
 *    when the device connects, which is a behaviour change and out of scope, so
 *    the guard is asserted verbatim as a source match.
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
    } else if (entry.name.endsWith(".jsx") && !entry.name.includes(".test.")) {
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
    file: "App.jsx",
    purpose: "the splash, so the first paint is announced once while the app boots",
  },
  {
    file: "components/ui/StatePanel.jsx",
    purpose: "the loading register, so a reader is told data is coming",
  },
  {
    file: "pages/DashboardPage.jsx",
    purpose: "the risk-level announcement: the only thing on this page that speaks",
  },
  {
    file: "pages/DevicePage.jsx",
    purpose: "the connection line, so a link drop is noticed",
  },
];

describe("the realtime data contract", () => {
  it("keeps exactly the four named polite regions and no fifth", () => {
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
    const dashboard = read("pages/DashboardPage.jsx");

    expect(countPolite(dashboard)).toBe(1);

    // The one region is the risk announcement, not a copy of the numbers.
    const region = dashboard.slice(dashboard.indexOf('aria-live="polite"'));
    expect(region.slice(0, 200)).toContain("risk.status");
  });

  it("keeps every live number outside a live region", () => {
    // The tiles carry the live figures, and the grid that renders them is the
    // component a well-meant fix would add a live region to.
    const grid = read("components/dashboard/BentoGrid.jsx");
    expect(grid).not.toMatch(/aria-live/);

    const dashboard = read("pages/DashboardPage.jsx");
    const tiles = dashboard.slice(
      dashboard.indexOf("const tiles = ["),
      dashboard.indexOf("];", dashboard.indexOf("const tiles = [")) + 2
    );
    expect(tiles).not.toBe("");
    expect(tiles).not.toMatch(/aria-live/);
  });

  it("preserves the provider's connect guard verbatim (WR-02, still open)", () => {
    const context = read("context/InsoleContext.jsx");

    const guard = context.match(
      /if \(autoConnect\) setSource\(SOURCE\.SIMULATOR\);/g
    );
    expect(guard, "the connect guard was changed or removed").toHaveLength(2);
  });
});
