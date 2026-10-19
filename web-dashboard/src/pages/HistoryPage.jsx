import React, { useCallback, useMemo } from "react";
import { ClipboardList, Download, Radio, RefreshCw } from "lucide-react";
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
import { useInsole } from "../context/InsoleContext";
import { t } from "../utils/i18n";

/**
 * HistoryPage, the incident register.
 *
 * Rows come from InsoleContext.incidentLogs, which appends one entry each time
 * the risk level changes to warning or danger. Nothing here is generated: with
 * no device connected the log is genuinely empty, and the empty state says so
 * in words rather than looking like a failed load.
 *
 * The desktop register is a real table. Below `md` the same eight fields render
 * as stacked labelled rows, because a table cannot reflow.
 */

const RISK_LEVELS = ["safe", "warning", "danger"];

const riskLabel = (level, language) =>
  RISK_LEVELS.includes(level)
    ? t(`risk.${level}`, language)
    : t("risk.unknown", language);

const formatTimestamp = (timestamp, language, fallback) =>
  Number.isFinite(timestamp)
    ? new Date(timestamp).toLocaleString(language === "id" ? "id-ID" : "en-GB")
    : fallback;

/** Quote every field so a localised date containing a comma cannot split a row. */
const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

/** One count in the summary strip. */
const SummaryCell = ({ label, value, chip }) => (
  <div className="bg-surface px-6 py-5">
    <dt className="text-label uppercase text-muted">{label}</dt>
    <dd className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
      {/* text-stat, matching ProfilePage's stat blocks: the same
          count-as-a-reading semantic renders at the same size everywhere. */}
      <span className="tabular-data font-heading text-stat text-fg">{value}</span>
      {chip}
    </dd>
  </div>
);

/** One labelled field inside a stacked mobile row. */
const MobileField = ({ label, children }) => (
  <div className="min-w-0">
    <dt className="text-label uppercase text-muted">{label}</dt>
    <dd className="mt-0.5 tabular-data text-body-sm text-fg">{children}</dd>
  </div>
);

const HistoryPage = () => {
  const { incidentLogs, connectionState, reconnect, isLive, language } =
    useInsole();

  const unavailable = t("common.notAvailable", language);

  const rows = useMemo(
    () =>
      incidentLogs.map((log, index) => {
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
      }),
    [incidentLogs]
  );

  const dangerCount = rows.filter((row) => row.level === "danger").length;
  const warningCount = rows.filter((row) => row.level === "warning").length;

  const kpa = (value) =>
    Number.isFinite(value)
      ? `${value.toFixed(1)} ${t("metrics.unit.kpa", language)}`
      : unavailable;

  const seconds = (value) =>
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

  const columns = [
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

            <dl className="grid grid-cols-1 gap-px border-t border-border bg-border sm:grid-cols-3">
              <SummaryCell
                label={t("history.totalIncidents", language)}
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

              {/* Desktop: a real table, from `md` up. */}
              <div className="hidden border-t border-border md:block">
                <GlassTable bare aria-label={t("history.title", language)}>
                  <thead>
                    <tr>
                      <GlassTableCell as="th" scope="col">
                        {t("history.col.time", language)}
                      </GlassTableCell>
                      <GlassTableCell as="th" scope="col">
                        {t("history.col.risk", language)}
                      </GlassTableCell>
                      {columns.slice(1).map(([key]) => (
                        <GlassTableCell key={key} as="th" scope="col">
                          {t(key, language)}
                        </GlassTableCell>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <GlassTableRow key={row.id}>
                        <GlassTableCell>
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
                {rows.map((row) => (
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
            </GlassCard>
          )}
        </>
      )}
    </section>
  );
};

export default HistoryPage;
