import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { StatePanel, StateRetry } from "./StatePanel";

/**
 * The state primitive's contract, per variant.
 *
 * The states announce themselves rather than merely being drawn:
 *   loading -> role="status", aria-live="polite"
 *   error   -> role="alert"
 *   empty   -> ordinary content with a heading, so it reads in order
 *
 * That role is not decided in the component: it comes from `roleFor` in
 * `feedbackState.js`, and the same function decides the banner's role. The
 * cases below are unchanged in what they expect of the rendering, because the
 * register is preserved by decision — what moved is the owner of the decision.
 *
 * `StatePanel` and `StateRetry` are pure presentational components, so no
 * provider wrapper is needed.
 */

const here = path.dirname(fileURLToPath(import.meta.url));

/** The skeleton bars, counted by the surface token they reserve space with. */
const BARS = ".bg-surface-3";

describe("StatePanel variants", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("announces loading politely and reserves the space with skeletons", () => {
    render(<StatePanel variant="loading" title="Loading chart" />);

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");

    // The bars are plain divs, so they are counted by the class that reserves
    // their space. They used to be counted by the class that animated them,
    // which C-01 removed: nothing inside the loading register animates.
    expect(status.querySelectorAll(BARS)).toHaveLength(3);

    const title = screen.getByText("Loading chart");
    expect(title.tagName).toBe("P");
  });

  it("honours the rows prop on the loading skeleton", () => {
    render(<StatePanel variant="loading" rows={5} title="Loading chart" />);

    expect(screen.getByRole("status").querySelectorAll(BARS)).toHaveLength(5);
  });

  it("animates nothing inside the loading register", () => {
    const { container } = render(
      <StatePanel variant="loading" title="Loading chart" />
    );

    // The utility's name and its prefix are assembled from parts rather than
    // written whole, so searching this directory for the animation prefix stays
    // a clean invariant: the only hit would otherwise be this assertion. Same
    // reason `copy.test.js` and `TelemetryChart.test.jsx` build literals from
    // pieces.
    const ANIMATE = ["animate", ""].join("-");
    const PULSE = ["animate", "pulse"].join("-");

    // A pulsing skeleton competes with the risk announcement for attention on a
    // console that is watched continuously.
    expect(container.innerHTML).not.toContain(PULSE);
    expect(container.innerHTML).not.toContain(ANIMATE);

    // The reserved space is unchanged: same height, declared radius, computed
    // width per bar.
    const bars = screen.getByRole("status").querySelectorAll(BARS);
    expect(bars.length).toBeGreaterThan(0);
    for (const bar of bars) {
      expect(bar.className).toContain("h-4");
      expect(bar.className).toContain("rounded-control");
      expect(bar.getAttribute("style")).toMatch(/width: \d+%/);
    }
  });

  it("inks the description with fg-2, because the error panel sits on a tint", () => {
    render(
      <StatePanel
        variant="error"
        title="Connection failed"
        description="The device stopped sending."
        action={<button type="button">Retry</button>}
      />
    );

    const description = screen.getByText("The device stopped sending.");
    expect(description.className).toContain("text-fg-2");
    expect(description.className).not.toContain("text-muted");
  });

  it("announces an error as an alert and offers a real retry control", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(
      <StatePanel
        variant="error"
        title="Connection failed"
        description="The device stopped sending."
        action={<StateRetry onRetry={onRetry} label="Try again" />}
      />
    );

    const alert = screen.getByRole("alert");
    // The icon is a redundant channel, never an announced one.
    for (const icon of alert.querySelectorAll("svg")) {
      expect(icon).toHaveAttribute("aria-hidden", "true");
    }

    const button = within(alert).getByRole("button", { name: "Try again" });
    expect(button).toHaveAttribute("type", "button");
    expect(button.className).toContain("min-h-[44px]");
    expect(button.className).toContain("focus-visible:ring-2");

    await user.click(button);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders a next-action string with an announced label naming it as the step", () => {
    render(
      <StatePanel
        variant="empty"
        title="No chart data yet"
        description="The chart fills once the sensor sends its first reading."
        nextAction="Reload the page to try again."
        nextActionLabel="Next step"
      />
    );

    expect(
      screen.getByText("Reload the page to try again.")
    ).toBeInTheDocument();

    // The label is the channel that says "this is the step", not a second
    // cause, so it is announced rather than merely written.
    const label = screen.getByText(/^Next step:$/);
    expect(label.tagName).toBe("SPAN");
    expect(label.className).toContain("sr-only");
  });

  it("warns once in development when a register names a cause and no next action", () => {
    vi.stubEnv("DEV", true);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    render(
      <StatePanel
        variant="error"
        title="Connection failed"
        description="The device stopped sending."
      />
    );

    expect(warn).toHaveBeenCalledTimes(1);
    const line = String(warn.mock.calls[0][0]);
    expect(line).toContain("StatePanel");
    expect(line).toContain("error");

    // The benign production behaviour: the cause still renders.
    expect(screen.getByText("Connection failed")).toBeInTheDocument();
  });

  it("stays silent outside development and still renders the cause", () => {
    vi.stubEnv("DEV", false);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    render(<StatePanel variant="empty" title="No chart data yet" />);

    expect(warn).not.toHaveBeenCalled();
    expect(screen.getByText("No chart data yet")).toBeInTheDocument();
  });

  it("keeps an empty view out of every live region", () => {
    render(
      <StatePanel
        variant="empty"
        title="No chart data yet"
        description="The chart fills once the sensor sends its first reading."
        action={<button type="button">Refresh</button>}
      />
    );

    // An empty view must read in document order, not interrupt the screen
    // reader. This is the case that catches a regression where someone wraps
    // every variant in a live region.
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();

    const title = screen.getByText("No chart data yet");
    expect(title).toBeInTheDocument();
    expect(
      screen.getByText("The chart fills once the sensor sends its first reading.")
    ).toBeInTheDocument();
    // The action slot renders inside the panel, under the cause.
    expect(
      within(title.parentElement).getByRole("button", { name: "Refresh" })
    ).toBeInTheDocument();
  });

  it("treats an unknown variant as the benign empty shape", () => {
    render(<StatePanel variant="unknown" title="Something to say" />);

    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("Something to say")).toBeInTheDocument();
  });
});

/**
 * The page layer, swept as source.
 *
 * FIX-08 forbids answering "no rows" with a bare line of text. The cheapest
 * durable check is that any page which has a zero-data branch must own an
 * explicit state primitive to render it. This asserts the anti-pattern is
 * absent; it does not require every page to declare all three variants, because
 * a connection panel (connecting, errored, established) legitimately has no
 * empty state and a locally computed preview has no loading state.
 */
describe("pages with a zero-data branch", () => {
  const PAGES = path.join(here, "..", "..", "pages");

  const collectSources = (dir) => {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        out.push(...collectSources(full));
      } else if (/\.(jsx?|tsx?)$/.test(entry.name) && !entry.name.includes(".test.")) {
        out.push(full);
      }
    }
    return out;
  };

  /**
   * A zero-data RENDER branch: the empty arm of a conditional. It is anchored
   * on the ternary, so a guard (`if (rows.length === 0) return;`), a disabled
   * prop or a validation check (`Object.keys(x).length === 0`) is not a render
   * branch and is out of scope.
   */
  const ZERO_DATA_BRANCH = /(?:!hasData|\b\w[\w.[\]]*length\s*===\s*0|\bisEmpty)\s*\?/;

  it("owns a state primitive rather than shipping a bare line of text", () => {
    const offenders = [];

    for (const file of collectSources(PAGES)) {
      const source = fs.readFileSync(file, "utf8");
      const hasZeroDataBranch = source
        .split("\n")
        .some((line) => ZERO_DATA_BRANCH.test(line));
      if (!hasZeroDataBranch) continue;
      if (!/\bStatePanel\b/.test(source)) {
        offenders.push(path.relative(PAGES, file));
      }
    }

    expect(offenders, "pages answering no rows with bare text").toEqual([]);
  });
});

/**
 * The two-tier feedback contract, swept as source over ONE page (D-03).
 *
 * A feedback surface owes the reader what happened and what to do next. The
 * repair set for this phase is exactly the five `AdminPage` sites, which is why
 * the sweep is scoped to that file rather than to every page: the whole-app
 * sweep is Phase 5's work, and running it here would fail on eight panels in
 * `DashboardPage`, `DevicePage`, `HistoryPage`, `MonitoringPage`, `ProfilePage`
 * and `SettingsPage` that carry a cause with no next step today. Those are
 * recorded, not repaired behind the plan's back.
 *
 * The site count is asserted before the verdict, so a renamed component or a
 * moved file fails here instead of passing the sweep by finding nothing.
 */
describe("the admin page's feedback sites", () => {
  const ADMIN = path.join(here, "..", "..", "pages", "AdminPage.jsx");

  const panelBlocks = (source) =>
    [...source.matchAll(/<StatePanel\b[\s\S]*?\/>/g)].map((match) => match[0]);

  it("gives each of the five error and empty panels a cause and a next action", () => {
    const panels = panelBlocks(fs.readFileSync(ADMIN, "utf8")).filter((block) =>
      /\bvariant="(?:error|empty)"/.test(block)
    );

    expect(panels).toHaveLength(5);

    const offenders = panels
      .filter((block) => !/\baction=|\bnextAction=/.test(block))
      .map((block) => block.replace(/\s+/g, " ").slice(0, 90));

    expect(offenders, "panels naming a cause with nothing to do about it").toEqual(
      []
    );
  });
});
