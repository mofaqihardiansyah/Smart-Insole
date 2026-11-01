import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Info, UserPlus } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useInsole } from "../context/InsoleContext";
import { t } from "../utils/i18n";
import { authErrorCopy } from "../utils/authErrors";
import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
} from "../utils/passwordStrength";
import {
  GlassButton,
  GlassInput,
  StatusBanner,
} from "../components/ui/GlassComponents";
import AuthShell from "../components/auth/AuthShell";
import PasswordField from "../components/auth/PasswordField";
import PasswordStrength from "../components/auth/PasswordStrength";

/** Which fields failed validation, and the localised message for each. */
interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

/** A cause and a next step for the danger banner. */
interface BannerCopy {
  message: string;
  next: string;
}

/** Matches the check on the login form; Firebase remains the authority. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX = 254;
const NAME_MAX = 80;

/**
 * RegisterPage: create an account.
 *
 * The length floor is the only requirement, and it is eight characters rather
 * than six: length is what actually resists guessing. The meter below the field
 * advises variety and names what is missing, but never turns a long passphrase
 * into a failed submit. Field errors are inline so four problems are answered
 * in one pass instead of four resubmits.
 */
const RegisterPage = () => {
  const { language } = useInsole();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<BannerCopy | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const clearFieldError = (field: keyof FieldErrors) => {
    setFormError(null);
    setFieldErrors((current) =>
      current[field] ? { ...current, [field]: undefined } : current
    );
  };

  const validate = () => {
    const next: FieldErrors = {};
    const displayName = name.trim();
    const address = email.trim();

    if (!displayName) {
      next.name = t("auth.error.required", language);
    } else if (displayName.length > NAME_MAX) {
      next.name = t("auth.error.nameLength", language);
    }

    if (!address) {
      next.email = t("auth.error.required", language);
    } else if (address.length > EMAIL_MAX || !EMAIL_PATTERN.test(address)) {
      next.email = t("auth.error.email", language);
    }

    if (!password) {
      next.password = t("auth.error.required", language);
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      next.password = t("auth.error.passwordLength", language);
    }

    if (!confirmPassword) {
      next.confirmPassword = t("auth.error.required", language);
    } else if (confirmPassword !== password) {
      next.confirmPassword = t("auth.error.passwordMismatch", language);
    }

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    setFormError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const result = await register(
        email.trim().toLowerCase(),
        password,
        name.trim()
      );

      if (result.success) {
        // The account exists but is not verified yet. Send the reader to the
        // page that explains the link Firebase has just mailed them.
        navigate("/verify-email", { replace: true });
        return;
      }

      const copy = authErrorCopy(result.code);
      setFormError({
        message: t(copy.message, language),
        next: t(copy.next, language),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const passwordHint = password
    ? undefined
    : t("auth.field.passwordHint", language);

  const confirmHint =
    confirmPassword && confirmPassword === password && !fieldErrors.confirmPassword
      ? t("auth.password.match", language)
      : undefined;

  return (
    <AuthShell
      language={language}
      title={t("auth.register.title", language)}
      subtitle={t("auth.register.subtitle", language)}
      footer={
        <p className="mt-5 text-center text-body-sm text-muted sm:mt-6">
          {t("auth.register.haveAccount", language)}{" "}
          <Link
            to="/login"
            className="inline-flex min-h-[44px] items-center rounded-control px-2 font-medium text-primary underline underline-offset-2 transition-colors duration-150 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            {t("auth.register.login", language)}
          </Link>
        </p>
      }
    >
      {formError && (
        <StatusBanner
          tone="danger"
          className="mt-5"
          title={formError.message}
          nextAction={formError.next}
        />
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4"
        aria-busy={submitting}
        noValidate
      >
        <GlassInput
          id="register-name"
          label={t("auth.field.name", language)}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            clearFieldError("name");
          }}
          error={fieldErrors.name}
          autoComplete="name"
          maxLength={NAME_MAX}
        />

        <GlassInput
          id="register-email"
          type="email"
          inputMode="email"
          label={t("auth.field.email", language)}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            clearFieldError("email");
          }}
          error={fieldErrors.email}
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={EMAIL_MAX}
        />

        <div>
          <PasswordField
            id="register-password"
            label={t("auth.field.password", language)}
            language={language}
            value={password}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setPassword(event.target.value);
              clearFieldError("password");
            }}
            error={fieldErrors.password}
            hint={passwordHint}
            autoComplete="new-password"
            maxLength={MAX_PASSWORD_LENGTH}
          />
          <PasswordStrength password={password} language={language} />
        </div>

        <PasswordField
          id="register-confirm-password"
          label={t("auth.field.confirmPassword", language)}
          language={language}
          value={confirmPassword}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setConfirmPassword(event.target.value);
            clearFieldError("confirmPassword");
          }}
          error={fieldErrors.confirmPassword}
          hint={confirmHint}
          autoComplete="new-password"
          maxLength={MAX_PASSWORD_LENGTH}
        />

        <p className="flex items-start gap-2 text-body-sm text-muted">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t("auth.register.verification", language)}</span>
        </p>

        <GlassButton
          type="submit"
          variant="filled"
          className="w-full"
          disabled={submitting}
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          {submitting
            ? t("auth.register.submitting", language)
            : t("auth.register.submit", language)}
        </GlassButton>

        <p className="flex items-start gap-2 text-body-sm text-muted">
          <img
            src="/icon.svg"
            alt=""
            aria-hidden="true"
            className="h-5 w-5 shrink-0"
          />
          <span>{t("auth.register.secure", language)}</span>
        </p>
      </form>
    </AuthShell>
  );
};

export default RegisterPage;
