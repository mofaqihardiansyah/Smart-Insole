/**
 * Fuzzy risk inference — REFERENCE ENGINE, NOT THE RUNTIME.
 *
 * No production screen runs this file, and the ESP32 firmware does not run it
 * either. The live verdict path is `randomForestRisk.ts` (the RF hybrid), the
 * same model the firmware runs, and its contract is the one clinicians see:
 * danger at >= 70 kPa sustained >= 0.1 s, not this engine's ~30 s danger.
 * fuzzyRisk.test.js asserts THIS engine's own maths (a ~30 s danger window is
 * what its rule base defines) — it does not describe the live contract.
 *
 * This file is kept for two real jobs:
 *   1. It owns the shared constants every screen uses (RISK_THRESHOLDS,
 *      SCORE_BANDS), and buildSets() documents how the expert rule base maps
 *      thresholds to linguistic sets.
 *   2. Its 3x3 expert rule base is the labelling function that produced the
 *      training data for the forest.
 *
 * The engine itself is a fuzzy inference system in two stages:
 *
 *   1. Fuzzification and rule evaluation (Mamdani): the two clinical inputs are
 *      mapped to linguistic sets (low/medium/high pressure, brief/moderate/
 *      prolonged duration) and a 3x3 rule base is evaluated with MIN as AND.
 *   2. Defuzzification (Takagi-Sugeno): each fired rule contributes its
 *      consequence's representative severity, weighted by its firing strength.
 *
 * Why Sugeno rather than a Mamdani centroid: a centroid over clipped output
 * sets is not monotone. Weakening a single rule narrows its clipped area and
 * drags the centroid toward the set's plateau, so the score can *fall* while
 * the measured pressure rises. On a clinical severity index that is a bug, not
 * a nuance. The weighted average of singleton consequents is monotone by
 * construction, which fuzzyRisk.test.js asserts across the whole sweep.
 *
 * The rule-base contract (this engine's own, asserted in fuzzyRisk.test.js):
 *
 *   - peak <  35 kPa, not sustained  -> safe
 *   - peak >= 35 kPa                 -> at least warning, immediately
 *   - peak >  70 kPa, under ~30 s    -> warning (elevated, has not earned danger)
 *   - peak >  70 kPa, past ~30 s     -> danger
 *   - any peak sustained past ~20 s  -> at least warning
 *
 * Reported score bands: safe 0-47, warning 48-74, danger 75-100.
 *
 * The threshold constants below are the single source of truth, shared with
 * the Settings page and the RF engine, so the numbers a clinician edits are
 * the numbers the inference uses.
 */

import type { RiskLevel, RiskThresholds } from '../types/insole';

/** Clinical thresholds, in kPa and seconds. */
export const RISK_THRESHOLDS: Readonly<RiskThresholds> = Object.freeze({
  warningKpa: 35,
  dangerKpa: 70,
  warningSeconds: 20,
  dangerSeconds: 30,
});

/** Reported score bands. `score` is always constrained to its level's band. */
export const SCORE_BANDS = Object.freeze({
  safeMax: 47,
  warningMax: 74,
});

/* ------------------------------------------------------------------ *
 * Membership functions
 *
 * Every set is a trapezoid [a, b, c, d]: zero below `a`, rising to 1 across
 * `a..b`, flat at 1 across `b..c`, falling to zero across `c..d`. A triangle is
 * a trapezoid whose shoulders meet, written [a, b, b, c].
 * ------------------------------------------------------------------ */

/**
 * Trapezoidal membership of `x` in [a, b, c, d].
 *
 * Degenerate shoulders (a === b or c === d) are legal and mean "already at the
 * plateau", which is how `low` reaches 1.0 at zero pressure. The comparisons
 * are inclusive for the same reason: a patient at exactly 0 kPa is fully
 * "low pressure", not outside every set.
 */
export function trapezoid(
  x: number | null | undefined,
  a: number,
  b: number,
  c: number,
  d: number
): number {
  if (!Number.isFinite(x)) return 0;
  const value = x as number;
  if (value < a || value > d) return 0;
  if (value >= b && value <= c) return 1;
  if (value < b) return b - a > 0 ? (value - a) / (b - a) : 1;
  return d - c > 0 ? (d - value) / (d - c) : 1;
}

/** Triangular membership, expressed through the same trapezoid maths. */
export function triangle(x: number, a: number, b: number, c: number): number {
  return trapezoid(x, a, b, b, c);
}

/** A membership set as trapezoid corners [a, b, c, d]. */
export type Trapezoid = readonly [number, number, number, number];

export interface FuzzySets {
  pressure: { low: Trapezoid; medium: Trapezoid; high: Trapezoid };
  duration: { brief: Trapezoid; moderate: Trapezoid; prolonged: Trapezoid };
}

/**
 * Derive the input sets from the clinical thresholds.
 *
 * This is what makes the Settings page real: the constants a clinician edits
 * are the constants the inference uses, not a separate copy that only changes a
 * label. Every formula below is written so the default thresholds
 * (35 / 70 kPa, 20 / 30 s) reproduce the tuned breakpoints exactly.
 */
export function buildSets(thresholds: RiskThresholds = RISK_THRESHOLDS): FuzzySets {
  const w = thresholds.warningKpa;
  const d = thresholds.dangerKpa;
  const ws = thresholds.warningSeconds;
  const ds = thresholds.dangerSeconds;

  return {
    pressure: {
      low: [0, 0, 0.7 * w, w], // fully low well before the warning threshold
      medium: [0.77 * w, w + 0.31 * (d - w), w + 0.31 * (d - w), d],
      // Open ended on purpose. A finite upper bound would put any reading above
      // it outside every set, leaving no rule firing and reporting "safe" for
      // an off-scale pressure, which is the worst possible failure direction.
      high: [0.9 * d, d + 0.02 * d, Infinity, Infinity],
    },
    duration: {
      brief: [0, 0, 0.25 * ws, 0.7 * ws],
      moderate: [0.5 * ws, 1.05 * ws, 1.05 * ws, 1.5 * ws],
      prolonged: [0.95 * ds, 1.07 * ds, Infinity, Infinity],
    },
  };
}

const DEFAULT_SETS = buildSets(RISK_THRESHOLDS);

export const PRESSURE_SETS: Readonly<FuzzySets['pressure']> = Object.freeze(DEFAULT_SETS.pressure);
export const DURATION_SETS: Readonly<FuzzySets['duration']> = Object.freeze(DEFAULT_SETS.duration);

/**
 * Representative severity per consequence, on the 0-100 readout scale. These
 * are the singletons the Sugeno step averages.
 */
export const CONSEQUENT_SEVERITY: Readonly<Record<RiskLevel, number>> = Object.freeze({
  safe: 16,
  warning: 63,
  danger: 94,
});

/** The linguistic labels each premise of a rule can take. */
export type PressureLabel = keyof FuzzySets['pressure'];
export type DurationLabel = keyof FuzzySets['duration'];

/** One rule of the base: pressure x duration -> consequence. */
export interface FuzzyRule {
  pressure: PressureLabel;
  duration: DurationLabel;
  consequence: RiskLevel;
}

/**
 * The rule base: pressure x duration -> consequence.
 *
 * Note the shape. `danger` requires BOTH high pressure AND prolonged duration,
 * so "over 70 kPa briefly is a warning, sustained past 30 s is danger" falls
 * out of the rule table instead of being special-cased in code. Likewise the
 * `low` row warns on prolonged loading, because a diabetic foot is at risk from
 * sustained load even below the pressure threshold.
 */
export const RULES: readonly FuzzyRule[] = Object.freeze([
  { pressure: 'low', duration: 'brief', consequence: 'safe' },
  { pressure: 'low', duration: 'moderate', consequence: 'warning' },
  { pressure: 'low', duration: 'prolonged', consequence: 'warning' },

  { pressure: 'medium', duration: 'brief', consequence: 'warning' },
  { pressure: 'medium', duration: 'moderate', consequence: 'warning' },
  { pressure: 'medium', duration: 'prolonged', consequence: 'warning' },

  { pressure: 'high', duration: 'brief', consequence: 'warning' },
  { pressure: 'high', duration: 'moderate', consequence: 'warning' },
  { pressure: 'high', duration: 'prolonged', consequence: 'danger' },
]);

/** Severity order, most severe first. Used only to break exact ties. */
const SEVERITY_ORDER: readonly RiskLevel[] = ['danger', 'warning', 'safe'];

/** One fired rule, with the strength at which it fired. */
export interface Firing {
  rule: FuzzyRule;
  strength: number;
}

/** The full result of one inference. */
export interface FuzzyVerdict {
  level: RiskLevel;
  score: number;
  severity: number;
  firings: Firing[];
  strengthsByConsequence: Record<RiskLevel, number>;
}

/**
 * Run the full inference.
 */
export function inferRisk({
  peakPressure,
  sustainedDuration = 0,
  thresholds = RISK_THRESHOLDS,
}: {
  peakPressure?: number;
  sustainedDuration?: number;
  thresholds?: RiskThresholds;
} = {}): FuzzyVerdict {
  const pressure = Number.isFinite(peakPressure) ? Math.max(0, peakPressure as number) : 0;
  const duration = Number.isFinite(sustainedDuration)
    ? Math.max(0, sustainedDuration as number)
    : 0;

  // Rebuilt per call so a clinician's threshold change takes effect
  // immediately. This is cheap: six arrays of four numbers.
  const sets = buildSets(thresholds);

  const pressureMemberships: Record<PressureLabel, number> = {
    low: trapezoid(pressure, ...sets.pressure.low),
    medium: trapezoid(pressure, ...sets.pressure.medium),
    high: trapezoid(pressure, ...sets.pressure.high),
  };

  const durationMemberships: Record<DurationLabel, number> = {
    brief: trapezoid(duration, ...sets.duration.brief),
    moderate: trapezoid(duration, ...sets.duration.moderate),
    prolonged: trapezoid(duration, ...sets.duration.prolonged),
  };

  // Rule evaluation. AND is the minimum, the usual Mamdani choice: a rule fires
  // only as strongly as its weakest premise.
  const firings: Firing[] = RULES.map((rule) => ({
    rule,
    strength: Math.min(
      pressureMemberships[rule.pressure],
      durationMemberships[rule.duration]
    ),
  }));

  const active = firings.filter((f) => f.strength > 0);

  const strengthsByConsequence: Record<RiskLevel, number> = { safe: 0, warning: 0, danger: 0 };
  for (const { rule, strength } of active) {
    // Aggregation across rules that share a consequence is MAX, so the most
    // confident rule for a consequence sets its contribution.
    strengthsByConsequence[rule.consequence] = Math.max(
      strengthsByConsequence[rule.consequence],
      strength
    );
  }

  // Defuzzification, Sugeno: the firing-strength-weighted average of the
  // consequences' representative severities. Monotone by construction.
  let weighted = 0;
  let total = 0;
  for (const consequence of SEVERITY_ORDER) {
    const strength = strengthsByConsequence[consequence];
    if (strength <= 0) continue;
    weighted += strength * CONSEQUENT_SEVERITY[consequence];
    total += strength;
  }
  const severity = total > 0 ? weighted / total : 0;

  // The level is decided by the strongest firing rule, with exact ties resolved
  // toward the more cautious consequence.
  let level: RiskLevel = 'safe';
  if (active.length > 0) {
    const strongest = Math.max(...active.map((f) => f.strength));
    const tied = active.filter((f) => strongest - f.strength < 1e-9);
    // SEVERITY_ORDER holds every level, so a tie always contains a match;
    // the fallback keeps the strict compiler satisfied without changing
    // the outcome.
    level =
      SEVERITY_ORDER.find((candidate) =>
        tied.some((f) => f.rule.consequence === candidate)
      ) ?? 'safe';
  }

  return {
    level,
    score: alignScoreToLevel(Math.round(severity), level),
    severity: Math.round(severity),
    firings: active,
    strengthsByConsequence,
  };
}

/**
 * Constrain a continuous severity to the score band its level occupies, so the
 * number and the level can never contradict each other. Without this a blend of
 * "safe" and "warning" firings can report `warning` next to a score of 46,
 * which reads as a bug to a clinician even though the maths is correct.
 */
export function alignScoreToLevel(score: number, level: RiskLevel): number {
  if (level === 'danger') {
    return Math.min(100, Math.max(SCORE_BANDS.warningMax + 1, score));
  }
  if (level === 'warning') {
    return Math.min(
      SCORE_BANDS.warningMax,
      Math.max(SCORE_BANDS.safeMax + 1, score)
    );
  }
  return Math.min(SCORE_BANDS.safeMax, Math.max(0, score));
}

/**
 * Convenience wrapper returning just the level, for call sites that do not need
 * the score or the trace.
 *
 * @param peakPressure kPa
 * @param sustainedDuration seconds
 * @param thresholds optional threshold overrides
 */
export function classifyRisk(
  peakPressure: number,
  sustainedDuration = 0,
  thresholds?: RiskThresholds
): RiskLevel {
  return inferRisk({ peakPressure, sustainedDuration, thresholds }).level;
}

export default { RISK_THRESHOLDS, SCORE_BANDS, inferRisk, classifyRisk };
