import { describe, it, expect } from 'vitest';
import { incidentsFromHistory, mergeIncidents } from './incidents';
import { RISK_THRESHOLDS } from './randomForestRisk';
import type { HistoryEntry } from '../types/insole';
import type { IncidentLog } from '../context/InsoleContext';

/**
 * The stored register is what makes the History page survive a reload, so these
 * tests pin the two rules that keep it honest: an incident is a transition, and
 * the device verdict beats client inference.
 */

/** One stored row, with only the fields the register reads made explicit. */
const row = (
  timestamp: number,
  overrides: Partial<HistoryEntry> = {}
): HistoryEntry => ({
  id: `row-${timestamp}`,
  readings: { forefoot: 10, midfoot: 5, heel: 4, sustainedDuration: 0 },
  peakPressure: 10,
  riskLevel: 'safe',
  riskScore: 0,
  batteryPercent: null,
  deviceId: 'insole-01',
  timestamp,
  ...overrides,
});

describe('incidentsFromHistory', () => {
  it('logs a transition, not every sample of a run', () => {
    const incidents = incidentsFromHistory([
      row(1000, { riskLevel: 'safe' }),
      row(2000, { riskLevel: 'warning' }),
      row(3000, { riskLevel: 'warning' }),
      row(4000, { riskLevel: 'warning' }),
      row(5000, { riskLevel: 'safe' }),
    ]);

    expect(incidents.map((i) => i.type)).toEqual(['warning']);
    expect(incidents[0].timestamp).toBe(2000);
  });

  it('keeps an escalation and a de-escalation as separate incidents', () => {
    const incidents = incidentsFromHistory([
      row(1000, { riskLevel: 'warning' }),
      row(2000, { riskLevel: 'danger' }),
      row(3000, { riskLevel: 'safe' }),
      row(4000, { riskLevel: 'warning' }),
    ]);

    expect(incidents.map((i) => i.type)).toEqual([
      'warning',
      'danger',
      'warning',
    ]);
  });

  it('trusts the device verdict over client inference', () => {
    // A 10 kPa row the firmware called danger is danger: the device measured
    // the foot, the client only reads the number.
    const incidents = incidentsFromHistory([
      row(1000, { peakPressure: 10, riskLevel: 'danger', riskScore: 88 }),
    ]);

    expect(incidents).toHaveLength(1);
    expect(incidents[0].type).toBe('danger');
    expect(incidents[0].score).toBe(88);
  });

  it('infers a level when an older firmware sends no verdict', () => {
    const incidents = incidentsFromHistory([
      row(1000, {
        peakPressure: 220,
        riskLevel: null,
        riskScore: null,
        readings: { forefoot: 220, midfoot: 10, heel: 10, sustainedDuration: 1 },
      }),
    ]);

    expect(incidents.map((i) => i.type)).toEqual(['danger']);
  });

  it('carries the peak the live log lacks', () => {
    const incidents = incidentsFromHistory([
      row(1000, {
        riskLevel: 'warning',
        peakPressure: 84.1,
        readings: { forefoot: 42, midfoot: 18, heel: 84.1, sustainedDuration: 3 },
      }),
    ]);

    expect(incidents[0].peakPressure).toBe(84.1);
    expect(incidents[0].readings.sustainedDuration).toBe(3);
  });

  it('drops rows with no timestamp rather than sorting them as 1970', () => {
    const incidents = incidentsFromHistory([
      row(1000, { riskLevel: 'warning' }),
      row(2000, { riskLevel: 'warning', timestamp: null }),
    ]);

    expect(incidents).toHaveLength(1);
  });

  it('sorts out-of-order rows before walking the transitions', () => {
    const incidents = incidentsFromHistory([
      row(3000, { riskLevel: 'safe' }),
      row(1000, { riskLevel: 'warning' }),
      row(2000, { riskLevel: 'warning' }),
    ]);

    expect(incidents).toHaveLength(1);
    expect(incidents[0].timestamp).toBe(1000);
  });

  it('returns nothing for a run that never left safe', () => {
    expect(
      incidentsFromHistory([row(1000), row(2000), row(3000)])
    ).toEqual([]);
    expect(incidentsFromHistory([])).toEqual([]);
  });

  it('re-derives under a changed danger threshold', () => {
    const low = incidentsFromHistory(
      [row(1000, { riskLevel: null, peakPressure: 50, riskScore: null })],
      RISK_THRESHOLDS
    );
    expect(low.map((i) => i.type)).toEqual(['warning']);
  });
});

describe('mergeIncidents', () => {
  const stored = incidentsFromHistory([
    row(2000, { riskLevel: 'warning', peakPressure: 80 }),
  ]);

  const live: IncidentLog = {
    type: 'warning',
    readings: { forefoot: 80, midfoot: 20, heel: 15, sustainedDuration: 1 },
    score: 60,
    timestamp: 2000,
  };

  it('collapses an overlap onto the stored row, which carries the peak', () => {
    const merged = mergeIncidents(stored, [live]);

    expect(merged).toHaveLength(1);
    expect(merged[0].peakPressure).toBe(80);
  });

  it('keeps a live incident the stored snapshot has not seen yet', () => {
    const merged = mergeIncidents(stored, [{ ...live, timestamp: 5000 }]);

    expect(merged.map((i) => i.timestamp)).toEqual([2000, 5000]);
  });

  it('derives a peak for a live row from its regional readings', () => {
    const merged = mergeIncidents([], [live]);

    expect(merged[0].peakPressure).toBe(80);
  });

  it('returns rows oldest first', () => {
    const merged = mergeIncidents(
      incidentsFromHistory([
        row(9000, { riskLevel: 'danger' }),
        row(3000, { riskLevel: 'warning' }),
      ]),
      [{ ...live, timestamp: 6000 }]
    );

    expect(merged.map((i) => i.timestamp)).toEqual([3000, 6000, 9000]);
  });
});
