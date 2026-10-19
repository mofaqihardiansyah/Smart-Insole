import React from "react";

/**
 * BentoGrid — the metric meter band.
 *
 * The band is deliberately NOT a row of cards. Four white boxes holding four
 * numbers is the generic stat-grid; here the numbers sit in one open, hairline
 * ruled strip that spans the full content width, separated by vertical rules
 * on one row at `lg`. A meter band reads as one instrument with four dials,
 * not as four small posters.
 *
 * Each meter still follows the same anatomy the reference console's stat card
 * had: an icon tile and a small state tag on the first line, the metric name,
 * the value, and an italic caption that says what the value is measured
 * against. The caption is not optional garnish: "danger limit 70 kPa" is what
 * turns a bare number into a reading, and without it the card is a claim with
 * no scale.
 *
 * The icon tile is tinted by the metric's SEMANTIC role, never by position.
 * That is the identity rule for this product: colour is a vital sign, so a
 * green tile means the reading is good, not that it is the third card.
 *
 * `cards[].icon` must be a React element, not a string: an earlier version
 * accepted icon names and rendered the literal text "Speed".
 *
 * Columns are whole literal class strings on purpose. Tailwind cannot see a
 * class built by interpolation, so the previous `grid-cols-${n}` produced no
 * multi column layout at all on desktop.
 *
 * A meter is only focusable and hoverable when it has something to do. A
 * meter that looks clickable and does nothing is a dead control.
 *
 * The band's shape: the container carries the top rule and the white fill;
 * every meter carries the bottom rule, so the rules read continuously at any
 * column count. Vertical separators are assigned per position, explicit and
 * literal, so a 2x2 step gets exactly one rule between its two columns and
 * the 4-up one-row layout gets three.
 */

/** Whole literals on purpose: Tailwind must be able to see each class. */
const COLUMN_CLASSES = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

/** Vertical rule per slot, per column count: `${columns}-${slot}` keyed,
 *  0-based slots. The sm 2x2 step must not put a rule on a left-column cell,
 *  so the rule set is chosen by the grid the band is actually in. */
const SEPARATORS = {
  1: {},
  2: { 1: "sm:border-r" },
  3: { 1: "sm:border-r", 2: "lg:border-r" },
  4: { 1: "sm:border-r", 2: "lg:border-r", 3: "sm:border-r" },
};

const ICON_TONES = {
  neutral: "bg-surface-2 text-fg-2",
  accent: "bg-secondary/15 text-secondary-ink",
  success: "bg-safe/15 text-safe-ink",
  warning: "bg-warning/15 text-warning-ink",
  danger: "bg-danger/15 text-danger-ink",
};

const CELL_CLASSES =
  "relative flex flex-col border-b border-border px-5 py-5 text-left";

const BentoCell = ({ card, index = 0, columns = 3 }) => {
  const interactive = typeof card.onSelect === "function";

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        {card.icon && (
          <span
            aria-hidden="true"
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-tile ${
              ICON_TONES[card.iconTone] || ICON_TONES.neutral
            }`}
          >
            {card.icon}
          </span>
        )}
        {card.badge}
      </div>

      <p className="mt-4 text-label uppercase text-muted">{card.title}</p>

      <p className="tabular-data mt-1.5 font-heading text-stat text-fg">
        {card.value ?? "--"}
        {card.unit && (
          <span className="ml-1.5 align-middle text-body-sm font-medium text-muted">
            {card.unit}
          </span>
        )}
      </p>

      {card.caption && (
        <p className="mt-2 text-caption italic text-muted">{card.caption}</p>
      )}
      {card.footer}
    </>
  );

  // The band, not a card: transparent fill, the vertical rule that slot owns
  // for this band's column count.
  const separator = (SEPARATORS[columns] || {})[index];
  const position = separator ? ` ${separator}` : "";

  // Only give the meter button semantics when it actually does something.
  if (!interactive) {
    return (
      <div data-cell className={`${CELL_CLASSES}${position} ${card.className || ""}`.trim()}>
        {body}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={card.onSelect}
      aria-label={card.actionLabel}
      data-cell
      className={`${CELL_CLASSES}${position} hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${card.className || ""}`.trim()}
    >
      {body}
    </button>
  );
};

const BentoGrid = ({ cards = [], columns = 3, className = "" }) => (
  <div
    className={[
      "grid border-t border-border bg-surface",
      COLUMN_CLASSES[columns] || COLUMN_CLASSES[3],
      className,
    ]
      .filter(Boolean)
      .join(" ")}
  >
    {cards.map((card, index) => (
      <BentoCell
        key={card.id || index}
        card={card}
        index={index}
        columns={columns}
      />
    ))}
  </div>
);

export { BentoGrid, BentoCell };
export default BentoGrid;
