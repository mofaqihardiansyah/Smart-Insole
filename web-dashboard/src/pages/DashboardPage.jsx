import React, { useMemo } from "react";
import {
  Activity,
  Gauge,
  Timer,
  Radio,
  FlaskConical,
  AlertTriangle,
} from "lucide-react";
import { useInsole } from "../context/InsoleContext";
import { t } from "../utils/i18n";
import {
  GlassCard,
  PanelHeader,
  StatusChip,
  StatusBanner,
  StatePanel,
  PageHeader,
} from "../components/ui/GlassComponents";
import { BentoGrid } from "../components/dashboard/BentoGrid";
import { StatusCard } from "../components/dashboard/StatusCard";
import { SimulatorControl } from "../components/dashboard/SimulatorControl";
import { TelemetryChart } from "../components/monitoring/TelemetryChart";
import PlantarHeatmap from "../components/PlantarHeatmap";

/**
 * DashboardPage — the monitoring console, and the focal point of the product.
 *
 * The composition mirrors the reference command dashboard: a row of metric
 * tiles across the top, then a two-zone body with the primary visual on the
 * left and the live verdict plus incident feed on the right, then the waveform
 * full width. On mobile it collapses to a single column with the pressure map
 * first, because the map is what a patient recognises before any number.
 *
 * Every value here is either measured, explicitly simulated, or shown as
 * unavailable. There is no placeholder number dressed up as a reading.
 *
 * Accessibility:
 * - Numeric readouts are NOT in a live region. Three numbers changing every
 *   second would make a screen reader unusable. One `aria-live="polite"` region
 *   announces the risk LEVEL, and only when it changes.
 * - Risk is carried by StatusChip, which renders an icon shape and a translated
 *   label as well as a colour.
 * - The data source is a neutral badge with an icon, not a risk chip, because
 *   "simulated" is not a clinical state.
 */
const DashboardPage = () => {
  const {
    readings,
    peakPressure,
    risk,
    riskScore,
    source,
    connectionState,
    isLive,
    batteryPercent,
    language,
    history,
    incidentLogs,
    thresholds,
    simulationScenario,
    setSimulationScenario,
  } = useInsole();

  const levelLabel = t(`risk.${risk}`, language);

  const balance = useMemo(() => {
    const total =
      (readings.forefoot || 0) + (readings.midfoot || 0) + (readings.heel || 0);
    if (total <= 0) return { forefoot: 0, midfoot: 0, heel: 0 };
    return {
      forefoot: Math.round((readings.forefoot / total) * 100),
      midfoot: Math.round((readings.midfoot / total) * 100),
      heel: Math.round((readings.heel / total) * 100),
    };
  }, [readings]);

  /** Top tiles: the four things a carer checks first. */
  const tiles = [
    {
      id: "peak",
      title: t("metrics.peakPressure", language),
      icon: <Gauge className="h-4 w-4" />,
      value: Number(peakPressure || 0).toFixed(1),
      unit: t("metrics.unit.kpa", language),
      footer: (
        <p className="mt-2 text-body-sm text-muted">
          {`${t("monitoring.threshold", language)} ${thresholds.dangerKpa} ${t("metrics.unit.kpa", language)}`}
        </p>
      ),
    },
    {
      id: "duration",
      title: t("metrics.sustainedDuration", language),
      icon: <Timer className="h-4 w-4" />,
      value: String(Number(readings.sustainedDuration || 0)),
      unit: t("metrics.unit.seconds", language),
      footer: (
        <p className="mt-2 text-body-sm text-muted">
          {`${t("settings.dangerSeconds", language)} ${thresholds.dangerSeconds}`}
        </p>
      ),
    },
    {
      id: "score",
      title: t("risk.score", language),
      icon: <Activity className="h-4 w-4" />,
      value: String(riskScore),
      unit: "/ 100",
      footer: <StatusChip level={risk} label={levelLabel} size="sm" className="mt-2" />,
    },
    {
      id: "supply",
      title: t("device.battery", language),
      icon:
        source === "FIREBASE" ? (
          <Radio className="h-4 w-4" />
        ) : (
          <FlaskConical className="h-4 w-4" />
        ),
      value:
        Number.isFinite(batteryPercent) ? String(Math.round(batteryPercent)) : "--",
      unit: Number.isFinite(batteryPercent)
        ? t("metrics.unit.percent", language)
        : "",
      footer: (
        <p className="mt-2 text-body-sm text-muted">
          {Number.isFinite(batteryPercent)
            ? source === "FIREBASE"
              ? t("source.live", language)
              : t("source.simulator", language)
            : t("device.unavailable", language)}
        </p>
      ),
    },
  ];

  const sensorTiles = ["forefoot", "midfoot", "heel"].map((key) => ({
    id: key,
    title: t(`anatomy.${key}.short`, language),
    value: Number(readings[key] || 0).toFixed(1),
    unit: t("metrics.unit.kpa", language),
    label: t(`anatomy.${key}`, language),
  }));

  const recentIncidents = incidentLogs.slice(-5).reverse();

  const sourceBanner = (() => {
    if (source === "FIREBASE" && connectionState === "error") {
      return (
        <StatusBanner tone="danger" title={t("source.errorTitle", language)}>
          {t("source.errorBody", language)}
        </StatusBanner>
      );
    }
    if (source === "FIREBASE" && connectionState === "connecting") {
      return <StatePanel variant="loading" title={t("source.connecting", language)} />;
    }
    if (source === "SIMULATOR") {
      return (
        <StatusBanner tone="warning" title={t("source.simTitle", language)}>
          {t("source.simBody", language)}
        </StatusBanner>
      );
    }
    return null;
  })();

  return (
    <section className="space-y-4">
      {/* Risk level changes are announced; the numbers deliberately are not. */}
      <p className="sr-only" aria-live="polite">
        {`${t("risk.status", language)}: ${levelLabel}`}
      </p>

      <PageHeader
        title={t("dashboard.title", language)}
        subtitle={t("dashboard.subtitle", language)}
        meta={
          <span className="inline-flex items-center gap-2 text-body-sm text-muted">
            {source === "FIREBASE" ? (
              <Radio className="h-4 w-4" aria-hidden="true" />
            ) : (
              <FlaskConical className="h-4 w-4" aria-hidden="true" />
            )}
            {source === "FIREBASE"
              ? isLive
                ? t("source.live", language)
                : t("source.connecting", language)
              : t("source.simulator", language)}
          </span>
        }
      />

      {sourceBanner}

      {/* Row 1: the four headline tiles. */}
      <BentoGrid cards={tiles} columns={4} />

      {/* Row 2: primary visual on the left, verdict and feed on the right. */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <GlassCard flush>
            <PanelHeader
              label={t("dashboard.plantarView", language)}
              icon={<Activity className="h-4 w-4" />}
              action={<StatusChip level={risk} label={levelLabel} size="sm" />}
            />

            <div className="plot-surface p-4">
              <PlantarHeatmap className="mx-auto max-h-[460px]" />
            </div>

            {/* The colour scale is labelled, and the swatches use the same risk
                tokens as the map nodes, so the ramp is never the only signal. */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border px-4 py-3 text-body-sm text-muted">
              <span className="text-label uppercase">{t("dashboard.legend", language)}</span>
              <span className="inline-flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block h-2.5 w-2.5 rounded-full bg-safe"
                />
                {t("dashboard.legendLow", language)}
              </span>
              <span className="inline-flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block h-2.5 w-2.5 rounded-full bg-warning"
                />
                {t("risk.warning", language)}
              </span>
              <span className="inline-flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block h-2.5 w-2.5 rounded-full bg-danger"
                />
                {t("dashboard.legendHigh", language)}
              </span>
            </div>
          </GlassCard>
        </div>

        <div className="space-y-4">
          <StatusCard
            level={risk}
            label={levelLabel}
            score={riskScore}
            advice={t(`risk.advice.${risk}`, language)}
            scoreLabel={t("risk.score", language)}
          />

          <GlassCard flush>
            <PanelHeader
              label={t("dashboard.recentIncidents", language)}
              icon={<AlertTriangle className="h-4 w-4" />}
            />

            {recentIncidents.length === 0 ? (
              <p className="px-4 py-6 text-body-sm text-muted">
                {t("history.empty", language)}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {recentIncidents.map((incident, index) => (
                  <li
                    key={`${incident.timestamp}-${index}`}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                  >
                    <StatusChip
                      level={incident.type}
                      label={t(`risk.${incident.type}`, language)}
                      size="sm"
                    />
                    <span className="tabular-data text-body-sm text-muted">
                      {new Date(incident.timestamp).toLocaleTimeString(
                        language === "id" ? "id-ID" : "en-GB"
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Row 3: per-sensor readings and load distribution. */}
      <BentoGrid cards={sensorTiles} columns={3} />

      <GlassCard className="p-4">
        <p className="text-label uppercase text-muted">
          {t("metrics.balance", language)}
        </p>
        <div className="mt-3 space-y-3">
          {[
            { key: "forefoot", value: balance.forefoot, tone: "bg-secondary" },
            { key: "midfoot", value: balance.midfoot, tone: "bg-tertiary" },
            { key: "heel", value: balance.heel, tone: "bg-primary" },
          ].map((row) => (
            <div key={row.key}>
              <div className="flex items-center justify-between gap-3 text-body-sm">
                <span className="text-muted">
                  {t(`anatomy.${row.key}`, language)}
                </span>
                <span className="tabular-data text-fg">
                  {row.value}
                  {t("metrics.unit.percent", language)}
                </span>
              </div>
              <div
                role="meter"
                aria-valuenow={row.value}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${t(`anatomy.${row.key}`, language)}: ${row.value}%`}
                className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-3"
              >
                <div
                  className={`h-full rounded-full ${row.tone}`}
                  style={{ width: `${Math.max(1, row.value)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Row 4: the live waveform. */}
      <GlassCard flush>
        <PanelHeader
          label={t("monitoring.chartTitle", language)}
          icon={<Activity className="h-4 w-4" />}
        />
        <div className="p-4">
          {history.length === 0 ? (
            <StatePanel variant="loading" title={t("monitoring.loading", language)} />
          ) : (
            <TelemetryChart
              history={history}
              dangerKpa={thresholds.dangerKpa}
              labels={{
                chartTitle: t("monitoring.chartTitle", language),
                threshold: t("monitoring.threshold", language),
                axisTime: t("monitoring.axisTime", language),
                axisPressure: t("monitoring.axisPressure", language),
                forefoot: t("anatomy.forefoot.short", language),
                midfoot: t("anatomy.midfoot.short", language),
                heel: t("anatomy.heel.short", language),
              }}
            />
          )}
        </div>
      </GlassCard>

      {/* The simulator is only offered when it is the active source, and it says
          what it is rather than pretending to be a sensor. */}
      {source === "SIMULATOR" && (
        <SimulatorControl
          value={simulationScenario}
          onChange={setSimulationScenario}
          title={t("sim.title", language)}
          body={t("sim.body", language)}
          scenarioLabel={t("sim.scenario", language)}
          options={[
            { value: "NORMAL_GAIT", label: t("sim.NORMAL_GAIT", language) },
            {
              value: "FOREFOOT_OVERLOAD",
              label: t("sim.FOREFOOT_OVERLOAD", language),
            },
            {
              value: "PROLONGED_STANDING",
              label: t("sim.PROLONGED_STANDING", language),
            },
            { value: "RESTING", label: t("sim.RESTING", language) },
          ]}
        />
      )}
    </section>
  );
};

export default DashboardPage;
