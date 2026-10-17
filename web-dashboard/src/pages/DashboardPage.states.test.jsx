import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within, act } from "@testing-library/react";
import React from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { InsoleProvider, useInsole } from "../context/InsoleContext";
import { UserProvider } from "../context/UserContext";
import DashboardPage from "./DashboardPage";
import { t } from "../utils/i18n";

/**
 * The dashboard's zero-data behaviour.
 *
 * This page carries more than one live region. In the settled-empty state the
 * simulator banner is a `tone="warning"` StatusBanner, which is `role="status"`,
 * and the trend panel renders a second one while it is stuck loading. An
 * unscoped role query on this page therefore cannot tell those apart, so every
 * state assertion below is scoped with `within(...)` to a region resolved from
 * that panel's own heading.
 */

const LANGUAGE = "id";

/** Mirrors the provider value so the test can drive the ring buffer. */
const ctxRef = { current: null };
const Driver = () => {
  ctxRef.current = useInsole();
  return null;
};

/**
 * A stub device feed. `autoConnect` on puts the provider on its connecting
 * state and stops the 1 Hz simulator, so a reading cannot land mid-assertion.
 */
const stubTransport = {
  subscribeToReadings: () => () => {},
  subscribeToHistory: () => () => {},
};

/** A local render helper, so both reachable connection states can be driven. */
const renderDashboard = ({ autoConnect = false } = {}) =>
  render(
    <InsoleProvider autoConnect={autoConnect} transport={stubTransport}>
      <UserProvider
        value={{ user: { email: "kader@example.com" }, displayName: "Kader" }}
      >
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <Driver />
                  <DashboardPage />
                </>
              }
            />
            <Route path="/history" element={<h1>Riwayat sesi</h1>} />
          </Routes>
        </MemoryRouter>
      </UserProvider>
    </InsoleProvider>
  );

/**
 * A panel region, resolved from its own heading and its surface class.
 * `PanelHeader` renders the title as an `h2`, and the nearest ancestor carrying
 * the surface class is that panel's card. The locator asserts it resolved, so a
 * broken locator fails loudly instead of passing vacuously.
 */
const regionFor = (title) => {
  const heading = screen.getByRole("heading", { name: title });
  const region = heading.closest(".rounded-card");
  expect(region, `panel titled ${title}`).not.toBeNull();
  return region;
};

const trendRegion = () => regionFor(t("dashboard.trendTitle", LANGUAGE));
const feedRegion = () => regionFor(t("dashboard.activityTitle", LANGUAGE));

/** Each reading must land in its own commit, or React batches them into one. */
const push = (readings) => {
  act(() => {
    ctxRef.current.setReadings(readings);
  });
};

describe("DashboardPage data states", () => {
  beforeEach(() => {
    localStorage.clear();
    ctxRef.current = null;
  });

  it("answers a settled, empty session with an actionable empty state", () => {
    renderDashboard();

    const trend = trendRegion();
    // A settled, empty session is not loading: there is nothing coming.
    expect(within(trend).queryByRole("status")).toBeNull();
    expect(
      within(trend).getByText(t("monitoring.empty", LANGUAGE))
    ).toBeInTheDocument();
    expect(
      within(trend).getByText(t("monitoring.emptyBody", LANGUAGE))
    ).toBeInTheDocument();

    const feed = feedRegion();
    const noMatch = within(feed).getByText(t("dashboard.noMatch", LANGUAGE));
    // The bare one-line paragraph this replaces was a direct child of the feed
    // card. An empty region sits inside a panel that also holds the cause.
    expect(noMatch.parentElement).not.toBe(feed);
    const panel = noMatch.parentElement;
    expect(panel.querySelector("svg")).not.toBeNull();
    expect(panel.className).toMatch(/\bborder\b/);
    expect(
      within(panel).getByText(t("source.noDeviceBody", LANGUAGE))
    ).toBeInTheDocument();
  });

  it("announces an in-flight connection as loading", () => {
    renderDashboard({ autoConnect: true });

    const status = within(trendRegion()).getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(
      within(trendRegion()).getByText(t("monitoring.loading", LANGUAGE))
    ).toBeInTheDocument();
  });

  it("keeps the chart when there is data to draw", () => {
    renderDashboard({ autoConnect: true });
    push({ forefoot: 20, midfoot: 12, heel: 9 });

    const trend = trendRegion();
    expect(within(trend).getByRole("img")).toBeInTheDocument();
    expect(within(trend).queryByRole("status")).toBeNull();
    expect(within(trend).queryByRole("alert")).toBeNull();
    expect(within(trend).queryByText(t("monitoring.empty", LANGUAGE))).toBeNull();
  });
});
