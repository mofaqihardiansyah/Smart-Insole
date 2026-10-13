import React from "react";
import { useInsole } from "../../context/InsoleContext";
import { t } from "../../utils/i18n";

/**
 * LanguageToggle — the ID / EN switch.
 *
 * Two states, both reachable in one press, and each button reports its own
 * pressed state so a screen reader announces the active language rather than
 * a pair of unlabelled letters.
 *
 * It lives in its own module because both the app shell and the public landing
 * page use it, and the landing page should not have to import the whole shell
 * to get a language switch.
 */
const LanguageToggle = ({ className = "" }) => {
  const { language, setLanguage } = useInsole();

  return (
    <div
      role="group"
      aria-label={t("common.language", language)}
      className={`inline-flex overflow-hidden rounded-control border border-border-strong bg-surface p-0.5 ${className}`.trim()}
    >
      {["id", "en"].map((code) => {
        const active = language === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLanguage(code)}
            aria-pressed={active}
            className={[
              "min-h-[44px] min-w-[44px] rounded-[6px] px-2 text-chip uppercase lg:min-h-[34px] lg:min-w-[40px]",
              "transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
              active
                ? "bg-primary-btn text-primary-on"
                : "text-muted hover:bg-surface-2 hover:text-fg",
            ].join(" ")}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
};

export { LanguageToggle };
export default LanguageToggle;
