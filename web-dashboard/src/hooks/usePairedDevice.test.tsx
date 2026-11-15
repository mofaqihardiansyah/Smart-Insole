import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePairedDevice } from './usePairedDevice';

/**
 * The hook is the only place that decides which paired device the app reads.
 * Two boards per patient are the normal case, so the tests cover the default,
 * a stored choice, a stale stored choice, and an account change.
 */
const mocks = vi.hoisted(() => ({
  emit: null as null | ((ids: string[]) => void),
  fail: null as null | ((error: Error) => void),
}));

vi.mock('../services/firebaseRealtime', () => ({
  subscribeToUserDevices: (
    _uid: string,
    onData: (ids: string[]) => void,
    onError?: (error: Error) => void
  ) => {
    mocks.emit = onData;
    mocks.fail = onError ?? null;
    return () => {
      mocks.emit = null;
      mocks.fail = null;
    };
  },
}));

const push = (ids: string[]) =>
  act(() => {
    mocks.emit?.(ids);
  });

describe('usePairedDevice', () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.emit = null;
    mocks.fail = null;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('reads every paired device and defaults to the first one, sorted', () => {
    const { result } = renderHook(() => usePairedDevice('u1'));

    push(['insole-02', 'insole-01']);

    expect(result.current.deviceIds).toEqual(['insole-01', 'insole-02']);
    expect(result.current.deviceId).toBe('insole-01');
  });

  it('keeps a stored choice that is still paired', () => {
    localStorage.setItem('pairedDeviceId:u1', 'insole-02');
    const { result } = renderHook(() => usePairedDevice('u1'));

    push(['insole-01', 'insole-02']);

    expect(result.current.deviceId).toBe('insole-02');
  });

  it('drops a stored choice that is no longer paired', () => {
    localStorage.setItem('pairedDeviceId:u1', 'insole-99');
    const { result } = renderHook(() => usePairedDevice('u1'));

    push(['insole-01', 'insole-02']);

    expect(result.current.deviceId).toBe('insole-01');
  });

  it('persists a selection and keeps it across a new snapshot', () => {
    const { result } = renderHook(() => usePairedDevice('u1'));
    push(['insole-01', 'insole-02']);

    act(() => {
      result.current.selectDevice('insole-02');
    });

    expect(result.current.deviceId).toBe('insole-02');
    expect(localStorage.getItem('pairedDeviceId:u1')).toBe('insole-02');

    push(['insole-01', 'insole-02']);

    expect(result.current.deviceId).toBe('insole-02');
  });

  it('clears the list and the selection when the account changes', () => {
    const { result, rerender } = renderHook(
      ({ uid }: { uid: string | null }) => usePairedDevice(uid),
      { initialProps: { uid: 'u1' as string | null } }
    );

    push(['insole-01']);
    expect(result.current.deviceId).toBe('insole-01');

    rerender({ uid: 'u2' });

    expect(result.current.deviceIds).toEqual([]);
    expect(result.current.deviceId).toBe(null);
  });

  it('empties the list when the subscription reports an error', () => {
    const { result } = renderHook(() => usePairedDevice('u1'));
    push(['insole-01']);

    act(() => {
      mocks.fail?.(new Error('permission_denied'));
    });

    expect(result.current.deviceIds).toEqual([]);
    expect(result.current.deviceId).toBe(null);
  });
});
