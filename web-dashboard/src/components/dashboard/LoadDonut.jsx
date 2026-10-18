import React from "react";
import { SERIES } from "../../utils/series";
import { devWarn } from "../../utils/devWarn";

/**
 * LoadDonut — how the body weight is shared across the three sensor points.
 *
 * A donut rather than a stacked bar because the question is "how much of the
 * whole", the whole is exactly three parts, and the centre of the ring gives
 * that whole a place to be stated. Three parts is also the ceiling for a
 * donut: past that, a reader cannot compare the slices by angle and a bar
 * chart wins.
 *
 * Colour carries identity here, not severity, so each slice takes the series
 * colour its zone key names, resolved from `../utils/series` — the same single
 * module the two line charts read. There is deliberately no colour prop: a
 * caller that supplied one could paint a wedge with a colour that stands for a
 * different zone, and the ring would then contradict its own caption. Severity
 * is already on screen in the status chip and the pressure map; a second
 * severity encoding on the same dashboard would say the same thing twice in two
 * different ways.
 *
 * The ring is `aria-hidden` and the numbers live in the caption, because a
 * screen reader cannot measure an arc. Nothing is lost: the caption carries the
 * same three labels and percentages in reading order, and it survives a segment
 * whose arc could not be drawn.
 */

const SIZE = 180;
const RADIUS = 62;
const STROKE = 26;
const CENTER = SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const DECLARED_KEYS = SERIES.map((entry) => entry.key);
const SERIES_BY_KEY = new Map(SERIES.map((entry) => [entry.key, entry]));

/**
 * The ink a segment with no series entry falls back to in the caption. A
 * neutral, so an unavailable zone cannot be read as one of the three series.
 */
const UNAVAILABLE_INK = "rgb(var(--muted))";

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
    const entry = SERIES_BY_KEY.get(segment.key);

    if (!entry) {
      devWarn(
        "LoadDonut",
        `unknown zone key "${segment.key}"; declared keys are ${DECLARED_KEYS.join(
          ", "
        )}`
      );
    }

    const share = sum > 0 ? Math.max(0, segment.value) / sum : 0;
    const length = share * CIRCUMFERENCE;
    const arc = {
      ...segment,
      share,
      length,
      offset,
      varName: entry?.varName,
    };
    // Offset still advances for a key with no arc, so the ring shows a gap
    // where the caption still lists a row. A ring that silently closed over the
    // missing third would disagree with the caption beneath it.
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
          {arcs.map((arc) =>
            arc.varName && arc.length > 0 ? (
              <circle
                key={arc.key}
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                stroke={`rgb(var(${arc.varName}))`}
                strokeWidth={STROKE}
                strokeDasharray={`${arc.length} ${CIRCUMFERENCE - arc.length}`}
                strokeDashoffset={-arc.offset}
              />
            ) : null
          )}
        </g>

        {/* Both sizes come from the declared type scale: `stat` for the whole
            and `micro` for the unit. Two numbers chosen in place would drift. */}
        <text
          x={CENTER}
          y={CENTER - 2}
          textAnchor="middle"
          className="text-stat"
          fill="rgb(var(--fg))"
        >
          {total}
        </text>
        <text
          x={CENTER}
          y={CENTER + 18}
          textAnchor="middle"
          className="text-micro"
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
                style={{
                  backgroundColor: arc.varName
                    ? `rgb(var(${arc.varName}))`
                    : UNAVAILABLE_INK,
                }}
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
