import React from "react";
import { CheckCircle2, AlertTriangle, AlertOctagon } from "lucide-react";
import { devWarn } from "../../utils/devWarn";

/**
 * StatusChip — the risk readout.
 *
 * A product requirement is that risk is never signalled by colour alone, so
 * this always renders three redundant channels:
 *
 *   1. an icon with a distinct SHAPE per level (circle, triangle, octagon),
 *      which survives both colour blindness and forced-colors mode;
 *   2. a text label in the current language, in uppercase micro type;
 *   3. the colour.
 *
 * It is a squared tag: the radius scale reserves `rounded-full` for avatars
 * and indicator dots alone, and a pill-shaped state token was one more
 * interchangeable shape on the page. A 4px tag reads as an instrument label:
 * a value with a role, not a badge.
 */
const LEVELS = {
  safe: {
    Icon: CheckCircle2,
    tone: "bg-safe/15 text-safe-ink",
  },
  warning: {
    Icon: AlertTriangle,
    tone: "bg-warning/15 text-warning-ink",
  },
  danger: {
    Icon: AlertOctagon,
    tone: "bg-danger/15 text-danger-ink",
  },
};

const SIZES = {
  sm: { box: "gap-1.5 px-2.5 py-1 text-chip", icon: "h-3.5 w-3.5" },
  md: { box: "gap-2 px-3 py-1 text-chip", icon: "h-4 w-4" },
  lg: { box: "gap-2 px-3.5 py-1.5 text-chip", icon: "h-5 w-5" },
};

/**
 * @param {object} props
 * @param {'safe'|'warning'|'danger'} props.level
 * @param {string} props.label localised, human readable level name
 */
const StatusChip = ({ level = "safe", label, size = "md", className = "" }) => {
  // Same posture as `Chip`: an undeclared key keeps its benign fallback, and
  // development says which key was received. An unknown level resolving to
  // `safe` is a false clinical claim — it paints an unread state as a good one
  // — so the mistake has to be loud where it was written.
  if (!LEVELS[level]) {
    devWarn(
      "StatusChip",
      `unknown level "${level}"; declared levels are ${Object.keys(LEVELS).join(
        ", "
      )}`
    );
  }
  if (!SIZES[size]) {
    devWarn(
      "StatusChip",
      `unknown size "${size}"; declared sizes are ${Object.keys(SIZES).join(
        ", "
      )}`
    );
  }

  const config = LEVELS[level] || LEVELS.safe;
  const sizing = SIZES[size] || SIZES.md;
  const { Icon } = config;

  return (
    <span
      className={[
        "status-chip inline-flex items-center rounded-sm font-semibold uppercase",
        config.tone,
        sizing.box,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Icon className={sizing.icon} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
};

export { StatusChip, LEVELS as STATUS_LEVELS };
export default StatusChip;
