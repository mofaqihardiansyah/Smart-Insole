import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * pagesContract.test.js, the page-level contract (PAGE-11, PAGE-12) and the
 * two-tier feedback contract, enforced statically over the page sources.
 *
 * jsdom has no layout engine, so the responsive claims are checked where they
 * live: in the class strings of the page files themselves. The same for the
 * two registers: the clinical app pages and the warm landing never borrow
 * each other's tokens, and the one bridge between them is the landing
 * scope, which owns it.
 *
 * The two-tier contract: an empty or error panel names a cause (its title
 * and description) and must then name the step after the cause, either as an
 * `action` element (a retry) or a `nextAction` string. The primitive
 * dev-warns on this; here it is a hard gate, because this is exactly the
 * defect family the register sweep had to repair (WINDOWS 13 and 20).
 */

const here = path.dirname(fileURLToPath(import.meta.url));

const pageFiles = fs
  .readdirSync(here)
  .filter((name) => name.endsWith(".jsx") && !name.endsWith(".test.jsx"));

const appPages = pageFiles.filter((name) => name !== "LandingPage.jsx");
const source = (name) => fs.readFileSync(path.join(here, name), "utf8");

describe("page contract: responsive vocabulary (PAGE-11)", () => {
  it("every page carries at least one breakpoint-scoped class", () => {
    // A page whose string has no sm:/md:/lg: re-decided nothing about small
    // screens. Dashboard has six classes, pages live at all three widths.
    for (const name of pageFiles) {
      expect(source(name).match(/(?:sm|md|lg):[a-z\-]/g)?.length).toBeGreaterThan(0);
    }
  });
});

describe("page contract: register separation (PAGE-12)", () => {
  it("the warm register never appears on an app page", () => {
    // warm-* belongs to the landing. If an app page borrows it, the
    // clinical register has been contaminated by a copy-paste.
    for (const name of appPages) {
      expect(source(name).match(/(?:bg|border|text|from|to)-warm/g)).toBeNull();
    }
  });

  it("the clinical surface tokens never appear on the landing", () => {
    // The landing re-declares light semantics in .landing-scope; a raw
    // app surface class inside the landing file would be a drift away from
    // the warm dialect rather than a reuse.
    expect(
      source("LandingPage.jsx").match(/(?:bg|border|text)-(?:bg|surface|fg|danger|muted|control)\b/g)
    ).toBeNull();
  });
});

describe("page contract: two-tier feedback contract", () => {
  it("every empty or error StatePanel names the step after its cause", () => {
    // StatePanel variants carry the cause; the contract wants the next step
    // on the same panel, as `action=` (a retry element) or `nextAction=`.
    const gapSites = [];

    for (const name of appPages) {
      const text = source(name);
      const re = /<StatePanel[^>]*?variant="(?:empty|error)"([^>]*)\/?\s*>/gs;
      let m = re.exec(text);
      while (m !== null) {
        const node = m[0];
        if (!/(?:\baction\s*=|\bnextAction\s*=)/.test(node)) {
          const line = text.slice(0, m.index).split("\n").length;
          gapSites.push(`${name}:${line}`);
        }
        m = re.exec(text);
      }
    }

    expect(gapSites).toEqual([]);
  });
});
