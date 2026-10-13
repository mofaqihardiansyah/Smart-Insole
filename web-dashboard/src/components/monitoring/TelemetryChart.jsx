import React, { useMemo } from "react";

/**
 * TelemetryChart: the live pressure waveform.
 *
 * A hand-built SVG polyline chart rather than a charting dependency: it needs
 * exactly three series, one threshold line and 30 points, and a charting
 * library would add far more bundle than it removes.
 *
 * Design decisions with reasons:
 * - Series colours resolve through the `--series-*` variables, so the plot
 *   belongs to the same palette as the chrome. Each
 *   series ALSO carries a distinct stroke pattern (solid, dashed, dotted),
 *   because three hues alone are not enough separation for every kind of colour
 *   vision deficiency, and a pressure trend is worth reading correctly.
 * - Legend text uses ink colours, never the series colour, so a label stays
 *   readable regardless of which line it describes.
 * - The threshold line is labelled in the chart, not merely drawn: a dashed
 *   line with no label is decoration.
 * - The SVG is `role="img"` with a descriptive label, and the same numbers are
 *   exposed in a screen-reader-only table. A screen reader cannot read a
 *   polyline, and "chart" as alt text is not information.
 */

const SERIES = [
  { key: "forefoot", varName: "--series-1", dash: undefined },
  { key: "midfoot", varName: "--series-2", dash: "7 4" },
  { key: "heel", varName: "--series-3", dash: "2 4" },
];

const WIDTH = 720;
const HEIGHT = 280;
const PAD = { top: 16, right: 76, bottom: 34, left: 52 };

const niceCeil = (value) => {
  if (value <= 20) return 20;
  return Math.ceil(value / 20) * 20;
};

const TelemetryChart = ({
  history = [],
  dangerKpa = 70,
  labels = {},
  className = "",
}) => {
  const series = useMemo(() => {
    const plotWidth = WIDTH - PAD.left - PAD.right;
    const plotHeight = HEIGHT - PAD.top - PAD.bottom;

    const maxObserved = history.reduce(
      (max, record) =>
        Math.max(
          max,
          record.readings?.forefoot ?? 0,
          record.readings?.midfoot ?? 0,
          record.readings?.heel ?? 0
        ),
      0
    );
    const yMax = niceCeil(Math.max(maxObserved, dangerKpa + 10));

    const count = history.length;
    const x = (index) =>
      count <= 1
        ? PAD.left + plotWidth
        : PAD.left + (index / (count - 1)) * plotWidth;
    const y = (value) => PAD.top + plotHeight - (value / yMax) * plotHeight;

    const paths = SERIES.map((entry) => ({
      ...entry,
      color: `rgb(var(${entry.varName}))`,
      points: history
        .map(
          (record, index) =>
            `${x(index).toFixed(1)},${y(record.readings?.[entry.key] ?? 0).toFixed(1)}`
        )
        .join(" "),
    }));

    // Five gridlines is enough to read a value without turning the plot into
    // graph paper.
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((fraction) => ({
      value: Math.round(yMax * fraction),
      y: y(yMax * fraction),
    }));

    return { paths, yMax, y, ticks, plotWidth, plotHeight, count };
  }, [history, dangerKpa]);

  const latest = history.length ? history[history.length - 1] : null;
  const labelFor = (key) => labels[key] || key;

  if (!history.length) return null;

  const thresholdY = series.y(dangerKpa);

  return (
    <figure className={`m-0 ${className}`.trim()}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label={[
          labels.chartTitle,
          `${labels.axisTime}: ${series.count} ${labels.samples || "samples"}`,
          labels.axisPressure,
          `${labels.threshold}: ${dangerKpa} kPa`,
        ]
          .filter(Boolean)
          .join(". ")}
      >
        {/* Plot well */}
        <rect
          x={PAD.left}
          y={PAD.top}
          width={series.plotWidth}
          height={series.plotHeight}
          rx="3"
          fill="rgb(var(--surface-3))"
        />

        {/* Gridlines and y axis labels */}
        {series.ticks.map((tick) => (
          <g key={tick.value}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={tick.y}
              y2={tick.y}
              stroke="rgb(var(--grid) / 0.09)"
              strokeWidth="1"
            />
            <text
              x={PAD.left - 8}
              y={tick.y + 4}
              textAnchor="end"
              fontSize="11"
              fill="rgb(var(--muted))"
            >
              {tick.value}
            </text>
          </g>
        ))}

        {/* Danger threshold: drawn and labelled */}
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
          x={WIDTH - PAD.right + 6}
          y={thresholdY + 4}
          fontSize="11"
          fontWeight="600"
          fill="rgb(var(--danger))"
        >
          {labels.threshold || "Threshold"}
        </text>
        <text
          x={WIDTH - PAD.right + 6}
          y={thresholdY + 19}
          fontSize="11"
          fill="rgb(var(--muted))"
        >
          {dangerKpa} kPa
        </text>

        {/* Axis rules use the control edge token, so they are actually visible
            rather than a 1.1:1 hairline on a chart that matters. */}
        <line
          x1={PAD.left}
          x2={PAD.left}
          y1={PAD.top}
          y2={PAD.top + series.plotHeight}
          stroke="rgb(var(--border-control))"
          strokeWidth="1"
        />
        <line
          x1={PAD.left}
          x2={WIDTH - PAD.right}
          y1={PAD.top + series.plotHeight}
          y2={PAD.top + series.plotHeight}
          stroke="rgb(var(--border-control))"
          strokeWidth="1"
        />

        {/* Series, plus an end dot so the current value is findable at a glance */}
        {series.paths.map((entry) => (
          <g key={entry.key}>
            <polyline
              points={entry.points}
              fill="none"
              stroke={entry.color}
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={entry.dash}
            />
            {(() => {
              const last = entry.points.split(" ").pop()?.split(",");
              if (!last) return null;
              return (
                <circle cx={last[0]} cy={last[1]} r="3.5" fill={entry.color} />
              );
            })()}
          </g>
        ))}

        {/* Axis titles */}
        <text x={PAD.left} y={HEIGHT - 8} fontSize="11" fill="rgb(var(--muted))">
          {labels.axisTime}
        </text>
        <text x={6} y={PAD.top + 10} fontSize="11" fill="rgb(var(--muted))">
          {labels.axisPressure}
        </text>
      </svg>

      {/* Legend doubles as the current value readout. The dash pattern in the
          swatch matches the line it describes. */}
      <figcaption className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-body-sm text-muted">
        {series.paths.map((entry) => (
          <span key={entry.key} className="inline-flex items-center gap-2">
            <svg width="18" height="6" aria-hidden="true">
              <line
                x1="0"
                y1="3"
                x2="18"
                y2="3"
                stroke={entry.color}
                strokeWidth="2.5"
                strokeDasharray={entry.dash}
              />
            </svg>
            {labelFor(entry.key)}
            {latest && (
              <span className="tabular-data font-medium text-fg">
                {(latest.readings?.[entry.key] ?? 0).toFixed(1)} kPa
              </span>
            )}
          </span>
        ))}
      </figcaption>

      {/* The same data, for a screen reader that cannot interpret a polyline. */}
      <table className="sr-only">
        <caption>{labels.chartTitle}</caption>
        <thead>
          <tr>
            <th scope="col">{labels.axisTime}</th>
            {SERIES.map((entry) => (
              <th key={entry.key} scope="col">
                {labelFor(entry.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {history.map((record, index) => (
            <tr key={record.timestamp ?? index}>
              <th scope="row">{index + 1}</th>
              {SERIES.map((entry) => (
                <td key={entry.key}>
                  {(record.readings?.[entry.key] ?? 0).toFixed(1)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
};

export { TelemetryChart, SERIES as TELEMETRY_SERIES };
export default TelemetryChart;
