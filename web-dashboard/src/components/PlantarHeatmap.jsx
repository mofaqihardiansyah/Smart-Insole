import React, { useContext } from 'react';
import { InsoleContext } from '../context/InsoleContext';
import { RISK_THRESHOLDS } from '../utils/randomForestRisk';
import { t } from '../utils/i18n';

/**
 * Anatomical sensor points on a LEFT foot sole (viewBox 0 0 200 400,
 * toes up / heel down, plantar view with the medial side, the arch notch and
 * the big toe, on the left).
 */
const NODES = [
  { key: 'forefoot', cx: 100, cy: 95, labelKey: 'anatomy.forefoot' },
  { key: 'midfoot', cx: 92, cy: 210, labelKey: 'anatomy.midfoot' },
  { key: 'heel', cx: 100, cy: 330, labelKey: 'anatomy.heel' },
];

const ZERO_READINGS = { forefoot: 0, midfoot: 0, heel: 0 };

/**
 * Heat fill per pressure zone.
 *
 * These resolve through the SAME risk variables the status chips and the legend
 * use, so "safe means green" is one colour everywhere, and so the map repaints
 * correctly because there is only one theme. A literal hex here would silently
 * pin the map to one palette.
 *
 * In light these resolve to the darkened risk forms, which measure 4.63, 4.24
 * and 5.46 against the sole fill, clearing the 3:1 a graphical object needs. In
 * dark they resolve to the bright forms, measured at 12.4, 11.1 and 11.1
 * against the panel.
 */
/**
 * Zone colour per pressure value, on the SAME thresholds and the SAME
 * boundaries the risk engine uses (at or above the safe limit is warning,
 * at or above the danger limit is danger). The map used to keep its own
 * 30/70 constants with strict `>`, so a 70 kPa foot could read "danger" on
 * the chip and amber on the map.
 */
const zoneColor = (kpa, warningKpa, dangerKpa) => {
  if (kpa < warningKpa) return 'rgb(var(--safe))';
  if (kpa < dangerKpa) return 'rgb(var(--warning))';
  return 'rgb(var(--danger))';
};

/** Node radius in viewBox units: r = 18 + min(kPa, 100) * 0.22 */
const nodeRadius = (kpa) =>
  Math.round((18 + Math.min(kpa, 100) * 0.22) * 10) / 10;

/** "42.5" style label: one decimal max, no trailing ".0". */
const formatKpa = (kpa) => String(parseFloat(Number(kpa || 0).toFixed(1)));

const PULSE_CSS = `
@keyframes plantar-node-pulse {
  0%, 100% { opacity: 0.85; }
  50% { opacity: 1; }
}
.plantar-node-pulse {
  animation: plantar-node-pulse 1.4s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .plantar-node-pulse { animation: none; opacity: 1; }
}
`;

/* Anatomical parts resolve through the palette variables, so the figure reads as a
   light diagram on dark and as a light diagram on light, without a second
   component. */
const SOLE_FILL = 'rgb(var(--surface-3))';
const SOLE_STROKE = 'rgb(var(--border-control))';
const INK = 'rgb(var(--fg))';
const MUTED_INK = 'rgb(var(--muted))';
const PILL_FILL = 'rgb(var(--surface))';

/**
 * PlantarHeatmap: anatomical SVG left-sole heatmap with three reactive
 * pressure nodes (forefoot / midfoot / heel).
 *
 * Pure render of props plus context: no state, no effects. `readingsOverride`
 * wins over live context readings so tests and the landing page can drive
 * values without a provider; language still comes from context (fallback 'id').
 *
 * Accessibility: the SVG is `role="img"` with a label that states all three
 * measured values, because a screen reader cannot interpret a radial gradient.
 * Each node also carries a `<title>`. The value text sits in a white pill so
 * its contrast is deterministic rather than dependent on the blob behind it.
 *
 * @param {{ showLabels?: boolean, readingsOverride?: object|null, className?: string }} props
 */
export default function PlantarHeatmap({
  showLabels = true,
  readingsOverride = null,
  className = '',
}) {
  // Raw context rather than useInsole, so the component renders standalone with
  // readingsOverride even outside an InsoleProvider.
  const context = useContext(InsoleContext);
  const readings = readingsOverride ?? context?.readings ?? ZERO_READINGS;
  const language = context?.language ?? 'id';
  // The same thresholds the risk engine runs on (Settings edits and the
  // admin global default included), so the map can never disagree with the
  // status chip beside it.
  const thresholds = context?.thresholds ?? RISK_THRESHOLDS;

  const summary = NODES.map(
    (node) => `${t(node.labelKey, language)} ${formatKpa(readings[node.key])} kPa`
  ).join(', ');

  return (
    <svg
      viewBox="0 0 200 400"
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`${t('dashboard.plantarView', language)}. ${summary}`}
      className={className}
      style={{ height: 'auto', maxHeight: 480 }}
    >
      <style>{PULSE_CSS}</style>

      <defs>
        {NODES.map((node) => {
          const kpa = Number(readings[node.key] ?? 0);
          const color = zoneColor(kpa, thresholds.warningKpa, thresholds.dangerKpa);
          return (
            <radialGradient
              key={node.key}
              id={`heatmap-grad-${node.key}`}
              cx="50%"
              cy="50%"
              r="50%"
            >
              <stop offset="0%" stopColor={color} stopOpacity={0.9} />
              <stop offset="55%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </radialGradient>
          );
        })}
      </defs>

      {/* Sole outline: heel curve, medial arch notch on the left, ball of foot */}
      <path
        d="M 100 390
           C 132 390 155 370 156 340
           C 157 312 154 296 158 272
           C 163 244 160 218 165 190
           C 169 162 177 136 174 114
           C 172 96 156 84 130 82
           C 110 81 74 80 52 88
           C 44 91 41 100 42 112
           C 43 132 47 148 54 164
           C 63 186 80 196 82 226
           C 84 254 66 274 58 300
           C 51 324 52 356 68 376
           C 78 387 88 390 100 390 Z"
        fill={SOLE_FILL}
        stroke={SOLE_STROKE}
        strokeWidth="1.5"
      />

      {/* Five toes, big toe (medial / left) largest */}
      <ellipse cx="54" cy="52" rx="25" ry="34" fill={SOLE_FILL} stroke={SOLE_STROKE} strokeWidth="1.5" />
      <ellipse cx="98" cy="58" rx="17" ry="28" fill={SOLE_FILL} stroke={SOLE_STROKE} strokeWidth="1.5" />
      <ellipse cx="130" cy="60" rx="15" ry="26" fill={SOLE_FILL} stroke={SOLE_STROKE} strokeWidth="1.5" />
      <ellipse cx="155" cy="66" rx="13" ry="22" fill={SOLE_FILL} stroke={SOLE_STROKE} strokeWidth="1.5" />
      <ellipse cx="174" cy="76" rx="11" ry="17" fill={SOLE_FILL} stroke={SOLE_STROKE} strokeWidth="1.5" />

      {/* Pressure nodes */}
      {NODES.map((node) => {
        const kpa = Number(readings[node.key] ?? 0);
        const radius = nodeRadius(kpa);
        const value = formatKpa(kpa);
        const isDanger = kpa >= thresholds.dangerKpa;
        const color = zoneColor(kpa, thresholds.warningKpa, thresholds.dangerKpa);
        const label = t(node.labelKey, language);

        // The value pill sits above the node so it never covers the blob, and
        // its width grows with the digit count so "100.0" cannot clip.
        const pillWidth = value.length >= 5 ? 58 : value.length >= 4 ? 50 : 44;
        const pillHeight = 30;
        const pillY = node.cy - radius - pillHeight - 4;

        return (
          <g key={node.key} data-testid={`node-${node.key}`}>
            <title>{`${label}: ${value} kPa`}</title>

            <circle
              cx={node.cx}
              cy={node.cy}
              r={radius}
              fill={`url(#heatmap-grad-${node.key})`}
              className={isDanger ? 'plantar-node-pulse' : undefined}
            />

            {/*
              A danger node gets a solid ring as well as a colour and a pulse,
              so the state survives greyscale printing and forced-colors mode.
            */}
            {isDanger && (
              <circle
                cx={node.cx}
                cy={node.cy}
                r={radius}
                fill="none"
                stroke={PILL_FILL}
                strokeWidth="2.5"
                strokeDasharray="5 4"
              />
            )}

            {/* Deterministic contrast for the number: dark ink on solid white. */}
            <rect
              x={node.cx - pillWidth / 2}
              y={pillY}
              width={pillWidth}
              height={pillHeight}
              rx="7"
              fill={PILL_FILL}
              stroke={color}
              strokeWidth="1.5"
            />
            <text
              x={node.cx}
              y={pillY + 15}
              textAnchor="middle"
              fontSize="14"
              fontWeight="700"
              fill={INK}
              className="tabular-data"
            >
              {value}
            </text>
            <text
              x={node.cx}
              y={pillY + 25}
              textAnchor="middle"
              fontSize="8"
              fontWeight="600"
              fill={MUTED_INK}
            >
              kPa
            </text>

            {showLabels && (
              <text
                x={node.cx}
                y={node.cy + radius + 16}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill={INK}
              >
                {label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
