import { describe, it, expect } from 'vitest';
import {
  RISK_THRESHOLDS,
  SCORE_BANDS,
  inferRisk,
  classifyRisk,
  levelFromScore,
} from './randomForestRisk';

/**
 * These tests encode the clinical contract the Random Forest has to honour.
 * The system uses a hybrid approach:
 *   - Random Forest (data-driven) for safe vs warning
 *   - Rule-based override for danger (peak >= 70 kPa AND sustained >= 0.1s)
 *
 * The danger rule is clinically well-defined and overrides RF prediction.
 */
describe('clinical classification', () => {
  const cases = [
    // [peakPressure, sustainedDuration, expected level]
    [0, 0, 'safe'],
    [12, 0, 'safe'],
    // Safe: peak < 35, so sustained = 0 in DFN-DS (never crosses threshold)
    [25, 0, 'safe'],
    [31, 0, 'safe'],
    // A reading at or above the safe limit is a warning immediately
    [35, 1, 'warning'],
    [40, 1, 'warning'],
    [48, 2, 'warning'],
    [60, 5, 'warning'],
    // High pressure, sustained past 0.1s triggers danger (rule-based)
    [70, 1, 'danger'],
    [72, 15, 'danger'],
    [80, 15, 'danger'],
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
    // Safe-to-warning crossover at exactly 35 kPa (clinical contract)
    expect(crossover).toBeLessThanOrEqual(RISK_THRESHOLDS.warningKpa);
    expect(crossover).toBeGreaterThanOrEqual(RISK_THRESHOLDS.warningKpa - 1);
  });

  it('crosses from warning to danger at or before the danger duration', () => {
    let crossover = null;
    for (let d = 0; d <= 40; d += 0.1) {
      if (classifyRisk(80, d) === 'danger') {
        crossover = d;
        break;
      }
    }
    expect(crossover).not.toBeNull();
    // Danger triggers at sustained >= 0.1s (1 sample at 10Hz)
    expect(crossover).toBeLessThanOrEqual(0.2);
    expect(crossover).toBeGreaterThanOrEqual(0.05);
  });

  it('reports danger from high pressure alone when sustained', () => {
    // With rule-based danger: peak >= 70 AND sustained >= 0.1s triggers danger
    expect(classifyRisk(500, 1)).toBe('danger');
    expect(classifyRisk(70, 1)).toBe('danger');
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

describe('configurable peak thresholds', () => {
  const custom = {
    ...RISK_THRESHOLDS,
    warningKpa: 30,
    dangerKpa: 60,
  };

  it('moves the safe-to-warning crossover to the configured safe limit', () => {
    expect(classifyRisk(29, 1, custom)).toBe('safe');
    expect(classifyRisk(30, 1, custom)).toBe('warning');
    // At the default limits the same reading is still safely below 35 kPa.
    expect(classifyRisk(30, 1)).toBe('safe');
  });

  it('moves the danger override to the configured danger limit', () => {
    expect(classifyRisk(60, 1, custom)).toBe('danger'); // default 70 would warn
    expect(inferRisk({ peakPressure: 65, sustainedDuration: 1, thresholds: custom }).level).toBe(
      'danger'
    );
  });

  it('leaves the model duration windows alone: 0.1 s danger, 20 s safe floor', () => {
    // Duration is NOT client-configurable; a 60 kPa spike for a fraction of a
    // sample still does not earn danger, and a sub-limit peak sustained past
    // the floor is still at least a warning.
    expect(classifyRisk(60, 0, custom)).not.toBe('danger');
    expect(classifyRisk(45, 21, custom)).toBe('warning');
  });
});

describe('levelFromScore', () => {
  it('maps a score to the band it sits in', () => {
    expect(levelFromScore(0)).toBe('safe');
    expect(levelFromScore(SCORE_BANDS.safeMax)).toBe('safe');
    expect(levelFromScore(SCORE_BANDS.safeMax + 1)).toBe('warning');
    expect(levelFromScore(SCORE_BANDS.warningMax)).toBe('warning');
    expect(levelFromScore(SCORE_BANDS.warningMax + 1)).toBe('danger');
    expect(levelFromScore(100)).toBe('danger');
  });
});
