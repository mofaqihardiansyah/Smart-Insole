import { describe, it, expect, afterEach, vi } from "vitest";
import { devWarn } from "./devWarn";

/**
 * The helper's own contract (T-03-02).
 *
 * Two properties matter and neither is visible from the fallback sites that use
 * it. The warning must exist in development and must not exist outside it, so
 * the flag has to be read when the call happens rather than when the module
 * loaded: a module-scope read freezes whatever the bundler saw and makes the
 * silence a build-time accident. And a warning must never be the reason a view
 * fails, so a console whose `warn` is gone is a case the helper has to survive.
 *
 * The environment stub is undone in `afterEach`, because a leaked `DEV` stub
 * would silence a sibling test file and hide the degradation the helper reports.
 */

describe("devWarn", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("names the component and carries the message, once, in development", () => {
    vi.stubEnv("DEV", true);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    devWarn("Widget", 'unknown key "nope"');

    expect(warn).toHaveBeenCalledTimes(1);
    const line = String(warn.mock.calls[0][0]);
    expect(line).toContain("Widget");
    expect(line).toContain("nope");
  });

  it("stays silent outside development", () => {
    vi.stubEnv("DEV", false);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    devWarn("Widget", "unknown key");

    expect(warn).not.toHaveBeenCalled();
  });

  it("reads the flag when it is called, not when the module loaded", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    vi.stubEnv("DEV", false);
    devWarn("Widget", "silent");
    vi.stubEnv("DEV", true);
    devWarn("Widget", "loud");

    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain("loud");
  });

  it("does not throw when console.warn has been removed", () => {
    vi.stubEnv("DEV", true);
    const original = console.warn;

    // Removed rather than replaced with a spy: this is the console a
    // locked-down embedder or a stripped logger leaves behind. The assertion
    // below is what keeps this case honest, because a console that still has a
    // callable `warn` would make the case pass without testing the branch.
    console.warn = undefined;
    expect(
      console.warn,
      "console.warn could not be removed, so this case proves nothing"
    ).toBeUndefined();

    try {
      // The flag is on, so any silence here can only come from the missing warn
      // rather than from the helper having skipped the branch.
      expect(import.meta.env.DEV).toBe(true);
      expect(() => devWarn("Widget", "no console")).not.toThrow();
    } finally {
      console.warn = original;
    }
  });
});
