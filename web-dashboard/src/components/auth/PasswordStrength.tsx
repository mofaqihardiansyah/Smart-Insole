import React from "react";
import { t } from "../../utils/i18n";
import { evaluatePassword } from "../../utils/passwordStrength";

/**
 * PasswordStrength: the hint under a new password.
 *
 * The bar carries a label, not colour alone, and the label is the live region:
 * a screen reader hears "fair" when the verdict changes, without hearing every
 * keypress as a new announcement. Hints are capped at two by the evaluator, so
 * the field never grows a wall of rules.
 */

const TONE = [
  "text-danger",
  "text-danger",
  "text-warning-ink",
  "text-safe-ink",
  "text-safe-ink",
];

const BAR = [
  "bg-danger",
  "bg-danger",
  "bg-warning",
  "bg-safe",
  "bg-safe",
];

interface PasswordStrengthProps {
  password?: string;
  language?: string;
}

const PasswordStrength = ({
  password,
  language,
}: PasswordStrengthProps) => {
  if (!password) return null;

  const { score, labelKey, hints } = evaluatePassword(password);

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-body-sm text-muted">
          {t("auth.password.label", language)}
        </p>
        <p
          aria-live="polite"
          className={`text-body-sm font-semibold ${TONE[score]}`}
        >
          {t(labelKey, language)}
        </p>
      </div>

      <div className="mt-1.5 grid grid-cols-4 gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((step) => (
          <span
            key={step}
            className={`h-1.5 rounded-full ${
              step < score ? BAR[score] : "bg-surface-3"
            }`}
          />
        ))}
      </div>

      {hints.length > 0 && (
        <ul className="mt-1.5 space-y-0.5">
          {hints.map((hint) => (
            <li key={hint.key} className="text-body-sm text-muted">
              {t(hint.key, language, hint.vars)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PasswordStrength;
