import React, { useState } from "react";
import { GlassInput } from "../components/ui/GlassInput";
import { GlassButton } from "../components/ui/GlassButton";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

/**
 * LoginPage — Halaman masuk akun.
 * - Form email & password
 - Link ke Register
 - Tombol "Login as Guest" (bisa login tanpa akun untuk demo)
 - Accessibility: labels terhubung ke input, error message aria-live
 */
const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Masukkan email dan password");
      return;
    }
    const result = await login(email, password);
    if (result.success) {
      navigate("/");
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="max-w-md w-full p-6 md:p-8 bg-card rounded-xl border border-border/50">
      <h2 className="text-2xl font-bold heading mb-6 text-center">Masuk ke Akun</h2>

      {error && (
        <div className="mb-4 p-3 rounded bg-danger/5 text-danger text-sm aria-live="polite">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <GlassInput
          type="email"
          placeholder="Alamat email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
          aria-label="Alamat email"
          required
        />
        <GlassInput
          type="password"
          placeholder="Kata sandi"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-label="Kata sandi"
          required
        />
        <GlassButton type="submit" className="w-full">
          Masuk
        </GlassButton>

        <div className="text-center text-sm text-muted">
          <span>
            Belum punya akun?{" "}
            <a href="/register" className="underline text-primary">
              Daftar sekarang
            </a>
          </span>{" "}
          {" "}{" "}
          <a href="#" className="underline text-primary">
            Masuk sebagai tamu
          </a>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;