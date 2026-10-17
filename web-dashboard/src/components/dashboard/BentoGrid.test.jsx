import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import fs from "node:fs";
import { BentoGrid } from "./BentoGrid";

/**
 * FIX-06: the tile tone is data, never position.
 *
 * The identity rule for this product is that colour is a vital sign: a sage
 * tile means the reading is good, not that it happens to be the second card. So
 * every assertion below is keyed to the CARD, and the permutation below exists
 * to make a tint-by-index implementation impossible to pass.
 *
 * `ICON_TONES` is not exported, so the vocabulary is read from the component's
 * own source rather than re-typed here; a level cannot quietly diverge from the
 * tones it declares.
 */

const readSource = (rel) =>
  fs.readFileSync(new URL(rel, import.meta.url), "utf8");

const GRID_SOURCE = readSource("./BentoGrid.jsx");

const ICON_TONES = Object.fromEntries(
  [
    ...GRID_SOURCE.match(/const ICON_TONES = \{([\s\S]*?)\};/)[1].matchAll(
      /(\w+):\s*"([^"]+)"/g
    ),
  ].map(([, key, value]) => [key, value])
);

const DASHBOARD_SOURCE = readSource("../../pages/DashboardPage.jsx");

/** The `tiles` array, sliced from its declaration to its closing bracket. */
const tilesSlice = (() => {
  const start = DASHBOARD_SOURCE.indexOf("const tiles = [");
  const end = DASHBOARD_SOURCE.indexOf("];", start);
  return DASHBOARD_SOURCE.slice(start, end + 2);
})();

const toneExpressions = [...tilesSlice.matchAll(/iconTone:\s*([^,]+),/g)].map(
  ([, expr]) => expr.trim()
);

/**
 * A quoted literal used as an operand of a comparison inside a tone expression
 * is a domain value being tested (`risk === "safe"`), not a tone that can be
 * rendered, so equality-test operands are dropped before the literals are
 * collected. Comparing such an operand against the tone vocabulary would fail
 * against a correct source.
 */
const dropComparisonOperands = (expr) =>
  expr
    .replace(/[A-Za-z_$][\w$]*\s*[!=]==?\s*"[^"]*"/g, "")
    .replace(/"[^"]*"\s*[!=]==?\s*[A-Za-z_$][\w$]*/g, "");

const resultLiterals = (expr) =>
  [...dropComparisonOperands(expr).matchAll(/"([^"]*)"/g)].map(([, v]) => v);

const card = (id, iconTone) => ({
  id,
  title: `Card ${id}`,
  value: "1",
  icon: <span data-testid={`glyph-${id}`} />,
  ...(iconTone ? { iconTone } : {}),
});

const cells = (container) => [...container.querySelectorAll(".rounded-card")];

/** The icon tile inside a cell is the only `rounded-tile` descendant. */
const tileOf = (cell) => cell.querySelector(".rounded-tile");

const spanFor = (container, index) => {
  const span = tileOf(cells(container)[index]);
  expect(span, `tile ${index} has a rounded-tile span`).not.toBeNull();
  return span;
};

describe("BentoGrid tone is data, not position", () => {
  it("paints each tile with its own card's tone", () => {
    const order = ["success", "danger", "neutral"];
    const { container, unmount } = render(
      <BentoGrid cards={order.map((tone, i) => card(`c${i}`, tone))} />
    );

    order.forEach((tone, i) => {
      const span = spanFor(container, i);
      expect(span.className, `tile ${i}`).toContain(ICON_TONES[tone]);
      for (const other of Object.values(ICON_TONES)) {
        if (other === ICON_TONES[tone]) continue;
        expect(span.className, `tile ${i} borrows ${other}`).not.toContain(
          other
        );
      }
    });

    unmount();
  });

  it("keeps each tile's tone tied to its card when the cards are permuted", () => {
    const straight = [
      card("a", "success"),
      card("b", "danger"),
      card("c", "neutral"),
    ];
    const permuted = [straight[2], straight[0], straight[1]];

    const first = render(<BentoGrid cards={straight} />);
    const before = cells(first.container).map((cell) => tileOf(cell).className);
    first.unmount();

    const second = render(<BentoGrid cards={permuted} />);
    const after = cells(second.container);

    permuted.forEach((c, i) => {
      // The card in this slot is the one whose title is here...
      expect(after[i].textContent, `slot ${i} holds ${c.title}`).toContain(
        c.title
      );
      // ...and its tone followed it, rather than staying at the old index.
      expect(tileOf(after[i]).className, `slot ${i}`).toContain(
        ICON_TONES[c.iconTone]
      );
    });

    // The permutation genuinely moved tones across slots, so a positional tint
    // cannot produce this result.
    expect(after.map((cell) => tileOf(cell).className)).not.toEqual(before);
  });

  it("falls back to the neutral tone for a card that names no tone", () => {
    const { container } = render(<BentoGrid cards={[card("notint")]} />);
    expect(spanFor(container, 0).className).toContain(ICON_TONES.neutral);
  });

  it("renders no tile at all for a card that carries no icon", () => {
    const { container } = render(
      <BentoGrid
        cards={[{ id: "bare", title: "Bare", value: "1", iconTone: "success" }]}
      />
    );
    const cell = cells(container)[0];
    expect(cell).not.toBeNull();
    expect(tileOf(cell)).toBeNull();
  });
});

describe("BentoGrid tile control semantics", () => {
  it("gives a tile without an action no control role", () => {
    const { container } = render(
      <BentoGrid cards={[{ id: "dead", title: "Dead", value: "1" }]} />
    );
    const cell = cells(container)[0];
    expect(cell.tagName).toBe("DIV");
    expect(cell.getAttribute("role")).toBeNull();
    expect(cell.className).not.toMatch(/\bmin-h/);
  });

  it("makes an actionable tile a real button with a visible focus ring", () => {
    const { container } = render(
      <BentoGrid
        cards={[
          {
            id: "live",
            title: "Live",
            value: "1",
            actionLabel: "Open live",
            onSelect: () => {},
          },
        ]}
      />
    );
    const cell = cells(container)[0];
    expect(cell.tagName).toBe("BUTTON");
    expect(cell).toHaveAttribute("type", "button");
    expect(cell).toHaveAttribute("aria-label", "Open live");
    expect(cell.className).toContain("focus-visible:outline-none");
    expect(cell.className).toContain("focus-visible:ring-2");
    expect(cell.className).not.toMatch(/\bmin-h/);
  });
});

describe("the dashboard's tiles slice", () => {
  it("declares one tone per tile through the component's own vocabulary", () => {
    expect(tilesSlice).not.toBe("");
    expect(tilesSlice.match(/iconTone:/g)).toHaveLength(4);
    expect(toneExpressions).toHaveLength(4);

    const vocabulary = new Set(Object.keys(ICON_TONES));

    for (const expr of toneExpressions) {
      // A tone is a vocabulary key, never a raw colour or a Tailwind class.
      expect(expr, expr).not.toContain("bg-");
      expect(expr, expr).not.toContain("text-");
      // The decorative accent is not a metric state.
      expect(expr, expr).not.toContain("accent");

      for (const literal of resultLiterals(expr)) {
        expect(vocabulary.has(literal), `${literal} in "${expr}"`).toBe(true);
      }
    }
  });

  it("never hands the risk verdict through as if it were a tone", () => {
    // The raw verdict value is not a tone: passing it through is the defect
    // class this lock exists for. The `safe` verdict in particular has no tone
    // key of its own, so it would reach the component's neutral fallback and
    // paint a good reading grey.
    expect(tilesSlice).not.toMatch(/iconTone:\s*risk\s*[,}]/);
  });
});
