import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck, Radio, Settings2 } from "lucide-react";
import { useInsole } from "../../context/InsoleContext";
import { t } from "../../utils/i18n";
import { GlassButton, StatusChip } from "../ui/GlassComponents";

/**
 * AlertBell — the bell in the header, now a dialog rather than a destination.
 *
 * An alert queue is a state of the app, not a place in it, so the bell opens a
 * small card with the latest incidents and the live connection state. The full
 * notification settings (browser permission, alarm preferences, connection
 * detail) live on the Settings page; the card's footer links there and the old
 * `/notifications` route redirects, so no bookmark breaks.
 *
 * Behaviour matches the account menu's disclosure contract: Escape closes it,
 * an outside click closes it, focus moves into the card, and focus returns to
 * the bell so a keyboard user never loses their place.
 */

/** How many incidents the card lists before it stops being a summary. */
const RECENT_LIMIT = 3;

const AlertBell = ({ hasUnread = false }: { hasUnread?: boolean }) => {
  const {
    language,
    unreadIncidentCount,
    incidentLogs,
    acknowledgeIncidents,
    connectionState,
    isLive,
  } = useInsole();

  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    // Focus moves into the card so Escape and Tab act where the eye is.
    panelRef.current?.focus();

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !panelRef.current?.contains(target) &&
        !triggerRef.current?.contains(target)
      ) {
        setOpen(false);
      }
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

  const recent = incidentLogs.slice(-RECENT_LIMIT).reverse();
  const locale = language === "id" ? "id-ID" : "en-GB";
  const clock = (timestamp: number) =>
    Number.isFinite(timestamp)
      ? new Date(timestamp).toLocaleTimeString(locale, {
          hour: "2-digit",
          minute: "2-digit",
        })
      : t("common.notAvailable", language);

  const connectionLabel = isLive
    ? t("source.live", language)
    : connectionState === "connecting"
      ? t("source.connecting", language)
      : connectionState === "error"
        ? t("source.error", language)
        : t("source.idle", language);

  return (
    <div className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        data-testid="alert-bell"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={panelId}
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
      </button>

      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label={t("alerts.title", language)}
          tabIndex={-1}
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(20rem,calc(100vw-2rem))] rounded-tile border border-border-strong bg-surface p-3 shadow-lg"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-1 pb-2">
            <p className="text-body-sm font-bold text-fg">
              {t("alerts.title", language)}
            </p>
            <span className="text-caption text-muted">
              {t("alerts.unreadCount", language, { count: unreadIncidentCount })}
            </span>
          </div>

          <ul className="mt-2 space-y-1">
            {recent.length === 0 ? (
              <li className="px-1 py-2 text-body-sm text-muted">
                {t("alerts.empty", language)}
              </li>
            ) : (
              recent.map((incident) => (
                <li
                  key={`${incident.timestamp}-${incident.type}`}
                  className="flex items-center justify-between gap-2 rounded-control px-1 py-1.5"
                >
                  <StatusChip
                    level={incident.type}
                    label={t(`risk.${incident.type}`, language)}
                    size="sm"
                  />
                  <span className="tabular-data text-caption text-muted">
                    {clock(incident.timestamp)}
                  </span>
                </li>
              ))
            )}
          </ul>

          <p className="mt-2 flex items-center gap-1.5 border-t border-border px-1 pt-2 text-caption text-muted">
            <Radio className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {connectionLabel}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border px-1 pt-2">
            <GlassButton
              type="button"
              variant="quiet"
              onClick={() => acknowledgeIncidents()}
              disabled={unreadIncidentCount === 0}
            >
              <CheckCheck className="h-4 w-4" aria-hidden="true" />
              {t("alerts.markRead", language)}
            </GlassButton>
            <Link
              to="/settings"
              onClick={() => close(false)}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-control px-2 text-body-sm font-medium text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
            >
              <Settings2 className="h-4 w-4" aria-hidden="true" />
              {t("alerts.openSettings", language)}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export { AlertBell };
export default AlertBell;
