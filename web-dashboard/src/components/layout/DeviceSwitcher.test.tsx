import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InsoleProvider } from '../../context/InsoleContext';
import { DeviceSwitcher } from './DeviceSwitcher';

/**
 * The switcher exists only when there is something to switch. Its labels follow
 * the flashing convention, and an id outside that convention is shown raw.
 */
const renderSwitcher = (
  props: Partial<React.ComponentProps<typeof DeviceSwitcher>> = {}
) =>
  render(
    <InsoleProvider>
      <DeviceSwitcher
        deviceIds={['insole-01', 'insole-02']}
        deviceId="insole-01"
        onSelectDevice={() => {}}
        {...props}
      />
    </InsoleProvider>
  );

describe('DeviceSwitcher', () => {
  it('renders nothing when only one device is paired', () => {
    renderSwitcher({ deviceIds: ['insole-01'] });

    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('names the feet and reports the chosen device', async () => {
    const onSelectDevice = vi.fn();
    renderSwitcher({ onSelectDevice });

    const select = screen.getByRole('combobox', { name: 'Pilih perangkat' });
    expect(select).toHaveValue('insole-01');
    expect(screen.getByRole('option', { name: 'Kaki kiri' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Kaki kanan' })).toBeInTheDocument();

    await userEvent.selectOptions(select, 'insole-02');

    expect(onSelectDevice).toHaveBeenCalledWith('insole-02');
  });

  it('shows an id outside the convention as-is', () => {
    renderSwitcher({ deviceIds: ['insole-01', 'custom-07'] });

    expect(screen.getByRole('option', { name: 'custom-07' })).toBeInTheDocument();
  });
});
