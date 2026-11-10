import React, { useCallback, useMemo, useState } from "react";
import {
  Info,
  Radio,
  Vibrate,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  GlassCard,
  GlassSwitch,
  GlassTable,
  GlassTableRow,
  GlassTableCell,
  PanelHeader,
  PageHeader,
  StatusChip,
  StatePanel,
  StateRetry,
} from "../components/ui/GlassComponents";
import { useInsole } from "../context/InsoleContext";
import { DURATION_WINDOWS, inferRisk } from "../utils/randomForestRisk";
import { t } from "../utils/i18n";
import type { LucideIcon } from "lucide-react";

/**
 * SettingsPage, the active thresholds and the alarm preferences.
 *
 * The thresholds are clinical constants: `RISK_THRESHOLDS` in the engine and
 * the same numbers compiled into the firmware. There is no editor here, and
 * nothing on this page writes them — a dashboard that could move the boundary
 * without reflashing the device would disagree with the device that measured
 * the foot. The preview table runs the real `inferRisk()` against those
 * constants, so a reader can see where each band starts.
 *
 * Every panel opens with a PanelHeader, the same structural layer the dashboard
 * uses. The preview renders a real table from `md` up, wrapped in thead/tbody,
 * and the same rows as stacked definitions below that, because a table cannot
 * reflow onto a phone.
 */

/** A spread of pressure and duration pairs that reaches each consequence. */
const PREVIEW_INPUTS = [
  { peakPressure: 20, sustainedDuration: 5 },
  { peakPressure: 40, sustainedDuration: 5 },
  { peakPressure: 40, sustainedDuration: 25 },
  { peakPressure: 210, sustainedDuration: 10 },
  { peakPressure: 210, sustainedDuration: 35 },
];

const readStoredVibration = () => {
  try {
    return localStorage.getItem("vibrationEnabled") === "true";
  } catch {
    return false;
  }
};

/** One toggle row in the alarm preferences panel. */
interface PreferenceRowProps {
  id: string;
  icon: LucideIcon;
  title: string;
  body: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}

const PreferenceRow = ({
  id,
  icon: Icon,
  title,
  body,
  checked,
  onChange,
}: PreferenceRowProps) => (
  <div className="flex items-start justify-between gap-4">
    <div className="min-w-0">
      <p className="flex items-center gap-2 text-body-sm font-medium text-fg">
        <Icon className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
        {title}
      </p>
      <p className="mt-0.5 max-w-prose text-caption text-muted">{body}</p>
      <p className="mt-1 text-caption text-muted">
        {checked ? t("settings.on") : t("settings.off")}
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

const SettingsPage = () => {
  const {
    thresholds,
    isMuted,
    toggleMute,
    language,
    isLive,
    connectionState,
    reconnect,
  } = useInsole();

  const [vibrationEnabled, setVibrationEnabled] = useState(
    readStoredVibration
  );
  const [previewNonce, setPreviewNonce] = useState(0);

  const previewResult = useMemo(() => {
    try {
      return {
        failed: false,
        rows: PREVIEW_INPUTS.map((input) => ({
          ...input,
          ...inferRisk({ ...input, thresholds }),
        })),
      };
    } catch {
      return { failed: true, rows: [] };
    }
  }, [thresholds, previewNonce]);

  const handleVibrationChange = useCallback((next: boolean) => {
    setVibrationEnabled(next);
    try {
      localStorage.setItem("vibrationEnabled", String(next));
    } catch {
      /* private mode: the toggle still works for this session */
    }
  }, []);

  const soundEnabled = !isMuted;

  const connectionDetailKey =
    connectionState === "connecting"
      ? "source.connecting"
      : connectionState === "error"
        ? "source.error"
        : "source.firebase";

  const unitKpa = t("metrics.unit.kpa", language);
  const unitSeconds = t("metrics.unit.seconds", language);

  return (
    <section className="space-y-5 lg:space-y-6">
      <PageHeader
        title={t("settings.title", language)}
        subtitle={t("settings.subtitle", language)}
      />

      <GlassCard flush>
        <PanelHeader
          title={t("settings.thresholds", language)}
          subtitle={t("settings.thresholdsBody", language)}
        />

        <div className="px-6 pb-6">
          <dl className="grid grid-cols-1 gap-4 sm:auto-rows-fr sm:grid-cols-3">
            <div className="flex flex-col">
              <dt className="text-label uppercase text-fg-2">
                {t("settings.warningKpa", language)}
              </dt>
              <dd className="mt-auto pt-1 tabular-data text-stat text-fg">
                {thresholds.warningKpa}
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-label uppercase text-fg-2">
                {t("settings.dangerKpa", language)}
              </dt>
              <dd className="mt-auto pt-1 tabular-data text-stat text-fg">
                {thresholds.dangerKpa}
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-label uppercase text-fg-2">
                {t("settings.warningSeconds", language)}
              </dt>
              <dd className="mt-auto pt-1 tabular-data text-stat text-fg">
                {DURATION_WINDOWS.sustainedWarningSeconds}
              </dd>
            </div>
          </dl>
          <p className="mt-4 max-w-prose text-body-sm text-muted">
            {t("settings.thresholdsDeviceNote", language)}
          </p>
        </div>
      </GlassCard>

      <GlassCard flush>
        <PanelHeader
          title={t("settings.preview", language)}
          subtitle={t("settings.previewBody", language)}
        />

        {previewResult.failed ? (
          <div className="px-6 pb-6">
            <StatePanel
              variant="error"
              title={t("settings.preview", language)}
              action={
                <StateRetry
                  onRetry={() => setPreviewNonce((value) => value + 1)}
                  label={t("common.retry", language)}
                />
              }
            />
          </div>
        ) : previewResult.rows.length === 0 ? (
          <div className="px-6 pb-6">
            <StatePanel
              variant="empty"
              title={t("settings.preview", language)}
              description={t("settings.previewBody", language)}
              nextAction={t("settings.previewNext", language)}
            />
          </div>
        ) : (
          <>
            <div className="hidden border-t border-border md:block">
              <GlassTable bare aria-label={t("settings.preview", language)}>
                <thead>
                  <GlassTableRow>
                    <GlassTableCell as="th" scope="col">
                      {t("metrics.peakPressure", language)}
                    </GlassTableCell>
                    <GlassTableCell as="th" scope="col">
                      {t("metrics.sustainedDuration", language)}
                    </GlassTableCell>
                    <GlassTableCell as="th" scope="col">
                      {t("risk.status", language)}
                    </GlassTableCell>
                    <GlassTableCell as="th" scope="col">
                      {t("risk.score", language)}
                    </GlassTableCell>
                  </GlassTableRow>
                </thead>
                <tbody>
                  {previewResult.rows.map((row) => (
                    <GlassTableRow
                      key={`${row.peakPressure}-${row.sustainedDuration}`}
                    >
                      <GlassTableCell>
                        <span className="tabular-data">
                          {`${row.peakPressure} ${unitKpa}`}
                        </span>
                      </GlassTableCell>
                      <GlassTableCell>
                        <span className="tabular-data">
                          {`${row.sustainedDuration} ${unitSeconds}`}
                        </span>
                      </GlassTableCell>
                      <GlassTableCell>
                        <StatusChip
                          level={row.level}
                          label={t(`risk.${row.level}`, language)}
                          size="sm"
                        />
                      </GlassTableCell>
                      <GlassTableCell>
                        <span className="tabular-data">{row.score}</span>
                      </GlassTableCell>
                    </GlassTableRow>
                  ))}
                </tbody>
              </GlassTable>
            </div>

            <ul className="divide-y divide-border-strong border-t border-border md:hidden">
              {previewResult.rows.map((row) => (
                <li
                  key={`${row.peakPressure}-${row.sustainedDuration}`}
                  className="p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="tabular-data text-body-sm font-medium text-fg">
                      {`${row.peakPressure} ${unitKpa} / ${row.sustainedDuration} ${unitSeconds}`}
                    </span>
                    <StatusChip
                      level={row.level}
                      label={t(`risk.${row.level}`, language)}
                      size="sm"
                    />
                  </div>
                  <p className="mt-1 text-caption text-muted">
                    {`${t("risk.score", language)}: ${row.score}`}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </GlassCard>

      <GlassCard flush>
        <PanelHeader
          title={t("notifications.connection", language)}
          icon={<Radio className="h-4 w-4" />}
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
                  onRetry={() => reconnect()}
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
              <p className="mt-3 flex max-w-prose items-center gap-2 text-body-sm text-muted">
                <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
                {t(connectionDetailKey, language)}
              </p>
            </>
          )}
        </div>
      </GlassCard>

      <GlassCard flush>
        <PanelHeader title={t("settings.notifications", language)} />

        <div className="space-y-5 px-6 pb-6">
          <PreferenceRow
            id="settings-alarm-sound"
            icon={soundEnabled ? Volume2 : VolumeX}
            title={t("settings.sound", language)}
            body={t("settings.soundBody", language)}
            checked={soundEnabled}
            onChange={() => toggleMute()}
          />
          <PreferenceRow
            id="settings-vibration"
            icon={Vibrate}
            title={t("settings.vibration", language)}
            body={t("settings.vibrationBody", language)}
            checked={vibrationEnabled}
            onChange={handleVibrationChange}
          />
        </div>
      </GlassCard>
    </section>
  );
};

export default SettingsPage;
