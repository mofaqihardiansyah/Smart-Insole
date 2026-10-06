import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export const InsoleContext = createContext(undefined);

const HISTORY_LIMIT = 30;
const WARNING_THRESHOLD_KPA = 35;
const DANGER_THRESHOLD_KPA = 70;
const WARNING_DURATION_SECONDS = 20;
const DANGER_DURATION_SECONDS = 30;
const SIMULATION_INTERVAL_MS = 1000;

const ZERO_READINGS = { forefoot: 0, midfoot: 0, heel: 0 };

const randomKpa = (min, max) =>
  parseFloat((min + Math.random() * (max - min)).toFixed(2));

/**
 * Simulator scenario generators (anatomical sensor points, values in kPa).
 * Each generator returns a fresh object so every tick is a new sample.
 */
const SCENARIO_GENERATORS = {
  // Comfortable walking pattern: 10-30 kPa everywhere.
  NORMAL_GAIT: () => ({
    forefoot: randomKpa(10, 30),
    midfoot: randomKpa(10, 30),
    heel: randomKpa(10, 30),
  }),
  // Forefoot-dominant overload: forefoot 45-75 kPa while midfoot/heel stay low.
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

export const generateSimulatorReadings = (scenario) =>
  (SCENARIO_GENERATORS[scenario] || SCENARIO_GENERATORS.NORMAL_GAIT)();

const peakPressure = (readings) =>
  Math.max(readings.forefoot, readings.midfoot, readings.heel);

/**
 * Sustained durations are counted in consecutive samples (1 sample = 1 second)
 * walking backwards from the newest sample. A sample below the threshold resets
 * the corresponding duration to zero. The current sample counts as the first
 * second of its own run.
 *
 * @param {Array<{readings: {forefoot: number, midfoot: number, heel: number}}>} previousHistory
 * @param {number} currentMax peak pressure of the incoming sample
 * @returns {{warningDuration: number, dangerDuration: number}}
 */
export const measureSustainedDurations = (previousHistory, currentMax) => {
  let warningDuration = 0;
  let dangerDuration = 0;

  if (currentMax >= WARNING_THRESHOLD_KPA) {
    warningDuration = 1;
    for (let i = previousHistory.length - 1; i >= 0; i -= 1) {
      if (peakPressure(previousHistory[i].readings) < WARNING_THRESHOLD_KPA) {
        break;
      }
      warningDuration += 1;
    }
  }

  if (currentMax > DANGER_THRESHOLD_KPA) {
    dangerDuration = 1;
    for (let i = previousHistory.length - 1; i >= 0; i -= 1) {
      if (peakPressure(previousHistory[i].readings) <= DANGER_THRESHOLD_KPA) {
        break;
      }
      dangerDuration += 1;
    }
  }

  return { warningDuration, dangerDuration };
};

/**
 * Risk classification:
 * - 'safe'    when peak < 35 kPa
 * - 'warning' when peak in [35, 70] kPa OR sustained warning >= 20 s
 *              (a peak above 70 kPa that has not yet been sustained for the
 *              full danger duration is also treated as 'warning' — it is
 *              elevated pressure that has not earned 'danger' yet)
 * - 'danger'  when peak > 70 kPa AND sustained danger >= 30 s
 */
export const classifyRisk = (currentMax, warningDuration, dangerDuration) => {
  if (
    currentMax > DANGER_THRESHOLD_KPA &&
    dangerDuration >= DANGER_DURATION_SECONDS
  ) {
    return 'danger';
  }
  if (
    currentMax >= WARNING_THRESHOLD_KPA ||
    warningDuration >= WARNING_DURATION_SECONDS
  ) {
    return 'warning';
  }
  return 'safe';
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/** Piecewise pressure -> 0..100 score: 0 kPa -> 0, 35 -> 50, 70 -> 85, 100 -> 100. */
const scoreFromPressure = (max) => {
  if (max <= 0) return 0;
  if (max < WARNING_THRESHOLD_KPA) {
    return (max / WARNING_THRESHOLD_KPA) * 50;
  }
  if (max <= DANGER_THRESHOLD_KPA) {
    return (
      50 +
      ((max - WARNING_THRESHOLD_KPA) /
        (DANGER_THRESHOLD_KPA - WARNING_THRESHOLD_KPA)) *
        35
    );
  }
  return 85 + Math.min((max - DANGER_THRESHOLD_KPA) / 30, 1) * 15;
};

/**
 * Risk score (0-100) aligned with the classification bands:
 * safe 0-49, warning 50-89, danger 90-100.
 */
export const computeRiskScore = (max, risk) => {
  const score = scoreFromPressure(max);
  if (risk === 'danger') return Math.round(clamp(score, 90, 100));
  if (risk === 'warning') return Math.round(clamp(score, 50, 89));
  return Math.round(clamp(score, 0, 49));
};

export const InsoleProvider = ({ children }) => {
  const [pressure, setPressure] = useState(ZERO_READINGS);
  const [sustainedDuration, setSustainedDuration] = useState(0);
  const [risk, setRisk] = useState('safe');
  const [riskScore, setRiskScore] = useState(0);
  const [source, setSource] = useState('SIMULATOR');
  const [isMuted, setIsMuted] = useState(
    () => localStorage.getItem('isMuted') === 'true'
  );
  const [language, setLanguage] = useState(() => {
    const stored = localStorage.getItem('language');
    return stored === 'id' || stored === 'en' ? stored : 'id';
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [simulationScenario, setSimulationScenario] = useState('NORMAL_GAIT');
  const [history, setHistory] = useState([]);
  const [incidentLogs, setIncidentLogs] = useState([]);

  const historyRef = useRef([]);
  const previousRiskRef = useRef('safe');
  // Tracks the last pressure object ingested by the sampling effect. It is
  // initialized with the mount value, so the initial zero sample is skipped and
  // React StrictMode's double-invoked effect cannot append a duplicate entry.
  const lastIngestedRef = useRef(pressure);

  useEffect(() => {
    localStorage.setItem('isMuted', String(isMuted));
  }, [isMuted]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // 1 Hz simulator engine; cleaned up whenever the source or scenario changes.
  useEffect(() => {
    if (source !== 'SIMULATOR') return undefined;
    const intervalId = setInterval(() => {
      setPressure(generateSimulatorReadings(simulationScenario));
    }, SIMULATION_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [source, simulationScenario]);

  // Single ingestion effect, keyed ONLY on the incoming sample. It derives
  // durations/risk from the sample plus the history it appends, so no state it
  // updates can re-trigger it (state updates here are all to *other* state).
  useEffect(() => {
    if (lastIngestedRef.current === pressure) return;
    lastIngestedRef.current = pressure;

    const currentMax = peakPressure(pressure);
    const { warningDuration, dangerDuration } = measureSustainedDurations(
      historyRef.current,
      currentMax
    );
    const nextRisk = classifyRisk(currentMax, warningDuration, dangerDuration);
    const sampleReadings = { ...pressure, sustainedDuration: warningDuration };
    const sample = {
      readings: sampleReadings,
      risk: nextRisk,
      timestamp: Date.now(),
    };

    const nextHistory = [...historyRef.current, sample];
    if (nextHistory.length > HISTORY_LIMIT) {
      nextHistory.splice(0, nextHistory.length - HISTORY_LIMIT);
    }

    historyRef.current = nextHistory;
    setHistory(nextHistory);
    setSustainedDuration(warningDuration);
    setRisk(nextRisk);
    setRiskScore(computeRiskScore(currentMax, nextRisk));

    if (nextRisk !== previousRiskRef.current && nextRisk !== 'safe') {
      setIncidentLogs((prevLogs) => [
        ...prevLogs,
        { type: nextRisk, readings: sampleReadings, timestamp: Date.now() },
      ]);
    }
    previousRiskRef.current = nextRisk;
  }, [pressure]);

  const toggleMute = useCallback(() => setIsMuted((prev) => !prev), []);

  // Raw ingestion path: used by tests and by the upcoming Firebase source.
  const setReadings = setPressure;

  const readings = useMemo(
    () => ({ ...pressure, sustainedDuration }),
    [pressure, sustainedDuration]
  );

  const contextValue = {
    readings,
    risk,
    riskScore,
    source,
    setSource,
    isMuted,
    toggleMute,
    language,
    setLanguage,
    activeTab,
    setActiveTab,
    simulationScenario,
    setSimulationScenario,
    history,
    incidentLogs,
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
