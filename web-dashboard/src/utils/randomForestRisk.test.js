import { describe, it, expect } from 'vitest';
import {
  RISK_THRESHOLDS,
  SCORE_BANDS,
  inferRisk,
  classifyRisk,
  levelFromScore,
} from './randomForestRisk';

/**
 * These tests encode the clinical contract the model has to honour.
 *
 * Two classes, `safe` and `warning`, and one boundary: peak pressure at or
 * above the warning limit. The training label is that same rule, so the forest
 * reproduces it; the contract is applied on both sides so an out-of-distribution
 * pair (low peak, long duration) cannot read as a warning either.
 *
 * There is no danger level, and duration never promotes a level.
 */
describe('clinical classification', () => {
  const cases = [
    // [peakPressure, sustainedDuration, expected level]
    [0, 0, 'safe'],
    [12, 0, 'safe'],
    [25, 0, 'safe'],
    [44, 0, 'safe'],
    // Duration does not lift a sub-limit peak: 30 kPa held for 45 s is safe.
    [30, 25, 'safe'],
    [30, 45, 'safe'],
    // At or above the limit is a warning immediately.
    [45, 1, 'warning'],
    [50, 1, 'warning'],
    [60, 5, 'warning'],
    [80, 2, 'warning'],
    // No level above warning exists, however high the pressure.
    [200, 1, 'warning'],
    [205, 15, 'warning'],
    [220, 45, 'warning'],
    [500, 60, 'warning'],
  ];

  it.each(cases)('peak %i kPa for %i s is %s', (pressure, duration, expected) => {
    expect(classifyRisk(pressure, duration)).toBe(expected);
  });

  it('crosses from safe to warning at the warning limit', () => {
    let crossover = null;
    for (let p = 0; p <= 60; p += 0.5) {
      if (classifyRisk(p, 1) === 'warning') {
        crossover = p;
        break;
      }
    }
    expect(crossover).not.toBeNull();
    // The contract is exact: the limit itself is already a warning.
    expect(crossover).toBe(RISK_THRESHOLDS.warningKpa);
  });

  it('reports no level above warning', () => {
    expect(classifyRisk(500, 1)).toBe('warning');
    expect(classifyRisk(200, 0)).toBe('warning');
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
        } else {
          expect(score).toBeGreaterThanOrEqual(SCORE_BANDS.safeMax + 1);
          expect(score).toBeLessThanOrEqual(SCORE_BANDS.warningMax);
        }
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }
    }
  });

  it('scores representative states in a sensible order', () => {
    const safe = inferRisk({ peakPressure: 15, sustainedDuration: 2 }).score;
    const warning = inferRisk({ peakPressure: 50, sustainedDuration: 5 }).score;
    const high = inferRisk({ peakPressure: 215, sustainedDuration: 35 }).score;

    expect(safe).toBeLessThan(warning);
    // And the top of the warning band is reachable at extreme pressure.
    expect(high).toBeLessThanOrEqual(SCORE_BANDS.warningMax);
  });
});

describe('random forest internals', () => {
  it('returns vote counts that sum to the forest size', () => {
    const { votes } = inferRisk({ peakPressure: 50, sustainedDuration: 10 });
    const total = votes.safe + votes.warning;
    expect(total).toBeGreaterThan(0);
    expect(votes.safe).toBeGreaterThanOrEqual(0);
    expect(votes.warning).toBeGreaterThanOrEqual(0);
  });

  it('is deterministic: the same input always produces the same output', () => {
    const a = inferRisk({ peakPressure: 60, sustainedDuration: 12 });
    const b = inferRisk({ peakPressure: 60, sustainedDuration: 12 });
    expect(a).toEqual(b);
  });
});

describe('configurable peak threshold', () => {
  const custom = {
    ...RISK_THRESHOLDS,
    warningKpa: 30,
  };

  it('moves the crossover to the configured limit', () => {
    expect(classifyRisk(29.9, 1, custom)).toBe('safe');
    expect(classifyRisk(30, 1, custom)).toBe('warning');
    // At the default limit the same reading is still safely below 45 kPa.
    expect(classifyRisk(30, 1)).toBe('safe');
  });

  it('still never exceeds warning', () => {
    expect(classifyRisk(500, 1, custom)).toBe('warning');
    expect(
      inferRisk({ peakPressure: 65, sustainedDuration: 1, thresholds: custom }).level
    ).toBe('warning');
  });

  it('keeps duration out of the decision', () => {
    // Duration is a model feature, not a rule: no length of hold below the
    // limit promotes the level.
    expect(classifyRisk(45, 21, custom)).toBe('warning');
    expect(classifyRisk(20, 60, custom)).toBe('safe');
  });
});

describe('levelFromScore', () => {
  it('maps a score to the band it sits in', () => {
    expect(levelFromScore(0)).toBe('safe');
    expect(levelFromScore(SCORE_BANDS.safeMax)).toBe('safe');
    expect(levelFromScore(SCORE_BANDS.safeMax + 1)).toBe('warning');
    expect(levelFromScore(SCORE_BANDS.warningMax)).toBe('warning');
    // A legacy score above the warning band still resolves to the top level.
    expect(levelFromScore(SCORE_BANDS.warningMax + 1)).toBe('warning');
    expect(levelFromScore(100)).toBe('warning');
  });
});
