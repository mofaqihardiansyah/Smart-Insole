import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import React from "react";
import { InsoleProvider } from "../../context/InsoleContext";
import { UserProvider } from "../../context/UserContext";
import { RequireAdmin } from "./RequireAdmin";
import { AdminLayout } from "./AdminLayout";

/**
 * The console's front door and its shell.
 *
 * The role resolves asynchronously, so the loading branch is a real state, not
 * a cosmetic one: showing the refusal first would flash at every admin refresh.
 */

const renderGuard = (role: string) =>
  render(
    <MemoryRouter>
      <InsoleProvider>
        <UserProvider
          value={{
            user: null,
            displayName: "Admin",
            role,
            signOut: () => {},
          }}
        >
          <RequireAdmin>
            <p>isi konsol</p>
          </RequireAdmin>
        </UserProvider>
      </InsoleProvider>
    </MemoryRouter>
  );

describe("RequireAdmin", () => {
  beforeEach(() => localStorage.clear());

  it("waits while the role is still loading", () => {
    renderGuard("");
    expect(screen.getByText("Memeriksa akses admin")).toBeInTheDocument();
    expect(screen.queryByText("isi konsol")).toBeNull();
  });

  it("refuses a signed-in non-admin", () => {
    renderGuard("user");
    expect(screen.getByText(/Akses ditolak/i)).toBeInTheDocument();
    expect(screen.queryByText("isi konsol")).toBeNull();
  });

  it("renders the console for an admin", () => {
    renderGuard("admin");
    expect(screen.getByText("isi konsol")).toBeInTheDocument();
  });
});

describe("AdminLayout", () => {
  beforeEach(() => localStorage.clear());

  it("renders five tabs and no patient-shell controls", () => {
    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <InsoleProvider>
          <UserProvider
            value={{
              user: null,
              displayName: "Admin",
              role: "admin",
              signOut: () => {},
            }}
          >
            <AdminLayout>
              <p>isi</p>
            </AdminLayout>
          </UserProvider>
        </InsoleProvider>
      </MemoryRouter>
    );

    expect(screen.getAllByRole("link", { name: /Ringkasan|Pengguna|Perangkat|Insiden|Konfigurasi/ })).toHaveLength(5);
    expect(screen.queryByTestId("alert-bell")).toBeNull();
    expect(screen.getByRole("link", { name: "Buka aplikasi" })).toHaveAttribute("href", "/");
  });
});
