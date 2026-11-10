import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import SettingsPage from './SettingsPage';
import { InsoleProvider } from '../context/InsoleContext';

/**
 * The thresholds are clinical constants, not settings.
 *
 * The dashboard and the firmware compile the same numbers, so this page must
 * present them as facts: no input, no save, no reset, for any role. An editor
 * here would be a control that cannot reach the device that raises the alarm.
 */

const renderSettings = () =>
  render(
    <MemoryRouter>
      <InsoleProvider>
        <SettingsPage />
      </InsoleProvider>
    </MemoryRouter>
  );

describe('SettingsPage thresholds', () => {
  it('shows the limits as facts and offers no editor', () => {
    renderSettings();

    expect(screen.queryByRole('spinbutton')).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Simpan pengaturan' })
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Kembalikan ke nilai awal' })
    ).toBeNull();

    expect(screen.getByText('Batas aman (kPa)')).toBeTruthy();
    expect(screen.getByText('Batas bahaya (kPa)')).toBeTruthy();
    expect(screen.getByText('Durasi waspada (detik)')).toBeTruthy();
  });

  it('reports the values the engine actually runs on', () => {
    renderSettings();

    const valueOf = (label: string) =>
      screen.getByText(label).closest('div')?.querySelector('dd')?.textContent;

    expect(valueOf('Batas aman (kPa)')).toBe('35');
    expect(valueOf('Batas bahaya (kPa)')).toBe('200');
    expect(valueOf('Durasi waspada (detik)')).toBe('20');
  });
});
