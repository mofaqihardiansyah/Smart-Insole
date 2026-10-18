import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import config from "../tailwind.config.js";

/**
 * The C-02 gate: every radius under `src/components/ui/` names a declared step.
 *
 * A bare `rounded` is not a mistake in Tailwind — it resolves to
 * `borderRadius.DEFAULT`, which happens to be 8px in this project, the same
 * number as the declared `control` step. That coincidence is exactly why the
 * gate fails it: the class reads as "some radius" rather than as the step the
 * scale reserves for a control, so the next pass that moves `DEFAULT` silently
 * moves every primitive that relied on it. The primitives must name a token.
 *
 * The anchors below are copied from `designTokens.test.js` — the leading
 * negative lookbehind keeps `unrounded` and `roundedX` out, so the gate sees
 * real utilities rather than fragments of prose.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const UI = path.join(here, "components", "ui");

const RADIUS =
  /(?<![\w-])rounded(?:-([a-zA-Z0-9][a-zA-Z0-9./_[\]()#%-]*))?/g;

/** The directions Tailwind lets a radius take (`rounded-t-sm` and friends). */
const SIDE = /^(?:t|r|b|l|tl|tr|bl|br|s|e)-/;

const collectSources = (dir) => {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectSources(full));
    } else if (entry.name.endsWith(".jsx")) {
      out.push(full);
    }
  }
  return out;
};

const DECLARED = new Set(
  Object.keys(config.theme.extend.borderRadius).filter((key) => key !== "DEFAULT")
);

const FILES = collectSources(UI);

const tokensOf = (file) =>
  [...fs.readFileSync(file, "utf8").matchAll(RADIUS)].map(([token]) => ({
    token,
    file: path.relative(UI, file),
  }));

const TOKENS = FILES.flatMap(tokensOf);

/** The step a token names, or `null` when it names none. */
const stepOf = (token) => {
  const suffix = token.slice("rounded".length);
  if (suffix === "") return null; // the bare alias: a default, not a step
  const step = suffix.replace(/^-/, "").replace(SIDE, "");
  return DECLARED.has(step) ? step : null;
};

describe("every radius under src/components/ui names a declared step", () => {
  it("walks a non-empty set of files and finds a non-vacuous set of radii", () => {
    // Both floors exist because a broken walk or a regex that stopped matching
    // would otherwise pass every verdict below while looking at nothing.
    expect(FILES.length, "the walk collected no primitives").toBeGreaterThan(10);
    expect(
      TOKENS.length,
      "no radius utility was found"
    ).toBeGreaterThan(10);

    // The gate cannot pass by the scale having been emptied: the four steps the
    // design system names for the app register have to still be declared.
    for (const step of ["card", "tile", "control", "full"]) {
      expect(DECLARED.has(step), `the scale no longer declares ${step}`).toBe(
        true
      );
    }
  });

  it("fails any radius that is not one of the declared steps", () => {
    const undeclared = TOKENS.filter(({ token }) => stepOf(token) === null).map(
      ({ token, file }) =>
        token === "rounded"
          ? `${file} uses the bare ${token}, which resolves to DEFAULT rather than to a declared step`
          : `${file} uses ${token}, which is not a declared radius step`
    );

    expect(undeclared).toEqual([]);
  });
});
