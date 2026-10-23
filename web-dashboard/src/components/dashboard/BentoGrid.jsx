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

/**
 * The Cadra card vocabulary. A tint is a CARD's data (which metric this is),
 * never its position, so it lives on the card and reads as a whole literal.
 * On light tints the ink stays the normal `fg` token (measured 12.8:1+ on all
 * three tints in index.css); on the inverted card the text ramp swaps to the
 * `inverted-*` tokens, whose pairs are measured against #141414.
 */
const TINT_CLASSES = {
  cream: "bg-tint-cream",
  mint: "bg-tint-mint",
  blue: "bg-tint-blue",
};

const INVERTED = {
  cell: "bg-inverted border-inverted",
  title: "text-inverted-muted",
  value: "text-inverted-fg",
  unit: "text-inverted-muted",
  caption: "text-inverted-muted",
  iconTile: "bg-white/10 text-inverted-fg",
  meterTrack: "bg-white/15",
  meterFill: "bg-tint-cream",
};

const LIGHT_METER_FILL = "bg-fg";

const CELL_CLASSES =
  "relative flex flex-col border-b border-border px-5 py-5 text-left";

/** The card-look variant: separated rounded fills instead of a ruled strip. */
const CARD_CELL_CLASSES =
  "relative flex flex-col rounded-card border border-border shadow-panel px-5 py-5 text-left";

const BentoCell = ({ card, index = 0, columns = 3, cardMode = false }) => {
  const interactive = typeof card.onSelect === "function";
  const dark = Boolean(card.inverted);
  const ramp = dark
    ? INVERTED
    : {
        title: "text-muted",
        value: "text-fg",
        unit: "text-muted",
        caption: "text-muted",
      };

  const fillClass = dark
    ? INVERTED.cell
    : card.tint
      ? (TINT_CLASSES[card.tint] || "")
      : cardMode
        ? "bg-surface"
        : "";

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        {card.icon && (
          <span
            aria-hidden="true"
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-tile ${
              dark ? INVERTED.iconTile : ICON_TONES[card.iconTone] || ICON_TONES.neutral
            }`}
          >
            {card.icon}
          </span>
        )}
        {card.badge}
      </div>

      <p className={`mt-4 text-label uppercase ${ramp.title}`}>{card.title}</p>

      <p className={`tabular-data mt-1.5 font-heading text-stat ${ramp.value}`}>
        {card.value ?? "--"}
        {card.unit && (
          <span className={`ml-1.5 align-middle text-body-sm font-medium ${ramp.unit}`}>
            {card.unit}
          </span>
        )}
      </p>

      {card.spark && <div className="mt-2 max-w-full">{card.spark}</div>}

      {card.meter && card.meter.max > 0 && Number.isFinite(Number(card.meter.value)) && (
        <div
          className={`mt-3 h-1.5 w-full rounded-full ${
            dark ? INVERTED.meterTrack : "bg-surface-3"
          }`}
        >
          <div
            data-meter-fill
            aria-hidden="true"
            className={`h-full rounded-full ${
              dark ? INVERTED.meterFill : LIGHT_METER_FILL
            }`}
            style={{
              width: `${Math.min(
                100,
                Math.max(0, (Number(card.meter.value) / card.meter.max) * 100)
              )}%`,
            }}
          />
        </div>
      )}

      {card.caption && (
        <p className={`mt-2 text-caption italic ${ramp.caption}`}>{card.caption}</p>
      )}
      {card.footer}
    </>
  );

  // The band, not a card: transparent fill, the vertical rule that slot owns
  // for this band's column count. Card mode keeps its own rounded fill
  // instead; the gap between the grid's tracks is the separator there.
  const separator = cardMode ? null : (SEPARATORS[columns] || {})[index];
  const position = separator ? ` ${separator}` : "";

  const base = cardMode ? CARD_CELL_CLASSES : CELL_CLASSES;
  const cellClass = [base + position, fillClass, card.className]
    .filter(Boolean)
    .join(" ");

  // Only give the meter button semantics when it actually does something.
  if (!interactive) {
    return (
      <div data-cell className={cellClass}>
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
      className={`${cellClass} hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset`.trim()}
    >
      {body}
    </button>
  );
};

const BentoGrid = ({ cards = [], columns = 3, className = "" }) => {
  // A band that carries any Cadra card (tint or inverted tile) reads as
  // separated cards; an untinted band keeps the original ruled strip.
  const cardMode = cards.some((card) => card.tint || card.inverted);

  return (
    <div
      className={[
        cardMode ? "grid gap-3" : "grid border-t border-border bg-surface",
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
          cardMode={cardMode}
        />
      ))}
    </div>
  );
};

export { BentoGrid, BentoCell };
export default BentoGrid;
