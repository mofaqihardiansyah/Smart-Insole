import React from "react";
import { ChevronRight } from "lucide-react";
import { t } from "../../utils/i18n";

/**
 * AuthSteps: the two stops of the password reset journey.
 *
 * The list is not a progress bar. A bar would promise that time is the measure;
 * this flow is measured in what the person has proved so far. The current stop
 * carries `aria-current="step"`, so the same fact reaches a screen reader
 * without a live region that would announce every transition twice.
 *
 * The wait for the emailed link belongs to the Email stop: the reader has
 * supplied an address, and has not yet proved anything else.
 */
const STEPS = [
  { key: "email", label: "auth.forgot.step.email" },
  { key: "password", label: "auth.forgot.step.password" },
];

const AuthSteps = ({ language, current }) => {
  const currentIndex = Math.max(
    0,
    STEPS.findIndex((step) => step.key === current)
  );

  return (
    <ol className="mb-5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-caption text-muted">
      {STEPS.map((step, index) => {
        const active = index === currentIndex;
        const done = index < currentIndex;

        return (
          <li
            key={step.key}
            aria-current={active ? "step" : undefined}
            className="flex items-center gap-1.5"
          >
            <span
              aria-hidden="true"
              className={[
                "flex h-6 w-6 items-center justify-center rounded-full border text-caption font-semibold",
                active
                  ? "border-primary bg-primary text-primary-on"
                  : done
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border-strong bg-surface-2 text-muted",
              ].join(" ")}
            >
              {index + 1}
            </span>
            <span
              className={
                active ? "font-semibold text-fg" : done ? "text-fg-2" : ""
              }
            >
              {t(step.label, language)}
            </span>
            {index < STEPS.length - 1 && (
              <ChevronRight
                className="h-3.5 w-3.5 shrink-0 text-muted"
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
};

export default AuthSteps;
