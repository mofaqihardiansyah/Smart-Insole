import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Anti-silent-fallback gate for D-01.
 *
 * A primitive that does not know a key does not fail: it resolves to a declared
 * fallback and renders something plausible. `VARIANTS[variant] || VARIANTS.filled`
 * is the defect shape of this codebase, and it produced both shipped defects —
 * eight landing CTAs painted with the app-register navy button, and a grey tile
 * for a *healthy* pressure reading whose caller passed `success` to a map that
 * declares `safe`.
 *
 * The posture this file enforces is: a wrong key must be caught where it is
 * written, not discovered as a wrong-looking surface. So every LITERAL
 * `variant=`, `level=` and `tone=` value in the shipped `.jsx` must be a member
 * of the vocabulary its primitive declares, and each vocabulary is read from
 * that primitive's own source rather than re-typed here, so a key cannot
 * quietly diverge from the map it is supposed to belong to.
 *
 * A computed key is out of scope by design: the source cannot see it, so no
 * static gate can judge it. That half is covered at runtime instead — a bad key
 * warns in development through `utils/devWarn.js` and still resolves to the
 * declared fallback in production, so a bad key degrades rather than blanks a
 * view.
 *
 * THE CALL-SITE KEY GATE COVERS THREE VOCABULARIES. `variant=` is owned by
 * `GlassButton`'s variant map plus the literals `StatePanel` branches on,
 * `level=` by `StatusChip`'s level map, and `tone=` by two owners: `Chip`'s
 * tone map and the banner tone map on `AlertBanner` (the primitive `StatusBanner`
 * delegates to). Every literal key must be a member of its owner's vocabulary.
 *
 * The `__oil_ui_eval__` scratch page is excluded by DIRECTORY, following
 * `copy.test.js`: it is imported by no production source and is deleted before
 * handoff, and an exclusion by directory means a future file placed there is
 * excluded too rather than silently joining the gate.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
/** This file lives in `src`, so the shipped sources are right here. */
const SRC = here;

/** The scratch-page directory, excluded from the walk below. */
const SCRATCH = "__oil_ui_eval__";

const readSource = (rel) => fs.readFileSync(path.join(SRC, rel), "utf8");

/** Every shipped `.jsx` under `dir`: tests and the scratch page excluded. */
const collect = (dir) => {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === SCRATCH) continue;
      out.push(...collect(full));
    } else if (entry.name.endsWith(".jsx") && !entry.name.includes(".test.")) {
      out.push(full);
    }
  }
  return out;
};

/**
 * The keys of a `const NAME = { ... };` map, read out of the component's own
 * source. Entries in this codebase's maps sit at two-space indent and a nested
 * map's keys sit deeper, so the indent is the anchor that keeps a nested key
 * from being mistaken for an entry.
 *
 * Both failure modes throw rather than returning an empty set: an anchor that
 * no longer matches and a block that yields no keys are exactly how a gate like
 * this one goes quiet without ever reporting anything.
 */
const mapKeys = (source, anchor, label) => {
  const block = source.match(anchor);
  if (!block) {
    throw new Error(`variantKeys: could not find ${label} in its source`);
  }
  const keys = [...block[1].matchAll(/^ {2}([A-Za-z_$][\w$]*):/gm)].map(
    ([, key]) => key
  );
  if (keys.length === 0) {
    throw new Error(`variantKeys: read ${label} but found no keys in it`);
  }
  return keys;
};

/**
 * The variants a component handles, for a component that branches on the prop
 * directly instead of declaring a map. `StatePanel` is that component: it
 * compares `variant` against a literal, and its vocabulary is therefore the set
 * of literals it branches to plus the prop's own declared default.
 *
 * A negated comparison (`variant !== "x"`) cannot match: the `!` sits between
 * the identifier and the operator.
 */
const handledVariants = (source, label) => {
  const keys = [...source.matchAll(/variant\s*={1,3}\s*"([^"]+)"/g)].map(
    ([, key]) => key
  );
  if (keys.length === 0) {
    throw new Error(`variantKeys: could not read ${label} in its source`);
  }
  return keys;
};

const GLASS_BUTTON = readSource("components/ui/GlassButton.jsx");
const STATE_PANEL = readSource("components/ui/StatePanel.jsx");
const STATUS_CHIP = readSource("components/ui/StatusChip.jsx");
const CHIP = readSource("components/ui/Chip.jsx");
const ALERT_BANNER = readSource("components/ui/AlertBanner.jsx");

const BUTTON_KEYS = mapKeys(
  GLASS_BUTTON,
  /const VARIANTS = \{([\s\S]*?)\n\};/,
  "GlassButton's VARIANTS"
);
const PANEL_KEYS = handledVariants(
  STATE_PANEL,
  "StatePanel's handled variants"
);
const CHIP_KEYS = mapKeys(
  STATUS_CHIP,
  /const LEVELS = \{([\s\S]*?)\n\};/,
  "StatusChip's LEVELS"
);
const CHIP_TONE_KEYS = mapKeys(
  CHIP,
  /const TONES = \{([\s\S]*?)\n\};/,
  "Chip's TONES"
);
const BANNER_TONE_KEYS = mapKeys(
  ALERT_BANNER,
  /const TONES = \{([\s\S]*?)\n\};/,
  "AlertBanner's TONES"
);

/**
 * The two registers share one `variant` prop name, so a literal is legal if
 * either primitive declares it: `warm` belongs to GlassButton, `loading` to
 * StatePanel.
 */
const DECLARED_VARIANTS = new Set([...BUTTON_KEYS, ...PANEL_KEYS]);
const DECLARED_LEVELS = new Set(CHIP_KEYS);

/**
 * The `tone` prop is shared by more components than any other key here, so its
 * vocabulary is the union of both owners: a filter chip and a banner take the
 * same four semantic tones, and only `Chip` additionally declares `neutral`.
 */
const DECLARED_TONES = new Set([...CHIP_TONE_KEYS, ...BANNER_TONE_KEYS]);

const FILES = collect(SRC);

/** Every literal `prop="value"` occurrence across the walked sources. */
const collectLiterals = (files, prop) => {
  const pattern = new RegExp(`\\b${prop}\\s*=\\s*"([^"]+)"`, "g");
  const found = [];
  for (const file of files) {
    for (const [, value] of readSource(path.relative(SRC, file)).matchAll(
      pattern
    )) {
      found.push({ file: path.relative(SRC, file), value });
    }
  }
  return found;
};

const VARIANT_LITERALS = collectLiterals(FILES, "variant");
const LEVEL_LITERALS = collectLiterals(FILES, "level");
const TONE_LITERALS = collectLiterals(FILES, "tone");

/**
 * The floors. A broken walk or a regex that stopped matching would otherwise
 * collect nothing and pass every verdict below silently, which is the failure
 * mode `copy.test.js:68-73` exists to prevent (`IN-03`).
 */
const FILE_FLOOR = 40;
const VARIANT_FLOOR = 8;
const LEVEL_FLOOR = 2;
const TONE_FLOOR = 2;

const assertFloors = () => {
  expect(FILES.length, "the walk collected no shipped sources").toBeGreaterThan(
    FILE_FLOOR
  );
  expect(
    VARIANT_LITERALS.length,
    "no literal variant= key was collected"
  ).toBeGreaterThanOrEqual(VARIANT_FLOOR);
  expect(
    LEVEL_LITERALS.length,
    "no literal level= key was collected"
  ).toBeGreaterThanOrEqual(LEVEL_FLOOR);
  expect(
    TONE_LITERALS.length,
    "no literal tone= key was collected"
  ).toBeGreaterThanOrEqual(TONE_FLOOR);
};

describe("a call-site key must be declared", () => {
  it("walks the shipped .jsx sources and collects a non-vacuous literal set", () => {
    assertFloors();
  });

  it("declares every literal variant= key a call site passes", () => {
    assertFloors();

    const undeclared = VARIANT_LITERALS.filter(
      ({ value }) => !DECLARED_VARIANTS.has(value)
    );

    expect(
      undeclared.map(({ file, value }) => `${file} passes variant="${value}"`)
    ).toEqual([]);
  });

  it("declares every literal level= key a call site passes", () => {
    assertFloors();

    const undeclared = LEVEL_LITERALS.filter(
      ({ value }) => !DECLARED_LEVELS.has(value)
    );

    expect(
      undeclared.map(({ file, value }) => `${file} passes level="${value}"`)
    ).toEqual([]);
  });

  it("declares every literal tone= key a call site passes, across both owners", () => {
    assertFloors();

    // Both owners have to have been read: an unreadable map throws inside
    // `mapKeys`, and an empty one would make every tone below undeclared and
    // fail loudly rather than quietly.
    expect(CHIP_TONE_KEYS.length, "Chip declares no tones").toBeGreaterThan(0);
    expect(
      BANNER_TONE_KEYS.length,
      "AlertBanner declares no tones"
    ).toBeGreaterThan(0);

    const undeclared = TONE_LITERALS.filter(
      ({ value }) => !DECLARED_TONES.has(value)
    );

    expect(
      undeclared.map(
        ({ file, value }) =>
          `${file} passes tone="${value}", which neither Chip nor AlertBanner declares`
      )
    ).toEqual([]);
  });
});
