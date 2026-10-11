import React from "react";
import { StatusChip } from "../ui/StatusChip";

/**
 * StatusCard — the risk verdict, the focal point of the dashboard.
 *
 * The score is drawn as a meter with `role="meter"`, exposing aria-valuenow,
 * min and max, so assistive technology reads it as a quantity with a range
 * rather than as an image. The numeric value is printed beside it, so the bar
 * only reinforces a number that is already there.
 *
 * Bar colour follows the level token and the level is also written out by
 * StatusChip, so the meaning never rests on colour alone.
 */
const LEVEL_BAR = {
  safe: "bg-safe",
  warning: "bg-warning",
  danger: "bg-danger",
};

const StatusCard = ({
  level = "safe",
  label,
  score = 0,
  advice,
  scoreLabel,
  className = "",
}) => (
  <div
    className={`rounded-card border border-border-strong bg-surface inner-glow p-4 ${className}`.trim()}
  >
    <div className="flex flex-wrap items-start justify-between gap-3">
      <StatusChip level={level} label={label} size="lg" />

      <div className="text-right">
        <p className="text-label uppercase text-muted">{scoreLabel}</p>
        <p className="tabular-data font-heading text-h2 font-semibold leading-none text-fg">
          {score}
          <span className="ml-1 text-body-sm font-medium text-muted">/ 100</span>
        </p>
      </div>
    </div>

    <div
      role="meter"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${scoreLabel}: ${score} / 100`}
      className="mt-4 h-2 w-full overflow-hidden rounded-full bg-surface-3"
    >
      <div
        className={`h-full rounded-full transition-[width] duration-300 ${LEVEL_BAR[level] || LEVEL_BAR.safe}`}
        style={{ width: `${Math.max(2, Math.min(100, score))}%` }}
      />
    </div>

    {advice && <p className="mt-4 text-body-sm text-fg">{advice}</p>}
  </div>
);

export { StatusCard };
export default StatusCard;
