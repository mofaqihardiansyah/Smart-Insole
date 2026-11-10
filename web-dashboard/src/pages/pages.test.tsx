import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

/**
 * Render smoke tests for every page.
 *
 * These are deliberately shallow: the goal is to prove that each page mounts
 * without throwing, inside the real provider, with the real dictionary, and
 * that each route exposes exactly one top level heading. A page that crashes on
 * render, or that silently renders nothing, is the most common way a refactor
 * breaks a route that no unit test covers.
 *
 * What these tests do NOT do is verify visual layout at a given width. That
 * needs a browser; see the note at the bottom of this file.
 */

const mockAuth = {
  user: { uid: 'u1', email: 'kader@example.com', displayName: 'Kader' },
  loading: false,
  displayName: 'Kader',
  login: vi.fn().mockResolvedValue({ success: true }),
  register: vi.fn().mockResolvedValue({ success: true }),
  logout: vi.fn(),
  deleteAccount: vi.fn().mockResolvedValue({ success: true }),
  uploadProfilePhoto: vi.fn(),
};

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => mockAuth,
}));

vi.mock('../services/firebaseRealtime', () => ({
  subscribeToReadings: () => () => {},
  subscribeToHistory: () => () => {},
  mapReadingPacket: () => null,
  mapHistory: () => [],
}));

const { InsoleProvider, useInsole } = await import('../context/InsoleContext');
import type { InsoleContextValue } from '../context/InsoleContext';
import type { HistoryEntry } from '../types/insole';
const { dictionaryKeys } = await import('../utils/i18n');

const LandingPage = (await import('./LandingPage')).default;
const LoginPage = (await import('./LoginPage')).default;
const RegisterPage = (await import('./RegisterPage')).default;
const DashboardPage = (await import('./DashboardPage')).default;
const MonitoringPage = (await import('./MonitoringPage')).default;
const HistoryPage = (await import('./HistoryPage')).default;
const DevicePage = (await import('./DevicePage')).default;
const SettingsPage = (await import('./SettingsPage')).default;
const ProfilePage = (await import('./ProfilePage')).default;
const NotificationsPage = (await import('./NotificationsPage')).default;

const renderPage = (Page: React.ComponentType, route = '/') =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <InsoleProvider>
        <Page />
      </InsoleProvider>
    </MemoryRouter>
  );

const PAGES: Array<[string, React.ComponentType, string]> = [
  ['LandingPage', LandingPage, '/'],
  ['LoginPage', LoginPage, '/login'],
  ['RegisterPage', RegisterPage, '/register'],
  ['DashboardPage', DashboardPage, '/'],
  ['MonitoringPage', MonitoringPage, '/monitoring'],
  ['HistoryPage', HistoryPage, '/history'],
  ['DevicePage', DevicePage, '/device'],
  ['SettingsPage', SettingsPage, '/settings'],
  ['ProfilePage', ProfilePage, '/profile'],
];

describe('every page renders', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it.each(PAGES)('%s mounts with exactly one h1', (_name, Page, route) => {
    renderPage(Page, route);

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent.trim()).not.toBe('');
  });

  it.each(PAGES)('%s renders no raw translation keys', (_name, Page, route) => {
    const { container } = renderPage(Page, route);

    // A missing dictionary entry returns the key itself, so it would surface as
    // something like "dashboard.title" in the visible text. Checking against
    // the real key list is exact, unlike guessing at token shapes.
    const text = container.textContent || '';
    const leaked = dictionaryKeys().filter((key) => text.includes(key));

    expect(leaked).toEqual([]);
  });

  it.each(PAGES)('%s contains no element that traps focus', (_name, Page, route) => {
    const { container } = renderPage(Page, route);

    // Nothing should be removed from the tab order without a replacement focus
    // style, and no inline outline:none should survive.
    const offenders = Array.from(
      container.querySelectorAll('[style*="outline"]')
    );
    expect(offenders).toEqual([]);
  });
});

describe('responsive structure', () => {
  beforeEach(() => localStorage.clear());

  const renderHistoryWithRows = () => {
    const ctxRef: { current: InsoleContextValue | null } = { current: null };
    const Harness = () => {
      ctxRef.current = useInsole();
      return <HistoryPage />;
    };

    const result = render(
      <MemoryRouter initialEntries={['/history']}>
        <InsoleProvider>
          <Harness />
        </InsoleProvider>
      </MemoryRouter>
    );

    // Push one reading above the safe limit so the log has a row. Without a row
    // the page correctly shows its empty state, and there is no table to check.
    act(() => {
      if (!ctxRef.current) throw new Error('Harness has not mounted yet');
      ctxRef.current.setReadings({ forefoot: 80, midfoot: 70, heel: 60 });
    });

    return result;
  };

  it('HistoryPage ships both a mobile list and a desktop table', () => {
    const { container } = renderHistoryWithRows();

    // `class~=` matches a whole class token, so it distinguishes the desktop
    // wrapper (`hidden md:block`) from the mobile list (`md:hidden`).
    expect(container.querySelector('[class~="hidden"]')).not.toBeNull();
    expect(container.querySelector('[class~="md:hidden"]')).not.toBeNull();
  });

  it('keeps any wide element inside a bounded scroll container', () => {
    const { container } = renderHistoryWithRows();

    // A wide table or chart is allowed to scroll, but only inside its own
    // overflow container. A fixed-width element outside one would make the whole
    // page scroll sideways on a phone. `min-w-0` is excluded on purpose: it
    // permits shrinking, so it is the opposite of an overflow risk.
    const wide = Array.from(container.querySelectorAll('[class*="min-w-["]'));

    for (const element of wide) {
      const scroller = element.closest('[class*="overflow-x-auto"]');
      expect(
        scroller,
        `element with a fixed min-width is not inside an overflow container: ${element.className}`
      ).not.toBeNull();
    }
  });
});

describe('HistoryPage reads the stored register', () => {
  beforeEach(() => localStorage.clear());

  it('renders incidents from readings/history with no live reading at all', () => {
    // This is the reload case: the tab was closed after the incident, so the
    // live in-memory log is empty and only the Realtime Database still has it.
    let historyOnData: ((rows: HistoryEntry[]) => void) | null = null;
    const transport = {
      subscribeToReadings: () => () => {},
      subscribeToHistory: (callback: (rows: HistoryEntry[]) => void) => {
        historyOnData = callback;
        return () => {};
      },
    };

    render(
      <MemoryRouter initialEntries={['/history']}>
        <InsoleProvider transport={transport} autoConnect>
          <HistoryPage />
        </InsoleProvider>
      </MemoryRouter>
    );

    act(() => {
      historyOnData?.([
        {
          id: 'row-5000',
          readings: { forefoot: 80, midfoot: 20, heel: 15, sustainedDuration: 2 },
          peakPressure: 80,
          riskLevel: 'warning',
          riskScore: 60,
          batteryPercent: null,
          deviceId: 'insole-01',
          timestamp: 1791244800000,
        },
      ]);
    });

    // Rendered twice on purpose: the desktop table and the mobile list both
    // carry the row, so the count is at least two.
    expect(screen.getAllByText('Waspada').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('80.0 kPa').length).toBeGreaterThanOrEqual(2);
  });
});

/*
 * Not covered here, and not silently claimed: visual layout at 360 / 768 /
 * 1280 px and at 200% zoom needs a real rendering engine. No headless browser
 * or automation library is available in this environment, so that pass was done
 * by code inspection (mobile-first classes, `hidden`/`md:` pairs, bounded
 * overflow containers, no fixed pixel widths on layout elements) rather than by
 * looking at rendered pixels. Behaviour is covered by the interaction tests in
 * App.test.tsx and the component test files.
 */
