/**
 * RandomForest.h — On-device Random Forest inference for ESP32.
 *
 * Dua kelas: `safe` dan `warning`. Tidak ada level bahaya.
 *
 * Interface mirrors web-dashboard randomForestRisk.ts:
 *   predict(peakPressure, sustainedDuration) → { level, score }
 *
 * peakPressure:      kPa (float)
 * sustainedDuration: seconds (float)
 */

#ifndef RANDOM_FOREST_H
#define RANDOM_FOREST_H

#include <stdint.h>

#ifdef __cplusplus

enum RiskLevel {
  RISK_SAFE = 0,
  RISK_WARNING = 1,
};

struct RiskResult {
  RiskLevel level;
  int score;       // 0-100
  int safeVotes;
  int warningVotes;
};

class RandomForest {
public:
  /**
   * Predict risk level from pressure reading.
   *
   * @param peakPressure      Peak pressure in kPa
   * @param sustainedDuration Duration sustained in seconds
   * @return RiskResult with level, score, and vote counts
   */
  RiskResult predict(float peakPressure, float sustainedDuration) const;

  /**
   * Convenience: return just the level string.
   */
  static const char* levelToString(RiskLevel level);

private:
  /**
   * Traverse a single tree and return leaf vote counts.
   * @param treeOffset  Index into RF_NODES for this tree's root
   * @param peak        Peak pressure (kPa)
   * @param sustained   Sustained duration in samples (10Hz)
   * @return Leaf node index
   */
  uint16_t traverseTree(uint16_t treeOffset, float peak, float sustained) const;
};

#endif // __cplusplus
#endif // RANDOM_FOREST_H
