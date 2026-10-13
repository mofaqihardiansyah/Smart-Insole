import React from "react";
import { GlassCard, GlassIcon, PanelHeader } from "./GlassCard";
import { GlassInput } from "./GlassInput";
import { GlassButton } from "./GlassButton";

/**
 * GlassForm — form primitives.
 *
 * The name is historical (the brief forbids renaming exports).
 *
 * Layout contract, applied consistently so forms stay predictable:
 * label above the field, then the field, then hint, then error text below.
 */

const GlassFormGroup = ({ children, className = "" }) => (
  <div className={`space-y-1.5 ${className}`.trim()}>{children}</div>
);

const GlassLabel = ({ children, htmlFor, className = "" }) => (
  <label
    htmlFor={htmlFor}
    className={`block text-body-sm font-medium text-fg ${className}`.trim()}
  >
    {children}
  </label>
);

/**
 * GlassSelect — native select, so the platform's own picker and keyboard
 * behaviour apply on mobile.
 */
const GlassSelect = ({ children, className = "", id, ...props }) => {
  const selectId = id || React.useId();
  return (
    <select
      id={selectId}
      className={[
        "w-full min-h-[44px] rounded-control border border-border-control",
        "bg-surface px-3 py-2 text-data text-fg",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </select>
  );
};

/**
 * GlassSwitch — a real toggle.
 *
 * The 44x44 hit area is the button, not the visible track: the thumb is small
 * for visual reasons, but a thumb needs something the size of a thumb.
 *
 * The track is a pill, which is the one documented exception to the tight
 * radius scale: a switch is the one control whose shape convention carries
 * meaning, and a 3px radius toggle would read as a checkbox.
 *
 * State is carried by `aria-checked` and by the thumb position, not by colour
 * alone. Both track colours clear 3:1 against the panel behind them.
 */
const GlassSwitch = ({
  checked = false,
  onCheckedChange,
  label,
  id,
  className = "",
  disabled = false,
}) => (
  <button
    type="button"
    id={id}
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onCheckedChange?.(!checked)}
    className={[
      "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
      disabled ? "opacity-45 pointer-events-none" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
  >
    <span
      aria-hidden="true"
      className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors duration-150 ${
        checked
          ? "border-transparent bg-primary-btn"
          : "border-border-control bg-surface-3"
      }`}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-4 w-4 transform rounded-full transition-transform duration-150 ${
          checked
            ? "translate-x-[1.4rem] bg-primary-on"
            : "translate-x-1 bg-muted"
        }`}
      />
    </span>
  </button>
);

export {
  GlassCard,
  GlassIcon,
  PanelHeader,
  GlassFormGroup,
  GlassLabel,
  GlassInput,
  GlassSelect,
  GlassSwitch,
  GlassButton,
};
