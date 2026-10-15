/**
 * main.cpp — Smart Insole ESP32 Firmware
 *
 * Hardware:
 *   - ESP32-WROOM-32
 *   - 3× FSR sensors per foot (forefoot, midfoot, heel)
 *   - WiFi → Firebase RTDB
 *
 * Flow:
 *   1. Read 3 FSR analog pins → convert to kPa
 *   2. Track sustained duration (consecutive seconds above 35 kPa)
 *   3. Run RandomForest inference → risk level
 *   4. Upload to Firebase every 1 second
 *
 * Pin mapping (left foot — ESP32 #1):
 *   GPIO34 (ADC1_CH6) → FSR Forefoot
 *   GPIO35 (ADC1_CH7) → FSR Midfoot
 *   GPIO32 (ADC1_CH4) → FSR Heel
 *
 * NOTE: Calibrate FSR_TO_KPA based on your sensor + voltage divider.
 *       See docs/HARDWARE-SPEC.md for calibration procedure.
 */

#include <Arduino.h>
#include <WiFi.h>
#include "RandomForest.h"

// ── WiFi & Firebase ──────────────────────────────────────────
// TODO: Fill in your credentials
#define WIFI_SSID     "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Firebase config — see docs/prd-firebase-live-monitoring-admin.md
#define FIREBASE_HOST "your-project.firebaseio.com"
#define FIREBASE_AUTH "your-database-secret"
#define INSOLE_ID     "left"   // "left" or "right"

// ── Sensor pins ──────────────────────────────────────────────
#define PIN_FOREFOOT 34
#define PIN_MIDFOOT  35
#define PIN_HEEL     32

// ── Calibration ──────────────────────────────────────────────
// FSR voltage divider: Vout = Vcc × R_div / (R_fsr + R_div)
// ADC: 0-4095 → 0-3.3V
// Pressure: calibrate with known weights, see HARDWARE-SPEC.md
//
// Placeholder linear mapping (REPLACE WITH YOUR CALIBRATION):
//   kPa = (adc_value - ADC_OFFSET) * ADC_TO_KPA
#define ADC_OFFSET   0.0f
#define ADC_TO_KPA   0.085f   // 4095 × 0.085 ≈ 348 kPa max

// ── Risk thresholds (shared with web dashboard) ─────────────
#define WARNING_KPA  35.0f
#define DANGER_KPA   70.0f

// ── State ────────────────────────────────────────────────────
static RandomForest rf;
static float sustainedDuration = 0.0f;  // seconds above warning threshold
static unsigned long lastSampleMs = 0;
static int historyCount = 0;

// ── Helper: read FSR and convert to kPa ──────────────────────
float readFsrKpa(int pin) {
  int raw = analogRead(pin);
  float kpa = (raw - ADC_OFFSET) * ADC_TO_KPA;
  return (kpa > 0) ? kpa : 0.0f;
}

// ── Helper: get max pressure across 3 regions ────────────────
float getMaxPressure() {
  float forefoot = readFsrKpa(PIN_FOREFOOT);
  float midfoot  = readFsrKpa(PIN_MIDFOOT);
  float heel     = readFsrKpa(PIN_HEEL);

  float maxVal = forefoot;
  if (midfoot > maxVal) maxVal = midfoot;
  if (heel > maxVal) maxVal = heel;

  return maxVal;
}

// ── Helper: update sustained duration ────────────────────────
void updateSustainedDuration(float peakPressure, float dtSeconds) {
  if (peakPressure >= WARNING_KPA) {
    sustainedDuration += dtSeconds;
  } else {
    sustainedDuration = 0.0f;
  }

  // Cap at 60 seconds to avoid overflow
  if (sustainedDuration > 60.0f) sustainedDuration = 60.0f;
}

// ── Setup ────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(100);

  // ADC configuration (ESP32 12-bit, 0-3.3V)
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db); // full 0-3.3V range

  // Sensor pins
  pinMode(PIN_FOREFOOT, INPUT);
  pinMode(PIN_MIDFOOT, INPUT);
  pinMode(PIN_HEEL, INPUT);

  // WiFi connect
  Serial.println("[INFO] Connecting to WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.printf("[INFO] WiFi connected: %s\n", WiFi.localIP().toString().c_str());

  // TODO: Initialize Firebase connection here
  // Firebase.begin(FIREBASE_HOST, FIREBASE_AUTH);

  Serial.println("[INFO] Smart Insole ready.");
  Serial.printf("[INFO] Insole ID: %s\n", INSOLE_ID);
  Serial.println("[INFO] RandomForest model loaded (20 trees).");
  Serial.println("---");

  lastSampleMs = millis();
}

// ── Main loop ────────────────────────────────────────────────
void loop() {
  unsigned long now = millis();
  float dtSeconds = (now - lastSampleMs) / 1000.0f;
  lastSampleMs = now;

  // 1. Read sensors
  float forefoot = readFsrKpa(PIN_FOREFOOT);
  float midfoot  = readFsrKpa(PIN_MIDFOOT);
  float heel     = readFsrKpa(PIN_HEEL);
  float peakPressure = max(max(forefoot, midfoot), heel);

  // 2. Update sustained duration
  updateSustainedDuration(peakPressure, dtSeconds);

  // 3. Run RF inference
  RiskResult result = rf.predict(peakPressure, sustainedDuration);

  // 4. Print to serial (debug)
  Serial.printf("[%.1fs] F=%.1f M=%.1f H=%.1f kPa | peak=%.1f sust=%.1fs | %s (score=%d)\n",
                now / 1000.0f,
                forefoot, midfoot, heel,
                peakPressure, sustainedDuration,
                RandomForest::levelToString(result.level),
                result.score);

  // 5. TODO: Upload to Firebase
  // String path = "/insoles/" + String(INSOLE_ID) + "/readings";
  // Firebase.pushJSON(path, jsonPayload);

  // 6. Sample at 1 Hz
  delay(1000);
}
