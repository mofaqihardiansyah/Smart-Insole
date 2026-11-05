import React from "react";
import { LogOut, ShieldAlert } from "lucide-react";
import { useInsole } from "../context/InsoleContext";
import { t } from "../utils/i18n";

/**
 * DeactivatedScreen — what an account that an admin switched off sees.
 *
 * The Firebase session is still valid; the app simply refuses to mount any
 * route for it. The sign-out button is the way back to a usable login form,
 * and the copy names the cause rather than pretending the session expired.
 */
const DeactivatedScreen = ({ onSignOut }: { onSignOut: () => void }) => {
  const { language } = useInsole();

  return (
    <div className="grid min-h-[100dvh] place-items-center px-4 sm:px-6">
      <div className="w-full max-w-md rounded-card border border-border bg-surface p-6 text-center shadow-panel">
        <ShieldAlert
          className="mx-auto h-10 w-10 text-warning-ink"
          aria-hidden="true"
        />
        <h1 className="mt-4 font-heading text-h2 font-bold text-fg">
          {t("deactivated.title", language)}
        </h1>
        <p className="mx-auto mt-2 max-w-prose text-body-sm text-muted">
          {t("deactivated.body", language)}
        </p>
        <button
          type="button"
          onClick={onSignOut}
          className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-control bg-primary-btn px-4 text-body-sm font-bold text-primary-on focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {t("deactivated.signOut", language)}
        </button>
      </div>
    </div>
  );
};

export default DeactivatedScreen;
