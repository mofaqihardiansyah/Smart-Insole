import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import AdminPage from './AdminPage';
import { InsoleProvider } from '../context/InsoleContext';

/**
 * AdminPage regression tests, one per audited defect:
 *
 *  1. Hooks-order crash: the non-admin guard used to sit ABOVE the page's
 *     useEffects. On a hard refresh at /admin the role is still "" for the
 *     first render (it resolves asynchronously), so render #1 ran zero hooks
 *     and render #2 ran three — React tore the whole app down. The role
 *     transition "" -> "admin" on a mounted page must re-render cleanly.
 *  2. The config form mirrors the RTDB rules client-side (danger > safe > 0),
 *     so an impossible save is blocked before it leaves the browser.
 *  3. A PERMISSION_DENIED save explains the missing RTDB admin mirror instead
 *     of blaming the connection.
 */

const mocks = vi.hoisted(() => ({
  setGlobalConfig: vi.fn(),
  listUsers: vi.fn(),
}));

vi.mock('../services/firebaseRealtime', () => ({
  subscribeToReadings: () => () => {},
  subscribeToGlobalConfig: () => () => {},
  setGlobalConfig: mocks.setGlobalConfig,
}));

vi.mock('../services/firebaseConfig', () => ({
  listUsers: mocks.listUsers,
  updateUserDoc: vi.fn(),
  deleteUserDoc: vi.fn(),
}));

let mockRole = '';
vi.mock('../context/UserContext', () => ({
  useUser: () => ({ role: mockRole }),
}));

const renderAdmin = () =>
  render(
    <InsoleProvider>
      <AdminPage />
    </InsoleProvider>
  );

describe('AdminPage', () => {
  beforeEach(() => {
    localStorage.clear();
    mockRole = '';
    mocks.setGlobalConfig.mockReset();
    mocks.listUsers.mockReset().mockResolvedValue([]);
  });

  it('renders the config panel after the role resolves from "" to admin', async () => {
    const { rerender } = renderAdmin();

    // Role still loading: the access-denied panel shows, with zero useEffects
    // skipped — every hook has already run.
    expect(screen.getByText(/Akses ditolak/i)).toBeInTheDocument();

    // The async role arrives on the SAME mounted component. Before the fix
    // this transition crashed React with "Rendered more hooks...".
    mockRole = 'admin';
    rerender(
      <InsoleProvider>
        <AdminPage />
      </InsoleProvider>
    );

    expect(await screen.findByText('Konfigurasi Global')).toBeInTheDocument();
  });

  it('shows the access-denied panel to a non-admin without crashing', async () => {
    renderAdmin();
    expect(screen.getByText(/Akses ditolak/i)).toBeInTheDocument();
    expect(screen.queryByText('Konfigurasi Global')).not.toBeInTheDocument();
  });

  it('blocks a config save that inverts the thresholds', async () => {
    mockRole = 'admin';
    renderAdmin();

    const danger = await screen.findByLabelText(/Batas Bahaya/i);
    fireEvent.change(danger, { target: { value: '30' } }); // <= safe 35

    expect(
      await screen.findByText(/Batas bahaya harus lebih tinggi/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Simpan' })).toBeDisabled();
    expect(mocks.setGlobalConfig).not.toHaveBeenCalled();
  });

  it('translates a PERMISSION_DENIED save into the admin-mirror hint', async () => {
    mockRole = 'admin';
    mocks.setGlobalConfig.mockRejectedValue(
      Object.assign(new Error('PERMISSION_DENIED: access denied'), {
        code: 'PERMISSION_DENIED',
      })
    );
    renderAdmin();

    const danger = await screen.findByLabelText(/Batas Bahaya/i);
    fireEvent.change(danger, { target: { value: '80' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));

    expect(await screen.findByText(/mirror admin/i)).toBeInTheDocument();
  });

  it('saves a valid pair and confirms', async () => {
    mockRole = 'admin';
    mocks.setGlobalConfig.mockResolvedValue(undefined);
    renderAdmin();

    const danger = await screen.findByLabelText(/Batas Bahaya/i);
    fireEvent.change(danger, { target: { value: '80' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));

    expect(await screen.findByText('Tersimpan')).toBeInTheDocument();
    expect(mocks.setGlobalConfig).toHaveBeenCalledWith({
      safeThreshold: 35,
      dangerThreshold: 80,
    });
  });
});
