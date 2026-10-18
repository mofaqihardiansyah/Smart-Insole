import { describe, it, expect, afterEach, vi } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { GlassButton, BUTTON_VARIANTS } from "./GlassButton";

/**
 * The primitive's own lock for D-01 and C-01.
 *
 * `a11y.test.jsx` already asserts the 44px floor and the focus pair on this
 * component, and `landingCta.test.jsx` asserts what the landing renders. What
 * neither covers is the primitive's own contract: that every variant renders
 * exactly the declaration it declares (the property the eight-Cta collapse
 * violated), that the landing pair stays on warm tokens and off the
 * app-register fill, that the press translate is gone from every size and every
 * variant, and that an unknown key warns in development while still resolving
 * to the declared fallback.
 *
 * Every expected class string is read from the exported `BUTTON_VARIANTS`,
 * following `StatusChip.test.jsx:22`, so a variant cannot silently diverge from
 * the vocabulary it declares.
 */

const SIZES = [
  { size: "sm", floor: "min-h-[44px]", release: "lg:min-h-[36px]" },
  { size: "md", floor: "min-h-[44px]", release: "lg:min-h-[40px]" },
  // `lg` is already past the floor, so it needs no release: shrinking it would
  // be the regression, not releasing it.
  { size: "lg", floor: "min-h-[48px]", release: null },
];

const VARIANTS = Object.keys(BUTTON_VARIANTS);

/** The shared focus pair, both tokens named so neither can be dropped alone. */
const RING_PAIR = ["focus-visible:outline-none", "focus-visible:ring-2"];

const classesOf = (element) =>
  (element.getAttribute("class") || "").split(/\s+/).filter(Boolean);

const classString = (element) => element.getAttribute("class") || "";

/**
 * A transform utility that moves the control on press. Matched by the utility's
 * own prefix rather than by the full class, so `translate-y-[1px]`,
 * `lg:-translate-y-1` and anything added later all fail together. Variant
 * prefixes are stepped over first; `transition-*` cannot match because
 * `translate-` is not its prefix.
 */
const isPressTranslate = (token) => /^(?:[a-z0-9-]+:)*-?translate-/.test(token);

const renderButton = (props = {}) => {
  const utils = render(<GlassButton {...props}>Go</GlassButton>);
  return { ...utils, button: utils.container.querySelector("button") };
};

describe("GlassButton's own contract", () => {
  it("holds the floor, the release and the focus pair on every size and variant", () => {
    for (const { size, floor, release } of SIZES) {
      for (const variant of VARIANTS) {
        const { button, unmount } = renderButton({ size, variant });
        const classes = classesOf(button);
        const where = `${variant}/${size}`;

        // A positive floor assertion cannot pass on an empty class list.
        expect(classes.length, `${where} rendered no classes`).toBeGreaterThan(
          0
        );
        expect(classes, `${where} lost its floor`).toContain(floor);

        if (release) {
          expect(classes, `${where} lost its desktop release`).toContain(
            release
          );
        } else {
          expect(
            classes,
            `${where} must not shrink to the compact floor`
          ).not.toContain("min-h-[44px]");
        }

        expect(classes, `${where} lost its colour transition`).toContain(
          "transition-colors"
        );
        RING_PAIR.forEach((token) => {
          expect(classes, `${where} lost ${token}`).toContain(token);
        });

        // Press feedback is colour and border only (MOTION 1).
        expect(
          classes.filter(isPressTranslate),
          `${where} presses with a translate`
        ).toEqual([]);

        unmount();
      }
    }
  });

  it("renders exactly its own declaration for every variant", () => {
    for (const [variant, declaration] of Object.entries(BUTTON_VARIANTS)) {
      const { button, unmount } = renderButton({ variant });

      expect(
        classString(button),
        `${variant} did not render its own declaration`
      ).toContain(declaration);

      for (const [other, otherDeclaration] of Object.entries(BUTTON_VARIANTS)) {
        if (other === variant) continue;
        expect(
          classString(button),
          `${variant} borrowed ${other}'s declaration`
        ).not.toContain(otherDeclaration);
      }

      unmount();
    }
  });

  it("keeps the landing pair on warm tokens and off the app-register fill", () => {
    const warm = renderButton({ variant: "warm" });
    const warmClasses = classesOf(warm.button);
    expect(warmClasses, "warm lost its accent fill").toContain(
      "bg-warm-accent-deep"
    );
    expect(warmClasses, "warm renders the app-register fill").not.toContain(
      "bg-primary-btn"
    );
    warm.unmount();

    const outline = renderButton({ variant: "warmOutline" });
    const outlineClasses = classesOf(outline.button);
    ["bg-warm-card", "text-warm-ink", "border-warm-line"].forEach((token) => {
      expect(outlineClasses, `warmOutline lost ${token}`).toContain(token);
    });
    expect(
      outlineClasses,
      "warmOutline renders the app-register fill"
    ).not.toContain("bg-primary-btn");
    outline.unmount();
  });
});

describe("an unknown variant", () => {
  afterEach(() => {
    // The stub must not leak into a sibling file, where a silenced helper would
    // hide the very degradation this lock exists to surface (T-03-02).
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("renders the declared fallback and warns once in development", () => {
    vi.stubEnv("DEV", true);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { button } = renderButton({ variant: "not-a-variant" });

    expect(
      classString(button),
      "an unknown key must render the declared fallback"
    ).toContain(BUTTON_VARIANTS.filled);
    expect(classString(button), "an unknown key blanked the control").not.toBe(
      ""
    );

    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain("not-a-variant");
  });

  it("renders the same fallback and stays silent outside development", () => {
    vi.stubEnv("DEV", false);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { button } = renderButton({ variant: "not-a-variant" });

    expect(
      classString(button),
      "the fallback must not depend on the environment"
    ).toContain(BUTTON_VARIANTS.filled);
    expect(warn).not.toHaveBeenCalled();
  });
});
