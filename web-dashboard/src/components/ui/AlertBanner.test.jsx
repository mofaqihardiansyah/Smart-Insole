import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AlertBanner, BANNER_TONES } from "./AlertBanner";
import { roleFor } from "./feedbackState";
import { StateRetry } from "./StatePanel";
import { t } from "../../utils/i18n";

/**
 * The Alert/Banner primitive's own lock for D-02 and D-03.
 *
 * Three things are asserted here that nothing else covers:
 *
 *   1. the live-region role for every declared tone is read from the shared
 *      decision (`feedbackState.roleFor`) rather than re-typed, so a second copy
 *      of the matrix cannot survive in this file;
 *   2. the two-tier cause-and-next-action contract: an `action` element or a
 *      `nextAction` string, exactly one action, and a development warning when a
 *      danger banner has neither while still rendering its cause;
 *   3. the source-level prohibitions: no landing-register key and no live-region
 *      attribute of the primitive's own.
 *
 * The tone count is asserted before any per-tone verdict, so a tone map that
 * lost a member fails here instead of passing every loop vacuously.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.join(here, "AlertBanner.tsx"), "utf8");

/**
 * Strip block comments first, then line comments, following `copy.test.js`. The
 * file header legitimately names the landing scope while explaining why this
 * primitive declares no variant on it, and discussing a rule is not shipping a
 * class that uses it. The order matters: a block comment can contain `//`.
 */
const stripComments = (text) =>
  text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

const shippedCode = stripComments(source);

const TONE_KEYS = Object.keys(BANNER_TONES);

/** The shared focus pair, both tokens on one line so this file stays inside the
 *  `a11y.test.jsx` outline sweep it is itself scanned by. */
const RING_PAIR = ["focus-visible:outline-none", "focus-visible:ring-2"];

const classesOf = (element) =>
  (element.getAttribute("class") || "").split(/\s+/).filter(Boolean);

describe("AlertBanner's tone vocabulary", () => {
  it("declares the four tones the legacy banner carried, so no call site changes meaning", () => {
    expect(TONE_KEYS).toHaveLength(4);
    expect([...TONE_KEYS].sort()).toEqual([
      "danger",
      "info",
      "success",
      "warning",
    ]);
  });
});

describe("AlertBanner's live-region role", () => {
  it("carries the role the shared decision returns, for every declared tone", () => {
    // The floor comes first: a shrunken map must fail here, not pass the loop.
    expect(TONE_KEYS).toHaveLength(4);

    for (const tone of TONE_KEYS) {
      const { container, unmount } = render(
        <AlertBanner tone={tone} title="Cause" nextAction="Step" />
      );

      const banner = container.firstElementChild;
      const expected = roleFor(tone);

      expect(expected, `${tone} has no role in the shared decision`).toBeTruthy();
      expect(banner, `${tone} re-decided its role`).toHaveAttribute(
        "role",
        expected
      );

      unmount();
    }
  });

  it("announces a failure immediately and everything else at the next pause", () => {
    expect(roleFor("error")).toBe("alert");
    expect(roleFor("danger")).toBe("alert");

    for (const state of ["loading", "info", "success", "warning"]) {
      expect(roleFor(state), `${state} is not deferred`).toBe("status");
    }
  });

  it("leaves empty and an unrecognised state out of every live region", () => {
    expect(roleFor("empty")).toBeUndefined();
    expect(roleFor("something-else")).toBeUndefined();
    expect(roleFor(undefined)).toBeUndefined();
  });
});

describe("the two-tier cause and next action", () => {
  it("renders a next-action string under its own screen-reader label", () => {
    render(
      <AlertBanner
        tone="danger"
        title="Gagal memuat perangkat"
        nextAction="Muat ulang halaman untuk mencoba lagi."
      />
    );

    const alert = screen.getByRole("alert");
    expect(within(alert).getByText("Gagal memuat perangkat")).toBeInTheDocument();
    expect(
      within(alert).getByText("Muat ulang halaman untuk mencoba lagi.")
    ).toBeInTheDocument();

    // The label names the step rather than a second cause, so it must exist and
    // must be screen-reader only; the visible copy is the step itself.
    const label = t("common.nextStep");
    expect(label.trim(), "common.nextStep is empty").not.toBe("");
    const srLabel = within(alert).getByText(`${label}:`);
    expect(srLabel).toHaveClass("sr-only");
  });

  it("renders an action element inside the banner, exactly once, as a real control", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(
      <AlertBanner
        tone="danger"
        title="Gagal memuat pengguna"
        action={<StateRetry onRetry={onRetry} label="Coba lagi" />}
      />
    );

    const alert = screen.getByRole("alert");
    const buttons = within(alert).getAllByRole("button");
    expect(buttons, "the action slot rendered more than one control").toHaveLength(
      1
    );

    const button = buttons[0];
    expect(button).toHaveAttribute("type", "button");

    const classes = classesOf(button);
    expect(classes, "the action lost its 44px floor").toContain("min-h-[44px]");
    RING_PAIR.forEach((token) => {
      expect(classes, `the action lost ${token}`).toContain(token);
    });

    await user.click(button);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("keeps the dismiss control separate from the action, with its floor and its label", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();

    render(
      <AlertBanner
        tone="danger"
        title="Gagal memuat pengguna"
        action={<StateRetry onRetry={() => {}} label="Coba lagi" />}
        onDismiss={onDismiss}
        dismissLabel="Tutup"
      />
    );

    const alert = screen.getByRole("alert");
    // Two controls, and they are not the same one twice.
    expect(within(alert).getAllByRole("button")).toHaveLength(2);

    const dismiss = within(alert).getByRole("button", { name: "Tutup" });
    const classes = classesOf(dismiss);
    expect(classes, "the dismiss control lost its width").toContain("w-11");
    expect(classes, "the dismiss control lost its height").toContain("h-11");
    RING_PAIR.forEach((token) => {
      expect(classes, `the dismiss control lost ${token}`).toContain(token);
    });

    await user.click(dismiss);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

describe("a danger banner with no next action", () => {
  afterEach(() => {
    // The stub must not leak into a sibling file, where a silenced helper would
    // hide the very degradation this lock exists to surface.
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("warns exactly once in development and still renders its cause", () => {
    vi.stubEnv("DEV", true);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    render(<AlertBanner tone="danger" title="Akses ditolak" />);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain("AlertBanner");
    expect(String(warn.mock.calls[0][0])).toContain("Akses ditolak");

    // The production behaviour is the benign declared fallback: the cause
    // stays on screen rather than the region blanking.
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(within(alert).getByText("Akses ditolak")).toBeInTheDocument();
  });

  it("stays silent outside development and renders the same cause", () => {
    vi.stubEnv("DEV", false);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    render(<AlertBanner tone="danger" title="Akses ditolak" />);

    expect(warn).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});

describe("the body ink and the source prohibitions", () => {
  it("renders the body in the measured ink for a tint, not the muted ink", () => {
    render(
      <AlertBanner tone="danger" title="Cause">
        The device stopped sending.
      </AlertBanner>
    );

    const body = screen.getByText("The device stopped sending.");
    const classes = classesOf(body);
    expect(classes, "the body is not on the measured ink").toContain(
      "text-fg-2"
    );
    expect(classes, "the body fell back to the muted ink").not.toContain(
      "text-muted"
    );
  });

  it("declares no landing-register variant in its shipped code", () => {
    // The strip must not be so eager that it removed the code as well.
    expect(
      shippedCode,
      "the comment strip left nothing behind"
    ).toContain("roleFor(");
    expect(shippedCode).not.toMatch(/landing-scope/);
  });

  it("adds no live-region attribute of its own", () => {
    // `role` alone carries the announcement; an explicit attribute here would
    // be a second, always-mounted polite region the app does not want.
    expect(source).not.toMatch(/aria-live/);
  });

  it("reads its role from the shared decision rather than inlining the matrix", () => {
    // The rendered assertions above compare against `roleFor`, so a hand-written
    // copy of the matrix would pass them while it agreed. This is the assertion
    // that fails the moment a second copy appears, which is the property D-02
    // exists to hold.
    expect(
      shippedCode,
      "the comment strip left nothing behind"
    ).toContain("roleFor(");
    expect(
      shippedCode,
      "the role is no longer read from feedbackState.roleFor"
    ).toMatch(/role=\{roleFor\(\s*tone\s*\)\}/);
  });
});
