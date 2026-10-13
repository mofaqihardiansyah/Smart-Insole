import React from "react";

/**
 * GlassButton — the application's only button.
 *
 * The name is historical (the brief forbids renaming exports).
 *
 * Verdana Health button spec:
 * - Primary: navy #0F172A fill, white text, #020617 hover fill.
 * - Secondary: transparent, navy text, 1px navy border, navy/5 hover fill.
 * - Ghost: transparent, slate #475569 text, #F1F5F9 hover fill.
 * - Destructive: red #EF4444 fill, white text, #DC2626 hover fill.
 *
 * Every size keeps a 44px minimum on touch.
 */
const VARIANTS = {
  filled:
    "bg-primary-btn text-primary-on hover:bg-primary-hover border border-transparent",
  outline:
    "border border-primary-btn bg-transparent text-primary-btn hover:bg-primary-btn/5",
  ghost: "text-fg-2 hover:bg-surface-2 border border-transparent",
  quiet: "border border-border-strong bg-surface-2 text-fg hover:bg-surface-3",
  danger: "bg-danger text-white hover:bg-danger-hover border border-transparent",
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
