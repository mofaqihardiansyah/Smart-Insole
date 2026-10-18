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

/**
 * AdminPage — the admin console.
 *
 * Three jobs, one page:
 *   1. Users: list, activate/deactivate, delete accounts.
 *   2. Devices: live status of every insole reporting to RTDB.
 *   3. Config: global risk thresholds that apply to all users.
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

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState(null);
  const [userActionError, setUserActionError] = useState(null);

  const [device, setDevice] = useState(null);
  const [deviceError, setDeviceError] = useState(null);

  const [config, setConfig] = useState({ safeThreshold: 35, dangerThreshold: 70 });
  const [configSaving, setConfigSaving] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);
  const [configError, setConfigError] = useState(null);

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

  /* ---- users ---- */
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

  const handleToggleActive = async (user) => {
    setUserActionError(null);
    const next = !user.active;
    if (!window.confirm(t(next ? "admin.confirmActivate" : "admin.confirmDeactivate", language))) return;
    try {
      await updateUserDoc(user.uid, { active: next });
      setUsers((prev) => prev.map((u) => (u.uid === user.uid ? { ...u, active: next } : u)));
    } catch (err) {
      setUserActionError(err?.message || t("admin.actionError", language));
    }
  };

  const handleDelete = async (user) => {
    setUserActionError(null);
    if (!window.confirm(t("admin.confirmDelete", language))) return;
    try {
      await deleteUserDoc(user.uid);
      setUsers((prev) => prev.filter((u) => u.uid !== user.uid));
    } catch (err) {
      setUserActionError(err?.message || t("admin.actionError", language));
    }
  };

  const handleSaveConfig = async () => {
    setConfigSaving(true);
    setConfigSaved(false);
    setConfigError(null);
    try {
      await setGlobalConfig({
        safeThreshold: Number(config.safeThreshold),
        dangerThreshold: Number(config.dangerThreshold),
      });
      setConfigSaved(true);
    } catch (err) {
      setConfigError(err?.message || t("admin.actionError", language));
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
                    ? `${Math.round(device.batteryPercent)}${t("metrics.unit.percent", language)}`
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
          icon={<Settings className="h-4 w-4" />}
        />
        <div className="px-6 pb-6">
          {configError && (
            <StatusBanner
              tone="danger"
              className="mb-4"
              title={t("admin.actionError", language)}
              nextAction={t("common.nextStepCheckConnection", language)}
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
              disabled={configSaving}
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
