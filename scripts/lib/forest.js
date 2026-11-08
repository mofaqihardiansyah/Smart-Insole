/**
 * forest.js — the decision-tree machinery shared by the training scripts.
 *
 * Extracted verbatim from `scripts/train-model.js` so the session-level
 * classifier (`scripts/train-session-model.js`) trains the same trees instead
 * of a second, subtly different copy. The sample-level model regenerated from
 * this module is byte-identical to the one produced before the extraction,
 * which is the proof that nothing here changed behaviour.
 *
 * A sample is a plain object carrying the feature values plus a `label`
 * string. Nothing in this file knows what the labels mean, so the same code
 * trains `safe`/`warning` per sample and `DM`/`DFN` per session.
 */

function createRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function giniWeighted(labels, weights) {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  if (totalWeight === 0) return 0;
  const counts = {};
  for (let i = 0; i < labels.length; i++) {
    counts[labels[i]] = (counts[labels[i]] || 0) + weights[i];
  }
  let impurity = 1;
  for (const w of Object.values(counts)) {
    const p = w / totalWeight;
    impurity -= p * p;
  }
  return impurity;
}

const NUM_BINS = 32; // quantile bins for split candidates
const SUBSAMPLE_SIZE = 0; // 0 = gunakan full dataset

function bestSplit(samples, features, weights) {
  const parentGini = giniWeighted(samples.map((s) => s.label), weights);
  let best = null;

  for (const feature of features) {
    // quantile binning: candidate thresholds at bin edges, not every unique value
    const sorted = samples.map((s) => s[feature]).sort((a, b) => a - b);
    const n = sorted.length;
    for (let b = 1; b < NUM_BINS; b++) {
      const threshold = sorted[Math.floor((n * b) / NUM_BINS)];
      const leftLabels = [];
      const leftWeights = [];
      const rightLabels = [];
      const rightWeights = [];
      for (let j = 0; j < samples.length; j++) {
        if (samples[j][feature] <= threshold) {
          leftLabels.push(samples[j].label);
          leftWeights.push(weights[j]);
        } else {
          rightLabels.push(samples[j].label);
          rightWeights.push(weights[j]);
        }
      }
      if (leftLabels.length === 0 || rightLabels.length === 0) continue;

      const leftGini = giniWeighted(leftLabels, leftWeights);
      const rightGini = giniWeighted(rightLabels, rightWeights);
      const leftW = leftWeights.reduce((a, b) => a + b, 0);
      const rightW = rightWeights.reduce((a, b) => a + b, 0);
      const totalW = leftW + rightW;
      const weighted = (leftW * leftGini + rightW * rightGini) / totalW;
      const gain = parentGini - weighted;

      if (!best || gain > best.gain) {
        best = { feature: feature, threshold: threshold, gain: gain };
      }
    }
  }
  return best;
}

function buildTree(samples, features, weights, depth, maxDepth, minSamples, rng) {
  const labels = samples.map((s) => s.label);
  const unique = [...new Set(labels)];

  if (unique.length === 1 || depth >= maxDepth || samples.length < minSamples) {
    const counts = {};
    for (const l of labels) counts[l] = (counts[l] || 0) + 1;
    return { leaf: true, counts };
  }

  const split = bestSplit(samples, features, weights);
  if (!split) {
    const counts = {};
    for (const l of labels) counts[l] = (counts[l] || 0) + 1;
    return { leaf: true, counts };
  }

  const leftSamples = [];
  const leftWeights = [];
  const rightSamples = [];
  const rightWeights = [];
  for (let i = 0; i < samples.length; i++) {
    if (samples[i][split.feature] <= split.threshold) {
      leftSamples.push(samples[i]);
      leftWeights.push(weights[i]);
    } else {
      rightSamples.push(samples[i]);
      rightWeights.push(weights[i]);
    }
  }

  return {
    leaf: false,
    feature: split.feature,
    threshold: split.threshold,
    left: buildTree(leftSamples, features, leftWeights, depth + 1, maxDepth, minSamples, rng),
    right: buildTree(rightSamples, features, rightWeights, depth + 1, maxDepth, minSamples, rng),
  };
}

function predictTree(tree, sample) {
  if (tree.leaf) return tree.counts;
  if (sample[tree.feature] <= tree.threshold) return predictTree(tree.left, sample);
  return predictTree(tree.right, sample);
}

function trainForest(samples, features, classWeights, nTrees, maxDepth, minSamples, rng) {
  const trees = [];

  // cumulative weight distribution for O(log n) weighted sampling
  const cumWeights = new Float64Array(samples.length);
  let acc = 0;
  for (let i = 0; i < samples.length; i++) {
    const w = classWeights ? classWeights[samples[i].label] || 1 : 1;
    acc += w;
    cumWeights[i] = acc;
  }
  const totalWeight = acc;

  function sampleIndex(target) {
    let lo = 0;
    let hi = cumWeights.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cumWeights[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  for (let t = 0; t < nTrees; t++) {
    // weighted bootstrap: draw with probability proportional to class weight
    const bootstrap = [];
    const bootstrapWeights = [];
    const nDraw = SUBSAMPLE_SIZE > 0 ? Math.min(SUBSAMPLE_SIZE, samples.length) : samples.length;
    for (let j = 0; j < nDraw; j++) {
      const idx = sampleIndex(rng() * totalWeight);
      bootstrap.push(samples[idx]);
      bootstrapWeights.push(1); // weights already baked into sampling
    }
    trees.push(buildTree(bootstrap, features, bootstrapWeights, 0, maxDepth, minSamples, rng));
  }
  return trees;
}

/**
 * Summed leaf counts across the forest, in the order the labels are given.
 *
 * The order is explicit because it decides ties: the caller's first label wins
 * a tied vote, which is what keeps `safe` beating `warning` on an even split
 * exactly as it did before this module existed.
 */
function voteCounts(trees, sample, labels) {
  const totals = {};
  for (const label of labels) totals[label] = 0;
  for (const tree of trees) {
    const counts = predictTree(tree, sample);
    for (const [label, count] of Object.entries(counts)) {
      totals[label] = (totals[label] || 0) + count;
    }
  }
  return totals;
}

module.exports = {
  createRng,
  buildTree,
  predictTree,
  trainForest,
  voteCounts,
};
