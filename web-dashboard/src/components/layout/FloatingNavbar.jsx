import React from "react";
import { Menu, Settings, Shield, Person, Insights, HealthStats } from "lucide-react";

/**
 * FloatingNavbar — Navigasi floating di atas konten utama.
 * - Fixed at top, translucent background
 * - Background berganti pada scroll (rgba fade)
 * - Active item ditandai dengan underline
 * - Accessible: aria-label, focus ring, sufficient contrast
 */
const FloatingNavbar = ({ links, activeLink, onSelect, hasUnread = false }) => {
  return (
    <nav
      className="fixed top-0 left- right- z-50 flex items-center justify-center h-16 bg-white/80 backdrop-blur-sm border-b border-border/60 transition-colors duration-300"
      aria-label="Main navigation"
    >
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between px-6">
        {/* Left: Brand / App Name */}
        <div className="hidden sm:block text-sm font-medium text-textSecondary tracking-wider">
          Smart Insole
        </div>

        {/* Right: Nav Links */}
        <div className="flex items-center gap-2">
          {links.map((link) => {
            const isActive = link.id === activeLink;
            return (
              <button
                key={link.id}
                onClick={() => onSelect(link.id)}
                className`
                  relative flex-1 flex items-center justify-center py-2 rounded-md text-sm
                  font-medium text-${isActive ? "primary" : "muted"}
                  transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                  ${isActive ? "underline" : "underline-offset-4"}
                  aria-label="${link.accessibilityLabel}"
                  role="menuitem"
                >
                  <span
                    className="inline-flex h-5 w-5 shrink-0 rounded-md flex items-center justify-center"
                    style={{ color: isActive ? "currentColor" : "currentColor" }}
                  >
                    {link.icon}
                  </span>
                  <span className="sr-only">{link.label}</span>
                </button>
              )
            );
          })}
          {/* Action: Notif badge jika ada */}
          {hasUnread && (
            <button
              aria-label="Notifications"
              className="relative rounded-full bg-primary px-3 text-xs font-medium text-white"
            >
              Notif
              <span className="absolute -top-0.5 -right-0.5 rounded-full bg-danger text-[6px] font-medium">3</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default FloatingNavbar;