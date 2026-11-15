/**
 * RandomForest.cpp — On-device Random Forest inference for ESP32.
 *
 * Satu lapisan, dua kelas:
 *   1. Kontrak level                       -> peak >= WARNING_PEAK_KPA
 *                                             berarti warning, di bawahnya safe
 *   2. Suara 20 pohon                      -> menentukan skor dalam pita level
 *
 * Tidak ada aturan bahaya dan tidak ada lantai durasi. Durasi tetap
 * dihitung di main.cpp, tetapi hanya untuk memberi tahu berapa lama
 * tekanan sudah tinggi, bukan untuk memutuskan level.
 *
 * Mirrors web-dashboard src/utils/randomForestRisk.ts exactly.
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
// Main prediction: contract level, forest votes for the score.
// ---------------------------------------------------------------------------
RiskResult RandomForest::predict(float peakPressure, float sustainedDuration) const {
  // Sanitize input: NaN or negative → 0
  float pressure = (peakPressure == peakPressure && peakPressure > 0) ? peakPressure : 0.0f;
  float duration = (sustainedDuration == sustainedDuration && sustainedDuration > 0) ? sustainedDuration : 0.0f;

  // Convert duration (seconds) → samples at 10Hz
  int sustainedSamples = (int)(duration * 10 + 0.5f);

  int totalSafe = 0;
  int totalWarning = 0;

  for (int t = 0; t < RF_NUM_TREES; t++) {
    uint16_t leafIdx = traverseTree(RF_TREE_OFFSETS[t], pressure, (float)sustainedSamples);
    const RfNode& leaf = RF_NODES[leafIdx];
    totalSafe += leaf.safeCount;
    totalWarning += leaf.warningCount;
  }

  RiskResult result = {RISK_SAFE, 0, totalSafe, totalWarning};

  // Label latih adalah aturan itu sendiri (peak >= WARNING_PEAK_KPA), jadi
  // hutan mereproduksinya; suara pohon menentukan skor di dalam pita level,
  // bukan levelnya. Kontrak dipasang dua arah supaya pasangan fitur yang tidak
  // pernah ada di data latih (peak rendah, durasi panjang) tidak bisa tampil
  // "Waspada" di bawah ambang. Web memakai kontrak yang sama persis.
  if (pressure >= (float)WARNING_PEAK_KPA) {
    result.level = RISK_WARNING;
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
    default:           return "unknown";
  }
}
