/** @type {import('tailwindcss').Config} */

/**
 * Theme tokens for the Smart Insole dashboard, built on the Verdana Health
 * design system.
 *
 * The design reference is a light clinic dashboard: a pale slate canvas, white
 * cards with 16px corners and a 1px edge, a 288px product rail with a user card
 * pinned to its foot, and a 72px top bar carrying search and the account
 * controls.
 *
 * Every colour resolves through a CSS variable declared in src/index.css as a
 * space separated RGB triplet, so `bg-surface`, `text-muted/70` and
 * `border-safe/50` all work. Light-only by design: there is no `.dark` block
 * and no `dark:` utility anywhere in the codebase.
 *
 * Measured contrast for every value is recorded in src/index.css next to the
 * variable it belongs to, and in DESIGN.md. Nothing here is eyeballed.
 */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        /* ---------------------------- Surfaces ---------------------------- */
        bg: token("bg"), // page canvas
        surface: {
          DEFAULT: token("surface"), // card
          2: token("surface-2"), // raised panel, table head, search field
          3: token("surface-3"), // inset well, avatar fallback
        },
        sidebar: token("sidebar"),
        // Modal and drawer backdrop.
        scrim: token("scrim"),

        /* ----------------------------- Edges ------------------------------ */
        border: {
          // Card and row edge. Decoration only: it separates surfaces, it
          // never marks a control. Never the sole carrier of meaning.
          DEFAULT: token("border"),
          strong: token("border-strong"), // raised panel edge
          // Inputs, selects and outlined buttons. Tuned to clear 3:1
          // against the surface behind it (WCAG 1.4.11).
          control: token("border-control"),
        },

        /* ------------------------------ Ink ------------------------------- */
        fg: token("fg"), // primary text
        "fg-2": token("fg-2"), // secondary text
        muted: token("muted"), // labels, captions, units

        /* ---------------------------- Accents ----------------------------- */
        // Navy is the primary action colour. Sage is reserved for
        // interactive elements and positive states only.
        primary: {
          DEFAULT: token("primary"), // accent text, links, active nav
          btn: token("primary-btn"), // solid button fill
          on: token("primary-on"), // text on that fill
          hover: token("primary-hover"), // button hover fill (#020617)
        },
        secondary: token("secondary"), // sage: links, CTAs, highlights
        tertiary: token("tertiary"), // info blue: informational

        /* ---------------------- Landing variant ----------------------- */
        /* Warm, light-only marketing surface. Light-independent: the
           values are re-declared under `.landing-scope` in index.css so
           in-app components keep their measured light form there. */
        warm: {
          canvas: token("warm-canvas"),
          raised: token("warm-raised"),
          card: token("warm-card"),
          ink: token("warm-ink"),
          body: token("warm-body"),
          caption: token("warm-caption"),
          accent: token("warm-accent"),
          "accent-deep": token("warm-accent-deep"),
          dark: token("warm-dark"),
          line: token("warm-line"),
          panel: token("warm-panel"),
          "panel-2": token("warm-panel-2"),
          "panel-3": token("warm-panel-3"),
          "panel-4": token("warm-panel-4"),
          "accent-2": token("warm-accent-2"),
        },

        /* -------------------------- Risk semantics ------------------------ */
        // The three levels carry the same meaning everywhere and are the
        // only colours allowed to appear on a status surface. These are
        // the darkened forms that clear AA as text on light surfaces.
        safe: token("safe"),
        warning: token("warning"),
        danger: token("danger"),
        "danger-hover": token("danger-hover"),
        // Text and glyphs that sit ON a 15% tint of the colour above. The
        // accent itself fails AA there (see the measurement table in
        // index.css); these clear 6:1.
        "safe-ink": token("safe-ink"),
        "warning-ink": token("warning-ink"),
        "danger-ink": token("danger-ink"),
        "secondary-ink": token("secondary-ink"),
      },

      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        heading: ["Plus Jakarta Sans", "DM Sans", "sans-serif"],
        data: ["Fira Code", "ui-monospace", "monospace"],
      },

      /**
       * Type scale from the Verdana Health spec, with the two sizes the
       * reference dashboard adds on top: `stat` for a metric value, and
       * `card-title` for a panel heading.
       *
       * The floor is kept at 12px for captions and 14px for small text, which
       * is the smallest size that stays legible for the elderly audience this
       * product targets.
       */
      fontSize: {
        caption: ["0.75rem", { lineHeight: "1.4", fontWeight: "500" }],
        chip: ["0.75rem", { lineHeight: "1.1", letterSpacing: "0.05em", fontWeight: "600" }],
        micro: ["0.6875rem", { lineHeight: "1.2", letterSpacing: "0.09em", fontWeight: "600" }],
        "body-sm": ["0.875rem", { lineHeight: "1.5" }],
        "body-base": ["0.9375rem", { lineHeight: "1.55" }],
        body: ["1rem", { lineHeight: "1.6" }],
        "body-lg": ["1.125rem", { lineHeight: "1.6" }],
        h4: ["1rem", { lineHeight: "1.35", fontWeight: "500" }],
        h3: ["1.25rem", { lineHeight: "1.3", fontWeight: "600" }],
        "card-title": ["1.25rem", { lineHeight: "1.3", fontWeight: "700" }],
        h2: ["1.5rem", { lineHeight: "1.25", fontWeight: "600" }],
        h1: ["1.875rem", { lineHeight: "1.2", fontWeight: "700" }],
        // The landing hero is the one place the scale reaches past `h1`.
        display: ["clamp(2.5rem, 5vw, 4.5rem)", { lineHeight: "1.02", letterSpacing: "-0.035em", fontWeight: "700" }],
        stat: ["1.875rem", { lineHeight: "1.15", fontWeight: "700" }],
        label: ["0.75rem", { lineHeight: "1.1", letterSpacing: "0.08em", fontWeight: "600" }],
        data: ["0.875rem", { lineHeight: "1.6", fontWeight: "400" }],
      },

      letterSpacing: {
        tighter: "-0.02em",
      },

      /**
       * Radius scale. The reference rounds cards to 16px, inner panels and
       * icon tiles to 12px, and controls to 8px; only avatars, status pills
       * and the search field reach `full`.
       *
       * The landing variant adds its own, larger register: `panel` 16px,
       * `hero` 28px, `hero-lg` 40px and a true `pill`.
       */
      borderRadius: {
        DEFAULT: "8px",
        sm: "4px",
        md: "12px",
        lg: "16px",
        full: "9999px",
        card: "16px",
        tile: "12px",
        control: "8px",
        panel: "16px",
        pill: "999px",
        hero: "28px",
        "hero-lg": "40px",
      },

      /**
       * Two elevation languages, kept apart on purpose.
       *
       * The APP uses `panel`: a hairline lift that separates a white card from
       * the pale canvas without making the page float. The LANDING uses the
       * warmer, deeper `card` / `lift` / `nav` / `glow` set, measured against
       * the warm canvas. Reusing one value for both is what produced a landing
       * whose panels had no depth at all.
       */
      boxShadow: {
        // App surfaces.
        panel: "0 1px 2px rgb(15 23 42 / 0.04)",
        sm: "0 1px 3px rgb(15 23 42 / 0.03)",
        DEFAULT: "0 2px 6px rgb(15 23 42 / 0.05)",
        md: "0 4px 16px rgb(15 23 42 / 0.07)",
        lg: "0 8px 32px rgb(15 23 42 / 0.10)",
        // The floating overlay token, reserved for the alert dialog.
        overlay: "0 8px 32px rgb(15 23 42 / 0.10)",
        // The one place a control is allowed to float above the page.
        fab: "0 10px 30px -6px rgb(5 150 105 / 0.45)",
        // Landing variant.
        card: "0 14px 30px -18px rgb(35 36 39 / 0.25)",
        lift: "0 24px 44px -18px rgb(35 36 39 / 0.30)",
        nav: "0 10px 30px -14px rgb(35 36 39 / 0.25)",
        glow: "0 18px 35px -14px rgb(35 36 39 / 0.35)",
      },

      backgroundImage: {
        // Fine grid, scoped to chart plot areas.
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
