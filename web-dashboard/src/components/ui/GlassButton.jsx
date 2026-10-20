import React from "react";
import { devWarn } from "../../utils/devWarn";

/**
 * GlassButton — the application's only button.
 *
 * The name is historical (the brief forbids renaming exports).
 *
 * Verdana Health button spec (the app register):
 * - Primary: navy #0F172A fill, white text, #020617 hover fill.
 * - Secondary: white fill, navy text, 1px #E2E8F0 border, slate/5 hover fill.
 *   The reference puts this beside the primary action, so it keeps the card
 *   surface rather than being transparent: on a pale canvas a transparent
 *   button reads as a link.
 * - Ghost: transparent, slate #475569 text, #F1F5F9 hover fill.
 * - Danger: red #DC2626 fill, white text, with no hover step (see `danger`).
 *
 * The landing register's two CTA ranks (`warm`, `warmOutline`) belong to this
 * same map rather than to a landing-only button. `DESIGN.md` keeps the `Glass*`
 * names, and a second component would duplicate the focus ring and the 44px
 * floor that `a11y.test.jsx` asserts on this one. The keys are declared here and
 * are never passed from an app page.
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
  // `danger` carries no hover step on purpose. `--danger-hover` (index.css:58)
  // is byte-identical to `--danger` (:57), so the danger hover utility (the
  // `bg-danger-hover` fill) changed nothing, and `DESIGN.md` declares no second
  // red. Inventing a darker hex
  // here would put a raw colour in a component, which is the one thing the
  // token layer exists to prevent. The missing token is recorded for the owner
  // as backlog 999.3 instead.
  danger: "bg-danger text-white border border-transparent",
  // Landing register. `warm` fills on `warm-accent-deep` (the app's navy
  // primary, #0F172A), which keeps white text at 17.85:1 and puts the landing
  // CTAs on the same register as every app button. Its `hover:opacity-90` is
  // the historical hover and stays: it is instant state feedback rather than a
  // transition (`transition-colors` does not cover opacity), so it sits outside
  // MOTION 1's transition list, and the landing set declares no hover-fill
  // token to put in its place.
  warm: "bg-warm-accent-deep text-white hover:opacity-90 border border-transparent",
  warmOutline:
    "border border-warm-line bg-warm-card text-warm-ink hover:bg-warm-raised",
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
  const variantClasses = VARIANTS[variant];

  // The lookup silently substitutes `filled` for a key it does not know, which
  // is how eight landing CTAs spent months rendering the app-register button.
  // Production keeps the benign substitution; development names the received
  // value and the declared set so the mistake surfaces where it was made.
  if (!variantClasses) {
    devWarn(
      "GlassButton",
      `unknown variant "${variant}"; declared variants are ${Object.keys(
        VARIANTS
      ).join(", ")}. Rendering the declared "filled" fallback.`
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-control font-semibold",
        // Press feedback is colour and border only. A translate is not in
        // MOTION 1's permitted list (DESIGN.md:283-297).
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        "disabled:opacity-45 disabled:pointer-events-none",
        variantClasses || VARIANTS.filled,
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

export { GlassButton, VARIANTS as BUTTON_VARIANTS };
export default GlassButton;
