import React from "react";

/**
 * Sparkline — the small trend line a Cadra stat card carries beside its value.
 *
 * It is deliberately minimal: one polyline in a fixed viewBox, no axes, no
 * dots, no animation. The number beside it is the accessible read, so the
 * graphic is `aria-hidden` and unfocusable; drawing a second accessible
 * version of the same data would just be noise for a screen reader.
 *
 * The line is drawn from the real ring buffer and from nothing else. Samples
 * that are not finite numbers are skipped (a dropped reading is a gap, not a
 * value), and fewer than two finite samples renders NOTHING: an invented line
 * would be fabrication, and a one-point flatline would be a claim the data
 * cannot back.
 *
 * The default stroke is the plain sage token (`--secondary`), not a series
 * colour: series variables stay quarantined inside the chart components.
 */
const WIDTH = 100;
const HEIGHT = 28;
const PAD = 2;

interface SparklineProps {
  data?: number[];
  stroke?: string;
  className?: string;
}

const Sparkline = ({
  data = [],
  stroke = "var(--secondary)",
  className = "",
}: SparklineProps) => {
  const points = (Array.isArray(data) ? data : []).filter(Number.isFinite);
  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min;

  // Flat data draws a mid-height line rather than collapsing to the rail.
  const y = (v: number) =>
    span === 0
      ? HEIGHT / 2
      : PAD + (1 - (v - min) / span) * (HEIGHT - PAD * 2);
  const x = (i: number) => (i / (points.length - 1)) * WIDTH;

  const path = points
    .map((v, i) => `${x(i).toFixed(2)},${y(v).toFixed(2)}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <polyline
        points={path}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

Sparkline.displayName = "Sparkline";

export { Sparkline };
export default Sparkline;
