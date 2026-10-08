import React, { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useRoute } from "../hooks/useRoute";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

/**
 * MonitoringPage — Halaman grafik tren tekanan telapak kaki.
 - Menampilkan 3 garis grafik (Forefoot, Midfoot, Heel) melaluiSwiper/carousel
 - Setiap slide mewakili satu waktu (1 detik * slide index)
 - Jika data kosong, tampilkan placeholder dengan call-to-action
 - Acessible: aria-live, navigasi keyboard, labels yang jelas
 */
const MonitoringPage = () => {
  const { user } = useAuth();

  // Mock data grafik jika belum terhubung ke Firebase
  const generateMockData = () => {
    const data = [];
    for (let i = 0; i < 20; i++) {
      data.push({
        forefoot: Math.random() * 50 + 10,
        midfoot: Math.random() * 30 + 5,
        heel: Math.random() * 60 + 5,
      });
    }
    return data;
  };

  const mockData = useMockData ? generateMockData() : [];

  useEffect(() => {
    // Import module Swiper sekali
    import("swiper/bundles/esm").then(() => {
      // Inisialisasi setelah render
    });
  }, []);

  return (
    <section className="p-4 md:p-8">
      <h2 className="text-2xl font-bold heading mb-6">Monitoring Sinyal</h2>

      {/* Penjelasan singkat */}
      <p className="text-muted mb-6">
        Grafik berikut menampilkan distribusi tekanan 3 sensor selama sesi aktif.
      </p>

      {/* Swiper untuk grafik triliner */}
      <Swiper
        modules={[Pagination, Navigation]}
        className="my-8"
        spaceBetween={20}
        slidesPerView={1}
        centeredSlides={false}
        pagination={{ clickable: true }}
        navigation={{ nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" }}
        aria-label="Pressure trends graph"
      >
        {mockData.map((point, i) => (
          <SwiperSlide key={i} aria-label={`Grafik pressure ke-${i + 1}`}>
            <div className="p-4 rounded-xl border border-border/50 bg-card">
              <div className="text-sm font-medium">Skekon {i + 1}</div>
              <p className="mt-2">
                <span className="text-primary">Forefoot:</span> {point.forefoot.toFixed(1)} kPa
              </p>
              <p>
                <span className="text-secondary">Midfoot:</span> {point.midfoot.toFixed(1)} kPa
              </p>
              <p>
                <span className="text-danger">Heel:</span> {point.heel.toFixed(1)} kPa
              </p>
            </div>
          </SwiperSlide>
        ))}
        {mockData.length === 0 && (
          <p className="text-center text-muted">Data grafik belum tersedia. <a href="/dashboard">Mulai monitoring</a></p>
        )}
      </Swiper>
    </section>
  );
};

export default MonitoringPage;