import React, { useEffect, useRef } from "react";
import { t } from "../../utils/i18n";

/**
 * OtpInput: six single-digit boxes that behave like one field.
 *
 * Typing advances, Backspace walks back, arrows move without editing, and a
 * pasted code fills from the box it was pasted into. The value is the compact
 * digit string, so a cleared middle box closes the gap rather than leaving a
 * hole the submit check would have to special-case.
 *
 * Each box has its own label ("Digit 3 of 6") because a screen reader that
 * hears six unlabelled text fields cannot tell the reader where they are. The
 * group carries the one label, and the first box carries `one-time-code` so
 * mobile autofill can offer the code.
 */
const OtpInput = ({
  id,
  value,
  onChange,
  length = 6,
  language,
  error,
  hint,
  disabled = false,
  autoFocus = false,
}) => {
  const refs = useRef([]);
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(" ");

  const digits = String(value || "").replace(/\D/g, "").slice(0, length);

  useEffect(() => {
    if (!autoFocus) return;
    const target = refs.current[Math.min(digits.length, length - 1)];
    target?.focus();
    // Only on mount: refocusing after every keystroke would fight the caret.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus]);

  const focusAt = (index) => {
    const bounded = Math.max(0, Math.min(length - 1, index));
    refs.current[bounded]?.focus();
    refs.current[bounded]?.select();
  };

  const writeDigits = (start, incoming) => {
    const clean = String(incoming || "").replace(/\D/g, "");
    if (!clean) return;

    const next =
      digits.slice(0, start) + clean + digits.slice(start + clean.length);
    const bounded = next.slice(0, length);
    onChange(bounded);
    focusAt(Math.min(start + clean.length, length - 1));
  };

  const handleChange = (index, raw) => {
    const clean = String(raw || "").replace(/\D/g, "");
    if (!clean) {
      onChange(digits.slice(0, index) + digits.slice(index + 1));
      return;
    }

    if (clean.length > 1) {
      writeDigits(index, clean);
      return;
    }

    const next = digits.slice(0, index) + clean + digits.slice(index + 1);
    onChange(next.slice(0, length));

    if (index < length - 1) focusAt(index + 1);
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      if (digits[index]) {
        onChange(digits.slice(0, index) + digits.slice(index + 1));
      } else if (index > 0) {
        onChange(digits.slice(0, index - 1) + digits.slice(index));
        focusAt(index - 1);
      }
      return;
    }

    if (event.key === "Delete") {
      event.preventDefault();
      onChange(digits.slice(0, index) + digits.slice(index + 1));
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusAt(index - 1);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusAt(index + 1);
    }
  };

  const handlePaste = (index, event) => {
    const pasted = event.clipboardData?.getData("text") || "";
    if (!pasted.replace(/\D/g, "")) return;
    event.preventDefault();
    writeDigits(index, pasted);
  };

  return (
    <div>
      <div
        role="group"
        aria-label={t("auth.otp.groupLabel", language)}
        aria-describedby={describedBy || undefined}
        className="flex items-center gap-2 sm:gap-2.5"
      >
        {Array.from({ length }, (_, index) => (
          <input
            key={index}
            ref={(node) => {
              refs.current[index] = node;
            }}
            id={`${id}-${index}`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digits[index] || ""}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={(event) => handlePaste(index, event)}
            onFocus={(event) => event.target.select()}
            disabled={disabled}
            autoComplete={index === 0 ? "one-time-code" : "off"}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-label={t("auth.otp.digit", language, {
              index: index + 1,
              total: length,
            })}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy || undefined}
            className={[
              "h-12 w-9 shrink-0 rounded-control border bg-surface text-center",
              "font-data text-card-title text-fg caret-primary",
              "transition-colors duration-150 sm:h-14 sm:w-12",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
              error
                ? "border-danger"
                : "border-border-control hover:border-primary focus:border-primary",
              "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted",
            ].join(" ")}
          />
        ))}
      </div>

      {hint && !error && (
        <p id={hintId} className="mt-2 text-body-sm text-muted">
          {hint}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-2 text-body-sm font-medium text-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default OtpInput;
