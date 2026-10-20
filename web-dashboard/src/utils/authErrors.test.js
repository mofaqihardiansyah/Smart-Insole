import { describe, it, expect } from "vitest";
import { authErrorCopy } from "./authErrors";
import { DICTIONARY } from "./i18n";

/**
 * The anti-enumeration lock: every credential failure produces the same pair,
 * and every key the mapper returns exists in both dictionaries.
 */

describe("auth error copy", () => {
  it("answers a missing account and a wrong password the same way", () => {
    const missing = authErrorCopy("auth/user-not-found");
    const wrong = authErrorCopy("auth/wrong-password");
    const invalid = authErrorCopy("auth/invalid-credential");

    expect(missing).toEqual(wrong);
    expect(missing).toEqual(invalid);
    expect(missing.message).toBe("auth.error.credentials");
  });

  it("keeps the actionable cases distinct", () => {
    expect(authErrorCopy("auth/email-already-in-use").message).toBe(
      "auth.error.emailInUse"
    );
    expect(authErrorCopy("auth/too-many-requests").message).toBe(
      "auth.error.tooManyRequests"
    );
    expect(authErrorCopy("auth/network-request-failed").message).toBe(
      "auth.error.network"
    );
  });

  it("falls back to one generic pair for an unknown code", () => {
    const copy = authErrorCopy("auth/something-new");
    expect(copy).toEqual({
      message: "auth.error.generic",
      next: "common.nextStepCheckConnection",
    });
  });

  it("returns keys that exist in both languages", () => {
    const codes = [
      "auth/invalid-credential",
      "auth/user-not-found",
      "auth/wrong-password",
      "auth/invalid-email",
      "auth/email-already-in-use",
      "auth/weak-password",
      "auth/user-disabled",
      "auth/too-many-requests",
      "auth/network-request-failed",
      "auth/unknown",
    ];

    for (const code of codes) {
      const copy = authErrorCopy(code);
      expect(DICTIONARY.id[copy.message]).toBeDefined();
      expect(DICTIONARY.en[copy.message]).toBeDefined();
      expect(DICTIONARY.id[copy.next]).toBeDefined();
      expect(DICTIONARY.en[copy.next]).toBeDefined();
    }
  });
});
