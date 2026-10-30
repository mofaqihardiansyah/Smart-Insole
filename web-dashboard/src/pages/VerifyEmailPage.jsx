import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { applyActionCode } from "firebase/auth";
import {
  AlertTriangle,
  CheckCircle2,
  MailCheck,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { auth } from "../services/firebaseConfig";
import { useAuth } from "../hooks/useAuth";
import { useInsole } from "../context/InsoleContext";
import { t } from "../utils/i18n";
import { authErrorCopy } from "../utils/authErrors";
import { sendVerificationEmail } from "../utils/authMail";
import { GlassButton, StatusBanner } from "../components/ui/GlassComponents";
import AuthShell from "../components/auth/AuthShell";

/**
 * VerifyEmailPage: the page Firebase returns to after the verification link.
 *
 * Firebase owns the action code, its expiry and the `emailVerified` flag. This
 * page only asks Firebase what the current state is and offers the one action
 * the reader can take from here: send the link again. A link opened on another
 * device leaves this tab showing "waiting", which is why "check again" exists
 * rather than a timer or a promise that the tab will update by itself.
 *
 * `applyActionCode` covers a custom email action handler. With the default
 * Firebase widget the code has already been applied before the redirect, so a
 * failure here is not treated as failure: the reload below is the authority.
 */
const VerifyEmailPage = () => {
  const { language } = useInsole();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const oobCode = searchParams.get("oobCode") || "";
  const email = String(user?.email || "").trim();

  const [phase, setPhase] = useState("checking");
  const [recheck, setRecheck] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [notice, setNotice] = useState(null);

  const appliedCode = useRef("");
  const reloadedFor = useRef("");

  useEffect(() => {
    if (loading) {
      setPhase("checking");
      return undefined;
    }

    let active = true;

    const check = async () => {
      const current = auth.currentUser;
      let applied = false;

      if (oobCode && appliedCode.current !== oobCode) {
        appliedCode.current = oobCode;
        try {
          await applyActionCode(auth, oobCode);
          applied = true;
        } catch {
          /* Checked against the reloaded user below. */
        }
      }

      if (!current) {
        if (!active) return;
        if (applied) setPhase("verified");
        else setPhase(oobCode ? "invalid" : "signedOut");
        return;
      }

      const key = `${current.uid}:${oobCode}`;
      if (reloadedFor.current !== key) {
        reloadedFor.current = key;
        try {
          await current.reload();
        } catch {
          /* Offline: the cached flag is still the best answer available. */
        }
      }

      if (!active) return;
      if (current.emailVerified) setPhase("verified");
      else setPhase(oobCode ? "invalid" : "waiting");
    };

    check();
    return () => {
      active = false;
    };
  }, [loading, oobCode, user, recheck]);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = setTimeout(
      () => setResendIn((current) => Math.max(0, current - 1)),
      1000
    );
    return () => clearTimeout(timer);
  }, [resendIn]);

  const checkAgain = () => {
    reloadedFor.current = "";
    setPhase("checking");
    setRecheck((current) => current + 1);
  };

  const resend = async () => {
    const current = auth.currentUser;
    if (!current || resending || resendIn > 0) return;

    setResending(true);
    setNotice(null);

    try {
      await sendVerificationEmail(current);
      setResendIn(60);
      setNotice({
        tone: "success",
        message: t("auth.verify.sent", language),
      });
    } catch (error) {
      if (error?.code === "auth/too-many-requests") {
        setNotice({
          tone: "danger",
          message: t("auth.verify.tooMany", language),
        });
      } else {
        const copy = authErrorCopy(error?.code);
        setNotice({
          tone: "danger",
          message: t(copy.message, language),
          next: t(copy.next, language),
        });
      }
    } finally {
      setResending(false);
    }
  };

  const footer = (
    <p className="mt-5 text-center text-body-sm text-muted sm:mt-6">
      <Link
        to="/login"
        className="inline-flex min-h-[44px] items-center rounded-control px-2 font-medium text-primary underline underline-offset-2 transition-colors duration-150 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        {t("auth.verify.backToLogin", language)}
      </Link>
    </p>
  );

  if (phase === "verified") {
    return (
      <AuthShell
        language={language}
        title={t("auth.verify.successTitle", language)}
        subtitle={t("auth.verify.successBody", language)}
        footer={footer}
      >
        <div className="mt-6 rounded-card border border-safe/40 bg-safe/10 p-5">
          <CheckCircle2
            className="mx-auto h-10 w-10 text-safe-ink"
            aria-hidden="true"
          />
          <p className="mt-3 text-center text-body-sm text-fg-2">
            {t("auth.verify.successNote", language)}
          </p>
          <GlassButton
            type="button"
            variant="filled"
            className="mt-5 w-full"
            onClick={() => navigate(user ? "/" : "/login")}
          >
            {user
              ? t("auth.verify.successCta", language)
              : t("auth.verify.successLogin", language)}
          </GlassButton>
        </div>
      </AuthShell>
    );
  }

  if (phase === "invalid") {
    return (
      <AuthShell
        language={language}
        title={t("auth.verify.invalidTitle", language)}
        subtitle={t("auth.verify.invalidBody", language)}
        footer={footer}
      >
        <StatusBanner
          tone="danger"
          className="mt-5"
          title={t("auth.verify.invalidBanner", language)}
          nextAction={t("auth.verify.invalidNext", language)}
        />

        {user && (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <GlassButton
              type="button"
              variant="filled"
              className="w-full sm:flex-1"
              onClick={resend}
              disabled={resending || resendIn > 0}
            >
              <MailCheck className="h-4 w-4" aria-hidden="true" />
              {resendIn > 0
                ? t("auth.verify.resendIn", language, { seconds: resendIn })
                : resending
                  ? t("auth.verify.resending", language)
                  : t("auth.verify.resend", language)}
            </GlassButton>

            <GlassButton
              type="button"
              variant="ghost"
              className="w-full sm:flex-1"
              onClick={() => navigate("/login")}
            >
              {t("auth.verify.signIn", language)}
            </GlassButton>
          </div>
        )}

        {notice && (
          <StatusBanner
            tone={notice.tone}
            className="mt-4"
            title={notice.message}
            nextAction={notice.next}
          />
        )}
      </AuthShell>
    );
  }

  if (phase === "signedOut") {
    return (
      <AuthShell
        language={language}
        title={t("auth.verify.signedOutTitle", language)}
        subtitle={t("auth.verify.signedOutBody", language)}
        footer={footer}
      >
        <div className="mt-6 rounded-card border border-border-strong bg-surface-2 p-5">
          <MailCheck
            className="mx-auto h-9 w-9 text-primary"
            aria-hidden="true"
          />
          <p className="mt-3 text-center text-body-sm text-fg-2">
            {t("auth.verify.openEmail", language)}
          </p>
        </div>

        <GlassButton
          type="button"
          variant="filled"
          className="mt-5 w-full"
          onClick={() => navigate("/login")}
        >
          {t("auth.verify.signIn", language)}
        </GlassButton>
      </AuthShell>
    );
  }

  if (phase === "checking") {
    return (
      <AuthShell
        language={language}
        title={t("auth.verify.title", language)}
        subtitle={t("auth.verify.checking", language)}
        footer={footer}
      >
        <p className="mt-6 flex items-center gap-2 text-body-sm text-muted">
          <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
          {t("auth.verify.checkingNote", language)}
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      language={language}
      title={t("auth.verify.title", language)}
      subtitle={t("auth.verify.sentTo", language, { email })}
      footer={footer}
    >
      <div className="mt-6 rounded-card border border-border-strong bg-surface-2 p-5">
        <MailCheck className="mx-auto h-9 w-9 text-primary" aria-hidden="true" />
        <p className="mt-3 text-center text-body-sm text-fg-2">
          {t("auth.verify.openEmail", language)}
        </p>
        <p className="mt-2 text-center text-body-sm text-muted">
          {t("auth.verify.spam", language)}
        </p>
      </div>

      {notice && (
        <StatusBanner
          tone={notice.tone}
          className="mt-4"
          title={notice.message}
          nextAction={notice.next}
        />
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <GlassButton
          type="button"
          variant="filled"
          className="w-full sm:flex-1"
          onClick={resend}
          disabled={resending || resendIn > 0}
        >
          <MailCheck className="h-4 w-4" aria-hidden="true" />
          {resendIn > 0
            ? t("auth.verify.resendIn", language, { seconds: resendIn })
            : resending
              ? t("auth.verify.resending", language)
              : t("auth.verify.resend", language)}
        </GlassButton>

        <GlassButton
          type="button"
          variant="outline"
          className="w-full sm:flex-1"
          onClick={checkAgain}
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          {t("auth.verify.checkAgain", language)}
        </GlassButton>
      </div>

      {user && (
        <div className="mt-3">
          <GlassButton
            type="button"
            variant="ghost"
            className="w-full text-secondary hover:text-secondary-ink font-medium"
            onClick={() => navigate("/")}
          >
            {language === "id"
              ? "Lewati verifikasi untuk saat ini (Lanjut ke Dasbor)"
              : "Skip verification for now (Continue to Dashboard)"}
          </GlassButton>
        </div>
      )}

      <p className="mt-4 flex items-start gap-2 text-body-sm text-muted">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{t("auth.verify.secure", language)}</span>
      </p>
    </AuthShell>
  );
};

export default VerifyEmailPage;
