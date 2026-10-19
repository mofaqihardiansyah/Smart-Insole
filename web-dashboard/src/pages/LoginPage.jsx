import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInAnonymously } from "firebase/auth";
import { LogIn, ShieldCheck, UserRound } from "lucide-react";
import { auth } from "../services/firebaseConfig";
import { useAuth } from "../hooks/useAuth";
import { useInsole } from "../context/InsoleContext";
import { t } from "../utils/i18n";
import {
  GlassButton,
  GlassCard,
  GlassInput,
  StatusBanner,
} from "../components/ui/GlassComponents";

/**
 * The shape check is client-side only. It rejects an address that cannot be
 * delivered to, and leaves the real verdict to Firebase, which is the only
 * party that knows whether the account exists.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * LoginPage: sign in, or continue anonymously.
 *
 * The page is a free-standing card with no PageHeader, because there is no
 * signed-in context around it: the card is the whole screen, and its one
 * focal point is the submit button.
 *
 * Feedback is inline. Field errors sit under their field through GlassInput's
 * `error`, and anything the auth service rejects lands in a danger
 * StatusBanner. No blocking browser dialog is used anywhere.
 */
const LoginPage = () => {
  const { language } = useInsole();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const next = {};
    if (!email.trim()) {
      next.email = t("auth.error.required", language);
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      next.email = t("auth.error.email", language);
    }
    if (!password) next.password = t("auth.error.required", language);
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    if (!validate()) return;

    setSubmitting(true);
    const result = await login(email.trim(), password);
    setSubmitting(false);

    if (result.success) {
      navigate("/");
      return;
    }

    // Firebase messages are technical and English. They are kept as the detail
    // with a translated fallback when the service returns nothing.
    setFormError(result.error || t("auth.error.generic", language));
  };

  const handleGuest = async () => {
    setFormError("");
    setSubmitting(true);
    try {
      await signInAnonymously(auth);
      navigate("/");
    } catch {
      setFormError(t("auth.login.guestFailed", language));
    } finally {
      setSubmitting(false);
    }
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

        {/* Page h1 on the smallest pages: one step above the 20px card-title
            chrome, so the page heading never ties with a panel heading. */}
        <h1 className="font-heading text-h2 text-fg">
          {t("auth.login.title", language)}
        </h1>
        <p className="mt-1.5 text-body-sm text-muted">
          {t("auth.login.subtitle", language)}
        </p>

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
            id="login-email"
            type="email"
            label={t("auth.field.email", language)}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={fieldErrors.email}
            autoComplete="email"
          />

          <GlassInput
            id="login-password"
            type="password"
            label={t("auth.field.password", language)}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={fieldErrors.password}
            autoComplete="current-password"
          />

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

        <GlassButton
          type="button"
          variant="outline"
          className="mt-3 w-full"
          onClick={handleGuest}
          disabled={submitting}
        >
          <UserRound className="h-4 w-4" aria-hidden="true" />
          {t("auth.login.guest", language)}
        </GlassButton>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-1 border-t border-border pt-4 text-body-sm text-muted">
          <span>{t("auth.login.noAccount", language)}</span>
          <Link
            to="/register"
            className="inline-flex min-h-[44px] items-center rounded-control px-2 font-medium text-primary underline underline-offset-2 transition-colors duration-150 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            {t("auth.login.register", language)}
          </Link>
        </div>
      </GlassCard>
    </section>
  );
};

export default LoginPage;
