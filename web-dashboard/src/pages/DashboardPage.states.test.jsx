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
 * state, where no reading can arrive: incoming samples exist only through
 * `push`, so no assertion races a 1 Hz tick.
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
 * A panel region, resolved from its own heading and its data-panel hook.
 * `PanelHeader` renders the title as an `h2`, and the nearest ancestor carrying
 * `data-panel` is that panel's container: a GlassCard where the panel is
 * boxed (trend, donut, map) or the open ruled section on the live feed, which
 * is deliberately not a card. The locator asserts it resolved, so a broken
 * locator fails loudly instead of passing vacuously.
 */
const regionFor = (title) => {
  const heading = screen.getByRole("heading", { name: title });
  const region = heading.closest("[data-panel]");
  expect(region, `panel titled ${title}`).not.toBeNull();
  return region;
};

const trendRegion = () => regionFor(t("dashboard.trendTitle", LANGUAGE));
const feedRegion = () => regionFor(t("dashboard.activityTitle", LANGUAGE));

/**
 * The tone each reachable risk verdict must paint the score tile with.
 *
 * These are the semantic pairs the component already carries, not decoration:
 * colour is a vital sign, so the `safe` verdict must render the sage tile and
 * never the neutral one.
 */
const RISK_TONE = {
  safe: "bg-safe/15 text-safe-ink",
  warning: "bg-warning/15 text-warning-ink",
  danger: "bg-danger/15 text-danger-ink",
};
/** What a verdict that reached the component's unmapped-key fallback renders. */
const NEUTRAL_TONE = "bg-surface-2 text-fg-2";

/**
 * The score tile's icon span. The tile is located by its own title, which is
 * unique on this page, and the `rounded-tile` descendant is the icon tile and
 * nothing else (`BentoGrid.jsx:55`). The locator asserts it resolved, so a
 * broken locator fails loudly instead of passing vacuously.
 */
const scoreIcon = () => {
  const title = screen.getByText(t("risk.score", LANGUAGE));
  const tile = title.parentElement.querySelector(".rounded-tile");
  expect(tile, "the score tile's icon span").not.toBeNull();
  return tile;
};

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

describe("the score tile's semantic tone", () => {
  beforeEach(() => {
    localStorage.clear();
    ctxRef.current = null;
  });

  const assertTone = (verdict) => {
    const tile = scoreIcon();
    expect(tile.className, verdict).toContain(RISK_TONE[verdict]);
    expect(tile.className, `a grey tile for a ${verdict} reading`).not.toContain(
      NEUTRAL_TONE
    );
  };

  it("paints a good reading with the sage tone, never the neutral fallback", () => {
    // A settled, empty session leaves the verdict at its initial `safe`. That
    // verdict value is not a tone key, so passing it through would reach the
    // component's neutral fallback and paint a good foot grey — the defect
    // FIX-06 and DESIGN.md:51-56 exist to refuse. The component cannot catch it:
    // an unmapped tone key is absorbed silently at BentoGrid.jsx:56.
    renderDashboard({ autoConnect: true });
    assertTone("safe");
  });

  it("paints a warning reading with the warning tone", () => {
    renderDashboard({ autoConnect: true });
    push({ forefoot: 40, midfoot: 20, heel: 20 });
    assertTone("warning");
  });

  it("paints a danger reading with the danger tone", () => {
    renderDashboard({ autoConnect: true });
    push({ forefoot: 75, midfoot: 20, heel: 20 });
    assertTone("danger");
  });
});

/**
 * The meter band's Cadra vocabulary (cadra-2): the four tiles are assigned
 * specific completions by the restyle plan, and the assignment is data on the
 * card, never its position: the peak tile earns the one inverted dark card,
 * duration and battery read as proportion meters, and the score tile carries
 * the real trend sparkline.
 */
describe("the meter band's Cadra vocabulary", () => {
  const tileOfClass = (key) => {
    const title = screen.getByText(t(key, LANGUAGE));
    const tile = title.closest("[data-cell]");
    expect(tile, `tile titled ${key}`).not.toBeNull();
    return tile;
  };

  it("assigns each tile its planned completion", () => {
    // Two samples: the score tile's sparkline needs at least two finite points,
    // and the feed needs a row for its mini bar.
    renderDashboard({ autoConnect: true });
    push({ forefoot: 30, midfoot: 15, heel: 12 });
    push({ forefoot: 34, midfoot: 16, heel: 11 });

    const peak = tileOfClass("metrics.peakPressure");
    const duration = tileOfClass("metrics.sustainedDuration");
    const score = tileOfClass("risk.score");
    const supply = tileOfClass("device.battery");

    expect(peak.className).toContain("bg-inverted");
    expect(peak.querySelector(".tabular-data").className).toContain(
      "text-inverted-fg"
    );

    expect(duration.className).toContain("bg-tint-cream");
    expect(duration.querySelector("[data-meter-fill]")).not.toBeNull();

    expect(score.className).toContain("bg-tint-mint");
    expect(score.querySelector("svg polyline")).not.toBeNull();

    expect(supply.className).toContain("bg-tint-blue");
    // The meter presence or absence for this tile is its own state contract
    // below ("reads the battery meter only when a battery value exists");
    // a setReadings-driven sample never carries a battery value, so the
    // honest assertion here is the tint, not a filled meter.
  });

  it("inverts exactly one tile, the one carrying the plan's dark card", () => {
    renderDashboard({ autoConnect: true });
    push({ forefoot: 30, midfoot: 15, heel: 12 });

    const dark = [...document.querySelectorAll("[data-cell]")].filter((cell) =>
      cell.className.includes("bg-inverted")
    );
    expect(dark).toHaveLength(1);
    expect(dark[0].textContent).toContain(t("metrics.peakPressure", LANGUAGE));
  });

  it("reads the battery meter only when a battery value exists", () => {
    // The stub supply arrives without a battery field, so the meter that would
    // draw a division by NaN must not exist at all; the tile still stands.
    renderDashboard({ autoConnect: true });
    push({ forefoot: 30, midfoot: 15, heel: 12 });

    const supply = tileOfClass("device.battery");
    expect(supply.querySelector("[data-meter-fill]")).toBeNull();
    expect(supply.className).toContain("bg-tint-blue");
  });

  it("gives each feed row a pressure-vs-threshold mini bar", () => {
    renderDashboard({ autoConnect: true });
    push({ forefoot: 30, midfoot: 15, heel: 12 });
    push({ forefoot: 34, midfoot: 16, heel: 11 });

    const feed = feedRegion();
    const fills = feed.querySelectorAll("[data-feed-fill]");
    // Two records are in the visible window, so two rows carry the bar.
    expect(fills.length).toBeGreaterThanOrEqual(2);

    // The bar is a decoration over a number the row already states in text,
    // so it is hidden from the accessibility tree rather than read twice.
    for (const fill of fills) {
      expect(fill.getAttribute("aria-hidden")).toBe("true");
    }
  });
});
