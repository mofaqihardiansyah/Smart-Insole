import { useEffect, useState } from 'react';
import { subscribeToUserDevices } from '../services/firebaseRealtime';

/**
 * The device this account is paired with.
 *
 * Pairing lives at `users/<uid>/devices/<deviceId>: true` in the Realtime
 * Database and is written by an admin. Until a device is paired the hook
 * returns null and the provider keeps reading the legacy single-tenant paths,
 * so the dashboard is never blank merely because the pairing migration has not
 * reached this account yet.
 *
 * The first paired id wins. A multi-insole switcher is a later feature; this
 * hook is the one place that decision lives.
 */
export function usePairedDevice(uid?: string | null): string | null {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setDeviceId(null);
      return undefined;
    }

    let unsubscribe = () => {};
    try {
      unsubscribe = subscribeToUserDevices(
        uid,
        (ids) => setDeviceId(ids[0] ?? null),
        () => setDeviceId(null)
      );
    } catch {
      // Denied or offline: keep the legacy feed rather than showing nothing.
      setDeviceId(null);
    }
    return () => unsubscribe?.();
  }, [uid]);

  return deviceId;
}

export default usePairedDevice;
