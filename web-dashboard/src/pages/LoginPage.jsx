import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useInsole } from "../context/InsoleContext";
import { t } from "../utils/i18n";
import { authErrorCopy } from "../utils/authErrors";
import {
  GlassButton,
  GlassInput,
  StatusBanner,
} from "../components/ui/GlassComponents";
import AuthShell from "../components/auth/AuthShell";
import PasswordField from "../components/auth/PasswordField";

/**
 * The shape check is client-side only. It rejects an address that cannot be
 * delivered to, and leaves the real verdict to Firebase, which is the only
 * party that knows whether the account exists.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX = 254;
const PASSWORD_MAX = 128;

/**
 * LoginPage: sign in.
 *
 * Failures never surface Firebase's message. For login, a missing account and
 * a wrong password both say "email or password is incorrect", because telling
 * the two apart hands an attacker a list of valid addresses. The copy for each
 * Firebase code, and the next step beside it, lives in `utils/authErrors.js`.
 */
const LoginPage = () => {
  const { language } = useInsole();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const clearFieldError = (field) => {
    setFormError(null);
    setFieldErrors((current) =>
      current[field] ? { ...current, [field]: undefined } : current
    );
  };

  const validate = () => {
    const next = {};
    const address = email.trim();

    if (!address) {
      next.email = t("auth.error.required", language);
    } else if (address.length > EMAIL_MAX || !EMAIL_PATTERN.test(address)) {
      next.email = t("auth.error.email", language);
    }
    if (!password) next.password = t("auth.error.required", language);

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    setFormError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const result = await login(email.trim().toLowerCase(), password);

      if (result.success) {
        navigate("/");
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

  return (
    <AuthShell
      language={language}
      title={t("auth.login.title", language)}
      subtitle={t("auth.login.subtitle", language)}
      footer={
        <p className="mt-5 text-center text-body-sm text-muted sm:mt-6">
          {t("auth.login.noAccount", language)}{" "}
          <Link
            to="/register"
            className="inline-flex min-h-[44px] items-center rounded-control px-2 font-medium text-primary underline underline-offset-2 transition-colors duration-150 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            {t("auth.login.register", language)}
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
          id="login-email"
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
            id="login-password"
            label={t("auth.field.password", language)}
            language={language}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              clearFieldError("password");
            }}
            error={fieldErrors.password}
            autoComplete="current-password"
            maxLength={PASSWORD_MAX}
          />

          <div className="-mt-1 flex justify-end">
            <Link
              to="/forgot-password"
              className="inline-flex min-h-[44px] items-center rounded-control px-2 text-body-sm font-medium text-primary underline underline-offset-2 transition-colors duration-150 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              {t("auth.forgot.title", language)}
            </Link>
          </div>
        </div>

        <p className="text-body-sm text-muted">
          {t("auth.login.secure", language)}
        </p>

        <GlassButton
          type="submit"
          variant="filled"
          className="w-full"
          disabled={submitting}
        >
          <LogIn className="h-4 w-4" aria-hidden="true" />
          {submitting
            ? t("auth.login.submitting", language)
            : t("auth.login.submit", language)}
        </GlassButton>
      </form>
    </AuthShell>
  );
};

export default LoginPage;
