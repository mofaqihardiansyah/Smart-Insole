import React, { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { StatusChip } from "../ui/StatusChip";
import { inferRisk } from "../../utils/randomForestRisk";
import { t } from "../../utils/i18n";

/**
 * RiskExplorer: the landing's one interactive technical surface.
 *
 * It runs the same `inferRisk` module the dashboard runs, so the numbers a
 * visitor produces here are the numbers the product would produce. The two
 * inputs are the model's two features, which makes the section honest: a
 * marketing page that claims a Random Forest but shows a static badge teaches
 * nothing.
 *
 * Everything is local state. No network, no sensor, no stored reading.
 */

const LEVEL_COPY = {
  safe: "landing.tech.sim.whySafe",
  warning: "landing.tech.sim.whyWarning",
  danger: "landing.tech.sim.whyDanger",
};

const PRESETS = [
  {
    key: "walk",
    label: "landing.tech.sim.presetWalk",
    pressure: 28,
    duration: 0.5,
  },
  {
    key: "stand",
    label: "landing.tech.sim.presetStand",
    pressure: 40,
    duration: 12,
  },
  {
    key: "high",
    label: "landing.tech.sim.presetHigh",
    pressure: 78,
    duration: 2,
  },
];

const formatNumber = (value: number, language: string | undefined, digits = 0) =>
  Number(value).toLocaleString(language === "id" ? "id-ID" : "en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const RiskExplorer = ({ language }: { language?: string }) => {
  const [pressure, setPressure] = useState(40);
  const [duration, setDuration] = useState(12);

  const { level, score } = useMemo(
    () =>
      inferRisk({
        peakPressure: pressure,
        sustainedDuration: duration,
      }),
    [pressure, duration]
  );

  const levelLabel = t(`risk.${level}`, language);

  return (
    <div className="rounded-section border border-warm-line bg-warm-raised p-5 shadow-card sm:p-6">
      <div className="flex items-center gap-2">
        <SlidersHorizontal
          className="h-5 w-5 shrink-0 text-warm-accent-deep"
          aria-hidden="true"
        />
        <h4 className="font-heading text-h4 font-semibold text-warm-ink">
          {t("landing.tech.sim.title", language)}
        </h4>
      </div>
      <p className="mt-1.5 text-body-sm leading-relaxed text-warm-body">
        {t("landing.tech.sim.body", language)}
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label
              htmlFor="risk-pressure"
              className="text-body-sm font-medium text-warm-ink"
            >
              {t("landing.tech.sim.pressure", language)}
            </label>
            <span className="tabular-data text-body-sm font-semibold text-warm-ink">
              {formatNumber(pressure, language)}
              <span className="ml-1 font-normal text-warm-caption">
                {t("metrics.unit.kpa", language)}
              </span>
            </span>
          </div>
          <input
            id="risk-pressure"
            type="range"
            min={0}
            max={100}
            step={1}
            value={pressure}
            onChange={(event) => setPressure(Number(event.target.value))}
            aria-valuetext={`${formatNumber(pressure, language)} ${t(
              "metrics.unit.kpa",
              language
            )}`}
            className="mt-1 h-11 w-full cursor-pointer accent-warm-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-warm-raised"
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label
              htmlFor="risk-duration"
              className="text-body-sm font-medium text-warm-ink"
            >
              {t("landing.tech.sim.duration", language)}
            </label>
            <span className="tabular-data text-body-sm font-semibold text-warm-ink">
              {formatNumber(duration, language, duration % 1 ? 1 : 0)}
              <span className="ml-1 font-normal text-warm-caption">
                {t("metrics.unit.seconds", language)}
              </span>
            </span>
          </div>
          <input
            id="risk-duration"
            type="range"
            min={0}
            max={30}
            step={0.5}
            value={duration}
            onChange={(event) => setDuration(Number(event.target.value))}
            aria-valuetext={`${formatNumber(duration, language)} ${t(
              "metrics.unit.seconds",
              language
            )}`}
            className="mt-1 h-11 w-full cursor-pointer accent-warm-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-warm-raised"
          />
        </div>
      </div>

      <div className="mt-4 rounded-cell border border-warm-line bg-warm-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-caption text-warm-caption">
              {t("landing.tech.sim.result", language)}
            </p>
            {/* The level is the part worth announcing. The score sits outside
                the region so a drag does not read a new number each step. */}
            <div
              className="mt-1.5"
              aria-live="polite"
              aria-atomic="true"
            >
              <StatusChip level={level} label={levelLabel} size="lg" />
            </div>
          </div>
          <div className="text-right">
            <p className="text-caption text-warm-caption">
              {t("landing.tech.sim.score", language)}
            </p>
            <p className="font-heading text-stat tabular-data text-warm-ink">
              {score}
              <span className="ml-1 text-body-sm font-normal text-warm-caption">
                / 100
              </span>
            </p>
          </div>
        </div>
        <p className="mt-3 border-t border-warm-line pt-3 text-body-sm leading-relaxed text-warm-body">
          {t(LEVEL_COPY[level], language)}
        </p>
      </div>

      <div className="mt-4">
        <p className="text-caption text-warm-caption">
          {t("landing.tech.sim.preset", language)}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => {
                setPressure(preset.pressure);
                setDuration(preset.duration);
              }}
              className="min-h-[44px] rounded-tile border border-warm-line bg-warm-card px-3 py-2 text-body-sm font-medium text-warm-body transition-colors duration-150 hover:bg-warm-raised hover:text-warm-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-warm-raised"
            >
              {t(preset.label, language)}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-caption leading-relaxed text-warm-caption">
        {t("landing.tech.sim.disclaimer", language)}
      </p>
    </div>
  );
};

export default RiskExplorer;
