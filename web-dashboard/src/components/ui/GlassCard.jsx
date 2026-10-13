import React from "react";

/**
 * GlassCard — the application's surface primitive.
 *
 * The name is historical: the design brief forbids renaming exports and every
 * page imports these by name. There is no glass here.
 *
 * Verdana Health card spec:
 * - Default: #FFFFFF fill, 1px #E2E8F0 border, no shadow, 8px radius.
 * - Elevated: #FFFFFF fill, no border, md shadow, 8px radius.
 * - 24px padding, optional tinted header strip (#0F172A) with white text.
 *
 * `flush` removes the default padding for panels that own a full bleed table or
 * chart and need the content to reach the edge.
 * `elevated` applies the md shadow for cards that genuinely float.
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
      "rounded-card border bg-surface",
      elevated ? "border-transparent shadow-md" : "border-border",
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
 * PanelHeader — the standard header strip for a panel.
 *
 * It separates the STRUCTURAL layer from the DATA layer: the header says what
 * the panel is, in uppercase micro type, and everything below is numbers. That
 * is the reason uppercase tracked labels appear here at all, which is the rule
 * antislop R-06 asks about: it is a hierarchy device, not decoration.
 */
const PanelHeader = ({
  label,
  icon,
  action,
  className = "",
  as: Tag = "h2",
}) => (
  <div
    className={`flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 ${className}`.trim()}
  >
    <Tag className="flex items-center gap-2 text-label uppercase text-muted">
      {icon && (
        <span className="shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}
      {label}
    </Tag>
    {action}
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
