import React from "react";
import { Card, Icon, Label } from "lucide-react";

/**
 * BentoGrid — Layout grid asymmetris (seperti bento box japanese).
 * - Isi setiap cell bervariasi: ikon + judul + angka/statistik
 * - Grid otomatis mengisi baris dari kiri ke kanan, height cell disamakan minimal
 * - Responsive: 1 column di hp, 2 di tablet, 3 di desktop
 * - Semua card memiliki elevation (shadow) dan hover effect
 * - Diukung oleh nilai dari context/props, bebas isi (statistik, grafik, widget)
 */
const BentoGrid = ({
  columns = 3,
  gutters = "lg:gap-6 md:gap-4",
  cards = [],
  className,
}) => {
  // Menghitung kolom aktif berdasarkan lebar viewport
  const [colCount, setColCount] = React.useState(columns);

  React.useEffect(() => {
    const updateCols = () => {
      if (window.innerWidth < 640) setColCount(1);
      else if (window.innerWidth < 1024) setColCount(2);
      else setColCount(columns);
    };
    updateCols();
    window.addEventListener("resize", updateCols);
    return () => window.removeEventListener("resize", updateCols);
  }, [columns]);

  return (
    <div
      className={
        "grid" +
        (colCount > 1 ? " grid-cols-" + colCount : "") +
        " " +
        gutters +
        " gap-4 " +
        (className || "")
      }
    >
      {cards.map((card, i) => (
        <div
          key={i}
          className`
            rounded-xl border border-border/50 bg-card
            overflow-hidden hover:shadow-lg hover:transition-shadow duration-300
            cursor-pointer
            aria-roledescription="card"
            tabindex="0"
          `
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              // Trigger card action (focus management)
              card.onSelect?.();
            }
          }}
        >
          {/* Header: ikon + badge */}
          <div className="p-5 border-b border-border/50">
            <div className="flex items-start gap-3">
              <div className="shrink-0">{card.icon}</div>
              <div className="flex-1 min-w-0">
                {card.title && (
                  <p className="text-xs font-medium text-muted capitalize">
                    {card.title}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Content: angka utama + deskripsi */}
          <div className="p-5 flex flex-col h-100">
            <p className="text-3xl font-bold tracking-tighter">
              {card.value}
            </p>
            {card.label && (
              <p className="text-xs text-muted mt-1 line-clamp-1">
                {card.label}
              </p>
            )}
          </div>

          {/* Action area (optional) */}
          {card.action && (
            <div className="p-3 border-t border-border/20">
              <button
                className="w-full text-sm font-medium text-primary"
                onClick={card.onSelect}
              >
                Lihat Detail
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default BentoGrid;