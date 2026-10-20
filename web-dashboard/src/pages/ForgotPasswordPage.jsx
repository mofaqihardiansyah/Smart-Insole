import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  confirmPasswordReset,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
} from "firebase/auth";
import { CheckCircle2, MailCheck, ShieldCheck } from "lucide-react";
import { auth } from "../services/firebaseConfig";
import { useInsole } from "../context/InsoleContext";
import { useOtpChallenge } from "../hooks/useOtpChallenge";
import { OTP_MAX_ATTEMPTS } from "../utils/otpChallenge";
import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
} from "../utils/passwordStrength";
import { authErrorCopy } from "../utils/authErrors";
import { t } from "../utils/i18n";
import {
  GlassButton,
  GlassInput,
  StatusBanner,
} from "../components/ui/GlassComponents";
import AuthShell from "../components/auth/AuthShell";
import AuthSteps from "../components/auth/AuthSteps";
import OtpForm from "../components/auth/OtpForm";
import PasswordField from "../components/auth/PasswordField";
import PasswordStrength from "../components/auth/PasswordStrength";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX = 254;
const LINK_RESEND_SECONDS = 60;

const OTP_ERROR_KEYS = {
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
 * ForgotPasswordPage: prove the address, then let Firebase reset the password.
 *
 * The journey is deliberately three stops:
 *
 *   1. address       - where the code and the reset link go;
 *   2. code          - a six digit code sent to that address;
 *   3. new password  - the page Firebase's reset link opens.
 *
 * The OTP is a UX gate, not the authority. After the code matches, this page
 * asks Firebase to mint its own single-use reset link. The link is what can
 * actually change the password, and it is still delivered only to the account
 * address. A visitor who skips the code in their own browser gains nothing:
 * they still cannot receive that link. This is also why an unknown address gets
 * the same confirmation as a known one.
 */
const ForgotPasswordPage = () => {
  const { language } = useInsole();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const oobCode = searchParams.get("oobCode") || "";
  const mode = searchParams.get("mode") || "";

  const [step, setStep] = useState(
    oobCode ? "reset" : mode === "resetSuccess" ? "resetSuccess" : "email"
  );
  const [email, setEmail] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [emailError, setEmailError] = useState(null);
  const [code, setCode] = useState("");

  const [linkSending, setLinkSending] = useState(false);
  const [linkCooldown, setLinkCooldown] = useState(0);
  const [linkError, setLinkError] = useState(null);
  const [linkNotice, setLinkNotice] = useState(false);

  const [resetEmail, setResetEmail] = useState("");
  const [resetState, setResetState] = useState("checking");
  const [resetError, setResetError] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  /* A reset link is the authority for this page. Check it before showing a
     password field, so an expired link fails with an explanation rather than
     after the person has typed a new password. */
  useEffect(() => {
    if (!oobCode) {
      if (mode === "resetSuccess") setStep("resetSuccess");
      return undefined;
    }

    let active = true;
    setStep("reset");
    setResetState("checking");
    setResetError(null);

    verifyPasswordResetCode(auth, oobCode)
      .then((accountEmail) => {
        if (!active) return;
        setResetEmail(accountEmail || "");
        setResetState("ready");
      })
      .catch(() => {
        if (!active) return;
        setResetState("invalid");
      });

    return () => {
      active = false;
    };
  }, [oobCode, mode]);

  useEffect(() => {
    if (linkCooldown <= 0) return undefined;
    const timer = setTimeout(
      () => setLinkCooldown((current) => Math.max(0, current - 1)),
      1000
    );
    return () => clearTimeout(timer);
  }, [linkCooldown]);

  const otp = useOtpChallenge({
    email,
    purpose: "reset",
    autoSend: Boolean(email) && step === "otp",
  });

  const otpError = useMemo(() => {
    if (!otp.errorCode || otp.status === "error") return null;
    return t(OTP_ERROR_KEYS[otp.errorCode] || "auth.otp.error.invalid", language);
  }, [language, otp.errorCode, otp.status]);

  const sendResetLink = async ({ announce = false } = {}) => {
    if (!email || linkSending) return;
    if (linkCooldown > 0) return;

    setLinkSending(true);
    setLinkError(null);
    setLinkNotice(false);

    const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
    const continueUrl = `${window.location.origin}${base}/forgot-password?mode=resetPassword`;
    const actionCodeSettings = {
      url: continueUrl,
      handleCodeInApp: false,
    };

    try {
      try {
        await sendPasswordResetEmail(auth, email, actionCodeSettings);
      } catch (error) {
        // A deployment that has not whitelisted the continue URL can still
        // send the Firebase-hosted reset page. The account owner gets a working
        // link either way.
        if (error?.code === "auth/unauthorized-continue-uri") {
          await sendPasswordResetEmail(auth, email);
        } else {
          throw error;
        }
      }

      setLinkCooldown(LINK_RESEND_SECONDS);
      if (announce) setLinkNotice(true);
    } catch (error) {
      // An unknown address must not become an account-enumeration oracle.
      if (error?.code === "auth/user-not-found") {
        setLinkCooldown(LINK_RESEND_SECONDS);
        if (announce) setLinkNotice(true);
        return;
      }

      const copy = authErrorCopy(error?.code);
      setLinkError({
        message: t(copy.message, language),
        next: t(copy.next, language),
      });
      setLinkCooldown(0);
    } finally {
      setLinkSending(false);
    }
  };

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
    setStep("otp");
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    const result = await otp.verify(code);
    if (!result.ok) return;

    setStep("link");
    await sendResetLink();
  };

  const handleResendCode = async () => {
    setCode("");
    await otp.send();
  };

  const handleChangeEmail = () => {
    otp.reset();
    setStep("email");
    setEmail("");
    setManualEmail("");
    setCode("");
    setLinkError(null);
    setLinkNotice(false);
    setLinkCooldown(0);
  };

  const resetAll = () => {
    otp.reset();
    setStep("email");
    setEmail("");
    setManualEmail("");
    setCode("");
    setEmailError(null);
    setLinkError(null);
    setLinkNotice(false);
    setLinkCooldown(0);
    setResetEmail("");
    setResetState("checking");
    setResetError(null);
    setPassword("");
    setConfirmPassword("");
    setFieldErrors({});
    navigate("/forgot-password", { replace: true });
  };

  const handleResetSubmit = async (event) => {
    event.preventDefault();
    if (resetting) return;

    const next = {};
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
    if (Object.keys(next).length > 0) return;

    setResetting(true);
    setResetError(null);

    try {
      await confirmPasswordReset(auth, oobCode, password);
      setStep("resetSuccess");
      setPassword("");
      setConfirmPassword("");
      navigate("/forgot-password?mode=resetSuccess", { replace: true });
    } catch (error) {
      if (
        error?.code === "auth/expired-action-code" ||
        error?.code === "auth/invalid-action-code"
      ) {
        setResetState("invalid");
        return;
      }

      if (error?.code === "auth/weak-password") {
        setFieldErrors({
          password: t("auth.error.weakPassword", language),
        });
        return;
      }

      const copy = authErrorCopy(error?.code);
      setResetError({
        message: t(copy.message, language),
        next: t(copy.next, language),
      });
    } finally {
      setResetting(false);
    }
  };

  let title = t("auth.forgot.title", language);
  let subtitle = t("auth.forgot.subtitle", language);
  let stepKey = "email";

  if (step === "otp") {
    title = t("auth.forgot.otpTitle", language);
    subtitle = t("auth.forgot.otpSubtitle", language, { email });
    stepKey = "code";
  } else if (step === "link") {
    title = t("auth.forgot.linkTitle", language);
    subtitle = t("auth.forgot.linkBody", language, { email });
    stepKey = "password";
  } else if (step === "reset") {
    stepKey = "password";
    if (resetState === "invalid") {
      title = t("auth.forgot.resetInvalid", language);
      subtitle = t("auth.forgot.resetInvalidNext", language);
    } else if (resetState === "checking") {
      title = t("auth.forgot.resetTitle", language);
      subtitle = t("auth.forgot.resetPreparing", language);
    } else {
      title = t("auth.forgot.resetTitle", language);
      subtitle = t("auth.forgot.resetSubtitle", language, {
        email: resetEmail || email,
      });
    }
  } else if (step === "resetSuccess") {
    title = t("auth.forgot.resetSuccessTitle", language);
    subtitle = t("auth.forgot.resetSuccessBody", language);
    stepKey = "password";
  }

  const footer = (
    <p className="mt-5 text-center text-body-sm text-muted">
      {t("auth.forgot.haveAccount", language)}{" "}
      <Link
        to="/login"
        className="inline-flex min-h-[44px] items-center rounded-control px-2 font-medium text-primary underline underline-offset-2 transition-colors duration-150 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        {t("auth.forgot.login", language)}
      </Link>
    </p>
  );

  const steps = <AuthSteps language={language} current={stepKey} />;

  if (step === "resetSuccess") {
    return (
      <AuthShell
        language={language}
        title={title}
        subtitle={subtitle}
        footer={footer}
      >
        <div className="mt-6 rounded-card border border-safe/40 bg-safe/10 p-5">
          <CheckCircle2
            className="mx-auto h-10 w-10 text-safe-ink"
            aria-hidden="true"
          />
          <GlassButton
            type="button"
            variant="filled"
            className="mt-5 w-full"
            onClick={() => navigate("/login")}
          >
            {t("auth.forgot.backToLogin", language)}
          </GlassButton>
        </div>
      </AuthShell>
    );
  }

  if (step === "reset") {
    return (
      <AuthShell
        language={language}
        title={title}
        subtitle={subtitle}
        footer={footer}
      >
        {steps}

        {resetState === "checking" && (
          <p className="mt-2 flex items-center gap-2 text-body-sm text-muted">
            <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t("auth.forgot.resetChecking", language)}
          </p>
        )}

        {resetState === "invalid" && (
          <StatusBanner
            tone="danger"
            className="mt-2"
            title={t("auth.forgot.resetInvalid", language)}
            action={
              <GlassButton
                type="button"
                variant="outline"
                size="sm"
                onClick={resetAll}
              >
                {t("auth.forgot.restart", language)}
              </GlassButton>
            }
          />
        )}

        {resetState === "ready" && (
          <>
            {resetError && (
              <StatusBanner
                tone="danger"
                className="mt-2"
                title={resetError.message}
                nextAction={resetError.next}
              />
            )}

            <form
              onSubmit={handleResetSubmit}
              className="mt-5 space-y-4"
              noValidate
              aria-busy={resetting}
            >
              <div>
                <PasswordField
                  id="reset-password"
                  label={t("auth.field.password", language)}
                  language={language}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setFieldErrors((current) => ({
                      ...current,
                      password: undefined,
                    }));
                  }}
                  error={fieldErrors.password}
                  hint={
                    password
                      ? undefined
                      : t("auth.field.passwordHint", language)
                  }
                  autoComplete="new-password"
                  maxLength={MAX_PASSWORD_LENGTH}
                />
                <PasswordStrength password={password} language={language} />
              </div>

              <PasswordField
                id="reset-confirm-password"
                label={t("auth.field.confirmPassword", language)}
                language={language}
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setFieldErrors((current) => ({
                    ...current,
                    confirmPassword: undefined,
                  }));
                }}
                error={fieldErrors.confirmPassword}
                hint={
                  confirmPassword && confirmPassword === password
                    ? t("auth.password.match", language)
                    : undefined
                }
                autoComplete="new-password"
                maxLength={MAX_PASSWORD_LENGTH}
              />

              <GlassButton
                type="submit"
                variant="filled"
                className="w-full"
                disabled={resetting}
              >
                {resetting
                  ? t("auth.forgot.resetting", language)
                  : t("auth.forgot.resetSubmit", language)}
              </GlassButton>
            </form>
          </>
        )}
      </AuthShell>
    );
  }

  if (step === "link") {
    return (
      <AuthShell
        language={language}
        title={title}
        subtitle={subtitle}
        footer={footer}
      >
        {steps}

        <div className="mt-2 rounded-card border border-border-strong bg-surface-2 p-5">
          <MailCheck
            className="mx-auto h-9 w-9 text-primary"
            aria-hidden="true"
          />
          <p className="mt-3 text-center text-body-sm text-fg-2">
            {t("auth.forgot.linkNote", language)}
          </p>
        </div>

        {linkError && (
          <StatusBanner
            tone="danger"
            className="mt-4"
            title={linkError.message}
            nextAction={linkError.next}
          />
        )}

        {linkNotice && (
          <StatusBanner
            tone="success"
            className="mt-4"
            title={t("auth.forgot.linkSent", language)}
          />
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <GlassButton
            type="button"
            variant="outline"
            className="w-full sm:flex-1"
            onClick={() => sendResetLink({ announce: true })}
            disabled={linkSending || linkCooldown > 0}
          >
            <MailCheck className="h-4 w-4" aria-hidden="true" />
            {linkCooldown > 0
              ? t("auth.otp.resendIn", language, { seconds: linkCooldown })
              : linkSending
                ? t("auth.forgot.resendingLink", language)
                : t("auth.forgot.resendLink", language)}
          </GlassButton>

          <GlassButton
            type="button"
            variant="ghost"
            className="w-full sm:flex-1"
            onClick={resetAll}
          >
            {t("auth.forgot.restart", language)}
          </GlassButton>
        </div>
      </AuthShell>
    );
  }

  if (step === "otp") {
    if (otp.status === "error") {
      const isConfig = otp.errorCode === "not-configured";
      const isMissing = otp.errorCode === "missing-email";

      return (
        <AuthShell
          language={language}
          title={title}
          subtitle={subtitle}
          footer={footer}
        >
          {steps}
          <StatusBanner
            tone="danger"
            className="mt-2"
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

          <button
            type="button"
            onClick={handleChangeEmail}
            className="mt-4 inline-flex min-h-[44px] items-center rounded-control px-2 text-body-sm font-medium text-primary underline underline-offset-2 transition-colors duration-150 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            {t("auth.otp.changeEmail", language)}
          </button>
        </AuthShell>
      );
    }

    if (otp.status === "idle" || otp.status === "sending") {
      return (
        <AuthShell
          language={language}
          title={title}
          subtitle={subtitle}
          footer={footer}
        >
          {steps}
          <p className="mt-2 flex items-center gap-2 text-body-sm text-muted">
            <MailCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t("auth.otp.sendingCode", language)}
          </p>
        </AuthShell>
      );
    }

    return (
      <AuthShell
        language={language}
        title={title}
        subtitle={subtitle}
        footer={footer}
      >
        {steps}
        <OtpForm
          id="reset-otp"
          language={language}
          email={email}
          code={code}
          onCodeChange={setCode}
          onSubmit={handleVerify}
          submitting={otp.status === "verifying"}
          error={otpError}
          attemptsLeft={otp.attemptsLeft}
          maxAttempts={OTP_MAX_ATTEMPTS}
          onResend={handleResendCode}
          resending={otp.status === "sending"}
          resendIn={otp.cooldown}
          onChangeEmail={handleChangeEmail}
          submitLabel={t("auth.forgot.verify", language)}
          submittingLabel={t("auth.forgot.verifying", language)}
          expiresMinutes={otp.expiresMinutes}
          devCode={otp.devCode}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      language={language}
      title={title}
      subtitle={subtitle}
      footer={footer}
    >
      {steps}

      <form onSubmit={handleEmailSubmit} className="mt-2 space-y-4" noValidate>
        <GlassInput
          id="forgot-email"
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
          {t("auth.forgot.sendCode", language)}
        </GlassButton>
      </form>

      <p className="mt-4 flex items-start gap-2 text-body-sm text-muted">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{t("auth.forgot.secure", language)}</span>
      </p>
    </AuthShell>
  );
};

export default ForgotPasswordPage;
