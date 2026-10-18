import React, { useCallback } from "react";
import { BatteryLow, RefreshCw, Wifi, WifiOff } from "lucide-react";
import {
  GlassButton,
  GlassCard,
  PanelHeader,
  PageHeader,
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
 *
 * Composition follows the dashboard vocabulary: a PageHeader with the one
 * standing action, then panels that each open with a PanelHeader naming the
 * panel and its source, with the data below. The connection state lives in one
 * panel together with the facts behind it, because the two answer the same
 * question ("is the insole reporting, and from where").
 */

const FactRow = ({ label, children }) => (
  <div className="py-3 first:pt-0 last:pb-0">
    <dt className="text-body-sm text-muted">{label}</dt>
    <dd className="mt-1 text-body-sm font-medium text-fg">{children}</dd>
  </div>
);

const DevicePage = () => {
  const { connectionState, isLive, source, reconnect, batteryPercent, language } =
    useInsole();

  const connecting = connectionState === "connecting";
  const errored = connectionState === "error";
  const batteryKnown = Number.isFinite(batteryPercent);
  const batteryLow = batteryKnown && batteryPercent < 20;
  const unavailable = t("device.unavailable", language);

  const handleReconnect = useCallback(() => reconnect(), [reconnect]);

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
    <section className="mx-auto w-full max-w-3xl space-y-5 lg:space-y-6">
      <PageHeader
        title={t("device.title", language)}
        subtitle={t("device.subtitle", language)}
        actions={
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
        }
      />

      <GlassCard flush>
        <PanelHeader
          title={t("device.status", language)}
          subtitle={sourceLabel}
          action={
            <StatusChip
              level={connectionChip.level}
              label={connectionChip.label}
              size="sm"
            />
          }
        />

        <div className="px-6 pb-6">
          <div className="flex flex-wrap items-center gap-3" aria-live="polite">
            {isLive ? (
              <Wifi className="h-5 w-5 shrink-0 text-safe" aria-hidden="true" />
            ) : (
              <WifiOff
                className="h-5 w-5 shrink-0 text-muted"
                aria-hidden="true"
              />
            )}
            <span className="text-body-base font-semibold text-fg">
              {isLive
                ? t("device.online", language)
                : t("device.offline", language)}
            </span>
          </div>

          {!isLive && (
            <StatusBanner tone="info" className="mt-4">
              {t("device.simulatedNote", language)}
            </StatusBanner>
          )}

          <div className="mt-5">
            {connecting ? (
              <StatePanel
                variant="loading"
                title={t("device.loading", language)}
              />
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
                    className="mb-4"
                    title={t("source.noDeviceTitle", language)}
                    description={t("source.noDeviceBody", language)}
                    nextAction={t("source.noDeviceNext", language)}
                  />
                )}

                <dl className="divide-y divide-border-strong">
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
                            className="h-2 w-full overflow-hidden rounded-full bg-surface-3"
                          >
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{
                                width: `${Math.min(100, Math.max(0, batteryPercent))}%`,
                              }}
                            />
                          </div>
                          <span className="tabular-kpa text-body-sm font-medium text-fg">
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
                </dl>
              </>
            )}
          </div>
        </div>
      </GlassCard>

      <GlassCard flush>
        <PanelHeader title={t("device.tips", language)} />

        <div className="px-6 pb-6">
          <ul className="list-disc space-y-2 pl-5 text-body-sm text-muted">
            <li>{t("device.tip1", language)}</li>
            <li>{t("device.tip2", language)}</li>
            <li>{t("device.tip3", language)}</li>
          </ul>
        </div>
      </GlassCard>
    </section>
  );
};

export default DevicePage;
