import { describe, it, expect } from "vitest";
import { adminErrorCopy } from "./adminErrors";
import { DICTIONARY } from "./i18n";

/**
 * The console renders a sentence and a next step, never Firebase's own English
 * message. Two things have to hold: the codes an operator actually meets keep
 * their distinct advice, and every key returned exists in both dictionaries —
 * a missing key would surface as a raw key string in a banner.
 */

const CODES = [
  "permission-denied",
  "storage/unauthorized",
  "unauthorized",
  "unavailable",
  "network-request-failed",
  "auth/network-request-failed",
  "too-many-requests",
  "auth/too-many-requests",
  "resource-exhausted",
  "some-new-code",
  undefined,
];

describe("admin error copy", () => {
  it("keeps a permission failure distinct from a connection failure", () => {
    const denied = adminErrorCopy("permission-denied");
    const offline = adminErrorCopy("unavailable");

    expect(denied.message).toBe("admin.error.permissionDenied");
    // "Check your connection" is the wrong advice for a rules rejection: the
    // network is fine, the account is not allowed.
    expect(denied.next).not.toBe(offline.next);
    expect(offline.message).toBe("admin.error.offline");
  });

  it("reads the code off a thrown error as well as off a bare string", () => {
    const error = Object.assign(new Error("Missing or insufficient permissions."), {
      code: "permission-denied",
    });

    expect(adminErrorCopy(error)).toEqual(adminErrorCopy("permission-denied"));
  });

  it("never returns the thrown message", () => {
    const error = Object.assign(new Error("English internals"), {
      code: "some-new-code",
    });

    expect(adminErrorCopy(error).message).toBe("admin.actionError");
  });

  it("returns keys that exist in both languages", () => {
    for (const code of CODES) {
      const copy = adminErrorCopy(code);
      expect(DICTIONARY.id[copy.message], `id: ${copy.message}`).toBeDefined();
      expect(DICTIONARY.en[copy.message], `en: ${copy.message}`).toBeDefined();
      expect(DICTIONARY.id[copy.next], `id: ${copy.next}`).toBeDefined();
      expect(DICTIONARY.en[copy.next], `en: ${copy.next}`).toBeDefined();
    }
  });
});
