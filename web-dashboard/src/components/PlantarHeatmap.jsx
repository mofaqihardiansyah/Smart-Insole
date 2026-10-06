import React, { useContext } from 'react';
import { InsoleContext } from '../context/InsoleContext';
import { t } from '../utils/i18n';

/**
 * Anatomical sensor points on a LEFT foot sole (viewBox 0 0 200 400,
 * toes up / heel down, plantar view with the medial side — arch notch and
 * big toe — on the left).
 */
const NODES = [
  { key: 'forefoot', cx: 100, cy: 95, labelKey: 'anatomy.forefoot' },
  { key: 'midfoot', cx: 92, cy: 210, labelKey: 'anatomy.midfoot' },
  { key: 'heel', cx: 100, cy: 330, labelKey: 'anatomy.heel' },
];

const ZERO_READINGS = { forefoot: 0, midfoot: 0, heel: 0 };

const WARNING_KPA = 30;
const DANGER_KPA = 70;

/** Zone center color: <30 cyan, 30-70 amber, >70 red (raw hex for SVG stops). */
const zoneColor = (kpa) => {
  if (kpa < WARNING_KPA) return '#50D8E9';
  if (kpa <= DANGER_KPA) return '#F59E0B';
  return '#EF4444';
};

/** Node radius in viewBox units: r = 18 + min(kPa, 100) * 0.22 */
const nodeRadius = (kpa) =>
  Math.round((18 + Math.min(kpa, 100) * 0.22) * 10) / 10;

/** "42.5" style label: one decimal max, no trailing ".0". */
const formatKpa = (kpa) => String(parseFloat(Number(kpa || 0).toFixed(1)));

const PULSE_CSS = `
@keyframes plantar-node-pulse {
  0%, 100% { opacity: 0.75; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.12); }
}
.plantar-node-pulse {
  animation: plantar-node-pulse 1.4s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: center;
}
@media (prefers-reduced-motion: reduce) {
  .plantar-node-pulse { animation: none; opacity: 0.9; }
}
`;

const textHalo = {
  stroke: '#0A0B0C',
  strokeWidth: 2.5,
  paintOrder: 'stroke',
  strokeLinejoin: 'round',
};

/**
 * PlantarHeatmap — anatomical SVG left-sole heatmap with three reactive
 * pressure nodes (forefoot / midfoot / heel).
 *
 * Pure render of props + context: no state, no effects. `readingsOverride`
 * wins over live context readings so tests/demo can drive values without a
 * provider; language still comes from context (fallback 'id').
 *
 * @param {{ showLabels?: boolean, readingsOverride?: {forefoot: number, midfoot: number, heel: number} | null }} props
 */
export default function PlantarHeatmap({
  showLabels = true,
  readingsOverride = null,
}) {
  // Raw context (not useInsole) so the component can render standalone with
  // readingsOverride even outside an InsoleProvider.
  const context = useContext(InsoleContext);
  const readings = readingsOverride ?? context?.readings ?? ZERO_READINGS;
  const language = context?.language ?? 'id';

  return (
    <svg
      viewBox="0 0 200 400"
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Plantar pressure heatmap"
      style={{ height: 'auto', maxHeight: 480 }}
    >
      <style>{PULSE_CSS}</style>

      <defs>
        {NODES.map((node) => {
          const kpa = Number(readings[node.key] ?? 0);
          const color = zoneColor(kpa);
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
        <filter
          id="heatmap-glow"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>

      {/* Sole outline: heel curve, medial arch notch (left), ball of foot */}
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
        fill="#161719"
        stroke="#50D8E9"
        strokeOpacity="0.4"
        strokeWidth="1.5"
      />

      {/* Five toes, big toe (medial/left) largest */}
      <ellipse cx="54" cy="52" rx="25" ry="34" fill="#161719" stroke="#50D8E9" strokeOpacity="0.4" strokeWidth="1.5" />
      <ellipse cx="98" cy="58" rx="17" ry="28" fill="#161719" stroke="#50D8E9" strokeOpacity="0.4" strokeWidth="1.5" />
      <ellipse cx="130" cy="60" rx="15" ry="26" fill="#161719" stroke="#50D8E9" strokeOpacity="0.4" strokeWidth="1.5" />
      <ellipse cx="155" cy="66" rx="13" ry="22" fill="#161719" stroke="#50D8E9" strokeOpacity="0.4" strokeWidth="1.5" />
      <ellipse cx="174" cy="76" rx="11" ry="17" fill="#161719" stroke="#50D8E9" strokeOpacity="0.4" strokeWidth="1.5" />

      {/* Pressure nodes */}
      {NODES.map((node) => {
        const kpa = Number(readings[node.key] ?? 0);
        const radius = nodeRadius(kpa);
        const value = formatKpa(kpa);
        const isDanger = kpa > DANGER_KPA;
        const label = t(node.labelKey, language);

        return (
          <g key={node.key} data-testid={`node-${node.key}`}>
            <title>{`${label}: ${value} kPa`}</title>
            <circle
              cx={node.cx}
              cy={node.cy}
              r={radius}
              fill={`url(#heatmap-grad-${node.key})`}
              filter="url(#heatmap-glow)"
              className={isDanger ? 'plantar-node-pulse' : undefined}
            />
            <text
              x={node.cx}
              y={node.cy + 4}
              textAnchor="middle"
              fontSize="13"
              fontWeight="700"
              fill="#FFFFFF"
              {...textHalo}
            >
              {value}
            </text>
            <text
              x={node.cx}
              y={node.cy + 15}
              textAnchor="middle"
              fontSize="7.5"
              fill="#E5E2E3"
              {...textHalo}
              strokeWidth={1.5}
            >
              kPa
            </text>
            {showLabels && (
              <text
                x={node.cx}
                y={node.cy + radius + 15}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="#C6C5D8"
                {...textHalo}
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
