import React, { useEffect, useRef, useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { Bell, Menu, X } from "lucide-react";
import { useInsole } from "../../context/InsoleContext";
import { t } from "../../utils/i18n";
import { AppSidebar, AccountCard, renderIcon } from "./AppSidebar";
import { AppTopbar } from "./AppTopbar";
import { AppSearch } from "./AppSearch";

/**
 * AppLayout — the application shell.
 *
 *   >= lg   a fixed 288px rail on the left, a sticky 72px top bar over the
 *           content column, content capped so a very wide monitor does not
 *           stretch a line of text across the screen.
 *   <  lg   a sticky top bar with the brand and a Menu button that opens a
 *           drawer. A drawer rather than a bottom bar because a seven item
 *           bottom row cannot hold a readable label at 360px, and an icon-only
 *           row is the failure mode this product's elderly audience cannot
 *           afford.
 *
 * The drawer is a real dialog: focus moves into it, Tab stays inside it, Escape
 * closes it, the page behind it cannot scroll, and focus returns to the button
 * that opened it.
 */

/**
 * What Tab can reach. Collected fresh on each key press rather than cached,
 * because the drawer's contents change (the search popup opens and closes, the
 * rail is rebuilt when the role arrives).
 */
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

const AppLayout = ({
  links = [],
  hasUnread = false,
  unreadLabel,
  userName,
  userEmail,
  onSignOut,
  children,
}) => {
  const { language } = useInsole();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const drawerRef = useRef(null);
  const triggerRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!drawerOpen) return undefined;

    previouslyFocused.current = document.activeElement;
    drawerRef.current?.querySelector("a, button, input")?.focus?.();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setDrawerOpen(false);
        return;
      }

      // `aria-modal="true"` tells assistive technology the page behind is inert,
      // so focus has to behave that way too. Without this, Tab walks straight out
      // of the dialog and into the content it just declared unreachable.
      if (event.key !== "Tab") return;

      const drawer = drawerRef.current;
      if (!drawer) return;
      const focusables = Array.from(drawer.querySelectorAll(FOCUSABLE));
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (!drawer.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
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

  const drawerItem = ({ isActive }) =>
    [
      "flex min-h-[48px] items-center gap-3 rounded-tile px-3 text-body font-medium",
      "transition-colors duration-150",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
      isActive
        ? "bg-surface-3/70 font-semibold text-fg"
        : "text-muted hover:bg-surface-2 hover:text-fg",
    ].join(" ");

  return (
    <div className="min-h-[100dvh] bg-bg">
      {/* Desktop rail */}
      <div className="fixed left-0 top-0 z-40 hidden h-[100dvh] w-72 border-r border-border lg:block">
        <AppSidebar
          links={links}
          userName={userName}
          userEmail={userEmail}
          onSignOut={onSignOut}
        />
      </div>

      {/* Mobile bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-border bg-surface px-4 lg:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-tile bg-primary-btn">
            <img src="/icon.svg" alt="" className="h-5 w-5" />
          </span>
          <span className="truncate font-heading text-h4 font-bold text-fg">
            {t("app.title", language)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* The alert queue lives on the bell, not in the rail, so a phone
              needs the same reach as a desktop. */}
          <Link
            to="/notifications"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-control text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            {hasUnread && (
              <span
                aria-hidden="true"
                className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-safe ring-2 ring-surface"
              />
            )}
            <span className="sr-only">
              {hasUnread
                ? t("topbar.unread", language, {
                    count: Number(unreadLabel) || 0,
                  })
                : t("topbar.notifications", language)}
            </span>
          </Link>

          <button
            ref={triggerRef}
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-expanded={drawerOpen}
            aria-controls="nav-drawer"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-control text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">{t("nav.openMenu", language)}</span>
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-scrim/40"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            id="nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={t("nav.main", language)}
            className="absolute inset-y-0 left-0 flex w-[19rem] max-w-[88vw] flex-col overflow-y-auto border-r border-border bg-surface"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4">
              <div className="flex min-w-0 items-center gap-2">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-tile bg-primary-btn">
                  <img src="/icon.svg" alt="" className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-heading text-h4 font-bold leading-tight text-fg">
                    {t("app.title", language)}
                  </p>
                  <p className="truncate text-micro uppercase text-muted">
                    {t("app.taglineShort", language)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">{t("nav.closeMenu", language)}</span>
              </button>
            </div>

            <div className="border-b border-border p-3">
              <AppSearch links={links} />
            </div>

            <ul className="flex-1 space-y-1 p-3">
              {links.map((link) => (
                <li key={link.id}>
                  <NavLink
                    to={link.to}
                    end={link.to === "/"}
                    className={drawerItem}
                    onClick={() => setDrawerOpen(false)}
                  >
                    {renderIcon(link.icon)}
                    <span className="truncate">{link.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="space-y-3 border-t border-border p-3">
              <AccountCard
                name={userName}
                email={userEmail}
                onSignOut={onSignOut}
                language={language}
              />
            </div>
          </div>
        </div>
      )}

      {/* Content column */}
      <div className="lg:pl-72">
        <AppTopbar
          links={links}
          hasUnread={hasUnread}
          userName={userName}
          userEmail={userEmail}
        />

        <main
          id="main-content"
          className="w-full px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8"
        >
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>

          <footer className="mx-auto mt-12 max-w-[1400px] border-t border-border pt-4 text-body-sm text-muted">
            {t("app.footer", language)}
          </footer>
        </main>
      </div>
    </div>
  );
};

export { AppLayout };
export default AppLayout;
