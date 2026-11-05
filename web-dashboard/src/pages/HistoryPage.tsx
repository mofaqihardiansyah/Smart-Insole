import React, { useCallback, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ClipboardList,
  Download,
  Radio,
  RefreshCw,
} from "lucide-react";
import {
  GlassButton,
  GlassCard,
  GlassTable,
  GlassTableRow,
  GlassTableCell,
  PanelHeader,
  StatusBanner,
  StatusChip,
  StatePanel,
  StateRetry,
  PageHeader,
} from "../components/ui/GlassComponents";
import { Chip } from "../components/ui/Chip";
import { STORED_HISTORY_LIMIT, useInsole } from "../context/InsoleContext";
import { mergeIncidents } from "../utils/incidents";
import { t } from "../utils/i18n";

/**
 * HistoryPage, the incident register.
 *
 * Rows come from two sources, merged: `InsoleContext.storedIncidents`, the
 * register rebuilt from `readings/history` so it survives a reload, and
 * `InsoleContext.incidentLogs`, the transitions seen live while this tab has
 * been open. The stored copy wins an overlap. Nothing here is generated: with
 * no device connected the log is genuinely empty, and the empty state says so
 * in words rather than looking like a failed load.
 *
 * The desktop register is a real table. Below `md` the same eight fields render
 * as stacked labelled rows, because a table cannot reflow.
 */

const RISK_LEVELS = ["safe", "warning", "danger"];

/**
 * How many register rows are rendered before the "load more" control appears.
 *
 * The register grows with the device feed and is never trimmed, so rendering
 * every row would make the page slower with every minute of monitoring. This is
 * a render cap only: the CSV export and the summary counts still see every row.
 */
const PAGE_SIZE = 20;

/** Rows added by one press of "load more". */
const PAGE_STEP = 20;

/** Which incidents the register shows. `all` is the unfiltered register. */
type LevelFilter = "all" | "danger" | "warning";

/** Filter buttons, in render order. Labels reuse the risk keys. */
const LEVEL_FILTERS: ReadonlyArray<{ value: LevelFilter; labelKey: string }> = [
  { value: "all", labelKey: "history.filter.all" },
  { value: "danger", labelKey: "risk.danger" },
  { value: "warning", labelKey: "risk.warning" },
];

const riskLabel = (level: string, language: string) =>
  RISK_LEVELS.includes(level)
    ? t(`risk.${level}`, language)
    : t("risk.unknown", language);

const formatTimestamp = (timestamp: number, language: string, fallback: string) =>
  Number.isFinite(timestamp)
    ? new Date(timestamp).toLocaleString(language === "id" ? "id-ID" : "en-GB")
    : fallback;

/** Quote every field so a localised date containing a comma cannot split a row. */
const csvCell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

/** Props for one count in the summary strip. */
interface SummaryCellProps {
  label: React.ReactNode;
  value: React.ReactNode;
  chip?: React.ReactNode;
  tint?: boolean;
}

/** One count in the summary strip, as a Cadra stat card.
 *
 * The strip keeps its `dl` semantics; only the paint changes. The total is
 * informational and earns the blue tint, but the two risk counts stay on the
 * plain white fill: pastel-cream for a danger count would read as decoration
 * over a vital sign, and colour stays a verdict on this product.
 */
const SummaryCell = ({ label, value, chip, tint = false }: SummaryCellProps) => (
  <div
    className={[
      "rounded-card border border-border px-6 py-5 shadow-panel",
      tint ? "bg-tint-blue" : "bg-surface",
    ].join(" ")}
  >
    <dt className="text-label uppercase text-fg-2">{label}</dt>
    <dd className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
      {/* text-stat, matching ProfilePage's stat blocks: the same
          count-as-a-reading semantic renders at the same size everywhere. */}
      <span className="tabular-data font-heading text-stat text-fg">{value}</span>
      {chip}
    </dd>
  </div>
);

/** Props for one labelled field inside a stacked mobile row. */
interface MobileFieldProps {
  label: React.ReactNode;
  children?: React.ReactNode;
}

/** One labelled field inside a stacked mobile row. */
const MobileField = ({ label, children }: MobileFieldProps) => (
  <div className="min-w-0">
    <dt className="text-label uppercase text-muted">{label}</dt>
    <dd className="mt-0.5 tabular-data text-body-sm text-fg">{children}</dd>
  </div>
);

const HistoryPage = () => {
  const {
    incidentLogs,
    storedIncidents,
    connectionState,
    reconnect,
    isLive,
    language,
  } = useInsole();

  const unavailable = t("common.notAvailable", language);

  // Oldest first by default: the register reads as a timeline. Ties keep the
  // merge order because Array.prototype.sort is stable.
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");

  const rows = useMemo(
    () =>
      mergeIncidents(storedIncidents, incidentLogs).map((log, index) => {
        const readings = log.readings || {};
        const sensorPeaks = [
          readings.forefoot,
          readings.midfoot,
          readings.heel,
        ].filter(Number.isFinite);

        return {
          id: `${log.timestamp}-${index}`,
          timestamp: log.timestamp,
          level: log.type,
          readings,
          peak: Number.isFinite(log.peakPressure)
            ? log.peakPressure
            : sensorPeaks.length
              ? Math.max(...sensorPeaks)
              : NaN,
          score: log.score,
          duration: readings.sustainedDuration,
        };
      }).sort((a, b) =>
        sortDir === "asc" ? a.timestamp - b.timestamp : b.timestamp - a.timestamp
      ),
    [storedIncidents, incidentLogs, sortDir]
  );

  // Summary counts always describe the whole register, never the filter.
  const dangerCount = rows.filter((row) => row.level === "danger").length;
  const warningCount = rows.filter((row) => row.level === "warning").length;

  const filteredRows = useMemo(
    () =>
      levelFilter === "all"
        ? rows
        : rows.filter((row) => row.level === levelFilter),
    [rows, levelFilter]
  );

  // Render cap: the register keeps every row (export and counts need them),
  // but the page draws PAGE_SIZE at a time.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleRows = useMemo(
    () => filteredRows.slice(0, visibleCount),
    [filteredRows, visibleCount]
  );
  const hasMore = filteredRows.length > visibleCount;
  const showMore = useCallback(
    () => setVisibleCount((count) => count + PAGE_STEP),
    []
  );

  /** Switching filter restarts at the first page, so no empty tail is left. */
  const changeFilter = useCallback((next: LevelFilter) => {
    setLevelFilter(next);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const toggleSort = useCallback(() => {
    setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
  }, []);
  // True once the device snapshot is as long as the window we asked for, which
  // is the only case where the register is known to be cut short.
  const storedCapped = storedIncidents.length >= STORED_HISTORY_LIMIT;

  const kpa = (value: number) =>
    Number.isFinite(value)
      ? `${value.toFixed(1)} ${t("metrics.unit.kpa", language)}`
      : unavailable;

  const seconds = (value: number) =>
    Number.isFinite(value)
      ? `${value} ${t("metrics.unit.seconds", language)}`
      : unavailable;

  /**
   * Re-request the device feed.
   *
   * The register itself is derived live from InsoleContext, so the only action
   * that can change it is a new subscription. Choosing FIREBASE by hand does
   * exactly that (and stops the automatic fallback from overriding the choice).
   * The button is disabled the moment the feed is live, which is why it is
   * never a control that does nothing.
   */
  const connecting = connectionState === "connecting";
  const canReconnect = !isLive && !connecting;

  const handleRefresh = useCallback(() => {
    reconnect();
  }, [reconnect]);

  const handleExport = useCallback(() => {
    if (rows.length === 0) return;

    const header = [
      t("history.col.time", language),
      t("history.col.risk", language),
      t("history.col.forefoot", language),
      t("history.col.midfoot", language),
      t("history.col.heel", language),
      t("history.col.peak", language),
      t("history.col.score", language),
      t("history.col.duration", language),
    ];

    const body = rows.map((row) =>
      [
        formatTimestamp(row.timestamp, language, ""),
        riskLabel(row.level, language),
        Number.isFinite(row.readings.forefoot) ? row.readings.forefoot : "",
        Number.isFinite(row.readings.midfoot) ? row.readings.midfoot : "",
        Number.isFinite(row.readings.heel) ? row.readings.heel : "",
        Number.isFinite(row.peak) ? row.peak.toFixed(1) : "",
        Number.isFinite(row.score) ? row.score : "",
        Number.isFinite(row.duration) ? row.duration : "",
      ]
        .map(csvCell)
        .join(",")
    );

    // The BOM makes Excel open the UTF-8 file with the right encoding, and the
    // date keeps successive exports from overwriting one another.
    const stamp = new Date().toISOString().slice(0, 10);
    const csv = `\uFEFF${[header.map(csvCell).join(","), ...body].join("\r\n")}\r\n`;
    const objectUrl = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" })
    );
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `insole-incident-log-${stamp}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  }, [rows, language]);

  const isLoading = connecting && rows.length === 0;
  const hasError = connectionState === "error" && rows.length === 0;
  const isEmpty = rows.length === 0;

  const sourceIndicator = (
    <span className="inline-flex items-center gap-2 text-body-sm text-muted">
      <Radio className="h-4 w-4" aria-hidden="true" />
      {isLive
        ? t("source.live", language)
        : connecting
          ? t("source.connecting", language)
          : connectionState === "error"
            ? t("source.error", language)
            : t("source.idle", language)}
    </span>
  );

  /** One rendered register row, as the cell readers below receive it. */
  type HistoryRow = (typeof rows)[number];

  /** One desktop column: its heading key, and the reader for its cells. */
  type HistoryColumn = [key: string, read: (row: HistoryRow) => React.ReactNode];

  const columns: HistoryColumn[] = [
    ["history.col.time", (row) => formatTimestamp(row.timestamp, language, unavailable)],
    ["history.col.forefoot", (row) => kpa(row.readings.forefoot)],
    ["history.col.midfoot", (row) => kpa(row.readings.midfoot)],
    ["history.col.heel", (row) => kpa(row.readings.heel)],
    ["history.col.peak", (row) => kpa(row.peak)],
    ["history.col.score", (row) => (Number.isFinite(row.score) ? row.score : unavailable)],
    ["history.col.duration", (row) => seconds(row.duration)],
  ];

  return (
    <section className="space-y-5 lg:space-y-6">
      <PageHeader
        title={t("history.title", language)}
        subtitle={t("history.subtitle", language)}
        meta={sourceIndicator}
        actions={
          <>
            <GlassButton
              type="button"
              variant="outline"
              onClick={handleRefresh}
              disabled={!canReconnect}
              aria-busy={connecting}
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {connecting
                ? t("history.refreshing", language)
                : t("history.refresh", language)}
            </GlassButton>
            <GlassButton
              type="button"
              variant="filled"
              onClick={handleExport}
              disabled={isEmpty}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {t("history.export", language)}
            </GlassButton>
          </>
        }
      />

      {connectionState === "idle" && rows.length === 0 && (
        <StatusBanner tone="warning" title={t("source.noDeviceTitle", language)}>
          {t("source.noDeviceBody", language)}
        </StatusBanner>
      )}

      {connectionState === "error" && rows.length > 0 && (
        <StatusBanner tone="danger" title={t("source.errorTitle", language)}>
          {t("source.errorBody", language)}
        </StatusBanner>
      )}

      {isLoading ? (
        <StatePanel
          variant="loading"
          title={t("history.loading", language)}
          rows={4}
        />
      ) : (
        <>
          <GlassCard flush>
            <PanelHeader
              title={t("dashboard.riskSummary", language)}
              icon={<ClipboardList className="h-4 w-4" />}
            />

            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <SummaryCell
                tint
                label={t(
                  storedCapped
                    ? "history.totalIncidentsWindow"
                    : "history.totalIncidents",
                  language
                )}
                value={rows.length}
              />
              <SummaryCell
                label={t("history.dangerCount", language)}
                value={dangerCount}
                chip={
                  <StatusChip
                    level="danger"
                    label={t("risk.danger", language)}
                    size="sm"
                  />
                }
              />
              <SummaryCell
                label={t("history.warningCount", language)}
                value={warningCount}
                chip={
                  <StatusChip
                    level="warning"
                    label={t("risk.warning", language)}
                    size="sm"
                  />
                }
              />
            </dl>
          </GlassCard>

          {hasError ? (
            <StatePanel
              variant="error"
              title={t("history.errorTitle", language)}
              description={t("source.errorBody", language)}
              action={
                <StateRetry
                  onRetry={handleRefresh}
                  label={t("common.retry", language)}
                />
              }
            />
          ) : isEmpty ? (
            <StatePanel
              variant="empty"
              title={t("history.empty", language)}
              description={t("history.emptyBody", language)}
              nextAction={t("history.emptyNext", language)}
            />
          ) : (
            <GlassCard flush>
              <PanelHeader
                title={t("dashboard.recentIncidents", language)}
                icon={<ClipboardList className="h-4 w-4" />}
                action={
                  <span className="tabular-data text-body-sm text-muted">
                    {rows.length}
                  </span>
                }
              />

              <div
                role="group"
                aria-label={t("history.filterLabel", language)}
                className="flex flex-wrap items-center gap-2 border-t border-border px-6 py-3"
              >
                {LEVEL_FILTERS.map(({ value, labelKey }) => {
                  const active = levelFilter === value;
                  return (
                    <Chip
                      key={value}
                      as="button"
                      tone={active ? (value === "all" ? "info" : value) : "neutral"}
                      aria-pressed={active}
                      onClick={() => changeFilter(value)}
                      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      {t(labelKey, language)}
                    </Chip>
                  );
                })}
              </div>

              {filteredRows.length === 0 ? (
                <div className="border-t border-border">
                  <StatePanel
                    variant="empty"
                    title={t("history.filterEmpty", language)}
                    description={t("history.filterEmptyBody", language)}
                    nextAction={t("history.filterEmptyNext", language)}
                  />
                </div>
              ) : (
                <>
              {/* Desktop: a real table, from `md` up. */}
              <div className="hidden border-t border-border md:block">
                <GlassTable
                  bare
                  maxHeight="max-h-[70vh]"
                  aria-label={t("history.title", language)}
                >
                  <thead>
                    <tr>
                      <GlassTableCell
                        as="th"
                        scope="col"
                        aria-sort={sortDir === "asc" ? "ascending" : "descending"}
                        className="sticky top-0 left-0 z-30 border-r border-border"
                      >
                        <button
                          type="button"
                          onClick={toggleSort}
                          aria-label={`${t("history.sortLabel", language)}: ${t(
                            sortDir === "asc"
                              ? "history.sortAsc"
                              : "history.sortDesc",
                            language
                          )}`}
                          className="inline-flex items-center gap-1.5 uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-2"
                        >
                          {t("history.col.time", language)}
                          {sortDir === "asc" ? (
                            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                        </button>
                      </GlassTableCell>
                      <GlassTableCell
                        as="th"
                        scope="col"
                        className="sticky top-0 z-20"
                      >
                        {t("history.col.risk", language)}
                      </GlassTableCell>
                      {columns.slice(1).map(([key]) => (
                        <GlassTableCell
                          key={key}
                          as="th"
                          scope="col"
                          className="sticky top-0 z-20"
                        >
                          {t(key, language)}
                        </GlassTableCell>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row) => (
                      <GlassTableRow key={row.id}>
                        {/* The frozen cell keeps its own surface fill so the
                            other columns scroll underneath it. The row hover
                            tint stops at this cell on purpose: a transparent
                            cell would let those columns show through. */}
                        <GlassTableCell className="sticky left-0 z-10 border-r border-border bg-surface">
                          <span className="whitespace-nowrap">
                            {formatTimestamp(row.timestamp, language, unavailable)}
                          </span>
                        </GlassTableCell>
                        <GlassTableCell>
                          <StatusChip
                            level={row.level}
                            label={riskLabel(row.level, language)}
                            size="sm"
                          />
                        </GlassTableCell>
                        {columns.slice(1).map(([key, read]) => (
                          <GlassTableCell key={key}>{read(row)}</GlassTableCell>
                        ))}
                      </GlassTableRow>
                    ))}
                  </tbody>
                </GlassTable>
              </div>

              {/* Mobile: the same rows as stacked labelled fields. */}
              <ul className="divide-y divide-border-strong border-t border-border md:hidden">
                {visibleRows.map((row) => (
                  <li key={row.id} className="px-6 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <StatusChip
                        level={row.level}
                        label={riskLabel(row.level, language)}
                        size="sm"
                      />
                      <span className="tabular-data text-body-sm text-fg">
                        {formatTimestamp(row.timestamp, language, unavailable)}
                      </span>
                    </div>

                    <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3">
                      {columns.slice(1).map(([key, read]) => (
                        <MobileField key={key} label={t(key, language)}>
                          {read(row)}
                        </MobileField>
                      ))}
                    </dl>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4">
                <p className="text-body-sm text-muted">
                  {t("history.showing", language, {
                    shown: visibleRows.length,
                    total: filteredRows.length,
                  })}
                  {storedCapped && (
                    <span className="block text-caption text-muted">
                      {t("history.storedLimited", language, {
                        limit: STORED_HISTORY_LIMIT,
                      })}
                    </span>
                  )}
                </p>

                {hasMore && (
                  <GlassButton type="button" variant="outline" onClick={showMore}>
                    {t("history.loadMore", language)}
                  </GlassButton>
                )}
              </div>
                </>
              )}
            </GlassCard>
          )}
        </>
      )}
    </section>
  );
};

export default HistoryPage;
