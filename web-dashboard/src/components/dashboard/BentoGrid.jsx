import React from "react";

/**
 * BentoGrid — the metric tile row.
 *
 * Each tile follows the reference console's stat card: an icon tile and a small
 * state chip on the first line, the metric name, the value, and an italic
 * caption that says what the value is measured against. The caption is not
 * optional garnish: "danger limit 70 kPa" is what turns a bare number into a
 * reading, and without it the card is a claim with no scale.
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
 * A tile is only focusable and hoverable when it has something to do. A tile
 * that looks clickable and does nothing is a dead control.
 */

/** Whole literals on purpose: Tailwind must be able to see each class. */
const COLUMN_CLASSES = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

const ICON_TONES = {
  neutral: "bg-surface-2 text-fg-2",
  accent: "bg-secondary/15 text-secondary-ink",
  success: "bg-safe/15 text-safe-ink",
  warning: "bg-warning/15 text-warning-ink",
  danger: "bg-danger/15 text-danger-ink",
};

const CELL_CLASSES =
  "flex flex-col rounded-card border border-border bg-surface p-5 text-left shadow-panel transition-colors duration-150";

const BentoCell = ({ card }) => {
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

      <p className="mt-4 text-body-base text-fg-2">{card.title}</p>

      <p className="tabular-data mt-1 font-heading text-stat text-fg">
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

  // Only give the cell button semantics when it actually does something.
  if (!interactive) {
    return (
      <div className={`${CELL_CLASSES} ${card.className || ""}`.trim()}>
        {body}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={card.onSelect}
      aria-label={card.actionLabel}
      className={`${CELL_CLASSES} hover:border-border-control hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${card.className || ""}`.trim()}
    >
      {body}
    </button>
  );
};

const BentoGrid = ({ cards = [], columns = 3, className = "" }) => (
  <div
    className={[
      "grid gap-5 lg:gap-6",
      COLUMN_CLASSES[columns] || COLUMN_CLASSES[3],
      className,
    ]
      .filter(Boolean)
      .join(" ")}
  >
    {cards.map((card, index) => (
      <BentoCell key={card.id || index} card={card} />
    ))}
  </div>
);

export { BentoGrid, BentoCell };
export default BentoGrid;
