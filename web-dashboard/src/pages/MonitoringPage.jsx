import React, { useMemo, useState } from "react";
import { Activity, BarChart3 } from "lucide-react";
import { useInsole } from "../context/InsoleContext";
import { t } from "../utils/i18n";
import {
  GlassCard,
  GlassLabel,
  GlassSelect,
  GlassTable,
  GlassTableCell,
  GlassTableRow,
  PanelHeader,
  StatePanel,
  StateRetry,
  StatusChip,
  PageHeader,
} from "../components/ui/GlassComponents";
import { Chip } from "../components/ui/Chip";
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
 *
 * The session register below the chart is a real table from `md` up and stacked
 * definition rows below it, because a table cannot reflow.
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
    reconnect,
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
    <section className="space-y-5 lg:space-y-6">
      <PageHeader
        title={t("monitoring.title", language)}
        subtitle={t("monitoring.subtitle", language)}
        meta={<StatusChip level={risk} label={levelLabel} size="sm" />}
        actions={
          // A real, keyboard reachable control instead of a swipe gesture.
          <div className="w-full sm:w-40">
            <GlassLabel htmlFor="monitoring-window" className="mb-1.5">
              {t("monitoring.axisTime", language)}
            </GlassLabel>
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
          title={t("monitoring.chartTitle", language)}
          icon={<Activity className="h-4 w-4" />}
          action={
            <Chip tone="danger">
              {`${t("monitoring.threshold", language)}: ${thresholds.dangerKpa} ${t(
                "metrics.unit.kpa",
                language
              )}`}
            </Chip>
          }
        />

        <div className="px-6 pb-6">
          {!hasData ? (
            connectionState === "connecting" ? (
              <StatePanel variant="loading" title={t("monitoring.loading", language)} />
            ) : connectionState === "error" ? (
              // Cause, then the one action that clears it. Without this branch
              // a dead device would look like a foot that has never been
              // measured, which is a different and much less urgent problem.
              <StatePanel
                variant="error"
                title={t("source.errorTitle", language)}
                description={t("source.errorBody", language)}
                action={
                  <StateRetry
                    onRetry={reconnect}
                    label={t("common.retry", language)}
                  />
                }
              />
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
          <p className="border-t border-border px-6 py-3 text-body-sm text-muted">
            {t("source.simBody", language)}
          </p>
        )}
      </GlassCard>

      <GlassCard flush>
        <PanelHeader
          title={t("monitoring.summary", language)}
          icon={<BarChart3 className="h-4 w-4" />}
          action={
            <span className="tabular-data text-body-sm text-muted">
              {`${t("risk.score", language)}: ${riskScore} / 100`}
            </span>
          }
        />

        {!hasData ? (
          <p className="px-6 pb-6 text-body-sm text-muted">
            {t("common.notAvailable", language)}
          </p>
        ) : (
          <>
            {/* Desktop register */}
            <div className="hidden border-t border-border md:block">
              <GlassTable bare>
                <thead>
                  <tr>
                    <GlassTableCell as="th" scope="col">
                      {t("dashboard.col.zone", language)}
                    </GlassTableCell>
                    <GlassTableCell as="th" scope="col">
                      {t("monitoring.average", language)}
                    </GlassTableCell>
                    <GlassTableCell as="th" scope="col">
                      {t("monitoring.maximum", language)}
                    </GlassTableCell>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((entry) => (
                    <GlassTableRow key={entry.key}>
                      <th
                        scope="row"
                        className="px-6 py-4 text-left align-middle text-body-base font-semibold text-fg"
                      >
                        {t(`anatomy.${entry.key}`, language)}
                      </th>
                      <GlassTableCell>
                        {entry.average.toFixed(1)} {t("metrics.unit.kpa", language)}
                      </GlassTableCell>
                      <GlassTableCell>
                        {entry.peak.toFixed(1)} {t("metrics.unit.kpa", language)}
                      </GlassTableCell>
                    </GlassTableRow>
                  ))}
                </tbody>
              </GlassTable>
            </div>

            {/* Mobile: the same rows as stacked definitions. */}
            <dl className="divide-y divide-border-strong border-t border-border md:hidden">
              {stats.map((entry) => (
                <div key={entry.key} className="px-6 py-4">
                  <dt className="text-body-base font-semibold text-fg">
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
      </GlassCard>
    </section>
  );
};

export default MonitoringPage;
