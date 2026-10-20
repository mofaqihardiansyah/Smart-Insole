/**
 * Email delivery for one-time codes.
 *
 * EmailJS is used because it is a free, browser-first transport: the request is
 * a plain POST, there is no SDK to add, and the public key is meant to be
 * shipped in the client. The key only identifies the account. Sending limits
 * and the allowed origin are configured in the EmailJS dashboard, which is
 * where abuse is stopped.
 *
 * Template variables expected by the EmailJS template:
 *   {{to_email}}, {{to_name}}, {{otp_code}}, {{purpose}}, {{expires_in}},
 *   {{app_name}}
 *
 * The `purpose` value is `verify-email` or `reset-password`, so one template can
 * word both messages.
 *
 * Without configuration a development build shows the code in the page instead
 * of failing silently. A production build refuses to pretend it sent mail.
 */

const env = import.meta.env || {};

const SERVICE_ID = env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = env.VITE_EMAILJS_PUBLIC_KEY;

const EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";

export class OtpDeliveryError extends Error {
  constructor(code) {
    super(code);
    this.name = "OtpDeliveryError";
    this.code = code;
  }
}

export const isEmailOtpConfigured = () =>
  Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);

/**
 * @param {{
 *   toEmail: string,
 *   toName?: string,
 *   code: string,
 *   purpose: 'register' | 'reset',
 *   expiresInMinutes: number,
 * }} message
 * @returns {Promise<{ delivered: boolean, devCode?: string }>}
 */
export const sendOtpEmail = async ({
  toEmail,
  toName,
  code,
  purpose,
  expiresInMinutes,
}) => {
  if (!isEmailOtpConfigured()) {
    if (env.DEV) {
      // Development only. Vite replaces DEV with false in a production build,
      // so this branch is removed from the shipped bundle.
      return { delivered: false, devCode: code };
    }
    throw new OtpDeliveryError("otp/not-configured");
  }

  let response;
  try {
    response = await fetch(EMAILJS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: SERVICE_ID,
        template_id: TEMPLATE_ID,
        user_id: PUBLIC_KEY,
        template_params: {
          to_email: toEmail,
          to_name: toName || toEmail,
          otp_code: code,
          purpose: purpose === "reset" ? "reset-password" : "verify-email",
          expires_in: String(expiresInMinutes),
          app_name: "SOLE",
        },
      }),
    });
  } catch {
    throw new OtpDeliveryError("otp/send-failed");
  }

  if (!response.ok) {
    throw new OtpDeliveryError("otp/send-failed");
  }

  return { delivered: true };
};

export default sendOtpEmail;
