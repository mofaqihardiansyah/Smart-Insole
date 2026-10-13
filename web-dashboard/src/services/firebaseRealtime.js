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

export const READINGS_PATH = 'readings/latest';
export const HISTORY_PATH = 'readings/history';
export const GLOBAL_CONFIG_PATH = 'config/global';

/** The three sensor points, in anatomical order. */
export const SENSOR_KEYS = ['forefoot', 'midfoot', 'heel'];

const toFiniteNumber = (value) => {
  const n = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(n) ? n : null;
};

/**
 * Normalise a device timestamp to milliseconds.
 *
 * The spec's example is milliseconds, but an ESP32 sketch that pushes
 * `time(nullptr)` gives seconds. Treating a seconds value as milliseconds would
 * place the reading in 1970 and break ordering, so values below the
 * millisecond epoch of 2001 are read as seconds.
 */
const toMillis = (value) => {
  const n = toFiniteNumber(value);
  if (n === null) return null;
  return n < 1e12 ? Math.round(n * 1000) : Math.round(n);
};

/** 'DANGER' | 'danger' -> 'danger'. Anything unrecognised -> null. */
const normaliseRiskLevel = (value) => {
  if (typeof value !== 'string') return null;
  const lowered = value.trim().toLowerCase();
  return ['safe', 'warning', 'danger'].includes(lowered) ? lowered : null;
};

/**
 * Map one raw packet onto the internal reading shape.
 *
 * Returns `null` for an empty snapshot so callers can distinguish "the device
 * has never written" from "the device wrote zeros".
 *
 * @param {object|null|undefined} packet
 * @returns {null | {
 *   readings: { forefoot: number, midfoot: number, heel: number, sustainedDuration: number },
 *   peakPressure: number,
 *   riskLevel: 'safe'|'warning'|'danger'|null,
 *   riskScore: number|null,
 *   batteryPercent: number|null,
 *   deviceId: string|null,
 *   timestamp: number|null
 * }}
 */
export function mapReadingPacket(packet) {
  if (!packet || typeof packet !== 'object') return null;

  const readings = {
    forefoot: toFiniteNumber(packet.forefoot_kpa) ?? 0,
    midfoot: toFiniteNumber(packet.midfoot_kpa) ?? 0,
    heel: toFiniteNumber(packet.heel_kpa) ?? 0,
    sustainedDuration: toFiniteNumber(packet.sustained_duration_sec) ?? 0,
  };

  const riskScore = toFiniteNumber(packet.fuzzy_risk_score);

  return {
    readings,
    peakPressure: Math.max(readings.forefoot, readings.midfoot, readings.heel),
    riskLevel: normaliseRiskLevel(packet.risk_status),
    riskScore: riskScore === null ? null : Math.round(riskScore),
    batteryPercent: toFiniteNumber(packet.battery_percent),
    deviceId: typeof packet.deviceId === 'string' ? packet.deviceId : null,
    timestamp: toMillis(packet.timestamp),
  };
}

/**
 * Map the `readings/history` object into an array, newest first.
 *
 * @param {object|null|undefined} historyObject
 * @param {number} [limit=50]
 * @returns {Array<ReturnType<typeof mapReadingPacket> & { id: string }>}
 */
export function mapHistory(historyObject, limit = 50) {
  if (!historyObject || typeof historyObject !== 'object') return [];

  return Object.entries(historyObject)
    .map(([id, packet]) => {
      const mapped = mapReadingPacket(packet);
      return mapped ? { id, ...mapped } : null;
    })
    .filter(Boolean)
    .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
    .slice(0, limit);
}

/**
 * Subscribe to the latest reading.
 *
 * @param {(reading: NonNullable<ReturnType<typeof mapReadingPacket>>) => void} onData
 *   Called on every device update. Not called for an empty snapshot.
 * @param {(error: Error) => void} onError
 *   Called for permission and network failures so the caller can fall back to
 *   the simulator and say so.
 * @returns {() => void} unsubscribe
 */
export function subscribeToReadings(onData, onError) {
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
 *
 * @param {(rows: ReturnType<typeof mapHistory>) => void} onData
 * @param {(error: Error) => void} onError
 * @param {number} [limit=50]
 * @returns {() => void} unsubscribe
 */
export function subscribeToHistory(onData, onError, limit = 50) {
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
 *
 * @param {(percent: number|null) => void} onData
 * @param {(error: Error) => void} onError
 * @returns {() => void} unsubscribe
 */
export function subscribeToBattery(onData, onError) {
  return subscribeToReadings(
    (reading) => onData(reading.batteryPercent),
    onError
  );
}

/**
 * Subscribe to the global risk thresholds (admin-configured).
 *
 * @param {(config: { safeThreshold: number, dangerThreshold: number }) => void} onData
 * @param {(error: Error) => void} onError
 * @returns {() => void} unsubscribe
 */
export function subscribeToGlobalConfig(onData, onError) {
  const configRef = ref(realtimeDb, GLOBAL_CONFIG_PATH);

  const unsubscribe = onValue(
    configRef,
    (snapshot) => {
      const value = snapshot.val();
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
 * Write the global risk thresholds (admin only).
 *
 * @param {{ safeThreshold: number, dangerThreshold: number }} config
 * @returns {Promise<void>}
 */
export function setGlobalConfig(config) {
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
