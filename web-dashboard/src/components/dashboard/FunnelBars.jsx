import React from "react";
import { t } from "../../utils/i18n";

/**
 * FunnelBars — the zone-load panel, in the Cadra funnel register.
 *
 * The donut it replaces was a shape-first reading: proportions judged against
 * a circle's 360 degrees. The funnel keeps the proportions as one-decision
 * bars: each sensor point names itself, its bar is its share of the current
 * total load, and the value beside it is the actual kPa the bar is drawn
 * from. One accent, one length scale; zone identity travels through the row's
 * label text, never through a second colour code, so nothing here reaches for
 * the series palette that belongs to the real charts.
 *
 * Zero total is an empty state, not three collapsed bars: bars with no
 * readings behind them would be drawing claims about data that has not
 * arrived. The text beside each value is the accessible read, so the bar is
 * aria-hidden and the component hosts no live region.
 */
const FunnelBars = ({ zones = [], language = "id" }) => {
  const total = zones.reduce((sum, zone) => sum + Number(zone?.value || 0), 0);

  if (total <= 0) {
    return (
      <p data-funnel-empty className="pb-6 text-body-sm text-muted">
        {t("dashboard.funnel.empty", language)}
      </p>
    );
  }

  return (
    <ul className="pb-6">
      {zones.map((zone) => {
        const value = Number(zone?.value || 0);
        const share = (value / total) * 100;
        return (
          <li
            key={zone.key}
            data-funnel-row
            className="border-b border-border py-4 last:border-b-0"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-body-sm font-semibold text-fg">
                {zone.label}
              </span>
              <span className="tabular-data text-body-sm text-fg-2">
                {`${value.toFixed(1)} kPa`}
              </span>
            </div>
            <div
              className="mt-2 h-2 w-full rounded-full bg-surface-3"
              data-funnel-track
            >
              <div
                data-funnel-fill
                aria-hidden="true"
                className="h-full rounded-full bg-fg"
                style={{ width: `${share.toFixed(1)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
};

FunnelBars.displayName = "FunnelBars";

export { FunnelBars };
export default FunnelBars;
