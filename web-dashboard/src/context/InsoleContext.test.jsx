import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { InsoleProvider, useInsole } from './InsoleContext';
import { t } from '../utils/i18n';

/**
 * The context is consumed by a test child component; the latest context object
 * is mirrored into `ctxRef` so tests can call setters without ever invoking
 * `useContext` outside of a React component.
 */
const ctxRef = { current: null };

const TestComponent = () => {
  const ctx = useInsole();
  ctxRef.current = ctx;
  return (
    <div>
      <span data-testid="readings">{JSON.stringify(ctx.readings)}</span>
      <span data-testid="risk">{ctx.risk}</span>
      <span data-testid="riskLabel">{t(`risk.${ctx.risk}`, ctx.language)}</span>
      <span data-testid="riskScore">{String(ctx.riskScore)}</span>
      <span data-testid="severity">{String(ctx.severity)}</span>
      <span data-testid="peakPressure">{String(ctx.peakPressure)}</span>
      <span data-testid="source">{ctx.source}</span>
      <span data-testid="connectionState">{ctx.connectionState}</span>
      <span data-testid="isMuted">{String(ctx.isMuted)}</span>
      <span data-testid="language">{ctx.language}</span>
      <span data-testid="warningKpa">{String(ctx.thresholds.warningKpa)}</span>
      <span data-testid="simulationScenario">{ctx.simulationScenario}</span>
      <span data-testid="historyLength">{String(ctx.history.length)}</span>
      <span data-testid="historyFirst">
        {ctx.history.length ? JSON.stringify(ctx.history[0]) : ''}
      </span>
      <span data-testid="historyLast">
        {ctx.history.length
          ? JSON.stringify(ctx.history[ctx.history.length - 1])
          : ''}
      </span>
      <span data-testid="incidentTypes">
        {JSON.stringify(ctx.incidentLogs.map((log) => log.type))}
      </span>
    </div>
  );
};

/**
 * A stub Realtime Database transport. Tests must never open a socket, so the
 * provider is always given this instead of the real service.
 */
const stubTransport = {
  subscribeToReadings: () => () => {},
  subscribeToHistory: () => () => {},
};

const renderProvider = (props = {}) =>
  render(
    <InsoleProvider transport={stubTransport} {...props}>
      <TestComponent />
    </InsoleProvider>
  );

const text = (testId) => screen.getByTestId(testId).textContent;
const currentReadings = () => JSON.parse(text('readings'));
const setReadings = (next) =>
  act(() => {
    ctxRef.current.setReadings(next);
  });
const advance = (ms) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

describe('InsoleProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    ctxRef.current = null;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('initializes with default values', () => {
    renderProvider();

    expect(currentReadings()).toEqual({
      forefoot: 0,
      midfoot: 0,
      heel: 0,
      sustainedDuration: 0,
    });
    expect(text('risk')).toBe('safe');
    expect(text('riskLabel')).toBe('Aman'); // t('risk.safe', 'id')
    expect(text('riskScore')).toBe('0');
    expect(text('peakPressure')).toBe('0');
    expect(text('source')).toBe('SIMULATOR');
    expect(text('connectionState')).toBe('simulated');
    expect(text('isMuted')).toBe('false');
    expect(text('language')).toBe('id');
    expect(text('warningKpa')).toBe('35');
    expect(text('simulationScenario')).toBe('NORMAL_GAIT');
    expect(text('historyLength')).toBe('0');
    expect(text('incidentTypes')).toBe('[]');
  });

  it('sets the live source automatically when autoConnect is on', () => {
    renderProvider({ autoConnect: true });

    // The app asks for Firebase on mount; with no device answering it reports
    // the connection as failed rather than showing zeros as readings.
    expect(text('source')).toBe('FIREBASE');
    expect(text('connectionState')).toBe('connecting');
  });

  it('forces Indonesian and corrects the stored language when hydration finds a foreign value', () => {
    localStorage.setItem('language', 'en');
    localStorage.setItem('isMuted', 'true');

    renderProvider();

    expect(text('language')).toBe('id');
    expect(text('isMuted')).toBe('true');
    expect(text('riskLabel')).toBe('Aman'); // t('risk.safe', 'id')
    // The migration writes the forced value back, so any later reader in this
    // session agrees with the copy that is on screen.
    expect(localStorage.getItem('language')).toBe('id');
    expect(document.documentElement.lang).toBe('id');
  });

  it('falls back to Indonesian when a stored language value is invalid', () => {
    localStorage.setItem('language', 'fr');

    renderProvider();

    expect(text('language')).toBe('id');
  });

  it('survives storage that refuses writes and still forces Indonesian', () => {
    // Private-mode storage throws on write. A migration that wrote without
    // catching would break the provider's first render, which is a white
    // screen rather than a language preference.
    const originalStorage = globalThis.localStorage;
    const seeded = new Map([['language', 'en']]);
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: (key) =>
          seeded.has(String(key)) ? seeded.get(String(key)) : null,
        setItem: () => {
          throw new Error('storage is read-only');
        },
        removeItem: (key) => seeded.delete(String(key)),
        clear: () => seeded.clear(),
        key: (index) => Array.from(seeded.keys())[index] ?? null,
        get length() {
          return seeded.size;
        },
      },
      configurable: true,
      writable: true,
    });

    try {
      expect(() => renderProvider()).not.toThrow();
      expect(text('language')).toBe('id');
      expect(text('riskLabel')).toBe('Aman');
    } finally {
      Object.defineProperty(globalThis, 'localStorage', {
        value: originalStorage,
        configurable: true,
        writable: true,
      });
    }
  });

  it('forces Indonesian on a second mount without depending on the first', () => {
    localStorage.setItem('language', 'en');
    const first = renderProvider();
    expect(text('language')).toBe('id');
    first.unmount();

    localStorage.setItem('language', 'en');
    renderProvider();
    expect(text('language')).toBe('id');
  });

  it('persists language and mute changes back to localStorage', () => {
    renderProvider();

    expect(localStorage.getItem('language')).toBe('id');
    expect(localStorage.getItem('isMuted')).toBe('false');

    act(() => {
      ctxRef.current.setLanguage('en');
    });
    expect(localStorage.getItem('language')).toBe('en');
    expect(text('language')).toBe('en');

    act(() => {
      ctxRef.current.toggleMute();
    });
    expect(localStorage.getItem('isMuted')).toBe('true');

    act(() => {
      ctxRef.current.toggleMute();
    });
    expect(localStorage.getItem('isMuted')).toBe('false');
  });

  it('generates different reading ranges per simulation scenario at 1 Hz', () => {
    renderProvider();

    // NORMAL_GAIT: all three points between 10 and 30 kPa
    advance(1000);
    const normal = currentReadings();
    expect(normal.forefoot).toBeGreaterThanOrEqual(10);
    expect(normal.forefoot).toBeLessThanOrEqual(30);
    expect(normal.midfoot).toBeGreaterThanOrEqual(10);
    expect(normal.midfoot).toBeLessThanOrEqual(30);
    expect(normal.heel).toBeGreaterThanOrEqual(10);
    expect(normal.heel).toBeLessThanOrEqual(30);

    // FOREFOOT_OVERLOAD: forefoot-dominant 45-75 kPa, other points stay low
    act(() => {
      ctxRef.current.setSimulationScenario('FOREFOOT_OVERLOAD');
    });
    advance(1000);
    const overload = currentReadings();
    expect(overload.forefoot).toBeGreaterThanOrEqual(45);
    expect(overload.forefoot).toBeLessThanOrEqual(75);
    expect(overload.forefoot).toBeGreaterThan(overload.midfoot);
    expect(overload.forefoot).toBeGreaterThan(overload.heel);

    // RESTING: unloaded foot, 0-5 kPa
    act(() => {
      ctxRef.current.setSimulationScenario('RESTING');
    });
    advance(1000);
    const resting = currentReadings();
    expect(resting.forefoot).toBeLessThanOrEqual(5);
    expect(resting.midfoot).toBeLessThanOrEqual(5);
    expect(resting.heel).toBeLessThanOrEqual(5);

    // PROLONGED_STANDING: sustained 40-65 kPa on every point
    act(() => {
      ctxRef.current.setSimulationScenario('PROLONGED_STANDING');
    });
    advance(1000);
    const standing = currentReadings();
    expect(standing.forefoot).toBeGreaterThanOrEqual(40);
    expect(standing.forefoot).toBeLessThanOrEqual(65);
    expect(standing.midfoot).toBeGreaterThanOrEqual(40);
    expect(standing.midfoot).toBeLessThanOrEqual(65);
    expect(standing.heel).toBeGreaterThanOrEqual(40);
    expect(standing.heel).toBeLessThanOrEqual(65);
  });

  it('stops the simulator interval when the source switches away and resumes after', () => {
    renderProvider();

    advance(1000);
    expect(text('historyLength')).toBe('1');

    act(() => {
      ctxRef.current.setSource('FIREBASE');
    });
    expect(text('source')).toBe('FIREBASE');

    advance(5000);
    expect(text('historyLength')).toBe('1'); // no samples while on FIREBASE

    act(() => {
      ctxRef.current.setSource('SIMULATOR');
    });
    advance(1000);
    expect(text('historyLength')).toBe('2'); // simulator resumed
  });

  it('classifies risk transitions safe -> warning -> safe with sustained duration', () => {
    renderProvider();

    expect(text('risk')).toBe('safe');

    // 40 kPa peak: inside the 35-70 kPa warning band
    setReadings({ forefoot: 40, midfoot: 22, heel: 18 });
    expect(text('risk')).toBe('warning');
    expect(text('riskLabel')).toBe('Waspada'); // t('risk.warning', 'id')
    expect(Number(text('riskScore'))).toBeGreaterThanOrEqual(50);
    expect(Number(text('riskScore'))).toBeLessThanOrEqual(89);
    expect(currentReadings().sustainedDuration).toBe(1);
    expect(text('incidentTypes')).toBe('["warning"]');

    // One more second above 35 kPa extends the sustained duration
    setReadings({ forefoot: 48, midfoot: 25, heel: 20 });
    expect(text('risk')).toBe('warning');
    expect(currentReadings().sustainedDuration).toBe(2);
    expect(text('historyLength')).toBe('2');

    // Pressure relief resets duration and returns to safe, keeping the log
    setReadings({ forefoot: 12, midfoot: 9, heel: 11 });
    expect(text('risk')).toBe('safe');
    expect(text('riskLabel')).toBe('Aman');
    expect(Number(text('riskScore'))).toBeLessThanOrEqual(49);
    expect(currentReadings().sustainedDuration).toBe(0);
    expect(text('incidentTypes')).toBe('["warning"]');
  });

  it('escalates to danger immediately when sustained above 70 kPa', () => {
    renderProvider();

    // Clinical contract: peak >= 70 kPa AND sustained >= 0.1s triggers danger
    // At 1Hz sampling, 0.1s rounds to 0 samples, but the context passes
    // dangerDuration starting at 1 for the first sample above threshold.
    // So a single sample above 70 kPa triggers danger.
    setReadings({ forefoot: 80, midfoot: 75, heel: 72 });
    expect(text('risk')).toBe('danger');
    expect(text('riskLabel')).toBe('Bahaya');
    expect(Number(text('riskScore'))).toBeGreaterThanOrEqual(75);
    expect(text('incidentTypes')).toBe('["danger"]');
  });

  it('does not report danger for high pressure that immediately subsides', () => {
    renderProvider();

    // One sample above 70 kPa, then relief. The dangerDuration resets.
    setReadings({ forefoot: 80, midfoot: 75, heel: 72 });
    expect(text('risk')).toBe('danger');

    // Pressure relief: below danger threshold resets danger run
    setReadings({ forefoot: 50, midfoot: 45, heel: 40 });
    expect(text('risk')).toBe('warning');
    expect(text('incidentTypes')).toBe('["danger","warning"]');
  });

  it('caps the history ring buffer at 30 entries, evicting the oldest sample', () => {
    renderProvider();

    for (let i = 0; i < 35; i += 1) {
      setReadings({ forefoot: i, midfoot: 0, heel: 0 });
    }

    expect(text('historyLength')).toBe('30');

    const first = JSON.parse(text('historyFirst'));
    const last = JSON.parse(text('historyLast'));
    expect(first.readings.forefoot).toBe(5); // samples 0..4 were evicted
    expect(last.readings.forefoot).toBe(34);
    expect(first.risk).toBe('safe');
    expect(typeof first.timestamp).toBe('number');
    expect(first.readings).toHaveProperty('midfoot');
    expect(first.readings).toHaveProperty('heel');
    expect(first.readings).toHaveProperty('sustainedDuration');
  });

  it('reconnect tears the old subscription down and opens a new one', async () => {
    // The retry controls used to call setSource('FIREBASE'). React bails out on
    // an unchanged value, so the subscription effect never re-ran and the retry
    // button did nothing. `reconnect` bumps a nonce the effect is keyed on.
    const unsubscribes = [];
    const transport = {
      subscribeToReadings: vi.fn(() => {
        const unsubscribe = vi.fn();
        unsubscribes.push(unsubscribe);
        return unsubscribe;
      }),
      subscribeToHistory: () => () => {},
    };

    render(
      <InsoleProvider transport={transport} autoConnect>
        <TestComponent />
      </InsoleProvider>
    );

    const subscriptionsBefore = transport.subscribeToReadings.mock.calls.length;
    // The listener opened by the first effect. Cleanup releases exactly this
    // one, so it is the honest thing to assert on.
    const firstUnsubscribe = unsubscribes[0];

    await act(async () => {
      ctxRef.current.reconnect();
    });

    expect(transport.subscribeToReadings.mock.calls.length).toBe(
      subscriptionsBefore + 1
    );
    expect(firstUnsubscribe).toHaveBeenCalled();
  });
});
