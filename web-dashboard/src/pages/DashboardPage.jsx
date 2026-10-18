import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  BatteryMedium,
  Check,
  Copy,
  Download,
  Gauge,
  History as HistoryIcon,
  Map as MapIcon,
  Minus,
  Timer,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useInsole } from "../context/InsoleContext";
import { useUser } from "../context/UserContext";
import { t } from "../utils/i18n";
import {
  GlassCard,
  PanelHeader,
  StatusChip,
  StatusBanner,
  StatePanel,
  StateRetry,
  PageHeader,
  GlassButton,
} from "../components/ui/GlassComponents";
import { Chip } from "../components/ui/Chip";
import { BentoGrid } from "../components/dashboard/BentoGrid";
import { LoadDonut } from "../components/dashboard/LoadDonut";
import { RowMenu } from "../components/dashboard/RowMenu";
import { SimulatorControl } from "../components/dashboard/SimulatorControl";
import { TrendChart } from "../components/monitoring/TrendChart";
import PlantarHeatmap from "../components/PlantarHeatmap";
import { downloadCsv, dateStamp } from "../utils/exportCsv";

/**
 * DashboardPage — the live console, and the focal point of the product.
 *
 * The composition follows the Verdana Health reference: a greeting row with the
 * two standing actions, four metric tiles, a wide trend panel beside a load
 * donut, the live reading feed, and the pressure map. Mobile collapses to one
 * column with the map last, because the page reads top-down as "how is it now,
 * which way is it going, what just happened, where exactly".
 *
 * Every value here is measured, explicitly simulated, or shown as unavailable.
 * There is no placeholder number dressed up as a reading, and the two chips
 * that look like the reference's trend markers are computed from the real ring
 * buffer rather than being decorative.
 *
 * Accessibility:
 * - Numeric readouts are NOT in a live region. Three numbers changing every
 *   second would make a screen reader unusable. One `aria-live="polite"` region
 *   announces the risk LEVEL, and only when it changes.
 * - Risk is carried by StatusChip, which renders an icon shape and a translated
 *   label as well as a colour.
 * - The reading table reflows into stacked rows below `md`, because a table
 *   cannot reflow and a horizontal scroll on a phone is not a layout.
 */

const ZONES = ["forefoot", "midfoot", "heel"];

/** The heaviest-loaded sensor point in one record. */
const peakZoneOf = (record) => {
  const readings = record?.readings || {};
  return ZONES.reduce(
    (best, key) =>
      Number(readings[key] || 0) > Number(readings[best] || 0) ? key : best,
    ZONES[0]
  );
};

const greetingKeyFor = (hour) => {
  if (hour < 11) return "dashboard.greeting.morning";
  if (hour < 18) return "dashboard.greeting.afternoon";
  return "dashboard.greeting.evening";
};

const STATUS_TEXT = {
  safe: "dashboard.statusSafe",
  warning: "dashboard.statusWarning",
  danger: "dashboard.statusDanger",
};

const STATUS_INK = {
  safe: "text-safe",
  warning: "text-warning",
  danger: "text-danger",
};

const SOURCE_CHIP = {
  live: { tone: "success", key: "source.live" },
  connecting: { tone: "warning", key: "source.connecting" },
  error: { tone: "danger", key: "source.error" },
  simulated: { tone: "neutral", key: "source.simulator" },
};

const formatClock = (timestamp, language) =>
  new Date(timestamp).toLocaleTimeString(language === "id" ? "id-ID" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

/** Initial drawn from a localised label, for the row marker. */
const initialOf = (label) => String(label || "?").trim().charAt(0).toUpperCase();

const DashboardPage = () => {
  const {
    readings,
    peakPressure,
    risk,
    riskScore,
    source,
    connectionState,
    reconnect,
    isLive,
    batteryPercent,
    language,
    history,
    thresholds,
    unreadIncidentCount,
    acknowledgeIncidents,
    simulationScenario,
    setSimulationScenario,
  } = useInsole();
  const { displayName } = useUser();
  const navigate = useNavigate();

  const [visibleRows, setVisibleRows] = useState(5);
  const [copiedId, setCopiedId] = useState(null);
  const mapHeadingRef = useRef(null);
  const copyTimerRef = useRef(null);

  const levelLabel = t(`risk.${risk}`, language);

  // The copy confirmation is a timer, so it must not outlive the page.
  useEffect(() => () => window.clearTimeout(copyTimerRef.current), []);

  /* -------------------------- derived readings --------------------------- */

  const now = new Date();
  const firstName = String(displayName || "").trim().split(/\s+/)[0] || "";
  const greeting = t(greetingKeyFor(now.getHours()), language);
  const longDate = now.toLocaleDateString(language === "id" ? "id-ID" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  /**
   * Direction of travel over the buffer: the mean peak of the newer half
   * against the older half. Shown only once there are enough samples to mean
   * anything, and reported as "steady" inside a 3 percent dead band so noise
   * does not read as a trend.
   */
  const trend = useMemo(() => {
    if (history.length < 6) return null;
    const half = Math.floor(history.length / 2);
    const mean = (records) =>
      records.reduce((sum, item) => sum + Number(item.peakPressure || 0), 0) /
      (records.length || 1);
    const before = mean(history.slice(0, half));
    const after = mean(history.slice(half));
    if (before <= 0) return null;
    const delta = ((after - before) / before) * 100;
    return { delta, direction: Math.abs(delta) < 3 ? "flat" : delta > 0 ? "up" : "down" };
  }, [history]);

  const balance = useMemo(() => {
    const total = ZONES.reduce((sum, key) => sum + Number(readings[key] || 0), 0);
    return { total, perZone: ZONES.map((key) => Number(readings[key] || 0)) };
  }, [readings]);

  const activityRows = useMemo(
    () =>
      [...history].reverse().map((record, index) => ({
        record,
        zone: peakZoneOf(record),
        // Two samples can share a millisecond (a burst of packets, or a test
        // that pushes faster than the clock), so the buffer position is part
        // of the identity. A timestamp alone is not unique, and a duplicate
        // React key silently drops rows.
        id: `${record.timestamp}-${index}`,
      })),
    [history]
  );

  const visibleActivity = activityRows.slice(0, visibleRows);
  const hasMoreActivity = activityRows.length > visibleRows;

  /* ------------------------------- actions ------------------------------- */

  const handleExport = useCallback(() => {
    if (history.length === 0) return;

    const header = [
      t("history.col.time", language),
      t("history.col.risk", language),
      t("history.col.forefoot", language),
      t("history.col.midfoot", language),
      t("history.col.heel", language),
      t("history.col.peak", language),
      t("history.col.score", language),
    ];

    const rows = history.map((record) => [
      new Date(record.timestamp).toISOString(),
      t(`risk.${record.risk}`, language),
      Number(record.readings?.forefoot ?? 0).toFixed(2),
      Number(record.readings?.midfoot ?? 0).toFixed(2),
      Number(record.readings?.heel ?? 0).toFixed(2),
      Number(record.peakPressure ?? 0).toFixed(2),
      record.score,
    ]);

    downloadCsv(`insole-session-${dateStamp()}.csv`, header, rows);
  }, [history, language]);

  const handleCopyRow = useCallback(
    (record) => {
      const text = [
        new Date(record.timestamp).toLocaleString(
          language === "id" ? "id-ID" : "en-GB"
        ),
        `${t(`anatomy.${peakZoneOf(record)}`, language)}: ${Number(
          record.readings?.[peakZoneOf(record)] ?? 0
        ).toFixed(1)} kPa`,
        `${t("dashboard.col.pressure", language)}: ${Number(
          record.peakPressure ?? 0
        ).toFixed(1)} kPa`,
        t(`risk.${record.risk}`, language),
      ].join(" | ");

      const done = () => {
        setCopiedId(record.timestamp);
        window.clearTimeout(copyTimerRef.current);
        copyTimerRef.current = window.setTimeout(() => setCopiedId(null), 2200);
      };

      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => {});
      }
    },
    [language]
  );

  /**
   * Jump to the pressure map. The map is the one thing on this page that sits
   * below the fold, so the control exists to close that gap rather than to
   * decorate the corner.
   */
  const handleJumpToMap = useCallback(() => {
    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    )?.matches;
    mapHeadingRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
    mapHeadingRef.current?.focus?.({ preventScroll: true });
  }, []);

  /* -------------------------------- source ------------------------------- */

  const sourceChip = SOURCE_CHIP[
    source === "FIREBASE" ? (isLive ? "live" : connectionState) : "simulated"
  ] || SOURCE_CHIP.simulated;

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

  /* --------------------------------- tiles ------------------------------- */

  const trendChip = trend && (
    <Chip
      tone={
        trend.direction === "up"
          ? "danger"
          : trend.direction === "down"
            ? "success"
            : "neutral"
      }
    >
      {trend.direction === "up" && <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />}
      {trend.direction === "down" && <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />}
      {trend.direction === "flat" && <Minus className="h-3.5 w-3.5" aria-hidden="true" />}
      {trend.direction === "flat"
        ? t("dashboard.deltaSteady", language)
        : `${trend.delta > 0 ? "+" : ""}${trend.delta.toFixed(1)}%`}
    </Chip>
  );

  const duration = Number(readings.sustainedDuration || 0);
  const overDurationLimit = duration >= thresholds.dangerSeconds;

  const tiles = [
    {
      id: "peak",
      title: t("metrics.peakPressure", language),
      icon: <Gauge className="h-5 w-5" />,
      iconTone: risk === "safe" ? "success" : risk,
      value: Number(peakPressure || 0).toFixed(1),
      unit: t("metrics.unit.kpa", language),
      badge: trendChip,
      caption: t("dashboard.caption.threshold", language, {
        value: thresholds.dangerKpa,
      }),
    },
    {
      id: "duration",
      title: t("metrics.sustainedDuration", language),
      icon: <Timer className="h-5 w-5" />,
      iconTone: overDurationLimit ? "danger" : "neutral",
      value: String(duration),
      unit: t("metrics.unit.seconds", language),
      badge: (
        <Chip tone={overDurationLimit ? "danger" : "success"}>
          {overDurationLimit
            ? t("dashboard.overLimit", language)
            : t("dashboard.withinLimit", language)}
        </Chip>
      ),
      caption: t("dashboard.caption.durationLimit", language, {
        value: thresholds.dangerSeconds,
      }),
    },
    {
      id: "score",
      title: t("risk.score", language),
      icon: <Activity className="h-5 w-5" />,
      iconTone: risk === "safe" ? "success" : risk,
      value: String(riskScore),
      unit: "/ 100",
      badge: <StatusChip level={risk} label={levelLabel} size="sm" />,
      caption: t("dashboard.caption.scoreRange", language),
    },
    {
      id: "supply",
      title: t("device.battery", language),
      icon: <BatteryMedium className="h-5 w-5" />,
      iconTone: "neutral",
      value: Number.isFinite(batteryPercent)
        ? String(Math.round(batteryPercent))
        : "--",
      unit: Number.isFinite(batteryPercent)
        ? t("metrics.unit.percent", language)
        : "",
      badge: <Chip tone={sourceChip.tone}>{t(sourceChip.key, language)}</Chip>,
      caption: Number.isFinite(batteryPercent)
        ? t("dashboard.caption.battery", language, {
            value: t(sourceChip.key, language),
          })
        : t("device.simulatedNote", language),
    },
  ];

  /* --------------------------------- donut ------------------------------- */

  const donutSegments = [
    {
      key: "forefoot",
      label: t("anatomy.forefoot.short", language),
      value: balance.perZone[0],
    },
    {
      key: "midfoot",
      label: t("anatomy.midfoot.short", language),
      value: balance.perZone[1],
    },
    {
      key: "heel",
      label: t("anatomy.heel.short", language),
      value: balance.perZone[2],
    },
  ];

  const rowMenuItems = (record) => [
    {
      id: "open",
      label: t("dashboard.rowMenu", language),
      icon: HistoryIcon,
      onSelect: () => navigate("/history"),
    },
    {
      id: copiedId === record.timestamp ? "copied" : "copy",
      label:
        copiedId === record.timestamp
          ? t("common.copied", language)
          : t("common.copyReading", language),
      icon: Copy,
      onSelect: () => handleCopyRow(record),
    },
  ];

  return (
    <section className="space-y-5 lg:space-y-6">
      {/* Risk level changes are announced; the numbers deliberately are not. */}
      <p className="sr-only" aria-live="polite">
        {`${t("risk.status", language)}: ${levelLabel}`}
      </p>

      <PageHeader
        title={firstName ? `${greeting}, ${firstName}` : greeting}
        subtitle={
          <>
            {longDate}
            <span className="mx-2 text-border-control" aria-hidden="true">
              |
            </span>
            {`${t("dashboard.statusLabel", language)}: `}
            <span className={`font-semibold ${STATUS_INK[risk]}`}>
              {t(STATUS_TEXT[risk], language)}
            </span>
          </>
        }
        actions={
          <>
            <GlassButton
              variant="outline"
              onClick={handleExport}
              disabled={history.length === 0}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {t("dashboard.exportCsv", language)}
            </GlassButton>
            <GlassButton
              variant="filled"
              onClick={acknowledgeIncidents}
              disabled={unreadIncidentCount === 0}
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              {unreadIncidentCount === 0
                ? t("dashboard.acknowledged", language)
                : t("dashboard.acknowledge", language)}
            </GlassButton>
          </>
        }
      />

      {sourceBanner}

      <BentoGrid cards={tiles} columns={4} />

      {/* Trend beside the distribution: one asks where the pressure is going,
          the other where it is right now. */}
      <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
        <GlassCard flush className="lg:col-span-2">
          <PanelHeader
            title={t("dashboard.trendTitle", language)}
            subtitle={t("dashboard.trendBody", language)}
            action={
              <Chip tone="neutral">{t("dashboard.window", language)}</Chip>
            }
          />
          <div className="px-6 pb-5">
            {/* The chart is the arm this panel exists for, so it stays
                outermost: a state panel may never displace data. Below it the
                three branches mirror MonitoringPage, in the same order, so a
                settled connection can never be reported as loading. */}
            {history.length > 0 ? (
              <TrendChart
                history={history}
                dangerKpa={thresholds.dangerKpa}
                language={language}
                labels={{
                  chartTitle: t("dashboard.trendTitle", language),
                  threshold: t("monitoring.threshold", language),
                  axisTime: t("monitoring.axisTime", language),
                  axisPressure: t("monitoring.axisPressure", language),
                }}
              />
            ) : connectionState === "connecting" ? (
              <StatePanel
                variant="loading"
                title={t("monitoring.loading", language)}
              />
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
                nextAction={t("monitoring.emptyNext", language)}
              />
            )}
          </div>
        </GlassCard>

        <GlassCard>
          <PanelHeader
            title={t("dashboard.loadTitle", language)}
            subtitle={t("dashboard.loadBody", language)}
          />
          <div className="pt-4">
            <LoadDonut
              segments={donutSegments}
              total={balance.total.toFixed(0)}
              unit={t("dashboard.totalLoad", language)}
              totalLabel={t("metrics.balance", language)}
            />
          </div>
        </GlassCard>
      </div>

      {/* The live feed. */}
      <GlassCard flush>
        <PanelHeader
          title={t("dashboard.activityTitle", language)}
          subtitle={t("dashboard.activityBody", language)}
          action={
            <Link
              to="/history"
              className="inline-flex min-h-[44px] items-center text-body-base font-semibold text-secondary transition-colors hover:text-secondary-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {t("dashboard.viewAll", language)}
            </Link>
          }
        />

        {activityRows.length === 0 ? (
          <div className="border-t border-border px-6 py-6">
            <StatePanel
              variant="empty"
              title={t("dashboard.noMatch", language)}
              description={t("source.noDeviceBody", language)}
              nextAction={t("monitoring.emptyNext", language)}
            />
          </div>
        ) : (
          <>
            {/* Desktop: a real table. */}
            <div className="hidden border-t border-border md:block">
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">
                  {t("dashboard.activityTitle", language)}
                </caption>
                <thead>
                  <tr className="bg-surface-2">
                    {[
                      "dashboard.col.zone",
                      "dashboard.col.pressure",
                      "dashboard.col.time",
                      "dashboard.col.status",
                    ].map((key) => (
                      <th
                        key={key}
                        scope="col"
                        className="whitespace-nowrap px-6 py-3.5 text-label uppercase text-muted"
                      >
                        {t(key, language)}
                      </th>
                    ))}
                    <th scope="col" className="px-6 py-3.5 text-label uppercase text-muted">
                      <span className="sr-only">
                        {t("dashboard.col.actions", language)}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleActivity.map(({ record, zone, id }) => {
                    const zoneLabel = t(`anatomy.${zone}.short`, language);
                    return (
                      <tr
                        key={id}
                        className="border-b border-border-strong last:border-b-0 hover:bg-surface-2"
                      >
                        <th scope="row" className="px-6 py-4 text-left font-normal">
                          <span className="flex items-center gap-3">
                            <span
                              aria-hidden="true"
                              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-btn text-body-sm font-bold text-primary-on"
                            >
                              {initialOf(zoneLabel)}
                            </span>
                            <span className="text-body-base font-semibold text-fg">
                              {t(`anatomy.${zone}`, language)}
                            </span>
                          </span>
                        </th>
                        <td className="tabular-data whitespace-nowrap px-6 py-4 text-body-base text-fg-2">
                          {`${Number(record.readings?.[zone] ?? 0).toFixed(1)} kPa`}
                        </td>
                        <td className="tabular-data whitespace-nowrap px-6 py-4 text-body-base text-fg-2">
                          {formatClock(record.timestamp, language)}
                        </td>
                        <td className="px-6 py-4">
                          <StatusChip
                            level={record.risk}
                            label={t(`risk.${record.risk}`, language)}
                            size="sm"
                          />
                        </td>
                        <td className="px-4 py-4 text-right">
                          <RowMenu
                            label={t("dashboard.col.actions", language)}
                            items={rowMenuItems(record)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile: the same rows as stacked definitions. */}
            <ul className="divide-y divide-border-strong border-t border-border md:hidden">
              {visibleActivity.map(({ record, zone, id }) => {
                const zoneLabel = t(`anatomy.${zone}.short`, language);
                return (
                  <li key={id} className="p-4">
                    <div className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-btn text-body-sm font-bold text-primary-on"
                      >
                        {initialOf(zoneLabel)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-body-base font-semibold text-fg">
                          {t(`anatomy.${zone}`, language)}
                        </p>
                        <p className="tabular-data text-body-sm text-muted">
                          {`${Number(record.readings?.[zone] ?? 0).toFixed(1)} kPa`}
                          <span className="mx-2 text-border-control" aria-hidden="true">
                            |
                          </span>
                          {formatClock(record.timestamp, language)}
                        </p>
                      </div>
                      <RowMenu
                        label={t("dashboard.col.actions", language)}
                        items={rowMenuItems(record)}
                      />
                    </div>
                    <div className="mt-3">
                      <StatusChip
                        level={record.risk}
                        label={t(`risk.${record.risk}`, language)}
                        size="sm"
                      />
                    </div>
                  </li>
                );
              })}
            </ul>

            {hasMoreActivity && (
              <div className="border-t border-border-strong">
                <button
                  type="button"
                  onClick={() => setVisibleRows((prev) => prev + 5)}
                  className="w-full px-6 py-4 text-label uppercase text-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                >
                  {t("dashboard.loadMore", language)}
                </button>
              </div>
            )}
          </>
        )}
      </GlassCard>

      {/* The pressure map: the one thing that answers "where exactly". The
          heading is a focus target so the jump control can land a keyboard
          user on it rather than merely scrolling past it. */}
      <GlassCard flush>
        <div ref={mapHeadingRef} tabIndex={-1}>
          <PanelHeader
            title={t("dashboard.heatmapTitle", language)}
            subtitle={t("dashboard.heatmapBody", language)}
            action={<StatusChip level={risk} label={levelLabel} size="sm" />}
          />
        </div>
        <div className="border-t border-border">
          <div className="plot-surface p-4">
            <PlantarHeatmap className="mx-auto max-h-[460px]" />
          </div>

          {/* The colour scale is labelled, and the swatches use the same risk
              tokens as the map nodes, so the ramp is never the only signal. */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border px-6 py-3 text-body-sm text-muted">
            <span className="text-label uppercase">
              {t("dashboard.legend", language)}
            </span>
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

      {/* Jump to the map. Hidden below lg, where the map is one short scroll
          away and a floating button would cover the content it is meant to
          reveal. */}
      <button
        type="button"
        onClick={handleJumpToMap}
        className="fixed bottom-6 right-6 z-30 hidden h-14 w-14 items-center justify-center rounded-full bg-secondary text-white shadow-fab transition-transform duration-150 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg lg:inline-flex"
      >
        <MapIcon className="h-6 w-6" aria-hidden="true" />
        <span className="sr-only">{t("dashboard.heatmapTitle", language)}</span>
      </button>
    </section>
  );
};

export default DashboardPage;
