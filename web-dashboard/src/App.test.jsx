import { describe, it, expect, beforeEach, vi } from 'vitest';
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

const App = (await import('./App')).default;

/**
 * The dashboard's H1 is the time-based greeting, so it is matched on the
 * greeting word rather than on a fixed string: the greeting is real behaviour,
 * and a test that pinned "Selamat pagi" would fail every afternoon.
 */
const DASHBOARD_H1 = /selamat/i;

const signedIn = {
  user: { uid: 'u1', email: 'kader@example.com', displayName: 'Kader', emailVerified: true },
  loading: false,
  displayName: 'Kader',
};

describe('App shell', () => {
  beforeEach(() => {
    localStorage.clear();
    // jsdom keeps window.location across tests in a file, so every test starts
    // from the dashboard route rather than wherever the previous one navigated.
    window.history.pushState({}, '', '/');
    mockAuth.user = null;
    mockAuth.loading = false;
    mockAuth.displayName = '';
  });

  it('shows the landing page when signed out, with no app navigation', () => {
    render(<App />);

    // The public hero is present, and it says what the product watches.
    expect(
      screen.getByRole('heading', { level: 1, name: /telapak kaki/i })
    ).toBeInTheDocument();

    // And the signed-in navigation is not.
    expect(
      screen.queryByRole('navigation', { name: /navigasi utama/i })
    ).not.toBeInTheDocument();
  });

  it('offers a skip link as the first focusable element', async () => {
    render(<App />);

    const skipLink = screen.getByRole('link', {
      name: /lewati ke konten utama/i,
    });
    expect(skipLink).toHaveAttribute('href', '#main-content');
    expect(document.getElementById('main-content')).toBeInTheDocument();
  });

  it('renders the navigation once signed in', () => {
    mockAuth.user = signedIn.user;
    mockAuth.displayName = signedIn.displayName;

    render(<App />);

    const navs = screen.getAllByRole('navigation', {
      name: /navigasi utama/i,
    });
    expect(navs.length).toBeGreaterThan(0);
  });

  it('actually navigates when a navigation item is clicked', async () => {
    // This is the regression test for the original defect: the navbar used to
    // update local state and never change the route.
    mockAuth.user = signedIn.user;
    mockAuth.displayName = signedIn.displayName;

    const user = userEvent.setup();
    render(<App />);

    // Start on the dashboard.
    expect(
      screen.getByRole('heading', { level: 1, name: DASHBOARD_H1 })
    ).toBeInTheDocument();

    const nav = screen.getAllByRole('navigation', {
      name: /navigasi utama/i,
    })[0];
    const monitoringLink = within(nav).getAllByRole('link', {
      name: /monitoring|pantau/i,
    })[0];

    await user.click(monitoringLink);

    // The route, the document title region and the heading all moved.
    expect(window.location.pathname).toBe('/monitoring');
    expect(
      screen.getByRole('heading', { level: 1, name: /tren tekanan/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { level: 1, name: DASHBOARD_H1 })
    ).not.toBeInTheDocument();
  });

  it('marks the active navigation item for assistive technology', async () => {
    mockAuth.user = signedIn.user;

    render(<App />);

    const nav = screen.getAllByRole('navigation', {
      name: /navigasi utama/i,
    })[0];
    const dashboardLink = within(nav).getAllByRole('link', {
      name: /dasbor|home/i,
    })[0];

    // react-router sets aria-current on the active NavLink.
    expect(dashboardLink).toHaveAttribute('aria-current', 'page');
  });

  it('redirects an unknown route back to the dashboard instead of blanking', () => {
    mockAuth.user = signedIn.user;
    window.history.pushState({}, '', '/definitely-not-a-route');

    render(<App />);

    expect(
      screen.getByRole('heading', { level: 1, name: DASHBOARD_H1 })
    ).toBeInTheDocument();
  });
});

describe('Shell controls', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, '', '/');
    mockAuth.user = signedIn.user;
    mockAuth.displayName = signedIn.displayName;
    mockAuth.logout.mockClear();
  });

  it('searches the real destinations and navigates on Enter', async () => {
    const user = userEvent.setup();
    render(<App />);

    const search = screen.getByRole('combobox', {
      name: /cari halaman atau catatan/i,
    });
    expect(search).toHaveAttribute('aria-expanded', 'false');

    await user.type(search, 'pengaturan');

    // The popup opened and offered the matching destination.
    expect(search).toHaveAttribute('aria-expanded', 'true');
    const option = screen.getByRole('option', { name: /pengaturan/i });
    expect(option).toBeInTheDocument();

    await user.keyboard('{Enter}');

    expect(window.location.pathname).toBe('/settings');
  });

  it('reports no match instead of showing an empty popup', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(
      screen.getByRole('combobox', { name: /cari halaman atau catatan/i }),
      'zzzz'
    );

    expect(screen.getByText(/tidak ada yang cocok/i)).toBeInTheDocument();
  });

  it('closes the search popup on Escape without navigating away', async () => {
    const user = userEvent.setup();
    render(<App />);

    const search = screen.getByRole('combobox', {
      name: /cari halaman atau catatan/i,
    });
    await user.type(search, 'riwayat');
    await user.keyboard('{Escape}');

    expect(search).toHaveValue('');
    expect(window.location.pathname).toBe('/');
  });

  it('signs out from the account menu in the header', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getAllByRole('button', { name: /akun|keluar|profil/i })[0]
    );
    // The disclosure is open; the sign-out control is the one destructive act
    // it owns.
    const signOut = screen
      .getAllByRole('button', { name: /keluar/i })
      .find((button) => button.closest('#account-menu'));
    expect(signOut).toBeDefined();
    await user.click(signOut);

    expect(mockAuth.logout).toHaveBeenCalled();
  });
});
