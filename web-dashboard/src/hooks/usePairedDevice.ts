import { useCallback, useEffect, useState } from 'react';
import { subscribeToUserDevices } from '../services/firebaseRealtime';

/**
 * The devices this account is paired with, and the one on screen.
 *
 * Pairing lives at `users/<uid>/devices/<deviceId>: true` in the Realtime
 * Database and is written by an admin. Two boards per patient are normal now:
 * `insole-01` and `insole-02`, one per foot. The data layer already returns
 * every paired id, so the only decision here is which of them the app reads.
 *
 * The choice is persisted per account. A stored id that is no longer paired is
 * dropped instead of shown, because a dashboard pointed at a device the rules
 * deny would sit on an error screen with no explanation.
 *
 * Until a device is paired the hook returns an empty list, which keeps the
 * provider on the legacy single-tenant paths.
 */
export interface PairedDeviceState {
  /** Every paired id, sorted so the default does not depend on key order. */
  deviceIds: string[];
  /** The device currently being read, or null for the legacy paths. */
  deviceId: string | null;
  selectDevice: (id: string) => void;
}

const storageKey = (uid: string) => `pairedDeviceId:${uid}`;

const readStored = (uid: string): string | null => {
  try {
    return localStorage.getItem(storageKey(uid));
  } catch {
    return null;
  }
};

const writeStored = (uid: string, id: string) => {
  try {
    localStorage.setItem(storageKey(uid), id);
  } catch {
    /* storage unavailable (private mode); the choice simply will not persist */
  }
};

export function usePairedDevice(uid?: string | null): PairedDeviceState {
  const [deviceIds, setDeviceIds] = useState<string[]>([]);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setDeviceIds([]);
      setDeviceId(null);
      return undefined;
    }

    // A different account must not inherit the previous one's list while the
    // subscription is still opening.
    setDeviceIds([]);
    setDeviceId(null);

    let unsubscribe = () => {};
    try {
      unsubscribe = subscribeToUserDevices(
        uid,
        (ids) => {
          const sorted = [...ids].sort();
          setDeviceIds(sorted);
          setDeviceId((previous) => {
            if (previous && sorted.includes(previous)) return previous;
            const stored = readStored(uid);
            if (stored && sorted.includes(stored)) return stored;
            return sorted[0] ?? null;
          });
        },
        () => {
          setDeviceIds([]);
          setDeviceId(null);
        }
      );
    } catch {
      // Denied or offline: keep the legacy feed rather than showing nothing.
      setDeviceIds([]);
      setDeviceId(null);
    }
    return () => unsubscribe?.();
  }, [uid]);

  const selectDevice = useCallback(
    (id: string) => {
      setDeviceId(id);
      if (uid) writeStored(uid, id);
    },
    [uid]
  );

  return { deviceIds, deviceId, selectDevice };
}

export default usePairedDevice;
