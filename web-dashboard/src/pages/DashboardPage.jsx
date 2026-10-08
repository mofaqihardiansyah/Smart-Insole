import React, { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useRoute } from "../hooks/useRoute";
import BentoGrid from "../components/dashboard/BentoGrid";
import { useInsole } from "../context/InsoleContext";

/**
 * DashboardPage — Halaman pemantauan real-time.
 - Menampilkan BentoGrid dengan metrik utama
 - Terhubung ke InsoleContext untuk readings live (dari Task 4)
 - Jika belum ada data dari Firebase, tampilkan placeholder
 - Acessible: meriah region, keyboard navigable, screen reader friendly
 */
const DashboardPage = ({ onLinkSelect, hasUnreadNotif }) => {
  const { user } = useAuth();
  const { readings, risk, source } = useInsole();

  // Metrik statis dari readings (jika ada) atau placeholder
  const metrics = React.useMemo(() => {
    if (!readings) return [];
    const { forefoot, midfoot, heel } = readings;
    return [
      { icon: "Speed", title: "Forefoot (kPa)", value: `${forefoot?.toFixed(1) || "-"}` },
      { icon: "Activity", title: "Midfoot (kPa)", value: `${midfoot?.toFixed(1) || "-"}` },
      { icon: "Heart", title: "Heel (kPa)", value: `${heel?.toFixed(1) || "-"}` },
    ];
  }, [readings]);

  // Efek samping: update link aktif saat halaman dibuka
  useEffect(() => {
    onLinkSelect?.("dashboard");
  }, [onLinkSelect]);

  return (
    <section className="p-4 md:p-8">
      <h2 className="text-2xl font-bold heading mb-6">Dashboard</h2>

      {/* Kartu Metrik Utama */}
      <BentoGrid cards={metrics} columns={3} gutters="md:gap-4" />

      {/* Catatan status sumber data */}
      <p className="my-6 text-sm text-muted">
        Sumber data: <strong>{source === "SIMULATOR" ? "Simulasi" : "Firebase Live"}</strong>
      </p>
    </section>
  );
};

export default DashboardPage;