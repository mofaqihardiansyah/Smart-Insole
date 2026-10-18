import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import React from "react";
import { BUTTON_VARIANTS } from "../components/ui/GlassButton";
import { t } from "../utils/i18n";

/**
 * D-01: the landing CTA register, locked in the rendered DOM.
 *
 * `LandingPage` passes `variant="warm"` / `variant="warmOutline"` at eight call
 * sites, and `GlassButton` declares neither key, so `VARIANTS[variant] ||
 * VARIANTS.filled` painted the app-register navy button at every one of them:
 * the landing's two CTA ranks collapsed into one button rendered eight times,
 * and the hero's primary and secondary actions became visually identical, which
 * `01-UI-SPEC.md:89` forbids.
 *
 * The lock is on the DOM rather than on the source, because a source grep
 * cannot prove a class reached an element. The expected class strings are read
 * from the component's exported `BUTTON_VARIANTS` rather than re-typed here, so
 * a variant cannot silently diverge from the vocabulary it declares.
 *
 * Firebase Auth and the Realtime Database are both mocked, mirroring
 * `pages.test.jsx`: tests must not open a socket, and the auth listener would
 * otherwise never resolve.
 */

const mockAuth = {
  user: { uid: "u1", email: "kader@example.com", displayName: "Kader" },
  loading: false,
  displayName: "Kader",
  login: vi.fn().mockResolvedValue({ success: true }),
  register: vi.fn().mockResolvedValue({ success: true }),
  logout: vi.fn(),
  uploadProfilePhoto: vi.fn(),
};

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => mockAuth,
}));

vi.mock("../services/firebaseRealtime", () => ({
  subscribeToReadings: () => () => {},
  subscribeToHistory: () => () => {},
  mapReadingPacket: () => null,
  mapHistory: () => [],
}));

const { InsoleProvider } = await import("../context/InsoleContext");
const LandingPage = (await import("./LandingPage")).default;

/** The two declared landing ranks, read from the primitive that declares them. */
const RANKS = [BUTTON_VARIANTS.warm, BUTTON_VARIANTS.warmOutline];

const classesOf = (element) =>
  (element.getAttribute("class") || "").split(/\s+/).filter(Boolean);

const classString = (element) => element.getAttribute("class") || "";

/**
 * A landing CTA is a GlassButton, and `rounded-control` is the control radius
 * the radius scale declares for buttons. It is present whatever variant
 * resolves, so the count below cannot be satisfied by a collapsed CTA: a CTA
 * that fell back to `filled` is still counted, and then fails the per-button
 * verdict.
 *
 * This is what keeps the language toggle out of the set. Its active segment
 * carries `bg-primary-btn` at `LanguageToggle.jsx:38`, which is exactly the
 * token D-01 refused to remap: remapping it under `.landing-scope` would have
 * flipped that segment along with the CTAs.
 */
const isCta = (button) => classesOf(button).includes("rounded-control");

/**
 * A fixed height utility: `h-11`, `md:h-11`, `h-[48px]`. `min-h-*` is a floor
 * rather than a cap and is deliberately not matched: the floor is the
 * accessibility contract, the cap is what would stop a long localised label
 * from growing its control.
 */
const FIXED_HEIGHT = /^(?:[a-z0-9-]+:)*h-/;

const renderLanding = () =>
  render(
    <MemoryRouter initialEntries={["/"]}>
      <InsoleProvider>
        <LandingPage />
      </InsoleProvider>
    </MemoryRouter>
  );

/**
 * Renders the landing page with the mobile sheet open, and returns the eight
 * CTAs.
 *
 * The sheet's two call sites sit behind the nav trigger, so opening it is part
 * of finding all eight: the floor is the call-site count, not the six that a
 * desktop width happens to show. The count is asserted here, inside the helper,
 * so it precedes every per-button verdict in every case that uses it.
 */
const renderAllCtas = () => {
  const utils = renderLanding();

  fireEvent.click(
    screen.getByRole("button", { name: t("landing.nav.menu", "id") })
  );

  const ctas = [...utils.container.querySelectorAll("button")].filter(isCta);
  expect(ctas, "the eight landing CTA call sites all rendered").toHaveLength(8);

  return { ...utils, ctas };
};

describe("the landing CTA register", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("paints all eight CTAs in the warm register, none in the app register", () => {
    const { ctas } = renderAllCtas();

    ctas.forEach((cta, index) => {
      const label = cta.textContent.trim();
      const ranks = RANKS.filter((declaration) =>
        classString(cta).includes(declaration)
      );

      expect(
        ranks,
        `CTA ${index} ("${label}") is not exactly one declared warm rank`
      ).toHaveLength(1);

      expect(
        classesOf(cta),
        `CTA ${index} ("${label}") renders the app-register fill`
      ).not.toContain("bg-primary-btn");
    });

    // Both ranks are on the page. An all-outline landing would satisfy the loop
    // above while losing the hero's primary action.
    const filled = ctas.filter((cta) =>
      classesOf(cta).includes("bg-warm-accent-deep")
    );
    const outlined = ctas.filter((cta) =>
      classesOf(cta).includes("bg-warm-card")
    );
    expect(filled.length, "the landing lost its filled CTA").toBeGreaterThan(0);
    expect(outlined.length, "the landing lost its outlined CTA").toBeGreaterThan(
      0
    );
  });

  it("gives the hero two different actions rather than one button twice", () => {
    renderLanding();

    const hero = screen.getByRole("heading", { level: 1 }).closest("section");
    expect(hero, "the hero section holds the page heading").not.toBeNull();

    const heroCtas = within(hero).getAllByRole("button").filter(isCta);
    expect(heroCtas, "the hero holds exactly two actions").toHaveLength(2);

    const filled = heroCtas.find((cta) =>
      classesOf(cta).includes("bg-warm-accent-deep")
    );
    const outlined = heroCtas.find((cta) =>
      classesOf(cta).includes("bg-warm-card")
    );

    // Before D-01 both of these resolved to the `filled` declaration, so only
    // one of the two lookups above could succeed.
    expect(filled, "the hero's primary action is not the warm fill").toBeDefined();
    expect(
      outlined,
      "the hero's secondary action is not the warm outline"
    ).toBeDefined();

    // The assertion the defect fails on: two ranks, two class lists.
    expect(classString(filled)).not.toBe(classString(outlined));

    ["border-warm-line", "bg-warm-card", "text-warm-ink"].forEach((token) => {
      expect(
        classesOf(outlined),
        `the hero's secondary action is missing ${token}`
      ).toContain(token);
    });

    expect(
      classesOf(filled),
      "the hero's primary action borrows the outline's surface"
    ).not.toContain("bg-warm-card");
    expect(
      classesOf(outlined),
      "the hero's secondary action borrows the primary's fill"
    ).not.toContain("bg-warm-accent-deep");
  });

  it("lets a long label grow its CTA instead of clipping it", () => {
    const { ctas } = renderAllCtas();

    const capped = ctas.filter((cta) =>
      classesOf(cta).some((token) => FIXED_HEIGHT.test(token))
    );

    expect(
      capped.map((cta) => classString(cta)),
      "a CTA carries a fixed height, so a long localised label cannot grow it"
    ).toEqual([]);
  });
});
