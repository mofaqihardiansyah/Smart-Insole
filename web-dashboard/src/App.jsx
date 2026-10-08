import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useRoutes } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { FloatingNavbar } from "./components/layout/FloatingNavbar";
import { BentoGrid } from "./components/dashboard/BentoGrid";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import MonitoringPage from "./pages/MonitoringPage";
import HistoryPage from "./pages/HistoryPage";
import DevicePage from "./pages/DevicePage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import NotificationsPage from "./pages/NotificationsPage";
import { useRoute } from "./hooks/useRoute";

// Daftar navigasi floating navbar (mobile)
const NAV_LINKS = [
  { id: "dashboard", label: "Dashboard", icon: "Home", accessibilityLabel: "Dashboard" },
  { id: "monitoring", label: "Monitoring", icon: "Chart", accessibilityLabel: "Monitoring" },
  { id: "history", label: "Riwayat", icon: "History", accessibilityLabel: "Riwayat" },
  { id: "device", label: "Device", icon: "Device", accessibilityLabel: "Device" },
  { id: "settings", label: "Pengaturan", icon: "Settings", accessibilityLabel: "Pengaturan" },
  { id: "profile", label: "Profile", icon: "User", accessibilityLabel: "Profile" },
];

function App() {
  const { user, loading, login, logout } = useAuth();
  const [activeLink, setActiveLink] = useState("dashboard");
  const [hasUnreadNotif, setHasUnreadNotif] = useState(false);

  // Efek samping: cek unread notif setiap 10 detik
  useEffect(() => {
    const interval = setInterval(() => {
      // placeholder: ambil dari Firebase
      setHasUnreadNotif(Math.random() > 0.7);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Jika loading, tutup dan arahkan ke login
  if (loading) return <Navigate to="/login" replace />;

  // Jika user BELUM login, hanya izinkan halaman publik
  if (!user) {
    return (
      <Router>
        {/* Navbar versi guest (hanya landing link) */}
        <FloatingNavbar
          links={[
            { id: "landing", label: "Landing", icon: "Home", accessibilityLabel: "Landing Page" },
          ]}
          activeLink="landing"
          onSelect={(id) => setActiveLink(id)}
          hasUnreadNotif={false}
        />
        <main className="min-h-screen bg-bg p-4">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<LandingPage />} />
          </Routes>
        </main>
      </Router>
    );
  }

  // Jika SUDAH login, tampilkan navbar + halaman protected
  return (
    <Router>
      {/* Floating Navbar atas */}
      <FloatingNavbar
        links={NAV_LINKS}
        activeLink={activeLink}
        onSelect={(id) => setActiveLink(id)}
        hasUnreadNotif={hasUnreadNotif}
      />

      <main className="mt-20 min-h-screen bg-bg p-4 overflow-x-hidden">
        <Routes>
          {/* Halaman Publik (bisa diakses meski login) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Halaman Utama (Protected) */}
          <Route
            path="/"
            element={
              <DashboardPage
                onLinkSelect={(id) => setActiveLink(id)}
                hasUnreadNotif={hasUnreadNotif}
              />
            }
          />
          <Route path="/monitoring" element={<MonitoringPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/device" element={<DevicePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Routes>
      </main>

      {/* Footer kecil di bawah */}
      <footer className="mt-12 text-center text-xs text-muted">
        <span>Smart Insole IoT &copy; {new Date().getFullYear()}</span>
      </footer>
    </Router>
  );
}

export default App;