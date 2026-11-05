import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import SettingsPage from './SettingsPage';
import { InsoleProvider } from '../context/InsoleContext';
import { UserProvider } from '../context/UserContext';

/**
 * Who may change the clinical thresholds.
 *
 * The thresholds drive the risk verdict, so editing them is an admin act. A
 * normal account sees the active values, cannot type into them, and is told
 * why; an admin keeps the form and the save/reset pair.
 */

const renderSettings = (role: string) =>
  render(
    <MemoryRouter>
      <InsoleProvider>
        <UserProvider
          value={{ user: null, displayName: '', role, signOut: () => {} }}
        >
          <SettingsPage />
        </UserProvider>
      </InsoleProvider>
    </MemoryRouter>
  );

describe('SettingsPage threshold access', () => {
  beforeEach(() => localStorage.clear());

  it('shows a normal account the limits as facts, with no editor at all', () => {
    renderSettings('user');

    // No field, no button, no explanation: the account cannot tell an editor
    // exists, which is the point of the restriction.
    expect(screen.queryByLabelText('Batas aman (kPa)')).toBeNull();
    expect(screen.queryByRole('spinbutton')).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Simpan pengaturan' })
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Kembalikan ke nilai awal' })
    ).toBeNull();

    // The active values are still readable as plain text.
    expect(screen.getByText('Batas aman (kPa)')).toBeTruthy();
    expect(screen.getByText('Batas bahaya (kPa)')).toBeTruthy();
  });

  it('keeps the form editable for an admin', () => {
    renderSettings('admin');

    const safeLimit = screen.getByLabelText('Batas aman (kPa)');
    expect((safeLimit as HTMLInputElement).disabled).toBe(false);
    expect(
      screen.getByRole('button', { name: 'Simpan pengaturan' })
    ).toBeTruthy();
    expect(
      screen.queryByText('Hanya admin yang dapat mengubah ambang')
    ).toBeNull();
  });
});
