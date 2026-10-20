import { describe, it, expect } from "vitest";
import {
  MIN_PASSWORD_LENGTH,
  evaluatePassword,
} from "./passwordStrength";

/**
 * The meter advises, the form enforces only the length floor. These tests lock
 * that split: a long varied passphrase reaches the top band, a known word and a
 * run are demoted, and the hint list never grows past two.
 */

describe("password strength", () => {
  it("reports an empty field without hints", () => {
    const result = evaluatePassword("");
    expect(result.score).toBe(0);
    expect(result.labelKey).toBe("auth.password.empty");
    expect(result.hints).toEqual([]);
  });

  it("asks for the missing characters below the floor", () => {
    const result = evaluatePassword("abc");
    expect(result.score).toBeLessThanOrEqual(1);
    expect(result.labelKey).toBe("auth.password.weak");
    expect(result.hints).toContainEqual({
      key: "auth.password.hint.length",
      vars: { count: MIN_PASSWORD_LENGTH - 3 },
    });
  });

  it("demotes a common word even when it is long and varied", () => {
    const result = evaluatePassword("Password1!");
    expect(result.score).toBeLessThanOrEqual(1);
    expect(result.hints.map((hint) => hint.key)).toContain(
      "auth.password.hint.common"
    );
  });

  it("demotes a repeated run and a keyboard sequence", () => {
    expect(evaluatePassword("aaaaaaaaaaaa").score).toBeLessThanOrEqual(1);
    expect(
      evaluatePassword("aaaaaaaaaaaa").hints.map((hint) => hint.key)
    ).toContain("auth.password.hint.repeat");

    expect(evaluatePassword("abcd1234efgh").score).toBeLessThanOrEqual(1);
    expect(
      evaluatePassword("abcd1234efgh").hints.map((hint) => hint.key)
    ).toContain("auth.password.hint.repeat");
  });

  it("reaches the top band for a long passphrase with all four classes", () => {
    const result = evaluatePassword("Bunga-Melati-2026");
    expect(result.score).toBe(4);
    expect(result.labelKey).toBe("auth.password.strong");
    expect(result.hints).toEqual([]);
  });

  it("never returns more than two hints or a score outside 0 to 4", () => {
    const samples = [
      "",
      "a",
      "abc",
      "password",
      "12345678",
      "aaaaaaaaaaaaaaaa",
      "Bunga-Melati-2026",
      "aA1!aA1!aA1!",
      "x".repeat(200),
    ];

    for (const sample of samples) {
      const result = evaluatePassword(sample);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(4);
      expect(result.hints.length).toBeLessThanOrEqual(2);
    }
  });
});
