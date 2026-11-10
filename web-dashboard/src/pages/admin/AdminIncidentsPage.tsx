import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, RotateCcw, TriangleAlert } from "lucide-react";
import { useInsole } from "../../context/InsoleContext";
import { useUser } from "../../context/UserContext";
import { t } from "../../utils/i18n";
import { adminErrorCopy, type AdminErrorCopy } from "../../utils/adminErrors";
import { AdminEmpty, AdminPageHeader } from "./AdminPrimitives";
import { logAdminAction } from "../../utils/adminAudit";
import {
  GlassButton,
  GlassCard,
  GlassTable,
  GlassTableCell,
  GlassTableRow,
  PanelHeader,
  StatePanel,
  StatusBanner,
  StatusChip,
} from "../../components/ui/GlassComponents";
import {
  acknowledgeIncident,
  clearIncidentAck,
  subscribeToDeviceHistoryWithIds,
  subscribeToDeviceIds,
  subscribeToTriage,
  type HistoryRowWithId,
  type TriageMark,
} from "../../services/firebaseRealtime";

type Triaged = HistoryRowWithId & { deviceId: string; ack: TriageMark | null };

/**
 * AdminIncidentsPage — danger events across the fleet, with triage.
 *
 * History stays append-only and owned by the firmware; the "done" mark lives in
 * `/triage/<deviceId>/<pushId>` so acknowledging an incident never rewrites a
 * measurement. Rows fan in from one subscription per device, capped at 50
 * devices, which is the same ceiling the console states elsewhere.
 */
const AdminIncidentsPage = () => {
  const { language } = useInsole();
  const { user } = useUser();

  const [deviceIds, setDeviceIds] = useState<string[]>([]);
  const [history, setHistory] = useState<Record<string, HistoryRowWithId[]>>({});
  const [triage, setTriage] = useState<Record<string, Record<string, TriageMark>>>({});
  const [filter, setFilter] = useState<"open" | "done" | "all">("open");
  const [error, setError] = useState<AdminErrorCopy | null>(null);

  useEffect(
    () =>
      subscribeToDeviceIds(
        (ids) => setDeviceIds(ids.slice(0, 50)),
        (err) => setError(adminErrorCopy(err))
      ),
    []
  );

  useEffect(() => {
    const unsubscribers = deviceIds.flatMap((id) => [
      subscribeToDeviceHistoryWithIds(
        id,
        (rows) => setHistory((prev) => ({ ...prev, [id]: rows })),
        100,
        (err) => setError(adminErrorCopy(err))
      ),
      subscribeToTriage(
        id,
        (marks) => setTriage((prev) => ({ ...prev, [id]: marks })),
        () => {
          /* denied or not deployed: rows simply render as open */
        }
      ),
    ]);
    return () => unsubscribers.forEach((unsub) => unsub());
  }, [deviceIds]);

  const rows = useMemo<Triaged[]>(() => {
    const all = deviceIds.flatMap((deviceId) =>
      (history[deviceId] ?? [])
        .filter((row) => row.riskLevel === "danger")
        .map((row) => ({
          ...row,
          deviceId,
          ack: triage[deviceId]?.[row.id] ?? null,
        }))
    );
    return all
      .filter((row) =>
        filter === "all" ? true : filter === "done" ? row.ack !== null : row.ack === null
      )
      .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
  }, [deviceIds, history, triage, filter]);

  const handleAck = async (row: Triaged, done: boolean) => {
    setError(null);
    try {
      if (done) {
        await acknowledgeIncident(row.deviceId, row.id, user?.uid ?? "");
      } else {
        await clearIncidentAck(row.deviceId, row.id);
      }
      try {
        await logAdminAction(
          { uid: user?.uid ?? "", email: user?.email ?? null },
          done ? "incident.ack" : "incident.unack",
          `${row.deviceId}/${row.id}`,
          null
        );
      } catch {
        /* triage is what matters here; audit failure is not worth blocking */
      }
    } catch (err) {
      setError(adminErrorCopy(err));
    }
  };

  return (
    <section className="space-y-5 lg:space-y-6">
      <AdminPageHeader
        title={t("admin.nav.incidents", language)}
        subtitle={t("admin.incidents.subtitle", language)}
      />

      {error && (
        <StatusBanner
          tone="danger"
          title={t(error.message, language)}
          nextAction={t(error.next, language)}
        />
      )}

      <div className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <p className="text-body-sm text-muted">
            {t("admin.incidents.count", language, { count: rows.length })}
          </p>
          <div className="flex flex-wrap gap-2">
            {(["open", "done", "all"] as const).map((value) => (
              <GlassButton
                key={value}
                type="button"
                size="sm"
                variant="outline"
                className={
                  filter === value
                    ? "border-fg font-semibold text-fg"
                    : "text-muted"
                }
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
              >
                {value === "open"
                  ? t("admin.incidents.open", language)
                  : value === "done"
                    ? t("admin.incidents.done", language)
                    : t("admin.incidents.all", language)}
              </GlassButton>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <AdminEmpty
            icon={
              <TriangleAlert
                className="mx-auto h-6 w-6 text-muted"
                aria-hidden="true"
              />
            }
            title={t("admin.incidents.empty", language)}
            body={t("admin.incidents.emptyBody", language)}
          />
        ) : (
          <GlassTable>
            <thead>
              <GlassTableRow>
                <GlassTableCell as="th" scope="col">
                  {t("admin.audit.time", language)}
                </GlassTableCell>
                <GlassTableCell as="th" scope="col">
                  {t("admin.incidents.device", language)}
                </GlassTableCell>
                <GlassTableCell as="th" scope="col">
                  {t("risk.status", language)}
                </GlassTableCell>
                <GlassTableCell as="th" scope="col">
                  {t("admin.incidents.actions", language)}
                </GlassTableCell>
              </GlassTableRow>
            </thead>
            <tbody>
              {rows.map((row) => (
                <GlassTableRow key={`${row.deviceId}-${row.id}`}>
                  <GlassTableCell>
                    <span className="whitespace-nowrap tabular-data">
                      {row.timestamp
                        ? new Date(row.timestamp).toLocaleString(
                            language === "id" ? "id-ID" : "en-GB"
                          )
                        : t("common.notAvailable", language)}
                    </span>
                  </GlassTableCell>
                  <GlassTableCell>{row.deviceId}</GlassTableCell>
                  <GlassTableCell>
                    <StatusChip
                      level={row.ack ? "safe" : "danger"}
                      label={
                        row.ack
                          ? t("admin.incidents.done", language)
                          : t("risk.danger", language)
                      }
                      size="sm"
                    />
                  </GlassTableCell>
                  <GlassTableCell>
                    <GlassButton
                      type="button"
                      size="sm"
                      variant={row.ack ? "quiet" : "outline"}
                      onClick={() => handleAck(row, !row.ack)}
                    >
                      {row.ack ? (
                        <>
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                          {t("admin.incidents.unack", language)}
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          {t("admin.incidents.ack", language)}
                        </>
                      )}
                    </GlassButton>
                  </GlassTableCell>
                </GlassTableRow>
              ))}
            </tbody>
          </GlassTable>
        )}
      </div>
    </section>
  );
};

export default AdminIncidentsPage;
