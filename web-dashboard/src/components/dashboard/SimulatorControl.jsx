import React from "react";
import { FlaskConical } from "lucide-react";
import { PanelHeader } from "../ui/GlassCard";

/**
 * SimulatorControl — the scenario picker.
 *
 * A native radio group rather than styled buttons: a radio group is what this
 * is, and the platform already handles arrow-key navigation, grouping and screen
 * reader announcement. Each option is wrapped in a 44px label so the whole row
 * is tappable.
 *
 * The panel states that the data is simulated in the body copy, not only in a
 * badge, so nobody mistakes a demo scenario for a patient reading.
 */
const SimulatorControl = ({
  value,
  onChange,
  options = [],
  title,
  body,
  scenarioLabel,
  className = "",
}) => (
  <div
    className={`rounded-card border border-border-strong bg-surface inner-glow ${className}`.trim()}
  >
    <PanelHeader label={title} icon={<FlaskConical className="h-4 w-4" />} as="h3" />

    <div className="p-4">
      {body && <p className="text-body-sm text-muted">{body}</p>}

      <fieldset className="mt-3">
        <legend className="text-label uppercase text-muted">{scenarioLabel}</legend>

        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {options.map((option) => {
            const active = option.value === value;
            return (
              <label
                key={option.value}
                className={[
                  "flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-control border px-3 py-2 text-body-sm",
                  "transition-colors duration-150",
                  "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-surface",
                  active
                    ? "border-secondary/60 bg-secondary/12 font-medium text-secondary"
                    : "border-border-control bg-surface-3 text-fg hover:bg-surface-2",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="simulation-scenario"
                  value={option.value}
                  checked={active}
                  onChange={() => onChange?.(option.value)}
                  className="h-4 w-4 accent-[rgb(var(--primary-btn))]"
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  </div>
);

export { SimulatorControl };
export default SimulatorControl;
