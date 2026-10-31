/**
 * Shared types for the data contract between the ESP32 firmware and the
 * dashboard.
 *
 * The firmware pushes one JSON packet per sample to Firebase RTDB; the
 * dashboard reads it back. Nothing else checks that both sides agree — there
 * is no server to validate the shape — so this file is the single place that
 * states what the wire carries. firmware/src/main.cpp builds the same field
 * names; keep the two in step.
 */

/** The three clinical risk categories, worst last. */
export type RiskLevel = 'safe' | 'warning' | 'danger';

/**
 * The raw packet as it arrives from `readings/latest` or one push under
 * `readings/history`.
 *
 * Every field is `unknown` on purpose. The device is a trust boundary: an
 * out-of-date firmware, a hand-edited database entry, or a mistyped field can
 * put anything here. The mappers coerce each field defensively; typing them as
 * `number` would only move the lie into the compiler.
 */
export interface WireReadingPacket {
  deviceId?: unknown;
  timestamp?: unknown;
  forefoot_kpa?: unknown;
  midfoot_kpa?: unknown;
  heel_kpa?: unknown;
  sustained_duration_sec?: unknown;
  fuzzy_risk_score?: unknown;
  risk_status?: unknown;
  battery_percent?: unknown;
  [key: string]: unknown;
}

/** The three sensor regions, in anatomical order, with derived duration. */
export interface SensorReadings {
  forefoot: number;
  midfoot: number;
  heel: number;
  sustainedDuration: number;
}

/**
 * One packet after validation. This is what the rest of the app consumes.
 *
 * Nullable fields mean "the device did not send a usable value", which the UI
 * must render as unknown rather than as zero.
 */
export interface MappedReading {
  readings: SensorReadings;
  peakPressure: number;
  riskLevel: RiskLevel | null;
  riskScore: number | null;
  batteryPercent: number | null;
  deviceId: string | null;
  /** Epoch milliseconds, or null when no plausible time was sent. */
  timestamp: number | null;
}

/** A history row: a validated packet plus its push key. */
export interface HistoryEntry extends MappedReading {
  id: string;
}

/** Clinical thresholds, in kPa and seconds. Admin-configurable. */
export interface RiskThresholds {
  warningKpa: number;
  dangerKpa: number;
  warningSeconds: number;
  dangerSeconds: number;
}

/** The global risk configuration stored at `config/global` in RTDB. */
export interface GlobalRiskConfig {
  safeThreshold: number;
  dangerThreshold: number;
}
