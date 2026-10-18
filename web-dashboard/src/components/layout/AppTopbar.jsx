import React from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { useInsole } from "../../context/InsoleContext";
import { t } from "../../utils/i18n";
import { AppSearch } from "./AppSearch";
import { initialsOf } from "./AppSidebar";

/**
 * AppTopbar — the 72px bar above the content column.
 *
 * The split with the rail is deliberate: destinations live on the left, and the
 * top bar carries the two things that are about *state* rather than *place*:
 * search and the account controls. Nothing here is decoration, so every control
 * has a destination or a state to report.
 */
const AppTopbar = ({ links = [], hasUnread = false, userName, userEmail }) => {
  const { language, unreadIncidentCount } = useInsole();
  const initials = initialsOf(userName) || initialsOf(userEmail);

  return (
    <header className="sticky top-0 z-30 hidden h-[72px] items-center gap-6 border-b border-border bg-surface px-6 lg:flex lg:px-8">
      <AppSearch links={links} />

      <div className="ml-auto flex items-center gap-2">
        <Link
          to="/notifications"
          className="relative grid h-11 w-11 place-items-center rounded-full text-fg-2 transition-colors duration-150 hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
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

        <span aria-hidden="true" className="mx-1 h-6 w-px bg-border-strong" />

        <Link
          to="/profile"
          className="grid h-10 w-10 place-items-center rounded-full bg-primary-btn text-body-sm font-bold text-primary-on focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <span aria-hidden="true">
            {initials || <img src="/icon.svg" alt="" className="h-6 w-6" />}
          </span>
          <span className="sr-only">{t("topbar.account", language)}</span>
        </Link>
      </div>
    </header>
  );
};

export { AppTopbar };
export default AppTopbar;
