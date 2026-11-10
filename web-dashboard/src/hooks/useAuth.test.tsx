import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';

/**
 * Account deletion is the one irreversible write in the app, so the contract
 * is tested on the order, not just the outcome:
 *
 *   1. re-authenticate (Firebase refuses a stale session),
 *   2. remove the RTDB mirror (a leftover pairing blocks the device forever),
 *   3. remove the Firestore profile,
 *   4. delete the Auth user — the commit point.
 *
 * A failure at 4 must put the profile back, otherwise the account survives as
 * a signed-in shell with no role and no record in the console.
 */

const calls: string[] = [];

const mocks = vi.hoisted(() => ({
  currentUser: { uid: 'user-1', email: 'budi@example.com', displayName: 'Budi' },
  reauthenticate: vi.fn(),
  deleteAuthUser: vi.fn(),
  getProfile: vi.fn(),
  deleteProfile: vi.fn(),
  createProfile: vi.fn(),
  removeMirror: vi.fn(),
  updateAuthProfile: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: () => () => {},
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  updateProfile: mocks.updateAuthProfile,
  signOut: vi.fn(),
  deleteUser: mocks.deleteAuthUser,
  EmailAuthProvider: { credential: (email: string, password: string) => ({ email, password }) },
  reauthenticateWithCredential: mocks.reauthenticate,
}));

vi.mock('../services/firebaseConfig', () => ({
  auth: {
    get currentUser() {
      return mocks.currentUser;
    },
  },
  db: {},
  realtimeDb: {},
  createUserDoc: mocks.createProfile,
  deleteUserDoc: mocks.deleteProfile,
  getUserDoc: mocks.getProfile,
  getStorageInstance: vi.fn(),
}));

vi.mock('../services/firebaseRealtime', () => ({
  removeUserMirror: mocks.removeMirror,
}));

vi.mock('../utils/authMail', () => ({
  sendVerificationEmail: vi.fn(),
}));

const record = <T extends unknown[]>(name: string, impl: (...args: T) => Promise<void>) =>
  vi.fn(async (...args: T) => {
    calls.push(name);
    return impl(...args);
  });

describe('useAuth.deleteAccount', () => {
  beforeEach(() => {
    calls.length = 0;
    vi.clearAllMocks();
    mocks.getProfile.mockResolvedValue({ role: 'user' });
    mocks.reauthenticate.mockImplementation(async () => {
      calls.push('reauth');
    });
    mocks.removeMirror.mockImplementation(record('mirror', async () => {}));
    mocks.deleteProfile.mockImplementation(record('profile', async () => {}));
    mocks.deleteAuthUser.mockImplementation(record('auth', async () => {}));
    mocks.createProfile.mockResolvedValue(undefined);
  });

  const deleteWith = async (password = 'secret') => {
    const { result } = renderHook(() => useAuth());
    let outcome: { success: boolean; code?: string } = { success: true };
    await act(async () => {
      outcome = await result.current.deleteAccount(password);
    });
    return outcome;
  };

  it('deletes the mirror, the profile, then the Auth user, in that order', async () => {
    await expect(deleteWith()).resolves.toEqual({ success: true });
    expect(calls).toEqual(['reauth', 'mirror', 'profile', 'auth']);
    expect(mocks.deleteAuthUser).toHaveBeenCalledWith(mocks.currentUser);
  });

  it('refuses an admin account and touches nothing', async () => {
    mocks.getProfile.mockResolvedValue({ role: 'admin' });

    await expect(deleteWith()).resolves.toEqual({
      success: false,
      code: 'auth/admin-account',
    });
    expect(calls).toEqual([]);
    expect(mocks.deleteAuthUser).not.toHaveBeenCalled();
  });

  it('aborts on a wrong password without deleting anything', async () => {
    mocks.reauthenticate.mockRejectedValue({ code: 'auth/wrong-password' });

    await expect(deleteWith('wrong')).resolves.toEqual({
      success: false,
      code: 'auth/wrong-password',
    });
    expect(calls).toEqual([]);
    expect(mocks.removeMirror).not.toHaveBeenCalled();
  });

  it('restores the profile when the Auth deletion fails', async () => {
    mocks.deleteAuthUser.mockRejectedValue({ code: 'auth/network-request-failed' });

    await expect(deleteWith()).resolves.toEqual({
      success: false,
      code: 'auth/network-request-failed',
    });
    expect(calls).toContain('profile');
    expect(mocks.createProfile).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ uid: 'user-1', role: 'user' })
    );
  });
});

describe('useAuth.updateDisplayName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createProfile.mockResolvedValue(undefined);
  });

  const saveWith = async (name: string) => {
    const { result } = renderHook(() => useAuth());
    let outcome: { success: boolean; code?: string } = { success: true };
    await act(async () => {
      outcome = await result.current.updateDisplayName(name);
    });
    return outcome;
  };

  it('writes the profile copy first, then the Auth profile, and trims', async () => {
    await expect(saveWith('  Budi Santoso  ')).resolves.toEqual({ success: true });

    // The console reads the document, and the auth listener prefers it too, so
    // the durable copy goes first: a failure there leaves both surfaces alone.
    expect(mocks.createProfile).toHaveBeenCalledWith('user-1', {
      displayName: 'Budi Santoso',
    });
    expect(mocks.updateAuthProfile).toHaveBeenCalledWith(mocks.currentUser, {
      displayName: 'Budi Santoso',
    });
  });

  it('reports a failed write instead of claiming the name was saved', async () => {
    mocks.createProfile.mockRejectedValue({ code: 'permission-denied' });

    await expect(saveWith('Budi')).resolves.toEqual({
      success: false,
      code: 'permission-denied',
    });
    expect(mocks.updateAuthProfile).not.toHaveBeenCalled();
  });

  it('refuses an empty name and writes nothing', async () => {
    await expect(saveWith('   ')).resolves.toEqual({
      success: false,
      code: 'profile/empty-name',
    });
    expect(mocks.createProfile).not.toHaveBeenCalled();
  });
});
