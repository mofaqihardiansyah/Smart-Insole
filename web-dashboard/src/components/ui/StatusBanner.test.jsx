import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import React from "react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
/**
 * `LegacyBanner` is the default export of `StatusBanner`, and the two names are
 * proven to be one component below. The renders use the default export on
 * purpose: the eight page files all import by name, so rendering through the
 * other spelling is the half no page exercises.
 */
import LegacyBanner, { StatusBanner } from "./StatusBanner";
import { AlertBanner, BANNER_TONES } from "./AlertBanner";
import { roleFor } from "./feedbackState";

/**
 * The delegate's lock for D-02.
 *
 * `StatusBanner` has thirteen call sites in eight files, so a delegate that
 * changed behaviour would rewrite every consumer at once, silently. Three things
 * are asserted here:
 *
 *   1. the role for each of the four legacy tones is the one the shared decision
 *      returns, proved for the delegating name AND for the primitive it renders
 *      with the same props, so "it is a delegate" is a measurement rather than a
 *      claim;
 *   2. both export names survive, because pages import by name and the brief
 *      forbids renaming exports;
 *   3. the deleted vocabulary is enforced as deleted: every tone-keyed class
 *      string is read out of `AlertBanner.jsx`, its owner, and this file is
 *      asserted not to contain any of them.
 *
 * The four-tone count is asserted before the per-tone verdicts, so a tone map
 * that lost a member fails here instead of passing every loop vacuously.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (name) => fs.readFileSync(path.join(here, name), "utf8");

const bannerSource = read("AlertBanner.tsx");
const legacySource = read("StatusBanner.tsx");

/**
 * Strip block comments first, then line comments, following `copy.test.js`: a
 * header may legitimately discuss a class it does not use, and discussing a rule
 * is not shipping one. The order matters, because a block comment can contain
 * `//`.
 */
const stripComments = (text) =>
  text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

const legacyCode = stripComments(legacySource);

const TONE_KEYS = Object.keys(BANNER_TONES);

/** The shared focus pair, both tokens on one line so this file stays inside the
 *  `a11y.test.jsx` outline sweep it is itself scanned by. */
const RING_PAIR = ["focus-visible:outline-none", "focus-visible:ring-2"];

const classesOf = (element) =>
  (element.getAttribute("class") || "").split(/\s+/).filter(Boolean);

describe("the delegating name", () => {
  it("keeps both its exports", () => {
    expect(StatusBanner).toBeTypeOf("function");
    expect(LegacyBanner, "the default export is no longer the same component").toBe(
      StatusBanner
    );
  });

  it("renders the role the shared decision returns, for each of the four tones", () => {
    // The floor first: a shrunken vocabulary must fail before the loop passes.
    expect(TONE_KEYS).toHaveLength(4);

    for (const tone of TONE_KEYS) {
      const { container, unmount } = render(
        <LegacyBanner tone={tone} title="Cause">
          Body
        </LegacyBanner>
      );

      expect(
        container.firstElementChild,
        `${tone} did not resolve its role through roleFor`
      ).toHaveAttribute("role", roleFor(tone));

      unmount();
    }
  });

  it("renders exactly what the primitive renders for the same props", () => {
    // `children` is part of the props, so the danger banner below warns about
    // nothing and the two renders differ only in the name that produced them.
    const props = {
      tone: "danger",
      title: "Gagal memuat perangkat",
      onDismiss: () => {},
      dismissLabel: "Tutup",
      children: "Perangkat berhenti mengirim data.",
    };

    const direct = render(<AlertBanner {...props} />);
    const viaDelegate = render(<LegacyBanner {...props} />);

    const directBanner = direct.container.firstElementChild;
    const delegateBanner = viaDelegate.container.firstElementChild;

    expect(delegateBanner.getAttribute("role")).toBe(
      directBanner.getAttribute("role")
    );
    expect(
      classesOf(delegateBanner),
      "the delegate and the primitive render different tone classes"
    ).toEqual(classesOf(directBanner));
    expect(delegateBanner.outerHTML).toBe(directBanner.outerHTML);

    direct.unmount();
    viaDelegate.unmount();
  });

  it("passes the localised dismiss label, its floor and its ring through", () => {
    const onDismiss = vi.fn();

    render(
      <LegacyBanner
        tone="danger"
        title="Gagal memuat perangkat"
        onDismiss={onDismiss}
        dismissLabel="Tutup"
      >
        Perangkat berhenti mengirim data.
      </LegacyBanner>
    );

    const alert = screen.getByRole("alert");
    const dismiss = within(alert).getByRole("button", { name: "Tutup" });
    const classes = classesOf(dismiss);

    expect(classes, "the dismiss control lost its width").toContain("w-11");
    expect(classes, "the dismiss control lost its height").toContain("h-11");
    RING_PAIR.forEach((token) => {
      expect(classes, `the dismiss control lost ${token}`).toContain(token);
    });
  });

  it("renders the action slot inside the banner", () => {
    render(
      <LegacyBanner
        tone="warning"
        title="Sumber data simulasi"
        action={
          <button type="button" className="min-h-[44px]">
            Coba lagi
          </button>
        }
      >
        Data berasal dari simulator.
      </LegacyBanner>
    );

    const status = screen.getByRole("status");
    expect(
      within(status).getByRole("button", { name: "Coba lagi" })
    ).toBeInTheDocument();
  });
});

describe("the deleted vocabulary", () => {
  it("lives in the primitive and nowhere else", () => {
    expect(TONE_KEYS).toHaveLength(4);
    // The owner is where the vocabulary is read from, not re-typed here.
    expect(bannerSource, "AlertBanner no longer declares the tone map").toContain(
      "const TONES = {"
    );
    expect(
      legacyCode,
      "the comment strip removed the delegate along with the comments"
    ).toContain("<AlertBanner");

    for (const tone of TONE_KEYS) {
      const config = BANNER_TONES[tone];
      for (const classString of [config.tone, config.icon]) {
        expect(
          legacyCode,
          `StatusBanner re-declares ${tone}'s class string`
        ).not.toContain(classString);
      }
    }
  });

  it("leaves no tone map and no role decision in the delegate", () => {
    expect(legacySource, "the delegate restored a tone map").not.toMatch(/TONES/);
    expect(
      legacyCode,
      "the delegate re-decided the role instead of rendering the primitive"
    ).not.toMatch(/\brole\s*=/);
  });
});
