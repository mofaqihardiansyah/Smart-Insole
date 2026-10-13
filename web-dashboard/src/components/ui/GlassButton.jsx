import React from "react";

/**
 * GlassButton — the application's only button.
 *
 * The name is historical (the brief forbids renaming exports).
 *
 * Verdana Health button spec:
 * - Primary: navy #0F172A fill, white text, #020617 hover fill.
 * - Secondary: white fill, navy text, 1px #E2E8F0 border, slate/5 hover fill.
 *   The reference puts this beside the primary action, so it keeps the card
 *   surface rather than being transparent: on a pale canvas a transparent
 *   button reads as a link.
 * - Ghost: transparent, slate #475569 text, #F1F5F9 hover fill.
 * - Danger: red #DC2626 fill, white text, #DC2626 hover fill.
 *
 * Every size keeps a 44px minimum on touch and drops to its desktop height only
 * from `lg`, where a pointer is doing the clicking.
 */
const VARIANTS = {
  filled:
    "bg-primary-btn text-primary-on hover:bg-primary-hover border border-transparent",
  outline:
    "border border-border-strong bg-surface text-fg hover:bg-surface-2",
  ghost: "text-fg-2 hover:bg-surface-2 border border-transparent",
  quiet: "border border-border-strong bg-surface-2 text-fg hover:bg-surface-3",
  danger: "bg-danger text-white hover:bg-danger-hover border border-transparent",
};

const SIZES = {
  sm: "min-h-[44px] lg:min-h-[36px] px-3 text-body-sm",
  md: "min-h-[44px] lg:min-h-[40px] px-4 text-body-sm",
  lg: "min-h-[48px] px-5 text-body-base",
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
        "inline-flex items-center justify-center gap-2 rounded-control font-semibold",
        "transition-colors duration-150 active:translate-y-[1px]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
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
