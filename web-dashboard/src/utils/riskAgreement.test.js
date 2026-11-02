import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { inferRisk as rfInfer } from './randomForestRisk';
import { inferRisk as fuzzyInfer, RISK_THRESHOLDS } from './fuzzyRisk';

/**
 * Fase 3.4 — the Random Forest has to agree with the expert-rule (fuzzy) model
 * on at least 90% of the real DFN-DS distribution.
 *
 * The comparison is run twice: once on the 81.000 samples the forest was built
 * from, which is the number the roadmap asks for, and once on a uniform grid,
 * which is a harsher test but shows exactly where the two models are designed
 * to differ. `docs/validation-report.md` records both numbers.
 */
const DATASET = resolve(process.cwd(), '..', 'models', 'training-data.json');

const PRESSURE_MAX = 120;
const DURATION_MAX = 60;
const PRESSURE_STEP = 1;
const DURATION_STEP = 0.5;

function compare(peakPressure, sustainedDuration) {
  return {
    rf: rfInfer({ peakPressure, sustainedDuration }).level,
    fuzzy: fuzzyInfer({ peakPressure, sustainedDuration }).level,
  };
}

describe('RF vs expert-rule agreement (Fase 3.4)', () => {
  it('agrees on more than 90% of the 81.000 DFN-DS samples', () => {
    const dataset = JSON.parse(readFileSync(DATASET, 'utf8'));
    const patients = [...dataset.train, ...dataset.validation];
    const samples = patients.flatMap((patient) => patient.samples);

    expect(samples.length).toBe(81000);

    let agree = 0;
    const falseSafe = [];
    for (const sample of samples) {
      const { rf, fuzzy } = compare(sample.peak, sample.sustained);
      if (rf === fuzzy) agree += 1;
      // The dangerous error is calling a foot safe that the rule model flags
      // as danger. "safe vs warning" is an expected, documented divergence.
      if (rf === 'safe' && fuzzy === 'danger') {
        falseSafe.push({ sample, fuzzy });
      }
    }

    expect(agree / samples.length).toBeGreaterThan(0.9);
    expect(falseSafe.length).toBe(0);
  });

  it('disagrees on the grid only where the two models are designed to differ', () => {
    let total = 0;
    let agree = 0;
    const unexplained = [];

    for (let p = 0; p <= PRESSURE_MAX; p += PRESSURE_STEP) {
      for (let d = 0; d <= DURATION_MAX; d += DURATION_STEP) {
        const { rf, fuzzy } = compare(p, d);
        total += 1;
        if (rf === fuzzy) {
          agree += 1;
          continue;
        }
        const known =
          // Fuzzy's "medium pressure" set overlaps below the RF warning limit,
          // so a low foot can already read warning; RF keeps its safe floor.
          (rf === 'safe' && fuzzy === 'warning' && p < RISK_THRESHOLDS.warningKpa) ||
          // RF calls danger from 0.1 s of load; fuzzy needs "prolonged" load.
          (rf === 'danger' && fuzzy === 'warning' && p >= RISK_THRESHOLDS.dangerKpa) ||
          // Fuzzy warns on prolonged load below the danger pressure; RF does not.
          (rf === 'warning' &&
            fuzzy === 'danger' &&
            p >= RISK_THRESHOLDS.warningKpa &&
            p < RISK_THRESHOLDS.dangerKpa);
        if (!known) {
          unexplained.push({ p, d, rf, fuzzy });
        }
      }
    }

    expect(total).toBe(121 * 121);
    expect(agree / total).toBeGreaterThan(0.7);
    expect(unexplained).toEqual([]);
  });
});

/**
 * Fase 3.3 — degenerate input must never throw and must never invent a
 * reading. A missing sensor packet is `safe`, not a crash and not a warning.
 */
describe('edge cases (Fase 3.3)', () => {
  const safeCases = [
    ['no arguments', {}],
    ['empty object pressure', { peakPressure: undefined }],
    ['NaN pressure', { peakPressure: Number.NaN }],
    ['Infinity pressure', { peakPressure: Number.POSITIVE_INFINITY }],
    ['NaN duration', { peakPressure: 20, sustainedDuration: Number.NaN }],
    ['negative pressure', { peakPressure: -10, sustainedDuration: 5 }],
    ['negative duration', { peakPressure: 20, sustainedDuration: -5 }],
  ];

  it.each(safeCases)('treats %s as a zero reading', (_label, input) => {
    for (const infer of [rfInfer, fuzzyInfer]) {
      const verdict = infer(input);
      expect(verdict.level).toBe('safe');
      expect(Number.isFinite(verdict.score)).toBe(true);
    }
  });

  it('classifies an extreme 500 kPa reading without overflowing the score', () => {
    const rf = rfInfer({ peakPressure: 500, sustainedDuration: 1 });
    const fuzzy = fuzzyInfer({ peakPressure: 500, sustainedDuration: 1 });

    // Same peak, different duration contract: RF's danger rule fires from
    // 0.1 s, fuzzy needs prolonged load. Both stay inside the score band.
    expect(rf.level).toBe('danger');
    expect(fuzzy.level).toBe('warning');
    for (const verdict of [rf, fuzzy]) {
      expect(Number.isFinite(verdict.score)).toBe(true);
      expect(verdict.score).toBeGreaterThanOrEqual(0);
      expect(verdict.score).toBeLessThanOrEqual(100);
    }
  });

  it('treats a 500 kPa instant as at least a warning', () => {
    expect(rfInfer({ peakPressure: 500, sustainedDuration: 0 }).level).toBe('warning');
    expect(fuzzyInfer({ peakPressure: 500, sustainedDuration: 0 }).level).toBe(
      'warning'
    );
  });

  it('honours admin thresholds without leaving the level score band', () => {
    const thresholds = { ...RISK_THRESHOLDS, warningKpa: 25, dangerKpa: 50 };
    const verdict = rfInfer({
      peakPressure: 30,
      sustainedDuration: 1,
      thresholds,
    });
    expect(verdict.level).toBe('warning');
    expect(verdict.score).toBeGreaterThanOrEqual(48);
  });
});
