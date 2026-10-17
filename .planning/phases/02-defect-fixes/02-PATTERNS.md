# Phase 02: Defect fixes — Pattern Map

**Mapped:** 2026-10-17
**Files analyzed:** 24 — 7 core source edits, 7 conditional page sweeps, 1 new
component, 5 tests (1 modified + 4 new), 4 documentation edits
**Analogs found:** 23 / 24 (only `ErrorBoundary.jsx` has no direct analog)

> Every path below is git-tracked source, verified with `git ls-files -- <path>`.
> No `.gsd/capabilities/**` mirror paths appear in this document. Note:
> `web-dashboard/dist/assets/*` is committed build output, **not** source — never
> treat it as an analog.

---

## File Classification

### Modified — source (the FIX work)

| File | Role | Data Flow | Closest Analog | Match Quality |
|------|------|-----------|----------------|---------------|
| `web-dashboard/tailwind.config.js` | config | transform (token → utility) | itself: `boxShadow` block `:176-192` | self-edit |
| `web-dashboard/src/index.css` | config | transform (CSS var layer) | itself: `:root` `:22-126`, `.landing-scope` `:258-291` | self-edit |
| `web-dashboard/src/context/InsoleContext.jsx` | provider / store | event-driven + persistence | itself: `readStoredThresholds` `:157-164`, `readStoredLanguage` `:166-173` | self-edit |
| `web-dashboard/src/pages/AdminPage.jsx` | page | CRUD (table render) | `web-dashboard/src/pages/HistoryPage.jsx:69,194,199` | exact (role + flow) |
| `web-dashboard/src/pages/LandingPage.jsx` | page | request-response (presentational) | `web-dashboard/src/components/ui/GlassButton.jsx:30-34` | role-match |
| `web-dashboard/src/pages/DashboardPage.jsx` | page | CRUD + streaming readout | `web-dashboard/src/pages/HistoryPage.jsx:203-246` | role-match |
| `web-dashboard/src/pages/{Login,Register,Profile,Settings,Device,Monitoring,Notifications}Page.jsx` | page | request-response | `web-dashboard/src/components/ui/GlassButton.jsx` + `GlassInput.jsx` | role-match |
| `web-dashboard/src/components/dashboard/BentoGrid.jsx` | component | transform (render tiles) | itself: `ICON_TONES` `:35-41` | self-edit |
| `web-dashboard/src/components/ui/ErrorBoundary.jsx` **(new)** | component | event-driven (error lifecycle) | *no analog* — see §No Analog | none |

### Modified — tests (the gate)

| File | Role | Data Flow | Closest Analog | Match Quality |
|------|------|-----------|----------------|---------------|
| `web-dashboard/src/designTokens.test.js` | test | transform (source scan) | itself: `keeps the two elevation languages apart` `:81-90` | self-edit |

### New — tests (Wave 0 gaps from RESEARCH §Validation Architecture)

| File | Role | Data Flow | Closest Analog | Match Quality |
|------|------|-----------|----------------|---------------|
| `web-dashboard/src/components/ui/StatusChip.test.jsx` | test | component render | `web-dashboard/src/components/PlantarHeatmap.test.jsx:1-37` | role-match |
| `web-dashboard/src/components/ui/StatePanel.test.jsx` | test | component render | `web-dashboard/src/components/PlantarHeatmap.test.jsx:1-37` | role-match |
| `web-dashboard/src/components/ui/ErrorBoundary.test.jsx` | test | error boundary render | `web-dashboard/src/components/PlantarHeatmap.test.jsx:1-37` | role-match |
| `web-dashboard/src/copy.test.js` **(or extend `i18n.test.js`)** | test | source scan (grep guard) | `web-dashboard/src/utils/i18n.test.js:80-90` + `designTokens.test.js:39-53` | exact |

### Modified — documentation (documentation-only edits)

| File | Role | Data Flow | Closest Analog | Match Quality |
|------|------|-----------|----------------|---------------|
| `DESIGN.md` | docs | — | itself `:383`, `:421` | self-edit |
| `.planning/phases/01-design-system-audit-token-lock/token-inventory.md` | docs | — | itself `:34-48`, `:68-70`, `:74-77` | self-edit |
| `.planning/REQUIREMENTS.md` | docs | — | itself `:21` | self-edit |
| `.planning/ROADMAP.md` | docs | — | itself Phase 2 block `:40+`, PAGE-10 / GATE-03 criteria | self-edit |

---

## Pattern Assignments

### `web-dashboard/tailwind.config.js` (config, transform) — D-01, D-09

**Analog:** itself. Two edits, both inside `boxShadow` `:176-192`.

**One-way token flow contract** (`:20`) — the invariant D-01 must preserve. This
is the helper every colour resolves through; a shadow literal that does *not*
resolve through it is what produced the defect:

```js
// tailwind.config.js:20
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;
```

**Edit 1 — D-01: the four landing shadows carry an undeclared ink `35 36 39`.**
Lines `:188-191`. The alphas (25/30/25/35%) are correct per `DESIGN.md:273-276`
and stay; only the ink changes to the declared `warm-dark` `#171719` = `23 23 25`.

```js
// tailwind.config.js:187-191  (BEFORE)
        // Landing variant.
        card: "0 14px 30px -18px rgb(35 36 39 / 0.25)",
        lift: "0 24px 44px -18px rgb(35 36 39 / 0.30)",
        nav: "0 10px 30px -14px rgb(35 36 39 / 0.25)",
        glow: "0 18px 35px -14px rgb(35 36 39 / 0.35)",
```

```js
// tailwind.config.js:187-191  (AFTER — ink normalized to the declared warm-dark)
        // Landing variant.
        card: "0 14px 30px -18px rgb(23 23 25 / 0.25)",
        lift: "0 24px 44px -18px rgb(23 23 25 / 0.30)",
        nav: "0 10px 30px -14px rgb(23 23 25 / 0.25)",
        glow: "0 18px 35px -14px rgb(23 23 25 / 0.35)",
```

The declared ink it must match — `index.css:118` (`--warm-dark: 23 23 25`), i.e.
the Tailwind `warm.dark` entry at `tailwind.config.js:79`:

```js
// tailwind.config.js:79
          dark: token("warm-dark"),
```

**Edit 2 — D-09: `lg` is byte-identical to `overlay`** (`:182` vs `:184`),
although `overlay` is reserved for modal dialogs (`DESIGN.md:271`) and `lg` is
not:

```js
// tailwind.config.js:179-186
        sm: "0 1px 3px rgb(15 23 42 / 0.03)",
        DEFAULT: "0 2px 6px rgb(15 23 42 / 0.05)",
        md: "0 4px 16px rgb(15 23 42 / 0.07)",
        lg: "0 8px 32px rgb(15 23 42 / 0.10)",   // ← duplicate of overlay
        // The floating overlay token, reserved for the alert dialog.
        overlay: "0 8px 32px rgb(15 23 42 / 0.10)",  // ← byte-identical
```

The two dropdown call-sites (`components/dashboard/RowMenu.jsx:86`,
`components/layout/AppSearch.jsx:179`) are re-pointed for free by PAGE-05 /
SHELL-04 — do not chase them in this phase.

**Constraint:** the four shadow alphas and the `card !== panel` distinction are
load-bearing. `designTokens.test.js:85-89` asserts them; changing the ink to
`23 23 25` also requires the assertion at `:88` to move in the **same commit**.

---

### `web-dashboard/src/index.css` (config, transform) — D-01, D-02

**Analog:** itself — the `:root` token block and the landing block.

**The declared warm ink** the config's shadows must resolve to (`:118`):

```css
/* index.css:110-125 — the `.warm-*` group D-02 re-sources */
  --warm-canvas: 236 237 238; /* #ECEDEE */
  --warm-raised: 244 245 245; /* #F4F5F5 */
  --warm-card: 255 255 255; /* #FFFFFF */
  --warm-ink: 46 48 52; /* #2E3034 */
  --warm-body: 85 87 92; /* #55575c */
  --warm-caption: 90 98 112; /* #5A6270 */
  --warm-accent: 227 74 50; /* #E34A32, graphics only */
  --warm-accent-deep: 201 58 36; /* #C93A24 */
  --warm-dark: 23 23 25; /* #171719 */
  --warm-line: 216 219 222; /* #D8DBDE hairline */
  /* Dark panel shades for the landing capabilities section. */
  --warm-panel: 32 32 36; /* #202024 */
  --warm-panel-2: 38 38 43; /* #26262b */
  --warm-panel-3: 44 44 49; /* #2c2c31 */
  --warm-panel-4: 52 52 58; /* #34343a */
  --warm-accent-2: 240 90 60; /* #F05A3C */
```

**Edit 1 — D-01: the fifth undeclared-ink site** (`:335-337`), inside the
`.landing-scope` block that starts at `:258`:

```css
/* index.css:334-337  (BEFORE) */
/* The landing nav pill deepens its shadow once the page scrolls. */
.landing-scope .nav-scrolled {
  box-shadow: 0 18px 44px -14px rgb(35 36 39 / 0.25);
}
```

```css
/* index.css:334-337  (AFTER) */
/* The landing nav pill deepens its shadow once the page scrolls. */
.landing-scope .nav-scrolled {
  box-shadow: 0 18px 44px -14px rgb(23 23 25 / 0.25);
}
```

**Edit 2 — D-02: `--inner-glow-a` is missing from the inventory but present at
`:100`.** It is declared in `:root` and re-declared at `:288`; the inventory row
must be added. Do **not** delete it — `inner-glow` is documented as "retained for
legacy callers" (`:99`, `:169-173`).

**Edit 3 — D-02: the `.landing-scope` block does NOT re-declare the `warm-*`
group.** That group lives only at `:110-125` in `:root`. Rows 34–48 of
`token-inventory.md` currently attribute them to `.landing-scope` and must be
re-sourced to `:root`.

**Constraint:** `color-scheme: light` must remain in *both* scopes —
`designTokens.test.js:102-120` slices `indexCss` at the literal strings `":root {"`
and `".landing-scope {"` and asserts both blocks carry it. Keep those exact
selectors spelled that way.

---

### `web-dashboard/src/designTokens.test.js` (test, source scan) — D-04, D-09

**Analog:** itself, second test case `:81-90`.

**The assertion that must be inverted** (`:81-90`) — it currently asserts the
off-DESIGN.md `35 36 39` value as *correct*:

```js
// designTokens.test.js:81-90  (BEFORE)
  it("keeps the two elevation languages apart", async () => {
    // The app card lift and the landing card shadow were once the same name
    // with one value, which is why the app cards were flat on the landing and
    // the landing panels were flat everywhere. They are separate tokens now.
    expect(config.theme.extend.boxShadow.panel).not.toBe(
      config.theme.extend.boxShadow.card
    );
    expect(config.theme.extend.boxShadow.card).toMatch(/35 36 39/);
    expect(config.theme.extend.boxShadow.panel).toMatch(/15 23 42/);
  });
```

```js
// designTokens.test.js  (AFTER — declared ink positive + absent-literal negative)
  it("keeps the two elevation languages apart", async () => {
    expect(config.theme.extend.boxShadow.panel).not.toBe(
      config.theme.extend.boxShadow.card
    );
    // Positive: the landing shadows resolve to the DECLARED warm-dark ink.
    expect(config.theme.extend.boxShadow.card).toMatch(/23 23 25/);
    expect(config.theme.extend.boxShadow.panel).toMatch(/15 23 42/);
  });

  it("declares no shade outside the token inventory", () => {
    // The undeclared fifth neutral #232427 (35 36 39) may not survive anywhere.
    for (const rel of ["../tailwind.config.js", "index.css"]) {
      const text = fs.readFileSync(path.join(SRC, rel), "utf8");
      expect(text, `${rel} still carries the undeclared 35 36 39`).not.toMatch(
        /35 36 39/
      );
    }
  });

  it("gives every shadow step its own value", () => {
    // lg was a byte-copy of overlay, which is reserved for modal dialogs.
    const s = config.theme.extend.boxShadow;
    const values = Object.values(s);
    expect(new Set(values).size).toBe(values.length);
  });
```

**Reusable machinery already in this file** (reuse it, do not re-implement):

```js
// designTokens.test.js:25-27 — how this file resolves src/ and reads siblings
const here = path.dirname(fileURLToPath(import.meta.url));
/** This file lives in `src`, so the sources under test are right here. */
const SRC = here;

// designTokens.test.js:103-107 — the fs + path read idiom for a sibling file
    const indexCss = fs.readFileSync(
      path.join(SRC, "index.css"),
      "utf8"
    );
```

**Atomicity contract:** D-04 states the config change and the test change land in
the **same commit**. Splitting them makes `npm test` red on both sides of the
split.

---

### `web-dashboard/src/context/InsoleContext.jsx` (provider, event-driven + persistence) — D-06

**Analog:** itself. The stored-preference readers at `:157-173` are the exact
shape D-06's migration must copy.

**Pattern to copy — read + validate + fallback default:**

```jsx
// InsoleContext.jsx:166-173 — the CURRENT reader D-06 replaces
const readStoredLanguage = () => {
  try {
    const stored = localStorage.getItem('language');
    return stored === 'id' || stored === 'en' ? stored : 'id';
  } catch {
    return 'id';
  }
};
```

```jsx
// InsoleContext.jsx:157-164 — the sibling reader, same shape (do not change)
const readStoredThresholds = () => {
  try {
    const raw = localStorage.getItem('riskThresholds');
    return raw ? sanitiseThresholds(JSON.parse(raw)) : RISK_THRESHOLDS;
  } catch {
    return RISK_THRESHOLDS;
  }
};
```

**D-06 edit:** force `'id'` unconditionally (a stored `'en'` must not strand a
returning user in English before Phase 5 removes the switch). Keep the try/catch
— private-mode `localStorage` throws:

```jsx
const readStoredLanguage = () => {
  try {
    localStorage.setItem('language', 'id'); // Phase 2 migration: force Indonesian
  } catch {
    /* storage unavailable; the in-memory default below still applies */
  }
  return 'id';
};
```

**The persistence effect that consumes this** (`:255-264`) — untouched, but it is
the reason the migration is one line rather than a state rewrite:

```jsx
// InsoleContext.jsx:255-264
  useEffect(() => {
    try {
      localStorage.setItem('language', language);
    } catch {
      /* ignore */
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);
```

**Do not touch:** the provider body `:194-231`, `connectNonce` `:225-231`, or any
of the data/source state. D-06 is a one-function edit.

---

### `web-dashboard/src/pages/AdminPage.jsx` (page, CRUD table) — D-07

**Analog:** `web-dashboard/src/pages/HistoryPage.jsx`. **This is the exact
analog** — a language-neutral table fallback already exists there and is already
inside `i18n.test.js`'s no-em-dash gate.

**The fallback pattern to copy** (`HistoryPage.jsx:69`):

```jsx
// HistoryPage.jsx:69
  const unavailable = t("common.notAvailable", language);
```

```jsx
// HistoryPage.jsx:199 — used as a cell fallback
    ["history.col.score", (row) => (Number.isFinite(row.score) ? row.score : unavailable)],
```

**The dictionary entry it resolves to** — already em-dash free, so
`i18n.test.js:80-90` passes unchanged:

```js
// utils/i18n.js:470   (id)
    'common.notAvailable': 'Tidak tersedia',
// utils/i18n.js:926   (en)
    'common.notAvailable': 'Not available',
```

**Edit site — the two literal em-dash fallbacks** (`AdminPage.jsx:201,204`):

```jsx
// AdminPage.jsx:198-205  (BEFORE)
                  {users.map((user) => (
                    <GlassTableRow key={user.uid}>
                      <GlassTableCell>
                        <span className="font-medium text-fg">{user.displayName || "—"}</span>
                      </GlassTableCell>
                      <GlassTableCell>
                        <span className="text-muted">{user.email || "—"}</span>
                      </GlassTableCell>
```

```jsx
// AdminPage.jsx  (AFTER — same `unavailable` idiom as HistoryPage)
  const unavailable = t("common.notAvailable", language);
  ...
                        <span className="font-medium text-fg">{user.displayName || unavailable}</span>
  ...
                        <span className="text-muted">{user.email || unavailable}</span>
```

**Do not translate here.** The value is already localised by `t(...)`; a hardcoded
`"—"` bypasses the dictionary, which is precisely why it escaped the
`i18n.test.js` gate in the first place. Both `"—"` occurrences are inside
`users.map`, so a single hoisted `unavailable` const serves both.

---

### `web-dashboard/src/pages/LandingPage.jsx` (page, presentational) — D-12

**Analog:** `web-dashboard/src/components/ui/GlassButton.jsx:30-34` — the
reference 44px implementation, and the string D-12's fix must mirror.

**The reference pattern:**

```jsx
// GlassButton.jsx:30-34
const SIZES = {
  sm: "min-h-[44px] lg:min-h-[36px] px-3 text-body-sm",
  md: "min-h-[44px] lg:min-h-[40px] px-4 text-body-sm",
  lg: "min-h-[48px] px-5 text-body-base",
};
```

Applied with the focus ring that must travel with it:

```jsx
// GlassButton.jsx:57-59
        "inline-flex items-center justify-center gap-2 rounded-control font-semibold",
        "transition-colors duration-150 active:translate-y-[1px]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
```

**Edit site 1 — drawer trigger, 40px → 44px** (`LandingPage.jsx:242-248`). It is
`md:hidden`, so it only ever renders at phone widths where touch is certain:

```jsx
// LandingPage.jsx:242-244  (BEFORE)
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill border border-warm-line bg-warm-card text-warm-ink transition-colors duration-150 hover:bg-warm-raised md:hidden"
```

```jsx
// LandingPage.jsx:244  (AFTER — h-11 w-11 = 44px)
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill border border-warm-line bg-warm-card text-warm-ink transition-colors duration-150 hover:bg-warm-raised md:hidden"
```

It already carries `aria-expanded` / `aria-controls` plus an `sr-only` label — do
not disturb those.

**Edit site 2 — nav links, ~36px → 44px** (`LandingPage.jsx:213-221`):

```jsx
// LandingPage.jsx:213-221  (BEFORE)
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-pill px-3.5 py-2 transition-colors duration-150 hover:bg-warm-dark/5 hover:text-warm-ink"
              >
```

```jsx
// LandingPage.jsx:217  (AFTER — min-h-[44px] mirrors GlassButton's idiom)
                className="inline-flex min-h-[44px] items-center rounded-pill px-3.5 py-2 transition-colors duration-150 hover:bg-warm-dark/5 hover:text-warm-ink"
```

Same edit for the equivalent mobile drawer links below this block if they share
the class string (grep the file for `rounded-pill px-3.5 py-2`).

**Do not touch** (D-13 defers to PAGE-10): the type scale, `rounded-[26px]`,
`rounded-2xl`/`rounded-xl` duplicates, `warm-accent-2` at `:638`, the
`window.addEventListener("scroll")` at `:166`.

---

### `web-dashboard/src/pages/DashboardPage.jsx` (page, CRUD + readout) — FIX-05, FIX-07

**Analog:** `web-dashboard/src/pages/HistoryPage.jsx:203-246`. Same shape: a
`PageHeader` with an `actions` fragment of `GlassButton`s, a `sourceIndicator`
meta, then a `source === "SIMULATOR"` banner.

**The standing-actions fragment FIX-05 must arrive at** — already correct here
(`:439-460`), which is why FIX-05 is a *verification* task, not construction:

```jsx
// DashboardPage.jsx:439-460
        actions={
          <>
            <GlassButton
              variant="outline"
              onClick={handleExport}
              disabled={history.length === 0}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {t("dashboard.exportCsv", language)}
            </GlassButton>
            <GlassButton
              variant="filled"
              onClick={acknowledgeIncidents}
              disabled={unreadIncidentCount === 0}
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              {unreadIncidentCount === 0
                ? t("dashboard.acknowledged", language)
                : t("dashboard.acknowledge", language)}
            </GlassButton>
          </>
        }
```

Exactly two standing actions: **Export CSV** and **Mark as read**, matching
`DESIGN.md:396-399` ("Export PDF" and "New Session" are the named dead controls
that must not exist). Grep `src/` for `Export PDF` / `New Session` to confirm.

**FIX-07 — the Simulation label pattern** (`:271-290`):

```jsx
// DashboardPage.jsx:271-290
  const sourceBanner = (() => {
    if (source === "FIREBASE" && connectionState === "error") {
      return (
        <StatusBanner tone="danger" title={t("source.errorTitle", language)}>
          {t("source.errorBody", language)}
        </StatusBanner>
      );
    }
    if (source === "FIREBASE" && connectionState === "connecting") {
      return <StatePanel variant="loading" title={t("source.connecting", language)} />;
    }
    if (source === "SIMULATOR") {
      return (
        <StatusBanner tone="warning" title={t("source.simTitle", language)}>
          {t("source.simBody", language)}
        </StatusBanner>
      );
    }
    return null;
  })();
```

Rendered at `:463` (`{sourceBanner}`). The HistoryPage twin uses `tone="info"`
(`HistoryPage.jsx:236-240`) — either is inside the spec; do not unify them in
this phase.

**Also on this page:** the `| ` pipe separator already used for copy
(`:430-432`) — the FIX-09 reference for a middot-or-pipe separator in shipped
copy, and the pattern for the AdminPage edit above:

```jsx
// DashboardPage.jsx:430-432
            <span className="mx-2 text-border-control" aria-hidden="true">
              |
            </span>
```

**Do not touch:** `BentoGrid` tile wiring, the `bg-primary/10` decorative tints
(those live on other pages, deferred to PAGE-04/06/08/09).

---

### `web-dashboard/src/components/dashboard/BentoGrid.jsx` (component, transform) — FIX-06

**Analog:** itself — `ICON_TONES` `:35-41` is already the semantic mapping FIX-06
requires.

**The semantic-tone table FIX-06 lands on:**

```jsx
// BentoGrid.jsx:35-41
const ICON_TONES = {
  neutral: "bg-surface-2 text-fg-2",
  accent: "bg-secondary/15 text-secondary-ink",
  success: "bg-safe/15 text-safe-ink",
  warning: "bg-warning/15 text-warning-ink",
  danger: "bg-danger/15 text-danger-ink",
};
```

**How the tile consumes it** (`:52-61`) — `card.iconTone` selects the tone, and
the doc comment at `:12-14` states the invariant verbatim ("The icon tile is
tinted by the metric's SEMANTIC role, never by position"):

```jsx
// BentoGrid.jsx:52-61
        {card.icon && (
          <span
            aria-hidden="true"
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-tile ${
              ICON_TONES[card.iconTone] || ICON_TONES.neutral
            }`}
          >
            {card.icon}
          </span>
        )}
```

**Consequence for FIX-06:** the mechanism is correct; the defect is at the
*caller* — `DashboardPage.jsx` must pass the metric's semantic `iconTone`
(`success` while good, `warning`/`danger` when not) rather than a positional
`accent`/`neutral`. Verify the `tiles` array in `DashboardPage.jsx`; do not add a
colour prop to `BentoGrid`.

**Also already present:** `Chip` tone vocabulary (`Chip.jsx:14-23`) and
`StatusChip` LEVELS (`StatusChip.jsx:19-32`) — the same `bg-<accent>/15` +
`text-<accent>-ink` pair. FIX-04 is proven satisfied by `StatusChip.jsx`; the
work is a test, not a rewrite.

---

### Accessibility sweep across pages (FIX-02, FIX-03)

**Analog:** `GlassButton.jsx` and `GlassInput.jsx`. Pattern to apply verbatim
where a raw element was used instead of the shared component.

**Buttons** (`GlassButton.jsx:57-59`):
`min-h-[44px] lg:min-h-[36px]` + `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface`.

**Inputs** — note the `ring-offset-1` / `ring-offset-surface` difference:

```jsx
// GlassInput.jsx:57-61
          className={[
            "tabular-data w-full min-h-[44px] rounded-control border bg-surface px-3.5 py-2.5",
            "text-data text-fg placeholder:text-muted",
            "transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
```

**Standalone controls** (`StatePanel.jsx:85-94`, the `StateRetry` render):

```jsx
// StatePanel.jsx:89
    className="inline-flex min-h-[44px] items-center gap-2 rounded-control border border-border-control bg-surface px-4 text-body-sm font-medium text-fg transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
```

**Global fallback exists** — a bare `:focus-visible` rule in `index.css:194-199`
covers elements that carry no ring utility. Treat that as a floor, not a pass:
FIX-02 asks for a *visible* 3:1 indicator, and the ring utilities above are the
pattern the planner should require.

**Known inline sites to audit** (grep-verified, none of them shared-component
buttons):

| Site | Class seen | Action |
|------|-----------|--------|
| `LoginPage.jsx:166`, `RegisterPage.jsx:165` | `<a>` with `min-h-[44px]` + ring utilities already | verify only — already conformant |
| `LoginPage.jsx:93`, `RegisterPage.jsx:82` | icon tile `h-11 w-11 bg-primary/10` | decorative tint → PAGE-04/06 (deferred) |
| `ProfilePage.jsx:91` | avatar `h-14 w-14 bg-primary/10` | decorative tint → PAGE-08 (deferred) |
| `DevicePage.jsx:164` | solid `bg-primary` bar | → PAGE-09 (deferred) |
| `LandingPage.jsx:242-255` | `h-10 w-10` trigger | **fix in phase** (D-12) |
| `LandingPage.jsx:217` | nav link ~36px | **fix in phase** (D-12) |
| `LandingPage.jsx:638` | `warm-accent-2` text label | → PAGE-10 (deferred) |

Do not "fix" the deferred rows — the deferred table in `02-CONTEXT.md` names an
owner for each, and Phase 6 GATE-04 is the safety net.

---

### `web-dashboard/src/components/ui/StatusChip.test.jsx` (new, test) — FIX-04

**Analog:** `web-dashboard/src/components/PlantarHeatmap.test.jsx:1-37`.

**Imports + header convention to copy:**

```jsx
// PlantarHeatmap.test.jsx:1-5
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within, act } from '@testing-library/react';
import React from 'react';
import PlantarHeatmap from './PlantarHeatmap';
import { InsoleProvider, useInsole } from '../context/InsoleContext';
```

**beforeEach resets localStorage** (`:34-37`) — required boilerplate in every
test file that touches the provider:

```jsx
// PlantarHeatmap.test.jsx:34-37
  beforeEach(() => {
    localStorage.clear();
    ctxRef = null;
  });
```

**Assertions to make** (FIX-04 = three redundant channels): for each of
`safe` / `warning` / `danger`, assert the rendered chip exposes
(a) an icon `aria-hidden="true"`, (b) the visible text label, and (c) the tone
class pair — reading the class from `StatusChip.jsx:19-32`:

```jsx
// StatusChip.jsx:19-32 — the source of truth the test asserts against
const LEVELS = {
  safe: { Icon: CheckCircle2, tone: "bg-safe/15 text-safe-ink" },
  warning: { Icon: AlertTriangle, tone: "bg-warning/15 text-warning-ink" },
  danger: { Icon: AlertOctagon, tone: "bg-danger/15 text-danger-ink" },
};
```

Query by role for the label and by `container.querySelector("svg")` for the icon
shape; assert the container class list contains both tone tokens. Import
`LEVELS as STATUS_LEVELS` (`StatusChip.jsx:67`) rather than re-typing the pairs.

---

### `web-dashboard/src/components/ui/StatePanel.test.jsx` (new, test) — FIX-08

**Analog:** `PlantarHeatmap.test.jsx:1-5` for imports/boilerplate (above).

**Assertions to make**, one per variant, against `StatePanel.jsx:19-96`:

| Variant | Assertion | Source line |
|---------|-----------|-------------|
| `loading` | `screen.getByRole("status")` has `aria-live="polite"`; renders `rows` skeleton bars | `:29-33`, `:38-44` |
| `error` | `screen.getByRole("alert")`; `StateRetry` button reachable and calls `onRetry` | `:50-57`, `:79` |
| `empty` | **no** live-region role; heading text renders; `action` slot renders | `:58-63`, `:73`, `:79` |

The "no role on empty" assertion is the one that catches a regression where
someone wraps everything in `role="alert"`:

```jsx
// StatePanel.jsx:58-63
    : {
        Icon: Inbox,
        tone: "border-border bg-surface shadow-panel",
        iconTone: "text-muted",
        role: undefined,
      };
```

Also assert the retry affordance is keyboard-operable and 44px — it is a real
`<button type="button">` at `StatePanel.jsx:86-93`.

---

### `web-dashboard/src/copy.test.js` (new, test) — FIX-09

**Analog:** two files, both source-scanning tests. Reuse their machinery rather
than inventing a linter.

**The em-dash gate that already exists for the dictionary**
(`i18n.test.js:80-90`) — **do not duplicate it**, extend the guard to *shipped
JSX*:

```js
// i18n.test.js:80-90
  it('ships no em dashes or en dashes', () => {
    // antislop R-02 is a hard gate: no em dash in any shipped string.
    for (const lang of ['id', 'en']) {
      for (const [key, value] of Object.entries(DICTIONARY[lang])) {
        expect(
          /[\u2014\u2013]/.test(String(value)),
          `${lang}:${key} contains a dash`
        ).toBe(false);
      }
    }
  });
```

**The fs-walk idiom to copy** (`designTokens.test.js:39-50`) — collects `.jsx`
recursively from `SRC`:

```js
// designTokens.test.js:39-50
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

Proposed shape — scan JSX for `\u2014` in *string literals and JSX text*, not in
block comments. The comment-stripping step is the whole difficulty: JSDoc header
comments in this codebase legitimately contain em dashes (`GlassButton.jsx:6`
uses `—` in prose), so a naive `\u2014` grep is a false positive.

```js
const stripComments = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

it("ships no em dash in rendered copy", () => {
  for (const file of collectSources(SRC)) {
    const bare = stripComments(fs.readFileSync(file, "utf8"));
    expect(
      /[\u2014\u2013]/.test(bare),
      `${path.relative(SRC, file)} ships an em dash`
    ).toBe(false);
  }
});
```

**Constraint:** D-07 scopes FIX-09 to the two `AdminPage.jsx:201,204` fallbacks
plus a grep-based guard. Both dictionaries already hold zero em dashes, and the
requirement's "both ID and EN, if retained" clause resolves to **no English
work**. Do not sweep JSDoc comments.

---

### `web-dashboard/src/components/ui/ErrorBoundary.jsx` (new, component) — FIX-10

**No analog — see §No Analog Found.** Below is the composition the planner must
build from the existing primitives.

**Registration point:** `src/App.jsx` — the render root. Two candidate wraps:

```jsx
// App.jsx:53-59 — the outermost component (wraps the Router)
function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}
```

`App.jsx:76-82` shows the current tree — `AppShell` renders
`<div className="min-h-[100dvh] bg-bg">` containing the skip link, the `Splash`
(`loading`), or `ProtectedApp` / `PublicApp`:

```jsx
// App.jsx:76-82
        <div className="min-h-[100dvh] bg-bg">
          <a href="#main-content" className="skip-link">
            <SkipLabel />
          </a>

          {loading ? <Splash /> : user ? <ProtectedApp /> : <PublicApp />}
        </div>
```

Wrap **inside** `InsoleProvider`/`UserProvider` so the fallback can localise, or
outside them if the boundary must also catch a provider throw — the planner picks
one and states it. `main.jsx:5-10` is the only other mount point and is a
poorer choice (defect fixes belong in `src/`, and `main.jsx` has no access to the
language context).

**Fallback UI pattern to reuse** — `StatePanel` already renders exactly the
error-surface shape FIX-10 needs (icon + named cause + next action + retry):

```jsx
// StatePanel.jsx:50-81 — error branch, keyed on isError
  const isError = variant === "error";
  const config = isError
    ? { Icon: AlertTriangle, tone: "border-danger/50 bg-danger/15", iconTone: "text-danger-ink", role: "alert" }
    : { ... };
  ...
    <div role={config.role} className={`rounded-card border p-6 text-center ${config.tone} ${className}`.trim()}>
      <Icon className={`mx-auto h-6 w-6 ${config.iconTone}`} aria-hidden="true" />
      {title && <p className="mt-3 font-medium text-fg">{title}</p>}
      {description && <p className="mx-auto mt-1.5 max-w-prose text-body-sm text-muted">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
```

**Retry affordance** (`StatePanel.jsx:85-94`) — the 44px + focus-ring button to
pair with the fallback; a boundary's next action is typically "reload" or "go
home", so pass a `GlassButton` instead if the action is a navigation.

**Hard requirements for this component:**

- `getDerivedStateFromError` for the render, `componentDidCatch` for the log —
  both are class-only React APIs (zero matches exist today, grep-verified).
- New i18n keys for the title/description/action; add them to **both** `id` and
  `en` dictionaries in `utils/i18n.js`, or `i18n.test.js:61-69`
  ("exactly the same key set in both languages") fails.
- Chosen copy must pass the `\u2014` guard and use `common.retry` if reusing
  `StateRetry`.
- Must not white-screen: the fallback is page content, so wrap it in the
  `min-h-[100dvh] bg-bg` shell used at `App.jsx:76`.

**Test** (`ErrorBoundary.test.jsx`): a thrower child inside the boundary renders
the fallback; `console.error` is stubbed (React re-throws boundary errors to the
console in test envs).

---

## Shared Patterns

Cross-cutting concerns the planner should attach to every plan that touches
source.

### FIX-01 — one-way token flow

**Source:** `tailwind.config.js:20` (`token()`), `index.css:22-126` (`:root`).

No hex literal may appear in component JSX — everything resolves
`rgb(var(--<name>))`. The D-01 shadow fix is the one place this phase touches
raw channel values, and it is legitimate only because it lands on the **declared**
`--warm-dark` (`index.css:118`). `token-inventory.md:74` is the audit rule.

### FIX-02 / FIX-03 — focus ring + 44px travel together

**Source:** `GlassButton.jsx:57-59` (ring), `GlassButton.jsx:30-34` (`min-h-[44px]`),
`GlassInput.jsx:57-61` (input variant with `ring-offset-1`).

```jsx
// The composite idiom — ring + target on the same element
"min-h-[44px] lg:min-h-[36px]",
"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
```

Never ship one without the other: a 44px target with no visible focus fails
FIX-02, and a ring on a 36px target fails FIX-03.

### FIX-04 — colour is never the only channel

**Source:** `StatusChip.jsx:19-32` (icon + label + tone), `Chip.jsx:14-23`
(tone vocabulary), `BentoGrid.jsx:35-41` (`ICON_TONES`).

Three redundant channels: distinct icon **shape**, translated text **label**,
**colour**. The tone pair is always `bg-<semantic>/15` + `text-<semantic>-ink` —
never a bright accent as text (`DESIGN.md:146-150`; the ink table with measured
ratios is `index.css:60-88`).

### FIX-07 — measured, or labelled Simulation

**Source:** `DashboardPage.jsx:271-290`, `HistoryPage.jsx:236-246`.

Every numeric readout must either come from Firebase (`source === "FIREBASE"`)
or sit under `t("source.simTitle")` / `t("source.simBody")`. Never a random
number without the banner (`DESIGN.md:385-387`).

### FIX-08 — cause + next action, announced

**Source:** `StatePanel.jsx:19-96` + `StateRetry` `:85-94`.

`loading → role="status" aria-live="polite"`; `error → role="alert"`; `empty →
ordinary content with a heading`. Never bare "No data" (`DESIGN.md:357-377`).
HistoryPage `:248-253` is the reference call-site.

### FIX-09 — middot or pipe, never an em dash

**Source:** `DESIGN.md:383-384`, `i18n.test.js:80-90`,
`DashboardPage.jsx:430-432` (live pipe separator).

### D-05 — Indonesian-only documentation contract

**Source:** `.planning/REQUIREMENTS.md:77`, `01-UI-SPEC.md:273`.

Phase 2 reconciles `DESIGN.md:421` ("Language stays switchable") and
`DESIGN.md:383` ("in either language") as **documentation-only** edits. The
toggle's actual removal is LANG-01 (Phase 5). Do not touch `i18n.js`'s EN
dictionary or `LanguageToggle`.

### Build gate — atomic config + test commits

**Source:** `designTokens.test.js:55-79` (orphan-class gate), `:81-90`
(elevation gate), `package.json` scripts (`npm test` = `vitest run`).

D-01 and D-04 state the config change and the assertion change land in the
**same commit**, or `npm test` is red on both sides. Same for D-09's shadow
uniqueness assertion.

---

## No Analog Found

Files with no close match in the codebase. The planner must use RESEARCH.md
patterns plus the composition guidance above.

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `web-dashboard/src/components/ui/ErrorBoundary.jsx` | component | event-driven (error lifecycle) | Zero matches for `ErrorBoundary`, `componentDidCatch`, or `getDerivedStateFromError` anywhere in `src/` (grep-verified). No class component exists in this codebase — every component is a function component. The nearest *visual* analog is `StatePanel.jsx`'s error branch (`:50-81`), but the lifecycle half (class + `getDerivedStateFromError` + `componentDidCatch`) has no precedent and must come from the React docs. |

### Near-miss analogs (partial matches, use with care)

| File | Role | Data Flow | Closest Thing | Why it is only partial |
|------|------|-----------|---------------|------------------------|
| `web-dashboard/src/components/ui/StatusChip.test.jsx` | test | component render | `PlantarHeatmap.test.jsx` | Analog is a provider-driven component; `StatusChip` is pure presentational and needs no provider wrapper. Reuse the imports/`beforeEach` shape only. |
| `web-dashboard/src/components/dashboard/BentoGrid.test.jsx` | test | component render | `PlantarHeatmap.test.jsx` | Same note as above; `BentoGrid` takes a `cards` prop and needs no context. |
| `web-dashboard/src/pages/DashboardPage.jsx` (FIX-06 span) | page | CRUD | `HistoryPage.jsx` | The *tile tone* defect is a data-shape problem in DashboardPage's `tiles` array, not a mechanism problem in `BentoGrid`; the analog shows the correct end-state but not the diff. |

---

## Metadata

**Analog search scope:**
- `web-dashboard/src/components/**` (ui, layout, dashboard, monitoring)
- `web-dashboard/src/pages/**`
- `web-dashboard/src/context/**`, `web-dashboard/src/utils/**`
- `web-dashboard/tailwind.config.js`, `web-dashboard/src/index.css`
- `web-dashboard/src/*.test.jsx|js` (test conventions)
- `.planning/phases/01-design-system-audit-token-lock/**`, `.planning/*.md`,
  `DESIGN.md` (documentation-edit conventions)

**Files scanned:** 24 read in full or by targeted range; grep sweeps over
`src/pages/**`, `src/utils/i18n.js`, `web-dashboard/src` for
`ErrorBoundary|componentDidCatch|getDerivedStateFromError`, `unavailable`,
`bg-primary/10|Export PDF|New Session`.

**Tracked-source verification:** `git ls-files` run against the repo root;
`web-dashboard/src/**` (63 files) and `web-dashboard/tailwind.config.js` all
confirmed tracked. `web-dashboard/dist/assets/*` is committed build output and is
excluded from all analog references.

**Pattern extraction date:** 2026-10-17
