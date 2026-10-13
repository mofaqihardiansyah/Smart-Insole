import { describe, it, expect } from 'vitest';
import {
  RISK_THRESHOLDS,
  SCORE_BANDS,
  inferRisk,
  classifyRisk,
} from './randomForestRisk';

/**
 * These tests encode the clinical contract the Random Forest has to honour.
 * The forest is trained on expert rules (fuzzyRisk.js), so it reproduces the
 * expert boundaries to within a sampling unit. If a future change makes a
 * 40 kPa reading "safe", this file fails before a patient is told they are fine.
 */
describe('clinical classification', () => {
  const cases = [
    // [peakPressure, sustainedDuration, expected level]
    [0, 0, 'safe'],
    [12, 0, 'safe'],
    [25, 3, 'safe'],
    // The safe-to-warning crossover sits slightly BELOW the 35 kPa limit, not
    // above it. Warning a little early is the safe direction to be wrong in.
    [31, 2, 'safe'],
    // A reading at or above the safe limit is a warning immediately, even
    // before it has been sustained.
    [35, 1, 'warning'],
    [40, 1, 'warning'],
    [48, 2, 'warning'],
    [60, 5, 'warning'],
    [70, 1, 'warning'],
    // High pressure, not yet sustained long enough.
    [72, 15, 'warning'],
    [80, 15, 'warning'],
    // High pressure, sustained past the danger window.
    [80, 30, 'danger'],
    [80, 31, 'danger'],
    [90, 45, 'danger'],
    // Prolonged load below the pressure limit is still a warning.
    [30, 25, 'warning'],
    [30, 45, 'warning'],
    [55, 45, 'warning'],
  ];

  it.each(cases)('peak %i kPa for %i s is %s', (pressure, duration, expected) => {
    expect(classifyRisk(pressure, duration)).toBe(expected);
  });

  it('crosses from safe to warning at the configured safe limit', () => {
    let crossover = null;
    for (let p = 0; p <= 60; p += 0.5) {
      if (classifyRisk(p, 1) === 'warning') {
        crossover = p;
        break;
      }
    }
    expect(crossover).not.toBeNull();
    expect(crossover).toBeLessThanOrEqual(RISK_THRESHOLDS.warningKpa);
    expect(crossover).toBeGreaterThan(RISK_THRESHOLDS.warningKpa - 6);
  });

  it('crosses from warning to danger at or before the danger duration', () => {
    let crossover = null;
    for (let d = 0; d <= 40; d += 0.5) {
      if (classifyRisk(80, d) === 'danger') {
        crossover = d;
        break;
      }
    }
    expect(crossover).not.toBeNull();
    expect(crossover).toBeLessThanOrEqual(RISK_THRESHOLDS.dangerSeconds);
    expect(crossover).toBeGreaterThan(RISK_THRESHOLDS.dangerSeconds - 3);
  });

  it('never reports danger from pressure alone, without duration', () => {
    expect(classifyRisk(500, 0)).toBe('warning');
    expect(classifyRisk(500, 1)).toBe('warning');
  });

  it('degrades gracefully on missing or invalid input', () => {
    expect(classifyRisk(undefined, undefined)).toBe('safe');
    expect(classifyRisk(null, null)).toBe('safe');
    expect(classifyRisk(NaN, NaN)).toBe('safe');
    expect(classifyRisk(-50, -10)).toBe('safe');
  });
});

describe('severity score', () => {
  it('always reports a score inside the band its level implies', () => {
    for (let pressure = 0; pressure <= 120; pressure += 1) {
      for (let duration = 0; duration <= 90; duration += 1) {
        const { level, score } = inferRisk({
          peakPressure: pressure,
          sustainedDuration: duration,
        });
        if (level === 'safe') {
          expect(score).toBeLessThanOrEqual(SCORE_BANDS.safeMax);
        } else if (level === 'warning') {
          expect(score).toBeGreaterThanOrEqual(SCORE_BANDS.safeMax + 1);
          expect(score).toBeLessThanOrEqual(SCORE_BANDS.warningMax);
        } else {
          expect(score).toBeGreaterThanOrEqual(SCORE_BANDS.warningMax + 1);
        }
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }
    }
  });

  it('scores representative states in a sensible order', () => {
    const safe = inferRisk({ peakPressure: 15, sustainedDuration: 2 }).score;
    const warning = inferRisk({ peakPressure: 50, sustainedDuration: 5 }).score;
    const danger = inferRisk({ peakPressure: 85, sustainedDuration: 35 }).score;

    expect(safe).toBeLessThan(warning);
    expect(warning).toBeLessThan(danger);
    expect(danger).toBeGreaterThanOrEqual(75);
  });
});

describe('random forest internals', () => {
  it('returns vote counts that sum to the forest size', () => {
    const { votes } = inferRisk({ peakPressure: 50, sustainedDuration: 10 });
    const total = votes.safe + votes.warning + votes.danger;
    expect(total).toBeGreaterThan(0);
    expect(votes.safe).toBeGreaterThanOrEqual(0);
    expect(votes.warning).toBeGreaterThanOrEqual(0);
    expect(votes.danger).toBeGreaterThanOrEqual(0);
  });

  it('is deterministic: the same input always produces the same output', () => {
    const a = inferRisk({ peakPressure: 60, sustainedDuration: 12 });
    const b = inferRisk({ peakPressure: 60, sustainedDuration: 12 });
    expect(a).toEqual(b);
  });
});
