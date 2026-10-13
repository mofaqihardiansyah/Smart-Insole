import React, { useEffect, useRef } from "react";
import { AlertTriangle, AlertOctagon, Volume2, VolumeX } from "lucide-react";
import { GlassButton } from "../ui/GlassButton";

/**
 * AlertModal — the early warning dialog.
 *
 * Replaces the previous `alert()` call. A native alert is unusable here: it
 * blocks the page the message is about, cannot be reached by a screen reader in
 * context, and cannot offer the mute control that belongs beside it.
 *
 * This is a real dialog:
 * - `role="alertdialog"` with `aria-modal`, so assistive technology announces it
 *   as urgent rather than as ordinary content.
 * - Focus moves into the dialog on open and returns to the trigger on close.
 * - Tab is trapped inside while open; Escape closes.
 * - Body scroll is locked so the background cannot drift behind it.
 * - It is NOT dismissible by clicking the backdrop. A pressure warning takes a
 *   deliberate action to clear; dismissing it by accident is the one failure
 *   this dialog exists to prevent.
 */
const AlertModal = ({
  open = false,
  level = "warning",
  title,
  body,
  advice,
  dismissLabel,
  muteLabel,
  unmuteLabel,
  isMuted = false,
  onToggleMute,
  onDismiss,
}) => {
  const dialogRef = useRef(null);
  const dismissRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    previouslyFocused.current =
      typeof document !== "undefined" ? document.activeElement : null;

    dismissRef.current?.focus?.();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onDismiss?.();
        return;
      }
      if (event.key !== "Tab") return;

      const focusables = dialogRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
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
  }, [open, onDismiss]);

  if (!open) return null;

  const isDanger = level === "danger";
  const Icon = isDanger ? AlertOctagon : AlertTriangle;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-scrim/80 p-4 sm:items-center">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-modal-title"
        aria-describedby="alert-modal-body"
        className={`w-full max-w-md rounded-card border-2 bg-surface shadow-overlay ${
          isDanger ? "border-danger" : "border-warning"
        }`}
      >
        <div className="flex items-start gap-3 p-5">
          {/* Risk is carried by the icon shape and the title text, so no
              separate colour-only badge is needed. */}
          <span
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control ${
              isDanger
                ? "bg-danger/15 text-danger-ink"
                : "bg-warning/15 text-warning-ink"
            }`}
            aria-hidden="true"
          >
            <Icon className="h-6 w-6" />
          </span>

          <div className="min-w-0 flex-1">
            <h2
              id="alert-modal-title"
              className="font-heading text-h4 font-semibold text-fg"
            >
              {title}
            </h2>
            <p id="alert-modal-body" className="mt-2 text-body-sm text-fg">
              {body}
            </p>
            {advice && (
              <p className="tabular-data mt-2 text-body-sm text-muted">{advice}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border p-5">
          {onToggleMute && (
            <GlassButton
              variant="quiet"
              onClick={onToggleMute}
              aria-pressed={isMuted}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Volume2 className="h-4 w-4" aria-hidden="true" />
              )}
              {isMuted ? unmuteLabel : muteLabel}
            </GlassButton>
          )}

          <GlassButton
            ref={dismissRef}
            variant={isDanger ? "danger" : "filled"}
            onClick={onDismiss}
          >
            {dismissLabel}
          </GlassButton>
        </div>
      </div>
    </div>
  );
};

export { AlertModal };
export default AlertModal;
