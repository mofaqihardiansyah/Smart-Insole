import React from "react";
import type { ReactNode } from "react";
import { Chip } from "../ui/Chip";
import { StatusChip } from "../ui/StatusChip";
import { t } from "../../utils/i18n";
import { EXAMPLE_READINGS, STEPS, ZONE_ROWS } from "./landingData";

/**
 * The "Cara kerja" steps: three rows, each pairing the step's own sentence with
 * a band that shows what the app actually renders at that point — the sensor
 * table, the three risk levels, the alarm — in the app's own vocabulary rather
 * than a decorative glyph in an empty panel.
 *
 * The vignettes used to be three conditionals inside the page's `.map`. They
 * are three small components now, so the step loop reads as a list of steps.
 */

/** What the reader sees while the sensors read: the three pressure points. */
const ZonesVignette = ({ language }: { language?: string }) => (
  <div className="w-full max-w-xs text-left">
    <p className="text-caption text-warm-caption">
      {t("landing.sensors.title", language)}
    </p>
    <div className="mt-1 divide-y divide-warm-line border-y border-warm-line">
      {ZONE_ROWS.map(({ key, label }) => (
        <div
          key={key}
          className="flex items-baseline justify-between gap-3 py-3"
        >
          <span className="text-body text-warm-body">{t(label, language)}</span>
          <span className="font-heading text-stat tabular-data text-warm-ink">
            {EXAMPLE_READINGS[key]}
            <span className="ml-1 text-caption font-normal text-warm-caption">
              {t("metrics.unit.kpa", language)}
            </span>
          </span>
        </div>
      ))}
    </div>
    <p className="mt-3 text-caption text-warm-caption">
      {t("landing.step.demoNote", language)}
    </p>
  </div>
);

/** What the model answers: one of three levels, not a bare score. */
const LevelsVignette = ({ language }: { language?: string }) => (
  <div className="flex flex-col items-center gap-4 text-center">
    <p className="text-caption text-warm-caption">
      {t("landing.risk.title", language)}
    </p>
    <div className="flex flex-wrap items-center justify-center gap-2">
      <StatusChip level="safe" label={t("risk.safe", language)} size="lg" />
      <StatusChip
        level="warning"
        label={t("risk.warning", language)}
        size="lg"
      />
      <StatusChip level="danger" label={t("risk.danger", language)} size="lg" />
    </div>
    <p className="text-caption text-warm-caption">
      {t("landing.step.demoNote", language)}
    </p>
  </div>
);

/** What happens when the level rises: the device's own alarm. */
const AlarmVignette = ({
  language,
  icon,
}: {
  language?: string;
  icon: ReactNode;
}) => (
  <div className="flex flex-col items-center gap-4 text-center">
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Chip tone="danger" aria-hidden="true" className="px-3 py-2">
        {icon}
      </Chip>
      <StatusChip
        level="warning"
        label={t("risk.warning", language)}
        size="lg"
      />
      <StatusChip level="danger" label={t("risk.danger", language)} size="lg" />
    </div>
    <p className="text-caption text-warm-caption">
      {t("landing.step.demoNote", language)}
    </p>
  </div>
);

export const HowItWorks = ({ language }: { language?: string }) => (
  <div className="mt-10 space-y-6">
    {STEPS.map(({ icon: Icon, title, body, vignette }, index) => (
      <div
        key={title}
        data-reveal
        className="grid overflow-hidden rounded-cell border border-warm-line bg-warm-card shadow-card lg:grid-cols-5"
      >
        <div className="p-6 sm:p-8 lg:col-span-3">
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-warm-line bg-warm-raised px-3 py-1.5 text-caption text-warm-body">
            {t("landing.step.number", language)}{" "}
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3 className="mt-4 text-h2 font-semibold text-warm-ink">
            {t(title, language)}
          </h3>
          <p className="mt-4 max-w-prose text-body leading-relaxed text-warm-body">
            {t(body, language)}
          </p>
        </div>
        {/* The band beside every step shows what the app renders at that step,
            in the app's own vocabulary — not a lone decorative icon adrift in
            an empty panel. */}
        <div className="relative flex min-h-[220px] items-center justify-center bg-warm-raised p-6 sm:p-8 lg:col-span-2">
          {vignette === "zones" && <ZonesVignette language={language} />}
          {vignette === "levels" && <LevelsVignette language={language} />}
          {vignette === "alarm" && (
            <AlarmVignette
              language={language}
              icon={<Icon className="h-5 w-5" />}
            />
          )}
        </div>
      </div>
    ))}
  </div>
);

export default HowItWorks;
