import React, { useState } from "react";
import {
  Bell,
  FlaskConical,
  Info,
  Radio,
  Save,
  Vibrate,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useInsole } from "../context/InsoleContext";
import { t } from "../utils/i18n";
import {
  GlassButton,
  GlassCard,
  GlassSwitch,
  PageHeader,
  PanelHeader,
  StatePanel,
  StateRetry,
  StatusBanner,
  StatusChip,
} from "../components/ui/GlassComponents";

/**
 * `Notification` is absent on some mobile browsers and on insecure origins, so
 * every call site is guarded. Touching the API without the guard throws.
 */
const detectSupport = () =>
  typeof window !== "undefined" && "Notification" in window;

const readPermission = () => {
  if (!detectSupport()) return "unsupported";
  const value = window.Notification.permission;
  return value === "granted" || value === "denied" ? value : "default";
};

const readStoredVibration = () => {
  try {
    return localStorage.getItem("vibrationEnabled") === "true";
  } catch {
    return false;
  }
};

const PERMISSION_META = {
  granted: { level: "safe", key: "notifications.granted" },
  denied: { level: "danger", key: "notifications.denied" },
  default: { level: "warning", key: "notifications.default" },
};

/**
 * A labelled preference row. The switch carries the state for assistive
 * technology, and the On/Off line states it in words so the track colour is
 * never the only signal.
 */
const PreferenceRow = ({
  icon: Icon,
  title,
  body,
  checked,
  onChange,
  id,
  language,
}) => (
  <div className="flex items-start justify-between gap-4">
    <div className="min-w-0">
      <p className="flex items-center gap-2 text-body font-medium text-fg">
        <Icon className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
        {title}
      </p>
      <p className="mt-0.5 text-body-sm text-muted">{body}</p>
      <p className="mt-1 text-body-sm text-muted">
        {checked ? t("settings.on", language) : t("settings.off", language)}
      </p>
    </div>
    <GlassSwitch
      id={id}
      checked={checked}
      onCheckedChange={onChange}
      label={title}
    />
  </div>
);

/**
 * NotificationsPage: browser permission, alarm preferences, and the honest
 * connection state.
 *
 * Everything shown here is read from the browser or from InsoleContext. The
 * connection block is a real data view, so it carries all three states:
 * loading while connecting, an error panel with a retry that re-subscribes, and
 * the live chip once a verdict exists.
 */
const NotificationsPage = () => {
  const {
    language,
    isMuted,
    toggleMute,
    isLive,
    connectionState,
    source,
    setSource,
  } = useInsole();

  const [supported] = useState(detectSupport);
  const [permission, setPermission] = useState(readPermission);
  const [vibrationEnabled, setVibrationEnabled] =
    useState(readStoredVibration);
  const [saved, setSaved] = useState(false);

  const soundEnabled = !isMuted;

  const handleRequestPermission = async () => {
    if (!supported) return;
    try {
      const result = await window.Notification.requestPermission();
      setPermission(
        result === "granted" || result === "denied" ? result : "default"
      );
    } catch {
      // A rejected request leaves the browser as the authority; re-read it
      // rather than assuming an outcome.
      setPermission(readPermission());
    }
  };

  const handleVibrationChange = (next) => {
    setVibrationEnabled(next);
    setSaved(false);
    try {
      localStorage.setItem("vibrationEnabled", String(next));
    } catch {
      /* private mode: the toggle still works for this session */
    }
  };

  const handleSoundChange = () => {
    setSaved(false);
    toggleMute();
  };

  const connectionDetailKey =
    connectionState === "connecting"
      ? "source.connecting"
      : connectionState === "error"
        ? "source.error"
        : source === "FIREBASE"
          ? "source.firebase"
          : "source.simulator";

  const SourceIcon = source === "FIREBASE" ? Radio : FlaskConical;

  return (
    <section className="mx-auto w-full max-w-3xl space-y-5 lg:space-y-6">
      <PageHeader
        title={t("notifications.title", language)}
        subtitle={t("notifications.subtitle", language)}
      />

      <GlassCard flush>
        <PanelHeader
          title={t("notifications.permission", language)}
          icon={<Bell className="h-4 w-4" />}
        />

        <div className="px-6 pb-6">
          <p className="text-body-sm text-muted">
            {t("notifications.permissionBody", language)}
          </p>

          {!supported ? (
            <StatusBanner
              tone="warning"
              className="mt-4"
              title={t("notifications.unsupported", language)}
            />
          ) : (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <StatusChip
                size="lg"
                level={PERMISSION_META[permission].level}
                label={t(PERMISSION_META[permission].key, language)}
              />
              <GlassButton
                type="button"
                variant="outline"
                onClick={handleRequestPermission}
                disabled={permission === "granted" || permission === "denied"}
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
                {t("notifications.request", language)}
              </GlassButton>
            </div>
          )}
        </div>
      </GlassCard>

      <GlassCard flush>
        <PanelHeader
          title={t("settings.notifications", language)}
          icon={soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        />

        <div className="space-y-5 px-6 pb-6">
          <PreferenceRow
            id="alarm-sound"
            icon={soundEnabled ? Volume2 : VolumeX}
            title={t("settings.sound", language)}
            body={t("settings.soundBody", language)}
            checked={soundEnabled}
            onChange={handleSoundChange}
            language={language}
          />
          <PreferenceRow
            id="vibration"
            icon={Vibrate}
            title={t("settings.vibration", language)}
            body={t("settings.vibrationBody", language)}
            checked={vibrationEnabled}
            onChange={handleVibrationChange}
            language={language}
          />
        </div>
      </GlassCard>

      <GlassCard flush>
        <PanelHeader
          title={t("notifications.connection", language)}
          icon={<SourceIcon className="h-4 w-4" />}
        />

        <div className="px-6 pb-6">
          {connectionState === "connecting" ? (
            <StatePanel
              variant="loading"
              title={t("source.connecting", language)}
            />
          ) : connectionState === "error" ? (
            <StatePanel
              variant="error"
              title={t("source.errorTitle", language)}
              description={t("source.errorBody", language)}
              action={
                <StateRetry
                  onRetry={() => setSource("FIREBASE")}
                  label={t("common.retry", language)}
                />
              }
            />
          ) : (
            <>
              <StatusChip
                size="lg"
                level={isLive ? "safe" : "warning"}
                label={
                  isLive
                    ? t("notifications.connected", language)
                    : t("notifications.disconnected", language)
                }
              />
              <p className="mt-3 flex items-center gap-2 text-body-sm text-muted">
                <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
                {t(connectionDetailKey, language)}
              </p>
            </>
          )}
        </div>
      </GlassCard>

      <GlassCard>
        {saved && (
          <StatusBanner
            tone="success"
            className="mb-4"
            title={t("notifications.saved", language)}
            onDismiss={() => setSaved(false)}
            dismissLabel={t("common.dismiss", language)}
          />
        )}
        <div className="flex justify-end">
          <GlassButton
            type="button"
            variant="filled"
            onClick={() => setSaved(true)}
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {t("notifications.save", language)}
          </GlassButton>
        </div>
      </GlassCard>
    </section>
  );
};

export default NotificationsPage;
