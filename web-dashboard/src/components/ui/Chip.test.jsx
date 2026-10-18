import { describe, it, expect, afterEach, vi } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { Chip, CHIP_TONES } from "./Chip";

/**
 * The chip's two contracts (D-01, threat T-03-16).
 *
 * 1. A tone is a claim about the reading the chip labels, so a chip must render
 *    the pair its own tone declares and no other tone's. The pairs are read from
 *    the module's `CHIP_TONES` export rather than re-typed here, so a tone
 *    cannot quietly diverge from the vocabulary it declares and the count is
 *    asserted before any per-tone verdict, so a shrunk map fails here instead of
 *    passing every loop by finding nothing.
 * 2. An undeclared tone keeps its `neutral` fallback — a chip that renders
 *    nothing is worse on a console than one that renders a declared default —
 *    and warns in development, where the mistake was made. This is the same
 *    posture `variantKeys.test.js` enforces statically for literal keys.
 *
 * A long localised label is the third case: German and Indonesian strings are
 * longer than their English source, so the chip has to grow rather than clip.
 */

const TONE_NAMES = Object.keys(CHIP_TONES);

const renderChip = (props = {}) => {
  const utils = render(<Chip {...props}>Label</Chip>);
  return { ...utils, chip: utils.container.firstChild };
};

const tokensOf = (tone) => CHIP_TONES[tone].split(" ");

/**
 * Height and truncation utilities are asserted absent rather than by class
 * name: any of them would clip the label that drives the chip's own size.
 */
const CLIPPING = [
  /\btruncate\b/,
  /\bline-clamp-/,
  /\bmin-h-/,
  /\bmax-h-/,
  /\bh-\[/,
  /\bh-\d/,
  /\bh-full\b/,
  /\boverflow-hidden\b/,
];

describe("Chip", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("declares a tone map with at least the semantic set, so the loops below cannot pass vacuously", () => {
    // `variantKeys.test.js` reads this same export as the authority for every
    // literal `tone=` in the shipped sources.
    expect(TONE_NAMES.length).toBeGreaterThanOrEqual(4);
    expect(new Set(TONE_NAMES).size).toBe(TONE_NAMES.length);

    const { container } = renderChip({ tone: TONE_NAMES[0] });
    expect(container.querySelectorAll("span").length).toBeGreaterThan(0);
  });

  it("renders each declared tone's own pair and no other tone's ink", () => {
    for (const tone of TONE_NAMES) {
      const { chip, unmount } = renderChip({ tone });

      for (const token of tokensOf(tone)) {
        expect(chip.className, `${tone} is missing ${token}`).toContain(token);
      }

      // Only the ink position is a claim about the state: the tint can be
      // shared, but two adjacent chips reading the same ink would read as the
      // same signal.
      for (const other of TONE_NAMES) {
        if (other === tone) continue;
        const foreignInk = tokensOf(other).filter((token) =>
          token.startsWith("text-")
        );
        for (const token of foreignInk) {
          expect(
            chip.className,
            `${tone} borrows ${other}'s ${token}`
          ).not.toContain(token);
        }
      }

      unmount();
    }
  });

  it("falls back to neutral, warns once in development, and names the declared set", () => {
    vi.stubEnv("DEV", true);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { chip } = renderChip({ tone: "urgent" });

    for (const token of tokensOf("neutral")) {
      expect(chip.className, token).toContain(token);
    }

    expect(warn).toHaveBeenCalledTimes(1);
    const line = String(warn.mock.calls[0][0]);
    expect(line).toContain("Chip");
    expect(line).toContain("urgent");
    for (const tone of TONE_NAMES) {
      expect(line, tone).toContain(tone);
    }
  });

  it("stays silent outside development and still falls back to neutral", () => {
    vi.stubEnv("DEV", false);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { chip } = renderChip({ tone: "urgent" });

    expect(warn).not.toHaveBeenCalled();
    for (const token of tokensOf("neutral")) {
      expect(chip.className, token).toContain(token);
    }
  });

  it("keeps the control radius for a filter chip and the pill for a marker", () => {
    const filter = renderChip({ tone: "info", pill: false });
    const marker = renderChip({ tone: "info", pill: true });

    expect(filter.chip.className).toContain("rounded-control");
    expect(filter.chip.className).not.toContain("rounded-full");
    expect(marker.chip.className).toContain("rounded-full");
  });

  it("appends a caller class without dropping the tone", () => {
    const { chip } = renderChip({ tone: "danger", className: "chart-legend" });

    expect(chip.className).toContain("chart-legend");
    for (const token of tokensOf("danger")) {
      expect(chip.className, token).toContain(token);
    }
  });

  it("grows for a long localised label instead of clipping it", () => {
    const label =
      "Tekanan puncak pada tumit kiri melebihi ambang bahaya selama sesi berjalan";
    const { container } = render(<Chip tone="warning" pill={true}>{label}</Chip>);

    const chip = container.firstChild;
    expect(chip.textContent).toBe(label);

    for (const pattern of CLIPPING) {
      expect(chip.className, String(pattern)).not.toMatch(pattern);
    }
  });

  it("renders the caller's own tag through the as prop and keeps the tone", () => {
    const utils = render(
      <Chip as="button" tone="success" type="button">
        Filter
      </Chip>
    );
    const chip = utils.container.firstChild;

    expect(chip.tagName).toBe("BUTTON");
    expect(chip).toHaveAttribute("type", "button");
    for (const token of tokensOf("success")) {
      expect(chip.className, token).toContain(token);
    }
  });
});
