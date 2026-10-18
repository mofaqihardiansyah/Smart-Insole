import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Info, ShieldCheck, UserPlus } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useInsole } from "../context/InsoleContext";
import { t } from "../utils/i18n";
import {
  GlassButton,
  GlassCard,
  GlassInput,
  StatusBanner,
} from "../components/ui/GlassComponents";

/** Matches the check on the login form; Firebase remains the authority. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

/**
 * RegisterPage: create an account.
 *
 * Deliberately the same card shape as the login page, because it is the same
 * task with one more field. Every field error is rendered as text under its own
 * field, so four problems can be fixed in one pass instead of four resubmits.
 */
const RegisterPage = () => {
  const { language } = useInsole();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const next = {};

    if (!name.trim()) next.name = t("auth.error.required", language);
    if (!email.trim()) {
      next.email = t("auth.error.required", language);
    } else if (!EMAIL_PATTERN.test(email.trim())) {
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    if (!validate()) return;

    setSubmitting(true);
    const result = await register(email.trim(), password, name.trim());
    setSubmitting(false);

    if (result.success) {
      navigate("/");
      return;
    }
    setFormError(result.error || t("auth.error.generic", language));
  };

  return (
    <section className="mx-auto flex w-full max-w-md flex-col justify-center py-6 md:py-12">
      <GlassCard className="md:p-7">
        <div className="mb-6 flex items-center gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-heading text-h4 text-fg">
              {t("app.title", language)}
            </p>
            <p className="text-body-sm text-muted">
              {t("app.tagline", language)}
            </p>
          </div>
        </div>

        <h1 className="font-heading text-h3 text-fg">
          {t("auth.register.title", language)}
        </h1>

        {formError && (
          <StatusBanner
            tone="danger"
            className="mt-4"
            title={formError}
            nextAction={t("common.nextStepCheckConnection", language)}
          />
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
          <GlassInput
            id="register-name"
            label={t("auth.field.name", language)}
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={fieldErrors.name}
            autoComplete="name"
          />

          <GlassInput
            id="register-email"
            type="email"
            label={t("auth.field.email", language)}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={fieldErrors.email}
            autoComplete="email"
          />

          <GlassInput
            id="register-password"
            type="password"
            label={t("auth.field.password", language)}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={fieldErrors.password}
            autoComplete="new-password"
          />

          <GlassInput
            id="register-confirm-password"
            type="password"
            label={t("auth.field.confirmPassword", language)}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={fieldErrors.confirmPassword}
            autoComplete="new-password"
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
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-1 border-t border-border pt-4 text-body-sm text-muted">
          <span>{t("auth.register.haveAccount", language)}</span>
          <Link
            to="/login"
            className="inline-flex min-h-[44px] items-center rounded-control px-2 font-medium text-primary underline underline-offset-2 transition-colors duration-150 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            {t("auth.register.login", language)}
          </Link>
        </div>
      </GlassCard>
    </section>
  );
};

export default RegisterPage;
