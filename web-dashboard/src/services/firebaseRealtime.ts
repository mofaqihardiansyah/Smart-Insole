/**
 * Realtime Database ingestion for the insole.
 *
 * One job: turn whatever the ESP32 publishes into the app's internal shape, and
 * report failures honestly instead of silently showing zeros.
 *
 * The wire format is the one documented in the technical spec:
 *
 *   devices/<id>/readings/latest    { deviceId, timestamp, forefoot_kpa, ... }
 *   devices/<id>/readings/history   { <pushId>: { timestamp, ... } }
 *
 * The legacy single-tenant `readings/...` paths are still read when the account
 * has no paired device, so the dashboard survives the migration to per-device
 * data until every insole is reflashed.
 *
 * The firmware computes its own Random Forest risk. When it provides
 * `risk_status` and `risk_score`, those are authoritative and the client uses
 * them; the client only runs its own inference when the device has not sent a
 * verdict. That keeps the client and the firmware from disagreeing about the
 * same foot.
 */

import { ref, onValue, query, limitToLast, set, push, get, remove } from 'firebase/database';
import { realtimeDb } from './firebaseConfig';
import type {
  HistoryEntry,
  MappedReading,
  RiskLevel,
  WireReadingPacket,
} from '../types/insole';

export const READINGS_PATH = 'readings/latest';
export const HISTORY_PATH = 'readings/history';

/**
 * Per-device paths. The firmware writes under its own device id, and the rules
 * only let a user read a device they are paired with, so two accounts can no
 * longer watch the same foot.
 */
export const deviceReadingsPath = (deviceId: string) =>
  `devices/${deviceId}/readings/latest`;
export const deviceHistoryPath = (deviceId: string) =>
  `devices/${deviceId}/readings/history`;
export const userDevicesPath = (uid: string) => `users/${uid}/devices`;

/** Admin-only audit trail, one node per action: `/audit/<pushId>`. */
export const AUDIT_PATH = 'audit';

/** Admin-only incident triage: `/triage/<deviceId>/<pushId>`. */
export const triagePath = (deviceId: string) =>
  `triage/${deviceId}`;

/** One administrative action, as the console records it. */
export interface AuditEntry {
  actorUid: string;
  actorEmail: string | null;
  /** Stable verb, e.g. "user.deactivate", "device.pair". */
  action: string;
  /** uid, deviceId, or another identifier the action touched. */
  target: string | null;
  /** Free-form before/after summary, already human readable. */
  detail?: string | null;
  at: number;
}

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

  const riskScore = toFiniteNumber(wire.risk_score);

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
 * Subscribe to one device's latest reading.
 */
export function subscribeToDeviceReadings(
  deviceId: string,
  onData: (reading: MappedReading) => void,
  onError?: (error: Error) => void
): () => void {
  const readingRef = ref(realtimeDb, deviceReadingsPath(deviceId));

  return onValue(
    readingRef,
    (snapshot) => {
      const mapped = mapReadingPacket(snapshot.val());
      if (mapped) onData(mapped);
    },
    (error) => {
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  );
}

/**
 * Subscribe to one device's recent history, newest first.
 */
export function subscribeToDeviceHistory(
  deviceId: string,
  onData: (rows: HistoryEntry[]) => void,
  onError?: (error: Error) => void,
  limit = 50
): () => void {
  const historyQuery = query(
    ref(realtimeDb, deviceHistoryPath(deviceId)),
    limitToLast(limit)
  );

  return onValue(
    historyQuery,
    (snapshot) => {
      onData(mapHistory(snapshot.val(), limit));
    },
    (error) => {
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  );
}

/**
 * The device ids paired with this account. Empty until an admin pairs one; the
 * provider then falls back to the legacy single-tenant paths so a demo keeps
 * working before the firmware is reflashed.
 */
export function subscribeToUserDevices(
  uid: string,
  onData: (deviceIds: string[]) => void,
  onError?: (error: Error) => void
): () => void {
  return onValue(
    ref(realtimeDb, userDevicesPath(uid)),
    (snapshot) => {
      const value = snapshot.val() as Record<string, unknown> | null;
      onData(
        value
          ? Object.keys(value).filter((key) => value[key] === true)
          : []
      );
    },
    (error) => {
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  );
}

/* ---------------------------- admin console ---------------------------- */

/** Every device id that has ever reported. Admin-only by rules. */
export function subscribeToDeviceIds(
  onData: (deviceIds: string[]) => void,
  onError?: (error: Error) => void
): () => void {
  return onValue(
    ref(realtimeDb, 'devices'),
    (snapshot) => {
      const value = snapshot.val() as Record<string, unknown> | null;
      onData(value ? Object.keys(value) : []);
    },
    (error) => {
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  );
}

/** Pairing map for the whole fleet: `{ uid: [deviceId, ...] }`. */
export function subscribeToAllUserDevices(
  onData: (byUid: Record<string, string[]>) => void,
  onError?: (error: Error) => void
): () => void {
  return onValue(
    ref(realtimeDb, 'users'),
    (snapshot) => {
      const value = snapshot.val() as Record<string, { devices?: Record<string, unknown> }> | null;
      const map: Record<string, string[]> = {};
      for (const [uid, entry] of Object.entries(value ?? {})) {
        const devices = entry?.devices ?? {};
        map[uid] = Object.keys(devices).filter((key) => devices[key] === true);
      }
      onData(map);
    },
    (error) => {
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  );
}

/** Pair one device with one account. Admin-only by rules. */
export function pairDevice(uid: string, deviceId: string): Promise<void> {
  return set(ref(realtimeDb, `${userDevicesPath(uid)}/${deviceId}`), true);
}

/** Remove one pairing. */
export function unpairDevice(uid: string, deviceId: string): Promise<void> {
  return remove(ref(realtimeDb, `${userDevicesPath(uid)}/${deviceId}`));
}

/**
 * Mirror an account flag into RTDB, which is the only store the database rules
 * can read. Firestore stays the source of truth for the admin console.
 */
export function mirrorAccountFlag(
  uid: string,
  field: 'role' | 'active',
  value: string | boolean
): Promise<void> {
  return set(ref(realtimeDb, `users/${uid}/${field}`), value);
}

/** Drop the whole pair of RTDB mirrors for a deleted account. */
export function removeUserMirror(uid: string): Promise<void> {
  return remove(ref(realtimeDb, `users/${uid}`));
}

/** Append one audit entry. Admin-only by rules. */
export function appendAudit(entry: AuditEntry): Promise<void> {
  return push(ref(realtimeDb, AUDIT_PATH), entry).then(() => undefined);
}

/** Newest audit entries first. */
export function subscribeToAudit(
  onData: (entries: AuditEntry[]) => void,
  limit = 50,
  onError?: (error: Error) => void
): () => void {
  const auditQuery = query(ref(realtimeDb, AUDIT_PATH), limitToLast(limit));
  return onValue(
    auditQuery,
    (snapshot) => {
      const value = snapshot.val() as Record<string, AuditEntry> | null;
      const rows = Object.values(value ?? {});
      onData(rows.sort((a, b) => b.at - a.at));
    },
    (error) => {
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  );
}

/** History rows that carry their push id, so triage can key on them. */
export interface HistoryRowWithId extends HistoryEntry {
  id: string;
}

export function subscribeToDeviceHistoryWithIds(
  deviceId: string,
  onData: (rows: HistoryRowWithId[]) => void,
  limit = 100,
  onError?: (error: Error) => void
): () => void {
  const historyQuery = query(
    ref(realtimeDb, deviceHistoryPath(deviceId)),
    limitToLast(limit)
  );
  return onValue(
    historyQuery,
    (snapshot) => {
      const value = snapshot.val() as Record<string, unknown> | null;
      const entries = Object.entries(value ?? {});
      const mapped = entries.map(([id, raw]) => ({
        ...(mapReadingPacket(raw) ?? {}),
        id,
      })) as HistoryRowWithId[];
      onData(mapped.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)));
    },
    (error) => {
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  );
}

/** Raw history snapshot, used by the archive-before-prune action. */
export async function getDeviceHistory(
  deviceId: string
): Promise<Record<string, unknown>> {
  const snapshot = await get(ref(realtimeDb, deviceHistoryPath(deviceId)));
  return (snapshot.val() as Record<string, unknown> | null) ?? {};
}

export interface TriageMark {
  ackBy: string;
  ackAt: number;
}

export function subscribeToTriage(
  deviceId: string,
  onData: (marks: Record<string, TriageMark>) => void,
  onError?: (error: Error) => void
): () => void {
  return onValue(
    ref(realtimeDb, triagePath(deviceId)),
    (snapshot) => {
      onData((snapshot.val() as Record<string, TriageMark> | null) ?? {});
    },
    (error) => {
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  );
}

export function acknowledgeIncident(
  deviceId: string,
  pushId: string,
  uid: string
): Promise<void> {
  return set(ref(realtimeDb, `${triagePath(deviceId)}/${pushId}`), {
    ackBy: uid,
    ackAt: Date.now(),
  });
}

export function clearIncidentAck(
  deviceId: string,
  pushId: string
): Promise<void> {
  return remove(ref(realtimeDb, `${triagePath(deviceId)}/${pushId}`));
}

/**
 * Delete history rows older than `beforeMs` for one device.
 *
 * Split into deleted/failed so a partial prune is reported instead of looking
 * complete. The caller downloads the archive first; this function cannot know
 * whether that happened.
 */
export async function pruneDeviceHistory(
  deviceId: string,
  beforeMs: number,
  onProgress?: (done: number, total: number) => void
): Promise<{ deleted: number; failed: number; total: number }> {
  const snapshot = await get(ref(realtimeDb, deviceHistoryPath(deviceId)));
  const value = snapshot.val() as Record<string, { timestamp?: number }> | null;
  const stale = Object.entries(value ?? {}).filter(
    ([, row]) => typeof row?.timestamp === 'number' && row.timestamp < beforeMs
  );

  let deleted = 0;
  let failed = 0;
  for (const [key] of stale) {
    try {
      await remove(ref(realtimeDb, `${deviceHistoryPath(deviceId)}/${key}`));
      deleted += 1;
    } catch {
      failed += 1;
    }
    onProgress?.(deleted + failed, stale.length);
  }
  return { deleted, failed, total: stale.length };
}

export default {
  READINGS_PATH,
  HISTORY_PATH,
  SENSOR_KEYS,
  subscribeToReadings,
  subscribeToHistory,
  mapReadingPacket,
  mapHistory,
  subscribeToDeviceReadings,
  subscribeToDeviceHistory,
  subscribeToUserDevices,
  subscribeToDeviceIds,
  subscribeToAllUserDevices,
  pairDevice,
  unpairDevice,
  mirrorAccountFlag,
  removeUserMirror,
  appendAudit,
  subscribeToAudit,
  subscribeToDeviceHistoryWithIds,
  subscribeToTriage,
  acknowledgeIncident,
  clearIncidentAck,
  pruneDeviceHistory,
};
