import React from "react";

/**
 * LoadDonut — how the body weight is shared across the three sensor points.
 *
 * A donut rather than a stacked bar because the question is "how much of the
 * whole", the whole is exactly three parts, and the centre of the ring gives
 * that whole a place to be stated. Three parts is also the ceiling for a
 * donut: past that, a reader cannot compare the slices by angle and a bar
 * chart wins.
 *
 * Colour carries identity here, not severity, so the three slices use the
 * neutral-slate, navy and sage chrome rather than the risk ramp. Severity is
 * already on screen in the status chip and the pressure map; a second severity
 * encoding on the same dashboard would say the same thing twice in two
 * different ways.
 *
 * The ring is `aria-hidden` and the numbers live in the caption, because a
 * screen reader cannot measure an arc. Nothing is lost: the caption carries the
 * same three labels and percentages in reading order.
 */

const SIZE = 180;
const RADIUS = 62;
const STROKE = 26;
const CENTER = SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const LoadDonut = ({
  segments = [],
  totalLabel,
  total,
  unit,
  className = "",
}) => {
  const sum = segments.reduce((acc, segment) => acc + Math.max(0, segment.value), 0);

  let offset = 0;
  const arcs = segments.map((segment) => {
    const share = sum > 0 ? Math.max(0, segment.value) / sum : 0;
    const length = share * CIRCUMFERENCE;
    const arc = {
      ...segment,
      share,
      length,
      offset,
    };
    offset += length;
    return arc;
  });

  return (
    <figure className={`m-0 flex flex-col items-center ${className}`.trim()}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-[180px] w-[180px] shrink-0"
        aria-hidden="true"
      >
        <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
          {arcs.map((arc) => (
            <circle
              key={arc.key}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={arc.color}
              strokeWidth={STROKE}
              strokeDasharray={`${arc.length} ${CIRCUMFERENCE - arc.length}`}
              strokeDashoffset={-arc.offset}
            />
          ))}
        </g>

        <text
          x={CENTER}
          y={CENTER - 2}
          textAnchor="middle"
          fontSize="26"
          fontWeight="700"
          fill="rgb(var(--fg))"
        >
          {total}
        </text>
        <text
          x={CENTER}
          y={CENTER + 18}
          textAnchor="middle"
          fontSize="10"
          letterSpacing="0.1em"
          fontWeight="600"
          fill="rgb(var(--muted))"
        >
          {String(unit || "").toUpperCase()}
        </text>
      </svg>

      <figcaption className="mt-5 w-full">
        <dl className="space-y-2.5">
          {arcs.map((arc) => (
            <div key={arc.key} className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: arc.color }}
              />
              <dt className="flex-1 text-body-base text-fg-2">{arc.label}</dt>
              <dd className="tabular-data text-body-base font-bold text-fg">
                {`${Math.round(arc.share * 100)}%`}
              </dd>
            </div>
          ))}
        </dl>
        {totalLabel && (
          <p className="mt-3 text-caption italic text-muted">{totalLabel}</p>
        )}
      </figcaption>
    </figure>
  );
};

export { LoadDonut };
export default LoadDonut;
