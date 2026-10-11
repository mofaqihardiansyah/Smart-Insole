import React, { useMemo, useState } from "react";
import { Activity, BarChart3 } from "lucide-react";
import { useInsole } from "../context/InsoleContext";
import { t } from "../utils/i18n";
import {
  GlassCard,
  PanelHeader,
  GlassSelect,
  StatePanel,
  StatusChip,
  PageHeader,
} from "../components/ui/GlassComponents";
import {
  TelemetryChart,
  TELEMETRY_SERIES,
} from "../components/monitoring/TelemetryChart";

/**
 * MonitoringPage — the pressure trend.
 *
 * This replaces a Swiper carousel whose "slides" were single numbers generated
 * by `Math.random()`. A carousel of invented points is not a trend chart: you
 * cannot see a trend one point at a time, and random values cannot show a
 * patient when their pressure rose.
 *
 * What it does now: draws the real 30 sample ring buffer from InsoleContext as
 * three continuous lines against the danger threshold, and offers a real window
 * control rather than a swipe gesture.
 */
const WINDOW_OPTIONS = [10, 20, 30];

const average = (values) =>
  values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;

const MonitoringPage = () => {
  const {
    history,
    thresholds,
    language,
    connectionState,
    source,
    risk,
    riskScore,
  } = useInsole();
  const [windowSize, setWindowSize] = useState(30);

  const visible = useMemo(() => history.slice(-windowSize), [history, windowSize]);

  /** Real per-sensor statistics over the visible window. */
  const stats = useMemo(
    () =>
      TELEMETRY_SERIES.map((series) => {
        const values = visible.map((record) => record.readings?.[series.key] ?? 0);
        return {
          key: series.key,
          average: average(values),
          peak: values.length ? Math.max(...values) : 0,
        };
      }),
    [visible]
  );

  const hasData = visible.length > 0;
  const levelLabel = t(`risk.${risk}`, language);

  return (
    <section className="space-y-4">
      <PageHeader
        title={t("monitoring.title", language)}
        subtitle={t("monitoring.subtitle", language)}
        meta={<StatusChip level={risk} label={levelLabel} size="sm" />}
        actions={
          // A real, keyboard reachable control instead of a swipe gesture.
          <div className="w-full min-w-[10rem] sm:w-40">
            <label
              htmlFor="monitoring-window"
              className="mb-1.5 block text-label uppercase text-muted"
            >
              {t("monitoring.axisTime", language)}
            </label>
            <GlassSelect
              id="monitoring-window"
              value={windowSize}
              onChange={(event) => setWindowSize(Number(event.target.value))}
            >
              {WINDOW_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {`${option} ${t("metrics.unit.seconds", language)}`}
                </option>
              ))}
            </GlassSelect>
          </div>
        }
      />

      <GlassCard flush>
        <PanelHeader
          label={t("monitoring.chartTitle", language)}
          icon={<Activity className="h-4 w-4" />}
          action={
            <span className="tabular-data text-body-sm text-muted">
              {`${thresholds.dangerKpa} ${t("metrics.unit.kpa", language)}`}
            </span>
          }
        />

        <div className="p-4">
          {!hasData ? (
            connectionState === "connecting" ? (
              <StatePanel variant="loading" title={t("monitoring.loading", language)} />
            ) : (
              <StatePanel
                variant="empty"
                title={t("monitoring.empty", language)}
                description={t("monitoring.emptyBody", language)}
              />
            )
          ) : (
            <TelemetryChart
              history={visible}
              dangerKpa={thresholds.dangerKpa}
              labels={{
                chartTitle: t("monitoring.chartTitle", language),
                threshold: t("monitoring.threshold", language),
                axisTime: t("monitoring.axisTime", language),
                axisPressure: t("monitoring.axisPressure", language),
                forefoot: t("anatomy.forefoot.short", language),
                midfoot: t("anatomy.midfoot.short", language),
                heel: t("anatomy.heel.short", language),
                samples: t("metrics.unit.seconds", language),
              }}
            />
          )}
        </div>

        {source === "SIMULATOR" && (
          <p className="border-t border-border px-4 py-3 text-body-sm text-muted">
            {t("source.simBody", language)}
          </p>
        )}
      </GlassCard>

      <GlassCard flush>
        <PanelHeader
          label={t("monitoring.summary", language)}
          icon={<BarChart3 className="h-4 w-4" />}
        />

        {!hasData ? (
          <p className="px-4 py-6 text-body-sm text-muted">
            {t("common.notAvailable", language)}
          </p>
        ) : (
          <>
            {/* Desktop register */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[32rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border bg-surface-2">
                    <th scope="col" className="px-4 py-2.5 text-label uppercase text-muted">
                      {t("risk.status", language)}
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-label uppercase text-muted">
                      {t("monitoring.average", language)}
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-label uppercase text-muted">
                      {t("monitoring.maximum", language)}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((entry) => (
                    <tr key={entry.key} className="border-b border-border last:border-b-0">
                      <th
                        scope="row"
                        className="px-4 py-2.5 text-left text-body-sm font-medium text-fg"
                      >
                        {t(`anatomy.${entry.key}`, language)}
                      </th>
                      <td className="tabular-data px-4 py-2.5 text-body-sm text-fg">
                        {entry.average.toFixed(1)} {t("metrics.unit.kpa", language)}
                      </td>
                      <td className="tabular-data px-4 py-2.5 text-body-sm text-fg">
                        {entry.peak.toFixed(1)} {t("metrics.unit.kpa", language)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile register: a table cannot reflow, so it becomes labelled rows */}
            <dl className="divide-y divide-border md:hidden">
              {stats.map((entry) => (
                <div key={entry.key} className="px-4 py-3">
                  <dt className="text-label uppercase text-muted">
                    {t(`anatomy.${entry.key}`, language)}
                  </dt>
                  <dd className="mt-2 space-y-1">
                    <div className="flex items-center justify-between gap-3 text-body-sm">
                      <span className="text-muted">
                        {t("monitoring.average", language)}
                      </span>
                      <span className="tabular-data text-fg">
                        {entry.average.toFixed(1)} {t("metrics.unit.kpa", language)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-body-sm">
                      <span className="text-muted">
                        {t("monitoring.maximum", language)}
                      </span>
                      <span className="tabular-data text-fg">
                        {entry.peak.toFixed(1)} {t("metrics.unit.kpa", language)}
                      </span>
                    </div>
                  </dd>
                </div>
              ))}
            </dl>
          </>
        )}

        <p className="border-t border-border px-4 py-3 text-body-sm text-muted">
          {`${t("risk.score", language)}: ${riskScore} / 100`}
        </p>
      </GlassCard>
    </section>
  );
};

export default MonitoringPage;
