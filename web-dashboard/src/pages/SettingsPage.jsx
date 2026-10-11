import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RotateCcw, Save, Vibrate, Volume2, VolumeX } from "lucide-react";
import {
  GlassButton,
  GlassCard,
  GlassInput,
  GlassSwitch,
  GlassTable,
  GlassTableRow,
  GlassTableCell,
  StatusBanner,
  StatusChip,
  StatePanel,
  StateRetry,
} from "../components/ui/GlassComponents";
import { useInsole } from "../context/InsoleContext";
import { inferRisk } from "../utils/fuzzyRisk";
import { t } from "../utils/i18n";

/**
 * SettingsPage, the thresholds and the alarm preferences.
 *
 * The four threshold fields are the values the fuzzy engine actually runs on:
 * setThresholds() writes them straight into InsoleContext, so a save changes
 * the risk level on the dashboard without a reload. The preview table below
 * runs the same inferRisk() against the active thresholds, which lets a
 * clinician see the effect of an edit before trusting it.
 */

const FIELDS = [
  {
    key: "warningKpa",
    labelKey: "settings.warningKpa",
    min: 1,
    max: 200,
    step: 1,
  },
  {
    key: "dangerKpa",
    labelKey: "settings.dangerKpa",
    min: 2,
    max: 400,
    step: 1,
  },
  {
    key: "warningSeconds",
    labelKey: "settings.warningSeconds",
    min: 1,
    max: 120,
    step: 1,
  },
  {
    key: "dangerSeconds",
    labelKey: "settings.dangerSeconds",
    min: 2,
    max: 300,
    step: 1,
  },
];

/** A spread of pressure and duration pairs that reaches each consequence. */
const PREVIEW_INPUTS = [
  { peakPressure: 20, sustainedDuration: 5 },
  { peakPressure: 40, sustainedDuration: 5 },
  { peakPressure: 40, sustainedDuration: 25 },
  { peakPressure: 75, sustainedDuration: 10 },
  { peakPressure: 75, sustainedDuration: 35 },
];

const toDraft = (source) => ({
  warningKpa: String(source.warningKpa),
  dangerKpa: String(source.dangerKpa),
  warningSeconds: String(source.warningSeconds),
  dangerSeconds: String(source.dangerSeconds),
});

const readStoredVibration = () => {
  try {
    return localStorage.getItem("vibrationEnabled") === "true";
  } catch {
    return false;
  }
};

const PreferenceRow = ({
  id,
  icon: Icon,
  title,
  body,
  checked,
  onChange,
}) => (
  <div className="flex items-start justify-between gap-4">
    <div className="min-w-0">
      <p className="flex items-center gap-2 text-sm font-medium text-fg">
        <Icon className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
        {title}
      </p>
      <p className="mt-0.5 text-xs text-muted">{body}</p>
      <p className="mt-1 text-xs text-muted">
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
    setThresholds,
    resetThresholds,
    isMuted,
    toggleMute,
    language,
  } = useInsole();

  const [draft, setDraft] = useState(() => toDraft(thresholds));
  const [saveState, setSaveState] = useState(null);
  const [vibrationEnabled, setVibrationEnabled] = useState(
    readStoredVibration
  );
  const [previewNonce, setPreviewNonce] = useState(0);

  // A save or a reset replaces the active thresholds; the form follows them.
  useEffect(() => {
    setDraft(toDraft(thresholds));
  }, [thresholds]);

  const parsed = useMemo(
    () => ({
      warningKpa: Number(draft.warningKpa),
      dangerKpa: Number(draft.dangerKpa),
      warningSeconds: Number(draft.warningSeconds),
      dangerSeconds: Number(draft.dangerSeconds),
    }),
    [draft]
  );

  const allPositive = Object.values(parsed).every(
    (value) => Number.isFinite(value) && value > 0
  );
  const invalid =
    !allPositive ||
    parsed.dangerKpa <= parsed.warningKpa ||
    parsed.dangerSeconds <= parsed.warningSeconds;

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

  const handleSave = useCallback(() => {
    if (invalid) return;
    setThresholds(parsed);
    setSaveState("saved");
  }, [invalid, parsed, setThresholds]);

  const handleReset = useCallback(() => {
    resetThresholds();
    setSaveState("reset");
  }, [resetThresholds]);

  const handleVibrationChange = useCallback((next) => {
    setVibrationEnabled(next);
    try {
      localStorage.setItem("vibrationEnabled", String(next));
    } catch {
      /* private mode: the toggle still works for this session */
    }
  }, []);

  const soundEnabled = !isMuted;

  const unitKpa = t("metrics.unit.kpa", language);
  const unitSeconds = t("metrics.unit.seconds", language);

  return (
    <section className="mx-auto w-full max-w-3xl space-y-5">
      <header>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-fg md:text-3xl">
          {t("settings.title", language)}
        </h1>
        <p className="mt-1 max-w-prose text-sm text-muted">
          {t("settings.subtitle", language)}
        </p>
      </header>

      <GlassCard className="p-5 md:p-6">
        <h2 className="font-heading text-base font-semibold text-fg">
          {t("settings.thresholds", language)}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {t("settings.thresholdsBody", language)}
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <GlassInput
              key={field.key}
              id={`threshold-${field.key}`}
              type="number"
              inputMode="numeric"
              min={field.min}
              max={field.max}
              step={field.step}
              label={t(field.labelKey, language)}
              value={draft[field.key]}
              onChange={(event) => {
                setSaveState(null);
                setDraft((prev) => ({
                  ...prev,
                  [field.key]: event.target.value,
                }));
              }}
            />
          ))}
        </div>

        {invalid && (
          <StatusBanner
            tone="danger"
            className="mt-4"
            title={t("settings.invalidOrder", language)}
          />
        )}

        {saveState === "saved" && (
          <StatusBanner
            tone="success"
            className="mt-4"
            title={t("settings.saved", language)}
            onDismiss={() => setSaveState(null)}
            dismissLabel={t("common.dismiss", language)}
          />
        )}

        {saveState === "reset" && (
          <StatusBanner
            tone="success"
            className="mt-4"
            title={t("settings.resetDone", language)}
            onDismiss={() => setSaveState(null)}
            dismissLabel={t("common.dismiss", language)}
          />
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <GlassButton
            type="button"
            variant="filled"
            onClick={handleSave}
            disabled={invalid}
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {t("settings.save", language)}
          </GlassButton>
          <GlassButton type="button" variant="quiet" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {t("settings.reset", language)}
          </GlassButton>
        </div>
      </GlassCard>

      <GlassCard className="p-5 md:p-6">
        <h2 className="font-heading text-base font-semibold text-fg">
          {t("settings.preview", language)}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {t("settings.previewBody", language)}
        </p>

        <div className="mt-4">
          {previewResult.failed ? (
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
          ) : previewResult.rows.length === 0 ? (
            <StatePanel
              variant="empty"
              title={t("settings.preview", language)}
              description={t("settings.previewBody", language)}
            />
          ) : (
            <>
              <div className="hidden md:block">
                <GlassTable aria-label={t("settings.preview", language)}>
                  <GlassTableRow>
                    <GlassTableCell as="th" scope="col">
                      <span className="text-sm font-semibold text-muted">
                        {t("metrics.peakPressure", language)}
                      </span>
                    </GlassTableCell>
                    <GlassTableCell as="th" scope="col">
                      <span className="text-sm font-semibold text-muted">
                        {t("metrics.sustainedDuration", language)}
                      </span>
                    </GlassTableCell>
                    <GlassTableCell as="th" scope="col">
                      <span className="text-sm font-semibold text-muted">
                        {t("risk.status", language)}
                      </span>
                    </GlassTableCell>
                    <GlassTableCell as="th" scope="col">
                      <span className="text-sm font-semibold text-muted">
                        {t("risk.score", language)}
                      </span>
                    </GlassTableCell>
                  </GlassTableRow>

                  {previewResult.rows.map((row) => (
                    <GlassTableRow
                      key={`${row.peakPressure}-${row.sustainedDuration}`}
                    >
                      <GlassTableCell>
                        <span className="tabular-kpa">
                          {`${row.peakPressure} ${unitKpa}`}
                        </span>
                      </GlassTableCell>
                      <GlassTableCell>
                        <span className="tabular-kpa">
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
                        <span className="tabular-kpa">{row.score}</span>
                      </GlassTableCell>
                    </GlassTableRow>
                  ))}
                </GlassTable>
              </div>

              <ul className="space-y-2 md:hidden">
                {previewResult.rows.map((row) => (
                  <li
                    key={`${row.peakPressure}-${row.sustainedDuration}`}
                    className="rounded-card border border-border bg-card p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="tabular-kpa text-sm font-medium text-fg">
                        {`${row.peakPressure} ${unitKpa} / ${row.sustainedDuration} ${unitSeconds}`}
                      </span>
                      <StatusChip
                        level={row.level}
                        label={t(`risk.${row.level}`, language)}
                        size="sm"
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {`${t("risk.score", language)}: ${row.score}`}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </GlassCard>

      <GlassCard className="p-5 md:p-6">
        <h2 className="font-heading text-base font-semibold text-fg">
          {t("settings.notifications", language)}
        </h2>

        <div className="mt-4 space-y-5">
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
