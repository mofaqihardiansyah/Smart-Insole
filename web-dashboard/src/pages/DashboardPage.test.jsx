import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, within, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { InsoleProvider, useInsole } from "../context/InsoleContext";
import { UserProvider } from "../context/UserContext";
import { t, hasKey } from "../utils/i18n";
import DashboardPage from "./DashboardPage";

const here = path.dirname(fileURLToPath(import.meta.url));
/** This file lives in `src/pages`, so the shipped sources are one level up. */
const SRC = path.resolve(here, "..");

/**
 * Every shipped `.jsx` / `.js` under `dir`, recursively.
 *
 * Trimmed to those two extensions so committed build output is never read: a
 * dead control has to be written into a module that exports UI, and `dist/`
 * holds bundles rather than sources.
 */
const collectSources = (dir) => {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectSources(full));
    } else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
};

/**
 * Behavioural tests for the dashboard, not screenshot tests.
 *
 * The dashboard is the page the whole rebuild is about, and it carries four
 * controls that did not exist before: Export CSV, Mark as read, the per-row
 * overflow menu and Load more. Each one has to actually do the thing its label
 * says, which is what these assert.
 */

/** Pushes readings into the provider so the page has a populated ring buffer. */
const ctxRef = { current: null };
const Driver = () => {
  ctxRef.current = useInsole();
  return null;
};

/**
 * A stub device feed that never answers. Without a 1 Hz generator there is no
 * tick to race against any more: readings only enter through `push`, so the
 * row counts below are deterministic.
 */
const stubTransport = {
  subscribeToReadings: () => () => {},
  subscribeToHistory: () => () => {},
};

/**
 * Render the dashboard inside the real providers.
 *
 * `autoConnect` on (the default) puts the provider on the connecting state with
 * the stub feed, so the connection stays unanswered. Off mounts it idle, which
 * is the only way to reach the no-device banner.
 */
const renderDashboard = ({ autoConnect = true } = {}) => {
  const utils = render(
    <InsoleProvider autoConnect={autoConnect} transport={stubTransport}>
      <UserProvider value={{ user: { email: "kader@example.com" }, displayName: "Kader" }}>
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
  return utils;
};

/** Each reading must land in its own commit, or React batches them into one. */
const push = (count, readings = { forefoot: 20, midfoot: 12, heel: 9 }) => {
  for (let i = 0; i < count; i += 1) {
    act(() => {
      ctxRef.current.setReadings({
        forefoot: readings.forefoot + i,
        midfoot: readings.midfoot,
        heel: readings.heel,
      });
    });
  }
};

describe("DashboardPage controls", () => {
  let createObjectURL;
  let revokeObjectURL;
  const realCreate = URL.createObjectURL;
  const realRevoke = URL.revokeObjectURL;

  beforeEach(() => {
    localStorage.clear();
    ctxRef.current = null;
    createObjectURL = vi.fn(() => "blob:mock");
    revokeObjectURL = vi.fn();
    // Assigned, not stubbed wholesale: `URL` is still used as a constructor by
    // the router, so replacing the global breaks navigation.
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
  });

  afterEach(() => {
    URL.createObjectURL = realCreate;
    URL.revokeObjectURL = realRevoke;
  });

  it("greets the signed-in user and renders the four metric tiles", () => {
    renderDashboard();

    expect(
      screen.getByRole("heading", { level: 1, name: /kader/i })
    ).toBeInTheDocument();

    expect(screen.getAllByText(/tekanan puncak/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/durasi tumpuan/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/skor risiko/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/^baterai$/i)).toBeInTheDocument();
  });

  it("lists real readings in the activity feed and loads more on request", async () => {
    const user = userEvent.setup();
    renderDashboard();

    push(8);

    const table = screen.getByRole("table", { name: /aktivitas terbaru/i });
    expect(within(table).getAllByRole("row")).toHaveLength(1 + 5);

    await user.click(screen.getByRole("button", { name: /muat lebih banyak/i }));

    expect(within(table).getAllByRole("row")).toHaveLength(1 + 8);
    // Everything is shown, so the control retires rather than doing nothing.
    expect(
      screen.queryByRole("button", { name: /muat lebih banyak/i })
    ).not.toBeInTheDocument();
  });

  it("opens a row menu with real actions and navigates on the first", async () => {
    const user = userEvent.setup();
    renderDashboard();

    push(3);

    const menuButtons = screen.getAllByRole("button", {
      name: /aksi/i,
    });
    expect(menuButtons.length).toBeGreaterThan(0);

    await user.click(menuButtons[0]);

    const menu = screen.getByRole("menu");
    expect(within(menu).getAllByRole("menuitem")).toHaveLength(2);

    await user.click(within(menu).getByRole("menuitem", { name: /buka di riwayat/i }));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 1, name: /riwayat sesi/i })
      ).toBeInTheDocument()
    );
  });

  it("closes the row menu on Escape", async () => {
    const user = userEvent.setup();
    renderDashboard();

    push(3);
    await user.click(screen.getAllByRole("button", { name: /aksi/i })[0]);
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("exports the session buffer as CSV with a real click", async () => {
    const user = userEvent.setup();
    renderDashboard();

    // With an empty buffer the button is honest about having nothing to export.
    const exportButton = screen.getByRole("button", { name: /ekspor csv/i });
    expect(exportButton).toBeDisabled();

    push(4);
    await user.click(screen.getByRole("button", { name: /ekspor csv/i }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0][0];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toContain("text/csv");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock");
  });

  it("disables Mark as read until there is an unread alert", async () => {
    const user = userEvent.setup();
    renderDashboard();

    const idle = screen.getByRole("button", { name: /semua peringatan sudah dibaca/i });
    expect(idle).toBeDisabled();

    // A sustained high reading produces a real incident, which makes the alert
    // queue non-empty and the action meaningful.
    push(35, { forefoot: 80, midfoot: 70, heel: 66 });

    const action = await screen.findByRole("button", { name: /tandai dibaca/i });
    expect(action).toBeEnabled();

    await user.click(action);
    expect(
      await screen.findByRole("button", { name: /semua peringatan sudah dibaca/i })
    ).toBeDisabled();
  });

  /**
   * FIX-05: the header carries exactly the two standing actions this product
   * actually has. DESIGN.md names the reference's two dead controls and states
   * the rule this locks: a button that cannot act is a defect, not decoration.
   * A page that renders one is rendering a control with nothing behind it.
   */
  describe("DashboardPage standing actions (FIX-05)", () => {
    it("exposes exactly two standing actions in the header", () => {
      const { container } = renderDashboard();
      const header = container.querySelector('[data-panel="hero"]');

      expect(header).not.toBeNull();
      // Two, and only two: the count is what a reintroduced dead control breaks.
      expect(within(header).getAllByRole("button")).toHaveLength(2);
      expect(
        within(header).getByRole("button", { name: /ekspor csv/i })
      ).toBeInTheDocument();
      expect(
        within(header).getByRole("button", {
          name: /semua peringatan sudah dibaca/i,
        })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /ekspor pdf|sesi baru/i })
      ).not.toBeInTheDocument();
    });

    it("still exposes exactly two after the reading state changes", () => {
      const { container } = renderDashboard();
      expect(within(container.querySelector('[data-panel="hero"]')).getAllByRole("button")).toHaveLength(2);

      // Push readings so both actions become meaningful (Export CSV leaves its
      // disabled state, the feed fills up). The count is a property of the
      // markup, so a state transition that added a control would fail here.
      push(6);

      expect(within(container.querySelector('[data-panel="hero"]')).getAllByRole("button")).toHaveLength(2);
      expect(
        within(container.querySelector('[data-panel="hero"]')).getByRole("button", {
          name: /ekspor csv/i,
        })
      ).toBeEnabled();
    });

    it("ships neither dead control label in any module under src", () => {
      // Assembled from parts on purpose: this scan reads its own file too, and
      // a literal would make the scanner the one thing it bans.
      const deadLabels = [
        ["Export", "PDF"].join(" "),
        ["New", "Session"].join(" "),
      ];

      const files = collectSources(SRC);
      expect(files.length).toBeGreaterThan(40);

      const offenders = files.filter((file) => {
        const source = fs.readFileSync(file, "utf8");
        return deadLabels.some((label) => source.includes(label));
      });

      expect(offenders.map((file) => path.relative(SRC, file))).toEqual([]);
    });
  });

  /**
   * FIX-07: the connection is always labelled. A live-but-silent device must
   * not be dressed as live data, and an unanswered one must not invent data of
   * any sort: the only source is the real device, so the states are idle,
   * connecting or error. Every state says which it is, and the wording comes
   * from the dictionary so it travels through the same gates as every other
   * string.
   */
  describe("DashboardPage data source labelling (FIX-07)", () => {
    it("labels an idle provider with the no-device banner, not invented data", () => {
      renderDashboard({ autoConnect: false });

      const title = t("source.noDeviceTitle", "id");
      const banner = screen.getByText(title).closest('[role="status"]');

      // role="status" is the warning banner, not the danger variant: this is a
      // notice about the data, not an interruption.
      expect(banner).not.toBeNull();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();

      // The body says why there is nothing on screen: the device has not sent
      // anything yet.
      expect(banner).toHaveTextContent(t("source.noDeviceBody", "id"));

      // Nothing on the page claims a measured connection.
      expect(screen.queryByText(t("source.live", "id"))).not.toBeInTheDocument();
    });

    it("does not label an unanswered device as live", () => {
      renderDashboard();

      expect(
        screen.queryByText(t("source.live", "id"))
      ).not.toBeInTheDocument();
      // The connecting panel is what renders instead.
      expect(
        screen.getAllByText(t("source.connecting", "id")).length
      ).toBeGreaterThan(0);
    });

    it("ships the no-device wording straight from the dictionary", () => {
      renderDashboard({ autoConnect: false });

      const title = t("source.noDeviceTitle", "id");
      const body = t("source.noDeviceBody", "id");

      // Both keys must exist. Without them `t` returns the key itself, and the
      // comparisons below would pass against the key rather than against copy.
      expect(hasKey("source.noDeviceTitle")).toBe(true);
      expect(hasKey("source.noDeviceBody")).toBe(true);

      const banner = screen.getByText(title).closest('[role="status"]');
      expect(banner).not.toBeNull();
      expect(within(banner).getByText(title)).toHaveTextContent(title);
      expect(within(banner).getByText(body)).toHaveTextContent(body);
    });
  });
});
