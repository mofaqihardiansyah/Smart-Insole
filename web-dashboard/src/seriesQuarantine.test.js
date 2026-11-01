import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The quarantine gate for D-04, threat T-03-13.
 *
 * The three Okabe-Ito values are a categorical identity set. They are correct as
 * a chart trace and wrong everywhere else: a series colour on a button, a badge,
 * a nav item or a heading re-encodes "this is series two" as decoration, and the
 * reader is told a meaning that is not there. `DESIGN.md` stated that rule as
 * prose, and prose is not enforcement, so this gate walks the shipped sources
 * and fails on a raw series reference outside the two sites that are allowed to
 * declare one.
 *
 * THE ALLOWED SITES ARE TWO, BY NAME:
 *   - `index.css`, which declares `--series-1/2/3` in its root block and again in
 *     its landing block. That is the measured palette, the one home of the
 *     values.
 *   - `utils/series.ts`, the single module that names those properties so no
 *     chart has to spell one.
 *
 * THE WALK WIDENS WHAT THE TOKEN GATE DOES. `designTokens.test.js` walks `.jsx`
 * only, so a series reference from a plain module would pass it. This gate walks
 * `.jsx`/`.js`/`.tsx`/`.ts` alike and asserts that it visited a non-`.jsx` file,
 * because skipping the plain modules would skip exactly the sources D-04's rule
 * is about.
 *
 * COMMENTS ARE STRIPPED BEFORE THE SEARCH, following `copy.test.js`. The rule is
 * about a value that reaches a surface; a doc comment that names a property
 * renders nothing. Stripping is what keeps the rule honest rather than
 * inconvenient, since a chart's own header comment is the natural place to
 * explain which variables it reads.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
/** This file lives in `src`, so the shipped sources are right here. */
const SRC = here;

/** The scratch-page directory, excluded from the walk below. */
const SCRATCH = "__oil_ui_eval__";

/** The two sites allowed to name a series custom property. */
const ALLOWED = new Set(
  [path.join(SRC, "index.css"), path.join(SRC, "utils", "series.ts")].map(
    (file) => path.normalize(file)
  )
);

/** The three property names, read from the module rather than re-typed. */
const SERIES_NAMES = ["--series-1", "--series-2", "--series-3"];

/**
 * Strip block comments first, then line comments. The order matters: a block
 * comment can contain `//`, so stripping line comments first would leave the
 * block's tail behind and report prose as a reference. The `(^|[^:])` guard
 * keeps a URL scheme (`https://`) from reading as the start of a line comment.
 */
const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

/**
 * Every `.jsx`/`.js`/`.tsx`/`.ts` file underneath, recursively, test files and the
 * scratch page excluded. Test files are excluded because a test for a rule has
 * to be able to name the thing it forbids, inline.
 */
const collect = (dir) => {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === SCRATCH) continue;
      out.push(...collect(full));
    } else if (
      /\.(jsx?|tsx?)$/.test(entry.name) &&
      !entry.name.includes(".test.")
    ) {
      out.push(full);
    }
  }
  return out;
};

const FILES = collect(SRC);

/** Every line of every non-exempt file that names a series property. */
const violations = () => {
  const found = [];
  for (const file of FILES) {
    if (ALLOWED.has(path.normalize(file))) continue;
    const lines = stripComments(fs.readFileSync(file, "utf8")).split("\n");
    lines.forEach((line, index) => {
      for (const name of SERIES_NAMES) {
        if (line.includes(name)) {
          found.push(
            `${path.relative(SRC, file)}:${index + 1} names ${name} outside the chart set`
          );
        }
      }
    });
  }
  return found;
};

const read = (rel) => fs.readFileSync(path.join(SRC, rel), "utf8");

describe("the series set is quarantined", () => {
  it("walks both source kinds rather than an empty or .jsx-only list", () => {
    // Asserted before any verdict: a broken walk that collected nothing would
    // pass the check below by finding nothing to accuse.
    expect(FILES.length, "the walk collected no sources").toBeGreaterThan(40);

    // The floor that makes this gate stronger than the token gate: a walk that
    // silently stopped at `.jsx` would skip every plain module, which is where a
    // leaked constant would be easiest to hide.
    const plainModules = FILES.filter((file) => /\.(js|ts)$/.test(file));
    expect(
      plainModules.length,
      "the walk visited no plain module, so it is not walking the sources D-04 is about"
    ).toBeGreaterThan(0);
  });

  it("fails any series reference outside the two allowed sites", () => {
    expect(violations()).toEqual([]);
  });

  it("keeps the one declaration site, so the gate cannot pass by the set vanishing", () => {
    const module = read(path.join("utils", "series.ts"));

    // All three names, each as a `varName` on an entry: the module is the single
    // source only while it actually names all three.
    for (const name of SERIES_NAMES) {
      expect(
        module.match(new RegExp(`varName: ['"]${name}['"]`, "g")) || [],
        `${name} is not declared in the series module`
      ).toHaveLength(1);
    }
  });

  it("keeps the measured values in both of index.css's blocks", () => {
    const css = read("index.css");

    for (const name of SERIES_NAMES) {
      // Two blocks: the app root and the landing scope. A value that survived in
      // one and was dropped from the other would render the wrong colour inside
      // `.landing-scope` without failing anything else.
      expect(
        css.match(new RegExp(`^\\s*${name}:`, "gm")) || [],
        `${name} is not declared in both of index.css's blocks`
      ).toHaveLength(2);
    }
  });
});
