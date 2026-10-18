import React from "react";
import { Info, CheckCircle2, AlertTriangle, AlertOctagon, X } from "lucide-react";
import { roleFor } from "./feedbackState";
import { t } from "../../utils/i18n";
import { devWarn } from "../../utils/devWarn";

/**
 * AlertBanner: the inline feedback row, and the one tone vocabulary.
 *
 * This replaces the `alert()` calls that used to stand in for feedback. A modal
 * alert interrupts, cannot be read in context by a screen reader, and hides the
 * page it is about; an inline banner says the same thing in place and stays put
 * until it is resolved.
 *
 * It owns the tone to visual map (icon, border and tint pair, icon ink) and the
 * tone to role decision, which is delegated to `feedbackState.js` so that
 * nothing in the app keeps a second copy of the matrix (D-02).
 *
 * The contract it enforces (D-03):
 *   - a named cause, in `title`;
 *   - a next action, satisfied either by an `action` element or by a
 *     `nextAction` string;
 *   - exactly one action, with the dismiss control separate from it.
 *
 * A banner that cannot satisfy the next-action half still renders. On a clinical
 * console a blank region is strictly worse than the defect it would be fixing,
 * so development hears about the missing half through `devWarn` and production
 * keeps the declared, benign shape.
 *
 * The body ink is `fg-2`, never `muted`: the surface behind a banner is a tone
 * tint, and `muted` measures 3.75 to 4.11:1 on those, below AA (M-01c).
 *
 * It is an inline row, not a floating surface: a 1px tone border and a 15% tint
 * on the card, and no shadow. It declares no landing-register variant, so a
 * future `.landing-scope` call site renders through the same measured pairs.
 */
const TONES = {
  info: {
    Icon: Info,
    tone: "border-border-control bg-surface-2",
    icon: "text-primary",
  },
  success: {
    Icon: CheckCircle2,
    tone: "border-safe/50 bg-safe/15",
    icon: "text-safe-ink",
  },
  warning: {
    Icon: AlertTriangle,
    tone: "border-warning/50 bg-warning/15",
    icon: "text-warning-ink",
  },
  danger: {
    Icon: AlertOctagon,
    tone: "border-danger/50 bg-danger/15",
    icon: "text-danger-ink",
  },
};

const AlertBanner = ({
  tone = "info",
  title,
  children,
  action,
  nextAction,
  onDismiss,
  dismissLabel,
  className = "",
}) => {
  const config = TONES[tone] || TONES.info;
  const { Icon } = config;

  // `danger` is the tone that interrupts a screen reader, and the one where a
  // reader with nothing to do is most costly. If it names a cause and offers no
  // step at all, development hears about it; production renders anyway.
  if (tone === "danger" && !action && !nextAction && !children) {
    devWarn(
      "AlertBanner",
      `a danger banner carries a cause but no next action (${title ?? "untitled"}): pass an action element or a nextAction string`
    );
  }

  return (
    <div
      role={roleFor(tone)}
      className={`flex items-start gap-3 rounded-card border p-4 ${config.tone} ${className}`.trim()}
    >
      <Icon
        className={`mt-0.5 h-5 w-5 shrink-0 ${config.icon}`}
        aria-hidden="true"
      />

      <div className="min-w-0 flex-1">
        {title && <p className="font-medium text-fg">{title}</p>}
        {children && (
          <div className="mt-1 text-body-sm text-fg-2">{children}</div>
        )}
        {nextAction && (
          <p className="mt-1 text-body-sm text-fg-2">
            {/*
              The label is what tells a screen reader that this paragraph is the
              step to take rather than a second cause. It is screen-reader only:
              the visible copy is the step itself.
            */}
            <span className="sr-only">{`${t("common.nextStep")}: `}</span>
            {nextAction}
          </p>
        )}
        {action && <div className="mt-3">{action}</div>}
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className="-m-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

export { AlertBanner, TONES as BANNER_TONES };
export default AlertBanner;
