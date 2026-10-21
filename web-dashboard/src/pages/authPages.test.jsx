import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import React from "react";

/**
 * The auth pages' behaviour that is not layout: the anti-enumeration message,
 * the reveal control, the strength meter, and the length floor. Layout at
 * 360, 768 and 1280 is checked in a browser, not here.
 */

const mockAuth = {
  user: null,
  loading: false,
  displayName: "",
  login: vi.fn(),
  register: vi.fn(),
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
const LoginPage = (await import("./LoginPage")).default;
const RegisterPage = (await import("./RegisterPage")).default;

const renderPage = (Page, route) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <InsoleProvider>
        <Page />
      </InsoleProvider>
    </MemoryRouter>
  );

/** Renders the page as a route so a successful submit can be followed. */
const renderNavigating = (Page, route) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <InsoleProvider>
        <Routes>
          <Route path={route} element={<Page />} />
          <Route path="/verify-email" element={<p>halaman verifikasi</p>} />
          <Route path="/" element={<p>dasbor</p>} />
        </Routes>
      </InsoleProvider>
    </MemoryRouter>
  );

const fillLogin = () => {
  fireEvent.change(screen.getByLabelText("Alamat email"), {
    target: { value: "Kader@Example.com" },
  });
  fireEvent.change(screen.getByLabelText("Kata sandi"), {
    target: { value: "Rahasia123" },
  });
};

const submitLogin = () =>
  fireEvent.click(screen.getByRole("button", { name: "Masuk" }));

beforeEach(() => {
  localStorage.clear();
  mockAuth.login.mockReset();
  mockAuth.register.mockReset();
});

describe("login page", () => {
  it("shows one generic message for a missing account", async () => {
    mockAuth.login.mockResolvedValue({
      success: false,
      code: "auth/user-not-found",
    });

    renderPage(LoginPage, "/login");
    fillLogin();
    submitLogin();

    expect(
      await screen.findByText("Email atau kata sandi salah.")
    ).toBeInTheDocument();
    expect(screen.getByText("Periksa email dan kata sandi, lalu coba lagi."))
      .toBeInTheDocument();
    // The raw Firebase code and its English explanation never reach the page.
    expect(screen.queryByText(/user-not-found/)).toBeNull();
    expect(screen.queryByText(/no user record/i)).toBeNull();
  });

  it("normalises the address before calling Firebase", async () => {
    mockAuth.login.mockResolvedValue({ success: false, code: "auth/unknown" });

    renderPage(LoginPage, "/login");
    fillLogin();
    submitLogin();

    await waitFor(() =>
      expect(mockAuth.login).toHaveBeenCalledWith(
        "kader@example.com",
        "Rahasia123"
      )
    );
    expect(
      await screen.findByText("Proses gagal. Periksa kembali data Anda.")
    ).toBeInTheDocument();
  });

  it("toggles the password between hidden and visible", () => {
    renderPage(LoginPage, "/login");
    const field = screen.getByLabelText("Kata sandi");

    expect(field).toHaveAttribute("type", "password");

    fireEvent.click(
      screen.getByRole("button", { name: "Tampilkan kata sandi" })
    );

    expect(field).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: "Sembunyikan kata sandi" })
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("links the password field to the recovery route", () => {
    renderPage(LoginPage, "/login");

    expect(screen.getByRole("link", { name: "Lupa kata sandi" })).toHaveAttribute(
      "href",
      "/forgot-password"
    );
  });

  it("sends an unverified account to the verification page", async () => {
    mockAuth.login.mockResolvedValue({
      success: true,
      user: { email: "kader@example.com", emailVerified: false },
    });

    renderNavigating(LoginPage, "/login");
    fillLogin();
    submitLogin();

    expect(await screen.findByText("halaman verifikasi")).toBeInTheDocument();
  });

  it("lets a verified account straight into the dashboard", async () => {
    mockAuth.login.mockResolvedValue({
      success: true,
      user: { email: "kader@example.com", emailVerified: true },
    });

    renderNavigating(LoginPage, "/login");
    fillLogin();
    submitLogin();

    expect(await screen.findByText("dasbor")).toBeInTheDocument();
  });
});

describe("register page", () => {
  it("names the password strength and the next hint as the field is typed", () => {
    renderPage(RegisterPage, "/register");

    fireEvent.change(screen.getByLabelText("Kata sandi"), {
      target: { value: "abc" },
    });

    expect(screen.getByText("Lemah")).toBeInTheDocument();
    expect(screen.getByText("Tambah 5 karakter lagi.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Kata sandi"), {
      target: { value: "Bunga-Melati-2026" },
    });

    expect(screen.getByText("Sangat kuat")).toBeInTheDocument();
  });

  it("confirms a matching pair without waiting for submit", () => {
    renderPage(RegisterPage, "/register");

    fireEvent.change(screen.getByLabelText("Kata sandi"), {
      target: { value: "Bunga-Melati-2026" },
    });
    fireEvent.change(screen.getByLabelText("Konfirmasi kata sandi"), {
      target: { value: "Bunga-Melati-2026" },
    });

    expect(screen.getByText("Kata sandi cocok.")).toBeInTheDocument();
  });

  it("blocks a password below eight characters before calling Firebase", () => {
    renderPage(RegisterPage, "/register");

    fireEvent.change(screen.getByLabelText("Nama lengkap"), {
      target: { value: "Kader Satu" },
    });
    fireEvent.change(screen.getByLabelText("Alamat email"), {
      target: { value: "kader@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Kata sandi"), {
      target: { value: "abc" },
    });
    fireEvent.change(screen.getByLabelText("Konfirmasi kata sandi"), {
      target: { value: "abc" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Buat akun" }));

    expect(screen.getByText("Kata sandi minimal 8 karakter."))
      .toBeInTheDocument();
    expect(mockAuth.register).not.toHaveBeenCalled();
  });

  it("maps an address already in use to its own message", async () => {
    mockAuth.register.mockResolvedValue({
      success: false,
      code: "auth/email-already-in-use",
    });

    renderPage(RegisterPage, "/register");

    fireEvent.change(screen.getByLabelText("Nama lengkap"), {
      target: { value: "Kader Satu" },
    });
    fireEvent.change(screen.getByLabelText("Alamat email"), {
      target: { value: "kader@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Kata sandi"), {
      target: { value: "Bunga-Melati-2026" },
    });
    fireEvent.change(screen.getByLabelText("Konfirmasi kata sandi"), {
      target: { value: "Bunga-Melati-2026" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Buat akun" }));

    expect(
      await screen.findByText("Email ini sudah terdaftar.")
    ).toBeInTheDocument();
  });

  it("sends a new account to the verification page", async () => {
    mockAuth.register.mockResolvedValue({
      success: true,
      user: { email: "kader@example.com", emailVerified: false },
    });

    renderNavigating(RegisterPage, "/register");

    fireEvent.change(screen.getByLabelText("Nama lengkap"), {
      target: { value: "Kader Satu" },
    });
    fireEvent.change(screen.getByLabelText("Alamat email"), {
      target: { value: "kader@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Kata sandi"), {
      target: { value: "Bunga-Melati-2026" },
    });
    fireEvent.change(screen.getByLabelText("Konfirmasi kata sandi"), {
      target: { value: "Bunga-Melati-2026" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Buat akun" }));

    expect(await screen.findByText("halaman verifikasi")).toBeInTheDocument();
    expect(mockAuth.register).toHaveBeenCalledWith(
      "kader@example.com",
      "Bunga-Melati-2026",
      "Kader Satu"
    );
  });
});
