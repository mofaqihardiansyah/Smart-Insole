import React from "react";
import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";

/**
 * StatePanel — the loading, empty and error state for a data view.
 *
 * Every data view needs all three (antislop R-27). They are centralised here so
 * no page can quietly ship two of them.
 *
 * Loading uses skeleton bars shaped like the content that is coming rather than
 * a spinner: a spinner says nothing about what to expect, while a skeleton
 * reserves the space so the layout does not jump when data lands.
 *
 * The states announce themselves rather than merely being drawn:
 *   loading -> role="status", aria-live="polite"
 *   error   -> role="alert"
 *   empty   -> ordinary content with a heading, so it reads in order
 */
const StatePanel = ({
  variant = "empty",
  title,
  description,
  action,
  rows = 3,
  className = "",
}) => {
  if (variant === "loading") {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`rounded-card border border-border bg-surface p-4 shadow-panel ${className}`.trim()}
      >
        {title && (
          <p className="mb-3 text-label uppercase text-muted">{title}</p>
        )}
        <div className="space-y-2">
          {Array.from({ length: rows }).map((_, index) => (
            <div
              key={index}
              className="h-4 animate-pulse rounded bg-surface-3"
              style={{ width: `${92 - index * 13}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  const isError = variant === "error";
  const config = isError
    ? {
        Icon: AlertTriangle,
        tone: "border-danger/50 bg-danger/15",
        iconTone: "text-danger-ink",
        role: "alert",
      }
    : {
        Icon: Inbox,
        tone: "border-border bg-surface shadow-panel",
        iconTone: "text-muted",
        role: undefined,
      };

  const { Icon } = config;

  return (
    <div
      role={config.role}
      className={`rounded-card border p-6 text-center ${config.tone} ${className}`.trim()}
    >
      <Icon className={`mx-auto h-6 w-6 ${config.iconTone}`} aria-hidden="true" />
      {title && <p className="mt-3 font-medium text-fg">{title}</p>}
      {description && (
        <p className="mx-auto mt-1.5 max-w-prose text-body-sm text-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
};

/** The shared retry affordance, so error states do not each invent one. */
export const StateRetry = ({ onRetry, label }) => (
  <button
    type="button"
    onClick={onRetry}
    className="inline-flex min-h-[44px] items-center gap-2 rounded-control border border-border-control bg-surface px-4 text-body-sm font-medium text-fg transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
  >
    <RefreshCw className="h-4 w-4" aria-hidden="true" />
    {label}
  </button>
);

export { StatePanel };
export default StatePanel;
