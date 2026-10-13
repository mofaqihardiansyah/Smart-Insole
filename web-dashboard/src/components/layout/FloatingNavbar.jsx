import React, { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Activity,
  History,
  Smartphone,
  Settings,
  User,
  Bell,
  Menu,
  X,
  Radio,
  FlaskConical,
} from "lucide-react";
import { useInsole } from "../../context/InsoleContext";
import { t } from "../../utils/i18n";

/**
 * FloatingNavbar: the application shell's navigation.
 *
 * The name is historical. There has been no floating bar since the Romer
 * direction landed, and the brief forbids renaming exports, so the name is kept
 * and this comment records what it actually is:
 *
 *   >= lg  a fixed left rail, 16rem wide, uppercase tracked items, with the
 *          active item marked by a cyan right edge (colour AND position, plus
 *          aria-current, so the state is not carried by colour alone).
 *   <  lg  a sticky top bar with the brand and a Menu button
 *          that opens a drawer. A drawer rather than a bottom bar because the
 *          Romer reference uses a rail, and a 7 item rail has nowhere to go on
 *          a 360px screen.
 *
 * The previous version kept the active item in local state and never navigated,
 * so clicking a link only moved a highlight. Active state now comes from the
 * router, which is why the highlight can never disagree with the page.
 */

const ICONS = {
  Home,
  Chart: Activity,
  History,
  Device: Smartphone,
  Settings,
  User,
  Bell,
};

const renderIcon = (icon, className = "h-4 w-4") => {
  if (React.isValidElement(icon)) return icon;
  const Icon = ICONS[icon] || Home;
  return <Icon className={className} aria-hidden="true" />;
};

/** Compact ID / EN switch, used in both navigation registers. */
const LanguageToggle = ({ className = "" }) => {
  const { language, setLanguage } = useInsole();

  return (
    <div
      role="group"
      aria-label={t("common.language", language)}
      className={`inline-flex overflow-hidden rounded-control border border-border-control ${className}`.trim()}
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
              "min-h-[44px] min-w-[44px] px-2.5 text-chip font-bold uppercase",
              "transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
              active
                ? "bg-primary-btn text-primary-on"
                : "bg-surface text-muted hover:bg-surface-2 hover:text-fg",
            ].join(" ")}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
};

/** The live data source, always visible so the state is never in doubt. */
const SourceReadout = () => {
  const { source, connectionState, isLive, language } = useInsole();

  const isFirebase = source === "FIREBASE";
  const label = isFirebase
    ? isLive
      ? t("source.live", language)
      : connectionState === "connecting"
        ? t("source.connecting", language)
        : t("source.error", language)
    : t("source.simulator", language);

  const tone = isFirebase
    ? isLive
      ? "text-safe"
      : "text-warning"
    : "text-muted";

  const Icon = isFirebase ? Radio : FlaskConical;

  return (
    <p className={`flex items-center gap-2 text-body-sm ${tone}`}>
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </p>
  );
};

const FloatingNavbar = ({ links = [], hasUnread = false, unreadLabel }) => {
  const { language } = useInsole();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const drawerRef = useRef(null);
  const previouslyFocused = useRef(null);

  // Close the drawer whenever the route changes, so a link tap never leaves it
  // sitting over the page it just opened.
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!drawerOpen) return undefined;

    previouslyFocused.current = document.activeElement;
    const firstLink = drawerRef.current?.querySelector("a, button");
    firstLink?.focus?.();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setDrawerOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [drawerOpen]);

  const railItem = ({ isActive }) =>
    [
      "flex items-center gap-3 px-4 py-2.5 text-label uppercase",
      "border-r-2 transition-colors duration-150",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
      isActive
        ? "border-secondary bg-surface-2 text-secondary"
        : "border-transparent text-muted hover:bg-surface-2 hover:text-fg",
    ].join(" ");

  const drawerItem = ({ isActive }) =>
    [
      "flex min-h-[44px] items-center gap-3 rounded-control px-3 text-body font-medium",
      "transition-colors duration-150",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
      isActive
        ? "bg-surface-2 text-secondary"
        : "text-muted hover:bg-surface-2 hover:text-fg",
    ].join(" ");

  const isRoot = (link) => link.to === "/";

  const brand = (
    <div className="flex items-center gap-3 px-4 py-4">
      <img src="/icon.svg" alt="" className="h-8 w-8 shrink-0" />
      <div className="min-w-0">
        <p className="truncate font-heading text-h4 font-semibold text-fg">
          {t("app.title", language)}
        </p>
        <p className="truncate text-body-sm text-muted">
          {t("app.tagline", language)}
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop rail */}
      <nav
        aria-label={t("nav.main", language)}
        className="fixed left-0 top-0 z-40 hidden h-[100dvh] w-64 flex-col border-r border-border bg-sidebar lg:flex"
      >
        {brand}

        <ul className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
          {links.map((link) => (
            <li key={link.id}>
              <NavLink
                to={link.to}
                end={isRoot(link)}
                className={railItem}
                aria-label={link.accessibilityLabel || link.label}
              >
                {renderIcon(link.icon)}
                <span className="truncate">{link.label}</span>
                {link.id === "notifications" && hasUnread && (
                  <span
                    className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger/20 px-1.5 text-chip font-bold text-danger"
                    aria-label={unreadLabel}
                  >
                    {unreadLabel}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="space-y-3 border-t border-border px-4 py-4">
          <SourceReadout />
          <LanguageToggle />
        </div>
      </nav>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-border bg-sidebar px-4 lg:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <img src="/icon.svg" alt="" className="h-7 w-7 shrink-0" />
          <span className="truncate font-heading text-h4 font-semibold text-fg">
            {t("app.title", language)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-expanded={drawerOpen}
            aria-controls="nav-drawer"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-control text-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
            {hasUnread && (
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-sidebar" />
            )}
            <span className="sr-only">{t("nav.openMenu", language)}</span>
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-scrim/70"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            id="nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={t("nav.main", language)}
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-border-strong bg-sidebar"
          >
            <div className="flex items-center justify-between border-b border-border pr-2">
              {brand}
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-control text-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">{t("nav.closeMenu", language)}</span>
              </button>
            </div>

            <ul className="flex-1 space-y-1 overflow-y-auto p-3">
              {links.map((link) => (
                <li key={link.id}>
                  <NavLink
                    to={link.to}
                    end={isRoot(link)}
                    className={drawerItem}
                    onClick={() => setDrawerOpen(false)}
                  >
                    {renderIcon(link.icon, "h-5 w-5")}
                    <span className="truncate">{link.label}</span>
                    {link.id === "notifications" && hasUnread && (
                      <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger/20 px-1.5 text-chip font-bold text-danger">
                        {unreadLabel}
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="space-y-3 border-t border-border p-4">
              <SourceReadout />
              <LanguageToggle className="w-full" />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export { FloatingNavbar, LanguageToggle };
export default FloatingNavbar;
