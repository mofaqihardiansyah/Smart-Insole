import React from "react";
import { t } from "../../utils/i18n";

/**
 * HeroTimeline — the thin event strip across the hero card.
 *
 * One dot per buffered reading, laid out over elapsed time, painted by that
 * reading's own risk verdict. It is the glanceable "how has the walk been"
 * instrument at the top of the console; the feed below it is where the same
 * events say anything in words.
 *
 * Rules it refuses to break:
 * - nothing from nothing: an empty buffer leaves the bare line standing. A
 *   row of invented dots would be fabricated telemetry;
 * - zone-of-time identity comes from position, and the verdict reading still
 *   travels through the feed's icon + label + colour pairs. The strip is one
 *   `role="img"` whose summary label is built from the real counts, so a
 *   screen reader lands once and moves on;
 * - no live region. The page already announces what is worth announcing, and
 *   liveRegion.test.js freezes that allowlist on purpose.
 */

/** Whole literals on purpose: Tailwind must be able to see each class. */
const RISK_DOT = {
  safe: "bg-safe",
  warning: "bg-warning",
  danger: "bg-danger",
};

const HeroTimeline = ({ records = [], language = "id" }) => {
  const lang = language;

  // The one element that is present in every state: the line itself.
  const track = (
    <div data-timeline-root>
      <div className="relative mt-6 h-2 w-full rounded-full bg-surface-3" data-timeline-track />
    </div>
  );

  if (records.length === 0) {
    return <div aria-hidden="true">{track}</div>;
  }

  const times = records.map((rec) => Number(rec?.timestamp || 0));
  // Mutation local to the closure on purpose: the duplicate run is consumed
  // while walking the records, in buffer order.
  let duplicateRun = 0;
  const oldest = Math.min(...times);
  const newest = Math.max(...times);
  const span = newest - oldest || 1;

  const counts = records.reduce(
    (memo, rec) => {
      const key = RISK_DOT[rec?.risk] ? rec.risk : null;
      if (key) memo[key] += 1;
      return memo;
    },
    { safe: 0, warning: 0, danger: 0 }
  );

  return (
    <div
      data-timeline-root
      role="img"
      /* A summary built from real counts, not from the shape: the number of
         buffered readings, spoken once, then the reader moves on. */
      aria-label={`${counts.safe + counts.warning + counts.danger} ${t(
        "dashboard.timeline.notes",
        lang
      )}`}
    >
      {/* dots sit above the line, meeting it at their centres */}
      <div className="relative mt-6 h-6 w-full">
        <div
          className="absolute inset-x-0 bottom-1.5 h-px bg-border-strong"
          data-timeline-track
        />
        {records.map((rec, index) => {
          const time = Number(rec?.timestamp || 0);
          // Duplicate timestamps (a packet burst) stack progressively so two
          // dots on one ms stay visible instead of overwriting. The nudge is
          // a run-length on equality, not index times a constant: a buffer
          // with distinct times must have its dots sit exactly at their
          // elapsed time, and only the duplicates walk right.
          const run =
            index > 0 && times[index - 1] === time ? duplicateRun + 1 : 0;
          duplicateRun = run;
          const pct = (((time - oldest) / span) * 0.94 + run * 0.002) * 100;
          const clamped = Math.min(97.5, Math.max(2.5, pct));
          const tone = RISK_DOT[rec?.risk] || RISK_DOT.safe;
          return (
            <span
              key={index}
              data-timeline-dot
              className={`absolute top-0 h-3 w-3 -translate-x-1/2 rounded-full ring-2 ring-surface ${tone}`}
              style={{ left: `${clamped}%` }}
            />
          );
        })}
      </div>

      <div className="mt-1 flex justify-end">
        <span
          data-timeline="now"
          className="inline-flex items-center gap-1.5 text-caption text-muted"
        >
          <span aria-hidden="true" className="h-3 w-px bg-border-strong" />
          {t("dashboard.timeline.now", lang)}
        </span>
      </div>
    </div>
  );
};

HeroTimeline.displayName = "HeroTimeline";

export { HeroTimeline };
export default HeroTimeline;
