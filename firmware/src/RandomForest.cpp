/**
 * RandomForest.cpp — On-device Random Forest inference for ESP32.
 *
 * Hybrid approach:
 *   1. Danger rule: peak >= 70 kPa AND sustained >= 0.1s → danger
 *   2. Safe rule:   peak < 35 kPa AND sustained < 20s    → safe
 *   3. RF classifier: majority vote across 20 trees       → safe/warning
 *
 * Mirrors web-dashboard src/utils/randomForestRisk.js exactly.
 */

#include "RandomForest.h"
#include "rf-model-data.h"

// ---------------------------------------------------------------------------
// Tree traversal: walk from root to leaf, return leaf node index.
// ---------------------------------------------------------------------------
uint16_t RandomForest::traverseTree(uint16_t treeOffset, float peak, float sustained) const {
  uint16_t idx = treeOffset;

  while (RF_NODES[idx].isLeaf == 0) {
    const RfNode& node = RF_NODES[idx];
    float value = (node.feature == FEATURE_PEAK) ? peak : sustained;

    if (value <= node.threshold) {
      idx = node.leftIdx;
    } else {
      idx = node.rightIdx;
    }
  }

  return idx; // leaf index
}

// ---------------------------------------------------------------------------
// Score computation: map vote proportion to score band.
// ---------------------------------------------------------------------------
static int computeScore(int safeVotes, int warningVotes, RiskLevel level) {
  int total = safeVotes + warningVotes;

  if (level == RISK_DANGER) {
    return 75;
  }

  if (level == RISK_WARNING) {
    if (total == 0) return 48;
    float proportion = (float)warningVotes / total;
    int score = (int)(48 + proportion * 27); // 48-74
    if (score > 74) score = 74; // cap at warning max
    if (score < 48) score = 48;
    return score;
  }

  // safe
  if (total == 0) return 0;
  float proportion = (float)safeVotes / total;
  int score = (int)(proportion * 48); // 0-47
  if (score > 47) score = 47; // cap at safe max
  return score;
}

// ---------------------------------------------------------------------------
// Main prediction: hybrid RF + rule-based.
// ---------------------------------------------------------------------------
RiskResult RandomForest::predict(float peakPressure, float sustainedDuration) const {
  // Sanitize input: NaN or negative → 0
  float pressure = (peakPressure == peakPressure && peakPressure > 0) ? peakPressure : 0.0f;
  float duration = (sustainedDuration == sustainedDuration && sustainedDuration > 0) ? sustainedDuration : 0.0f;

  // Convert duration (seconds) → samples at 10Hz
  int sustainedSamples = (int)(duration * 10 + 0.5f);

  RiskResult result = {RISK_SAFE, 0, 0, 0, 0};

  // --- Rule 1: Danger override ---
  // peak >= 70 kPa AND sustained >= 1 sample (0.1s)
  if (pressure >= (float)DANGER_PEAK_KPA && sustainedSamples >= DANGER_SUSTAINED_RAW) {
    result.level = RISK_DANGER;
    result.score = 75;
    result.dangerVotes = RF_NUM_TREES;
    return result;
  }

  // --- Rule 2: Safe override ---
  // peak < 35 kPa AND sustained < 200 samples (20s)
  if (pressure < (float)WARNING_PEAK_KPA && sustainedSamples < WARNING_SUSTAINED_RAW) {
    result.level = RISK_SAFE;
    result.score = 0;
    result.safeVotes = RF_NUM_TREES;
    return result;
  }

  // --- RF classifier: majority vote across all trees ---
  int totalSafe = 0;
  int totalWarning = 0;

  for (int t = 0; t < RF_NUM_TREES; t++) {
    uint16_t leafIdx = traverseTree(RF_TREE_OFFSETS[t], pressure, (float)sustainedSamples);
    const RfNode& leaf = RF_NODES[leafIdx];
    totalSafe += leaf.safeCount;
    totalWarning += leaf.warningCount;
  }

  result.safeVotes = totalSafe;
  result.warningVotes = totalWarning;

  if (totalWarning > totalSafe) {
    result.level = RISK_WARNING;
  } else {
    result.level = RISK_SAFE;
  }

  result.score = computeScore(totalSafe, totalWarning, result.level);

  return result;
}

// ---------------------------------------------------------------------------
// Utility: level enum → string
// ---------------------------------------------------------------------------
const char* RandomForest::levelToString(RiskLevel level) {
  switch (level) {
    case RISK_SAFE:    return "safe";
    case RISK_WARNING: return "warning";
    case RISK_DANGER:  return "danger";
    default:           return "unknown";
  }
}
