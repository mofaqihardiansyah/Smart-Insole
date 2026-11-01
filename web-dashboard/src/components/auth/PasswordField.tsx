import React, { useState } from "react";
import type { InputHTMLAttributes, KeyboardEvent, ReactNode } from "react";
import { AlertTriangle, Eye, EyeOff } from "lucide-react";
import { GlassInput } from "../ui/GlassInput";
import { t } from "../../utils/i18n";

/**
 * PasswordField: the password input with a reveal control and a Caps Lock
 * note.
 *
 * The reveal button keeps focus in the field on pointer down, because the
 * common failure of a show-password toggle is that clicking it moves the caret
 * out of the field the user was typing in. Caps Lock is read from the keyboard
 * event rather than guessed from the characters, so the note appears the moment
 * the key is on.
 */

interface PasswordFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "children"> {
  /** Visible label above the field. */
  label?: ReactNode;
  language?: string;
  hint?: ReactNode;
  error?: ReactNode;
}

const PasswordField = ({
  id,
  label,
  language,
  hint,
  error,
  value,
  onChange,
  autoComplete,
  ...props
}: PasswordFieldProps) => {
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const readCaps = (event: KeyboardEvent<HTMLInputElement>) => {
    if (typeof event.getModifierState === "function") {
      setCapsLock(event.getModifierState("CapsLock"));
    }
  };

  return (
    <div>
      <GlassInput
        id={id}
        type={visible ? "text" : "password"}
        label={label}
        value={value}
        onChange={onChange}
        error={error}
        hint={hint}
        autoComplete={autoComplete}
        onKeyDown={readCaps}
        onKeyUp={readCaps}
        onBlur={() => setCapsLock(false)}
        trailing={
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setVisible((shown) => !shown)}
            aria-label={t(
              visible
                ? "auth.field.hidePassword"
                : "auth.field.showPassword",
              language
            )}
            aria-pressed={visible}
            className="flex h-11 w-11 items-center justify-center rounded-control text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-surface"
          >
            {visible ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        }
        {...props}
      />

      {capsLock && (
        <p className="mt-1.5 flex items-center gap-1.5 text-body-sm font-medium text-warning-ink">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {t("auth.password.caps", language)}
        </p>
      )}
    </div>
  );
};

export default PasswordField;
