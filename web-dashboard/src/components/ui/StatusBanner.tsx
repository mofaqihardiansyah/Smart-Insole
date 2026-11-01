import React from "react";
import type { ReactNode } from "react";
import { AlertBanner } from "./AlertBanner";
import type { AlertBannerProps } from "./AlertBanner";

/**
 * StatusBanner is now a delegate to `AlertBanner`.
 *
 * It keeps its name, its props and both of its exports because thirteen call
 * sites in eight files import it and the brief forbids renaming exports.
 * Everything that used to live here has one owner instead: the tone vocabulary
 * and the visual pairs are declared in `AlertBanner.jsx`, and the live-region
 * role is decided once in `feedbackState.js`. This file therefore holds no
 * vocabulary of its own and re-decides nothing, so it cannot drift away from
 * the primitive it renders. `nextAction` is forwarded too, so a caller can
 * state the step after the cause with the same prop name the primitive and the
 * pages agree on.
 */
/** Same prop surface as the primitive it delegates to. */
interface StatusBannerProps {
  tone?: AlertBannerProps["tone"];
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  nextAction?: ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
  className?: string;
}

const StatusBanner = ({
  tone = "info",
  title,
  children,
  action,
  nextAction,
  onDismiss,
  dismissLabel,
  className = "",
}: StatusBannerProps) => {
  return (
    <AlertBanner
      tone={tone}
      title={title}
      action={action}
      nextAction={nextAction}
      onDismiss={onDismiss}
      dismissLabel={dismissLabel}
      className={className}
    >
      {children}
    </AlertBanner>
  );
};

export { StatusBanner };
export default StatusBanner;
