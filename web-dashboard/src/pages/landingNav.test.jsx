import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import React from "react";

/**
 * The landing nav has two modes: it sits flush on the page edge at the top and
 * lifts into a floating bar once the visitor scrolls. The mode lives in React
 * state rather than in a class toggled on the DOM node, because the wrapper's
 * inset, the bar's width, its radius and its shadow all have to change
 * together, and half a mode (a floating shadow on a full-bleed bar) reads as a
 * bug.
 *
 * jsdom has no layout, so this locks the classes that carry each mode and the
 * transition that joins them, not the pixels.
 */

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({
    user: { uid: "u1", email: "kader@example.com", displayName: "Kader" },
    loading: false,
    displayName: "Kader",
    login: vi.fn().mockResolvedValue({ success: true }),
    register: vi.fn().mockResolvedValue({ success: true }),
    logout: vi.fn(),
    uploadProfilePhoto: vi.fn(),
  }),
}));

vi.mock("../services/firebaseRealtime", () => ({
  subscribeToReadings: () => () => {},
  subscribeToHistory: () => () => {},
  mapReadingPacket: () => null,
  mapHistory: () => [],
}));

const { InsoleProvider } = await import("../context/InsoleContext");
const LandingPage = (await import("./LandingPage")).default;

const renderLanding = () =>
  render(
    <MemoryRouter initialEntries={["/"]}>
      <InsoleProvider>
        <LandingPage />
      </InsoleProvider>
    </MemoryRouter>
  );

const navOf = (container) => container.querySelector("nav[aria-label]");

/** Move the page and let the scroll listener re-read the position. */
const scrollTo = (y) => {
  Object.defineProperty(window, "scrollY", {
    value: y,
    configurable: true,
    writable: true,
  });
  fireEvent.scroll(window);
};

beforeEach(() => {
  localStorage.clear();
  scrollTo(0);
});

describe("the landing nav's two modes", () => {
  it("starts flush on the page edge, with no inset, radius or shadow", () => {
    const { container } = renderLanding();
    const nav = navOf(container);
    const wrapper = nav.parentElement;

    expect(wrapper.className).toContain("top-0");
    expect(wrapper.className).toContain("pt-0");
    expect(nav.className).toContain("max-w-[100vw]");
    expect(nav.className).toContain("rounded-none");
    expect(nav.className).toContain("shadow-none");
    expect(nav.className).not.toContain("shadow-nav");
  });

  it("floats once the page moves, and returns to the edge at the top", () => {
    const { container } = renderLanding();
    const nav = navOf(container);
    const wrapper = nav.parentElement;

    scrollTo(600);

    expect(wrapper.className).toContain("pt-4");
    expect(wrapper.className).toContain("top-3");
    expect(nav.className).toContain("max-w-[880px]");
    expect(nav.className).toContain("rounded-tile");
    expect(nav.className).toContain("shadow-nav");

    scrollTo(0);

    expect(nav.className).toContain("max-w-[100vw]");
    expect(nav.className).toContain("shadow-none");
  });

  it("interpolates between the modes, and stops for reduced motion", () => {
    const { container } = renderLanding();
    const nav = navOf(container);
    const wrapper = nav.parentElement;

    expect(wrapper.className).toContain("transition-[padding,top]");
    expect(nav.className).toContain(
      "transition-[max-width,border-radius,box-shadow]"
    );
    expect(wrapper.className).toContain("duration-300");
    expect(nav.className).toContain("duration-300");
    expect(wrapper.className).toContain("motion-reduce:transition-none");
    expect(nav.className).toContain("motion-reduce:transition-none");
  });
});
