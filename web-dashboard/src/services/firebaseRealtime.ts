/**
 * Realtime Database ingestion for the insole.
 *
 * One job: turn whatever the ESP32 publishes into the app's internal shape, and
 * report failures honestly instead of silently showing zeros.
 *
 * The wire format is the one documented in the technical spec:
 *
 *   readings/latest    { deviceId, timestamp, forefoot_kpa, midfoot_kpa,
 *                        heel_kpa, sustained_duration_sec, fuzzy_risk_score,
 *                        risk_status, battery_percent }
 *   readings/history   { <pushId>: { timestamp, forefoot_kpa, ... } }
 *
 * The firmware computes its own fuzzy risk. When it provides `risk_status` and
 * `fuzzy_risk_score`, those are authoritative and the client uses them; the
 * client only runs its own inference when the device has not sent a verdict.
 * That keeps the client and the firmware from disagreeing about the same foot.
 */

import { ref, onValue, query, limitToLast, set } from 'firebase/database';
import { realtimeDb } from './firebaseConfig';
import type {
  GlobalRiskConfig,
  HistoryEntry,
  MappedReading,
  RiskLevel,
  WireReadingPacket,
} from '../types/insole';

export const READINGS_PATH = 'readings/latest';
export const HISTORY_PATH = 'readings/history';
export const GLOBAL_CONFIG_PATH = 'config/global';

/** The three sensor points, in anatomical order. */
export const SENSOR_KEYS = ['forefoot', 'midfoot', 'heel'] as const;

const toFiniteNumber = (value: unknown): number | null => {
  const n = typeof value === 'string' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

/**
 * Normalise a device timestamp to milliseconds.
 *
 * The spec's example is milliseconds, but an ESP32 sketch that pushes
 * `time(nullptr)` gives seconds. Treating a seconds value as milliseconds would
 * place the reading in 1970 and break ordering, so values below the
 * millisecond epoch of 2001 are read as seconds.
 */
const toMillis = (value: unknown): number | null => {
  const n = toFiniteNumber(value);
  if (n === null) return null;
  return n < 1e12 ? Math.round(n * 1000) : Math.round(n);
};

/** 'DANGER' | 'danger' -> 'danger'. Anything unrecognised -> null. */
const normaliseRiskLevel = (value: unknown): RiskLevel | null => {
  if (typeof value !== 'string') return null;
  const lowered = value.trim().toLowerCase();
  return lowered === 'safe' || lowered === 'warning' || lowered === 'danger'
    ? lowered
    : null;
};

/**
 * Map one raw packet onto the internal reading shape.
 *
 * Returns `null` for an empty snapshot so callers can distinguish "the device
 * has never written" from "the device wrote zeros".
 */
export function mapReadingPacket(packet: unknown): MappedReading | null {
  if (!packet || typeof packet !== 'object') return null;
  const wire = packet as WireReadingPacket;

  const readings = {
    forefoot: toFiniteNumber(wire.forefoot_kpa) ?? 0,
    midfoot: toFiniteNumber(wire.midfoot_kpa) ?? 0,
    heel: toFiniteNumber(wire.heel_kpa) ?? 0,
    sustainedDuration: toFiniteNumber(wire.sustained_duration_sec) ?? 0,
  };

  const riskScore = toFiniteNumber(wire.fuzzy_risk_score);

  return {
    readings,
    peakPressure: Math.max(readings.forefoot, readings.midfoot, readings.heel),
    riskLevel: normaliseRiskLevel(wire.risk_status),
    riskScore: riskScore === null ? null : Math.round(riskScore),
    batteryPercent: toFiniteNumber(wire.battery_percent),
    deviceId: typeof wire.deviceId === 'string' ? wire.deviceId : null,
    timestamp: toMillis(wire.timestamp),
  };
}

/**
 * Map the `readings/history` object into an array, newest first.
 */
export function mapHistory(historyObject: unknown, limit = 50): HistoryEntry[] {
  if (!historyObject || typeof historyObject !== 'object') return [];

  return Object.entries(historyObject as Record<string, unknown>)
    .map(([id, packet]): HistoryEntry | null => {
      const mapped = mapReadingPacket(packet);
      return mapped ? { id, ...mapped } : null;
    })
    .filter((entry): entry is HistoryEntry => entry !== null)
    .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
    .slice(0, limit);
}

/**
 * Subscribe to the latest reading.
 *
 * @param onData Called on every device update. Not called for an empty snapshot.
 * @param onError Called for permission and network failures so the caller can
 *   report the connection as failed and show the retry control.
 * @returns unsubscribe
 */
export function subscribeToReadings(
  onData: (reading: MappedReading) => void,
  onError?: (error: Error) => void
): () => void {
  const readingRef = ref(realtimeDb, READINGS_PATH);

  const unsubscribe = onValue(
    readingRef,
    (snapshot) => {
      const mapped = mapReadingPacket(snapshot.val());
      if (mapped) onData(mapped);
    },
    (error) => {
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  );

  return unsubscribe;
}

/**
 * Subscribe to recent history entries, newest first.
 */
export function subscribeToHistory(
  onData: (rows: HistoryEntry[]) => void,
  onError?: (error: Error) => void,
  limit = 50
): () => void {
  const historyQuery = query(ref(realtimeDb, HISTORY_PATH), limitToLast(limit));

  const unsubscribe = onValue(
    historyQuery,
    (snapshot) => {
      onData(mapHistory(snapshot.val(), limit));
    },
    (error) => {
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  );

  return unsubscribe;
}

/**
 * Subscribe to the device's battery level.
 *
 * Battery lives on the same `readings/latest` packet, so this is a convenience
 * alias that reads the same node and reports only the percentage. It exists so
 * the Device page does not have to know the packet layout.
 */
export function subscribeToBattery(
  onData: (percent: number | null) => void,
  onError?: (error: Error) => void
): () => void {
  return subscribeToReadings(
    (reading) => onData(reading.batteryPercent),
    onError
  );
}

/**
 * Subscribe to the global risk thresholds (admin-configured).
 */
export function subscribeToGlobalConfig(
  onData: (config: GlobalRiskConfig) => void,
  onError?: (error: Error) => void
): () => void {
  const configRef = ref(realtimeDb, GLOBAL_CONFIG_PATH);

  const unsubscribe = onValue(
    configRef,
    (snapshot) => {
      const value = snapshot.val() as Partial<GlobalRiskConfig> | null;
      onData({
        safeThreshold: Number(value?.safeThreshold) || 35,
        dangerThreshold: Number(value?.dangerThreshold) || 70,
      });
    },
    (error) => {
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  );

  return unsubscribe;
}

/**
 * Write the global risk thresholds (admin only; the RTDB rules are what
 * actually enforce that — this function does not check).
 */
export function setGlobalConfig(config: GlobalRiskConfig): Promise<void> {
  return set(ref(realtimeDb, GLOBAL_CONFIG_PATH), config);
}

export default {
  READINGS_PATH,
  HISTORY_PATH,
  GLOBAL_CONFIG_PATH,
  SENSOR_KEYS,
  subscribeToReadings,
  subscribeToHistory,
  subscribeToBattery,
  subscribeToGlobalConfig,
  setGlobalConfig,
  mapReadingPacket,
  mapHistory,
};
