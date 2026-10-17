import { describe, it, expect } from "vitest";
import { render, within } from "@testing-library/react";
import React from "react";
import { StatusChip, STATUS_LEVELS } from "./StatusChip";

/**
 * FIX-04: risk is never signalled by colour alone.
 *
 * Every level must render three redundant channels: a distinct icon SHAPE
 * (decorative to assistive tech), the translated text label, and the tone pair.
 * The pairs are read from the module's own `STATUS_LEVELS` rather than re-typed
 * here, so a level cannot quietly diverge from the vocabulary it declares.
 */

const LEVELS = ["safe", "warning", "danger"];

const renderChip = (props = {}) => {
  const utils = render(<StatusChip label="Level" {...props} />);
  return { ...utils, chip: utils.container.firstChild };
};

const toneTokens = (level) => STATUS_LEVELS[level].tone.split(" ");

describe("StatusChip", () => {
  it("renders three redundant channels for every level", () => {
    for (const level of LEVELS) {
      const label = `Level ${level}`;
      const { chip, unmount } = renderChip({ level, label });

      // (a) one icon, decorative: the shape is the channel, not an announcement
      const icons = chip.querySelectorAll("svg");
      expect(icons, level).toHaveLength(1);
      expect(icons[0], level).toHaveAttribute("aria-hidden", "true");

      // (b) the visible text label, queried by text rather than by attribute
      expect(within(chip).getByText(label), level).toBeInTheDocument();

      // (c) both tokens of the declared tone pair
      for (const token of toneTokens(level)) {
        expect(chip.className, `${level} is missing ${token}`).toContain(token);
      }

      unmount();
    }
  });

  it("gives every level its own tone pair and its own icon", () => {
    const tones = LEVELS.map((level) => STATUS_LEVELS[level].tone);
    expect(new Set(tones).size).toBe(LEVELS.length);

    const icons = LEVELS.map((level) => STATUS_LEVELS[level].Icon);
    expect(new Set(icons).size).toBe(LEVELS.length);

    // A level's tone carries its own ink and never borrows another level's, so
    // two adjacent chips cannot read as the same signal.
    for (const level of LEVELS) {
      const tone = STATUS_LEVELS[level].tone;
      expect(tone, level).toContain(`text-${level}-ink`);
      for (const other of LEVELS) {
        if (other === level) continue;
        expect(tone, `${level} borrows ${other}'s ink`).not.toContain(
          `text-${other}-ink`
        );
      }
    }
  });

  it("appends a caller class without dropping the tone", () => {
    const { chip } = renderChip({
      level: "warning",
      className: "tile-extra",
    });

    expect(chip.className).toContain("tile-extra");
    expect(chip.className).toContain("status-chip");
    for (const token of toneTokens("warning")) {
      expect(chip.className, token).toContain(token);
    }
  });

  it("falls back to safe for a level it does not know", () => {
    const { chip } = renderChip({ level: "unknown" });

    for (const token of toneTokens("safe")) {
      expect(chip.className, token).toContain(token);
    }
  });
});
