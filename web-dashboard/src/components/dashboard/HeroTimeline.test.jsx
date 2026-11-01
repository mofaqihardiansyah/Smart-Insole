import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { HeroTimeline } from "./HeroTimeline";

/**
 * The hero timeline (cadra-4): one thin line over the hero card, carrying one
 * dot per buffered reading, each dot painted by that reading's own risk.
 *
 * What it refuses to do:
 * - it draws nothing from nothing: an empty buffer leaves the bare line, not
 *   an invented row of dots;
 * - it never re-reads the risk to the accessibility tree: the feed and the
 *   status chip already carry the verdict as icon + label + colour, so the
 *   graphic is one `role="img"` with a summary label built from real counts;
 * - it hosts no live region: a thin summary strip is not worth interrupting a
 *   screen reader for, and `liveRegion.test` freezes the page's allowlist.
 */

const SOURCE = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "HeroTimeline.tsx"),
  "utf8"
);

const RISK_DOT = {
  safe: "bg-safe",
  warning: "bg-warning",
  danger: "bg-danger",
};

const T0 = 1_700_000_000_000;

const record = (offset, risk) => ({
  timestamp: T0 + offset * 1000,
  risk,
  peakPressure: 40,
  readings: {},
});

/** One dot, keyed by its own record's risk, in buffer order. */
const dots = (container) => [...container.querySelectorAll("[data-timeline-dot]")];

describe("HeroTimeline", () => {
  it("draws one dot per buffered reading, painted by that reading's risk", () => {
    const records = [
      record(0, "safe"),
      record(1, "warning"),
      record(2, "danger"),
      record(3, "safe"),
    ];
    const { container } = render(<HeroTimeline records={records} language="id" />);

    expect(dots(container)).toHaveLength(4);
    dots(container).forEach((dot, i) => {
      expect(dot.className).toContain(RISK_DOT[records[i].risk]);
    });
  });

  it("lays the dots out along elapsed time, oldest at the left", () => {
    const records = [record(0, "safe"), record(60, "warning"), record(180, "danger")];
    const { container } = render(<HeroTimeline records={records} language="id" />);

    const leftPct = (dot) => Number(dot.style.left.replace("%", ""));
    const [a, b, c] = dots(container);
    expect(leftPct(a)).toBeLessThan(leftPct(b));
    expect(leftPct(b)).toBeLessThan(leftPct(c));
    expect(leftPct(c)).toBeLessThanOrEqual(100);
  });

  it("marks the fresh end of the window with a time marker, in words", () => {
    const { container } = render(
      <HeroTimeline records={[record(0, "safe"), record(1, "danger")]} language="id" />
    );
    const marker = container.querySelector('[data-timeline="now"]');
    expect(marker).not.toBeNull();
    expect(marker.textContent).not.toBe("");
  });

  it("leaves the bare line standing when the buffer is empty", () => {
    const { container } = render(<HeroTimeline records={[]} language="id" />);

    expect(dots(container)).toHaveLength(0);
    expect(container.querySelector('[data-timeline="now"]')).toBeNull();
    // The line is the instrument with nothing plugged into it: it still exists.
    expect(container.querySelector("[data-timeline-track]")).not.toBeNull();
    // And it announces nothing, because there is nothing to announce.
    expect(container.querySelector('[role="img"]')).toBeNull();
  });

  it("summarises itself for the accessibility tree from real counts", () => {
    const records = [record(0, "safe"), record(1, "danger"), record(2, "danger")];
    const { container } = render(<HeroTimeline records={records} language="id" />);

    const strip = screen.getByRole("img");
    // The role=img element is the root itself: the summary and the dots are
    // one announced object, not an image buried in a wrapper.
    expect(strip).toBe(strip.closest("[data-timeline-root]"));
    expect(strip.getAttribute("aria-label")).toContain("3");
  });

  it("hosts no live region, in output or in source", () => {
    const { container } = render(<HeroTimeline records={[record(0, "safe")]} language="id" />);
    expect(container.querySelectorAll("[aria-live]")).toHaveLength(0);
    expect(SOURCE).not.toMatch(/aria-live/);
  });

  it("never borrows a quarantined series colour", () => {
    expect(SOURCE).not.toMatch(/--series-/);
  });
});
