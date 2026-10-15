/**
 * Random Forest risk inference for plantar pressure monitoring.
 *
 * Hybrid approach combining:
 *   - Random Forest classifier (data-driven) for safe vs warning
 *   - Rule-based override for danger (clinically well-defined)
 *
 * Trained on DFN-DS dataset (135 patients, 81k samples) with quantile
 * calibration (p75 raw 12.39 → 35 kPa, scale 2.82×).
 *
 * The clinical contract:
 *
 *   - peak <  35 kPa, not sustained  -> safe
 *   - peak >= 35 kPa                 -> at least warning, immediately
 *   - peak >= 70 kPa, sustained >= 0.1s -> danger (rule-based)
 *   - any peak sustained past ~20 s  -> at least warning
 *
 * Reported score bands: safe 0-47, warning 48-74, danger 75-100.
 */

import { RISK_THRESHOLDS, SCORE_BANDS } from './fuzzyRisk';
import modelData from './rf-model.json';

export { RISK_THRESHOLDS, SCORE_BANDS };

/* ------------------------------------------------------------------ *
 * Model configuration (loaded from rf-model.json).
 * ------------------------------------------------------------------ */
const MODEL = modelData;
const TREES = MODEL.trees;
const DANGER_RULE = MODEL.dangerRule;
const FEATURES = MODEL.features; // ['peak', 'sustained']

/* ------------------------------------------------------------------ *
 * Tree traversal: predict sample label from a single decision tree.
 * ------------------------------------------------------------------ */
function predictTree(tree, sample) {
  if (tree.leaf) return tree.counts;
  if (sample[tree.feature] <= tree.threshold) {
    return predictTree(tree.left, sample);
  }
  return predictTree(tree.right, sample);
}

/* ------------------------------------------------------------------ *
 * RF vote: majority vote across all trees (safe vs warning only).
 * ------------------------------------------------------------------ */
function vote(sample) {
  const totals = { safe: 0, warning: 0 };
  for (const tree of TREES) {
    const counts = predictTree(tree, sample);
    for (const [label, count] of Object.entries(counts)) {
      totals[label] = (totals[label] || 0) + count;
    }
  }
  return totals;
}

/* ------------------------------------------------------------------ *
 * Level from votes: RF returns safe or warning.
 * ------------------------------------------------------------------ */
function levelFromVotes(totals) {
  return totals.warning > totals.safe ? 'warning' : 'safe';
}

/* ------------------------------------------------------------------ *
 * Score from votes: map vote proportion to score band.
 * ------------------------------------------------------------------ */
function scoreFromVotes(totals, level) {
  const total = totals.safe + totals.warning;
  const proportion = total > 0 ? (totals[level] || 0) / total : 0;

  if (level === 'danger') {
    return Math.min(100, Math.max(SCORE_BANDS.warningMax + 1, Math.round(75 + proportion * 25)));
  }
  if (level === 'warning') {
    return Math.min(
      SCORE_BANDS.warningMax,
      Math.max(SCORE_BANDS.safeMax + 1, Math.round(48 + proportion * 27))
    );
  }
  return Math.min(SCORE_BANDS.safeMax, Math.max(0, Math.round(proportion * 48)));
}

/* ------------------------------------------------------------------ *
 * Hybrid inference: RF for safe/warning + rule for danger.
 * ------------------------------------------------------------------ */
export function inferRisk({ peakPressure, sustainedDuration = 0 } = {}) {
  const pressure = Number.isFinite(peakPressure) ? Math.max(0, peakPressure) : 0;
  const duration = Number.isFinite(sustainedDuration)
    ? Math.max(0, sustainedDuration)
    : 0;

  // Convert duration from seconds to samples (10 Hz sampling)
  const sustainedSamples = Math.round(duration * 10);

  // Rule-based overrides (clinical contract):
  
  // 1. Danger: peak >= threshold AND sustained >= threshold
  if (
    pressure >= DANGER_RULE.peakThreshold &&
    sustainedSamples >= DANGER_RULE.sustainedThreshold
  ) {
    return {
      level: 'danger',
      score: 75,
      severity: 75,
      votes: { safe: 0, warning: 0, danger: TREES.length },
    };
  }

  // 2. Safe: peak < warning threshold AND sustained < 20s
  // This overrides RF because in DFN-DS, sustained is only > 0 when peak >= 35
  if (pressure < RISK_THRESHOLDS.warningKpa && sustainedSamples < 200) {
    return {
      level: 'safe',
      score: 0,
      severity: 0,
      votes: { safe: TREES.length, warning: 0, danger: 0 },
    };
  }

  // RF classifier for safe vs warning
  const totals = vote({ peak: pressure, sustained: sustainedSamples });
  const level = levelFromVotes(totals);
  const score = scoreFromVotes(totals, level);

  return {
    level,
    score,
    severity: score,
    votes: { ...totals, danger: 0 },
  };
}

/**
 * Convenience wrapper returning just the level.
 *
 * @param {number} peakPressure kPa
 * @param {number} sustainedDuration seconds
 * @returns {'safe' | 'warning' | 'danger'}
 */
export function classifyRisk(peakPressure, sustainedDuration = 0) {
  return inferRisk({ peakPressure, sustainedDuration }).level;
}

export default { RISK_THRESHOLDS, SCORE_BANDS, inferRisk, classifyRisk };
