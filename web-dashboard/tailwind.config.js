/** @type {import('tailwindcss').Config} */

/**
 * Theme tokens for the Romer dark instrument-panel language, with a light
 * counterpart.
 *
 * Every colour resolves through a CSS variable declared in src/index.css as a
 * space separated RGB triplet, so `bg-surface`, `text-muted/70` and
 * `border-safe/50` all work, and switching one class on <html> repaints the
 * entire application. That is why there is not a single `dark:` utility in the
 * codebase: the theme lives in one place, not in a thousand class lists.
 *
 * Measured contrast for every value is recorded in src/index.css next to the
 * variable it belongs to, and in DESIGN.md. Nothing here is eyeballed.
 */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        /* ---------------------------- Surfaces ---------------------------- */
        bg: token("bg"), // page canvas
        surface: {
          DEFAULT: token("surface"), // card
          2: token("surface-2"), // raised panel
          3: token("surface-3"), // inset well, plot area
        },
        sidebar: token("sidebar"),
        // Modal and drawer backdrop.
        scrim: token("scrim"),

        /* ----------------------------- Edges ------------------------------ */
        border: {
          // Faint hairline. Decoration only: it separates rows, it never marks
          // a control. Measured 1.2:1 dark, 1.1:1 light, which is why it is
          // never the only thing delimiting something interactive.
          DEFAULT: token("border"),
          strong: token("border-strong"), // card edge
          // Inputs, selects and outlined buttons. Tuned to clear 3:1 against
          // the surface behind it (WCAG 1.4.11), unlike the hairline above.
          control: token("border-control"),
        },

        /* ------------------------------ Ink ------------------------------- */
        fg: token("fg"), // primary text
        "fg-2": token("fg-2"), // secondary text
        muted: token("muted"), // labels, captions, units

        /* ---------------------------- Accents ----------------------------- */
        // One chromatic accent for chrome, plus two signal colours reserved for
        // data. Nothing decorative is ever saturated.
        primary: {
          DEFAULT: token("primary"), // accent text, links, active nav
          btn: token("primary-btn"), // solid button fill
          on: token("primary-on"), // text on that fill
        },
        secondary: token("secondary"), // cyan: telemetry, series 1
        tertiary: token("tertiary"), // amber: series 2 / attention

        /* ---------------------- Landing variant ----------------------- */
        /* Warm, light-only marketing surface. Light-independent: the
           values above are re-declared under `.landing-scope`. */
        warm: {
          canvas: token("warm-canvas"),
          raised: token("warm-raised"),
          card: token("warm-card"),
          ink: token("warm-ink"),
          body: token("warm-body"),
          caption: token("warm-caption"),
          accent: token("warm-accent"),
          accentDeep: token("warm-accent-deep"),
          dark: token("warm-dark"),
          line: token("warm-line"),
          panel: token("warm-panel"),
          "panel-2": token("warm-panel-2"),
          "panel-3": token("warm-panel-3"),
          "panel-4": token("warm-panel-4"),
          "accent-2": token("warm-accent-2"),
        },

        /* -------------------------- Risk semantics ------------------------ */
        // The three levels carry the same meaning in both themes and are the
        // only colours allowed to appear on a status surface.
        safe: token("safe"),
        warning: token("warning"),
        danger: token("danger"),
      },

      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Manrope", "Inter", "sans-serif"],
        data: ["Inter", "system-ui", "sans-serif"],
      },

      /**
       * Type scale, with the floor raised from the reference export.
       *
       * The Romer reference uses 12px uppercase labels and 13px data. This
       * product's audience is largely elderly, so the smallest steps were moved
       * up: labels 12 to 14, data 13 to 16, body 14 to 16. The dense instrument
       * character comes from the tracking, the case and the hairlines, not from
       * 12px type.
       */
      fontSize: {
        label: ["0.875rem", { lineHeight: "1.1", letterSpacing: "0.08em", fontWeight: "600" }],
        // Landing display headline, the one place the scale may
        // reach past `h1`: clamp(2.5rem, 5vw, 4.5rem).
        display: ["clamp(2.5rem, 5vw, 4.5rem)", { lineHeight: "1.02", letterSpacing: "-0.035em", fontWeight: "600" }],
        // Status chips. The reference export uses 10 to 12px here; raised to
        // 13px for the same reason as the rest of the scale.
        chip: ["0.8125rem", { lineHeight: "1.1", letterSpacing: "0.06em", fontWeight: "700" }],
        data: ["1rem", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "500" }],
        "body-sm": ["0.875rem", { lineHeight: "1.5" }],
        body: ["1rem", { lineHeight: "1.6" }],
        h4: ["1.125rem", { lineHeight: "1.4", letterSpacing: "-0.02em", fontWeight: "600" }],
        h3: ["1.5rem", { lineHeight: "1.2", letterSpacing: "-0.03em", fontWeight: "600" }],
        h2: ["2rem", { lineHeight: "1.15", letterSpacing: "-0.04em", fontWeight: "600" }],
        h1: ["2.75rem", { lineHeight: "1.1", letterSpacing: "-0.045em", fontWeight: "600" }],
      },

      letterSpacing: {
        tighter: "-0.045em",
      },

      // Tight radii. The reference is an instrument panel, not a consumer app.
      // The landing variant adds its own documented scale (DESIGN.md).
      borderRadius: {
        DEFAULT: "2px",
        card: "4px",
        control: "3px",
        tile: "12px",
        panel: "16px",
        pill: "999px",
        hero: "28px",
        "hero-lg": "40px",
      },

      boxShadow: {
        // The floating overlay token, reserved for the alert dialog.
        overlay: "0 24px 60px -12px rgb(0 0 0 / 0.65)",
        // Landing variant shadows (SprintForge-adapted).
        card: "0 14px 30px -18px rgb(35 36 39 / 0.25)",
        lift: "0 24px 44px -18px rgb(35 36 39 / 0.30)",
        nav: "0 10px 30px -14px rgb(35 36 39 / 0.25)",
        glow: "0 18px 35px -14px rgb(35 36 39 / 0.35)",
      },

      backgroundImage: {
        // Fine grid, scoped to chart plot areas. Purpose is written in DESIGN.md:
        // it makes the plot read as a measured instrument surface rather than a
        // decorative texture, and it is never used behind body copy.
        "plot-grid":
          "linear-gradient(to right, rgb(var(--grid) / 0.5) 1px, transparent 1px), linear-gradient(to bottom, rgb(var(--grid) / 0.5) 1px, transparent 1px)",
      },
      backgroundSize: {
        plot: "40px 40px",
      },
    },
  },
  plugins: [],
};
