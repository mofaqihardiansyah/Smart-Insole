import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { useInsole } from "../../context/InsoleContext";
import { t } from "../../utils/i18n";
import { AdminPageHeader, AdminSection } from "./AdminPrimitives";
import {
  GlassCard,
  GlassTable,
  GlassTableCell,
  GlassTableRow,
  PageHeader,
  PanelHeader,
  StatePanel,
} from "../../components/ui/GlassComponents";
import { listUsers } from "../../services/firebaseConfig";
import {
  subscribeToAudit,
  subscribeToDeviceIds,
  type AuditEntry,
} from "../../services/firebaseRealtime";

/**
 * One reading in the console's status strip. A strip rather than three cards:
 * across a desk these are one instrument reading, and three floating cards
 * would add elevation that carries no hierarchy.
 */
const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="px-6 py-5">
    <dt className="text-label uppercase text-fg-2">{label}</dt>
    <dd className="mt-1.5 font-mono text-stat tabular-nums text-fg">{value}</dd>
  </div>
);

/** Machine verbs the console writes, in the words an operator reads. */
const ACTION_LABELS: Record<string, string> = {
  "user.active": "Status akun",
  "user.role": "Role akun",
  "user.delete": "Hapus akun",
  "device.pair": "Pasangkan perangkat",
  "device.unpair": "Lepas perangkat",
  "device.prune": "Retensi riwayat",
  "incident.ack": "Tandai insiden",
  "incident.unack": "Batalkan insiden",
  "config.thresholds": "Ubah ambang",
};

/**
 * AdminOverviewPage — the console's landing view.
 *
 * Counts come from the same sources the other tabs use, so the numbers on this
 * page can never disagree with the list a click away: Firestore for accounts,
 * `/devices` for the fleet, `/audit` for activity.
 */
const AdminOverviewPage = () => {
  const { language } = useInsole();
  const [users, setUsers] = useState<Array<{ uid: string; active?: boolean }>>([]);
  const [deviceIds, setDeviceIds] = useState<string[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listUsers()
      .then((rows) => {
        if (!cancelled) setUsers(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || "Failed to load users");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(
    () =>
      subscribeToDeviceIds(
        setDeviceIds,
        () => setError((prev) => prev ?? t("admin.devices.error", language))
      ),
    [language]
  );

  useEffect(() => subscribeToAudit(setAudit, 20), []);

  const activeUsers = users.filter((u) => u.active !== false).length;

  return (
    <section className="space-y-5 lg:space-y-6">
      <AdminPageHeader
        title={t("admin.nav.overview", language)}
        subtitle={t("admin.subtitle", language)}
      />

      {error && (
        <StatePanel
          variant="error"
          title={t("admin.actionError", language)}
          description={error}
          nextAction={t("common.nextStepCheckConnection", language)}
          nextActionLabel={t("common.nextStep", language)}
        />
      )}

      <dl className="grid grid-cols-1 divide-y divide-border-strong border-y border-border-strong sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Stat label={t("admin.overview.users", language)} value={users.length} />
        <Stat label={t("admin.overview.active", language)} value={activeUsers} />
        <Stat
          label={t("admin.overview.devices", language)}
          value={deviceIds.length}
        />
      </dl>

      <AdminSection
          title={t("admin.overview.audit", language)}
        >
        <div className="pb-2">
          {audit.length === 0 ? (
            <p className="text-body-sm text-muted">
              {t("admin.overview.emptyAudit", language)}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <GlassTable>
                <thead>
                  <GlassTableRow>
                    <GlassTableCell as="th" scope="col">
                      {t("admin.audit.time", language)}
                    </GlassTableCell>
                    <GlassTableCell as="th" scope="col">
                      {t("admin.audit.actor", language)}
                    </GlassTableCell>
                    <GlassTableCell as="th" scope="col">
                      {t("admin.audit.action", language)}
                    </GlassTableCell>
                    <GlassTableCell as="th" scope="col">
                      {t("admin.audit.target", language)}
                    </GlassTableCell>
                  </GlassTableRow>
                </thead>
                <tbody>
                  {audit.map((entry) => (
                    <GlassTableRow key={`${entry.at}-${entry.action}-${entry.target}`}>
                      <GlassTableCell>
                        <span className="whitespace-nowrap tabular-data">
                          {new Date(entry.at).toLocaleString(
                            language === "id" ? "id-ID" : "en-GB"
                          )}
                        </span>
                      </GlassTableCell>
                      <GlassTableCell>
                        <span className="text-muted">
                          {entry.actorEmail || entry.actorUid}
                        </span>
                      </GlassTableCell>
                      <GlassTableCell>
                        {ACTION_LABELS[entry.action] ?? entry.action}
                      </GlassTableCell>
                      <GlassTableCell>
                        <span className="text-muted">
                          {entry.target || t("common.notAvailable", language)}
                        </span>
                      </GlassTableCell>
                    </GlassTableRow>
                  ))}
                </tbody>
              </GlassTable>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-3 text-body-sm font-medium">
            <Link className="text-primary hover:underline" to="/admin/users">
              {t("admin.nav.users", language)}
            </Link>
            <Link className="text-primary hover:underline" to="/admin/devices">
              {t("admin.nav.devices", language)}
            </Link>
            <Link className="text-primary hover:underline" to="/admin/incidents">
              {t("admin.nav.incidents", language)}
            </Link>
          </div>
        </div>
      </AdminSection>

    </section>
  );
};

export default AdminOverviewPage;
