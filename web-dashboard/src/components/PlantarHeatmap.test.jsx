import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within, act } from '@testing-library/react';
import React from 'react';
import PlantarHeatmap from './PlantarHeatmap';
import { InsoleProvider, useInsole } from '../context/InsoleContext';

/**
 * readingsOverride lets the heatmap be driven deterministically without a
 * provider: 15 kPa (cyan), 45 kPa (amber), 85 kPa (red/pulse) cover all three
 * color zones defined by the pressure spec.
 */
const OVERRIDE = { forefoot: 15, midfoot: 45, heel: 85 };

const renderOverride = (props = {}) =>
  render(<PlantarHeatmap readingsOverride={OVERRIDE} {...props} />);

const nodeCircle = (nodeId) =>
  screen.getByTestId(nodeId).querySelector('circle');

/** All stop-color values of a node's radialGradient, in document order. */
const gradientStops = (container, nodeKey) =>
  Array.from(
    container.querySelectorAll(`#heatmap-grad-${nodeKey} stop`)
  ).map((stop) => stop.getAttribute('stop-color'));

/** Mirrors the provider value so tests can drive live context updates. */
let ctxRef = null;
const ContextHarness = () => {
  ctxRef = useInsole();
  return <PlantarHeatmap />;
};

describe('PlantarHeatmap', () => {
  beforeEach(() => {
    localStorage.clear();
    ctxRef = null;
  });

  it('renders the sole outline and three pressure nodes inside InsoleProvider', () => {
    const { container } = render(
      <InsoleProvider>
        <PlantarHeatmap readingsOverride={OVERRIDE} />
      </InsoleProvider>
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg.getAttribute('viewBox')).toBe('0 0 200 400');
    expect(svg.getAttribute('width')).toBe('100%');
    expect(container.querySelector('path')).toBeInTheDocument();

    expect(screen.getByTestId('node-forefoot')).toBeInTheDocument();
    expect(screen.getByTestId('node-midfoot')).toBeInTheDocument();
    expect(screen.getByTestId('node-heel')).toBeInTheDocument();
  });

  it('renders standalone with readingsOverride and no provider', () => {
    const { container } = render(
      <PlantarHeatmap readingsOverride={OVERRIDE} />
    );

    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByTestId('node-forefoot')).toBeInTheDocument();
    expect(screen.getByTestId('node-midfoot')).toBeInTheDocument();
    expect(screen.getByTestId('node-heel')).toBeInTheDocument();
  });

  it('maps each pressure zone to its gradient color family', () => {
    const { container } = renderOverride();

    const forefootStops = gradientStops(container, 'forefoot');
    const midfootStops = gradientStops(container, 'midfoot');
    const heelStops = gradientStops(container, 'heel');

    // 15 kPa (<30) -> cyan #50D8E9, transparent at the edge
    expect(forefootStops).toHaveLength(3);
    expect(forefootStops.every((c) => c === '#50D8E9')).toBe(true);
    expect(container.querySelector('#heatmap-grad-forefoot stop:last-child')
      .getAttribute('stop-opacity')).toBe('0');

    // 45 kPa (30-70) -> yellow-orange #F59E0B
    expect(midfootStops.every((c) => c === '#F59E0B')).toBe(true);

    // 85 kPa (>70) -> red #EF4444
    expect(heelStops.every((c) => c === '#EF4444')).toBe(true);
  });

  it('renders each node with its kPa value and a pressure-scaled radius', () => {
    renderOverride();

    expect(
      within(screen.getByTestId('node-forefoot')).getByText('15')
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId('node-midfoot')).getByText('45')
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId('node-heel')).getByText('85')
    ).toBeInTheDocument();

    // r = 18 + min(kPa, 100) * 0.22
    expect(Number(nodeCircle('node-forefoot').getAttribute('r'))).toBeCloseTo(
      18 + 15 * 0.22,
      5
    );
    expect(Number(nodeCircle('node-heel').getAttribute('r'))).toBeCloseTo(
      18 + 85 * 0.22,
      5
    );
  });

  it('pulses only the node above the 70 kPa danger threshold', () => {
    renderOverride();

    const pulseClass = (nodeId) =>
      nodeCircle(nodeId).getAttribute('class') || '';

    expect(pulseClass('node-heel')).toContain('plantar-node-pulse');
    expect(pulseClass('node-midfoot')).not.toContain('plantar-node-pulse');
    expect(pulseClass('node-forefoot')).not.toContain('plantar-node-pulse');
  });

  it('hides anatomical labels when showLabels is false', () => {
    renderOverride({ showLabels: false });

    expect(screen.queryByText('Tumit (Heel)')).not.toBeInTheDocument();
    expect(
      within(screen.getByTestId('node-heel')).getByText('85')
    ).toBeInTheDocument();
  });

  it('switches labels between languages', () => {
    const renderLocalized = () =>
      render(
        <InsoleProvider>
          <PlantarHeatmap readingsOverride={OVERRIDE} />
        </InsoleProvider>
      );

    const first = renderLocalized();
    expect(
      within(screen.getByTestId('node-heel')).getByText('Tumit (Heel)')
    ).toBeInTheDocument();
    first.unmount();

    localStorage.setItem('language', 'en');
    renderLocalized();
    expect(
      within(screen.getByTestId('node-heel')).getByText('Heel (Calcaneus)')
    ).toBeInTheDocument();
    expect(screen.queryByText('Tumit (Heel)')).not.toBeInTheDocument();
  });

  it('reads live readings and language from InsoleContext when no override is given', () => {
    render(
      <InsoleProvider>
        <ContextHarness />
      </InsoleProvider>
    );

    // Language default (id) applies with zeroed readings.
    expect(
      within(screen.getByTestId('node-heel')).getByText('Tumit (Heel)')
    ).toBeInTheDocument();

    act(() => {
      ctxRef.setReadings({ forefoot: 12, midfoot: 44, heel: 77 });
    });
    expect(
      within(screen.getByTestId('node-heel')).getByText('77')
    ).toBeInTheDocument();
    expect(nodeCircle('node-heel').getAttribute('class')).toContain(
      'plantar-node-pulse'
    );

    act(() => {
      ctxRef.setLanguage('en');
    });
    expect(
      within(screen.getByTestId('node-heel')).getByText('Heel (Calcaneus)')
    ).toBeInTheDocument();
  });
});
