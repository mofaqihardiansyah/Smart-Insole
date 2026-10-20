/**
 * Password strength, sized for a hint rather than a gate.
 *
 * The register form requires a length floor (NIST favours length over
 * composition rules), and this module only advises. It never blocks a
 * submission: a strength meter that refuses a long passphrase because it has
 * no symbol is worse than no meter at all.
 *
 * The score is 0 to 4 and maps to four labels. The hints are deliberately
 * short and actionable, two at most, because a list of rules beside a field is
 * noise the reader skips. All copy resolves through the dictionary.
 */

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

/** Passwords that appear at the top of every leaked list, plus local terms. */
const COMMON = [
  "password",
  "passw0rd",
  "123456",
  "12345678",
  "123456789",
  "qwerty",
  "abc123",
  "letmein",
  "iloveyou",
  "admin",
  "welcome",
  "monkey",
  "dragon",
  "sandi",
  "rahasia",
  "kucing",
  "sayang",
  "bismillah",
  "indonesia",
  "jakarta",
  "insole",
];

/** Predictable runs that survive a length and variety check. */
const SEQUENCES = [
  "0123",
  "1234",
  "2345",
  "3456",
  "4567",
  "5678",
  "6789",
  "abcd",
  "bcde",
  "cdef",
  "qwer",
  "asdf",
  "zxcv",
];

const LABEL_KEYS = [
  "auth.password.weak",
  "auth.password.weak",
  "auth.password.fair",
  "auth.password.good",
  "auth.password.strong",
];

const hasRepeat = (value) => /(.)\1{3,}/.test(value);
const hasSequence = (value) =>
  SEQUENCES.some((sequence) => value.toLowerCase().includes(sequence));

const countClasses = (value) =>
  [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) =>
    pattern.test(value)
  ).length;

/**
 * @param {string} password
 * @returns {{ score: number, labelKey: string, hints: Array<{ key: string, vars?: object }> }}
 */
export function evaluatePassword(password = "") {
  const value = String(password);

  if (!value) {
    return { score: 0, labelKey: "auth.password.empty", hints: [] };
  }

  const classes = countClasses(value);
  let score = 0;

  if (value.length >= MIN_PASSWORD_LENGTH) score += 1;
  if (value.length >= 12) score += 1;
  if (classes >= 3) score += 1;
  if (classes === 4) score += 1;

  const lower = value.toLowerCase();
  const common = COMMON.some((word) => lower.includes(word));
  const repeated = hasRepeat(value);
  const sequence = hasSequence(value);

  // A known word or a run drops the verdict regardless of length. "password1!"
  // is 10 characters and four classes, and still guessed in seconds.
  if (common) score = Math.min(score, 1);
  if (repeated || sequence) score = Math.max(0, score - 1);
  if (value.length < MIN_PASSWORD_LENGTH) score = Math.min(score, 1);

  score = Math.max(0, Math.min(4, score));

  const hints = [];
  const remaining = MIN_PASSWORD_LENGTH - value.length;

  if (remaining > 0) {
    hints.push({
      key: "auth.password.hint.length",
      vars: { count: remaining },
    });
  }
  if (common) hints.push({ key: "auth.password.hint.common" });
  if (repeated || sequence) hints.push({ key: "auth.password.hint.repeat" });
  if (classes < 2) hints.push({ key: "auth.password.hint.variety" });
  if (!/\d/.test(value) && !/[^A-Za-z0-9]/.test(value)) {
    hints.push({ key: "auth.password.hint.number" });
  }

  return { score, labelKey: LABEL_KEYS[score], hints: hints.slice(0, 2) };
}

export default evaluatePassword;
