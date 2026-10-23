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
  GlassButton,
} from "../components/ui/GlassComponents";
import { Chip } from "../components/ui/Chip";
import { BentoGrid } from "../components/dashboard/BentoGrid";
import { Sparkline } from "../components/dashboard/Sparkline";
import { HeroTimeline } from "../components/dashboard/HeroTimeline";
import { FunnelBars } from "../components/dashboard/FunnelBars";
import { RowMenu } from "../components/dashboard/RowMenu";

import { TrendChart } from "../components/monitoring/TrendChart";
import PlantarHeatmap from "../components/PlantarHeatmap";
import { downloadCsv, dateStamp } from "../utils/exportCsv";

/**
 * DashboardPage — the live console, and the focal point of the product.
 *
 * The composition follows the Cadra light register: a hero card that opens
 * with the greeting, the verdict chip and the buffer's event strip, the meter
 * band of pastel-tinted stat cards around one inverted dark headline, a wide
 * trend panel beside the zone-load funnel, the live reading feed with
 * pressure-vs-threshold mini bars, and the pressure map. Mobile collapses to
 * one column with the map last, because the page reads top-down as "how is it
 * now, which way is it going, what just happened, where exactly".
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

const SOURCE_CHIP = {
  live: { tone: "success", key: "source.live" },
  connecting: { tone: "warning", key: "source.connecting" },
  error: { tone: "danger", key: "source.error" },
  idle: { tone: "neutral", key: "source.idle" },
};

/** Whole literals on purpose: Tailwind must be able to see each class. */
const RISK_BAR = {
  safe: "bg-safe",
  warning: "bg-warning",
  danger: "bg-danger",
};

/**
 * A reading that never lies: a corrupt or missing zone value coerces to 0,
 * the same rule Sparkline applies. A NaN must never become "NaN kPa" on the
 * feed or a full-width bar from invalid CSS.
 */
const finiteOf = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
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
    connectionState,
    reconnect,
    isLive,
    batteryPercent,
    language,
    history,
    thresholds,
    unreadIncidentCount,
    acknowledgeIncidents,
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

  const sourceChip = SOURCE_CHIP[connectionState] || SOURCE_CHIP.connecting;

  const sourceBanner = (() => {
    if (connectionState === "error") {
      return (
        <StatusBanner tone="danger" title={t("source.errorTitle", language)}>
          {t("source.errorBody", language)}
        </StatusBanner>
      );
    }
    if (connectionState === "connecting") {
      return <StatePanel variant="loading" title={t("source.connecting", language)} />;
    }
    if (connectionState === "idle") {
      // No sensor session at all: say so plainly instead of implying that the
      // numbers came from anywhere.
      return (
        <StatusBanner tone="warning" title={t("source.noDeviceTitle", language)}>
          {t("source.noDeviceBody", language)}
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

  /**
   * The peak tile renders on the one inverted dark card, where the light Chip
   * vocabulary's ink-on-tint pairs invert badly (dark ink on dark surface).
   * The dark chip carries the same three verdicts with the `inverted-*` text
   * ramp on a `bg-white/10` fill, measured in index.css against #141414.
   */
  const DARK_TREND = {
    up: {
      ink: "text-inverted-danger",
      icon: <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />,
    },
    down: {
      ink: "text-inverted-safe",
      icon: <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />,
    },
    flat: {
      ink: "text-inverted-muted",
      icon: <Minus className="h-3.5 w-3.5" aria-hidden="true" />,
    },
  };

  const trendChipDark = trend && (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-caption font-semibold",
        "bg-white/10",
        DARK_TREND[trend.direction]?.ink || DARK_TREND.flat.ink,
      ].join(" ")}
    >
      {DARK_TREND[trend.direction]?.icon || DARK_TREND.flat.icon}
      {trend.direction === "flat"
        ? t("dashboard.deltaSteady", language)
        : `${trend.delta > 0 ? "+" : ""}${trend.delta.toFixed(1)}%`}
    </span>
  );

  const duration = Number(readings.sustainedDuration || 0);
  const overDurationLimit = duration >= thresholds.dangerSeconds;

  /**
   * The spark reads the buffer's real peaks, new end last (the timeline of the
   * sparkline runs left to right). The designTokens sweep sees `w-24 h-7` etc.
   * only as whole literals, so the size stays literal.
   */
  const sparkData = useMemo(
    () => history.slice(-24).map((record) => Number(record.peakPressure || 0)),
    [history]
  );

  const tiles = [
    {
      /* The headline answer gets the one inverted dark card: the darkest
         surface on the page is reserved for the number being watched. */
      id: "peak",
      inverted: true,
      title: t("metrics.peakPressure", language),
      icon: <Gauge className="h-5 w-5" />,
      iconTone: risk === "safe" ? "success" : risk,
      value: Number(peakPressure || 0).toFixed(1),
      unit: t("metrics.unit.kpa", language),
      badge: trendChipDark,
      caption: t("dashboard.caption.threshold", language, {
        value: thresholds.dangerKpa,
      }),
    },
    {
      id: "duration",
      tint: "cream",
      title: t("metrics.sustainedDuration", language),
      icon: <Timer className="h-5 w-5" />,
      iconTone: overDurationLimit ? "danger" : "neutral",
      value: String(duration),
      unit: t("metrics.unit.seconds", language),
      meter: { value: duration, max: thresholds.dangerSeconds },
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
      tint: "mint",
      title: t("risk.score", language),
      icon: <Activity className="h-5 w-5" />,
      iconTone: risk === "safe" ? "success" : risk,
      value: String(riskScore),
      unit: "/ 100",
      spark: (
        <Sparkline data={sparkData} className="h-7 w-full max-w-[128px]" />
      ),
      badge: <StatusChip level={risk} label={levelLabel} size="sm" />,
      caption: t("dashboard.caption.scoreRange", language),
    },
    {
      id: "supply",
      tint: "blue",
      title: t("device.battery", language),
      icon: <BatteryMedium className="h-5 w-5" />,
      iconTone: "neutral",
      value: Number.isFinite(batteryPercent)
        ? String(Math.round(batteryPercent))
        : "--",
      unit: Number.isFinite(batteryPercent)
        ? t("metrics.unit.percent", language)
        : "",
      meter: Number.isFinite(batteryPercent)
        ? { value: batteryPercent, max: 100 }
        : undefined,
      badge: <Chip tone={sourceChip.tone}>{t(sourceChip.key, language)}</Chip>,
      caption: Number.isFinite(batteryPercent)
        ? t("dashboard.caption.battery", language, {
            value: t(sourceChip.key, language),
          })
        : t("device.simulatedNote", language),
    },
  ];

  /* ------------------------- zone load (funnel data) --------------------- */

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

      {/* The hero card is the Cadra opener: greeting and standing actions in
          one white card, the large verdict chip answering "is anything wrong"
          before any number, and the real buffer's event strip across it. The
          date stays muted above the chip; a bare status word in 15px grey
          would hide the page's most important read. */}
      <GlassCard flush data-panel="hero">
        <div className="px-6 pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="font-heading text-h1 text-fg">
                {firstName ? `${greeting}, ${firstName}` : greeting}
              </h1>
              <p className="mt-1.5 max-w-prose text-body-base text-muted">
                {longDate}
              </p>
              <div className="mt-3">
                <StatusChip level={risk} label={levelLabel} size="lg" />
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pt-1">
              <GlassButton
                variant="outline"
                onClick={handleExport}
                disabled={history.length === 0}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                {t("dashboard.exportCsv", language)}
              </GlassButton>
              {/* Prominence follows urgency: the filled rank says "there is
                  work for you now". With an empty alert queue the action has
                  nothing to do, so it retires to the quiet rank instead of
                  sitting there as a disabled navy slab - which would otherwise
                  be the loudest object on a calm page. */}
              <GlassButton
                variant={unreadIncidentCount === 0 ? "quiet" : "filled"}
                onClick={acknowledgeIncidents}
                disabled={unreadIncidentCount === 0}
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                {unreadIncidentCount === 0
                  ? t("dashboard.acknowledged", language)
                  : t("dashboard.acknowledge", language)}
              </GlassButton>
            </div>
          </div>

          {/* The strip reads the real buffer: one dot per reading, painted by
              that reading's verdict. With an empty buffer it leaves the line
              standing and draws nothing, exactly like the numbers above it. */}
          <HeroTimeline records={history} language={language} />
        </div>
      </GlassCard>

      {sourceBanner}

      <BentoGrid cards={tiles} columns={4} />

      {/* Station 02: where the pressure sits. The Cadra funnel replaces the
          donut: proportions read as one-decision bars, each row naming its
          sensor point and carrying the real kPa the bar is drawn from. */}
      <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
        <GlassCard flush className="lg:col-span-2" data-panel="trend">
          <PanelHeader
            index="01"
            title={t("dashboard.trendTitle", language)}
            subtitle={t("dashboard.trendBody", language)}
            action={
              <Chip tone="neutral">{t("dashboard.window", language)}</Chip>
            }
          />
          <div className="px-6 pb-6">
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

        <GlassCard flush data-panel="funnel">
          <PanelHeader
            index="02"
            title={t("dashboard.loadTitle", language)}
            subtitle={t("dashboard.loadBody", language)}
          />
          <div className="px-6">
            <FunnelBars
              zones={[
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
              ]}
              language={language}
            />
          </div>
        </GlassCard>
      </div>

      {/* Station 03: the live feed. Deliberately NOT a card. A running
          reading stream held inside a white box is decoration around data;
          open, ruled edge to edge, it reads as the tape it is. The band
          carries the page's content-column rules: top rule, own bottom rules
          via the rows, no side walls. */}
      <section data-panel="feed" className="border-t border-border">
        <div className="flex flex-wrap items-start justify-between gap-3 px-6 pb-3 pt-5">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 font-heading text-card-title text-fg">
              <span
                aria-hidden="true"
                className="tabular-data shrink-0 text-label text-muted"
              >
                03
              </span>
              <span className="truncate">
                {t("dashboard.activityTitle", language)}
              </span>
            </h2>
            <p className="mt-1 max-w-prose text-body-sm text-muted">
              {t("dashboard.activityBody", language)}
            </p>
          </div>
          <Link
            to="/history"
            className="inline-flex min-h-[44px] shrink-0 items-center text-body-base font-semibold text-secondary transition-colors hover:text-secondary-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {t("dashboard.viewAll", language)}
          </Link>
        </div>

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
                            {/* A sensor point, not a person: the marker is a
                                squared icon tile, the same 12px step the
                                metric meters use. It was a navy circle before
                                - an avatar costume on a foot zone. */}
                            <span
                              aria-hidden="true"
                              className="grid h-11 w-11 shrink-0 place-items-center rounded-tile bg-primary-btn text-body-sm font-bold text-primary-on"
                            >
                              {initialOf(zoneLabel)}
                            </span>
                            <span className="text-body-base font-semibold text-fg">
                              {t(`anatomy.${zone}`, language)}
                            </span>
                          </span>
                        </th>
                        <td className="px-6 py-4">
                          {/* The reading and, under it, how far it stands
                              from the danger threshold. The bar's length is
                              the same claim in inches that the number makes
                              in text, so it is aria-hidden: the row already
                              states the value, and the verdict chip beside
                              the row already carries the meaning. */}
                          <span className="tabular-data block whitespace-nowrap text-body-base text-fg-2">
                            {`${finiteOf(record.readings?.[zone]).toFixed(1)} kPa`}
                          </span>
                          <span
                            className="mt-1.5 block h-1.5 w-28 overflow-hidden rounded-full bg-surface-3"
                          >
                            <span
                              data-feed-fill
                              aria-hidden="true"
                              className={`block h-full rounded-full ${
                                RISK_BAR[record.risk] || RISK_BAR.warning
                              }`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(
                                    0,
                                    (finiteOf(record.readings?.[zone]) /
                                      (thresholds.dangerKpa || 1)) *
                                      100
                                  )
                                ).toFixed(1)}%`,
                              }}
                            />
                          </span>
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
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-tile bg-primary-btn text-body-sm font-bold text-primary-on"
                      >
                        {initialOf(zoneLabel)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-body-base font-semibold text-fg">
                          {t(`anatomy.${zone}`, language)}
                        </p>
                        <p className="tabular-data text-body-sm text-muted">
                          {`${finiteOf(record.readings?.[zone]).toFixed(1)} kPa`}
                          <span className="mx-2 text-border-control" aria-hidden="true">
                            |
                          </span>
                          {formatClock(record.timestamp, language)}
                        </p>
                        <span className="mt-2 block h-1.5 w-full max-w-[180px] overflow-hidden rounded-full bg-surface-3">
                          <span
                            data-feed-fill
                            aria-hidden="true"
                            className={`block h-full rounded-full ${
                              RISK_BAR[record.risk] || RISK_BAR.warning
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(
                                  0,
                                  (finiteOf(record.readings?.[zone]) /
                                    (thresholds.dangerKpa || 1)) *
                                    100
                                )
                              ).toFixed(1)}%`,
                            }}
                          />
                        </span>
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
      </section>

      {/* Station 04: the pressure map, the one thing that answers "where
          exactly". The heading is a focus target so the jump control can land
          a keyboard user on it rather than merely scrolling past it. */}
      <GlassCard flush data-panel="map">
        <div ref={mapHeadingRef} tabIndex={-1}>
          <PanelHeader
            index="04"
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

      {/* Jump to the map. Hidden below lg, where the map is one short scroll
          away and a floating button would cover the content it is meant to
          reveal. Squared to the tile step: the page's only floating control,
          shaped like the icon tiles it sits among, not like a pill. */}
      <button
        type="button"
        onClick={handleJumpToMap}
        className="fixed bottom-6 right-6 z-30 hidden h-14 w-14 items-center justify-center rounded-tile bg-secondary text-white shadow-fab transition-transform duration-150 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg lg:inline-flex"
      >
        <MapIcon className="h-6 w-6" aria-hidden="true" />
        <span className="sr-only">{t("dashboard.heatmapTitle", language)}</span>
      </button>
    </section>
  );
};

export default DashboardPage;
