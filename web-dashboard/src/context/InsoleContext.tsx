import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { RISK_THRESHOLDS, alignScoreToLevel, inferRisk, levelFromScore } from '../utils/randomForestRisk';
import { playAlertBeep, stopAlertBeep } from '../utils/audioAlert';
import * as defaultTransport from '../services/firebaseRealtime';
import type {
  HistoryEntry,
  InsoleTransport,
  MappedReading,
  RiskLevel,
  RiskThresholds,
} from '../types/insole';
import { incidentsFromHistory, type StoredIncident } from '../utils/incidents';

/**
 * InsoleContext: the single source of live insole state for the whole app.
 *
 * There is exactly ONE ingestion source: FIREBASE, the Realtime Database
 * listener at `readings/latest`, carrying the real insole hardware's samples.
 * The demo scenario generator that used to sit beside it was removed on
 * purpose: a device the app falls back to fabricating numbers for is not a
 * monitoring tool, and the dashboard must never show a reading the patient's
 * foot did not produce. When no device answers, the app says so - connection
 * state `connecting`, then `error` - and shows an empty dashboard instead.
 *
 * One effect derives sustained duration, risk and history from the incoming
 * sample, so there is exactly one place where a reading becomes a risk
 * verdict.
 *
 * Risk verdict precedence: when the device publishes its own `risk_status` /
 * `risk_score`, those win, because the firmware measured the foot. The
 * client only runs its own RF inference when the device has not sent a verdict.
 */

/** The three sensor regions, before the derived duration is attached. */
export interface RegionReadings {
  forefoot: number;
  midfoot: number;
  heel: number;
}

/** One sample travelling down the ingestion pipeline. */
export interface LiveSample {
  readings: RegionReadings;
  deviceRiskLevel: RiskLevel | null;
  deviceRiskScore: number | null;
  batteryPercent: number | null;
  timestamp: number | null;
}

/** One buffered sample: the reading plus what was derived from it. */
export interface HistoryRecord {
  readings: RegionReadings & { sustainedDuration: number };
  peakPressure: number;
  risk: RiskLevel;
  score: number;
  timestamp: number;
}

/** A logged risk transition (never `safe`). */
export interface IncidentLog {
  type: RiskLevel;
  readings: HistoryRecord['readings'];
  score: number;
  timestamp: number;
}

/** Where the device feed currently stands. */
export type ConnectionState = 'idle' | 'connecting' | 'live' | 'error';

/** Everything `useInsole()` hands its callers. */
export interface InsoleContextValue {
  readings: RegionReadings & { sustainedDuration: number };
  peakPressure: number;
  risk: RiskLevel;
  riskScore: number;
  severity: number;
  reconnect: () => void;
  connectionState: ConnectionState;
  sourceReason: string | null;
  isLive: boolean;
  batteryPercent: number | null;
  /**
   * The clinical constants the risk engine runs on. Read-only: the same
   * numbers are compiled into the firmware, and changing one side without the
   * other would make the dashboard disagree with the device that measured the
   * foot. There is no editor, and no runtime override.
   */
  thresholds: RiskThresholds;
  history: HistoryRecord[];
  incidentLogs: IncidentLog[];
  /**
   * The incident register rebuilt from `readings/history`, newest last.
   *
   * Kept apart from `incidentLogs` on purpose: that live register drives the
   * alert modal and the unread count, so replaying stored incidents into it
   * would resurface an old alert on every refresh.
   */
  storedIncidents: StoredIncident[];
  unreadIncidentCount: number;
  acknowledgeIncidents: () => void;
  alertOpen: boolean;
  isMuted: boolean;
  toggleMute: () => void;
  language: string;
  setLanguage: React.Dispatch<React.SetStateAction<string>>;
  setReadings: (nextReadings: Partial<RegionReadings>) => void;
}

export const InsoleContext = createContext<InsoleContextValue | undefined>(undefined);

/** Ring buffer length for the live chart. */
export const HISTORY_LIMIT = 30;

/** localStorage key for the "mark as read" marker. */
const ACKNOWLEDGED_KEY = "incidentsAcknowledgedAt";

const readAcknowledgedAt = (): number => {
  try {
    const value = Number(localStorage.getItem(ACKNOWLEDGED_KEY));
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
};

/**
 * How many stored rows to pull from `readings/history` for the register.
 *
 * The firmware pushes once a second, so 200 rows is a little over three
 * minutes of monitoring — enough to survive a refresh without pulling the
 * whole, unbounded database node.
 */
export const STORED_HISTORY_LIMIT = 200;

/**
 * How long to wait for the first device packet before declaring the connection
 * dead. Long enough for a slow mobile network, short enough that nobody sits in
 * front of an empty dashboard.
 */
export const FIREBASE_GRACE_MS = 4000;

/**
 * Two device packets further apart than this never formed a sustained run.
 * The firmware pushes once per second, so a wider gap means a WiFi drop, a
 * reboot or a page reload sat between them — offline minutes must not count
 * as sustained pressure on a diabetic foot.
 */
export const MAX_PACKET_GAP_MS = 3000;

const ZERO_READINGS: RegionReadings = { forefoot: 0, midfoot: 0, heel: 0 };

/** One sample travelling down the ingestion pipeline. */
const INITIAL_SAMPLE: LiveSample = Object.freeze({
  readings: ZERO_READINGS,
  deviceRiskLevel: null,
  deviceRiskScore: null,
  batteryPercent: null,
  timestamp: null,
});

export const peakOf = (readings: RegionReadings): number =>
  Math.max(readings.forefoot, readings.midfoot, readings.heel);

/**
 * Sustained durations are counted in consecutive samples, walking backwards
 * from the newest sample. One buffered sample is one real second because the
 * firmware pushes at the same cadence it samples (FIREBASE_PUSH_MS =
 * SAMPLE_INTERVAL_MS = 1000 ms). A sample below the threshold resets the
 * corresponding duration to zero, and so does a packet gap longer than
 * MAX_PACKET_GAP_MS: offline minutes are not sustained pressure.
 *
 * @param {Array<{ readings: object, timestamp?: number|null }>} previousHistory
 * @param {number} currentMax peak pressure of the incoming sample
 * @param {object} [thresholds]
 * @param {number|null} [currentTimestamp] wall-clock ms of the incoming sample
 * @returns {{ warningDuration: number, dangerDuration: number }}
 */
export const measureSustainedDurations = (
  previousHistory: Array<Pick<HistoryRecord, 'readings' | 'timestamp'>>,
  currentMax: number,
  thresholds: RiskThresholds = RISK_THRESHOLDS,
  currentTimestamp: number | null = null
): { warningDuration: number; dangerDuration: number } => {
  const { warningKpa, dangerKpa } = thresholds;
  let warningDuration = 0;
  let dangerDuration = 0;

  // The firmware pushes once per second, so two packets further apart than
  // this did not form a run — a WiFi drop, a reboot, or a page reload sat in
  // between.
  const breaksRun = (
    newerTimestamp: number | null,
    olderTimestamp: number | null
  ) =>
    newerTimestamp != null &&
    olderTimestamp != null &&
    newerTimestamp - olderTimestamp > MAX_PACKET_GAP_MS;

  if (currentMax >= warningKpa) {
    warningDuration = 1;
    const newest = previousHistory[previousHistory.length - 1];
    if (!breaksRun(currentTimestamp, newest?.timestamp)) {
      for (let i = previousHistory.length - 1; i >= 0; i -= 1) {
        const newerTimestamp =
          i === previousHistory.length - 1
            ? currentTimestamp
            : previousHistory[i + 1].timestamp;
        if (breaksRun(newerTimestamp, previousHistory[i].timestamp)) break;
        if (peakOf(previousHistory[i].readings) < warningKpa) break;
        warningDuration += 1;
      }
    }
  }

  if (currentMax > dangerKpa) {
    dangerDuration = 1;
    const newest = previousHistory[previousHistory.length - 1];
    if (!breaksRun(currentTimestamp, newest?.timestamp)) {
      for (let i = previousHistory.length - 1; i >= 0; i -= 1) {
        const newerTimestamp =
          i === previousHistory.length - 1
            ? currentTimestamp
            : previousHistory[i + 1].timestamp;
        if (breaksRun(newerTimestamp, previousHistory[i].timestamp)) break;
        if (peakOf(previousHistory[i].readings) <= dangerKpa) break;
        dangerDuration += 1;
      }
    }
  }

  return { warningDuration, dangerDuration };
};

const readStoredLanguage = () => {
  try {
    // Indonesian is the only shipped language, so a preference left over from
    // an earlier build must not decide what this app renders. Force the
    // contract value and correct the stored copy so later readers agree.
    localStorage.setItem('language', 'id');
  } catch {
    /* storage unavailable (private mode); the default still applies */
  }
  return 'id';
};

/**
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {boolean} [props.autoConnect=false]
 *   When true the provider attempts a Firebase connection on mount. When the
 *   device never answers it sits on `connecting` and then `error` with the
 *   retry button. It never invents readings. Tests leave this off so they
 *   never open a socket.
 * @param {object} [props.transport]
 *   Injectable Realtime Database transport. Defaults to the real service; tests
 *   pass a stub.
 */
export const InsoleProvider = ({
  children,
  autoConnect = false,
  transport = defaultTransport,
  deviceId = null,
}: {
  children: React.ReactNode;
  autoConnect?: boolean;
  transport?: InsoleTransport;
  /** Paired device to read. Null keeps the legacy single-tenant paths. */
  deviceId?: string | null;
}) => {
  const [sample, setSample] = useState<LiveSample>(INITIAL_SAMPLE);
  const [sustainedDuration, setSustainedDuration] = useState(0);
  const [risk, setRisk] = useState<RiskLevel>('safe');
  const [riskScore, setRiskScore] = useState(0);
  const [severity, setSeverity] = useState(0);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    autoConnect ? 'connecting' : 'idle'
  );
  const [sourceReason, setSourceReason] = useState<string | null>(null);
  const [batteryPercent, setBatteryPercent] = useState<number | null>(null);
  // Clinical constants, identical to the firmware's compiled thresholds. No
  // editor, no localStorage override, no fleet config: a dashboard that could
  // move the boundary without reflashing the device would disagree with it.
  const thresholds: RiskThresholds = RISK_THRESHOLDS;
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem('isMuted') === 'true';
    } catch {
      return false;
    }
  });
  const [language, setLanguage] = useState<string>(readStoredLanguage);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [incidentLogs, setIncidentLogs] = useState<IncidentLog[]>([]);
  // Raw rows from `readings/history`. The incidents are derived, not stored:
  // the same rows re-derive under a new threshold like the live path does.
  const [storedHistory, setStoredHistory] = useState<HistoryEntry[]>([]);
  const [acknowledgedAt, setAcknowledgedAt] = useState(readAcknowledgedAt);
  /**
   * Bumped by `reconnect`. The subscription effect is keyed on it, so asking
   * for a new subscription actually tears the old listener down and opens a
   * new one.
   */
  const [connectNonce, setConnectNonce] = useState(0);

  const historyRef = useRef<HistoryRecord[]>([]);
  const previousRiskRef = useRef<RiskLevel>('safe');
  // Identity of the last processed sample. Seeded with the initial sample so
  // the mount render is not treated as a reading, and StrictMode's
  // double-invoked effect cannot append a duplicate.
  const lastProcessedRef = useRef<LiveSample>(INITIAL_SAMPLE);

  /* ------------------------------ persistence ----------------------------- */

  useEffect(() => {
    try {
      localStorage.setItem('isMuted', String(isMuted));
    } catch {
      /* storage unavailable (private mode); mute simply will not persist */
    }
  }, [isMuted]);

  useEffect(() => {
    try {
      localStorage.setItem('language', language);
    } catch {
      /* ignore */
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  /* -------------------------------- firebase ------------------------------- */

  useEffect(() => {
    if (!autoConnect) return undefined;

    setConnectionState('connecting');
    let unsubscribe = () => {};

    const onData = (reading: MappedReading) => {
      setConnectionState('live');
      setSourceReason(null);
      setBatteryPercent(reading.batteryPercent ?? null);
      setSample({
        readings: {
          forefoot: reading.readings.forefoot,
          midfoot: reading.readings.midfoot,
          heel: reading.readings.heel,
        },
        deviceRiskLevel: reading.riskLevel,
        deviceRiskScore: reading.riskScore,
        batteryPercent: reading.batteryPercent ?? null,
        timestamp: reading.timestamp ?? Date.now(),
      });
    };

    const onError = (error: Error) => {
      // A device we trust has gone quiet: say so, and wait for the next real
      // packet or the retry button. The old behaviour silently fell back to a
      // fabricated reading stream here; that trade (WR-02) was reversed when
      // the simulator was removed. An empty, honest dashboard beats a full,
      // invented one.
      setConnectionState('error');
      setSourceReason(error?.message || 'firebase-error');
    };

    try {
      unsubscribe =
        deviceId && transport.subscribeToDeviceReadings
          ? transport.subscribeToDeviceReadings(deviceId, onData, onError)
          : transport.subscribeToReadings(onData, onError);
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }

    const graceTimer = setTimeout(() => {
      setConnectionState((prev) => (prev === 'live' ? prev : 'error'));
      setSourceReason((prev) => prev || 'no-device-data');
    }, FIREBASE_GRACE_MS);

    return () => {
      clearTimeout(graceTimer);
      unsubscribe?.();
    };
  }, [transport, autoConnect, connectNonce, deviceId]);

  /**
   * Stored history: the register that survives a reload.
   *
   * Read-only, and deliberately quiet on failure — the readings feed is what
   * owns the connection state, and an unreadable history must not turn a live
   * dashboard into an error screen. Keyed on `connectNonce` so the page's
   * "reload" control refreshes the register too.
   */
  useEffect(() => {
    const deviceHistory = deviceId
      ? transport.subscribeToDeviceHistory
      : undefined;
    if (!autoConnect || (!deviceHistory && typeof transport.subscribeToHistory !== 'function')) {
      return undefined;
    }
    let unsubscribe = () => {};
    try {
      const onRows = (rows: HistoryEntry[]) => setStoredHistory(rows);
      unsubscribe = deviceId && deviceHistory
        ? deviceHistory(deviceId, onRows, undefined, STORED_HISTORY_LIMIT)
        : transport.subscribeToHistory!(onRows, undefined, STORED_HISTORY_LIMIT);
    } catch {
      /* denied or unconfigured: the register stays as whatever is in memory */
    }
    return () => unsubscribe?.();
  }, [transport, autoConnect, connectNonce, deviceId]);

  /* ------------------------------ ingestion ------------------------------- */

  // Single ingestion effect. It is keyed on the sample only — the thresholds
  // are constants now — and everything it derives is written to *other* state,
  // so it cannot re-trigger itself.
  useEffect(() => {
    if (sample === lastProcessedRef.current) return;
    lastProcessedRef.current = sample;

    const readings = sample.readings;
    const currentMax = peakOf(readings);
    const { warningDuration, dangerDuration } = measureSustainedDurations(
      historyRef.current,
      currentMax,
      thresholds,
      sample.timestamp ?? null
    );

    // Which run length matters depends on how high the pressure actually is.
    //
    // Feeding the "above the safe limit" run into a high-pressure sample would
    // let one 75 kPa spike after 29 seconds at 40 kPa report danger, because the
    // safe-limit run is already 30. That is not what the rule means: danger is
    // sustained HIGH pressure. So the danger run (consecutive samples above the
    // danger limit) is used once the peak itself is in the danger band, and the
    // safe-limit run is used below it. A brief high spike therefore reads as a
    // warning, which is the correct and cautious answer.
    const sustainedForInference =
      currentMax > thresholds.dangerKpa ? dangerDuration : warningDuration;

    const inference = inferRisk({
      peakPressure: currentMax,
      sustainedDuration: sustainedForInference,
      thresholds,
    });

    // Device verdict wins when present — as a PAIR. A packet may carry a level
    // without a score (or the reverse); the missing half is derived from the
    // present one, so the status chip and the score can never contradict each
    // other on screen (a "Waspada" chip beside a 0 score was possible when the
    // two fallbacks ran independently).
    const level =
      sample.deviceRiskLevel ??
      (sample.deviceRiskScore != null
        ? levelFromScore(sample.deviceRiskScore)
        : inference.level);
    const score =
      sample.deviceRiskScore ??
      (sample.deviceRiskLevel
        ? alignScoreToLevel(inference.score, sample.deviceRiskLevel)
        : inference.score);

    setSustainedDuration(warningDuration);
    setRisk(level);
    setRiskScore(score);
    setSeverity(inference.severity);

    const sampleReadings = { ...readings, sustainedDuration: warningDuration };
    const record = {
      readings: sampleReadings,
      peakPressure: currentMax,
      risk: level,
      score,
      timestamp: sample.timestamp ?? Date.now(),
    };

    const nextHistory = [...historyRef.current, record];
    if (nextHistory.length > HISTORY_LIMIT) {
      nextHistory.splice(0, nextHistory.length - HISTORY_LIMIT);
    }

    historyRef.current = nextHistory;
    setHistory(nextHistory);

    if (level !== previousRiskRef.current && level !== 'safe') {
      setIncidentLogs((prevLogs) => [
        ...prevLogs,
        { type: level, readings: sampleReadings, score, timestamp: record.timestamp },
      ]);
    }
    previousRiskRef.current = level;
  }, [sample]);

  /* -------------------------------- audio --------------------------------- */

  // Audio needs a user gesture before the browser will let it start. The mute
  // toggle doubles as that gesture, so an alert triggered before any
  // interaction still appears visually and in the incident log.
  useEffect(() => {
    try {
      if (risk === 'safe') {
        stopAlertBeep();
        return;
      }
      playAlertBeep(risk === 'danger' ? 'DANGER' : 'WARNING', isMuted);
    } catch {
      /* audio is a nicety; never let it break the dashboard */
    }
  }, [risk, isMuted]);

  /* ------------------------------- actions -------------------------------- */

  const toggleMute = useCallback(() => setIsMuted((prev) => !prev), []);

  /**
   * Ask the device feed again, right now.
   *
   * This is what a retry button calls. Firebase is the only source, so the
   * retry re-opens the subscription by bumping the nonce: the subscription
   * effect is keyed on it, and without the bump a retry after an explicit
   * failure would be a dead control.
   */
  const reconnect = useCallback(() => {
    setConnectNonce((prev) => prev + 1);
  }, []);

  /**
   * Raw ingestion path: used by tests, and available for a future on-device
   * manual reading entry.
   */
  const setReadings = useCallback((nextReadings: Partial<RegionReadings>) => {
    setSample({
      readings: {
        forefoot: Number(nextReadings?.forefoot) || 0,
        midfoot: Number(nextReadings?.midfoot) || 0,
        heel: Number(nextReadings?.heel) || 0,
      },
      deviceRiskLevel: null,
      deviceRiskScore: null,
      batteryPercent: null,
      timestamp: Date.now(),
    });
  }, []);

  const acknowledgeIncidents = useCallback(() => {
    const next = incidentLogs.length
      ? incidentLogs[incidentLogs.length - 1].timestamp
      : Date.now();
    setAcknowledgedAt(next);
    // Persisted so a reload does not resurrect alerts the carer already read.
    // Per browser: the device has no write path.
    try {
      localStorage.setItem(ACKNOWLEDGED_KEY, String(next));
    } catch {
      /* private mode: the marker still holds for this session */
    }
  }, [incidentLogs]);

  /* ------------------------------- derived -------------------------------- */

  const readings = useMemo(
    () => ({ ...sample.readings, sustainedDuration }),
    [sample.readings, sustainedDuration]
  );

  const peakPressure = useMemo(() => peakOf(sample.readings), [sample.readings]);

  // The register rebuilt from stored rows. Re-derives when a threshold
  // changes, exactly like the live ingestion effect does.
  const storedIncidents = useMemo(
    () => incidentsFromHistory(storedHistory, thresholds),
    [storedHistory, thresholds]
  );

  const latestIncident = incidentLogs.length
    ? incidentLogs[incidentLogs.length - 1]
    : null;

  const unreadIncidentCount = useMemo(
    () => incidentLogs.filter((log) => log.timestamp > acknowledgedAt).length,
    [incidentLogs, acknowledgedAt]
  );

  // The early-warning modal opens when the foot is not safe and the current
  // incident has not been acknowledged.
  const alertOpen =
    risk !== 'safe' &&
    latestIncident !== null &&
    latestIncident.timestamp > acknowledgedAt;

  const isLive = connectionState === 'live';

  const contextValue: InsoleContextValue = {
    // Live data
    readings,
    peakPressure,
    risk,
    riskScore,
    severity,
    reconnect,
    connectionState,
    sourceReason,
    isLive,
    batteryPercent,
    // Thresholds: clinical constants, identical to the firmware's
    thresholds,
    // Alerts and history
    history,
    incidentLogs,
    storedIncidents,
    unreadIncidentCount,
    acknowledgeIncidents,
    alertOpen,
    // Preferences
    isMuted,
    toggleMute,
    language,
    setLanguage,
    // Escape hatch for tests and manual entry
    setReadings,
  };

  return (
    <InsoleContext.Provider value={contextValue}>
      {children}
    </InsoleContext.Provider>
  );
};

export const useInsole = (): InsoleContextValue => {
  const context = useContext(InsoleContext);
  if (context === undefined) {
    throw new Error('useInsole must be used within an InsoleProvider');
  }
  return context;
};

export default InsoleProvider;
