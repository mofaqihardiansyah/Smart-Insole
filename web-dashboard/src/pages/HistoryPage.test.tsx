import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import HistoryPage from './HistoryPage';
import { InsoleProvider } from '../context/InsoleContext';
import { STORED_HISTORY_LIMIT } from '../context/InsoleContext';
import type { HistoryEntry } from '../types/insole';

/**
 * The render cap (priority 1): a register that keeps growing must not draw every
 * row it holds. These tests pin three things at once — the first page is small,
 * "load more" reveals more without losing the rest, and the summary counts keep
 * describing the whole register rather than the visible page.
 */

/** Alternating safe/warning rows so every wanted pair is a fresh incident. */
const rowsFor = (incidents: number): HistoryEntry[] => {
  const rows: HistoryEntry[] = [];
  for (let i = 0; i < incidents; i += 1) {
    const base = 1_700_000_000_000 + i * 2_000;
    rows.push(row(base, 'safe', 5));
    rows.push(row(base + 1_000, 'warning', 80));
  }
  return rows;
};

const row = (
  timestamp: number,
  level: 'safe' | 'warning' | 'danger',
  peak: number
): HistoryEntry => ({
  id: `row-${timestamp}`,
  readings: { forefoot: peak, midfoot: 10, heel: 8, sustainedDuration: 1 },
  peakPressure: peak,
  riskLevel: level,
  riskScore: level === 'warning' ? 60 : level === 'danger' ? 90 : 10,
  batteryPercent: null,
  deviceId: 'insole-01',
  timestamp,
});

const renderWithRows = (rows: HistoryEntry[]) => {
  let onData: ((rows: HistoryEntry[]) => void) | null = null;
  const transport = {
    subscribeToReadings: () => () => {},
    subscribeToHistory: (callback: (rows: HistoryEntry[]) => void) => {
      onData = callback;
      return () => {};
    },
  };

  const utils = render(
    <MemoryRouter initialEntries={['/history']}>
      <InsoleProvider transport={transport} autoConnect>
        <HistoryPage />
      </InsoleProvider>
    </MemoryRouter>
  );

  act(() => {
    onData?.(rows);
  });

  return { ...utils, rows: () => utils.container.querySelectorAll('tbody tr') };
};

describe('HistoryPage render cap', () => {
  beforeEach(() => localStorage.clear());

  it('draws one page and says how much of the register that is', () => {
    const { rows } = renderWithRows(rowsFor(45));

    expect(rows()).toHaveLength(20);
    expect(screen.getByText('Menampilkan 20 dari 45 insiden')).toBeTruthy();
  });

  it('counts the whole register, not the visible page', () => {
    renderWithRows(rowsFor(45));

    // Every incident is a warning, so the summary must read 45 even though only
    // a page of rows is on screen.
    const warningCard = screen.getByText('Insiden waspada').closest('div');
    expect(warningCard?.textContent).toContain('45');
  });

  it('reveals the next page on "load more" and stops at the end', async () => {
    const user = userEvent.setup();
    const { rows } = renderWithRows(rowsFor(45));

    await user.click(screen.getByRole('button', { name: 'Muat lebih banyak' }));
    expect(rows()).toHaveLength(40);
    expect(screen.getByText('Menampilkan 40 dari 45 insiden')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Muat lebih banyak' }));
    expect(rows()).toHaveLength(45);
    expect(screen.getByText('Menampilkan 45 dari 45 insiden')).toBeTruthy();

    // Nothing left to reveal, so the control is gone rather than inert.
    expect(
      screen.queryByRole('button', { name: 'Muat lebih banyak' })
    ).toBeNull();
  });

  it('offers no "load more" when the register fits one page', () => {
    renderWithRows(rowsFor(3));

    expect(
      screen.queryByRole('button', { name: 'Muat lebih banyak' })
    ).toBeNull();
    expect(screen.getByText('Menampilkan 3 dari 3 insiden')).toBeTruthy();
  });

  it('says so when the device snapshot itself is already cut short', () => {
    // A full window is the only case where the register is known to be
    // incomplete, so the page admits it instead of looking exhaustive.
    renderWithRows(rowsFor(STORED_HISTORY_LIMIT));

    expect(
      screen.getByText(
        `Perangkat menyimpan ${STORED_HISTORY_LIMIT} baris terakhir; insiden lebih lama tidak dimuat.`
      )
    ).toBeTruthy();
  });

  it('keeps the cap note away when the snapshot is short', () => {
    renderWithRows(rowsFor(5));

    expect(screen.queryByText(/baris terakhir/)).toBeNull();
  });
});

describe('HistoryPage filter and sort', () => {
  beforeEach(() => localStorage.clear());

  // Stored incidents are transitions: `safe` rows never become one, and two
  // equal levels in a row collapse. So the fixture alternates danger/warning.
  const mixedRows = () => [
    row(1_700_000_000_000, 'danger', 210),
    row(1_700_000_002_000, 'warning', 80),
    row(1_700_000_004_000, 'danger', 220),
    row(1_700_000_006_000, 'warning', 85),
  ];

  it('filters to one level and reports the filtered set', async () => {
    const user = userEvent.setup();
    const { rows } = renderWithRows(mixedRows());

    await user.click(screen.getByRole('button', { name: 'Bahaya' }));

    expect(rows()).toHaveLength(2);
    expect(screen.getByText('Menampilkan 2 dari 2 insiden')).toBeTruthy();
  });

  it('keeps the summary on the whole register', async () => {
    const user = userEvent.setup();
    renderWithRows(mixedRows());

    await user.click(screen.getByRole('button', { name: 'Bahaya' }));

    const totalCard = screen.getByText('Total insiden').closest('div');
    expect(totalCard?.textContent).toContain('4');
    const dangerCard = screen.getByText('Insiden bahaya').closest('div');
    expect(dangerCard?.textContent).toContain('2');
  });

  it('shows the empty state, not an empty table, when the filter matches nothing', async () => {
    const user = userEvent.setup();
    // rowsFor only emits warning incidents, so "Bahaya" matches nothing.
    const { rows } = renderWithRows(rowsFor(2));

    await user.click(screen.getByRole('button', { name: 'Bahaya' }));

    expect(screen.getByText('Tidak ada insiden pada filter ini')).toBeTruthy();
    expect(rows()).toHaveLength(0);
  });

  it('restarts the render cap when the filter changes', async () => {
    const user = userEvent.setup();
    renderWithRows(rowsFor(45));

    await user.click(screen.getByRole('button', { name: 'Muat lebih banyak' }));
    expect(screen.getByText('Menampilkan 40 dari 45 insiden')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Waspada' }));
    expect(screen.getByText('Menampilkan 20 dari 45 insiden')).toBeTruthy();
  });

  it('sorts the register by time and flips on a second click', async () => {
    const user = userEvent.setup();
    const { container, rows } = renderWithRows(mixedRows());

    const timeHead = container.querySelector('th') as HTMLElement;
    expect(timeHead.getAttribute('aria-sort')).toBe('ascending');
    const first = rows()[0].querySelector('td')?.textContent;
    expect(first).toBe(new Date(1_700_000_000_000).toLocaleString('id-ID'));

    const sortButton = screen.getByRole('button', {
      name: /Urutkan menurut waktu/,
    });
    await user.click(sortButton);

    expect(timeHead.getAttribute('aria-sort')).toBe('descending');
    const last = rows()[0].querySelector('td')?.textContent;
    expect(last).toBe(new Date(1_700_000_006_000).toLocaleString('id-ID'));
  });

  it('freezes the time column and the header row', () => {
    const { container } = renderWithRows(mixedRows());

    const head = container.querySelector('th') as HTMLElement;
    expect(head.className).toContain('sticky');
    expect(head.className).toContain('top-0');
    expect(head.className).toContain('left-0');
    expect(head.className).toContain('z-30');

    const firstCell = container.querySelector('tbody td') as HTMLElement;
    expect(firstCell.className).toContain('sticky');
    expect(firstCell.className).toContain('left-0');
    expect(firstCell.className).toContain('z-10');
  });
});
