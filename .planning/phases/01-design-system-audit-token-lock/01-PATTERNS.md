# Phase 1: Design-system audit & token lock - Pattern Map

**Mapped:** 2026-10-17
**Files analyzed:** 6
**Analogs found:** 6 / 6

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `.planning/phases/01-design-system-audit-token-lock/token-inventory.md` | doc | transform | `DESIGN.md` (token tables) + `.planning/PROJECT.md` (Key Decisions table) | exact |
| `web-dashboard/src/index.css` | config | CRUD | `web-dashboard/src/index.css` (existing `:root` + `.landing-scope` token layer) | exact |
| `web-dashboard/tailwind.config.js` | config | transform | `web-dashboard/tailwind.config.js` (existing `token()` helper + theme.extend) | exact |
| `web-dashboard/src/designTokens.test.js` | test | CRUD | `web-dashboard/src/designTokens.test.js` (existing build-gate test) | exact |
| `web-dashboard/src/__oil_ui_eval__/*.jsx` (scratch pages) | component | request-response | `web-dashboard/src/pages/LandingPage.jsx` | role-match |
| `oil-ui-adoption-contract.md` (implied by OIL-03 go/no-go) | doc | transform | `.planning/PROJECT.md` (Key Decisions table, lines 58-60) | exact |

## Pattern Assignments

### `.planning/phases/01-design-system-audit-token-lock/token-inventory.md` (doc, transform)

**Analog:** `DESIGN.md` (token tables) — measured palette, type scale, radius, elevation tables with measured contrast columns.

**Imports pattern:** N/A (markdown document, no imports).

**Core pattern** — token inventory table columns (from CONTEXT.md D-03):
| source file | current value | DESIGN.md token | measured contrast ratio | status (matched/flagged) | FIX phase reference |

Analog excerpt from `DESIGN.md`, palette table (lines 104-126):
```markdown
| Token | Hex | Role | Measured |
|---|---|---|---|
| `bg` | `#F8FAFC` | page canvas, rail | - |
| `surface` | `#FFFFFF` | card surface, top bar | - |
| `safe` | `#16A34A` | risk: Aman / Safe, on white | 4.5:1 on white (AA) |
```

Analog excerpt from `DESIGN.md`, accessibility contract rationale (lines 134-139) — shows the measurement-table style to mirror for flagged values:
```markdown
| Pair | Measured | Verdict |
|---|---|---|
| `#16A34A` on `bg-safe/15` | 2.78:1 | fails AA text, fails the 3:1 a glyph needs |
| `#CA8A04` on `bg-warning/15` | 2.53:1 | fails both |
```

**Analog:** `.planning/PROJECT.md` (Key Decisions table, lines 58-60) — decisions-table format for the FIX phase reference column.
```markdown
| Decision | Rationale | Outcome |
|----------|-----------|---------|
| DESIGN.md as design authority | Owner-supplied clinical console reference + measured tokens | — Pending |
```

**Error handling:** N/A (documentation artifact; no runtime errors). Missing values are flagged with `status: flagged` and a `FIX-XX` reference rather than throwing.

---

### `web-dashboard/src/index.css` (config, CRUD)

**Analog:** `web-dashboard/src/index.css` itself — the existing `:root` + `.landing-scope` CSS variable token layer.

**Imports pattern** (lines 15-17):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Core token pattern** — `:root` light theme (lines 22-126). Each variable is a space-separated RGB triplet with a measured contrast comment:
```css
:root {
  color-scheme: light;

  --bg: 248 250 252; /* #F8FAFC page canvas */
  --surface: 255 255 255; /* #FFFFFF card, top bar */
  --surface-2: 241 245 249; /* #F1F5F9 table head, search field, chips */
  --surface-3: 226 232 240; /* #E2E8F0 inset well, avatar fallback */

  --border: 234 239 244; /* #EAEFF4 */
  --border-control: 124 134 149; /* #7C8695 3.47:1 on bg. Inputs and outlines. */

  --fg: 15 23 42; /* #0F172A 18.1:1 on surface */
  --primary: 15 23 42; /* #0F172A navy. 18.1:1 on surface */
  --secondary: 5 150 105; /* #059669 sage. 4.6:1 on surface */

  --safe: 22 163 74; /* #16A34A 4.5:1 on surface */
  --warning: 202 138 4; /* #CA8A04 4.6:1 on surface */
  --danger: 220 38 38; /* #DC2626 5.9:1 on surface */

  --safe-ink: 22 101 52;
  --warning-ink: 146 64 14;
  --danger-ink: 153 27 27;
  --secondary-ink: 6 95 70;

  --series-1: 0 114 178;
  --series-2: 213 94 0;
  --series-3: 0 158 115;
}
```

**Core pattern** — `.landing-scope` re-declaration (lines 258-291): the landing re-declares all light semantic tokens under `.landing-scope` so shared components render in measured light form on the warm surface. The scope is closed at the landing root; app pages are untouched:
```css
.landing-scope {
  color-scheme: light;
  --bg: 248 250 252;
  --surface: 255 255 255;
  --surface-2: 241 245 249;
  --surface-3: 226 232 240;
  --safe: 22 163 74;
  --warning: 202 138 4;
  --danger: 220 38 38;
  --safe-ink: 22 101 52;
  --warning-ink: 146 64 14;
  --danger-ink: 153 27 27;
  --secondary-ink: 6 95 70;
  --series-1: 0 114 178;
  --series-2: 213 94 0;
  --series-3: 0 158 115;
}
```

**Core pattern** — surface treatment class (lines 162-167): the canonical card rule applied everywhere (white fill, 16px corner, hairline edge, shallow lift):
```css
.card-surface {
  background-color: rgb(var(--surface));
  border: 1px solid rgb(var(--border));
  border-radius: 16px;
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.04);
}
```

**Core pattern** — visible focus ring (lines 195-199): never removed; 2px solid focus indicator:
```css
:focus-visible {
  outline: 2px solid rgb(var(--focus));
  outline-offset: 2px;
  border-radius: 4px;
}
```

**Auth/Guard:** N/A (config file, no auth).

**Error handling:** N/A (CSS; invalid values are silently ignored by browser). Theme guard: `color-scheme: light` on `:root` and `.landing-scope` only; no `.dark` block, no `dark:` variants anywhere (enforced by THEME-01).

**Validation:** Near-miss normalization (D-04): values close to but not exactly a DESIGN.md token are normalized to the exact DESIGN.md equivalent during Phase 1; originals noted in the inventory for traceability.

---

### `web-dashboard/tailwind.config.js` (config, transform)

**Analog:** `web-dashboard/tailwind.config.js` itself — the existing `token()` helper + `theme.extend` mapping CSS variables to Tailwind utilities.

**Imports pattern** (line 1):
```js
/** @type {import('tailwindcss').Config} */
```

**Core pattern** — `token()` one-way helper (line 20): resolves a CSS variable (`rgb(var(--name) / <alpha-value>)`) to a Tailwind utility. This is the single token flow: CSS vars → utilities → components:
```js
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;
```

**Core pattern** — colors mapping (lines 26-103): every color resolves through `token()`. Surfaces, edges, ink, accents, landing variant, risk semantics:
```js
colors: {
  bg: token("bg"), // page canvas
  surface: {
    DEFAULT: token("surface"),
    2: token("surface-2"),
    3: token("surface-3"),
  },
  border: {
    DEFAULT: token("border"),
    strong: token("border-strong"),
    control: token("border-control"),
  },
  fg: token("fg"),
  muted: token("muted"),
  primary: {
    DEFAULT: token("primary"),
    btn: token("primary-btn"),
    on: token("primary-on"),
    hover: token("primary-hover"),
  },
  secondary: token("secondary"),
  safe: token("safe"),
  warning: token("warning"),
  danger: token("danger"),
  "safe-ink": token("safe-ink"),
  "warning-ink": token("warning-ink"),
  "danger-ink": token("danger-ink"),
  "secondary-ink": token("secondary-ink"),
  warm: {
    canvas: token("warm-canvas"),
    raised: token("warm-raised"),
    card: token("warm-card"),
    ink: token("warm-ink"),
    accent: token("warm-accent"),
    "accent-deep": token("warm-accent-deep"),
    dark: token("warm-dark"),
    panel: token("warm-panel"),
  },
},
```

**Core pattern** — radius scale (lines 149-165): app scale + landing variant kept separate:
```js
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
```

**Core pattern** — boxShadow (lines 176-192): two elevation languages kept apart (app navy vs landing warm). One shadow name = one value:
```js
boxShadow: {
  panel: "0 1px 2px rgb(15 23 42 / 0.04)",
  md: "0 4px 16px rgb(15 23 42 / 0.07)",
  overlay: "0 8px 32px rgb(15 23 42 / 0.10)",
  fab: "0 10px 30px -6px rgb(5 150 105 / 0.45)",
  card: "0 14px 30px -18px rgb(35 36 39 / 0.25)",
  lift: "0 24px 44px -18px rgb(35 36 39 / 0.30)",
  nav: "0 10px 30px -14px rgb(35 36 39 / 0.25)",
  glow: "0 18px 35px -14px rgb(35 36 39 / 0.35)",
},
```

**Auth/Guard:** N/A (config file).

**Error handling:** N/A (build-time config). Unknown Tailwind classes generate no CSS and no error — which is why `designTokens.test.js` exists as the hard gate.

**Validation:** Light-only — no `.dark` block and no `dark:` utility anywhere in the codebase (line 14-15 comment).

---

### `web-dashboard/src/designTokens.test.js` (test, CRUD)

**Analog:** `web-dashboard/src/designTokens.test.js` itself — the existing build-gate test that generates a real stylesheet and verifies every utility class used in `src/` has a generated rule.

**Imports pattern** (lines 1-7):
```js
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import config from "../tailwind.config.js";
```

**Core pattern** — utility detection + real stylesheet generation (lines 56-79): runs the project's own Tailwind config over the real content globs and confirms each utility-shaped token found in source has a rule in the generated CSS:
```js
it("generates a rule for every utility class used in src", async () => {
  const { css } = await postcss([tailwindcss(config)]).process(
    "@tailwind utilities;",
    { from: undefined }
  );

  const missing = [];

  for (const file of collectSources(SRC)) {
    const source = fs.readFileSync(file, "utf8");
    const seen = new Set();

    for (const match of source.match(UTILITY) || []) {
      const token = match.replace(/[.,;:)"'`]+$/, "");
      if (seen.has(token)) continue;
      seen.add(token);
      if (!css.includes(escapeForCss(token))) {
        missing.push(`${token}  <-  ${path.relative(SRC, file)}`);
      }
    }
  }

  expect(missing).toEqual([]);
}, 60000);
```

**Core pattern** — utility regex (lines 36-37): anchored so prose cannot match; leading negative lookbehind prevents `to` matching inside sentences:
```js
const UTILITY =
  /(?<![\w-])(?:bg|text|border|ring|shadow|rounded|from|to|via|fill|stroke|divide|accent|placeholder|outline|decoration)-[a-zA-Z0-9][a-zA-Z0-9./_[\]#%()-]*/g;
```

**Core pattern** — source collection (lines 39-50): walks `src/` recursively, collecting `.jsx` files only:
```js
const collectSources = (dir) => {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectSources(full));
    } else if (entry.name.endsWith(".jsx")) {
      out.push(full);
    }
  }
  return out;
};
```

**Core pattern** — elevation-language separation test (lines 81-90): asserts app `panel` shadow and landing `card` shadow are different values (one name = one value):
```js
it("keeps the two elevation languages apart", async () => {
  expect(config.theme.extend.boxShadow.panel).not.toBe(
    config.theme.extend.boxShadow.card
  );
  expect(config.theme.extend.boxShadow.card).toMatch(/35 36 39/);
  expect(config.theme.extend.boxShadow.panel).toMatch(/15 23 42/);
});
```

**Auth/Guard:** N/A (test file).

**Error handling:** `missing.push(...)` collects failures; `expect(missing).toEqual([])` fails the build (hard gate) on any missing rule. 60000ms timeout for PostCSS generation.

**Validation:** Scans only `.jsx` files (line 45). `.js`/`.ts`/`.tsx` files are not scanned by `collectSources`; the `content` glob in tailwind.config.js (line 23) covers all extensions for class generation.

---

### `web-dashboard/src/__oil_ui_eval__/*.jsx` (component, request-response)

**Analog:** `web-dashboard/src/pages/LandingPage.jsx` — existing production page that renders under `.landing-scope`, uses warm tokens, data-reveal, rise-in, and IntersectionObserver scroll reveal.

**Imports pattern** (LandingPage.jsx lines 1-28):
```jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Activity, Footprints, BellRing } from "lucide-react";
import { GlassButton } from "../components/ui/GlassButton";
import { PanelHeader } from "../components/ui/GlassCard";
import { LanguageToggle } from "../components/layout/LanguageToggle";
import PlantarHeatmap from "../components/PlantarHeatmap";
import { useInsole } from "../context/InsoleContext";
import { t } from "../utils/i18n";
```

**Core pattern** — `.landing-scope` root + warm tokens (LandingPage.jsx line 183):
```jsx
<div
  ref={rootRef}
  className="landing-scope min-h-[100dvh] bg-warm-canvas font-sans text-warm-ink"
>
```

**Core pattern** — scroll reveal with IntersectionObserver (LandingPage.jsx lines 112-133): reveal once, unobserve; under reduced motion everything is visible immediately:
```jsx
useEffect(() => {
  const root = rootRef.current;
  if (!root) return;
  const els = root.querySelectorAll("[data-reveal]");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("revealed"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  els.forEach((el) => io.observe(el));
  return () => io.disconnect();
}, [reducedMotion]);
```

**Core pattern** — reduced-motion guard (LandingPage.jsx lines 96-101):
```jsx
const [reducedMotion] = useState(() => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
});
```

**Auth/Guard:** N/A (scratch eval pages are public-facing; no auth required).

**Error handling:** N/A (UI rendering; components fail gracefully with empty state).

**Validation:** oil-ui evaluation is direction comparison / scratch pages only (D-05); no component prototyping; scratch pages are deletable and not shipped.

---

### `oil-ui-adoption-contract.md` (doc, transform) — implied by OIL-03 go/no-go

**Analog:** `.planning/PROJECT.md` (Key Decisions table, lines 54-61).

**Core pattern** — decisions table (PROJECT.md lines 58-60):
```markdown
| Decision | Rationale | Outcome |
|----------|-----------|---------|
| DESIGN.md as design authority | Owner-supplied clinical console reference + measured tokens | — Pending |
```

**Apply to:** oil-ui go/no-go decision record. Columns: Decision | Rationale | Outcome. The adoption decision (adopt / do-not-adopt) is recorded here with the token-mapping table reference (OIL-04).

**Error handling:** N/A (documentation artifact).

---

## Shared Patterns

### One-way token flow
**Source:** `web-dashboard/src/index.css` → `web-dashboard/tailwind.config.js` → component classes
**Apply to:** All token-lock and component files in Phase 1
\`\`\`css
/* index.css: CSS variable token layer */
--bg: 248 250 252;
/* tailwind.config.js: token() helper */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;
/* component: utility class consumes the token */
className="bg-surface text-fg border-border"
\`\`\`

### Light-only theme
**Source:** `web-dashboard/src/index.css` lines 22-23, 258-259 (`color-scheme: light`)
**Apply to:** `index.css`, `tailwind.config.js`
\`\`\`css
:root { color-scheme: light; }
.landing-scope { color-scheme: light; }
/* No .dark block, no dark: utilities anywhere */
\`\`\`

### Measured contrast comments
**Source:** `web-dashboard/src/index.css` (every token has a `/* #HEX ratio */` comment)
**Apply to:** `index.css` token additions, `token-inventory.md` measured column
\`\`\`css
--fg: 15 23 42; /* #0F172A 18.1:1 on surface (AAA) */
--safe: 22 163 74; /* #16A34A 4.5:1 on surface (AA) */
\`\`\`

### designTokens.test.js hard build gate
**Source:** `web-dashboard/src/designTokens.test.js` lines 56-79
**Apply to:** Any change to `index.css` or `tailwind.config.js` must keep this test green
\`\`\`js
expect(missing).toEqual([]);
\`\`\`

### Two elevation languages kept apart
**Source:** `web-dashboard/tailwind.config.js` lines 176-192 + test lines 81-90
**Apply to:** `tailwind.config.js` shadow additions
\`\`\`js
panel: "0 1px 2px rgb(15 23 42 / 0.04)",   // app (navy)
card: "0 14px 30px -18px rgb(35 36 39 / 0.25)", // landing (warm)
// One shadow name = one value; never conflate
\`\`\`

### Glass* barrel export pattern
**Source:** `web-dashboard/src/components/ui/GlassComponents.jsx` lines 1-39
**Apply to:** Any new primitive exports in `__oil_ui_eval__` scratch pages
\`\`\`jsx
import { GlassCard } from "./GlassCard";
export { GlassCard };
// Named imports, never renamed; pages import by name
\`\`\`

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| (none) | | | All Phase 1 files have close analogs in the codebase |

## Metadata

**Analog search scope:** `web-dashboard/src/`, `web-dashboard/`, `.planning/`, repo root
**Files scanned:** `web-dashboard/src/index.css`, `web-dashboard/tailwind.config.js`, `web-dashboard/src/designTokens.test.js`, `web-dashboard/src/pages/LandingPage.jsx`, `web-dashboard/src/components/ui/GlassComponents.jsx`, `DESIGN.md`, `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/research/SUMMARY.md`
**Pattern extraction date:** 2026-10-17