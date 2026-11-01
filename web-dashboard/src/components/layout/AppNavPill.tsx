import React from "react";
import { NavLink } from "react-router-dom";
import { useInsole } from "../../context/InsoleContext";
import { t } from "../../utils/i18n";
import { renderIcon } from "./AppSidebar";
import type { NavItem } from "./AppSidebar";

/**
 * AppNavPill — the Cadra light nav: one dark pill owning every destination.
 *
 * Destinations live in exactly one place in the shell. The pill renders from
 * `lg` up (below that the drawer takes over), so the visible navigation is
 * always a single row of destinations rather than a column the content column
 * has to work around.
 *
 * The active item is marked by a lighter surface inside the dark pill *and* by
 * react-router's `aria-current="page"`, so the state is carried by position,
 * surface and attribute rather than by colour alone.
 */
interface AppNavPillProps {
  links?: NavItem[];
  className?: string;
}

const AppNavPill = ({
  links = [],
  className = "",
}: AppNavPillProps) => {
  const { language } = useInsole();

  const pillItem = ({ isActive }: { isActive: boolean }) =>
    [
      "flex h-9 min-h-[36px] items-center gap-2 rounded-pill px-3.5 text-body-sm font-medium",
      "transition-colors duration-150",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
      isActive
        ? "bg-secondary/15 text-secondary-ink font-semibold"
        : "text-fg-2 hover:bg-surface-2 hover:text-fg",
    ].join(" ");

  return (
    <nav
      aria-label={t("nav.main", language)}
      className={`hidden items-center gap-1 rounded-pill border border-border bg-surface p-1.5 shadow-panel lg:flex ${className}`.trim()}
    >
      {links.map((link) => (
        <NavLink
          key={link.id}
          to={link.to}
          end={link.to === "/"}
          className={pillItem}
          aria-label={link.accessibilityLabel || link.label}
        >
          {renderIcon(link.icon, "h-4 w-4")}
          <span className="whitespace-nowrap">{link.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

AppNavPill.displayName = "AppNavPill";

export { AppNavPill };
export default AppNavPill;
