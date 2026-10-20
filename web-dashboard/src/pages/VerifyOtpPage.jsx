import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, MailCheck, ShieldCheck } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useInsole } from "../context/InsoleContext";
import { useOtpChallenge } from "../hooks/useOtpChallenge";
import { OTP_MAX_ATTEMPTS } from "../utils/otpChallenge";
import { t } from "../utils/i18n";
import {
  GlassButton,
  GlassInput,
  StatusBanner,
} from "../components/ui/GlassComponents";
import AuthShell from "../components/auth/AuthShell";
import OtpForm from "../components/auth/OtpForm";

/** Same shape check as the sign-in form. Firebase remains the authority. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX = 254;

const ERROR_KEYS = {
  required: "auth.otp.error.required",
  invalid: "auth.otp.error.invalid",
  expired: "auth.otp.error.expired",
  attempts: "auth.otp.error.attempts",
  missing: "auth.otp.error.missing",
  "missing-email": "auth.otp.error.missingEmail",
  "send-failed": "auth.otp.error.send",
  "not-configured": "auth.otp.error.notConfigured",
};

/**
 * VerifyOtpPage: the email confirmation step after registration.
 *
 * The signed-in account supplies the address, so a visitor cannot ask this page
 * to verify somebody else's mailbox. A visitor who arrives from a link may
 * supply an address once, and then the same code path runs.
 *
 * The OTP itself is a UX gate. The account is already protected by the Firebase
 * session; a deployment that needs verification to unlock privileges must set
 * that claim on a server, not in this page.
 */
const VerifyOtpPage = () => {
  const { language } = useInsole();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const accountEmail = String(user?.email || "")
    .trim()
    .toLowerCase();
  const queryEmail = String(searchParams.get("email") || "")
    .trim()
    .toLowerCase();

  const [email, setEmail] = useState(accountEmail || queryEmail);
  const [manualEmail, setManualEmail] = useState("");
  const [emailError, setEmailError] = useState(null);
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(Boolean(user?.emailVerified));

  useEffect(() => {
    if (accountEmail) setEmail(accountEmail);
  }, [accountEmail]);

  useEffect(() => {
    if (user?.emailVerified) setVerified(true);
  }, [user?.emailVerified]);

  const otp = useOtpChallenge({
    email,
    purpose: "register",
    autoSend: Boolean(email) && !verified,
  });

  const otpError = useMemo(() => {
    if (!otp.errorCode || otp.status === "error") return null;
    return t(ERROR_KEYS[otp.errorCode] || "auth.otp.error.invalid", language);
  }, [language, otp.errorCode, otp.status]);

  const handleEmailSubmit = (event) => {
    event.preventDefault();
    const clean = manualEmail.trim().toLowerCase();

    if (!clean) {
      setEmailError(t("auth.error.required", language));
      return;
    }
    if (clean.length > EMAIL_MAX || !EMAIL_PATTERN.test(clean)) {
      setEmailError(t("auth.error.email", language));
      return;
    }

    setEmailError(null);
    setEmail(clean);
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    const result = await otp.verify(code);
    if (result.ok) setVerified(true);
  };

  const handleResend = async () => {
    setCode("");
    await otp.send();
  };

  const handleChangeEmail = () => {
    otp.reset();
    setCode("");
    setVerified(false);
    setEmail("");
    setManualEmail("");
    setEmailError(null);
  };

  const handleSuccess = () => {
    navigate(user ? "/" : "/login");
  };

  const footer = (
    <p className="mt-5 text-center text-body-sm text-muted sm:mt-6">
      <Link
        to="/login"
        className="inline-flex min-h-[44px] items-center rounded-control px-2 font-medium text-primary underline underline-offset-2 transition-colors duration-150 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        {t("auth.otp.backToLogin", language)}
      </Link>
    </p>
  );

  if (verified) {
    return (
      <AuthShell
        language={language}
        title={t("auth.otp.successTitle", language)}
        subtitle={t("auth.otp.successBody", language)}
        footer={footer}
      >
        <div className="mt-6 rounded-card border border-safe/40 bg-safe/10 p-5">
          <CheckCircle2
            className="mx-auto h-10 w-10 text-safe-ink"
            aria-hidden="true"
          />
          <p className="mt-3 text-center text-body-sm text-fg-2">
            {t("auth.otp.successNote", language)}
          </p>
          <GlassButton
            type="button"
            variant="filled"
            className="mt-5 w-full"
            onClick={handleSuccess}
          >
            {user
              ? t("auth.otp.successCta", language)
              : t("auth.otp.successLogin", language)}
          </GlassButton>
        </div>
      </AuthShell>
    );
  }

  if (!email) {
    return (
      <AuthShell
        language={language}
        title={t("auth.otp.emailTitle", language)}
        subtitle={t("auth.otp.emailSubtitle", language)}
        footer={footer}
      >
        <form onSubmit={handleEmailSubmit} className="mt-6 space-y-4" noValidate>
          <GlassInput
            id="otp-email"
            type="email"
            inputMode="email"
            label={t("auth.field.email", language)}
            value={manualEmail}
            onChange={(event) => {
              setManualEmail(event.target.value);
              setEmailError(null);
            }}
            error={emailError}
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={EMAIL_MAX}
          />

          <GlassButton type="submit" variant="filled" className="w-full">
            <MailCheck className="h-4 w-4" aria-hidden="true" />
            {t("auth.otp.sendCode", language)}
          </GlassButton>
        </form>

        <p className="mt-4 flex items-start gap-2 text-body-sm text-muted">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t("auth.otp.secure", language)}</span>
        </p>
      </AuthShell>
    );
  }

  if (otp.status === "error") {
    const isConfig = otp.errorCode === "not-configured";
    const isMissing = otp.errorCode === "missing-email";

    return (
      <AuthShell
        language={language}
        title={t("auth.otp.title", language)}
        subtitle={t("auth.otp.subtitle", language)}
        footer={footer}
      >
        <StatusBanner
          tone="danger"
          className="mt-5"
          title={t(
            isConfig
              ? "auth.otp.error.notConfigured"
              : isMissing
                ? "auth.otp.error.missingEmail"
                : "auth.otp.error.send",
            language
          )}
          nextAction={t(
            isConfig
              ? "auth.otp.error.notConfiguredNext"
              : "auth.otp.error.sendNext",
            language
          )}
          action={
            !isConfig && !isMissing ? (
              <GlassButton
                type="button"
                variant="outline"
                size="sm"
                onClick={otp.send}
              >
                {t("common.retry", language)}
              </GlassButton>
            ) : undefined
          }
        />

        {!accountEmail && (
          <button
            type="button"
            onClick={handleChangeEmail}
            className="mt-4 inline-flex min-h-[44px] items-center rounded-control px-2 text-body-sm font-medium text-primary underline underline-offset-2 transition-colors duration-150 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            {t("auth.otp.changeEmail", language)}
          </button>
        )}
      </AuthShell>
    );
  }

  if (otp.status === "idle" || otp.status === "sending") {
    return (
      <AuthShell
        language={language}
        title={t("auth.otp.title", language)}
        subtitle={t("auth.otp.subtitle", language)}
        footer={footer}
      >
        <p className="mt-6 flex items-center gap-2 text-body-sm text-muted">
          <MailCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
          {t("auth.otp.sendingCode", language)}
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      language={language}
      title={t("auth.otp.title", language)}
      subtitle={t("auth.otp.subtitle", language)}
      footer={footer}
    >
      <OtpForm
        id="register-otp"
        language={language}
        email={email}
        code={code}
        onCodeChange={setCode}
        onSubmit={handleVerify}
        submitting={otp.status === "verifying"}
        error={otpError}
        attemptsLeft={otp.attemptsLeft}
        maxAttempts={OTP_MAX_ATTEMPTS}
        onResend={handleResend}
        resending={otp.status === "sending"}
        resendIn={otp.cooldown}
        onChangeEmail={accountEmail ? undefined : handleChangeEmail}
        submitLabel={t("auth.otp.verify", language)}
        submittingLabel={t("auth.otp.verifying", language)}
        expiresMinutes={otp.expiresMinutes}
        devCode={otp.devCode}
      />
    </AuthShell>
  );
};

export default VerifyOtpPage;
