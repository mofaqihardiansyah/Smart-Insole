import React, { useEffect, useState } from "react";
import { Activity, BatteryMedium, Download } from "lucide-react";
import { useInsole } from "../../context/InsoleContext";
import { useUser } from "../../context/UserContext";
import { t } from "../../utils/i18n";
import { AdminEmpty, AdminPageHeader, AdminSection } from "./AdminPrimitives";
import { logAdminAction } from "../../utils/adminAudit";
import {
  GlassButton,
  GlassCard,
  GlassInput,
  PageHeader,
  PanelHeader,
  StatePanel,
  StatusBanner,
  StatusChip,
} from "../../components/ui/GlassComponents";
import {
  getDeviceHistory,
  pruneDeviceHistory,
  subscribeToAllUserDevices,
  subscribeToDeviceIds,
  subscribeToDeviceReadings,
} from "../../services/firebaseRealtime";
import type { MappedReading } from "../../types/insole";

interface DeviceCardProps {
  deviceId: string;
  owner: string | null;
  language: string;
  onError: (message: string | null) => void;
}

/** One device: live latest packet, online state, and retention controls. */
const DeviceCard = ({ deviceId, owner, language, onError }: DeviceCardProps) => {
  const [latest, setLatest] = useState<MappedReading | null>(null);
  const [days, setDays] = useState("30");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const { user } = useUser();

  useEffect(
    () =>
      subscribeToDeviceReadings(
        deviceId,
        (reading) => {
          setLatest(reading);
          onError(null);
        },
        (err) => onError(err?.message || t("admin.devices.error", language))
      ),
    [deviceId, language, onError]
  );

  const online =
    latest?.timestamp != null && Date.now() - latest.timestamp < 5 * 60 * 1000;

  const handleArchiveAndPrune = async () => {
    const parsed = Number(days);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    setBusy(true);
    setNotice(null);
    try {
      const before = Date.now() - parsed * 24 * 60 * 60 * 1000;
      // Archive first: the delete below cannot be undone.
      const history = await getDeviceHistory(deviceId);
      const snapshot = Object.fromEntries(
        Object.entries(history).filter(([, row]) => {
          const at = Number((row as { timestamp?: number })?.timestamp);
          return Number.isFinite(at) && at < before;
        })
      );
      const blob = new Blob([JSON.stringify({ deviceId, days: parsed, rows: snapshot }, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${deviceId}-history-archive.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      const result = await pruneDeviceHistory(deviceId, before);
      setNotice(
        t("admin.devices.pruneResult", language, {
          deleted: result.deleted,
          failed: result.failed,
        })
      );
      try {
        await logAdminAction(
          { uid: user?.uid ?? "", email: user?.email ?? null },
          "device.prune",
          deviceId,
          `${result.deleted} rows older than ${parsed}d`
        );
      } catch {
        /* the prune succeeded; the audit warning is not worth blocking on */
      }
    } catch (err) {
      onError((err as { message?: string })?.message || t("admin.actionError", language));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminSection
        title={deviceId}
        action={
          <StatusChip
            level={online ? "safe" : "danger"}
            label={
              online
                ? t("admin.devices.online", language)
                : t("admin.devices.offline", language)
            }
            size="sm"
          />
        }
      >
      <div className="space-y-4 pb-2">
        <dl className="divide-y divide-border-strong">
          <div className="flex items-center justify-between gap-4 py-2">
            <dt className="text-body-sm text-muted">{t("admin.devices.owner", language)}</dt>
            <dd className="text-body-sm font-medium text-fg">
              {owner || t("admin.users.noDevice", language)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-2">
            <dt className="text-body-sm text-muted">{t("admin.devices.battery", language)}</dt>
            <dd className="flex items-center gap-2 text-body-sm font-medium text-fg">
              <BatteryMedium className="h-4 w-4 text-muted" aria-hidden="true" />
              {Number.isFinite(latest?.batteryPercent ?? NaN)
                ? `${Math.round(latest?.batteryPercent as number)}%`
                : t("common.notAvailable", language)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-2">
            <dt className="text-body-sm text-muted">{t("admin.devices.lastSeen", language)}</dt>
            <dd className="text-body-sm font-medium text-fg">
              {latest?.timestamp
                ? new Date(latest.timestamp).toLocaleString(
                    language === "id" ? "id-ID" : "en-GB"
                  )
                : t("common.notAvailable", language)}
            </dd>
          </div>
        </dl>

        <div>
          <p className="text-label uppercase text-fg-2">
            {t("admin.devices.retention", language)}
          </p>
          <p className="mt-1 max-w-prose text-body-sm text-muted">
            {t("admin.devices.retentionBody", language)}
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div className="w-40">
              <GlassInput
                id={`retention-${deviceId}`}
                type="number"
                inputMode="numeric"
                min={1}
                max={365}
                label={t("admin.devices.days", language)}
                value={days}
                onChange={(event) => setDays(event.target.value)}
              />
            </div>
            <GlassButton
              type="button"
              variant="outline"
              disabled={busy}
              onClick={handleArchiveAndPrune}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {t("admin.devices.archive", language)}
            </GlassButton>
          </div>
          {notice && (
            <p className="mt-2 text-body-sm text-muted" role="status">
              {notice}
            </p>
          )}
        </div>
      </div>
    </AdminSection>
  );
};

/**
 * AdminDevicesPage — the fleet, read from `/devices`.
 *
 * The legacy single-tenant `readings/latest` card is gone: a console that can
 * only see one foot cannot administer a clinic.
 */
const AdminDevicesPage = () => {
  const { language } = useInsole();
  const [deviceIds, setDeviceIds] = useState<string[]>([]);
  const [pairings, setPairings] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () =>
      subscribeToDeviceIds(
        (ids) => setDeviceIds(ids.slice(0, 50)),
        (err) => setError(err?.message || t("admin.devices.error", language))
      ),
    [language]
  );

  useEffect(() => subscribeToAllUserDevices(setPairings), []);

  const ownerOf = (deviceId: string) =>
    Object.entries(pairings).find(([, ids]) => ids.includes(deviceId))?.[0] ?? null;

  return (
    <section className="space-y-5 lg:space-y-6">
      <AdminPageHeader
        title={t("admin.nav.devices", language)}
        subtitle={t("admin.devices.title", language)}
      />

      {error && (
        <StatusBanner
          tone="danger"
          title={t("admin.devices.error", language)}
          nextAction={t("common.nextStepCheckConnection", language)}
        >
          {error}
        </StatusBanner>
      )}

      {deviceIds.length === 0 ? (
        <AdminEmpty
          icon={
            <Activity className="mx-auto h-6 w-6 text-muted" aria-hidden="true" />
          }
          title={t("admin.devices.none", language)}
          body={t("admin.devices.noneBody", language)}
          action={
            <p className="text-body-sm text-muted">
              {t("admin.devices.emptyNext", language)}
            </p>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-x-10 lg:grid-cols-2">
          {deviceIds.map((id) => (
            <DeviceCard
              key={id}
              deviceId={id}
              owner={ownerOf(id)}
              language={language}
              onError={setError}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default AdminDevicesPage;
