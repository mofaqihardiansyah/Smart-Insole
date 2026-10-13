import React from "react";

/**
 * GlassInput — text and number field.
 *
 * The name is historical (the brief forbids renaming exports).
 *
 * Verdana Health input spec:
 * - Default: 1px #E2E8F0 border, #FFFFFF fill, no shadow.
 * - Hover: 1px #0F172A border.
 * - Focus: 2px #0F172A border, 3px ring #0F172A18.
 * - Error: 2px #EF4444 border, 3px ring #EF444418.
 * - Disabled: 1px #E2E8F0 border, #F1F5F9 fill.
 * - Height 42px, padding 10px 14px, radius 8px.
 * - Label above: DM Sans 14px/500, #0F172A, bottom margin 6px.
 * - Helper text: DM Sans 12px/400, #475569, top margin 4px.
 * - Error text: DM Sans 12px/400, #EF4444, top margin 4px.
 *
 * The field uses tabular figures, because most fields here hold a kPa or a
 * second count.
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
            "tabular-data w-full min-h-[42px] rounded-control border bg-surface px-3.5 py-2.5",
            "text-data text-fg placeholder:text-muted/70",
            "transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
            error
              ? "border-danger"
              : "border-border hover:border-primary focus:border-primary",
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
