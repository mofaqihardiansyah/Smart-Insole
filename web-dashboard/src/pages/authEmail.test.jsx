import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

/**
 * The email-link journeys: Firebase owns delivery, expiry and the verified
 * flag. These tests pin the page-level wiring: when the page asks Firebase,
 * what it shows while waiting, and where it sends the reader after a reset.
 */

const authState = vi.hoisted(() => ({ user: null, loading: false }));
const authMock = vi.hoisted(() => ({ currentUser: null }));
const firebaseAuthMock = vi.hoisted(() => ({
  applyActionCode: vi.fn(),
  sendEmailVerification: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  verifyPasswordResetCode: vi.fn(),
  confirmPasswordReset: vi.fn(),
}));

vi.mock("../hooks/useAuth", () => ({ useAuth: () => authState }));
vi.mock("../context/InsoleContext", () => ({
  useInsole: () => ({ language: "id" }),
}));
vi.mock("../services/firebaseConfig", () => ({ auth: authMock }));
vi.mock("firebase/auth", () => firebaseAuthMock);

const VerifyEmailPage = (await import("./VerifyEmailPage")).default;
const ForgotPasswordPage = (await import("./ForgotPasswordPage")).default;

const renderAt = (Page, route) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <Page />
    </MemoryRouter>
  );

const makeUser = (overrides = {}) => ({
  uid: "u1",
  email: "patient@example.com",
  emailVerified: false,
  reload: vi.fn().mockResolvedValue(),
  ...overrides,
});

const EMAIL = "patient@example.com";
const SENT = `Tautan verifikasi dikirim ke ${EMAIL}.`;

beforeEach(() => {
  authState.user = null;
  authState.loading = false;
  authMock.currentUser = null;

  firebaseAuthMock.applyActionCode.mockReset().mockResolvedValue();
  firebaseAuthMock.sendEmailVerification.mockReset().mockResolvedValue();
  firebaseAuthMock.sendPasswordResetEmail.mockReset().mockResolvedValue();
  firebaseAuthMock.verifyPasswordResetCode
    .mockReset()
    .mockResolvedValue(EMAIL);
  firebaseAuthMock.confirmPasswordReset.mockReset().mockResolvedValue();
});

describe("VerifyEmailPage", () => {
  it("shows the address Firebase mailed and offers a resend", async () => {
    authState.user = { email: EMAIL, emailVerified: false };
    authMock.currentUser = makeUser();

    renderAt(VerifyEmailPage, "/verify-email");

    expect(await screen.findByText(SENT)).toBeInTheDocument();
    expect(authMock.currentUser.reload).toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", { name: "Kirim ulang email" })
    );

    await waitFor(() =>
      expect(firebaseAuthMock.sendEmailVerification).toHaveBeenCalledTimes(1)
    );
    const [userArg, settings] =
      firebaseAuthMock.sendEmailVerification.mock.calls[0];
    expect(userArg).toBe(authMock.currentUser);
    expect(settings.url).toContain("/verify-email");
    expect(settings.handleCodeInApp).toBe(false);

    expect(
      await screen.findByText("Email verifikasi baru sudah dikirim.")
    ).toBeInTheDocument();
  });

  it("refreshes the cached user before deciding it is verified", async () => {
    const user = makeUser({ emailVerified: true });
    authState.user = { email: EMAIL, emailVerified: false };
    authMock.currentUser = user;

    renderAt(VerifyEmailPage, "/verify-email");

    expect(
      await screen.findByRole("heading", { name: "Email terverifikasi" })
    ).toBeInTheDocument();
    expect(user.reload).toHaveBeenCalled();
  });

  it("turns a rejected action code into a cause and a next step", async () => {
    authState.user = { email: EMAIL, emailVerified: false };
    authMock.currentUser = makeUser();
    firebaseAuthMock.applyActionCode.mockRejectedValue({
      code: "auth/invalid-action-code",
    });

    renderAt(VerifyEmailPage, "/verify-email?oobCode=bad&mode=verifyEmail");

    expect(
      await screen.findByRole("heading", {
        name: "Tautan verifikasi tidak valid",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Kami tidak dapat memakai tautan ini.")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Masuk ke akun Anda, lalu minta tautan verifikasi baru."
      )
    ).toBeInTheDocument();
  });

  it("asks a signed out visitor to open the link or sign in", async () => {
    renderAt(VerifyEmailPage, "/verify-email");

    expect(
      await screen.findByRole("heading", { name: "Verifikasi email" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Masuk ke akun" })
    ).toBeInTheDocument();
  });
});

describe("ForgotPasswordPage", () => {
  it("sends a Firebase reset link and shows where it went", async () => {
    renderAt(ForgotPasswordPage, "/forgot-password");

    fireEvent.change(screen.getByLabelText("Alamat email"), {
      target: { value: "Patient@Example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Kirim tautan reset" })
    );

    expect(
      await screen.findByRole("heading", { name: "Cek email Anda" })
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(firebaseAuthMock.sendPasswordResetEmail).toHaveBeenCalledTimes(1)
    );
    const [authArg, address, settings] =
      firebaseAuthMock.sendPasswordResetEmail.mock.calls[0];
    expect(authArg).toBe(authMock);
    expect(address).toBe("patient@example.com");
    expect(settings.url).toContain("/forgot-password?mode=resetPassword");
  });

  it("keeps an unknown address indistinguishable from a known one", async () => {
    firebaseAuthMock.sendPasswordResetEmail.mockRejectedValue({
      code: "auth/user-not-found",
    });

    renderAt(ForgotPasswordPage, "/forgot-password");

    fireEvent.change(screen.getByLabelText("Alamat email"), {
      target: { value: EMAIL },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Kirim tautan reset" })
    );

    expect(
      await screen.findByRole("heading", { name: "Cek email Anda" })
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Email atau kata sandi salah.")
    ).toBeNull();
  });

  it("verifies the link before showing a password field", async () => {
    renderAt(
      ForgotPasswordPage,
      "/forgot-password?mode=resetPassword&oobCode=good"
    );

    expect(
      await screen.findByRole("heading", { name: "Buat kata sandi baru" })
    ).toBeInTheDocument();
    expect(firebaseAuthMock.verifyPasswordResetCode).toHaveBeenCalledWith(
      authMock,
      "good"
    );
  });

  it("confirms the new password with the one time code from the link", async () => {
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
    fireEvent.click(
      screen.getByRole("button", { name: "Simpan kata sandi" })
    );

    expect(
      await screen.findByRole("heading", { name: "Kata sandi diperbarui" })
    ).toBeInTheDocument();
    expect(firebaseAuthMock.confirmPasswordReset).toHaveBeenCalledWith(
      authMock,
      "good",
      "passphrase123"
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
});
