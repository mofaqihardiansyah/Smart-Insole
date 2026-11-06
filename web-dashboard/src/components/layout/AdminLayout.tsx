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
 * The header is one ink band: a dark instrument strip over the warm canvas,
 * with the tabs reading as a line of sections rather than as the patient nav
 * pill. That single move separates the two surfaces at a glance while keeping
 * the product's tokens, so the console still belongs to the same clinic.
 *
 * No bell, no search, no early-warning dialog. The way back to the patient app
 * is explicit, and sign-out lives here too.
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
      <header className="sticky top-0 z-40 bg-fg text-surface">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <ShieldCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="truncate text-body-sm font-bold tracking-tight">
              {t("app.title", language)}
            </span>
            <span className="text-caption text-surface/60">
              {t("admin.brand", language)}
            </span>
          </div>

          <nav
            aria-label={t("admin.brand", language)}
            className="order-last w-full overflow-x-auto sm:order-none sm:w-auto"
          >
            <ul className="flex items-stretch gap-5">
              {TABS.map((tab) => (
                <li key={tab.to}>
                  <NavLink
                    to={tab.to}
                    end={tab.end}
                    className={({ isActive }) =>
                      [
                        "inline-flex min-h-[40px] items-center border-b-2 pt-1 text-body-sm transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface focus-visible:ring-inset",
                        isActive
                          ? "border-surface font-semibold text-surface"
                          : "border-transparent text-surface/65 hover:text-surface",
                      ].join(" ")
                    }
                  >
                    {t(tab.labelKey, language)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-4">
            <span className="hidden truncate text-caption text-surface/60 sm:inline">
              {displayName}
            </span>
            <Link
              to="/"
              className="inline-flex min-h-[40px] items-center text-body-sm text-surface/75 underline-offset-4 hover:text-surface hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface"
            >
              {t("admin.backToApp", language)}
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex min-h-[40px] items-center gap-1.5 text-body-sm font-medium text-surface/75 hover:text-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {t("common.signOut", language)}
            </button>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        className="mx-auto max-w-[1200px] px-4 pb-16 pt-8 sm:px-6 lg:px-8"
      >
        {children}
      </main>
    </div>
  );
};

export { AdminLayout };
export default AdminLayout;
