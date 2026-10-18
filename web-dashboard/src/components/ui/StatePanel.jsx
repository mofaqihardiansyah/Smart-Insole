import React from "react";
import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";
import { roleFor } from "./feedbackState";
import { devWarn } from "../../utils/devWarn";

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
 * Nothing inside the loading register animates. A pulsing skeleton draws the eye
 * continuously on a console a clinician watches for hours, and it competes with
 * the risk announcement for attention; the polite status announcement is the
 * channel that tells a reader data is coming. The bars keep their height, their
 * declared radius and their computed width, so the space they reserve is
 * identical and the layout still does not jump when the reading lands.
 *
 * The states announce themselves rather than merely being drawn, and the role is
 * not decided here: it comes from `roleFor` in `feedbackState.js`, which is the
 * one owner of that decision for both this register and the banner.
 *   loading -> role="status", aria-live="polite"
 *   error   -> role="alert"
 *   empty   -> ordinary content with a heading, so it reads in order
 *
 * A feedback surface owes the reader two things: what happened, and what to do
 * next (D-03). The second half is satisfied by an interactive `action` slot or
 * by a `nextAction` string, and a surface that carries neither warns in
 * development while still rendering its cause — the production behaviour is the
 * benign declared default rather than a blank view.
 */
const StatePanel = ({
  variant = "empty",
  title,
  description,
  action,
  nextAction,
  nextActionLabel,
  rows = 3,
  className = "",
}) => {
  if (variant === "loading") {
    return (
      <div
        role={roleFor("loading")}
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
              className="h-4 rounded-control bg-surface-3"
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
      }
    : {
        Icon: Inbox,
        tone: "border-border bg-surface shadow-panel",
        iconTone: "text-muted",
      };

  const { Icon } = config;

  // The two halves of the contract. `loading` is exempt from the second by
  // nature: there is nothing to do about a view that is still arriving.
  const hasNextAction = Boolean(action) || Boolean(nextAction);
  if (!hasNextAction && (isError || variant === "empty")) {
    devWarn(
      "StatePanel",
      `the "${variant}" register names a cause with no next action; pass an \`action\` slot or a \`nextAction\` string`
    );
  }

  return (
    <div
      role={roleFor(variant)}
      className={`rounded-card border p-6 text-center ${config.tone} ${className}`.trim()}
    >
      <Icon className={`mx-auto h-6 w-6 ${config.iconTone}`} aria-hidden="true" />
      {title && <p className="mt-3 font-medium text-fg">{title}</p>}
      {description && (
        <p className="mx-auto mt-1.5 max-w-prose text-body-sm text-fg-2">
          {description}
        </p>
      )}
      {nextAction && (
        <p className="mx-auto mt-2 max-w-prose text-body-sm text-fg-2">
          {/* The label is what tells a reader this is the step rather than a
              second cause, so it is announced and not merely written. */}
          {nextActionLabel && (
            <span className="sr-only">{`${nextActionLabel}: `}</span>
          )}
          {nextAction}
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
