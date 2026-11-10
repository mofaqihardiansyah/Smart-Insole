/**
 * Console (Firestore / Realtime Database) error to dictionary copy.
 *
 * The admin console used to render `err.message` straight into a banner. That
 * message is English, and it names the failing path and sometimes the project
 * id — internals an operator cannot act on, inside an Indonesian console. What
 * an operator can act on is the cause and the next step, so this maps the error
 * code to one sentence and one next step, the same shape `authErrors` uses.
 *
 * The code is stable; the message is not. An unrecognised code falls back to
 * "the action failed" plus the connection check, which is true of every case
 * this console can hit.
 */

/** A failure rendered as two dictionary keys: cause and next step. */
export interface AdminErrorCopy {
  message: string;
  next: string;
}

const COPY: Record<string, AdminErrorCopy> = {
  "permission-denied": {
    message: "admin.error.permissionDenied",
    next: "admin.error.permissionDeniedNext",
  },
  // Storage reports the same failure under its own prefix.
  "storage/unauthorized": {
    message: "admin.error.permissionDenied",
    next: "admin.error.permissionDeniedNext",
  },
  unauthorized: {
    message: "admin.error.permissionDenied",
    next: "admin.error.permissionDeniedNext",
  },
  unavailable: {
    message: "admin.error.offline",
    next: "common.nextStepCheckConnection",
  },
  "network-request-failed": {
    message: "admin.error.offline",
    next: "common.nextStepCheckConnection",
  },
  "auth/network-request-failed": {
    message: "admin.error.offline",
    next: "common.nextStepCheckConnection",
  },
  "too-many-requests": {
    message: "admin.error.tooMany",
    next: "admin.error.tooManyNext",
  },
  "auth/too-many-requests": {
    message: "admin.error.tooMany",
    next: "admin.error.tooManyNext",
  },
  "resource-exhausted": {
    message: "admin.error.tooMany",
    next: "admin.error.tooManyNext",
  },
};

const FALLBACK: AdminErrorCopy = {
  message: "admin.actionError",
  next: "common.nextStepCheckConnection",
};

/** The code on a thrown value, whether it is the error or the code itself. */
const codeOf = (error: unknown): string | undefined => {
  if (typeof error === "string") return error;
  const code = (error as { code?: unknown })?.code;
  return typeof code === "string" ? code : undefined;
};

/**
 * @param error the thrown value, or a Firebase error code
 * @returns dictionary keys for the cause and the next step
 */
export function adminErrorCopy(error: unknown): AdminErrorCopy {
  const code = codeOf(error);
  if (code && code in COPY) return COPY[code];
  return FALLBACK;
}

export default adminErrorCopy;
