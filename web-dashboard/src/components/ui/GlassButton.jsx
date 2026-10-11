import React from "react";

/**
 * GlassButton — the application's only button.
 *
 * The name is historical (the brief forbids renaming exports). The Romer
 * language is tight rectangles and uppercase tracked labels, not pills.
 *
 * Contrast note, and the reason the fill is `primary-btn` rather than the
 * brighter `primary`: the reference export puts near white text on #5E6BFF,
 * which measures 3.70:1 and fails AA. `primary-btn` is that same indigo
 * darkened, #3D4AE0 in dark and #1D4ED8 in light, measuring 5.71:1 and 6.70:1
 * with an identical label colour. Same look, one token.
 *
 * Every size keeps a 44px minimum on touch and drops to a denser desktop
 * register only for `sm`, so a thumb always has something to hit while a table
 * row does not grow a 44px button.
 */
const VARIANTS = {
  filled:
    "bg-primary-btn text-primary-on hover:opacity-90 border border-transparent",
  outline: "border border-border-control bg-surface text-fg hover:bg-surface-2",
  ghost: "text-primary hover:bg-primary/10 border border-transparent",
  quiet: "border border-border-strong bg-surface-2 text-fg hover:bg-surface-3",
  danger: "bg-danger/15 text-danger border border-danger/50 hover:bg-danger/25",
  // Landing page variant fills (warm palette, see DESIGN.md).
  warm: "bg-warm-accent-deep text-white hover:opacity-90 border border-transparent",
  warmOutline:
    "border border-warm-line bg-warm-card text-warm-ink hover:bg-warm-raised",
};

const SIZES = {
  sm: "min-h-[44px] lg:min-h-[34px] px-3 text-body-sm",
  md: "min-h-[44px] px-4 text-body-sm",
  lg: "min-h-[44px] px-5 py-2.5 text-body",
};

// forwardRef so dialogs can move focus into themselves on open and restore it
// on close.
const GlassButton = React.forwardRef(function GlassButton(
  {
    children,
    variant = "filled",
    size = "md",
    type = "button",
    className = "",
    disabled = false,
    label = false,
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-control font-medium",
        "transition-colors duration-150 active:translate-y-[1px]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        "disabled:opacity-45 disabled:pointer-events-none",
        VARIANTS[variant] || VARIANTS.filled,
        SIZES[size] || SIZES.md,
        label ? "uppercase text-label" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </button>
  );
});

GlassButton.displayName = "GlassButton";

export { GlassButton };
export default GlassButton;
