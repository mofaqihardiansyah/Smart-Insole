/**
 * The incident register, rebuilt from `readings/history`.
 *
 * The live register (`InsoleContext.incidentLogs`) only exists while the tab is
 * open: it is appended in memory every time the risk level changes, so a reload
 * erases it. The Realtime Database keeps every pushed sample, so the same
 * register can be reconstructed after a refresh by walking those rows.
 *
 * Two properties keep this honest:
 *
 *  - An incident is a *transition*, not a sample. The firmware pushes once a
 *    second, so a warning that lasts a minute is one incident, not sixty rows.
 *  - The device verdict wins. A row's `riskLevel` comes from the firmware, which
 *    measured the foot; client inference only fills the gaps in rows an older
 *    firmware pushed without a verdict.
 */

import { RISK_THRESHOLDS, inferRisk } from './randomForestRisk';
import type { HistoryEntry, RiskLevel, RiskThresholds } from '../types/insole';
import type { IncidentLog } from '../context/InsoleContext';

/**
 * One stored incident: the live `IncidentLog` shape plus the peak that the
 * live log does not carry. `HistoryPage` renders the peak, and a stored row
 * still has the raw regional readings to derive it from.
 */
export interface StoredIncident extends IncidentLog {
  peakPressure: number;
}

/** The level a stored row carries, from the device or from client inference. */
const levelOfRow = (
  row: HistoryEntry,
  thresholds: RiskThresholds
): RiskLevel =>
  row.riskLevel ??
  inferRisk({
    peakPressure: row.peakPressure,
    sustainedDuration: row.readings.sustainedDuration,
    thresholds,
  }).level;

/**
 * Rebuild the incident register from stored rows, oldest first.
 *
 * Rows without a timestamp are dropped: a register row that cannot be placed on
 * a timeline is worse than an absent one, because it would sort as 1970.
 */
export function incidentsFromHistory(
  rows: HistoryEntry[],
  thresholds: RiskThresholds = RISK_THRESHOLDS
): StoredIncident[] {
  const incidents: StoredIncident[] = [];
  let previousLevel: RiskLevel = 'safe';

  const timed = rows
    .filter((row) => row.timestamp != null)
    .sort((a, b) => (a.timestamp as number) - (b.timestamp as number));

  for (const row of timed) {
    const level = levelOfRow(row, thresholds);
    const isTransition = level !== 'safe' && level !== previousLevel;
    previousLevel = level;

    if (!isTransition) continue;

    const inference = inferRisk({
      peakPressure: row.peakPressure,
      sustainedDuration: row.readings.sustainedDuration,
      thresholds,
    });

    incidents.push({
      type: level,
      readings: { ...row.readings },
      score: row.riskScore ?? inference.score,
      timestamp: row.timestamp as number,
      peakPressure: row.peakPressure,
    });
  }

  return incidents;
}

/**
 * Merge the stored register with the live one, newest win per timestamp.
 *
 * The two sources overlap while the tab is open: a transition the live
 * ingestion just appended also lands in the next history snapshot. The stored
 * row wins because it carries the peak the live row lacks; `type` breaks a tie
 * within the same second so a warning and a danger are both kept.
 */
export function mergeIncidents(
  stored: StoredIncident[],
  live: IncidentLog[]
): StoredIncident[] {
  const merged = new Map<string, StoredIncident>();
  for (const log of live) {
    const peaks = [
      log.readings.forefoot,
      log.readings.midfoot,
      log.readings.heel,
    ].filter(Number.isFinite);
    merged.set(`${log.timestamp}-${log.type}`, {
      ...log,
      peakPressure: peaks.length ? Math.max(...peaks) : Number.NaN,
    });
  }

  // Stored wins: set after the live pass so it overwrites an overlapping key.
  for (const incident of stored) {
    merged.set(`${incident.timestamp}-${incident.type}`, incident);
  }

  return Array.from(merged.values()).sort((a, b) => a.timestamp - b.timestamp);
}
