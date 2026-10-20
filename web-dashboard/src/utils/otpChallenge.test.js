import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  OTP_TTL_MS,
  clearChallenge,
  createChallenge,
  getCooldownSeconds,
  generateOtp,
  verifyChallenge,
} from "./otpChallenge";

const EMAIL = "patient@example.com";
const PURPOSE = "register";

const wrongCode = (code) =>
  String((Number(code) + 1) % 10 ** OTP_LENGTH).padStart(OTP_LENGTH, "0");

describe("otpChallenge", () => {
  beforeEach(() => {
    sessionStorage.clear();
    clearChallenge(EMAIL, PURPOSE);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearChallenge(EMAIL, PURPOSE);
  });

  it("generates exactly six digits, including leading zeros", () => {
    for (let i = 0; i < 40; i += 1) {
      expect(generateOtp()).toMatch(new RegExp(`^\\d{${OTP_LENGTH}}$`));
    }
  });

  it("creates a challenge, keeps a hash rather than the code, and verifies it", async () => {
    const challenge = await createChallenge(EMAIL, PURPOSE);
    expect(challenge.ok).toBe(true);
    expect(challenge.code).toMatch(/^\d{6}$/);

    const stored = sessionStorage.getItem(
      `sole.otp.v1:${PURPOSE}:${EMAIL}`
    );
    expect(stored).toBeTruthy();
    expect(stored).not.toContain(challenge.code);

    const result = await verifyChallenge(EMAIL, PURPOSE, challenge.code);
    expect(result.ok).toBe(true);
    expect(
      sessionStorage.getItem(`sole.otp.v1:${PURPOSE}:${EMAIL}`)
    ).toBeNull();
  });

  it("rejects a wrong code and counts the attempt", async () => {
    const challenge = await createChallenge(EMAIL, PURPOSE);

    const wrong = await verifyChallenge(
      EMAIL,
      PURPOSE,
      wrongCode(challenge.code)
    );
    expect(wrong.ok).toBe(false);
    expect(wrong.reason).toBe("invalid");
    expect(wrong.attemptsLeft).toBe(OTP_MAX_ATTEMPTS - 1);

    const right = await verifyChallenge(EMAIL, PURPOSE, challenge.code);
    expect(right.ok).toBe(true);
  });

  it("refuses to create a second challenge during the resend cooldown", async () => {
    const first = await createChallenge(EMAIL, PURPOSE);
    expect(first.ok).toBe(true);
    expect(getCooldownSeconds(EMAIL, PURPOSE)).toBeGreaterThan(0);

    const second = await createChallenge(EMAIL, PURPOSE);
    expect(second.ok).toBe(false);
    expect(second.reason).toBe("cooldown");
  });

  it("expires a challenge after ten minutes", async () => {
    const challenge = await createChallenge(EMAIL, PURPOSE);
    const start = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(start + OTP_TTL_MS + 1);

    const result = await verifyChallenge(EMAIL, PURPOSE, challenge.code);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("expired");
  });

  it("stops after five wrong attempts", async () => {
    const challenge = await createChallenge(EMAIL, PURPOSE);
    const wrong = wrongCode(challenge.code);

    for (let attempt = 1; attempt <= OTP_MAX_ATTEMPTS; attempt += 1) {
      const result = await verifyChallenge(EMAIL, PURPOSE, wrong);
      expect(result.ok).toBe(false);
      if (attempt < OTP_MAX_ATTEMPTS) {
        expect(result.attemptsLeft).toBe(OTP_MAX_ATTEMPTS - attempt);
      }
    }

    const blocked = await verifyChallenge(EMAIL, PURPOSE, challenge.code);
    expect(blocked.ok).toBe(false);
    expect(blocked.reason).toBe("attempts");
  });
});
