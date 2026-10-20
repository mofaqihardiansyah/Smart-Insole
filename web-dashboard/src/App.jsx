import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { InsoleProvider, useInsole } from "./context/InsoleContext";
import { UserProvider, useUser } from "./context/UserContext";
import { t } from "./utils/i18n";
import { AppLayout } from "./components/layout/AppLayout";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { AlertModal } from "./components/dashboard/AlertModal";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import MonitoringPage from "./pages/MonitoringPage";
import HistoryPage from "./pages/HistoryPage";
import DevicePage from "./pages/DevicePage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import NotificationsPage from "./pages/NotificationsPage";
import AdminPage from "./pages/AdminPage";

/**
 * Navigation is built from the URL, not from component state, so the highlight
 * can never disagree with the page you are on.
 *
 * The order is the order a carer actually uses it: read the pressure, watch the
 * trend, review what happened, check the hardware, adjust the limits, then the
 * account.
 *
 * Notifications is deliberately absent. It lives on the bell in the top bar
 * instead, because an alert queue is a state of the app rather than a place in
 * it, and listing it in both places would be two controls for one destination.
 */
const buildNavLinks = (language, role) => {
  const links = [
    { id: "dashboard", to: "/", label: t("nav.dashboard", language), icon: "Home" },
    { id: "monitoring", to: "/monitoring", label: t("nav.monitoring", language), icon: "Chart" },
    { id: "history", to: "/history", label: t("nav.history", language), icon: "History" },
    { id: "device", to: "/device", label: t("nav.device", language), icon: "Device" },
    { id: "settings", to: "/settings", label: t("nav.settings", language), icon: "Settings" },
    { id: "profile", to: "/profile", label: t("nav.profile", language), icon: "User" },
  ];
  if (role === "admin") {
    links.push({ id: "admin", to: "/admin", label: t("nav.admin", language), icon: "Shield" });
  }
  return links;
};

function App() {
  return (
    <Router>
      {/*
        The boundary wraps the shell rather than sitting inside it, so a throw
        from the auth hook, from either provider and from every page lands in
        the fallback, not only a throw from a page. Because it is above the
        providers it reads no context: its copy resolves through the
        dictionary's own default language.
      */}
      <ErrorBoundary>
        <AppShell />
      </ErrorBoundary>
    </Router>
  );
}

/**
 * The provider sits above the auth gate so language and live data are
 * shared by the public pages too: the landing page renders the real heatmap.
 *
 * `autoConnect` only becomes true once a user is signed in, so an anonymous
 * visitor never opens a Realtime Database connection.
 */
function AppShell() {
  const { user, loading, displayName, role, logout } = useAuth();

  return (
    <InsoleProvider autoConnect={Boolean(user)}>
      <UserProvider
        value={{ user, displayName, role, signOut: logout }}
      >
        <div className="min-h-[100dvh] bg-bg">
          <a href="#main-content" className="skip-link">
            <SkipLabel />
          </a>

          {loading ? <Splash /> : user ? <ProtectedApp /> : <PublicApp />}
        </div>
      </UserProvider>
    </InsoleProvider>
  );
}

const SkipLabel = () => {
  const { language } = useInsole();
  return t("app.skipToContent", language);
};

/**
 * The first paint. It holds still on purpose: MOTION 1 permits motion only where
 * it carries state, and a ring that turns forever while nothing else does reads
 * as decoration competing with the numbers that start arriving a moment later.
 * The mark and the announced sentence say what the ring said, without the motion.
 */
const Splash = () => {
  const { language } = useInsole();
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[100dvh] flex-col items-center justify-center gap-5 px-4"
    >
      <img src="/icon.svg" alt="" aria-hidden="true" className="h-14 w-14" />
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
      <Route path="/verify-otp" element={<VerifyOtpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
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
  const { user, displayName, role, signOut } = useUser();

  const links = buildNavLinks(language, role);

  return (
    <>
      <AppLayout
        links={links}
        hasUnread={unreadIncidentCount > 0}
        unreadLabel={String(unreadIncidentCount)}
        userName={displayName}
        userEmail={user?.email}
        onSignOut={signOut}
      >
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/monitoring" element={<MonitoringPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/device" element={<DevicePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/admin" element={<AdminPage />} />
          {/* Login and register stay reachable while signed in for account
              switching, but they are not linked from the navigation. */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>

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
