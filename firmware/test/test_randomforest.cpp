/**
 * test_randomforest.cpp — Unit tests for RandomForest inference.
 *
 * Mirrors web-dashboard randomForestRisk.test.js clinical contract.
 * Run: pio test -e native
 */

#include <unity.h>
#include <cstdio>
#include "RandomForest.h"

static RandomForest rf;

// ── Clinical contract test cases ────────────────────────────
// {peak, sustained_seconds, expected_level}

struct TestCase {
  float peak;
  float sustained;
  RiskLevel expected;
  const char* label;
};

static const TestCase CASES[] = {
  // Safe: low pressure, no sustained
  {0,  0,  RISK_SAFE,    "0 kPa, 0s"},
  {12, 0,  RISK_SAFE,    "12 kPa, 0s"},
  {25, 0,  RISK_SAFE,    "25 kPa, 0s"},
  {31, 0,  RISK_SAFE,    "31 kPa, 0s"},

  // Warning: at or above 35 kPa
  {35, 1,  RISK_WARNING, "35 kPa, 1s"},
  {40, 1,  RISK_WARNING, "40 kPa, 1s"},
  {48, 2,  RISK_WARNING, "48 kPa, 2s"},
  {60, 5,  RISK_WARNING, "60 kPa, 5s"},

  // Danger: peak >= 70 AND sustained >= 0.1s (rule-based)
  {70, 1,  RISK_DANGER,  "70 kPa, 1s"},
  {72, 15, RISK_DANGER,  "72 kPa, 15s"},
  {80, 15, RISK_DANGER,  "80 kPa, 15s"},
  {80, 30, RISK_DANGER,  "80 kPa, 30s"},
  {80, 31, RISK_DANGER,  "80 kPa, 31s"},
  {90, 45, RISK_DANGER,  "90 kPa, 45s"},

  // Warning: prolonged moderate load (peak < 35 but sustained >= 20s)
  {30, 25, RISK_WARNING, "30 kPa, 25s"},
  {30, 45, RISK_WARNING, "30 kPa, 45s"},
  {55, 45, RISK_WARNING, "55 kPa, 45s"},
};

static const int NUM_CASES = sizeof(CASES) / sizeof(TestCase);

// ── Individual test functions ───────────────────────────────

void test_clinical_contract(void) {
  for (int i = 0; i < NUM_CASES; i++) {
    const TestCase& tc = CASES[i];
    RiskResult r = rf.predict(tc.peak, tc.sustained);
    char msg[128];
    snprintf(msg, sizeof(msg), "Case [%s]: expected %s, got %s",
             tc.label,
             RandomForest::levelToString(tc.expected),
             RandomForest::levelToString(r.level));
    TEST_ASSERT_EQUAL_MESSAGE(tc.expected, r.level, msg);
  }
}

void test_safe_low_pressure(void) {
  RiskResult r = rf.predict(20, 0);
  TEST_ASSERT_EQUAL(RISK_SAFE, r.level);
  TEST_ASSERT_EQUAL(0, r.score);
}

void test_warning_at_threshold(void) {
  RiskResult r = rf.predict(35, 1);
  TEST_ASSERT_EQUAL(RISK_WARNING, r.level);
  TEST_ASSERT_TRUE(r.score >= 48 && r.score <= 74);
}

void test_danger_high_pressure(void) {
  RiskResult r = rf.predict(80, 1);
  TEST_ASSERT_EQUAL(RISK_DANGER, r.level);
  TEST_ASSERT_EQUAL(75, r.score);
}

void test_nan_input_safe(void) {
  RiskResult r = rf.predict(NAN, NAN);
  TEST_ASSERT_EQUAL(RISK_SAFE, r.level);
}

void test_negative_input_safe(void) {
  RiskResult r = rf.predict(-10, -5);
  TEST_ASSERT_EQUAL(RISK_SAFE, r.level);
}

void test_extreme_pressure_danger(void) {
  RiskResult r = rf.predict(500, 1);
  TEST_ASSERT_EQUAL(RISK_DANGER, r.level);
}

void test_safe_override_below_threshold(void) {
  // peak < 35 AND sustained < 20s → safe (rule override)
  RiskResult r = rf.predict(25, 3);
  TEST_ASSERT_EQUAL(RISK_SAFE, r.level);
}

void test_vote_counts_sum_to_tree_count(void) {
  // For warning case (not danger, not safe override)
  RiskResult r = rf.predict(50, 5);
  int total = r.safeVotes + r.warningVotes;
  TEST_ASSERT_GREATER_THAN(0, total);
  TEST_ASSERT_EQUAL(0, r.dangerVotes);
}

void test_danger_override_wins_over_rf(void) {
  // Even though RF might say warning, danger rule overrides
  RiskResult r = rf.predict(70, 1);
  TEST_ASSERT_EQUAL(RISK_DANGER, r.level);
  TEST_ASSERT_EQUAL(20, r.dangerVotes); // all trees
}

void test_safe_to_warning_crossover(void) {
  // Crossover should be at exactly 35 kPa
  RiskLevel below = rf.predict(34, 1).level;
  RiskLevel at = rf.predict(35, 1).level;
  TEST_ASSERT_EQUAL(RISK_SAFE, below);
  TEST_ASSERT_EQUAL(RISK_WARNING, at);
}

void test_pressure_relief_resets(void) {
  // Start high, then relief
  RiskResult high = rf.predict(80, 5);
  TEST_ASSERT_EQUAL(RISK_DANGER, high.level);

  RiskResult relief = rf.predict(12, 0);
  TEST_ASSERT_EQUAL(RISK_SAFE, relief.level);
}

void test_scores_in_band(void) {
  RiskResult safe = rf.predict(15, 0);
  RiskResult warning = rf.predict(50, 5);
  RiskResult danger = rf.predict(85, 10);

  TEST_ASSERT_TRUE(safe.score >= 0 && safe.score <= 47);
  TEST_ASSERT_TRUE(warning.score >= 48 && warning.score <= 74);
  TEST_ASSERT_TRUE(danger.score >= 75 && danger.score <= 100);
}

// ── Main ─────────────────────────────────────────────────────
int main() {
  UNITY_BEGIN();

  RUN_TEST(test_clinical_contract);
  RUN_TEST(test_safe_low_pressure);
  RUN_TEST(test_warning_at_threshold);
  RUN_TEST(test_danger_high_pressure);
  RUN_TEST(test_nan_input_safe);
  RUN_TEST(test_negative_input_safe);
  RUN_TEST(test_extreme_pressure_danger);
  RUN_TEST(test_safe_override_below_threshold);
  RUN_TEST(test_vote_counts_sum_to_tree_count);
  RUN_TEST(test_danger_override_wins_over_rf);
  RUN_TEST(test_safe_to_warning_crossover);
  RUN_TEST(test_pressure_relief_resets);
  RUN_TEST(test_scores_in_band);

  return UNITY_END();
}
