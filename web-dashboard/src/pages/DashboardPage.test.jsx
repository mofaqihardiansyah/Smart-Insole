import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, within, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { InsoleProvider, useInsole } from "../context/InsoleContext";
import { UserProvider } from "../context/UserContext";
import DashboardPage from "./DashboardPage";

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
 * A stub device feed. `autoConnect` puts the provider on FIREBASE, which stops
 * the 1 Hz simulator: otherwise the page would gain a reading mid-assertion and
 * the row counts below would be a race.
 */
const stubTransport = {
  subscribeToReadings: () => () => {},
  subscribeToHistory: () => () => {},
};

const renderDashboard = () => {
  const utils = render(
    <InsoleProvider autoConnect transport={stubTransport}>
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
});
