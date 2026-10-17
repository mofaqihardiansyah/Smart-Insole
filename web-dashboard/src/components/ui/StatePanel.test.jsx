import { describe, it, expect, beforeEach, vi } from "vitest";
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
 * `StatePanel` and `StateRetry` are pure presentational components, so no
 * provider wrapper is needed.
 */

const here = path.dirname(fileURLToPath(import.meta.url));

describe("StatePanel variants", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("announces loading politely and reserves the space with skeletons", () => {
    render(<StatePanel variant="loading" title="Loading chart" />);

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");

    // The bars are plain divs, so they are counted by the class that animates
    // them rather than by tag.
    expect(status.querySelectorAll(".animate-pulse")).toHaveLength(3);

    const title = screen.getByText("Loading chart");
    expect(title.tagName).toBe("P");
  });

  it("honours the rows prop on the loading skeleton", () => {
    render(<StatePanel variant="loading" rows={5} title="Loading chart" />);

    expect(
      screen.getByRole("status").querySelectorAll(".animate-pulse")
    ).toHaveLength(5);
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
      } else if (entry.name.endsWith(".jsx") && !entry.name.includes(".test.")) {
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
