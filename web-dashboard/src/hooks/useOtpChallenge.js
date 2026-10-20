import { useCallback, useEffect, useRef, useState } from "react";
import {
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  OTP_TTL_MINUTES,
  clearChallenge,
  createChallenge,
  getChallengeExpiry,
  getCooldownSeconds,
  verifyChallenge,
} from "../utils/otpChallenge";
import { sendOtpEmail } from "../services/emailOtp";

/**
 * useOtpChallenge: the state machine behind both OTP pages.
 *
 * The hook owns the parts that are easy to get subtly wrong in a page: the
 * resend cooldown, the one automatic send per email, the attempt count, and
 * the mapping from a storage result to a stable error code. Pages own copy and
 * layout only.
 *
 * `errorCode` is a short reason (`invalid`, `expired`, `send-failed`, ...),
 * not a sentence. The page resolves `auth.otp.error.<code>` through the
 * dictionary, so the same state speaks both languages.
 */
export const useOtpChallenge = ({ email, purpose, autoSend = false }) => {
  const normalized = String(email || "").trim().toLowerCase();
  const [status, setStatus] = useState("idle");
  const [errorCode, setErrorCode] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  const [devCode, setDevCode] = useState(null);
  const [attemptsLeft, setAttemptsLeft] = useState(OTP_MAX_ATTEMPTS);

  const mounted = useRef(true);
  const sending = useRef(false);
  const sentFor = useRef("");

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  /* A new address is a new challenge. The previous verdict no longer applies. */
  useEffect(() => {
    setStatus("idle");
    setErrorCode(null);
    setDevCode(null);
    setAttemptsLeft(OTP_MAX_ATTEMPTS);
    setCooldown(normalized ? getCooldownSeconds(normalized, purpose) : 0);
  }, [normalized, purpose]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(
      () => setCooldown((current) => Math.max(0, current - 1)),
      1000
    );
    return () => clearTimeout(timer);
  }, [cooldown]);

  const send = useCallback(async () => {
    if (!normalized) {
      setErrorCode("missing-email");
      return { ok: false, reason: "missing-email" };
    }

    if (sending.current) return { ok: false, reason: "busy" };

    const remaining = getCooldownSeconds(normalized, purpose);
    if (remaining > 0) {
      setCooldown(remaining);
      if (getChallengeExpiry(normalized, purpose)) setStatus("sent");
      return { ok: false, reason: "cooldown" };
    }

    sending.current = true;
    setStatus("sending");
    setErrorCode(null);
    setDevCode(null);

    const challenge = await createChallenge(normalized, purpose);

    if (!challenge.ok) {
      sending.current = false;
      setCooldown(challenge.retryIn || 0);
      setStatus(
        challenge.reason === "cooldown" &&
          getChallengeExpiry(normalized, purpose)
          ? "sent"
          : "error"
      );
      if (challenge.reason !== "cooldown") {
        setErrorCode(challenge.reason || "send-failed");
      }
      return challenge;
    }

    try {
      const delivery = await sendOtpEmail({
        toEmail: normalized,
        code: challenge.code,
        purpose,
        expiresInMinutes: OTP_TTL_MINUTES,
      });

      if (mounted.current) {
        setStatus("sent");
        setDevCode(delivery.devCode || null);
        setCooldown(getCooldownSeconds(normalized, purpose));
        setAttemptsLeft(OTP_MAX_ATTEMPTS);
      }
      return { ok: true };
    } catch (error) {
      clearChallenge(normalized, purpose);
      const code = String(error?.code || "otp/send-failed").replace(
        /^otp\//,
        ""
      );
      if (mounted.current) {
        setStatus("error");
        setErrorCode(code);
      }
      return { ok: false, reason: code };
    } finally {
      sending.current = false;
    }
  }, [normalized, purpose]);

  /* One automatic send per address and purpose. A remount does not mail twice. */
  useEffect(() => {
    if (!autoSend || !normalized) return;
    const token = `${purpose}:${normalized}`;
    if (sentFor.current === token) return;
    sentFor.current = token;
    send();
  }, [autoSend, normalized, purpose, send]);

  const verify = useCallback(
    async (code) => {
      const digits = String(code || "").replace(/\D/g, "");

      if (digits.length !== OTP_LENGTH) {
        setErrorCode("required");
        return { ok: false, reason: "required" };
      }

      setStatus("verifying");
      setErrorCode(null);

      const result = await verifyChallenge(normalized, purpose, digits);
      if (!mounted.current) return result;

      if (result.ok) {
        setStatus("verified");
        setAttemptsLeft(OTP_MAX_ATTEMPTS);
      } else {
        setStatus("sent");
        setErrorCode(result.reason || "invalid");
        setAttemptsLeft(result.attemptsLeft ?? OTP_MAX_ATTEMPTS);
      }

      return result;
    },
    [normalized, purpose]
  );

  const reset = useCallback(() => {
    clearChallenge(normalized, purpose);
    sentFor.current = "";
    setStatus("idle");
    setErrorCode(null);
    setDevCode(null);
    setCooldown(0);
    setAttemptsLeft(OTP_MAX_ATTEMPTS);
  }, [normalized, purpose]);

  return {
    status,
    errorCode,
    cooldown,
    devCode,
    attemptsLeft,
    expiresMinutes: OTP_TTL_MINUTES,
    send,
    verify,
    reset,
  };
};

export default useOtpChallenge;
