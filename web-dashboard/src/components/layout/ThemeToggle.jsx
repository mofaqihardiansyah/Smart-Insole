import React from "react";
import { Moon, Sun } from "lucide-react";
import { useInsole } from "../../context/InsoleContext";
import { t } from "../../utils/i18n";

/**
 * ThemeToggle — switches between the dark instrument theme and the light
 * clinical one.
 *
 * Two shapes for two jobs:
 *
 * - `icon` (default) for a bar or rail, where space is tight. The accessible
 *   name states the ACTION ("Switch to light theme"), not the current state,
 *   because a bare "Dark" next to a moon tells a screen reader user nothing
 *   about what pressing it will do.
 * - `labeled` for a settings surface, where the two options should both be
 *   visible and directly selectable.
 *
 * Both shapes are real controls: the state is persisted by the provider and the
 * whole palette repaints from one class on <html>.
 */

export const ThemeToggle = ({ variant = "icon", className = "" }) => {
  const { theme, setTheme, toggleTheme, language } = useInsole();
  const isDark = theme === "dark";

  if (variant === "labeled") {
    return (
      <div
        role="group"
        aria-label={t("theme.label", language)}
        className={`inline-flex overflow-hidden rounded-control border border-border-control ${className}`.trim()}
      >
        {[
          { code: "light", label: t("theme.light", language), Icon: Sun },
          { code: "dark", label: t("theme.dark", language), Icon: Moon },
        ].map(({ code, label, Icon }) => {
          const active = theme === code;
          return (
            <button
              key={code}
              type="button"
              onClick={() => setTheme(code)}
              aria-pressed={active}
              className={[
                "inline-flex min-h-[44px] items-center gap-2 px-3 text-body-sm font-medium",
                "transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
                active
                  ? "bg-primary-btn text-primary-on"
                  : "bg-surface text-muted hover:bg-surface-2 hover:text-fg",
              ].join(" ")}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={t(isDark ? "theme.toLight" : "theme.toDark", language)}
      title={t(isDark ? "theme.toLight" : "theme.toDark", language)}
      className={[
        "inline-flex h-11 w-11 items-center justify-center rounded-control",
        "text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-fg",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* The icon shows the CURRENT theme, so the control reads as a state
          indicator as well as a button. */}
      {isDark ? (
        <Moon className="h-5 w-5" aria-hidden="true" />
      ) : (
        <Sun className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
};

export default ThemeToggle;
