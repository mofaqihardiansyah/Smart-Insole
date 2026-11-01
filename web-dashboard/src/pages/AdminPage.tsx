import React, { useEffect, useState } from "react";
import { Activity, BatteryMedium, Users, Settings, Trash2, UserCheck, UserX } from "lucide-react";
import { useInsole } from "../context/InsoleContext";
import { useUser } from "../context/UserContext";
import { t } from "../utils/i18n";
import {
  GlassCard,
  GlassButton,
  GlassInput,
  GlassTable,
  GlassTableRow,
  GlassTableCell,
  PanelHeader,
  PageHeader,
  StatusChip,
  StatePanel,
  StatusBanner,
} from "../components/ui/GlassComponents";
import {
  subscribeToReadings,
  subscribeToGlobalConfig,
  setGlobalConfig,
} from "../services/firebaseRealtime";
import { listUsers, updateUserDoc, deleteUserDoc } from "../services/firebaseConfig";
import type { RiskLevel } from "../types/insole";

/** One row of the admin user list, exactly as listUsers returns it. */
type AdminUserRow = Awaited<ReturnType<typeof listUsers>>[number];

/** The device facts this page shows, read live from RTDB. */
interface DeviceSnapshot {
  deviceId: string | null;
  batteryPercent: number | null;
  timestamp: number | null;
  riskLevel: RiskLevel | null;
}

/** The fleet config as edited: the two thresholds, before parsing. */
interface ConfigDraft {
  safeThreshold: number | string;
  dangerThreshold: number | string;
}

/** The part of a caught error this page reads. */
interface CaughtError {
  message?: string;
  code?: string;
}

/**
 * AdminPage — the admin console.
 *
 * Three jobs, one page:
 *   1. Users: list, activate/deactivate, delete accounts.
 *   2. Devices: live status of every insole reporting to RTDB.
 *   3. Config: fleet-wide default thresholds. Every dashboard picks them up
 *      unless that browser saved its own values in Settings, which still win.
 *
 * Access is guarded by the `role` field on the Firestore user doc. The guard
 * is a redirect, not a hidden page: a non-admin who types the URL lands back
 * on the dashboard rather than seeing a 404 or a half-rendered console.
 *
 * Every destructive action (deactivate, delete) asks for confirmation first.
 * A dead control is a defect, not decoration. The confirmation stays
 * `window.confirm` on purpose: it is native, accessible and blocks nothing
 * visually. Action *failures* used to be `window.alert`, which is a blocking
 * unstyled dialog; they are inline danger banners now, with the Firebase
 * detail as the body and the translated title carrying the hierarchy, the
 * same pattern the login page settled on.
 */

const AdminPage = () => {
  const { language } = useInsole();
  const { role } = useUser();

  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [userActionError, setUserActionError] = useState<string | null>(null);

  const [device, setDevice] = useState<DeviceSnapshot | null>(null);
  const [deviceError, setDeviceError] = useState<string | null | undefined>(
    null
  );

  const [config, setConfig] = useState<ConfigDraft>({
    safeThreshold: 35,
    dangerThreshold: 70,
  });
  const [configSaving, setConfigSaving] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [configErrorForbidden, setConfigErrorForbidden] = useState(false);

  /* ---- users ----
   * Every hook must run on every render: `role` arrives asynchronously, so the
   * non-admin guard lives further down, AFTER all hooks. A conditional early
   * return above them crashed React on a hard refresh at /admin (the first
   * render had role "" with zero hooks, the second had three). */
  useEffect(() => {
    let cancelled = false;
    listUsers()
      .then((rows) => {
        if (!cancelled) {
          setUsers(rows);
          setUsersLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setUsersError(err?.message || "Failed to load users");
          setUsersLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---- device (live from RTDB) ---- */
  useEffect(() => {
    const unsub = subscribeToReadings(
      (reading) => {
        setDevice({
          deviceId: reading.deviceId,
          batteryPercent: reading.batteryPercent,
          timestamp: reading.timestamp,
          riskLevel: reading.riskLevel,
        });
        setDeviceError(null);
      },
      (err) => setDeviceError(err?.message || undefined)
    );
    return unsub;
  }, []);

  /* ---- global config ---- */
  useEffect(() => {
    const unsub = subscribeToGlobalConfig(
      (cfg) => setConfig(cfg),
      () => {
        /* keep defaults if the read fails */
      }
    );
    return unsub;
  }, []);

  const handleToggleActive = async (user: AdminUserRow) => {
    setUserActionError(null);
    const next = !user.active;
    if (!window.confirm(t(next ? "admin.confirmActivate" : "admin.confirmDeactivate", language))) return;
    try {
      await updateUserDoc(user.uid, { active: next });
      setUsers((prev) => prev.map((u) => (u.uid === user.uid ? { ...u, active: next } : u)));
    } catch (err) {
      setUserActionError(
        (err as CaughtError)?.message || t("admin.actionError", language)
      );
    }
  };

  const handleDelete = async (user: AdminUserRow) => {
    setUserActionError(null);
    if (!window.confirm(t("admin.confirmDelete", language))) return;
    try {
      await deleteUserDoc(user.uid);
      setUsers((prev) => prev.filter((u) => u.uid !== user.uid));
    } catch (err) {
      setUserActionError(
        (err as CaughtError)?.message || t("admin.actionError", language)
      );
    }
  };

  // Client-side mirror of the RTDB rules: dangerThreshold > safeThreshold > 0.
  // Catching it here turns a guaranteed server rejection into a form state the
  // admin can fix before the request ever leaves the browser.
  const safeValue = Number(config.safeThreshold);
  const dangerValue = Number(config.dangerThreshold);
  const configInvalid = !(
    Number.isFinite(safeValue) &&
    Number.isFinite(dangerValue) &&
    safeValue > 0 &&
    dangerValue > safeValue
  );

  const handleSaveConfig = async () => {
    if (configInvalid) return;
    setConfigSaving(true);
    setConfigSaved(false);
    setConfigError(null);
    setConfigErrorForbidden(false);
    try {
      await setGlobalConfig({
        safeThreshold: safeValue,
        dangerThreshold: dangerValue,
      });
      setConfigSaved(true);
    } catch (err) {
      // PERMISSION_DENIED on this node almost always means the RTDB admin
      // mirror (users/<uid>/role) is missing — say so instead of blaming the
      // connection.
      const forbidden =
        (err as CaughtError)?.code === "PERMISSION_DENIED" ||
        /PERMISSION_DENIED/i.test((err as CaughtError)?.message || "");
      setConfigErrorForbidden(forbidden);
      setConfigError(
        forbidden
          ? t("admin.config.forbidden", language)
          : (err as CaughtError)?.message || t("admin.actionError", language)
      );
    } finally {
      setConfigSaving(false);
    }
  };

  // The language-neutral fallback for an absent user field. Taken from the
  // dictionary rather than written as a separator character, so the copy is
  // localised and stays inside every dictionary gate.
  const unavailable = t("common.notAvailable", language);

  const deviceOnline =
    device?.timestamp && Date.now() - device.timestamp < 5 * 60 * 1000;

  /* ---- guard: non-admins go back to the dashboard ---- */
  if (role !== "admin") {
    return (
      <section className="mx-auto w-full max-w-3xl space-y-5 lg:space-y-6">
        <PageHeader title={t("admin.title", language)} />
        <StatePanel
          variant="error"
          title={t("admin.accessDenied", language)}
          description={t("admin.accessDeniedBody", language)}
          nextAction={t("admin.accessDeniedNext", language)}
          nextActionLabel={t("common.nextStep", language)}
        />
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-5xl space-y-5 lg:space-y-6">
      <PageHeader
        title={t("admin.title", language)}
        subtitle={t("admin.subtitle", language)}
      />

      {/* ==================== USERS ==================== */}
      <GlassCard flush>
        <PanelHeader
          title={t("admin.users.title", language)}
          icon={<Users className="h-4 w-4" />}
        />
        <div className="px-6 pb-6">
          {userActionError && (
            <StatusBanner
              tone="danger"
              className="mb-4"
              title={t("admin.actionError", language)}
              nextAction={t("common.nextStepCheckConnection", language)}
            >
              {userActionError}
            </StatusBanner>
          )}
          {usersLoading ? (
            <StatePanel variant="loading" title={t("admin.users.loading", language)} />
          ) : usersError ? (
            <StatePanel variant="error" title={t("admin.users.error", language)} description={usersError} nextAction={t("admin.retryNext", language)} nextActionLabel={t("common.nextStep", language)} />
          ) : users.length === 0 ? (
            <StatePanel variant="empty" title={t("admin.users.empty", language)} nextAction={t("admin.users.emptyNext", language)} nextActionLabel={t("common.nextStep", language)} />
          ) : (
            <div className="overflow-x-auto">
              <GlassTable>
                <thead>
                  <GlassTableRow>
                    <GlassTableCell as="th" scope="col">
                      {t("admin.users.name", language)}
                    </GlassTableCell>
                    <GlassTableCell as="th" scope="col">
                      {t("admin.users.email", language)}
                    </GlassTableCell>
                    <GlassTableCell as="th" scope="col">
                      {t("admin.users.status", language)}
                    </GlassTableCell>
                    <GlassTableCell as="th" scope="col">
                      {t("admin.users.actions", language)}
                    </GlassTableCell>
                  </GlassTableRow>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <GlassTableRow key={user.uid}>
                      <GlassTableCell>
                        <span className="font-medium text-fg">{user.displayName || unavailable}</span>
                      </GlassTableCell>
                      <GlassTableCell>
                        <span className="text-muted">{user.email || unavailable}</span>
                      </GlassTableCell>
                      <GlassTableCell>
                        <StatusChip
                          level={user.active === false ? "danger" : "safe"}
                          label={
                            user.active === false
                              ? t("admin.users.inactive", language)
                              : t("admin.users.active", language)
                          }
                          size="sm"
                        />
                      </GlassTableCell>
                      <GlassTableCell>
                        <div className="flex flex-wrap gap-2">
                          <GlassButton
                            size="sm"
                            variant={user.active === false ? "filled" : "outline"}
                            onClick={() => handleToggleActive(user)}
                          >
                            {user.active === false ? (
                              <>
                                <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                                {t("admin.users.activate", language)}
                              </>
                            ) : (
                              <>
                                <UserX className="h-3.5 w-3.5" aria-hidden="true" />
                                {t("admin.users.deactivate", language)}
                              </>
                            )}
                          </GlassButton>
                          <GlassButton size="sm" variant="danger" onClick={() => handleDelete(user)}>
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            {t("admin.users.delete", language)}
                          </GlassButton>
                        </div>
                      </GlassTableCell>
                    </GlassTableRow>
                  ))}
                </tbody>
              </GlassTable>
            </div>
          )}
        </div>
      </GlassCard>

      {/* ==================== DEVICES ==================== */}
      <GlassCard flush>
        <PanelHeader
          title={t("admin.devices.title", language)}
          icon={<Activity className="h-4 w-4" />}
        />
        <div className="px-6 pb-6">
          {deviceError ? (
            <StatePanel variant="error" title={t("admin.devices.error", language)} description={deviceError} nextAction={t("admin.retryNext", language)} nextActionLabel={t("common.nextStep", language)} />
          ) : !device ? (
            <StatePanel variant="empty" title={t("admin.devices.empty", language)} nextAction={t("admin.devices.emptyNext", language)} nextActionLabel={t("common.nextStep", language)} />
          ) : (
            <dl className="divide-y divide-border-strong">
              <div className="py-3 first:pt-0 last:pb-0">
                <dt className="text-body-sm text-muted">{t("admin.devices.deviceId", language)}</dt>
                <dd className="mt-1 text-body-sm font-medium text-fg">
                  {device.deviceId || t("common.notAvailable", language)}
                </dd>
              </div>
              <div className="py-3 first:pt-0 last:pb-0">
                <dt className="text-body-sm text-muted">{t("admin.devices.battery", language)}</dt>
                <dd className="mt-1 flex items-center gap-2 text-body-sm font-medium text-fg">
                  <BatteryMedium className="h-4 w-4 text-muted" aria-hidden="true" />
                  {Number.isFinite(device.batteryPercent)
                    ? `${Math.round(device.batteryPercent as number)}${t("metrics.unit.percent", language)}`
                    : t("common.notAvailable", language)}
                </dd>
              </div>
              <div className="py-3 first:pt-0 last:pb-0">
                <dt className="text-body-sm text-muted">{t("admin.devices.status", language)}</dt>
                <dd className="mt-1">
                  <StatusChip
                    level={deviceOnline ? "safe" : "danger"}
                    label={
                      deviceOnline
                        ? t("admin.devices.online", language)
                        : t("admin.devices.offline", language)
                    }
                    size="sm"
                  />
                </dd>
              </div>
              <div className="py-3 first:pt-0 last:pb-0">
                <dt className="text-body-sm text-muted">{t("admin.devices.lastSeen", language)}</dt>
                <dd className="mt-1 text-body-sm font-medium text-fg">
                  {device.timestamp
                    ? new Date(device.timestamp).toLocaleString(language === "id" ? "id-ID" : "en-US")
                    : t("common.notAvailable", language)}
                </dd>
              </div>
            </dl>
          )}
        </div>
      </GlassCard>

      {/* ==================== CONFIG ==================== */}
      <GlassCard flush>
        <PanelHeader
          title={t("admin.config.title", language)}
          subtitle={t("admin.config.hint", language)}
          icon={<Settings className="h-4 w-4" />}
        />
        <div className="px-6 pb-6">
          {configInvalid && (
            <StatusBanner
              tone="danger"
              className="mb-4"
              title={t("admin.config.invalidOrder", language)}
            />
          )}
          {configError && (
            <StatusBanner
              tone="danger"
              className="mb-4"
              title={t("admin.actionError", language)}
              nextAction={
                configErrorForbidden
                  ? undefined
                  : t("common.nextStepCheckConnection", language)
              }
            >
              {configError}
            </StatusBanner>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <GlassInput
              id="admin-safe-threshold"
              type="number"
              inputMode="numeric"
              min={0}
              max={200}
              label={t("admin.config.safe", language)}
              value={config.safeThreshold}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, safeThreshold: e.target.value }))
              }
            />
            <GlassInput
              id="admin-danger-threshold"
              type="number"
              inputMode="numeric"
              min={0}
              max={200}
              label={t("admin.config.danger", language)}
              value={config.dangerThreshold}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, dangerThreshold: e.target.value }))
              }
            />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <GlassButton
              variant="filled"
              onClick={handleSaveConfig}
              disabled={configSaving || configInvalid}
            >
              {configSaving
                ? t("admin.config.saving", language)
                : t("admin.config.save", language)}
            </GlassButton>
            {configSaved && (
              <span className="text-body-sm font-medium text-safe" role="status">
                {t("admin.config.saved", language)}
              </span>
            )}
          </div>
        </div>
      </GlassCard>
    </section>
  );
};

export default AdminPage;
