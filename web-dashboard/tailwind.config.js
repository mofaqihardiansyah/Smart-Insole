/** @type {import('tailwindcss').Config} */

/**
 * Theme tokens for the Verdana Health design system.
 *
 * Calm, trustworthy, clinical. Deep navy and soft sage greens evoke
 * clinical precision tempered by warmth. The system prioritizes
 * readability, accessibility, and reassurance across every touchpoint.
 *
 * Every colour resolves through a CSS variable declared in src/index.css
 * as a space separated RGB triplet, so `bg-surface`, `text-muted/70` and
 * `border-safe/50` all work. Light-only by design: there is no `.dark`
 * block and no `dark:` utility anywhere in the codebase.
 *
 * Measured contrast for every value is recorded in src/index.css next to
 * the variable it belongs to, and in DESIGN.md. Nothing here is eyeballed.
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
          2: token("surface-2"), // raised panel
          3: token("surface-3"), // inset well, input fill
        },
        sidebar: token("sidebar"),
        // Modal and drawer backdrop.
        scrim: token("scrim"),

        /* ----------------------------- Edges ------------------------------ */
        border: {
          // Hairline. Decoration only: it separates rows, it never marks
          // a control. Measured 1.1:1, which is why it is never the only
          // thing delimiting something interactive.
          DEFAULT: token("border"),
          strong: token("border-strong"), // card edge
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

        /* -------------------------- Risk semantics ------------------------ */
        // The three levels carry the same meaning everywhere and are the
        // only colours allowed to appear on a status surface. These are
        // the darkened forms that clear AA as text on light surfaces.
        safe: token("safe"),
        warning: token("warning"),
        danger: token("danger"),
        "danger-hover": token("danger-hover"),
      },

      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        heading: ["Plus Jakarta Sans", "DM Sans", "sans-serif"],
        data: ["Fira Code", "ui-monospace", "monospace"],
      },

      /**
       * Type scale from the Verdana Health spec. The floor is kept at
       * 12px for captions and 14px for small text, which is the smallest
       * size that stays legible for the elderly audience this product
       * targets.
       */
      fontSize: {
        caption: ["0.75rem", { lineHeight: "1.4", fontWeight: "500" }],
        chip: ["0.75rem", { lineHeight: "1.1", letterSpacing: "0.05em", fontWeight: "600" }],
        "body-sm": ["0.875rem", { lineHeight: "1.5" }],
        body: ["1rem", { lineHeight: "1.6" }],
        "body-lg": ["1.125rem", { lineHeight: "1.6" }],
        h4: ["1rem", { lineHeight: "1.35", fontWeight: "500" }],
        h3: ["1.25rem", { lineHeight: "1.3", fontWeight: "600" }],
        h2: ["1.5rem", { lineHeight: "1.25", fontWeight: "600" }],
        h1: ["2rem", { lineHeight: "1.2", fontWeight: "700" }],
        display: ["2.5rem", { lineHeight: "1.15", fontWeight: "700" }],
        label: ["0.75rem", { lineHeight: "1.1", letterSpacing: "0.08em", fontWeight: "600" }],
        data: ["0.875rem", { lineHeight: "1.6", fontWeight: "400" }],
      },

      letterSpacing: {
        tighter: "-0.02em",
      },

      /**
       * Verdana radius scale: soft, approachable, clinical.
       * sm 4px for badges, DEFAULT 8px for buttons/cards/inputs,
       * md 12px for modals, lg 16px for large containers,
       * full for avatars and status indicators.
       */
      borderRadius: {
        DEFAULT: "8px",
        sm: "4px",
        md: "12px",
        lg: "16px",
        full: "9999px",
        card: "8px",
        control: "8px",
      },

      /**
       * Gentle, diffused shadows. Clinical yet approachable.
       * Navy at low opacity, never black.
       */
      boxShadow: {
        // The floating overlay token, reserved for the alert dialog.
        overlay: "0 8px 32px rgb(15 23 42 / 0.10)",
        sm: "0 1px 3px rgb(15 23 42 / 0.03)",
        DEFAULT: "0 2px 6px rgb(15 23 42 / 0.05)",
        md: "0 4px 16px rgb(15 23 42 / 0.07)",
        lg: "0 8px 32px rgb(15 23 42 / 0.10)",
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
