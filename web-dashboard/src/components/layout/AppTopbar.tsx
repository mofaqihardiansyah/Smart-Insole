import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Bell } from "lucide-react";
import { useInsole } from "../../context/InsoleContext";
import { t } from "../../utils/i18n";
import { AppSearch } from "./AppSearch";
import { initialsOf } from "./AppSidebar";
import type { NavItem } from "./AppSidebar";

/**
 * AppTopbar — the desktop header row of the Cadra light shell.
 *
 * Destinations live in the nav pill beside it; this row carries the three
 * things that are about *state* rather than *place*: search, the alert bell,
 * and the account menu. Mostly decoration would be a defect here, so every
 * control has a destination, a state, or an act to report.
 */

/**
 * The brand card at the head of the header row.
 *
 * It is deliberately NOT a link: the pill's first item is the dashboard, and a
 * second clickable brand would make `a[href="/"]` a repeat. The mark identifies
 * the product; the pill carries the place.
 */
export const BrandCard = () => {
  const { language } = useInsole();
  return (
    <div
      aria-label={t("app.title", language)}
      className="flex h-12 shrink-0 items-center gap-2.5 rounded-pill border border-border bg-surface px-4 shadow-panel"
    >
      <img src="/icon.svg" alt="" className="h-7 w-7 shrink-0" />
      <span className="min-w-0">
        <span className="block truncate font-heading text-h4 font-bold leading-tight text-fg">
          {t("app.title", language)}
        </span>
      </span>
    </div>
  );
};

/** The alert bell, carried once per breakpoint row. */
const BellLink = ({ hasUnread }: { hasUnread?: boolean }) => {
  const { language, unreadIncidentCount } = useInsole();
  return (
    <Link
      to="/notifications"
      className="relative grid h-11 w-11 shrink-0 place-items-center rounded-pill text-fg-2 transition-colors duration-150 hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
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
          ? t("topbar.unread", language, { count: unreadIncidentCount })
          : t("topbar.notifications", language)}
      </span>
    </Link>
  );
};

/**
 * The account menu: one disclosure owning the two account acts (profile and
 * the shell's one destructive control). Escape closes it, an outside click
 * closes it, and focus returns to the trigger so keyboard users never lose
 * their place.
 */
const AccountMenu = ({
  userName,
  userEmail,
  onSignOut,
}: {
  userName?: string;
  userEmail?: string;
  onSignOut: () => void;
}) => {
  const { language } = useInsole();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  /** An auth flow can change the user under an open menu; close with it. */
  useEffect(() => {
    if (!userName && !userEmail) setOpen(false);
  }, [userName, userEmail]);

  const toggle = useCallback(() => setOpen((value) => !value), []);

  const initials = initialsOf(userName) || initialsOf(userEmail);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="account-menu"
        className="grid h-11 w-11 place-items-center rounded-full bg-surface text-fg-2 shadow-panel ring-1 ring-border transition-colors duration-150 hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        {initials ? (
          <span aria-hidden="true" className="text-body-sm font-bold">
            {initials}
          </span>
        ) : (
          <img src="/icon.svg" alt="" className="h-6 w-6" />
        )}
        <span className="sr-only">
          {`${t("topbar.account", language)}: ${userName || userEmail || ""}`}
        </span>
      </button>

      {open && (
        <div
          id="account-menu"
          role="group"
          aria-label={t("topbar.accountMenu", language)}
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-60 rounded-tile border border-border-strong bg-surface p-2 shadow-lg"
        >
          <div className="border-b border-border px-3 pb-3 pt-2">
            <p className="truncate text-body-sm font-bold text-fg">
              {userName || userEmail}
            </p>
            {userName && userEmail && (
              <p className="truncate text-caption text-muted" title={userEmail}>
                {userEmail}
              </p>
            )}
          </div>
          <div className="pt-2">
            <NavLink
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex min-h-[44px] items-center rounded-control px-3 text-body-sm font-medium text-fg-2 transition-colors duration-150 hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
            >
              {t("nav.profile", language)}
            </NavLink>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
              className="mt-1 flex min-h-[44px] w-full items-center rounded-control px-3 text-left text-body-sm font-bold text-danger transition-colors duration-150 hover:bg-danger/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-inset"
            >
              {t("common.signOut", language)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface AppTopbarProps {
  links?: NavItem[];
  hasUnread?: boolean;
  userName?: string;
  userEmail?: string;
  onSignOut: () => void;
}

const AppTopbar = ({
  links = [],
  hasUnread = false,
  userName,
  userEmail,
  onSignOut,
}: AppTopbarProps) => {
  return (
    <div className="ml-auto flex min-w-0 items-center gap-2">
      <div className="w-56 min-w-0 shrink xl:w-72">
        <AppSearch links={links} />
      </div>
      <BellLink hasUnread={hasUnread} />
      <AccountMenu userName={userName} userEmail={userEmail} onSignOut={onSignOut} />
    </div>
  );
};

export { AppTopbar };
export default AppTopbar;
