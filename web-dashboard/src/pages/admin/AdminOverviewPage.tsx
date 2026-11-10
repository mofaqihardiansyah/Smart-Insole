import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { useInsole } from "../../context/InsoleContext";
import { t } from "../../utils/i18n";
import { adminErrorCopy, type AdminErrorCopy } from "../../utils/adminErrors";
import { AdminEmpty, AdminPageHeader, AdminSection } from "./AdminPrimitives";
import {
  GlassTable,
  GlassTableCell,
  GlassTableRow,
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
const Stat = ({
  label,
  value,
  language,
}: {
  label: string;
  value: number | null;
  language: string;
}) => (
  <div className="px-6 py-5">
    <dt className="text-label uppercase text-fg-2">{label}</dt>
    {/* A dash or a zero before the source reports would state a count that is
        not known yet. The cell holds its own height with a skeleton instead,
        and the wait is announced rather than silent. */}
    <dd className="mt-1.5 font-mono text-stat tabular-nums text-fg">
      {value === null ? (
        <span className="flex h-8 items-center">
          <span className="h-2 w-8 rounded-sm bg-border" aria-hidden="true" />
          <span className="sr-only">{t("common.loading", language)}</span>
        </span>
      ) : (
        value
      )}
    </dd>
  </div>
);

/** Machine verbs the console writes, in the words an operator reads.
 *
 * `user.delete` and `config.thresholds` are no longer written: the console
 * cannot delete an account or edit a threshold. They stay mapped because the
 * audit log is append-only and older rows would otherwise surface as raw
 * machine verbs. */
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
 *
 * Each source starts as `null` rather than an empty array. An empty array
 * renders as `0`, which is a claim; `null` renders as a dash, which is the
 * truth while the subscription has not reported yet.
 */
const AdminOverviewPage = () => {
  const { language } = useInsole();
  const [users, setUsers] = useState<
    Array<{ uid: string; active?: boolean }> | null
  >(null);
  const [deviceIds, setDeviceIds] = useState<string[] | null>(null);
  const [audit, setAudit] = useState<AuditEntry[] | null>(null);
  const [error, setError] = useState<AdminErrorCopy | null>(null);

  useEffect(() => {
    let cancelled = false;
    listUsers()
      .then((rows) => {
        if (!cancelled) setUsers(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(adminErrorCopy(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(
    () =>
      subscribeToDeviceIds(
        setDeviceIds,
        (err) => setError((prev) => prev ?? adminErrorCopy(err))
      ),
    []
  );

  useEffect(
    () =>
      subscribeToAudit(
        setAudit,
        20,
        (err) => setError((prev) => prev ?? adminErrorCopy(err))
      ),
    []
  );

  const activeUsers =
    users === null ? null : users.filter((u) => u.active !== false).length;

  return (
    <section className="space-y-5 lg:space-y-6">
      <AdminPageHeader
        title={t("admin.nav.overview", language)}
        subtitle={t("admin.subtitle", language)}
      />

      {error && (
        <StatePanel
          variant="error"
          title={t(error.message, language)}
          description={t(error.next, language)}
          nextAction={t("admin.retryNext", language)}
          nextActionLabel={t("common.nextStep", language)}
        />
      )}

      <dl className="grid grid-cols-1 divide-y divide-border-strong border-y border-border-strong sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Stat
          label={t("admin.overview.users", language)}
          value={users === null ? null : users.length}
          language={language}
        />
        <Stat
          label={t("admin.overview.active", language)}
          value={activeUsers}
          language={language}
        />
        <Stat
          label={t("admin.overview.devices", language)}
          value={deviceIds === null ? null : deviceIds.length}
          language={language}
        />
      </dl>

      <AdminSection title={t("admin.overview.audit", language)}>
        <div className="pb-2">
          {audit !== null &&
            (audit.length === 0 ? (
              <AdminEmpty
                icon={
                  <ClipboardList
                    className="mx-auto h-6 w-6 text-muted"
                    aria-hidden="true"
                  />
                }
                title={t("admin.overview.emptyAudit", language)}
                body={t("admin.overview.emptyAuditBody", language)}
              />
            ) : (
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
            ))}

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
