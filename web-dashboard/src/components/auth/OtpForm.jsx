import React from "react";
import { KeyRound, MailCheck, RotateCcw } from "lucide-react";
import { GlassButton, StatusBanner } from "../ui/GlassComponents";
import { t } from "../../utils/i18n";
import { OTP_LENGTH } from "../../utils/otpChallenge";
import OtpInput from "./OtpInput";

/**
 * OtpForm: the shared code step for registration verification and password
 * reset.
 *
 * The two journeys differ in what happens after a correct code, not in how the
 * code is entered. Keeping the resend cooldown, the expiry note and the change
 * address action in one place means both pages get the same behaviour instead
 * of one of them slowly drifting.
 */
const OtpForm = ({
  id,
  language,
  email,
  code,
  onCodeChange,
  onSubmit,
  submitting,
  error,
  attemptsLeft,
  maxAttempts,
  onResend,
  resending,
  resendIn,
  onChangeEmail,
  submitLabel,
  submittingLabel,
  expiresMinutes,
  devCode,
}) => {
  const complete =
    String(code || "").replace(/\D/g, "").length === OTP_LENGTH;

  return (
    <div className="mt-6">
      <p className="flex items-start gap-2 text-body-sm text-muted">
        <MailCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{t("auth.otp.sentTo", language, { email })}</span>
      </p>
      <p className="mt-1 text-body-sm text-muted">
        {t("auth.otp.expiresIn", language, { minutes: expiresMinutes })}
      </p>

      {devCode && (
        <StatusBanner
          tone="info"
          className="mt-4"
          title={t("auth.otp.devCode", language, { code: devCode })}
          nextAction={t("auth.otp.devCodeNext", language)}
        />
      )}

      <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
        <OtpInput
          id={id}
          value={code}
          onChange={onCodeChange}
          language={language}
          error={error}
          autoFocus
        />

        {!error &&
          Number.isInteger(attemptsLeft) &&
          attemptsLeft > 0 &&
          attemptsLeft < maxAttempts && (
            <p className="text-body-sm text-muted">
              {t("auth.otp.attemptsLeft", language, { count: attemptsLeft })}
            </p>
          )}

        <GlassButton
          type="submit"
          variant="filled"
          className="w-full"
          disabled={submitting || !complete}
        >
          <KeyRound className="h-4 w-4" aria-hidden="true" />
          {submitting ? submittingLabel : submitLabel}
        </GlassButton>
      </form>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <GlassButton
          type="button"
          variant="ghost"
          size="sm"
          onClick={onResend}
          disabled={resending || resendIn > 0}
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          {resendIn > 0
            ? t("auth.otp.resendIn", language, { seconds: resendIn })
            : resending
              ? t("auth.otp.resending", language)
              : t("auth.otp.resend", language)}
        </GlassButton>

        {onChangeEmail && (
          <button
            type="button"
            onClick={onChangeEmail}
            className="inline-flex min-h-[44px] items-center rounded-control px-2 text-body-sm font-medium text-primary underline underline-offset-2 transition-colors duration-150 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            {t("auth.otp.changeEmail", language)}
          </button>
        )}
      </div>
    </div>
  );
};

export default OtpForm;
