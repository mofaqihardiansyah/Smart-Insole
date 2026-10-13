import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { RISK_THRESHOLDS, inferRisk } from '../utils/randomForestRisk';
import { playAlertBeep, stopAlertBeep } from '../utils/audioAlert';
import * as defaultTransport from '../services/firebaseRealtime';

/**
 * InsoleContext: the single source of live insole state for the whole app.
 *
 * Two ingestion sources feed one pipeline:
 *
 *   SIMULATOR  the scenario generator, for demos and for when no device is
 *              reachable. Always labelled as such in the UI.
 *   FIREBASE   the real Realtime Database listener at `readings/latest`.
 *
 * Both converge on one `sample` value, and one effect derives sustained
 * duration, risk and history from it. That way there is exactly one place where
 * a reading becomes a risk verdict, and no chance of the two paths drifting.
 *
 * Risk verdict precedence: when the device publishes its own `risk_status` /
 * `fuzzy_risk_score`, those win, because the firmware measured the foot. The
 * client only runs its own fuzzy inference when the device has not sent a
 * verdict.
 */

export const InsoleContext = createContext(undefined);

/** Ring buffer length for the live chart. */
export const HISTORY_LIMIT = 30;

const SIMULATION_INTERVAL_MS = 1000;

/**
 * How long to wait for the first device packet before declaring the connection
 * dead. Long enough for a slow mobile network, short enough that nobody sits in
 * front of an empty dashboard.
 */
export const FIREBASE_GRACE_MS = 4000;

const ZERO_READINGS = { forefoot: 0, midfoot: 0, heel: 0 };

/** One sample travelling down the ingestion pipeline. */
const INITIAL_SAMPLE = Object.freeze({
  readings: ZERO_READINGS,
  deviceRiskLevel: null,
  deviceRiskScore: null,
  batteryPercent: null,
  timestamp: null,
});

export const SOURCE = Object.freeze({ SIMULATOR: 'SIMULATOR', FIREBASE: 'FIREBASE' });

const randomKpa = (min, max) =>
  parseFloat((min + Math.random() * (max - min)).toFixed(2));

/**
 * Simulator scenario generators (anatomical sensor points, values in kPa).
 * Each returns a fresh object so every tick is a new sample.
 */
const SCENARIO_GENERATORS = {
  // Comfortable walking pattern: 10-30 kPa everywhere.
  NORMAL_GAIT: () => ({
    forefoot: randomKpa(10, 30),
    midfoot: randomKpa(10, 30),
    heel: randomKpa(10, 30),
  }),
  // Forefoot-dominant overload: forefoot 45-75 kPa, the other points stay low.
  FOREFOOT_OVERLOAD: () => ({
    forefoot: randomKpa(45, 75),
    midfoot: randomKpa(10, 25),
    heel: randomKpa(12, 30),
  }),
  // Sustained standing load: 40-65 kPa on every point.
  PROLONGED_STANDING: () => ({
    forefoot: randomKpa(40, 65),
    midfoot: randomKpa(40, 65),
    heel: randomKpa(40, 65),
  }),
  // Unloaded foot: 0-5 kPa.
  RESTING: () => ({
    forefoot: randomKpa(0, 5),
    midfoot: randomKpa(0, 5),
    heel: randomKpa(0, 5),
  }),
};

export const SIMULATION_SCENARIOS = Object.keys(SCENARIO_GENERATORS);

export const generateSimulatorReadings = (scenario) =>
  (SCENARIO_GENERATORS[scenario] || SCENARIO_GENERATORS.NORMAL_GAIT)();

export const peakOf = (readings) =>
  Math.max(readings.forefoot, readings.midfoot, readings.heel);

/**
 * Sustained durations are counted in consecutive samples (1 sample = 1 second),
 * walking backwards from the newest sample. A sample below the threshold resets
 * the corresponding duration to zero. The current sample counts as the first
 * second of its own run.
 *
 * @param {Array<{ readings: object }>} previousHistory
 * @param {number} currentMax peak pressure of the incoming sample
 * @param {object} [thresholds]
 * @returns {{ warningDuration: number, dangerDuration: number }}
 */
export const measureSustainedDurations = (
  previousHistory,
  currentMax,
  thresholds = RISK_THRESHOLDS
) => {
  const { warningKpa, dangerKpa } = thresholds;
  let warningDuration = 0;
  let dangerDuration = 0;

  if (currentMax >= warningKpa) {
    warningDuration = 1;
    for (let i = previousHistory.length - 1; i >= 0; i -= 1) {
      if (peakOf(previousHistory[i].readings) < warningKpa) break;
      warningDuration += 1;
    }
  }

  if (currentMax > dangerKpa) {
    dangerDuration = 1;
    for (let i = previousHistory.length - 1; i >= 0; i -= 1) {
      if (peakOf(previousHistory[i].readings) <= dangerKpa) break;
      dangerDuration += 1;
    }
  }

  return { warningDuration, dangerDuration };
};

/** Validate a partial threshold object, falling back to the defaults. */
const sanitiseThresholds = (candidate) => {
  const next = { ...RISK_THRESHOLDS };
  if (!candidate || typeof candidate !== 'object') return next;

  for (const key of Object.keys(RISK_THRESHOLDS)) {
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

const readStoredLanguage = () => {
  try {
    const stored = localStorage.getItem('language');
    return stored === 'id' || stored === 'en' ? stored : 'id';
  } catch {
    return 'id';
  }
};

/**
 * Theme preference.
 *
 * Dark is the product's default because the Romer instrument language is what
 * gives this dashboard its identity, so a first-time visitor gets the intended
 * design rather than whatever their operating system happens to prefer. The
 * choice is remembered from then on.
 */
/**
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {boolean} [props.autoConnect=false]
 *   When true the provider attempts a Firebase connection on mount and silently
 *   falls back to the simulator if the device never answers. Tests leave this
 *   off so they never open a socket.
 * @param {object} [props.transport]
 *   Injectable Realtime Database transport. Defaults to the real service; tests
 *   pass a stub.
 */
export const InsoleProvider = ({
  children,
  autoConnect = false,
  transport = defaultTransport,
}) => {
  const [sample, setSample] = useState(INITIAL_SAMPLE);
  const [sustainedDuration, setSustainedDuration] = useState(0);
  const [risk, setRisk] = useState('safe');
  const [riskScore, setRiskScore] = useState(0);
  const [severity, setSeverity] = useState(0);
  const [source, setSource] = useState(
    autoConnect ? SOURCE.FIREBASE : SOURCE.SIMULATOR
  );
  const [connectionState, setConnectionState] = useState(
    autoConnect ? 'connecting' : 'simulated'
  );
  const [sourceReason, setSourceReason] = useState(null);
  const [batteryPercent, setBatteryPercent] = useState(null);
  const [thresholds, setThresholdsState] = useState(readStoredThresholds);
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem('isMuted') === 'true';
    } catch {
      return false;
    }
  });
  const [language, setLanguage] = useState(readStoredLanguage);
  const [simulationScenario, setSimulationScenario] = useState('NORMAL_GAIT');
  const [history, setHistory] = useState([]);
  const [incidentLogs, setIncidentLogs] = useState([]);
  const [acknowledgedAt, setAcknowledgedAt] = useState(0);
  /**
   * Bumped by `reconnect`. The subscription effect is keyed on it, so asking
   * for the same source again actually tears the old listener down and opens a
   * new one. Setting the source to the value it already holds would be a no-op
   * and the retry button would be a dead control.
   */
  const [connectNonce, setConnectNonce] = useState(0);

  const historyRef = useRef([]);
  const previousRiskRef = useRef('safe');
  // Set when the user picks a source themselves, so the automatic connection
  // never overrides a deliberate choice.
  const manualSourceRef = useRef(false);
  // Identity of the last processed input. It tracks the threshold set as well
  // as the sample, because changing a threshold has to re-derive the verdict
  // from the reading already on screen rather than waiting for the next one.
  // Seeded with the initial values so the mount render is not treated as a
  // reading, and StrictMode's double-invoked effect cannot append a duplicate.
  const lastProcessedRef = useRef({ sample: INITIAL_SAMPLE, thresholds });

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

  useEffect(() => {
    try {
      localStorage.setItem('riskThresholds', JSON.stringify(thresholds));
    } catch {
      /* ignore */
    }
  }, [thresholds]);

  /* ------------------------------- simulator ------------------------------ */

  // 1 Hz scenario engine. Stopped the moment a real source takes over.
  useEffect(() => {
    if (source !== SOURCE.SIMULATOR) return undefined;
    const intervalId = setInterval(() => {
      setSample({
        readings: generateSimulatorReadings(simulationScenario),
        deviceRiskLevel: null,
        deviceRiskScore: null,
        batteryPercent: null,
        timestamp: Date.now(),
      });
    }, SIMULATION_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [source, simulationScenario]);

  /* ------------------------------- firebase ------------------------------- */

  useEffect(() => {
    if (source !== SOURCE.FIREBASE) return undefined;

    setConnectionState('connecting');
    let unsubscribe = () => {};

    const onData = (reading) => {
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

    const onError = (error) => {
      setConnectionState('error');
      setSourceReason(error?.message || 'firebase-error');
      // A device we chose to trust has gone quiet: keep the patient informed
      // rather than showing a frozen screen. An explicit manual selection is
      // left alone so the failure stays visible.
      if (autoConnect) setSource(SOURCE.SIMULATOR);
    };

    try {
      unsubscribe = transport.subscribeToReadings(onData, onError);
    } catch (error) {
      onError(error);
    }

    const graceTimer = setTimeout(() => {
      setConnectionState((prev) => (prev === 'live' ? prev : 'error'));
      setSourceReason((prev) => prev || 'no-device-data');
      if (autoConnect) setSource(SOURCE.SIMULATOR);
    }, FIREBASE_GRACE_MS);

    return () => {
      clearTimeout(graceTimer);
      unsubscribe?.();
    };
  }, [source, transport, autoConnect, connectNonce]);

  // Reflect the manual simulator choice honestly.
  useEffect(() => {
    if (source === SOURCE.SIMULATOR) setConnectionState('simulated');
  }, [source]);

  // The auth gate resolves after mount, so `autoConnect` typically arrives
  // late. When it turns on, and the user has not chosen a source themselves,
  // ask for Firebase. Without this the app would sit on the simulator forever
  // after a login.
  useEffect(() => {
    if (!autoConnect || manualSourceRef.current) return;
    setSource(SOURCE.FIREBASE);
  }, [autoConnect]);

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
      thresholds
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

    // Device verdict wins when present.
    const level = sample.deviceRiskLevel ?? inference.level;
    const score = sample.deviceRiskScore ?? inference.score;

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
   * Selecting a source by hand is a deliberate choice, so it is recorded and the
   * automatic connection stops second-guessing it.
   */
  const chooseSource = useCallback((next) => {
    manualSourceRef.current = true;
    setSource(next);
  }, []);

  /**
   * Ask the device feed again, right now.
   *
   * This is what a retry button calls. It re-selects Firebase and forces a new
   * subscription even when Firebase is already the chosen source, which is the
   * only way a retry can do anything after an explicit failure.
   */
  const reconnect = useCallback(() => {
    manualSourceRef.current = true;
    setSource(SOURCE.FIREBASE);
    setConnectNonce((prev) => prev + 1);
  }, []);

  const setThresholds = useCallback((next) => {
    setThresholdsState((prev) => sanitiseThresholds({ ...prev, ...next }));
  }, []);

  const resetThresholds = useCallback(
    () => setThresholdsState(RISK_THRESHOLDS),
    []
  );

  /**
   * Raw ingestion path: used by tests, and available for a future on-device
   * manual reading entry.
   */
  const setReadings = useCallback((nextReadings) => {
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

  const isLive = source === SOURCE.FIREBASE && connectionState === 'live';

  const contextValue = {
    // Live data
    readings,
    peakPressure,
    risk,
    riskScore,
    severity,
    source,
    setSource: chooseSource,
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
    // Simulator
    simulationScenario,
    setSimulationScenario,
    // Escape hatch for tests and manual entry
    setReadings,
  };

  return (
    <InsoleContext.Provider value={contextValue}>
      {children}
    </InsoleContext.Provider>
  );
};

export const useInsole = () => {
  const context = useContext(InsoleContext);
  if (context === undefined) {
    throw new Error('useInsole must be used within an InsoleProvider');
  }
  return context;
};

export default InsoleProvider;
