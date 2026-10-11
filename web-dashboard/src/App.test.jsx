import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

/**
 * Firebase Auth and the Realtime Database are both mocked. Tests must not open
 * a socket, and the auth listener would otherwise never resolve.
 */
const mockAuth = { user: null, loading: false, displayName: '' };

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

const signedIn = {
  user: { uid: 'u1', email: 'kader@example.com', displayName: 'Kader' },
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

    // The public hero is present.
    expect(
      screen.getByRole('heading', { level: 1, name: /tekanan tinggi/i })
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
      screen.getByRole('heading', { level: 1, name: /dasbor tekanan plantar/i })
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
      screen.queryByRole('heading', { level: 1, name: /dasbor tekanan plantar/i })
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
      screen.getByRole('heading', { level: 1, name: /dasbor tekanan plantar/i })
    ).toBeInTheDocument();
  });
});
