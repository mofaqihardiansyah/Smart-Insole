/**
 * Firebase Auth error to dictionary copy.
 *
 * The auth pages never render Firebase's own message. It is English,
 * technical, and for login it says whether the address exists: "user not
 * found" is an account-enumeration oracle. Every credential failure maps to
 * one message, and only the cases a person can act on (a disabled account, a
 * connection problem, a rate limit, an address already in use) get their own
 * text.
 *
 * `next` is the step after the cause. The banner primitive asks for it, and a
 * login failure with no next step leaves the reader stuck.
 */

const COPY = {
  "auth/invalid-credential": {
    message: "auth.error.credentials",
    next: "auth.error.credentialsNext",
  },
  "auth/invalid-login-credentials": {
    message: "auth.error.credentials",
    next: "auth.error.credentialsNext",
  },
  "auth/wrong-password": {
    message: "auth.error.credentials",
    next: "auth.error.credentialsNext",
  },
  "auth/user-not-found": {
    message: "auth.error.credentials",
    next: "auth.error.credentialsNext",
  },
  "auth/missing-password": {
    message: "auth.error.required",
    next: "auth.error.credentialsNext",
  },
  "auth/invalid-email": {
    message: "auth.error.email",
    next: "auth.error.emailNext",
  },
  "auth/email-already-in-use": {
    message: "auth.error.emailInUse",
    next: "auth.error.emailInUseNext",
  },
  "auth/weak-password": {
    message: "auth.error.weakPassword",
    next: "auth.error.passwordNext",
  },
  "auth/user-disabled": {
    message: "auth.error.disabled",
    next: "auth.error.disabledNext",
  },
  "auth/too-many-requests": {
    message: "auth.error.tooManyRequests",
    next: "auth.error.tooManyNext",
  },
  "auth/network-request-failed": {
    message: "auth.error.network",
    next: "common.nextStepCheckConnection",
  },
};

const FALLBACK = {
  message: "auth.error.generic",
  next: "common.nextStepCheckConnection",
};

/**
 * @param {string | undefined} code Firebase error code (`err.code`)
 * @returns {{ message: string, next: string }} dictionary keys
 */
export function authErrorCopy(code) {
  return COPY[code] || FALLBACK;
}

export default authErrorCopy;
