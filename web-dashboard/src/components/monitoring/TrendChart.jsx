import React, { useMemo } from "react";

/**
 * TrendChart — peak pressure across the live ring buffer.
 *
 * A hand-built SVG chart rather than a charting dependency: it needs one series,
 * one threshold line and thirty points, and a charting library would add far
 * more bundle than it removes.
 *
 * Design decisions with reasons:
 * - ONE series, not three. The dashboard already answers "which zone is worst"
 *   in the load donut and the pressure map, so repeating all three traces here
 *   would triple the ink for the same answer. This card answers the other
 *   question: is the peak pressure climbing?
 * - The area under the line is a 12% tint of the same sage, so the magnitude
 *   reads before the exact number does. It is a hierarchy device, not decoration.
 * - The danger threshold is drawn AND labelled. A dashed line with no label is
 *   decoration; a labelled one is a limit.
 * - X labels are real clock times sampled from the buffer, not invented ticks.
 * - The SVG is `role="img"` with a descriptive label, and the same numbers are
 *   exposed in a screen-reader-only table. A screen reader cannot read a
 *   polyline, and "chart" as alt text is not information.
 */

const WIDTH = 800;
const HEIGHT = 260;
const PAD = { top: 28, right: 16, bottom: 36, left: 44 };

const niceCeil = (value) => {
  if (value <= 20) return 20;
  return Math.ceil(value / 20) * 20;
};

const formatClock = (timestamp, language) =>
  new Date(timestamp).toLocaleTimeString(language === "id" ? "id-ID" : "en-GB", {
    minute: "2-digit",
    second: "2-digit",
  });

const TrendChart = ({
  history = [],
  dangerKpa = 70,
  language = "id",
  labels = {},
  className = "",
}) => {
  const model = useMemo(() => {
    const plotWidth = WIDTH - PAD.left - PAD.right;
    const plotHeight = HEIGHT - PAD.top - PAD.bottom;

    const peaks = history.map((record) => Number(record.peakPressure || 0));
    const maxObserved = peaks.reduce((max, value) => Math.max(max, value), 0);
    const yMax = niceCeil(Math.max(maxObserved, dangerKpa + 10));

    const count = peaks.length;
    const x = (index) =>
      count <= 1
        ? PAD.left + plotWidth
        : PAD.left + (index / (count - 1)) * plotWidth;
    const y = (value) => PAD.top + plotHeight - (value / yMax) * plotHeight;

    const points = peaks
      .map((value, index) => `${x(index).toFixed(1)},${y(value).toFixed(1)}`)
      .join(" ");

    // The area closes the line down to the baseline so the fill can be drawn as
    // one path, and only when there is more than a single point to close.
    const area =
      count > 1
        ? [
            `${x(0).toFixed(1)},${(PAD.top + plotHeight).toFixed(1)}`,
            points,
            `${x(count - 1).toFixed(1)},${(PAD.top + plotHeight).toFixed(1)}`,
          ].join(" ")
        : "";

    // Four gridlines read a value without turning the plot into graph paper.
    const ticks = [0, 0.5, 1].map((fraction) => ({
      value: Math.round(yMax * fraction),
      y: y(yMax * fraction),
    }));

    // Six clock labels at most, evenly sampled, so a 30 point buffer does not
    // print 30 overlapping timestamps.
    const labelCount = Math.min(6, count);
    const labelIndices = Array.from({ length: labelCount }, (_, i) =>
      labelCount <= 1 ? 0 : Math.round((i / (labelCount - 1)) * (count - 1))
    );

    const last = count ? { x: x(count - 1), y: y(peaks[count - 1]) } : null;

    return { peaks, yMax, y, ticks, points, area, labelIndices, last, plotWidth, plotHeight, count };
  }, [history, dangerKpa]);

  const labelFor = (key) => labels[key] || key;

  if (!history.length) return null;

  const thresholdY = model.y(dangerKpa);
  const peak = model.peaks[model.peaks.length - 1];

  return (
    <figure className={`m-0 ${className}`.trim()}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label={[
          labels.chartTitle,
          `${labels.axisTime}: ${model.count} ${labels.samples || "samples"}`,
          `${labels.threshold}: ${dangerKpa} kPa`,
          `${labels.axisPressure}: ${peak.toFixed(1)} kPa`,
        ]
          .filter(Boolean)
          .join(". ")}
      >
        <defs>
          <linearGradient id="trend-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--secondary))" stopOpacity="0.18" />
            <stop offset="100%" stopColor="rgb(var(--secondary))" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines only. Vertical rules would double the ink for
            no extra reading, because the x axis is time, not a category. */}
        {model.ticks.map((tick) => (
          <g key={tick.value}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={tick.y}
              y2={tick.y}
              stroke="rgb(var(--border-strong))"
              strokeWidth="1"
            />
            <text
              x={PAD.left - 10}
              y={tick.y + 4}
              textAnchor="end"
              fontSize="11"
              fill="rgb(var(--muted))"
            >
              {tick.value}
            </text>
          </g>
        ))}

        {/* Danger threshold: drawn and labelled. */}
        <line
          x1={PAD.left}
          x2={WIDTH - PAD.right}
          y1={thresholdY}
          y2={thresholdY}
          stroke="rgb(var(--danger))"
          strokeWidth="1.5"
          strokeDasharray="6 4"
        />
        <text
          x={WIDTH - PAD.right}
          y={thresholdY - 6}
          textAnchor="end"
          fontSize="11"
          fontWeight="600"
          fill="rgb(var(--danger))"
        >
          {`${labels.threshold || "Threshold"} ${dangerKpa} kPa`}
        </text>

        {model.area && <polygon points={model.area} fill="url(#trend-area)" />}

        <polyline
          points={model.points}
          fill="none"
          stroke="rgb(var(--secondary))"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {model.last && (
          <>
            <circle
              cx={model.last.x}
              cy={model.last.y}
              r="5"
              fill="rgb(var(--surface))"
              stroke="rgb(var(--secondary))"
              strokeWidth="3"
            />
            <g transform={`translate(${Math.min(model.last.x, WIDTH - PAD.right - 4)}, ${Math.max(model.last.y - 34, 12)})`}>
              <rect
                x="-34"
                y="-16"
                width="68"
                height="24"
                rx="6"
                fill="rgb(var(--primary))"
              />
              <text
                x="0"
                y="1"
                textAnchor="middle"
                fontSize="12"
                fontWeight="600"
                fill="rgb(var(--primary-on))"
              >
                {`${peak.toFixed(1)} kPa`}
              </text>
            </g>
          </>
        )}

        {/* Clock labels, sampled from real timestamps. */}
        {model.labelIndices.map((index) => (
          <text
            key={index}
            x={model.count <= 1 ? PAD.left + model.plotWidth : PAD.left + (index / (model.count - 1)) * model.plotWidth}
            y={HEIGHT - 12}
            textAnchor={
              index === 0
                ? "start"
                : index === model.count - 1
                  ? "end"
                  : "middle"
            }
            fontSize="11"
            letterSpacing="0.06em"
            fill="rgb(var(--muted))"
          >
            {formatClock(history[index]?.timestamp, language)}
          </text>
        ))}
      </svg>

      {/* The same data, for a screen reader that cannot interpret a polyline. */}
      <table className="sr-only">
        <caption>{labels.chartTitle}</caption>
        <thead>
          <tr>
            <th scope="col">{labels.axisTime}</th>
            <th scope="col">{labels.axisPressure}</th>
          </tr>
        </thead>
        <tbody>
          {history.map((record, index) => (
            <tr key={`${record.timestamp ?? 't'}-${index}`}>
              <th scope="row">{formatClock(record.timestamp, language)}</th>
              <td>{Number(record.peakPressure || 0).toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
};

export { TrendChart };
export default TrendChart;
