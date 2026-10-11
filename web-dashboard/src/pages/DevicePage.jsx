import React, { useCallback } from "react";
import { BatteryLow, RefreshCw, Wifi, WifiOff } from "lucide-react";
import {
  GlassButton,
  GlassCard,
  StatusBanner,
  StatusChip,
  StatePanel,
  StateRetry,
} from "../components/ui/GlassComponents";
import { useInsole } from "../context/InsoleContext";
import { t } from "../utils/i18n";

/**
 * DevicePage, the honest device status.
 *
 * Every value here is read from InsoleContext. The previous version invented a
 * firmware string and faked both the battery drain and the online flag, which
 * is exactly the fabricated telemetry the design brief rules out.
 *
 * Firmware version, device ID and last seen have no source in the context, so
 * they read as unavailable rather than being filled in.
 */

const FactRow = ({ label, children }) => (
  <div className="py-3 first:pt-0 last:pb-0">
    <dt className="text-sm text-muted">{label}</dt>
    <dd className="mt-1 text-sm font-medium text-fg">{children}</dd>
  </div>
);

const DevicePage = () => {
  const { connectionState, isLive, source, setSource, batteryPercent, language } =
    useInsole();

  const connecting = connectionState === "connecting";
  const errored = connectionState === "error";
  const batteryKnown = Number.isFinite(batteryPercent);
  const batteryLow = batteryKnown && batteryPercent < 20;
  const unavailable = t("device.unavailable", language);

  const handleReconnect = useCallback(() => setSource("FIREBASE"), [setSource]);

  const connectionChip = connecting
    ? { level: "warning", label: t("source.connecting", language) }
    : errored
      ? { level: "danger", label: t("source.error", language) }
      : isLive
        ? { level: "safe", label: t("source.live", language) }
        : { level: "warning", label: t("source.simulator", language) };

  const sourceLabel =
    source === "FIREBASE"
      ? t("source.firebase", language)
      : t("source.simulator", language);

  return (
    <section className="mx-auto w-full max-w-3xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-fg md:text-3xl">
            {t("device.title", language)}
          </h1>
          <p className="mt-1 max-w-prose text-sm text-muted">
            {t("device.subtitle", language)}
          </p>
        </div>

        <GlassButton
          type="button"
          variant="filled"
          onClick={handleReconnect}
          aria-busy={connecting}
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {connecting
            ? t("device.reconnecting", language)
            : t("device.reconnect", language)}
        </GlassButton>
      </header>

      <GlassCard className="p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-3" aria-live="polite">
          {isLive ? (
            <Wifi className="h-5 w-5 shrink-0 text-safe" aria-hidden="true" />
          ) : (
            <WifiOff className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
          )}
          <span className="text-sm font-semibold text-fg">
            {isLive
              ? t("device.online", language)
              : t("device.offline", language)}
          </span>
          <StatusChip
            level={connectionChip.level}
            label={connectionChip.label}
            size="sm"
          />
        </div>

        {!isLive && (
          <StatusBanner tone="info" className="mt-4">
            {t("device.simulatedNote", language)}
          </StatusBanner>
        )}
      </GlassCard>

      {connecting ? (
        <StatePanel variant="loading" title={t("device.loading", language)} />
      ) : errored ? (
        <StatePanel
          variant="error"
          title={t("device.errorTitle", language)}
          description={t("source.errorBody", language)}
          action={
            <StateRetry
              onRetry={handleReconnect}
              label={t("common.retry", language)}
            />
          }
        />
      ) : (
        <>
          {connectionState === "simulated" && (
            <StatePanel
              variant="empty"
              title={t("source.noDeviceTitle", language)}
              description={t("source.noDeviceBody", language)}
            />
          )}

          <GlassCard className="p-5 md:p-6">
            <dl className="divide-y divide-border-divider">
              <FactRow label={t("device.battery", language)}>
                {batteryKnown ? (
                  <div className="w-full max-w-sm">
                    <div className="flex items-center gap-2">
                      <div
                        role="progressbar"
                        aria-label={t("device.battery", language)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(batteryPercent)}
                        className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken"
                      >
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${Math.min(100, Math.max(0, batteryPercent))}%`,
                          }}
                        />
                      </div>
                      <span className="tabular-kpa text-sm font-medium text-fg">
                        {`${Math.round(batteryPercent)}${t("metrics.unit.percent", language)}`}
                      </span>
                    </div>

                    {batteryLow && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <BatteryLow
                          className="h-4 w-4 shrink-0 text-warning"
                          aria-hidden="true"
                        />
                        <StatusChip
                          level="warning"
                          label={t("device.batteryLow", language)}
                          size="sm"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  unavailable
                )}
              </FactRow>

              <FactRow label={t("device.firmware", language)}>
                {unavailable}
              </FactRow>

              <FactRow label={t("device.deviceId", language)}>
                {unavailable}
              </FactRow>

              <FactRow label={t("device.lastSeen", language)}>
                {unavailable}
              </FactRow>

              <FactRow label={t("notifications.connection", language)}>
                {sourceLabel}
              </FactRow>
            </dl>
          </GlassCard>
        </>
      )}

      <GlassCard className="p-5 md:p-6">
        <h2 className="font-heading text-base font-semibold text-fg">
          {t("device.tips", language)}
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
          <li>{t("device.tip1", language)}</li>
          <li>{t("device.tip2", language)}</li>
          <li>{t("device.tip3", language)}</li>
        </ul>
      </GlassCard>
    </section>
  );
};

export default DevicePage;
