import React from "react";
import { GlassButton } from "../components/ui/GlassButton";
import { MotionContainer } from "framer-motion";

/**
 * LandingPage — Halaman publik awal.
 * - Hero section dengan nilai jual (USP)
 - 3 fitur utama dalam Bento Grid
 - CTA: Masuk / Daftar
 - Social proof / edukasi ringkas
 - Acessible: contrast sufficient, aria labels, focusable elements
 */
const LandingPage = () => {
  const features = [
    { icon: "Heart", title: "Pantau Real-time", desc: "Tekanan telapak kaki 3 sensor, baca langsung di HP." },
    { icon: "Activity", title: "Risiko Fuzzy Logic", desc: "Algoritma Menghitung risiko Aman/Waspada/Bahaya seketika." },
    { icon: "AlertCircle", title: "Early Warning", desc: "Notifikasi & suara ketika tekanan terlalu lama." },
  ];

  return (
    <section className="min-h-screen bg-bg p-4 md:p-8 relative overflow-x-hidden">
      <div className="max-w-5xl mx-auto h-full flex flex-col items-center justify-center text-center">
        <h1 className="text-5xl md:text-6xl font-bold heading tracking-tighter mb-4">
          Smart Insole IoT
        </h1>
        <p className="text-lg md:text-xl text-muted mb-8 max-w-2xl">
          Rancang bangun pemantauan tekanan telapak kaki berbasis IoT untuk penderita
          <strong className="text-primary">Diabetes Mellitus</strong> mencegah terjadinya
          <strong className="text-danger">Ulkus Kaki Diabetik</strong>.
        </p>

        {/* Bento Grid Fitur */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 w-full max-w-2xl pb-8">
          {features.map((feat, i) => (
            <GlassButton
              key={i}
              variant="outline"
              className="p-6 text-left transform hover:-translate-y-1 transition-transform"
              aria-label={feat.title}
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 flex items-center justify-center rounded-full bg-primary/10 w-12 h-12">
                  {feat.icon}
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-bold">{feat.title}</h3>
                  <p className="text-muted/70 line-clamp-2">{feat.desc}</p>
                </div>
              </div>
            </GlassButton>
          ))}
        </div>

        {/* CTA Section */}
        <div className="flex gap-4 mt-8 flex-wrap justify-center">
          <GlassButton variant="filled" className="px-6 py-3">
            Masuk
          </GlassButton>
          <GlassButton variant="outline" className="px-6 py-3">
            Daftar
          </GlassButton>
        </div>
      </main>
    </section>
  );
};

export default LandingPage;