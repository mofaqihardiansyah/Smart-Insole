import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import React from "react";
import { InsoleProvider } from "../../context/InsoleContext";
import { UserProvider } from "../../context/UserContext";
import AdminUsersPage from "./AdminUsersPage";

const mocks = vi.hoisted(() => ({
  listUsers: vi.fn(),
  updateUserDoc: vi.fn(),
  pairDevice: vi.fn(),
  unpairDevice: vi.fn(),
  mirrorAccountFlag: vi.fn(),
  removeUserMirror: vi.fn(),
  appendAudit: vi.fn(),
  allDevices: vi.fn(),
}));

vi.mock("../../services/firebaseConfig", () => ({
  listUsers: mocks.listUsers,
  updateUserDoc: mocks.updateUserDoc,
}));

vi.mock("../../services/firebaseRealtime", () => ({
  pairDevice: mocks.pairDevice,
  unpairDevice: mocks.unpairDevice,
  mirrorAccountFlag: mocks.mirrorAccountFlag,
  removeUserMirror: mocks.removeUserMirror,
  appendAudit: mocks.appendAudit,
  subscribeToAllUserDevices: (cb: (map: Record<string, string[]>) => void) => {
    mocks.allDevices(cb);
    return () => {};
  },
}));

const ADMIN = { uid: "admin-1", email: "admin@example.com" };

const renderPage = () =>
  render(
    <MemoryRouter>
      <InsoleProvider>
        <UserProvider
          value={{
            user: ADMIN as never,
            displayName: "Admin",
            role: "admin",
            signOut: () => {},
          }}
        >
          <AdminUsersPage />
        </UserProvider>
      </InsoleProvider>
    </MemoryRouter>
  );

const rows = [
  { uid: "admin-1", displayName: "Admin Satu", email: "admin@example.com", role: "admin", active: true },
  { uid: "user-1", displayName: "Budi", email: "budi@example.com", role: "user", active: true },
  { uid: "user-2", displayName: "Siti", email: "siti@example.com", role: "user", active: false },
];

describe("AdminUsersPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mocks.listUsers.mockResolvedValue(rows);
    mocks.allDevices.mockImplementation((cb: (map: Record<string, string[]>) => void) => cb({}));
    mocks.pairDevice.mockResolvedValue(undefined);
    mocks.mirrorAccountFlag.mockResolvedValue(undefined);
    mocks.appendAudit.mockResolvedValue(undefined);
  });

  it("lists accounts and filters by search", async () => {
    const user = userEvent.setup();
    renderPage();

    // Both the table and the stacked mobile list are in the DOM; CSS decides
    // which one a viewport shows, so the assertions collect all copies.
    expect((await screen.findAllByText("Budi")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Siti").length).toBeGreaterThan(0);

    await user.type(screen.getByLabelText("Cari nama atau email"), "budi");
    expect(screen.getAllByText("Budi").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Siti")).toHaveLength(0);
  });

  it("disables self-actions so the console cannot lock its own door", async () => {
    renderPage();

    const selfRow = (await screen.findAllByText("Admin Satu"))[0].closest("tr") as HTMLElement;
    expect(selfRow.textContent).toContain("Tidak bisa mengubah akun sendiri.");
  });

  it("pairs a device through the RTDB path", async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findAllByText("Budi");
    await user.type(screen.getAllByLabelText("Belum dipasangkan")[0], "insole-07");
    await user.click(screen.getAllByRole("button", { name: "Pasangkan" })[0]);

    expect(mocks.pairDevice).toHaveBeenCalledWith("admin-1", "insole-07");
    expect(mocks.appendAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "device.pair", target: "insole-07" })
    );
  });

  it("refuses a device already paired with another account", async () => {
    const user = userEvent.setup();
    mocks.allDevices.mockImplementation((cb: (map: Record<string, string[]>) => void) =>
      cb({ "user-1": ["insole-07"] })
    );
    renderPage();

    await screen.findAllByText("Siti");
    // Budi already owns insole-07, so the field under Siti's row is the second.
    await user.type(screen.getAllByLabelText("Belum dipasangkan")[0], "insole-07");
    await user.click(screen.getAllByRole("button", { name: "Pasangkan" })[0]);

    expect(screen.getByText(/sudah dipasangkan ke akun lain/i)).toBeInTheDocument();
    expect(mocks.pairDevice).not.toHaveBeenCalled();
  });
});
