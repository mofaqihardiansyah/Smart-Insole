import React from "react";
import { CheckCircle2, AlertTriangle, AlertOctagon } from "lucide-react";

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
 * The tint is the accent at 15% alpha, which works in the light theme
 * without a second set of tint tokens. The label sits at the full accent
 * colour, measured at 4.5:1 or better, so
 * the meaning is carried by text that is genuinely readable.
 */
const LEVELS = {
  safe: {
    Icon: CheckCircle2,
    tone: "bg-safe/15 text-safe",
  },
  warning: {
    Icon: AlertTriangle,
    tone: "bg-warning/15 text-warning",
  },
  danger: {
    Icon: AlertOctagon,
    tone: "bg-danger/15 text-danger",
  },
};

const SIZES = {
  sm: { box: "gap-1.5 px-2 py-0.5 text-chip", icon: "h-3.5 w-3.5" },
  md: { box: "gap-2 px-2.5 py-1 text-chip", icon: "h-4 w-4" },
  lg: { box: "gap-2 px-3 py-1.5 text-label", icon: "h-5 w-5" },
};

/**
 * @param {object} props
 * @param {'safe'|'warning'|'danger'} props.level
 * @param {string} props.label localised, human readable level name
 */
const StatusChip = ({ level = "safe", label, size = "md", className = "" }) => {
  const config = LEVELS[level] || LEVELS.safe;
  const sizing = SIZES[size] || SIZES.md;
  const { Icon } = config;

  return (
    <span
      className={[
        "status-chip inline-flex items-center rounded-control border font-semibold uppercase",
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

export { StatusChip };
export default StatusChip;
