import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import config from "../tailwind.config.js";

/**
 * Every Tailwind utility the source references must actually exist.
 *
 * This is a regression test with a real incident behind it. A previous pass
 * rewrote `tailwind.config.js` and deleted the `warm.*` colour group, the
 * landing radius steps and the landing shadow set, while `LandingPage.jsx` kept
 * referencing all of them. Nothing failed: an unknown Tailwind class is not an
 * error, it is simply a class with no rule, so the landing page silently lost
 * its colours, its radii and its elevation.
 *
 * The only honest way to catch that is to generate the real stylesheet from the
 * real config and confirm each class the source uses has a rule in it. So that
 * is what this does: it runs the project's own Tailwind config over the real
 * content globs and looks for every utility-shaped token it finds.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
/** This file lives in `src`, so the sources under test are right here. */
const SRC = here;

/**
 * Utility-shaped tokens, anchored so prose cannot match.
 *
 * The leading negative lookbehind matters: without it, `to` (a gradient
 * position prefix) matches any `to-...` inside a sentence, and the test reports
 * failures for words.
 */
const UTILITY =
  /(?<![\w-])(?:bg|text|border|ring|shadow|rounded|from|to|via|fill|stroke|divide|accent|placeholder|outline|decoration)-[a-zA-Z0-9][a-zA-Z0-9./_[\]#%()-]*/g;

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

const escapeForCss = (token) =>
  token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\//g, "\\/");

describe("design tokens", () => {
  it("generates a rule for every utility class used in src", async () => {
    const { css } = await postcss([tailwindcss(config)]).process(
      "@tailwind utilities;",
      { from: undefined }
    );

    const missing = [];

    for (const file of collectSources(SRC)) {
      const source = fs.readFileSync(file, "utf8");
      const seen = new Set();

      for (const match of source.match(UTILITY) || []) {
        const token = match.replace(/[.,;:)"'`]+$/, "");
        if (seen.has(token)) continue;
        seen.add(token);
        if (!css.includes(escapeForCss(token))) {
          missing.push(`${token}  <-  ${path.relative(SRC, file)}`);
        }
      }
    }

    expect(missing).toEqual([]);
  }, 60000);

  it("keeps the two elevation languages apart", async () => {
    // The app card lift and the landing card shadow were once the same name
    // with one value, which is why the app cards were flat on the landing and
    // the landing panels were flat everywhere. They are separate tokens now.
    expect(config.theme.extend.boxShadow.panel).not.toBe(
      config.theme.extend.boxShadow.card
    );
    // Positive: the landing shadows resolve to the DECLARED warm-dark ink.
    expect(config.theme.extend.boxShadow.card).toMatch(/23 23 25/);
    expect(config.theme.extend.boxShadow.panel).toMatch(/15 23 42/);
  });

  it("declares no shade outside the token inventory", () => {
    // The landing shadow surface is generated entirely by these two files, so
    // an off-token channel triplet here ships unmeasured on every landing
    // shadow. The declared warm ink is the only one that may appear.
    for (const rel of ["../tailwind.config.js", "index.css"]) {
      const text = fs.readFileSync(path.join(SRC, rel), "utf8");
      expect(text, `${rel} declares an off-token shade`).not.toMatch(
        /35 36 39/
      );
    }
  });

  it("gives every shadow step its own value", () => {
    // `lg` used to be a byte-copy of `overlay`, which is reserved for modal
    // dialogs. Every elevation step must carry its own distinct value.
    const values = Object.values(config.theme.extend.boxShadow);
    expect(new Set(values).size).toBe(values.length);
  });

  it("rejects dark: utility variants (light-only theme)", async () => {
    const { css } = await postcss([tailwindcss(config)]).process(
      "@tailwind utilities;",
      { from: undefined }
    );

    // dark: is a Tailwind variant prefix — any match means a dark-mode rule leaked in.
    const darkMatches = css.match(/dark:/g) || [];
    expect(darkMatches).toEqual([]);

    // color-scheme: light must be declared on both :root and .landing-scope.
    const indexCss = fs.readFileSync(
      path.join(SRC, "index.css"),
      "utf8"
    );
    expect(indexCss).toMatch(/color-scheme:\s*light/);
    const rootMatches = (indexCss.match(/:root\s*\{/g) || []).length;
    const landingMatches = (indexCss.match(/\.landing-scope\s*\{/g) || []).length;
    expect(rootMatches).toBeGreaterThanOrEqual(1);
    expect(landingMatches).toBeGreaterThanOrEqual(1);
    // color-scheme: light must appear within both scopes.
    const rootBlock = indexCss.slice(
      indexCss.indexOf(":root {")
    );
    const landingBlock = indexCss.slice(
      indexCss.indexOf(".landing-scope {")
    );
    expect(rootBlock).toMatch(/color-scheme:\s*light/);
    expect(landingBlock).toMatch(/color-scheme:\s*light/);
  });
});
