import React from "react";

/**
 * BentoGrid — the metric tile grid, in the Romer instrument style.
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

const CELL_CLASSES =
  "flex flex-col justify-between rounded-card border border-border-strong bg-surface inner-glow p-4 text-left transition-colors duration-150";

const BentoCell = ({ card }) => {
  const interactive = typeof card.onSelect === "function";

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-label uppercase text-muted">{card.title}</p>
        {card.icon && (
          <span className="shrink-0 text-muted" aria-hidden="true">
            {card.icon}
          </span>
        )}
      </div>

      <div className="mt-3">
        <p className="tabular-data font-heading text-h3 font-semibold text-fg">
          {card.value ?? "--"}
          {card.unit && (
            <span className="ml-1.5 text-body-sm font-medium text-muted">
              {card.unit}
            </span>
          )}
        </p>
        {card.label && (
          <p className="mt-1 text-body-sm text-muted">{card.label}</p>
        )}
        {card.footer}
      </div>
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
      "grid gap-3",
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
