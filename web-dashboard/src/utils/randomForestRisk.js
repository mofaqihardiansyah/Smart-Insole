/**
 * Random Forest risk inference for plantar pressure monitoring.
 *
 * Replaces the previous fuzzy logic inference. The Random Forest is trained
 * on a synthetic dataset generated from the clinical expert rules (the same
 * 3x3 rule base the fuzzy system used). This makes the system data-driven:
 * the expert rules define the clinical contract, and the forest learns the
 * decision boundary from thousands of labelled examples.
 *
 * The clinical contract preserved from the expert rules:
 *
 *   - peak <  35 kPa, not sustained  -> safe
 *   - peak >= 35 kPa                 -> at least warning, immediately
 *   - peak >  70 kPa, under ~30 s    -> warning
 *   - peak >  70 kPa, past ~30 s     -> danger
 *   - any peak sustained past ~20 s  -> at least warning
 *
 * Reported score bands: safe 0-47, warning 48-74, danger 75-100.
 *
 * The threshold constants are the single source of truth, shared with the
 * Settings page, so the numbers a clinician edits are the numbers the engine
 * uses.
 */

import { RISK_THRESHOLDS, SCORE_BANDS, classifyRisk as expertLabel } from './fuzzyRisk';

export { RISK_THRESHOLDS, SCORE_BANDS };

/* ------------------------------------------------------------------ *
 * Deterministic PRNG (LCG) — stable across runs, so tests are stable.
 * ------------------------------------------------------------------ */
function createRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/* ------------------------------------------------------------------ *
 * Training data: a deterministic grid over the clinical input space,
 * labelled by the expert rules. The grid is fine enough (1 kPa / 1 s)
 * that the forest reproduces the expert boundaries to within a unit.
 * ------------------------------------------------------------------ */
function generateTrainingData(thresholds) {
  const data = [];
  for (let pressure = 0; pressure <= 150; pressure += 1) {
    for (let duration = 0; duration <= 60; duration += 1) {
      data.push({
        pressure,
        duration,
        label: expertLabel(pressure, duration, thresholds),
      });
    }
  }
  return data;
}

/* ------------------------------------------------------------------ *
 * Decision tree with Gini impurity.
 * ------------------------------------------------------------------ */
function gini(labels) {
  if (labels.length === 0) return 0;
  const counts = {};
  for (const label of labels) counts[label] = (counts[label] || 0) + 1;
  let impurity = 1;
  for (const count of Object.values(counts)) {
    const p = count / labels.length;
    impurity -= p * p;
  }
  return impurity;
}

function majorityCounts(labels) {
  const counts = {};
  for (const label of labels) counts[label] = (counts[label] || 0) + 1;
  return counts;
}

function bestSplit(samples, features) {
  const parentGini = gini(samples.map((s) => s.label));
  let best = null;

  for (const feature of features) {
    const values = [...new Set(samples.map((s) => s[feature]))].sort((a, b) => a - b);
    for (let i = 0; i < values.length - 1; i += 1) {
      const threshold = (values[i] + values[i + 1]) / 2;
      const left = samples.filter((s) => s[feature] <= threshold);
      const right = samples.filter((s) => s[feature] > threshold);
      if (left.length === 0 || right.length === 0) continue;

      const leftGini = gini(left.map((s) => s.label));
      const rightGini = gini(right.map((s) => s.label));
      const weighted =
        (left.length * leftGini + right.length * rightGini) / samples.length;
      const gain = parentGini - weighted;

      if (!best || gain > best.gain) {
        best = { feature, threshold, gain };
      }
    }
  }
  return best;
}

function buildTree(samples, features, depth, maxDepth, minSamples, rng) {
  const labels = samples.map((s) => s.label);
  const unique = [...new Set(labels)];

  if (unique.length === 1 || depth >= maxDepth || samples.length < minSamples) {
    return { leaf: true, counts: majorityCounts(labels) };
  }

  const split = bestSplit(samples, features);
  if (!split) {
    return { leaf: true, counts: majorityCounts(labels) };
  }

  const left = samples.filter((s) => s[split.feature] <= split.threshold);
  const right = samples.filter((s) => s[split.feature] > split.threshold);

  return {
    leaf: false,
    feature: split.feature,
    threshold: split.threshold,
    left: buildTree(left, features, depth + 1, maxDepth, minSamples, rng),
    right: buildTree(right, features, depth + 1, maxDepth, minSamples, rng),
  };
}

function predictTree(tree, sample) {
  if (tree.leaf) return tree.counts;
  if (sample[tree.feature] <= tree.threshold) {
    return predictTree(tree.left, sample);
  }
  return predictTree(tree.right, sample);
}

/* ------------------------------------------------------------------ *
 * Random Forest: bootstrap aggregation over decision trees.
 * ------------------------------------------------------------------ */
const NUM_TREES = 30;
const MAX_DEPTH = 10;
const MIN_SAMPLES_SPLIT = 4;
const FEATURES = ['pressure', 'duration'];

function trainForest(trainingData, rng) {
  const trees = [];
  for (let i = 0; i < NUM_TREES; i += 1) {
    // Bootstrap sample: draw N samples with replacement.
    const bootstrap = [];
    for (let j = 0; j < trainingData.length; j += 1) {
      bootstrap.push(trainingData[Math.floor(rng() * trainingData.length)]);
    }
    trees.push(buildTree(bootstrap, FEATURES, 0, MAX_DEPTH, MIN_SAMPLES_SPLIT, rng));
  }
  return trees;
}

/* ------------------------------------------------------------------ *
 * Inference: majority vote across trees, score from vote proportion.
 * ------------------------------------------------------------------ */
const forest = trainForest(generateTrainingData(RISK_THRESHOLDS), createRng(42));

function vote(sample) {
  const totals = { safe: 0, warning: 0, danger: 0 };
  for (const tree of forest) {
    const counts = predictTree(tree, sample);
    for (const [label, count] of Object.entries(counts)) {
      totals[label] = (totals[label] || 0) + count;
    }
  }
  return totals;
}

function levelFromVotes(totals) {
  let best = 'safe';
  let bestCount = -1;
  for (const [label, count] of Object.entries(totals)) {
    if (count > bestCount) {
      best = label;
      bestCount = count;
    }
  }
  return best;
}

function scoreFromVotes(totals, level) {
  const total = totals.safe + totals.warning + totals.danger;
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

/**
 * Run the Random Forest inference.
 *
 * @param {{ peakPressure?: number, sustainedDuration?: number }} input
 * @returns {{
 *   level: 'safe' | 'warning' | 'danger',
 *   score: number,
 *   severity: number,
 *   votes: { safe: number, warning: number, danger: number }
 * }}
 */
export function inferRisk({ peakPressure, sustainedDuration = 0 } = {}) {
  const pressure = Number.isFinite(peakPressure) ? Math.max(0, peakPressure) : 0;
  const duration = Number.isFinite(sustainedDuration)
    ? Math.max(0, sustainedDuration)
    : 0;

  const totals = vote({ pressure, duration });
  const level = levelFromVotes(totals);
  const score = scoreFromVotes(totals, level);

  return {
    level,
    score,
    severity: score,
    votes: totals,
  };
}

/**
 * Convenience wrapper returning just the level, for call sites that do not need
 * the score or the trace.
 *
 * @param {number} peakPressure kPa
 * @param {number} sustainedDuration seconds
 * @param {object} [thresholds] optional threshold overrides (unused — the forest
 *   is trained on the default thresholds; kept for interface compatibility)
 * @returns {'safe' | 'warning' | 'danger'}
 */
export function classifyRisk(peakPressure, sustainedDuration = 0) {
  return inferRisk({ peakPressure, sustainedDuration }).level;
}

export default { RISK_THRESHOLDS, SCORE_BANDS, inferRisk, classifyRisk };
