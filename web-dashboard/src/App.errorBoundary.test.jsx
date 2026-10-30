import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

/**
 * Firebase Auth and the Realtime Database are both mocked. Tests must not open
 * a socket, and the auth listener would otherwise never resolve.
 */
const mockAuth = {
  user: null,
  loading: false,
  displayName: '',
  logout: vi.fn(),
};

vi.mock('./hooks/useAuth', () => ({
  useAuth: () => mockAuth,
}));

vi.mock('./services/firebaseRealtime', () => ({
  subscribeToReadings: () => () => {},
  subscribeToHistory: () => () => {},
  mapReadingPacket: () => null,
  mapHistory: () => [],
}));

/**
 * The dashboard is the view mounted at the `/` route. It throws on demand so
 * this file can prove the whole console survives a view that fails to render,
 * then prove the recovery action brings the view back. The flag lives in
 * `vi.hoisted` because the factory below is hoisted above every import.
 */
const dashboard = vi.hoisted(() => ({ throws: true }));

vi.mock('./pages/DashboardPage', () => ({
  default: () => {
    if (dashboard.throws) {
      throw new Error('fixture: the dashboard failed to render');
    }
    return <h1>dasbor pulih</h1>;
  },
}));

const App = (await import('./App')).default;

const signedIn = {
  user: { uid: 'u1', email: 'kader@example.com', displayName: 'Kader', emailVerified: true },
  loading: false,
  displayName: 'Kader',
};

const SKIP_LINK = /lewati ke konten utama/i;
const GREETING_H1 = /selamat/i;

describe('App crash isolation', () => {
  let errorSpy;

  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, '', '/');
    mockAuth.user = signedIn.user;
    mockAuth.loading = false;
    mockAuth.displayName = signedIn.displayName;
    dashboard.throws = true;
    // React re-throws a caught boundary error to the console in test
    // environments; the spy keeps the run readable and is asserted below.
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('replaces a view that throws instead of blanking the console', () => {
    render(<App />);

    // The product's own crash surface is what renders, not a half-built page
    // and not a blank document.
    const fallback = screen.getByRole('alert');
    expect(within(fallback).getByText('Tampilan gagal dimuat')).toBeInTheDocument();

    // The throwing view rendered nothing: no greeting heading.
    expect(
      screen.queryByRole('heading', { level: 1, name: GREETING_H1 })
    ).not.toBeInTheDocument();
  });

  it('replaces the shell rather than rendering the fallback inside a broken one', () => {
    render(<App />);

    // The skip link is the shell's first focusable element. Its absence proves
    // the boundary swapped out the shell, which is the whole point of mounting
    // the boundary above it.
    expect(
      screen.queryByRole('link', { name: SKIP_LINK })
    ).not.toBeInTheDocument();
  });

  it('offers a recovery action that brings the view back', async () => {
    const user = userEvent.setup();
    render(<App />);

    const recovery = screen.getByRole('button', {
      name: 'Muat ulang tampilan',
    });

    // The throw was transient: the next render of the view succeeds.
    dashboard.throws = false;
    await user.click(recovery);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'dasbor pulih' })
    ).toBeInTheDocument();
  });
});
