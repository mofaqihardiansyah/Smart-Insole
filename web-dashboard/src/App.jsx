import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { InsoleProvider, useInsole } from "./context/InsoleContext";
import { t } from "./utils/i18n";
import { FloatingNavbar } from "./components/layout/FloatingNavbar";
import { AlertModal } from "./components/dashboard/AlertModal";
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

/**
 * Navigation is built from the URL, not from component state, so the highlight
 * can never disagree with the page you are on.
 *
 * The order is the order a carer actually uses it: read the pressure, watch the
 * trend, review what happened, check the hardware, adjust the limits, then the
 * account. Notifications sits last because it is a preference, not a place.
 */
const buildNavLinks = (language) => [
  { id: "dashboard", to: "/", label: t("nav.dashboard", language), icon: "Home" },
  { id: "monitoring", to: "/monitoring", label: t("nav.monitoring", language), icon: "Chart" },
  { id: "history", to: "/history", label: t("nav.history", language), icon: "History" },
  { id: "device", to: "/device", label: t("nav.device", language), icon: "Device" },
  { id: "settings", to: "/settings", label: t("nav.settings", language), icon: "Settings" },
  { id: "profile", to: "/profile", label: t("nav.profile", language), icon: "User" },
  { id: "notifications", to: "/notifications", label: t("nav.notifications", language), icon: "Bell" },
];

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

/**
 * The provider sits above the auth gate so language, theme and live data are
 * shared by the public pages too: the landing page renders the real heatmap.
 *
 * `autoConnect` only becomes true once a user is signed in, so an anonymous
 * visitor never opens a Realtime Database connection.
 */
function AppShell() {
  const { user, loading } = useAuth();

  return (
    <InsoleProvider autoConnect={Boolean(user)}>
      <div className="min-h-[100dvh] bg-bg">
        <a href="#main-content" className="skip-link">
          <SkipLabel />
        </a>

        {loading ? <Splash /> : user ? <ProtectedApp /> : <PublicApp />}
      </div>
    </InsoleProvider>
  );
}

const SkipLabel = () => {
  const { language } = useInsole();
  return t("app.skipToContent", language);
};

const Splash = () => {
  const { language } = useInsole();
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-4"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border-control border-t-primary" />
      <p className="text-body-sm text-muted">{t("app.loading", language)}</p>
    </div>
  );
};

/* ========================= Public routes ========================= */

function PublicApp() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<LandingPage />} />
      {/* Anything unknown goes home rather than showing a blank screen. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/* ======================== Protected routes ======================= */

function ProtectedApp() {
  const {
    language,
    unreadIncidentCount,
    alertOpen,
    risk,
    riskScore,
    acknowledgeIncidents,
    isMuted,
    toggleMute,
  } = useInsole();

  const links = buildNavLinks(language);

  return (
    <>
      <FloatingNavbar
        links={links}
        hasUnread={unreadIncidentCount > 0}
        unreadLabel={String(unreadIncidentCount)}
      />

      {/* The rail is fixed on desktop, so the content column is offset by its
          width there and sits under the mobile top bar below lg. */}
      <main
        id="main-content"
        className="mx-auto w-full max-w-[1600px] px-4 pb-12 pt-4 sm:px-6 lg:pl-72 lg:pr-8"
      >
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/monitoring" element={<MonitoringPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/device" element={<DevicePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          {/* Login and register stay reachable while signed in for account
              switching, but they are not linked from the navigation. */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <footer className="mt-12 border-t border-border pt-4 text-body-sm text-muted">
          {t("app.footer", language)}
        </footer>
      </main>

      {/* One early-warning dialog for the whole app, so an alert raised on the
          dashboard is still present after navigating. */}
      <AlertModal
        open={alertOpen}
        level={risk}
        title={t(
          risk === "danger" ? "alert.dangerTitle" : "alert.warningTitle",
          language
        )}
        body={t(
          risk === "danger" ? "alert.dangerBody" : "alert.warningBody",
          language
        )}
        advice={`${t("risk.score", language)}: ${riskScore} / 100`}
        dismissLabel={t("alert.dismiss", language)}
        muteLabel={t("alert.mute", language)}
        unmuteLabel={t("alert.unmute", language)}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onDismiss={acknowledgeIncidents}
      />
    </>
  );
}

export default App;
