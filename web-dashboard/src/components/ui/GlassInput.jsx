import React from "react";

/**
 * GlassInput — text and number field.
 *
 * The name is historical (the brief forbids renaming exports).
 *
 * Decisions, each deliberate:
 * - The label sits ABOVE the field and is a real <label htmlFor>, in the
 *   uppercase micro style the design uses for structure. No placeholder-as-label.
 * - The error renders BELOW as text, wired through `aria-describedby` and
 *   flagged with `aria-invalid`. A red border is not an error message.
 * - The border uses `border-control`, which is the one edge token measured to
 *   clear 3:1 against the surface behind it (3.79:1 dark, 3.47:1 light). The
 *   faint hairline token is deliberately NOT used here: a 1.2:1 edge is
 *   invisible to a low-vision user looking for the field.
 * - The field uses tabular figures, because most fields here hold a kPa or a
 *   second count.
 */
const GlassInput = ({
  type = "text",
  label,
  error,
  hint,
  id,
  className = "",
  suffix,
  ...props
}) => {
  const inputId = id || React.useId();
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-label uppercase text-muted"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <input
          id={inputId}
          type={type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={[
            "tabular-data w-full min-h-[44px] rounded-control border bg-surface-3 px-3 py-2",
            "text-data text-fg placeholder:text-muted/70",
            "transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
            error
              ? "border-danger"
              : "border-border-control focus:border-primary",
            suffix ? "pr-12" : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-body-sm text-muted">
            {suffix}
          </span>
        )}
      </div>

      {hint && !error && (
        <p id={hintId} className="text-body-sm text-muted">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} className="text-body-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
};

GlassInput.displayName = "GlassInput";

export { GlassInput };
export default GlassInput;
