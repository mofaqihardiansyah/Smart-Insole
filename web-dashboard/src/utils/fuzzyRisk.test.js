import { describe, it, expect } from 'vitest';
import {
  RISK_THRESHOLDS,
  SCORE_BANDS,
  RULES,
  inferRisk,
  classifyRisk,
  trapezoid,
  triangle,
  buildSets,
  alignScoreToLevel,
} from './fuzzyRisk';

/**
 * These tests encode the clinical contract the fuzzy engine has to honour,
 * taken from the design brief and the technical spec. They are the reason the
 * engine was tuned the way it was: if a future change makes a 40 kPa reading
 * "safe", this file fails before a patient is told they are fine.
 */
describe('membership functions', () => {
  it('trapezoid rises, plateaus and falls', () => {
    // [0, 0, 24, 35]: flat at 1 up to 24, gone at 35
    expect(trapezoid(0, 0, 0, 24, 35)).toBe(1);
    expect(trapezoid(12, 0, 0, 24, 35)).toBe(1);
    expect(trapezoid(24, 0, 0, 24, 35)).toBe(1);
    expect(trapezoid(35, 0, 0, 24, 35)).toBe(0);
    expect(trapezoid(36, 0, 0, 24, 35)).toBe(0);
    expect(trapezoid(29.5, 0, 0, 24, 35)).toBeCloseTo(0.5, 6);
  });

  it('handles a degenerate shoulder without dividing by zero', () => {
    // This is how "low pressure" reaches 1.0 at exactly 0 kPa.
    expect(Number.isFinite(trapezoid(0, 0, 0, 24, 35))).toBe(true);
  });

  it('triangle is a symmetric special case', () => {
    expect(triangle(45.85, 26.95, 45.85, 70)).toBe(1);
    expect(triangle(26.95, 26.95, 45.85, 70)).toBe(0);
    expect(triangle(70, 26.95, 45.85, 70)).toBe(0);
  });

  it('rejects values outside the domain and non-numbers', () => {
    expect(trapezoid(-5, 0, 0, 24, 35)).toBe(0);
    expect(trapezoid(NaN, 0, 0, 24, 35)).toBe(0);
    expect(trapezoid(Infinity, 0, 0, 24, 35)).toBe(0);
  });
});

describe('rule base', () => {
  it('has a complete 3x3 rule set with no gaps', () => {
    expect(RULES).toHaveLength(9);
    const combos = RULES.map((r) => `${r.pressure}.${r.duration}`);
    expect(new Set(combos).size).toBe(9);
  });

  it('only reaches danger from high pressure and prolonged load', () => {
    // This is the rule that makes "over 70 kPa briefly is a warning, sustained
    // past 30 seconds is danger" fall out of the table.
    const dangerRules = RULES.filter((r) => r.consequence === 'danger');
    expect(dangerRules).toHaveLength(1);
    expect(dangerRules[0].pressure).toBe('high');
    expect(dangerRules[0].duration).toBe('prolonged');
  });
});

describe('clinical classification', () => {
  const cases = [
    // [peakPressure, sustainedDuration, expected level]
    [0, 0, 'safe'],
    [12, 0, 'safe'],
    [25, 3, 'safe'],
    // The safe-to-warning crossover sits slightly BELOW the 35 kPa limit, not
    // above it. Warning a little early is the safe direction to be wrong in;
    // the assertion below pins that behaviour down.
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
    // Conservative by design: the crossover lands at or before 35 kPa, never
    // after it.
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
    // 500 kPa instantaneously is a warning until it has been sustained, which is
    // the behaviour the spec asks for.
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
  it('is monotone in pressure at every duration', () => {
    // A score that drops while pressure rises would be a bug on a clinical
    // index. This is why the engine uses a Sugeno weighted average rather than
    // a Mamdani centroid.
    for (const duration of [0, 5, 10, 15, 25, 30, 45, 60]) {
      let previous = -1;
      for (let pressure = 0; pressure <= 120; pressure += 1) {
        const { score } = inferRisk({
          peakPressure: pressure,
          sustainedDuration: duration,
        });
        expect(
          score,
          `score dropped at ${pressure} kPa with ${duration} s sustained`
        ).toBeGreaterThanOrEqual(previous);
        previous = score;
      }
    }
  });

  it('is monotone in duration at every pressure', () => {
    for (const pressure of [10, 20, 40, 60, 80, 100, 120]) {
      let previous = -1;
      for (let duration = 0; duration <= 90; duration += 1) {
        const { score } = inferRisk({
          peakPressure: pressure,
          sustainedDuration: duration,
        });
        expect(
          score,
          `score dropped at ${duration} s with ${pressure} kPa`
        ).toBeGreaterThanOrEqual(previous);
        previous = score;
      }
    }
  });

  it('always reports a score inside the band its level implies', () => {
    // The number and the level must never contradict each other.
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

describe('trace and thresholds', () => {
  it('reports which rules fired and how strongly', () => {
    const result = inferRisk({ peakPressure: 80, sustainedDuration: 30 });

    expect(result.firings.length).toBeGreaterThan(0);
    for (const firing of result.firings) {
      expect(firing.strength).toBeGreaterThan(0);
      expect(firing.strength).toBeLessThanOrEqual(1);
    }
    // Prolonged high pressure should fire the one danger rule.
    const dangerStrength = result.strengthsByConsequence.danger;
    expect(dangerStrength).toBeGreaterThan(0);
    expect(result.level).toBe('danger');
  });

  it('derives its sets from the thresholds, so editing them changes behaviour', () => {
    const tight = {
      ...RISK_THRESHOLDS,
      warningKpa: 20,
      dangerKpa: 40,
    };

    // A reading that is safe under the defaults becomes a warning under tighter
    // limits, and the score moves with it.
    expect(classifyRisk(25, 1)).toBe('safe');
    expect(classifyRisk(25, 1, tight)).toBe('warning');

    const defaultScore = inferRisk({ peakPressure: 25, sustainedDuration: 1 }).score;
    const tightScore = inferRisk({
      peakPressure: 25,
      sustainedDuration: 1,
      thresholds: tight,
    }).score;
    expect(tightScore).toBeGreaterThan(defaultScore);
  });

  it('reproduces the tuned breakpoints from the default thresholds', () => {
    const sets = buildSets();
    expect(sets.pressure.low).toEqual([0, 0, 0.7 * 35, 35]);
    expect(sets.duration.brief).toEqual([0, 0, 5, 14]);
    // Open-ended sets have an infinite upper shoulder so that an off-scale
    // reading still belongs to a set instead of falling through to "safe".
    expect(sets.pressure.high[3]).toBe(Infinity);
    expect(sets.duration.prolonged[3]).toBe(Infinity);
  });

  it('clamps an aligned score into its band', () => {
    expect(alignScoreToLevel(10, 'danger')).toBe(SCORE_BANDS.warningMax + 1);
    expect(alignScoreToLevel(90, 'safe')).toBe(SCORE_BANDS.safeMax);
    expect(alignScoreToLevel(200, 'danger')).toBe(100);
    expect(alignScoreToLevel(-5, 'safe')).toBe(0);
  });
});
