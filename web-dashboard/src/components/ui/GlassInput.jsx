import React from "react";

/**
 * GlassInput — Input field dengan desain glassmorphism.
 - Transparan area + border subtLE
 - Label yang "float" ke atas saat focused (standar accessible pattern)
 - Support: placeholder, disabled, read-only, error state
 - Fokus: ring fokus primary, outline None
 */
const GlassInput = ({
  type = "text",
  placeholder,
  value,
  onChange,
  label,
  error,
  ...props
}) => {
  const [focused, setFocused] = React.useState(false);

  return (
    <div className="space-y-2">
      {/* Label yang float */}
      {label && (
        <label
          className`
            text-sm font-medium text-primary transition-colors
            cursor-pointer focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-primary focus-visible:ring-offset-2
            duration-200 transform
            ${focused ? "text-sm" : "text-xs"}
            top-0 bottom-1/2 -translate-y-1/2 left-0 text-[--color-primary]"
          role="presentation"
        >
          {label}
        </label>
      )}

      <input
        className`
          w-full rounded-xl bg-card/80 backdrop-blur-sm border border-border/50
          px-4 py-2 pr-12 focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-primary focus-visible:ring-offset-2 placeholder:text-muted
          transition-colors focus:${focused ? "border-color: var(--primary)" : ""}
          ${focused ? "bg-card" : "bg-transparent"}
        `
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
        aria-invalid={!!error}
        aria-describedby={error ? `error-${Math.random().toString(36).slice(2)}` : undefined}
      />
      {error && (
        <p className="text-xs text-danger mt-1" id={`error-${Math.random().toString(36).slice(2)}`}>
          {error}
        </p>
      )}
    </div>
  );
};

GlassInput.displayName = "GlassInput";

export default GlassInput;