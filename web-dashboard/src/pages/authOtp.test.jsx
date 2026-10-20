import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const authMock = vi.hoisted(() => ({ user: null }));
const emailMock = vi.hoisted(() => ({ sendOtpEmail: vi.fn() }));
const firebaseAuthMock = vi.hoisted(() => ({
  sendPasswordResetEmail: vi.fn(),
  verifyPasswordResetCode: vi.fn(),
  confirmPasswordReset: vi.fn(),
}));

vi.mock("../hooks/useAuth", () => ({ useAuth: () => authMock }));
vi.mock("../context/InsoleContext", () => ({
  useInsole: () => ({ language: "id" }),
}));
vi.mock("../services/emailOtp", () => ({
  sendOtpEmail: emailMock.sendOtpEmail,
}));
vi.mock("../services/firebaseConfig", () => ({ auth: {} }));
vi.mock("firebase/auth", () => firebaseAuthMock);

const VerifyOtpPage = (await import("./VerifyOtpPage")).default;
const ForgotPasswordPage = (await import("./ForgotPasswordPage")).default;

const renderAt = (Page, route) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <Page />
    </MemoryRouter>
  );

const lastCode = () => emailMock.sendOtpEmail.mock.calls.at(-1)?.[0]?.code;

const fillCode = (code) => {
  fireEvent.change(screen.getAllByRole("textbox")[0], {
    target: { value: code },
  });
};

describe("VerifyOtpPage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    authMock.user = null;
    emailMock.sendOtpEmail.mockReset();
    emailMock.sendOtpEmail.mockImplementation(async ({ code }) => ({
      delivered: true,
      devCode: code,
    }));
  });

  it("asks a signed out visitor for an address before sending a code", async () => {
    renderAt(VerifyOtpPage, "/verify-otp");

    expect(
      screen.getByRole("heading", { name: "Verifikasi email" })
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Alamat email"), {
      target: { value: "baru@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Kirim kode/i }));

    expect(
      await screen.findByText("Kode 6 digit dikirim ke baru@example.com.")
    ).toBeInTheDocument();
    expect(emailMock.sendOtpEmail).toHaveBeenCalledTimes(1);
  });

  it("verifies the code for a signed in account and offers the dashboard", async () => {
    authMock.user = { email: "patient@example.com", emailVerified: false };
    renderAt(VerifyOtpPage, "/verify-otp");

    expect(
      await screen.findByText(
        "Kode 6 digit dikirim ke patient@example.com."
      )
    ).toBeInTheDocument();

    fillCode(lastCode());
    fireEvent.click(screen.getByRole("button", { name: "Verifikasi kode" }));

    expect(
      await screen.findByRole("heading", { name: "Email terverifikasi" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Buka dasbor" })
    ).toBeInTheDocument();
  });
});

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    authMock.user = null;
    emailMock.sendOtpEmail.mockReset();
    emailMock.sendOtpEmail.mockImplementation(async ({ code }) => ({
      delivered: true,
      devCode: code,
    }));
    firebaseAuthMock.sendPasswordResetEmail.mockReset();
    firebaseAuthMock.sendPasswordResetEmail.mockResolvedValue();
    firebaseAuthMock.verifyPasswordResetCode.mockReset();
    firebaseAuthMock.confirmPasswordReset.mockReset();
  });

  it("verifies the code, then asks Firebase for the reset link", async () => {
    renderAt(ForgotPasswordPage, "/forgot-password");

    fireEvent.change(screen.getByLabelText("Alamat email"), {
      target: { value: "patient@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Kirim kode/i }));

    expect(
      await screen.findByText(
        "Kode 6 digit dikirim ke patient@example.com."
      )
    ).toBeInTheDocument();

    fillCode(lastCode());
    fireEvent.click(screen.getByRole("button", { name: "Verifikasi kode" }));

    expect(
      await screen.findByRole("heading", { name: "Cek email Anda" })
    ).toBeInTheDocument();
    expect(firebaseAuthMock.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    expect(firebaseAuthMock.sendPasswordResetEmail.mock.calls[0][1]).toBe(
      "patient@example.com"
    );
  });

  it("shows an invalid reset link as a cause with a way to restart", async () => {
    firebaseAuthMock.verifyPasswordResetCode.mockRejectedValue({
      code: "auth/invalid-action-code",
    });

    renderAt(
      ForgotPasswordPage,
      "/forgot-password?mode=resetPassword&oobCode=bad"
    );

    expect(
      await screen.findByRole("heading", {
        name: "Tautan reset tidak valid atau sudah kedaluwarsa.",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Mulai ulang" })
    ).toBeInTheDocument();
  });

  it("confirms a new password with the one time code from the link", async () => {
    firebaseAuthMock.verifyPasswordResetCode.mockResolvedValue(
      "patient@example.com"
    );
    firebaseAuthMock.confirmPasswordReset.mockResolvedValue();

    renderAt(
      ForgotPasswordPage,
      "/forgot-password?mode=resetPassword&oobCode=good"
    );

    expect(
      await screen.findByRole("heading", { name: "Buat kata sandi baru" })
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Kata sandi"), {
      target: { value: "passphrase123" },
    });
    fireEvent.change(screen.getByLabelText("Konfirmasi kata sandi"), {
      target: { value: "passphrase123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan kata sandi" }));

    expect(
      await screen.findByRole("heading", { name: "Kata sandi diperbarui" })
    ).toBeInTheDocument();
    expect(firebaseAuthMock.confirmPasswordReset).toHaveBeenCalledWith(
      {},
      "good",
      "passphrase123"
    );
  });
});
