/**
 * test_randomforest.cpp — Unit tests for RandomForest inference.
 *
 * Kontrak 2 kelas: `safe` dan `warning`. Ambang dari header model
 * (WARNING_PEAK_KPA, sekarang 45). Tidak ada level bahaya, dan durasi tidak
 * pernah menaikkan level sendiri — ia hanya fitur model.
 *
 * Mirrors web-dashboard src/utils/randomForestRisk.test.
 * Run: pio test -e native
 */

#include <unity.h>
#include <cstdio>
#include "RandomForest.h"
#include "rf-model-data.h"

static RandomForest rf;

// ── Contract test cases ─────────────────────────────────────
// {peak, sustained_seconds, expected_level}

struct TestCase {
  float peak;
  float sustained;
  RiskLevel expected;
  const char* label;
};

static const TestCase CASES[] = {
  // Safe: well below the warning limit
  {0,  0,  RISK_SAFE, "0 kPa, 0s"},
  {12, 0,  RISK_SAFE, "12 kPa, 0s"},
  {25, 0,  RISK_SAFE, "25 kPa, 0s"},
  {40, 0,  RISK_SAFE, "40 kPa, 0s"},
  {40, 3,  RISK_SAFE, "40 kPa, 3s"},

  // Warning: at or above the warning limit
  {45, 1,  RISK_WARNING, "45 kPa, 1s (batas)"},
  {50, 1,  RISK_WARNING, "50 kPa, 1s"},
  {60, 5,  RISK_WARNING, "60 kPa, 5s"},
  {80, 2,  RISK_WARNING, "80 kPa, 2s"},

  // Tidak ada level bahaya: tekanan sangat tinggi tetap warning
  {200, 1,  RISK_WARNING, "200 kPa, 1s"},
  {210, 45, RISK_WARNING, "210 kPa, 45s"},
  {500, 60, RISK_WARNING, "500 kPa, 60s"},
};

static const int NUM_CASES = sizeof(CASES) / sizeof(TestCase);

// ── Individual test functions ───────────────────────────────

void test_contract(void) {
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
  TEST_ASSERT_TRUE(r.score >= 0 && r.score <= 47);
}

void test_warning_at_limit(void) {
  RiskResult r = rf.predict((float)WARNING_PEAK_KPA, 1);
  TEST_ASSERT_EQUAL(RISK_WARNING, r.level);
  TEST_ASSERT_TRUE(r.score >= 48 && r.score <= 74);
}

void test_crossover_between_40_and_limit(void) {
  // Jangan mengunci titik potong persis: pohon memilih ambang dari kandidat
  // kuantil, jadi bisa meleset beberapa persepuluh kPa dari angka bulat.
  // Yang dikunci adalah kontrak di kedua sisinya.
  TEST_ASSERT_EQUAL(RISK_SAFE, rf.predict(40, 0).level);
  TEST_ASSERT_EQUAL(RISK_WARNING, rf.predict((float)WARNING_PEAK_KPA, 1).level);
}

void test_no_danger_level(void) {
  // Level tertinggi adalah warning, sekeras apa pun tekanannya.
  RiskResult r = rf.predict(500, 60);
  TEST_ASSERT_EQUAL(RISK_WARNING, r.level);
  TEST_ASSERT_TRUE(r.score <= 74);
}

void test_nan_input_safe(void) {
  RiskResult r = rf.predict(NAN, NAN);
  TEST_ASSERT_EQUAL(RISK_SAFE, r.level);
}

void test_negative_input_safe(void) {
  RiskResult r = rf.predict(-10, -5);
  TEST_ASSERT_EQUAL(RISK_SAFE, r.level);
}

void test_vote_counts_are_positive(void) {
  // Votes are raw leaf counts, so they sum to the leaf population across the
  // forest, not to the number of trees. What matters is that both are real
  // counts and that the pair is non-empty.
  RiskResult r = rf.predict(50, 5);
  TEST_ASSERT_TRUE(r.safeVotes + r.warningVotes > 0);
  TEST_ASSERT_TRUE(r.safeVotes >= 0);
  TEST_ASSERT_TRUE(r.warningVotes >= 0);
}

void test_pressure_relief_resets(void) {
  RiskResult high = rf.predict(80, 5);
  TEST_ASSERT_EQUAL(RISK_WARNING, high.level);

  RiskResult relief = rf.predict(12, 0);
  TEST_ASSERT_EQUAL(RISK_SAFE, relief.level);
}

void test_scores_in_band(void) {
  RiskResult safe = rf.predict(15, 0);
  RiskResult warning = rf.predict(50, 5);

  TEST_ASSERT_TRUE(safe.score >= 0 && safe.score <= 47);
  TEST_ASSERT_TRUE(warning.score >= 48 && warning.score <= 74);
}

// ── Main ─────────────────────────────────────────────────────
int main() {
  UNITY_BEGIN();

  RUN_TEST(test_contract);
  RUN_TEST(test_safe_low_pressure);
  RUN_TEST(test_warning_at_limit);
  RUN_TEST(test_crossover_between_40_and_limit);
  RUN_TEST(test_no_danger_level);
  RUN_TEST(test_nan_input_safe);
  RUN_TEST(test_negative_input_safe);
  RUN_TEST(test_vote_counts_are_positive);
  RUN_TEST(test_pressure_relief_resets);
  RUN_TEST(test_scores_in_band);

  return UNITY_END();
}
