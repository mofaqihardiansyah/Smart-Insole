import React from "react";

/**
 * GlassCard — the application's surface primitive.
 *
 * The name is historical: the design brief forbids renaming exports and every
 * page imports these by name. There is no glass here.
 *
 * The treatment is one rule everywhere: white fill, a 16px corner, a hairline
 * edge, and the shallowest lift in the shadow scale. That is how the reference
 * console separates a panel from the canvas, and it is why every card on a page
 * reads at the same elevation instead of each one inventing its own.
 *
 * `flush` removes the default padding for panels that own a full bleed table or
 * chart and need the content to reach the edge.
 */
const GlassCard = ({
  children,
  className = "",
  as: Tag = "div",
  flush = false,
  elevated = false,
  ...props
}) => (
  <Tag
    className={[
      "rounded-card border border-border bg-surface",
      elevated ? "shadow-md" : "shadow-panel",
      flush ? "" : "p-6",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
    {...props}
  >
    {children}
  </Tag>
);

GlassCard.displayName = "GlassCard";

/**
 * PanelHeader — the standard header for a panel.
 *
 * It separates the STRUCTURAL layer from the DATA layer: the header names what
 * the panel is and what it measures, everything below it is numbers. The subtitle is not decoration; on a data panel "peak pressure per second" is the
 * unit of the thing being shown, and without it the chart is unreadable.
 *
 * `index` is the dashboard's station number ("01", "02", ...), rendered as a
 * tabular numeral before the title. It is the one decorative touch the system
 * allows itself, and it earns its place by being navigational: it gives every
 * panel an unambiguous name that carries into copy, tests and conversation
 * ("panel 03 has no data"), the way numbered stations do on an instrument.
 */
const PanelHeader = ({
  label,
  title,
  subtitle,
  icon,
  index,
  action,
  divided = false,
  padded = true,
  className = "",
  as: Tag = "h2",
}) => (
  <div
    className={[
      "flex flex-wrap items-start justify-between gap-3",
      // One header-to-content rhythm for every panel: making the gap depend on
      // whether a header happens to carry an action put side-by-side panels
      // (the trend chart and the load donut) 4px out of step.
      padded ? "px-6 pb-3 pt-5" : "",
      padded && divided ? "border-b border-border pb-4" : "",
      !padded && divided ? "border-b border-border pb-3" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
  >
    <div className="min-w-0">
      <Tag className="flex items-center gap-2 font-heading text-card-title text-fg">
        {icon && (
          <span className="shrink-0 text-muted" aria-hidden="true">
            {icon}
          </span>
        )}
        {index && (
          /* Hidden from the accessibility name so the heading keeps
             announcing exactly its title: the number is wayfinding for
             sighted users, not copy a screen reader must hear. */
          <span
            aria-hidden="true"
            className="tabular-data shrink-0 text-label text-muted"
          >
            {index}
          </span>
        )}
        <span className="truncate">{label || title}</span>
      </Tag>
      {subtitle && (
        <p className="mt-1 max-w-prose text-body-sm text-muted">{subtitle}</p>
      )}
    </div>

    {action && <div className="shrink-0">{action}</div>}
  </div>
);

PanelHeader.displayName = "PanelHeader";

/**
 * GlassIcon — a fixed, non shrinking glyph slot, so labels line up down a
 * column regardless of which icon each row uses.
 */
const GlassIcon = ({ children, className = "" }) => (
  <span
    className={`inline-flex shrink-0 items-center justify-center ${className}`.trim()}
    aria-hidden="true"
  >
    {children}
  </span>
);

GlassIcon.displayName = "GlassIcon";

export { GlassCard, GlassIcon, PanelHeader };
export default GlassCard;
