import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { RISK_THRESHOLDS, inferRisk, levelFromScore } from '../utils/randomForestRisk';
import { alignScoreToLevel } from '../utils/fuzzyRisk';
import { playAlertBeep, stopAlertBeep } from '../utils/audioAlert';
import * as defaultTransport from '../services/firebaseRealtime';
import type {
  GlobalRiskConfig,
  InsoleTransport,
  MappedReading,
  RiskLevel,
  RiskThresholds,
} from '../types/insole';

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
 * `fuzzy_risk_score`, those win, because the firmware measured the foot. The
 * client only runs its own fuzzy inference when the device has not sent a
 * verdict.
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
  thresholds: RiskThresholds;
  setThresholds: (next: Partial<RiskThresholds>) => void;
  resetThresholds: () => void;
  history: HistoryRecord[];
  incidentLogs: IncidentLog[];
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

/** Validate a partial threshold object, falling back to the defaults. */
const sanitiseThresholds = (
  candidate: Partial<RiskThresholds> | null | undefined
): RiskThresholds => {
  const next = { ...RISK_THRESHOLDS };
  if (!candidate || typeof candidate !== 'object') return next;

  for (const key of Object.keys(RISK_THRESHOLDS) as Array<keyof RiskThresholds>) {
    const value = Number(candidate[key]);
    if (Number.isFinite(value) && value > 0) next[key] = value;
  }
  // Danger must stay above warning or the bands would invert.
  if (next.dangerKpa <= next.warningKpa) {
    next.dangerKpa = next.warningKpa + 1;
  }
  return next;
};

const readStoredThresholds = () => {
  try {
    const raw = localStorage.getItem('riskThresholds');
    return raw ? sanitiseThresholds(JSON.parse(raw)) : RISK_THRESHOLDS;
  } catch {
    return RISK_THRESHOLDS;
  }
};

/** Has this browser ever saved its own thresholds in Settings? */
const readHasLocalOverride = () => {
  try {
    return localStorage.getItem('riskThresholds') != null;
  } catch {
    return false;
  }
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
}: {
  children: React.ReactNode;
  autoConnect?: boolean;
  transport?: InsoleTransport;
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
  const [thresholds, setThresholdsState] = useState<RiskThresholds>(readStoredThresholds);
  // True once this browser saves its own thresholds in Settings (or already
  // had a stored copy at load). The admin global config seeds the defaults
  // for everyone else and never rewrites a personal choice.
  const hasLocalOverrideRef = useRef(readHasLocalOverride());
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
  const [acknowledgedAt, setAcknowledgedAt] = useState(0);
  /**
   * Bumped by `reconnect`. The subscription effect is keyed on it, so asking
   * for a new subscription actually tears the old listener down and opens a
   * new one.
   */
  const [connectNonce, setConnectNonce] = useState(0);

  const historyRef = useRef<HistoryRecord[]>([]);
  const previousRiskRef = useRef<RiskLevel>('safe');
  // Identity of the last processed input. It tracks the threshold set as well
  // as the sample, because changing a threshold has to re-derive the verdict
  // from the reading already on screen rather than waiting for the next one.
  // Seeded with the initial values so the mount render is not treated as a
  // reading, and StrictMode's double-invoked effect cannot append a duplicate.
  const lastProcessedRef = useRef<{ sample: LiveSample; thresholds: RiskThresholds }>({
    sample: INITIAL_SAMPLE,
    thresholds,
  });

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

  // Thresholds are persisted by setThresholds/resetThresholds only — the
  // explicit Settings actions. Persisting every change here would snapshot the
  // admin's global config into localStorage on first load and permanently pin
  // it as a "personal" override.

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
      unsubscribe = transport.subscribeToReadings(onData, onError);
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
  }, [transport, autoConnect, connectNonce]);

  // Admin-configured thresholds: `config/global` seeds the safe/danger kPa
  // for every dashboard that has NOT saved its own values in Settings. A
  // saved personal preference always wins — the admin panel sets the fleet
  // default, not an override of a clinician's per-patient tuning. Failures
  // are silent on purpose: the defaults already in place are correct, and the
  // readings feed reports its own connectivity problems.
  useEffect(() => {
    if (!autoConnect || typeof transport.subscribeToGlobalConfig !== 'function') {
      return undefined;
    }
    let unsubscribe = () => {};
    try {
      unsubscribe = transport.subscribeToGlobalConfig(
        (config: GlobalRiskConfig) => {
        if (hasLocalOverrideRef.current) return;
        setThresholdsState(
          sanitiseThresholds({
            ...RISK_THRESHOLDS,
            warningKpa: config.safeThreshold,
            dangerKpa: config.dangerThreshold,
          })
        );
      });
    } catch {
      /* unconfigured or denied: the defaults already in place apply */
    }
    return () => unsubscribe?.();
  }, [transport, autoConnect]);

  /* ------------------------------ ingestion ------------------------------- */

  // Single ingestion effect. It is keyed on the sample and the thresholds, and
  // everything it derives is written to *other* state, so it cannot re-trigger
  // itself.
  useEffect(() => {
    const isNewSample = sample !== lastProcessedRef.current.sample;
    const thresholdsChanged =
      thresholds !== lastProcessedRef.current.thresholds;

    if (!isNewSample && !thresholdsChanged) return;
    lastProcessedRef.current = { sample, thresholds };

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

    // Only a genuinely new reading joins the ring buffer and the incident log.
    // A threshold edit re-derives the current verdict but must not invent an
    // incident that no reading produced.
    if (!isNewSample) {
      previousRiskRef.current = level;
      return;
    }

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
  }, [sample, thresholds]);

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
   * Explicit Settings save: merges the change, persists it as this browser's
   * override (so the admin global default stops rewriting it), and applies it
   * immediately — the ingestion effect re-derives the verdict from the
   * reading already on screen.
   */
  const setThresholds = useCallback(
    (next: Partial<RiskThresholds>) => {
      const value = sanitiseThresholds({ ...thresholds, ...next });
      setThresholdsState(value);
      try {
        localStorage.setItem('riskThresholds', JSON.stringify(value));
      } catch {
        /* storage unavailable (private mode); the change still applies this session */
      }
      hasLocalOverrideRef.current = true;
    },
    [thresholds]
  );

  /**
   * Back to the shared defaults — which now includes the admin's global
   * config: dropping the stored override lets the fleet default apply again.
   */
  const resetThresholds = useCallback(() => {
    setThresholdsState(RISK_THRESHOLDS);
    try {
      localStorage.removeItem('riskThresholds');
    } catch {
      /* ignore */
    }
    hasLocalOverrideRef.current = false;
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
    setAcknowledgedAt(
      incidentLogs.length
        ? incidentLogs[incidentLogs.length - 1].timestamp
        : Date.now()
    );
  }, [incidentLogs]);

  /* ------------------------------- derived -------------------------------- */

  const readings = useMemo(
    () => ({ ...sample.readings, sustainedDuration }),
    [sample.readings, sustainedDuration]
  );

  const peakPressure = useMemo(() => peakOf(sample.readings), [sample.readings]);

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
    // Thresholds
    thresholds,
    setThresholds,
    resetThresholds,
    // Alerts and history
    history,
    incidentLogs,
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
