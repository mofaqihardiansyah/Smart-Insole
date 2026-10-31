/**
 * main.cpp — Smart Insole ESP32 Firmware
 *
 * Hardware:
 *   - ESP32-WROOM-32
 *   - 3× FSR sensors per foot (forefoot, midfoot, heel)
 *   - Active buzzer (local alarm)
 *   - WiFi → Firebase RTDB
 *
 * Flow:
 *   1. Read 3 FSR analog pins → convert to kPa
 *   2. Track sustained duration (consecutive seconds above 35 kPa)
 *   3. Run RandomForest inference → risk level
 *   4. Drive the local buzzer from that level — works with NO internet
 *   5. Upload to Firebase every 2 s (once WiFi AND NTP time are up)
 *
 * The alarm path (sensors → inference → buzzer) never depends on WiFi or
 * Firebase. A dropped connection delays telemetry only; it never silences
 * a danger verdict.
 *
 * Pin mapping (left foot — ESP32 #1):
 *   GPIO34 (ADC1_CH6) → FSR Forefoot
 *   GPIO35 (ADC1_CH7) → FSR Midfoot
 *   GPIO32 (ADC1_CH4) → FSR Heel
 *   GPIO27            → Buzzer (+)
 *
 * NOTE: Calibrate ADC_OFFSET / ADC_TO_KPA in config.h based on your
 *       sensor + voltage divider. See docs/HARDWARE-SPEC.md.
 */

#if defined(__has_include)
#if __has_include("config.h")
#include "config.h"
#else
#error "config.h not found — copy include/config.h.example to include/config.h and fill it in."
#endif
#else
#include "config.h"
#endif

#include <Arduino.h>
#include <WiFi.h>
#include <time.h>
#include <Firebase_ESP_Client.h>

#include "RandomForest.h"
// Threshold constants (WARNING_PEAK_KPA, DANGER_PEAK_KPA) come from the
// generated model data, shared with RandomForest's own inference so the
// sustained-duration accumulator and the classifier can never disagree.
#include "rf-model-data.h"

// ── Runtime state ───────────────────────────────────────────
static RandomForest rf;
static FirebaseData fbdo;
static FirebaseConfig fbConfig;
static FirebaseAuth fbAuth;

static float sustainedDuration = 0.0f;  // seconds above warning threshold
static unsigned long lastSampleMs = 0;
static unsigned long lastPushMs = 0;
static unsigned long lastWifiRetryMs = 0;
static unsigned long lastBuzzerToggleMs = 0;
static bool buzzerOn = false;
static unsigned long pushFailStreak = 0;

// Latest sample, kept so the 2 s push cadence can outlive the 1 s sample
// cadence without re-reading the ADC.
static float lastForefoot = 0.0f;
static float lastMidfoot = 0.0f;
static float lastHeel = 0.0f;
static RiskResult lastResult = {RISK_SAFE, 0, 0, 0, 0};

// ── Helpers ─────────────────────────────────────────────────

// True when config.h carries real credentials instead of the template
// placeholders. Unconfigured firmware still alarms and prints serial.
static bool firebaseConfigured() {
  return strcmp(FIREBASE_HOST, "your-project.firebaseio.com") != 0 &&
         strcmp(FIREBASE_AUTH, "FIREBASE_DATABASE_SECRET_ANDA") != 0;
}

// Timestamps go out in epoch milliseconds. Without NTP the ESP32 clock is
// near 1970, and a 1970 reading sorts before everything and poisons the
// history — so push waits for a plausible time (2020-09-13 or later).
static bool timeSynced() {
  return time(nullptr) > 1600000000L;
}

// Read one FSR and convert to kPa.
static float readFsrKpa(int pin) {
  int raw = analogRead(pin);
  float kPa = (raw - ADC_OFFSET) * ADC_TO_KPA;
  return (kPa > 0.0f) ? kPa : 0.0f;
}

// Update the sustained-duration accumulator (seconds above the warning
// threshold, capped at 60 to bound the value).
static void updateSustainedDuration(float peakPressure, float dtSeconds) {
  if (peakPressure >= WARNING_PEAK_KPA) {
    sustainedDuration += dtSeconds;
  } else {
    sustainedDuration = 0.0f;
  }
  if (sustainedDuration > 60.0f) sustainedDuration = 60.0f;
}

// Drive the local alarm. Danger: fast pulse (300 ms on / 200 ms off).
// Warning: single 100 ms beep every 3 s. Safe: silent. Runs every loop
// tick, offline or online.
static void updateBuzzer(RiskLevel level, unsigned long nowMs) {
  unsigned long onMs = 0;
  unsigned long offMs = 0;

  switch (level) {
    case RISK_DANGER:  onMs = 300; offMs = 200; break;
    case RISK_WARNING: onMs = 100; offMs = 2900; break;
    default: break;  // safe: stays silent
  }

  if (onMs == 0) {
    if (buzzerOn) {
      digitalWrite(PIN_BUZZER, LOW);
      buzzerOn = false;
    }
    return;
  }

  unsigned long interval = buzzerOn ? onMs : offMs;
  if (nowMs - lastBuzzerToggleMs >= interval) {
    buzzerOn = !buzzerOn;
    digitalWrite(PIN_BUZZER, buzzerOn ? HIGH : LOW);
    lastBuzzerToggleMs = nowMs;
  }
}

// Re-attempt WiFi every 10 s while disconnected. Never blocks the loop:
// the alarm keeps running while the link is down.
static void maintainWiFi(unsigned long nowMs) {
  if (WiFi.status() == WL_CONNECTED) return;
  if (nowMs - lastWifiRetryMs < 10000) return;
  lastWifiRetryMs = nowMs;
  WiFi.disconnect();
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.println("[INFO] WiFi reconnecting...");
}

// Push one packet to Firebase:
//   readings/latest  overwritten (set)
//   readings/history appended   (push)
// Field names match the wire contract in
// web-dashboard/src/services/firebaseRealtime.js.
static void pushReadings(time_t timestampSec) {
  FirebaseJson json;
  json.add("deviceId", DEVICE_ID);
  json.add("timestamp", (int64_t)timestampSec * 1000);
  json.add("forefoot_kpa", lastForefoot);
  json.add("midfoot_kpa", lastMidfoot);
  json.add("heel_kpa", lastHeel);
  json.add("sustained_duration_sec", sustainedDuration);
  json.add("fuzzy_risk_score", lastResult.score);
  json.add("risk_status", RandomForest::levelToString(lastResult.level));

  bool latestOk = Firebase.RTDB.setJSON(&fbdo, "/readings/latest", &json);
  bool historyOk = Firebase.RTDB.pushJSON(&fbdo, "/readings/history", &json);

  if (latestOk && historyOk) {
    if (pushFailStreak > 0) {
      Serial.println("[INFO] Firebase push recovered");
    }
    pushFailStreak = 0;
  } else {
    pushFailStreak++;
    // First failure, then every 12th (once a minute at a 2 s cadence).
    if (pushFailStreak == 1 || pushFailStreak % 12 == 0) {
      Serial.printf("[WARN] Firebase push failed: %s\n", fbdo.errorReason().c_str());
    }
  }
}

// ── Setup ───────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(100);

  // ADC configuration (ESP32 12-bit, 0-3.3V)
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db); // full 0-3.3V range

  // Sensor pins
  pinMode(PIN_FSR_FOREFOOT, INPUT);
  pinMode(PIN_FSR_MIDFOOT, INPUT);
  pinMode(PIN_FSR_HEEL, INPUT);

  // Buzzer: silent until the first verdict
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);

  // WiFi: bounded wait at boot (15 s), then the loop retries in the
  // background. Boot must not hang on a missing access point.
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("[INFO] WiFi connecting");
  unsigned long bootWaitStart = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - bootWaitStart < 15000) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("[INFO] WiFi connected: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("[WARN] WiFi down — running offline, retrying every 10s");
  }

  // Wall-clock time for reading timestamps. SNTP keeps retrying on its
  // own once the link is up; pushReadings waits for timeSynced().
  configTime(0, 0, NTP_SERVER_1, NTP_SERVER_2);

  if (firebaseConfigured()) {
    fbConfig.database_url = FIREBASE_HOST;
    fbConfig.signer.tokens.legacy_token = FIREBASE_AUTH;
    Firebase.begin(&fbConfig, &fbAuth);
    Serial.println("[INFO] Firebase configured.");
  } else {
    Serial.println("[INFO] Firebase NOT configured (config.h placeholder) — local alarm + serial only.");
  }

  Serial.println("[INFO] Smart Insole ready.");
  Serial.printf("[INFO] Device ID: %s\n", DEVICE_ID);
  Serial.println("[INFO] RandomForest model loaded (20 trees).");
  Serial.println("---");

  lastSampleMs = millis();
}

// ── Main loop ───────────────────────────────────────────────
void loop() {
  unsigned long now = millis();

  // Alarm first: safety verdicts must not wait on telemetry.
  updateBuzzer(lastResult.level, now);
  maintainWiFi(now);

  if (now - lastSampleMs >= SAMPLE_INTERVAL_MS) {
    float dtSeconds = (now - lastSampleMs) / 1000.0f;
    lastSampleMs = now;

    // 1. Read sensors
    lastForefoot = readFsrKpa(PIN_FSR_FOREFOOT);
    lastMidfoot = readFsrKpa(PIN_FSR_MIDFOOT);
    lastHeel = readFsrKpa(PIN_FSR_HEEL);
    float peakPressure = max(max(lastForefoot, lastMidfoot), lastHeel);

    // 2. Update sustained duration
    updateSustainedDuration(peakPressure, dtSeconds);

    // 3. Run RF inference
    lastResult = rf.predict(peakPressure, sustainedDuration);

    // 4. Print to serial (debug)
    Serial.printf("[%.1fs] F=%.1f M=%.1f H=%.1f kPa | peak=%.1f sust=%.1fs | %s (score=%d)%s\n",
                  now / 1000.0f,
                  lastForefoot, lastMidfoot, lastHeel,
                  peakPressure, sustainedDuration,
                  RandomForest::levelToString(lastResult.level),
                  lastResult.score,
                  buzzerOn ? " | buzzer ON" : "");
  }

  // 5. Upload to Firebase: only when configured, connected, and the
  //    clock is plausible. Telemetry waits; the alarm never does.
  if (firebaseConfigured() &&
      WiFi.status() == WL_CONNECTED &&
      timeSynced() &&
      now - lastPushMs >= FIREBASE_PUSH_MS) {
    lastPushMs = now;
    pushReadings(time(nullptr));
  }

  // Buzzer pattern granularity (~50 ms tick)
  delay(50);
}
