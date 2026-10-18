---
phase: 03-primitive-rebuilds
plan: 07
subsystem: ui
tags: [react, tailwind, vitest, jsdom, accessibility, live-region, design-tokens, i18n]

# Dependency graph
requires:
  - phase: 03-primitive-rebuilds
    provides: "03-03's `feedbackState.js` (`roleFor`) and the two-tier feedback contract on `AlertBanner`; 03-06's `tone=` half of the call-site gate"
provides:
  - "`StatePanel` taking its `role` from `roleFor` instead of deciding it locally, with the register otherwise byte-identical (D-02)"
  - "the second half of the two-tier contract on `StatePanel`: an `action` slot or a `nextAction` string, plus an announced `nextActionLabel`, and a development warning when neither is present (D-03)"
  - "the loading register animating nothing (C-01), naming the declared radius step (C-02) and inking its description `fg-2` (M-01b)"
  - "`admin.accessDeniedNext`, `admin.retryNext`, `admin.users.emptyNext`, `admin.devices.emptyNext` in both dictionaries"
  - "the five repaired `AdminPage` feedback sites, plus the scoped source sweep that keeps them repaired"
  - "`radiusScale.test.js` — the gate that fails a bare `rounded` or any undeclared radius step under `src/components/ui`"
  - "`liveRegion.test.js` — the four-region allowlist, the risk-only dashboard rule, the live-number absence rule and the verbatim `InsoleContext` guard"
affects: [03-05, 05-page-rebuild, 06-delivery-gate]
requirements: [COMP-03, COMP-05]

# Actuals (#2632) — realized diff, same chars/4 scale as the plan's estimate.
actuals:
  tokens: 10600
  tasks: 3
  commits: 3
---

## What shipped

- `StatePanel.jsx` deletes the `role` field from both branch objects and reads
  `roleFor(variant)` and `roleFor("loading")` instead. The decision has one owner
  now: `feedbackState.js`. The rendered output is unchanged — `error` is still an
  alert, `loading` is still a polite status, `empty` and an unrecognised variant
  still carry no role.
- The two-tier contract arrives as `nextAction` plus `nextActionLabel`. The label
  renders in a `sr-only` span inside the next-action paragraph, so the paragraph
  reads as "next step: …" rather than as a second cause. The label is a prop
  rather than a dictionary lookup inside the primitive, following the
  `dismissLabel` precedent on `AlertBanner`; both are localised by the caller.
- A development warning fires when the register is `error` or `empty` and neither
  `action` nor `nextAction` is present. Production keeps the benign shape: the
  cause still renders.
- `C-01`: the skeleton bar loses `animate-pulse`. The bar keeps `h-4`, its
  computed width and its radius, so the reserved space is identical and the
  layout still does not jump when the reading lands.
- `C-02`: the bare `rounded` on the skeleton bar becomes `rounded-control`. The
  resolved number is unchanged — `borderRadius.DEFAULT` and `control` are both
  8px — but the class now names the step the scale reserves for a control.
- `M-01b`: the shared description line moves from `text-muted` to `text-fg-2`,
  because the error branch's surface is a `danger/15` tint where `muted`
  measures 3.75 to 4.11:1.
- Four dictionary keys added in both languages, all dash-free. The five
  `AdminPage` sites repaired: the access-denied guard and the error and empty
  arms for users and for devices.
- `radiusScale.test.js` and `liveRegion.test.js`.

## Verification

- `grep -c 'animate-'` over `src/components/ui/` is **0** for every file.
  `grep -cE '"(rounded|rounded-\[)'` over `StatePanel.jsx` is 0.
  `git diff InsoleContext.jsx` is **empty** — WR-02 is preserved, not absorbed.
- Both new gates were proved non-vacuous in both directions, which is the point
  of writing them:
  - radius: a temporary `src/components/ui/__probe.jsx` using a bare `rounded`
    failed the gate with `__probe.jsx uses the bare rounded, which resolves to
    DEFAULT rather than to a declared step`, then was removed.
  - live region: a second polite region added inside `DevicePage.jsx` failed the
    gate. That probe caught a real weakness — the first version compared the set
    of *files*, so a second region beside an existing one passed. The gate now
    pushes one entry per occurrence and fails.
- Full suite: **33 files, 310 tests, all passing.** `npm run build` exits 0.

## Deviations

- **`aria-live="off"` does not exist in the source.** Success criterion 5 is
  phrased as `aria-live="off"` on the live numbers, and no such attribute is
  present anywhere under `src/` — the numbers are simply outside every live
  region, which is the stronger form of the same rule. The gate therefore
  asserts the absence of any live-region attribute on the bento tiles and on
  `BentoGrid.jsx`, so adding an `off` attribute and adding a real region both
  fail. Nothing was added to the source to satisfy the wording.
- **`nextActionLabel` is a prop, not a dictionary lookup inside the primitive.**
  `StatePanel` is pure and tested without providers, and there is no language
  context in this codebase, so a lookup would either make the primitive
  impure or hardcode a language. The caller passes the localised label,
  matching `AlertBanner`'s `dismissLabel`.
- **The call-site sweep is scoped to `AdminPage.jsx`.** A whole-app sweep would
  fail today on eight panels that name a cause with no next step:
  `DashboardPage.jsx:515`, `DashboardPage.jsx:557`, `DevicePage.jsx:142`,
  `HistoryPage.jsx:305`, `MonitoringPage.jsx:137`, `ProfilePage.jsx:82`,
  `ProfilePage.jsx:185`, `SettingsPage.jsx:303`. Those are Phase 5's work and
  are recorded here rather than repaired behind this plan's back.
- **The three-step radius decision resolved to `rounded-control`.** The
  alternative was `rounded-md` (12px), which is the tile step and would make a
  4px-tall bar read as a panel.
- `StatePanel.jsx`'s header comment was rewritten rather than appended to: it
  claimed the component decided the role itself, which is the single fact this
  plan changes.
