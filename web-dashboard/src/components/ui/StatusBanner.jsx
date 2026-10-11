import React from "react";
import { Info, CheckCircle2, AlertTriangle, AlertOctagon, X } from "lucide-react";

/**
 * StatusBanner — non-blocking feedback and data-source notices.
 *
 * This replaces the `alert()` calls that used to stand in for feedback. A modal
 * alert interrupts, cannot be read in context by a screen reader, and hides the
 * page it is about; an inline banner says the same thing in place and stays put
 * until it is resolved.
 *
 * Tone decides the live-region role: the danger banner is `role="alert"` so it
 * is announced immediately, everything else is `role="status"` so it waits for
 * a pause in speech.
 */
const TONES = {
  info: {
    Icon: Info,
    tone: "border-border-control bg-surface-2",
    icon: "text-primary",
  },
  success: {
    Icon: CheckCircle2,
    tone: "border-safe/50 bg-safe/12",
    icon: "text-safe",
  },
  warning: {
    Icon: AlertTriangle,
    tone: "border-warning/50 bg-warning/12",
    icon: "text-warning",
  },
  danger: {
    Icon: AlertOctagon,
    tone: "border-danger/50 bg-danger/12",
    icon: "text-danger",
  },
};

const StatusBanner = ({
  tone = "info",
  title,
  children,
  action,
  onDismiss,
  dismissLabel,
  className = "",
}) => {
  const config = TONES[tone] || TONES.info;
  const { Icon } = config;

  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-card border p-3 ${config.tone} ${className}`.trim()}
    >
      <Icon
        className={`mt-0.5 h-5 w-5 shrink-0 ${config.icon}`}
        aria-hidden="true"
      />

      <div className="min-w-0 flex-1">
        {title && <p className="font-medium text-fg">{title}</p>}
        {children && (
          <div className="mt-1 text-body-sm text-muted">{children}</div>
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

export { StatusBanner };
export default StatusBanner;
