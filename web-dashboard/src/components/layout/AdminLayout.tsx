import React from "react";
import type { ReactNode } from "react";
import { NavLink, Link } from "react-router-dom";
import { LogOut, ShieldCheck } from "lucide-react";
import { useInsole } from "../../context/InsoleContext";
import { useUser } from "../../context/UserContext";
import { t } from "../../utils/i18n";

/**
 * AdminLayout — the console shell, deliberately not the patient shell.
 *
 * No nav pill, no alert bell, no user search and no early-warning dialog: the
 * console is a work tool, and the patient app behind it keeps owning the live
 * monitoring. The only link back is explicit, and sign-out lives here too.
 *
 * The tab row scrolls horizontally instead of collapsing into a second drawer:
 * five destinations fit on a phone as a row, and the same row is the whole
 * navigation on a desktop.
 */

const TABS = [
  { to: "/admin", end: true, labelKey: "admin.nav.overview" },
  { to: "/admin/users", labelKey: "admin.nav.users" },
  { to: "/admin/devices", labelKey: "admin.nav.devices" },
  { to: "/admin/incidents", labelKey: "admin.nav.incidents" },
  { to: "/admin/config", labelKey: "admin.nav.config" },
];

const AdminLayout = ({ children }: { children?: ReactNode }) => {
  const { language } = useInsole();
  const { displayName, signOut } = useUser();

  return (
    <div className="min-h-[100dvh] bg-bg">
      <header className="sticky top-0 z-40 border-b border-border bg-bg">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <img src="/icon.svg" alt="" className="h-7 w-7 shrink-0" />
            <span className="truncate font-heading text-h4 font-bold text-fg">
              {t("app.title", language)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-sm bg-primary/10 px-2 py-1 text-caption font-semibold text-primary">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {t("admin.brand", language)}
            </span>
          </div>

          <nav
            aria-label={t("admin.brand", language)}
            className="order-last w-full overflow-x-auto sm:order-none sm:ml-4 sm:w-auto"
          >
            <ul className="flex items-center gap-1">
              {TABS.map((tab) => (
                <li key={tab.to}>
                  <NavLink
                    to={tab.to}
                    end={tab.end}
                    className={({ isActive }) =>
                      [
                        "inline-flex min-h-[40px] items-center whitespace-nowrap rounded-control px-3 text-body-sm font-medium transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
                        isActive
                          ? "bg-surface-3/70 font-semibold text-fg"
                          : "text-muted hover:bg-surface-2 hover:text-fg",
                      ].join(" ")
                    }
                  >
                    {t(tab.labelKey, language)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden truncate text-body-sm text-muted sm:inline">
              {displayName}
            </span>
            <Link
              to="/"
              className="inline-flex min-h-[40px] items-center rounded-control px-3 text-body-sm font-medium text-fg-2 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {t("admin.backToApp", language)}
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-control px-3 text-body-sm font-bold text-danger hover:bg-danger/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {t("common.signOut", language)}
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export { AdminLayout };
export default AdminLayout;
