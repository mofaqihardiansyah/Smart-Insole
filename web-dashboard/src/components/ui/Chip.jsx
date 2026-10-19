import React from "react";
import { devWarn } from "../../utils/devWarn";

/**
 * Chip — the small labelled token used for filters, deltas and states.
 *
 * Radius is hierarchy here, but not by shape-doubling: every chip is a
 * squared 4px tag, and the avatars and indicator dots are the only circles a
 * surface may carry. A pill was available for every one of these before, and
 * when everything can be a pill nothing reads as a state.
 *
 * Tones are the semantic set only. There is no arbitrary colour prop: a chip
 * that can be any colour ends up being every colour.
 *
 * A tone the map does not declare still renders `neutral` — a blank where a
 * state should be is worse on a ward console than a correct-looking one — but a
 * chip's whole job is to make a claim about the reading it labels, and a
 * `danger` chip painted neutral makes the opposite claim convincingly. So
 * development names the received value and the declared set.
 */
const TONES = {
  neutral: "bg-surface-2 text-fg-2",
  // Navy ink on the informational tint: #0EA5E9 as a text colour measures
  // 3.0:1 on white and fails AA for a 12px label, so the tint stays and the
  // ink comes from the readable navy.
  info: "bg-tertiary/15 text-primary",
  success: "bg-safe/15 text-safe-ink",
  warning: "bg-warning/15 text-warning-ink",
  danger: "bg-danger/15 text-danger-ink",
};

const Chip = ({
  children,
  tone = "neutral",
  uppercase = false,
  className = "",
  as: Tag = "span",
  ...props
}) => {
  // Production keeps the benign substitution; development names the received
  // value and the declared set so a mis-spelled claim surfaces where it was
  // written rather than as a chip that reads calm on a danger reading.
  if (!TONES[tone]) {
    devWarn(
      "Chip",
      `unknown tone "${tone}"; declared tones are ${Object.keys(TONES).join(
        ", "
      )}`
    );
  }

  return (
    <Tag
      className={[
        "inline-flex items-center gap-1.5 border border-transparent rounded-sm px-2.5 py-1 font-semibold",
        uppercase ? "text-chip uppercase" : "text-caption",
        TONES[tone] || TONES.neutral,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </Tag>
  );
};

Chip.displayName = "Chip";

export { Chip, TONES as CHIP_TONES };
export default Chip;
