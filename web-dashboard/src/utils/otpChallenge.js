/**
 * OTP challenges, stored in the browser for the length of a tab session.
 *
 * What this module is, and what it is not:
 *
 * - It generates a six digit code, keeps only a salted SHA-256 hash, and
 *   enforces an expiry, a resend cooldown and an attempt cap.
 * - The comparison happens in the browser because this build ships without a
 *   server. That makes the check a UX gate, not the security boundary. The
 *   boundary stays with Firebase: a reset link is still minted by Firebase and
 *   sent only to the account address, and the registration page is already
 *   behind the signed-in session.
 * - A production deployment that needs the code itself to grant access must
 *   move generation and comparison behind a server. The API here is shaped so
 *   that only this module changes when that happens.
 *
 * The record lives in sessionStorage rather than localStorage: closing the tab
 * ends the challenge, and another tab cannot pick it up.
 */

export const OTP_LENGTH = 6;
export const OTP_TTL_MINUTES = 10;
export const OTP_TTL_MS = OTP_TTL_MINUTES * 60 * 1000;
export const OTP_RESEND_MS = 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

const STORAGE_PREFIX = "sole.otp.v1";

/** A tab-private store with a memory fallback for private mode and tests. */
const memory = new Map();

const getStore = () => {
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      return window.sessionStorage;
    }
  } catch {
    /* Access can throw when storage is blocked. */
  }
  return null;
};

const readRecord = (key) => {
  const store = getStore();
  try {
    const raw = store ? store.getItem(key) : memory.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeRecord = (key, record) => {
  const store = getStore();
  const raw = JSON.stringify(record);
  try {
    if (store) store.setItem(key, raw);
    else memory.set(key, raw);
  } catch {
    memory.set(key, raw);
  }
};

const removeRecord = (key) => {
  const store = getStore();
  try {
    if (store) store.removeItem(key);
  } catch {
    /* Ignore a blocked store. */
  }
  memory.delete(key);
};

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

export const challengeKey = (email, purpose) =>
  `${STORAGE_PREFIX}:${purpose}:${normalizeEmail(email)}`;

/** A 6 digit code from the platform CSPRNG, padded so leading zeros survive. */
export const generateOtp = () => {
  const limit = 10 ** OTP_LENGTH;
  const cryptoObject =
    typeof globalThis !== "undefined" ? globalThis.crypto : undefined;

  if (cryptoObject?.getRandomValues) {
    const buffer = new Uint32Array(1);
    // Rejection sampling removes the small modulo bias.
    const ceiling = Math.floor(0xffffffff / limit) * limit;
    let value = 0;
    do {
      cryptoObject.getRandomValues(buffer);
      value = buffer[0];
    } while (value >= ceiling);
    return String(value % limit).padStart(OTP_LENGTH, "0");
  }

  return String(Math.floor(Math.random() * limit)).padStart(OTP_LENGTH, "0");
};

const randomSalt = () => {
  const bytes = new Uint8Array(16);
  const cryptoObject =
    typeof globalThis !== "undefined" ? globalThis.crypto : undefined;

  if (cryptoObject?.getRandomValues) {
    cryptoObject.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
};

/** FNV-1a, used only when Web Crypto is unavailable (plain HTTP on a LAN). */
const fallbackHash = (value) => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

const hashOtp = async (code, salt) => {
  const value = `${salt}:${code}`;
  const subtle =
    typeof globalThis !== "undefined" ? globalThis.crypto?.subtle : undefined;

  if (subtle && typeof TextEncoder !== "undefined") {
    const digest = await subtle.digest(
      "SHA-256",
      new TextEncoder().encode(value)
    );
    return Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0")
    ).join("");
  }

  return fallbackHash(value);
};

/**
 * Create a challenge and return the plain code exactly once, for the caller
 * that is about to email it. The code is never written to storage.
 *
 * @returns {Promise<{ ok: true, code: string, expiresAt: number } |
 *   { ok: false, reason: 'cooldown', retryIn: number }>}
 */
export const createChallenge = async (email, purpose) => {
  const normalized = normalizeEmail(email);
  if (!normalized) return { ok: false, reason: "missing-email", retryIn: 0 };

  const key = challengeKey(normalized, purpose);
  const now = Date.now();
  const existing = readRecord(key);
  const retryIn = existing
    ? Math.ceil((existing.lastSentAt + OTP_RESEND_MS - now) / 1000)
    : 0;

  if (existing && retryIn > 0) {
    return { ok: false, reason: "cooldown", retryIn };
  }

  const code = generateOtp();
  const salt = randomSalt();
  const record = {
    hash: await hashOtp(code, salt),
    salt,
    expiresAt: now + OTP_TTL_MS,
    lastSentAt: now,
    attempts: 0,
  };

  writeRecord(key, record);
  return { ok: true, code, expiresAt: record.expiresAt };
};

export const clearChallenge = (email, purpose) => {
  removeRecord(challengeKey(email, purpose));
};

export const getCooldownSeconds = (email, purpose) => {
  const record = readRecord(challengeKey(email, purpose));
  if (!record) return 0;
  const remaining = record.lastSentAt + OTP_RESEND_MS - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
};

export const getChallengeExpiry = (email, purpose) => {
  const record = readRecord(challengeKey(email, purpose));
  return record ? record.expiresAt : null;
};

/**
 * Compare a typed code with the stored hash.
 *
 * @returns {Promise<{ ok: boolean, reason?: string, attemptsLeft?: number }>}
 */
export const verifyChallenge = async (email, purpose, code) => {
  const normalized = normalizeEmail(email);
  const key = challengeKey(normalized, purpose);
  const record = readRecord(key);

  if (!record) return { ok: false, reason: "missing" };

  if (Date.now() > record.expiresAt) {
    removeRecord(key);
    return { ok: false, reason: "expired" };
  }

  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    return { ok: false, reason: "attempts", attemptsLeft: 0 };
  }

  const candidate = await hashOtp(String(code || "").trim(), record.salt);
  const attempts = record.attempts + 1;

  if (candidate !== record.hash) {
    const next = { ...record, attempts };
    writeRecord(key, next);
    const attemptsLeft = Math.max(0, OTP_MAX_ATTEMPTS - attempts);
    return {
      ok: false,
      reason: attemptsLeft === 0 ? "attempts" : "invalid",
      attemptsLeft,
    };
  }

  removeRecord(key);
  return { ok: true };
};

export const OTP_ERROR_CODES = {
  missing: "otp/error-missing",
  expired: "otp/error-expired",
  invalid: "otp/error-invalid",
  attempts: "otp/error-attempts",
  "missing-email": "otp/error-missing-email",
  cooldown: "otp/error-cooldown",
};

export default {
  OTP_LENGTH,
  OTP_TTL_MINUTES,
  OTP_TTL_MS,
  OTP_RESEND_MS,
  OTP_MAX_ATTEMPTS,
  createChallenge,
  clearChallenge,
  verifyChallenge,
  getCooldownSeconds,
  getChallengeExpiry,
  generateOtp,
};
