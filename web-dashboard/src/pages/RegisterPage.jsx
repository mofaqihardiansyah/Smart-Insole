import React, { useState } from "react";
import { GlassInput } from "../components/ui/GlassInput";
import { GlassButton } from "../components/ui/GlassButton";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

/**
 * RegisterPage — Halaman pendaftaran akun baru.
 - Form nama, email, password konfirmasi
 - Link ke Login
 - Setelah daftar, otomatis login + kirim email verifikasi
 - Accessible: form validation, required fields, error handling
 */
const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    // Validasi sederhana
    if (!name || !email || !password) {
      setError("Semua field harus diisi");
      return;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok");
      return;
    }
    if (password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }

    const result = await register(email, password, name);
    if (result.success) {
      // Auto-login setelah register + redirect
      navigate("/");
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="max-w-md w-full p-6 md:p-8 bg-card rounded-xl border border-border/50">
      <h2 className="text-2xl font-bold heading mb-6 text-center">Daftar Akun Baru</h2>

      {error && (
        <div className="mb-4 p-3 rounded bg-danger/5 text-danger text-sm aria-live="polite">
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <GlassInput
          placeholder="Nama lengkap"
          value={name}
          onChange={(e) => setName(e.target.value)}
          label="Nama lengkap"
          required
        />
        <GlassInput
          type="email"
          placeholder="Alamat email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          label="Alamat email"
          required
        />
        <GlassInput
          type="password"
          placeholder="Kata sandi"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          label="Kata sandi"
          required
        />
        <GlassInput
          type="password"
          placeholder="Konfirmasi kata sandi"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          label="Konfirmasi kata sandi"
          required
        />
        <GlassButton type="submit" className="w-full">
          Daftar
        </GlassButton>

        <div className="text-center text-sm text-muted">
          Sudah punya akun?{" "}
          <a href="/login" className="underline text-primary">
            Masuk
          </a>
        </div>
      </form>
    </div>
  );
};

export default RegisterPage;