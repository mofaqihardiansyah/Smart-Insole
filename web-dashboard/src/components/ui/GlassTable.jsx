import React from "react";

/**
 * GlassTable — a real semantic table, for the desktop register.
 *
 * The name is historical (the brief forbids renaming exports).
 *
 * A <table> cannot reflow, so pages that show tabular data render this only
 * from `md` up and switch to stacked definition rows below that. The wrapper
 * exists so a wide table scrolls inside its own container rather than pushing
 * the page sideways, which is the one place a horizontal scroll container is
 * legitimate.
 *
 * `bare` drops the outer frame for tables that already sit inside a card, which
 * is how the dashboard and the history page use it: one card, one edge, rather
 * than a card drawn inside a card.
 *
 * The header uses the uppercase micro style so the column labels read as
 * structure rather than as data, and the numbers below use tabular figures so
 * columns line up.
 */
const GlassTable = ({
  children,
  className = "",
  caption,
  bare = false,
  ...props
}) => (
  <div
    className={
      bare
        ? "w-full overflow-x-auto"
        : "w-full overflow-x-auto rounded-card border border-border bg-surface shadow-panel"
    }
  >
    <table
      className={`w-full min-w-[40rem] border-collapse text-left ${className}`}
      {...props}
    >
      {caption && (
        <caption className="px-6 py-3 text-left text-body-sm text-muted">
          {caption}
        </caption>
      )}
      {children}
    </table>
  </div>
);

const GlassTableRow = ({ children, className = "", ...props }) => (
  <tr
    className={`border-b border-border-strong transition-colors last:border-b-0 hover:bg-surface-2 ${className}`}
    {...props}
  >
    {children}
  </tr>
);

const GlassTableCell = ({
  children,
  className = "",
  as: Tag = "td",
  ...props
}) => (
  <Tag
    className={[
      Tag === "th" ? "px-6 py-3.5" : "px-6 py-4",
      "align-middle",
      Tag === "th"
        ? "bg-surface-2 text-label uppercase text-muted whitespace-nowrap"
        : "tabular-data text-body-base text-fg-2",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
    {...props}
  >
    {children}
  </Tag>
);

export { GlassTable, GlassTableRow, GlassTableCell };
export default GlassTable;
