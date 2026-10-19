import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Activity,
  History,
  Smartphone,
  Settings,
  User,
  Bell,
  Radio,
  Shield,
} from "lucide-react";
import { useInsole } from "../../context/InsoleContext";
import { t } from "../../utils/i18n";

/**
 * AppSidebar — the 288px product rail.
 *
 * It carries the whole navigation, because the reference console puts every
 * destination in the rail and reserves the top bar for search and account
 * controls. That split is deliberate: destinations on the left, state and
 * search on the top.
 *
 * The active item is marked by a filled tile (`aria-current` is set by
 * NavLink), so the state is carried by position and surface as well as by
 * colour.
 *
 * The account card is pinned to the foot of the rail and holds the one
 * destructive control in the shell, separated from the navigation so a
 * mis-click cannot sign the user out.
 */

const ICONS = {
  Home: LayoutDashboard,
  Chart: Activity,
  History,
  Device: Smartphone,
  Settings,
  User,
  Bell,
  Shield,
};

const renderIcon = (icon, className = "h-5 w-5") => {
  if (React.isValidElement(icon)) return icon;
  const Icon = ICONS[icon] || LayoutDashboard;
  return <Icon className={className} aria-hidden="true" />;
};

/** Initials for the avatar. Falls back to the product mark, never a stock face. */
const initialsOf = (value) => {
  const source = String(value || "").trim();
  if (!source) return null;
  const words = source.replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean);
  if (words.length === 0) return null;
  const letters = words.slice(0, 2).map((word) => word[0]);
  return letters.join("").toUpperCase();
};

const Brand = ({ language }) => (
  <div className="flex items-center gap-3 px-5 py-5">
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-tile bg-primary-btn">
      <img src="/icon.svg" alt="" className="h-7 w-7" />
    </span>
    <div className="min-w-0">
      {/* Same rank as the mobile bar's brand line: text-h4 bold. The previous
          17px arbitrary value was the one off-token size in the codebase. */}
      <p className="truncate font-heading text-h4 font-bold leading-tight text-fg">
        {t("app.title", language)}
      </p>
      <p className="truncate text-micro uppercase text-muted">
        {t("app.taglineShort", language)}
      </p>
    </div>
  </div>
);

/** Live data source. Always visible, so the reliability of the numbers is never in doubt. */
const SourceReadout = () => {
  const { connectionState, isLive, language } = useInsole();

  const label = isLive
    ? t("source.live", language)
    : connectionState === "connecting"
      ? t("source.connecting", language)
      : connectionState === "error"
        ? t("source.error", language)
        : t("source.idle", language);

  const tone = isLive ? "text-safe" : "text-warning";
  const Icon = Radio;

  return (
    <p className={`flex items-center gap-2 text-body-sm ${tone}`}>
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </p>
  );
};

/** The account card at the foot of the rail. */
const AccountCard = ({ name, email, onSignOut, language, className = "" }) => {
  const initials = initialsOf(name) || initialsOf(email);

  return (
    <div className={`rounded-tile bg-surface-2 p-3 ${className}`.trim()}>
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-btn text-body-sm font-bold text-primary-on"
        >
          {initials || <img src="/icon.svg" alt="" className="h-7 w-7" />}
        </span>
        <div className="min-w-0">
          <p className="truncate text-body-sm font-bold text-fg">
            {name || email || t("common.notAvailable", language)}
          </p>
          {email && (
            <p className="truncate text-caption text-muted" title={email}>
              {email}
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onSignOut}
        className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center rounded-control border border-border-strong bg-surface text-body-sm font-bold text-danger transition-colors duration-150 hover:bg-danger/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 focus-visible:ring-offset-surface-2"
      >
        {t("common.signOut", language)}
      </button>
    </div>
  );
};

const AppSidebar = ({
  links = [],
  userName,
  userEmail,
  onSignOut,
  className = "",
}) => {
  const { language } = useInsole();

  const railItem = ({ isActive }) =>
    [
      "flex min-h-[46px] items-center gap-3 rounded-tile px-3 text-body font-medium",
      "transition-colors duration-150",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
      isActive
        ? "bg-surface-3/70 font-semibold text-fg"
        : "text-muted hover:bg-surface-2 hover:text-fg",
    ].join(" ");

  return (
    <nav
      aria-label={t("nav.main", language)}
      className={`flex h-full flex-col bg-sidebar ${className}`.trim()}
    >
      <Brand language={language} />

      <ul className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {links.map((link) => (
          <li key={link.id}>
            <NavLink
              to={link.to}
              end={link.to === "/"}
              className={railItem}
              aria-label={link.accessibilityLabel || link.label}
            >
              {renderIcon(link.icon)}
              <span className="truncate">{link.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="space-y-3 border-t border-border-strong px-3 py-4">
        <SourceReadout />
        <AccountCard
          name={userName}
          email={userEmail}
          onSignOut={onSignOut}
          language={language}
        />
      </div>
    </nav>
  );
};

export { AppSidebar, AccountCard, Brand, renderIcon, initialsOf };
export default AppSidebar;
