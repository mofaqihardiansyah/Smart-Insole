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
  PanelHeader,
  PageHeader,
  StatusBanner,
  StatusChip,
  StatePanel,
  StateRetry,
} from "../components/ui/GlassComponents";
import { useInsole } from "../context/InsoleContext";
import { inferRisk } from "../utils/randomForestRisk";
import { t } from "../utils/i18n";
import type { RiskThresholds } from "../types/insole";
import type { LucideIcon } from "lucide-react";

/**
 * SettingsPage, the thresholds and the alarm preferences.
 *
 * The four threshold fields are the values the fuzzy engine actually runs on:
 * setThresholds() writes them straight into InsoleContext, so a save changes
 * the risk level on the dashboard without a reload. The preview table below
 * runs the same inferRisk() against the active thresholds, which lets a
 * clinician see the effect of an edit before trusting it.
 *
 * Every panel opens with a PanelHeader, the same structural layer the dashboard
 * uses. The preview renders a real table from `md` up, wrapped in thead/tbody,
 * and the same rows as stacked definitions below that, because a table cannot
 * reflow onto a phone.
 */

/** The threshold form as strings, ready for text inputs. */
interface ThresholdDraft {
  warningKpa: string;
  dangerKpa: string;
  warningSeconds: string;
  dangerSeconds: string;
}

/** One threshold input: the draft key it edits, and its bounds. */
interface ThresholdField {
  key: keyof ThresholdDraft;
  labelKey: string;
  min: number;
  max: number;
  step: number;
}

const FIELDS: ThresholdField[] = [
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

const toDraft = (source: RiskThresholds): ThresholdDraft => ({
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
      <p className="mt-0.5 text-caption text-muted">{body}</p>
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
    setThresholds,
    resetThresholds,
    isMuted,
    toggleMute,
    language,
  } = useInsole();

  const [draft, setDraft] = useState(() => toDraft(thresholds));
  const [saveState, setSaveState] = useState<"saved" | "reset" | null>(null);
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

  const handleVibrationChange = useCallback((next: boolean) => {
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
    <section className="mx-auto w-full max-w-3xl space-y-5 lg:space-y-6">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

          <div className="mt-5 flex flex-wrap gap-2">
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
