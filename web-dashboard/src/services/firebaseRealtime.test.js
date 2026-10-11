import { describe, it, expect } from 'vitest';
import { mapReadingPacket, mapHistory } from './firebaseRealtime';

/**
 * The RTDB wire format is snake_case with a `_kpa` suffix; the app speaks
 * camelCase. All of that translation lives in these two functions, so this is
 * the only place a firmware field rename can break the client, and the only
 * place it needs to be caught.
 */
describe('mapReadingPacket', () => {
  const packet = {
    deviceId: 'insole-01',
    timestamp: 1791244800000,
    forefoot_kpa: 42.5,
    midfoot_kpa: 18.2,
    heel_kpa: 84.1,
    sustained_duration_sec: 35,
    fuzzy_risk_score: 82.4,
    risk_status: 'DANGER',
    battery_percent: 94,
  };

  it('maps a full firmware packet', () => {
    const mapped = mapReadingPacket(packet);

    expect(mapped.readings).toEqual({
      forefoot: 42.5,
      midfoot: 18.2,
      heel: 84.1,
      sustainedDuration: 35,
    });
    expect(mapped.peakPressure).toBe(84.1);
    expect(mapped.riskLevel).toBe('danger');
    expect(mapped.riskScore).toBe(82);
    expect(mapped.batteryPercent).toBe(94);
    expect(mapped.deviceId).toBe('insole-01');
    expect(mapped.timestamp).toBe(1791244800000);
  });

  it('distinguishes an empty snapshot from a real reading', () => {
    // This is what lets the UI say "waiting for the device" instead of showing
    // a row of zeros as if they were measurements.
    expect(mapReadingPacket(null)).toBeNull();
    expect(mapReadingPacket(undefined)).toBeNull();
    expect(mapReadingPacket({})).not.toBeNull(); // explicit zeros are data
  });

  it('defaults missing sensor fields to zero rather than NaN', () => {
    const mapped = mapReadingPacket({ timestamp: 1 });
    expect(mapped.readings.forefoot).toBe(0);
    expect(mapped.readings.midfoot).toBe(0);
    expect(mapped.readings.heel).toBe(0);
    expect(mapped.peakPressure).toBe(0);
  });

  it('accepts numeric strings from the device', () => {
    const mapped = mapReadingPacket({
      forefoot_kpa: '30.5',
      midfoot_kpa: '20',
      heel_kpa: '10',
    });
    expect(mapped.readings.forefoot).toBe(30.5);
    expect(mapped.peakPressure).toBe(30.5);
  });

  it('reports an absent device verdict as null, not as a made up level', () => {
    const mapped = mapReadingPacket({ forefoot_kpa: 10 });
    expect(mapped.riskLevel).toBeNull();
    expect(mapped.riskScore).toBeNull();
    expect(mapped.batteryPercent).toBeNull();
  });

  it('normalises the risk level and rejects unknown values', () => {
    expect(mapReadingPacket({ risk_status: 'DANGER' }).riskLevel).toBe('danger');
    expect(mapReadingPacket({ risk_status: ' warning ' }).riskLevel).toBe(
      'warning'
    );
    expect(mapReadingPacket({ risk_status: 'Safe' }).riskLevel).toBe('safe');
    expect(mapReadingPacket({ risk_status: 'banana' }).riskLevel).toBeNull();
    expect(mapReadingPacket({ risk_status: 42 }).riskLevel).toBeNull();
  });

  it('reads a seconds timestamp as seconds, not as milliseconds', () => {
    // An ESP32 sketch pushing time(nullptr) sends seconds. Treating that as
    // milliseconds would place every reading in 1970 and destroy ordering.
    const seconds = mapReadingPacket({ timestamp: 1791244800 });
    expect(seconds.timestamp).toBe(1791244800000);

    const millis = mapReadingPacket({ timestamp: 1791244800000 });
    expect(millis.timestamp).toBe(1791244800000);
  });
});

describe('mapHistory', () => {
  const historyObject = {
    '-OAAA': { timestamp: 1000, forefoot_kpa: 10, midfoot_kpa: 5, heel_kpa: 4 },
    '-OCCC': { timestamp: 3000, forefoot_kpa: 30, midfoot_kpa: 15, heel_kpa: 14 },
    '-OBBB': { timestamp: 2000, forefoot_kpa: 20, midfoot_kpa: 10, heel_kpa: 9 },
  };

  it('returns entries newest first with their push id', () => {
    const rows = mapHistory(historyObject);

    expect(rows).toHaveLength(3);
    expect(rows[0].id).toBe('-OCCC');
    expect(rows[0].readings.forefoot).toBe(30);
    expect(rows[2].id).toBe('-OAAA');
  });

  it('honours the limit', () => {
    expect(mapHistory(historyObject, 2)).toHaveLength(2);
  });

  it('returns an empty array for an absent history', () => {
    expect(mapHistory(null)).toEqual([]);
    expect(mapHistory(undefined)).toEqual([]);
    expect(mapHistory({})).toEqual([]);
  });

  it('drops malformed entries instead of throwing', () => {
    const rows = mapHistory({
      '-OK': { timestamp: 5000, forefoot_kpa: 1, midfoot_kpa: 1, heel_kpa: 1 },
      '-BAD': null,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('-OK');
  });
});
