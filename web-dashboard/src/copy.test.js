import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Shipped-copy guard for FIX-09.
 *
 * The dictionary already has a dash gate (`utils/i18n.test.js`), and that gate
 * is precisely why this file exists: the two fallbacks on the admin users table
 * never reached the dictionary, so a raw separator character went straight into
 * JSX where no dictionary gate could see it. This walks the shipped `.jsx`
 * under `src/`, strips comments, and fails on any separator that survives.
 *
 * Comment stripping is the whole difficulty, and it is mandatory rather than
 * optional: JSDoc headers in this codebase legitimately carry the character as
 * prose (`ui/GlassButton.jsx` does). A naive scan over the raw file would flag
 * every one of them and the guard would be disabled within a week.
 *
 * The scratch page under `src/__oil_ui_eval__/` is excluded. Its own header
 * states it is imported by no production source and is deleted before handoff.
 * The exclusion is by DIRECTORY, so a future addition there is excluded too
 * rather than silently joining the guard.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
/** This file lives in `src`, so the shipped sources are right here. */
const SRC = here;

/** The scratch-page directory, excluded from the walk below. */
const SCRATCH = "__oil_ui_eval__";

/** Every `dir/*.jsx` underneath, recursively, scratch page excluded. */
const collect = (dir) => {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === SCRATCH) continue;
      out.push(...collect(full));
    } else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
};

/**
 * Strip block comments first, then line comments.
 *
 * The order matters: a block comment can contain `//`, so stripping line
 * comments first would leave the block's tail behind and report prose as copy.
 * The `(^|[^:])` guard is what keeps a URL scheme (`https://`) from reading as
 * the start of a line comment.
 */
const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

/**
 * The em dash and the en dash. Written as escapes on purpose: the literal
 * character must not appear in this file either.
 */
const DASH = /[\u2014\u2013]/;

describe("shipped copy", () => {
  const files = collect(SRC);

  it("walks the shipped .jsx sources rather than an empty list", () => {
    // 54 `.jsx` files under `src/` once the scratch page is excluded. A broken
    // walk that collected nothing would otherwise pass every case below, so the
    // count is asserted before any per-file verdict.
    expect(files.length).toBeGreaterThan(40);
  });

  it("ships no dash separator in any comment-stripped .jsx source", () => {
    const offenders = files.filter((file) =>
      DASH.test(stripComments(fs.readFileSync(file, "utf8")))
    );
    expect(offenders.map((file) => path.relative(SRC, file))).toEqual([]);
  });

  it("resolves the admin users-table fallbacks through the dictionary", () => {
    // The positive half of the fix. Deleting the const and putting a literal
    // back has to fail here, not merely stop matching a dash scan.
    const admin = fs.readFileSync(
      path.join(SRC, "pages", "AdminPage.tsx"),
      "utf8"
    );
    expect(admin).toMatch(
      /const\s+unavailable\s*=\s*t\(\s*["']common\.notAvailable["']/
    );
    expect(admin.match(/\|\|\s*unavailable\b/g) || []).toHaveLength(2);
  });
});
