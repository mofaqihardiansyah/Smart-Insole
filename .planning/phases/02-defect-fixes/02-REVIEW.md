---
phase: 02-defect-fixes
reviewed: 2026-10-17T13:51:00Z
depth: standard
files_reviewed: 22
files_reviewed_list:
  - web-dashboard/src/App.jsx
  - web-dashboard/src/App.errorBoundary.test.jsx
  - web-dashboard/src/a11y.test.jsx
  - web-dashboard/src/components/PlantarHeatmap.test.jsx
  - web-dashboard/src/components/dashboard/BentoGrid.test.jsx
  - web-dashboard/src/components/ui/ErrorBoundary.jsx
  - web-dashboard/src/components/ui/ErrorBoundary.test.jsx
  - web-dashboard/src/components/ui/StatePanel.test.jsx
  - web-dashboard/src/components/ui/StatusChip.test.jsx
  - web-dashboard/src/context/InsoleContext.jsx
  - web-dashboard/src/context/InsoleContext.test.jsx
  - web-dashboard/src/copy.test.js
  - web-dashboard/src/designTokens.test.js
  - web-dashboard/src/index.css
  - web-dashboard/src/pages/AdminPage.jsx
  - web-dashboard/src/pages/DashboardPage.jsx
  - web-dashboard/src/pages/DashboardPage.states.test.jsx
  - web-dashboard/src/pages/DashboardPage.test.jsx
  - web-dashboard/src/pages/LandingPage.jsx
  - web-dashboard/src/utils/i18n.js
  - web-dashboard/tailwind.config.js
findings:
  critical: 1
  warning: 2
  info: 3
  total: 6
status: issues_found
---

# Phase 2: Code Review Report

**Reviewed:** 2026-10-17T13:51:00Z
**Depth:** standard
**Files Reviewed:** 22
**Status:** issues_found

## Summary

Phase 2 is a defect-fix pass: token normalisation (FIX-01), keyboard/touch-target floors
(FIX-02/FIX-03), state-primitive coverage (FIX-08), copy gates (FIX-09), a crash surface
(FIX-10) and the dashboard state-branch rewrite. The headline changes are sound — the
`35 36 39` → `23 23 25` ink normalisation is complete (`tailwind.config.js:191-194`,
`index.css:336`, `index.css:118`), `ErrorBoundary` is correctly mounted above the providers
and inside the Router (`App.jsx:56-67`), and the new test files are mostly real guards with
positive-count assertions rather than decoration.

Reviewed only after re-verifying the phase's own claim: `npm test` (214 tests, 19 files) and
`npx vite build` both pass. Passing tests are not evidence of correctness, and one blocker
survives in a phase-scope file that no test in this phase can catch.

Two adversarial focal points were given. On the first — whether the cross-plan edits made to
let a shared source-scan pass are semantically neutral — the answer is **yes**: `AdminPage.jsx`
routes the two table fallbacks through `t("common.notAvailable")` and the copy gate's positive
half asserts that call (`copy.test.js:82-93`); nothing else changed in that file beyond the
`unavailable` const. On the second — whether the design-token gate and the new source scans
can pass vacuously — the answer is **yes for the token gate** (WR-01, reproduced below) and
**partially for three of the four source-scanning tests** (IN-03).

## Critical Issues

### CR-01: `AdminPage` calls hooks after a conditional early return — crashes on every admin deep link

**File:** `web-dashboard/src/pages/AdminPage.jsx:56-70` (also `:91`, `:108`)
**Severity:** BLOCKER

**Issue:** The role guard at line 56 returns before the three `useEffect` calls at lines 70,
91 and 108. That makes the number of hooks rendered depend on `role`, which is exactly the
condition React forbids: the first render of `AdminPage` runs zero hooks, and a later render
runs three. React throws `Rendered more hooks than during the previous render.`

This is not theoretical, and it is reachable on the ordinary path:

1. `useAuth.jsx:50-68` — `onAuthStateChanged` sets `user` and calls `setLoading(false)` **in
   the same synchronous callback**, while `getUserDoc(...).then(setRole(...))` (line 55-61)
   resolves on a later tick. So `role` is `""` when the shell first renders the route.
2. `UserContext.jsx:11-16` — the context default `role` is `""`.
3. `App.jsx` renders `AppShell` (and therefore the `/admin` route) as soon as `loading` is
   false and a user exists — there is no role gate in routing.
4. Result on a hard reload or a deep link to `/admin` by a signed-in admin: render #1 sees
   `role === ""` → early return (0 hooks); render #2 (after Firestore resolves) sees
   `role === "admin"` → 3 hooks → **throw**.

Reproduced locally with a temporary Vitest case (since deleted): rendering `AdminPage` inside
`UserProvider`/`InsoleProvider` and flipping `role` from `""` to `"admin"` after mount fails at
`AdminPage.jsx:70` with `Error: Rendered more hooks than during the previous render.`

FIX-10 makes this worse in appearance, not better: the new `ErrorBoundary` now catches the
throw and shows "Tampilan gagal dimuat" instead of a blank page — so an admin deep-linking to
the console gets a crash panel on first paint every time, and must press "Muat ulang tampilan"
to recover. The defect predates this phase (the diff only adds the `unavailable` const) but the
file is in phase scope and the phase is the one that made the crash surface user-visible.

**Fix:** Move every hook above the guard, and guard only the JSX. Do not keep a `return` before
any hook in this component:

```jsx
const AdminPage = () => {
  const { language } = useInsole();
  const { role } = useUser();

  const [users, setUsers] = useState([]);
  /* ...all useState/useEffect unchanged, still above the guard... */

  useEffect(() => { /* users */ }, []);
  useEffect(() => { /* device */ }, []);
  useEffect(() => { /* config */ }, []);

  const isAdmin = role === "admin";

  if (!isAdmin) {
    return (
      <section className="mx-auto w-full max-w-3xl space-y-5 lg:space-y-6">
        <PageHeader title={t("admin.title", language)} />
        <StatePanel
          variant="error"
          title={t("admin.accessDenied", language)}
          description={t("admin.accessDeniedBody", language)}
        />
      </section>
    );
  }

  /* handlers + return unchanged */
};
```

The three effects are cheap and read-only (`listUsers`, `subscribeToReadings`,
`subscribeToGlobalConfig`) and already clean themselves up, so running them while `role` is
still empty is harmless; if you would rather not fetch for non-admins, keep the hooks
unconditional and gate the *effects' bodies* on `isAdmin` inside the effect. Add a regression
test that mounts `AdminPage`, flips `role` to `"admin"`, and asserts the console renders rather
than throwing — the current suite never exercises the transition, which is why this shipped.

## Warnings

### WR-01: The design-token gate can pass with the token deleted (substring match, not class match)

**File:** `web-dashboard/src/designTokens.test.js:72`
**Severity:** WARNING

**Issue:** The gate's only real assertion is `if (!css.includes(escapeForCss(token)))`. Because
`String.prototype.includes` matches anywhere in the stylesheet, a utility the source uses is
accepted as "present" whenever any *other* selector contains its name as a substring. Tailwind
emits one class per shade step, so the false-friend set is large in exactly the place the gate
was written to protect: `bg-surface`, `bg-surface-2`, `bg-surface-3`, `bg-surface-3/70` all
contain the substring `bg-surface` (the `.` and `\/` are escaped, but the trailing
shade/opacity characters are not anchored), the same for `text-*`, `border-*`, `bg-*-ink`, etc.

Reproduced: deleting `colors.surface.DEFAULT` from `tailwind.config.js` and re-running the
scan reports `css.includes("bg-surface") === true` while the set of real emitted class
selectors contains no `bg-surface` (`classes.has("bg-surface") === false`). So the FIX-01
regression class this gate exists to catch — "the config dropped a shade the source still
uses" — **passes**. That is precisely the incident described in the file header (lines 12-17).

**Fix:** Assert against the emitted *selectors*, not the whole stylesheet. Either collect the
class selectors once and test membership:

```js
const classes = new Set(
  (css.match(/\.((?:\\.|[^\\{}[:space:],])+)/g) || []).map((s) => s.slice(1))
);
// ...
if (!classes.has(escapeForCss(token))) {
  missing.push(`${token}  <-  ${path.relative(SRC, file)}`);
}
```

or keep `includes` but anchor both ends so a shade suffix cannot satisfy a bare token:

```js
const re = new RegExp(`\\.${escapeForCss(token)}(?![\\w-])`);
if (!re.test(css)) { /* missing */ }
```

Pair the change with the positive-direction case the file already has for shadows
(lines 93-103) so the gate proves it fails when a used utility vanishes.

### WR-02: The dashboard's `connectionState === "error"` branch is unreachable for any signed-in user, and the comment describes a guard that is not there

**File:** `web-dashboard/src/pages/DashboardPage.jsx:502-516`; `web-dashboard/src/context/InsoleContext.jsx:319-326`, `:346-349`
**Severity:** WARNING

**Issue:** `InsoleContext.onError` sets `connectionState ='error'` and then, when `autoConnect`
is true, immediately does `setSource(SOURCE.SIMULATOR)` (line 325). `autoConnect` is
`Boolean(user)` (`App.jsx:82`), i.e. true for everyone who can reach the dashboard. The
`[source]` effect at line 346-349 then rewrites `connectionState` to `'simulated'` on the very
next pass. The `'error'` state therefore survives at most one render and is never painted, so:

- the trend panel's error arm with `StateRetry` (`DashboardPage.jsx:502-516`) cannot render,
- the `source.errorTitle` danger banner (`DashboardPage.jsx:274-279`) cannot render.

The phase's own `DashboardPage.states.test.jsx` covers the `connecting` and settled-empty arms
(`:147`, `:121`) but never the error arm — consistent with it being dead. The branch is new in
this phase, and its comment claims a behaviour the code does not implement:

```js
// A device we chose to trust has gone quiet: keep the patient informed
// rather than showing a frozen screen. An explicit manual selection is
// left alone so the failure stays visible.
if (autoConnect) setSource(SOURCE.SIMULATOR);
```

The guard reads `autoConnect`, not `manualSourceRef.current`, so an **explicit manual
selection is not left alone** — the comment's stated contract and the code disagree, and a
manual FIREBASE selection that fails is silently swapped for the simulator (the user is only
told via the warning `sourceBanner`). This is a dead-code path, a misleading comment, and a
behaviour/comment mismatch in the file the phase rewrote.

**Fix:** Decide the intended behaviour and make code and comment agree. If manual failures
must stay visible, key the fallback on the manual flag, not `autoConnect`:

```js
const onError = (error) => {
  setConnectionState('error');
  setSourceReason(error?.message || 'firebase-error');
  // Only auto-detected connections fall back silently; a manual selection
  // keeps its failure on screen.
  if (autoConnect && !manualSourceRef.current) setSource(SOURCE.SIMULATOR);
};
```

Note `manualSourceRef` is declared at line 240, before this effect, so it is in scope. Simpler
still: keep the fallback unconditional (so nothing silently hangs) and delete the trend-panel
error arm and its comment — but then say so in the comment instead of describing a guard that
does not exist. Do not leave a retry affordance that no user can reach.

## Info

### IN-01: `.nav-scrolled` uses a shadow geometry that is not one of the declared elevation tokens

**File:** `web-dashboard/src/index.css:335-337`
**Severity:** INFO

**Issue:** The scrolled-nav shadow is `0 18px 44px -14px rgb(23 23 25 / 0.25)`. The declared
landing elevations are `card: 0 14px 30px -18px`, `lift: 0 24px 44px -18px`,
`nav: 0 10px 30px -14px`, `glow: 0 18px 35px -14px` (`tailwind.config.js:191-194`). The token
gate only checks the colour triplet (`23 23 25`), not the geometry, so this value is
off-inventory by construction: `nav-scrolled` is neither `nav` nor any other step. It reads as
"the `nav` token, mutated", which is the kind of drift FIX-01 exists to remove.

**Fix:** Either reuse a declared token (`.landing-scope .nav-scrolled { @apply shadow-nav; }`)
or add the exact geometry as a fifth declared step so the value lives in the inventory rather
than only in `index.css`.

### IN-02: Dashboard battery tile uses an ASCII `--` placeholder while every other view uses the dictionary's `common.notAvailable`

**File:** `web-dashboard/src/pages/DashboardPage.jsx:364-369`
**Severity:** INFO

**Issue:** The supply tile renders `"--"` when `batteryPercent` is not finite. `AdminPage`,
`HistoryPage`, `MonitoringPage` and `ProfilePage` all resolve an absent value through
`t("common.notAvailable", language)` (`AdminPage.jsx:272/281/303`, `MonitoringPage.jsx:183`,
`ProfilePage.jsx:98/101`). The dash gate (`copy.test.js:63`) matches only the em/en dash
(`\u2014`/`\u2013`), so an ASCII `--` in shipped JSX is outside every copy guard — the same
class of leak FIX-09 was written to close.

**Fix:** Use `t("common.notAvailable", language)` for the value, or a dedicated
`device.noReading` key, so the placeholder is localised and inside the dictionary gates.

### IN-03: Three of the four source-scanning tests have no positive "the sweep saw N files" assertion

**File:** `web-dashboard/src/designTokens.test.js:56-79`; `web-dashboard/src/a11y.test.jsx:136-175`, `:177-200`; `web-dashboard/src/components/ui/StatePanel.test.jsx:149-163`
**Severity:** INFO

**Issue:** `copy.test.js:68-73` guards its own walk with `expect(files.length).toBeGreaterThan(40)`
so a broken `collect()` cannot pass every case below it. The other three source scans assert
only `expect(offenders).toEqual([])` / `expect(missing).toEqual([])`:

- `designTokens.test.js:64-78` — vacuous if `collectSources` returns nothing; combined with
  WR-01 this is the gate that most needs the guard.
- `a11y.test.jsx:150-161` and `:188-199` — same, no count asserted before the sweep.
- `StatePanel.test.jsx:152-163` — sweeps only `pages/`; if every zero-data branch were
  refactored away the test would still pass, which is exactly the "reporting clean without
  looking" failure mode.

None is currently vacuous (the directory walks resolve today), but the guard that makes that
provable was added to only one of the four.

**Fix:** Add the same `expect(files.length).toBeGreaterThan(N)` (or `expect(offenders.length ...`
pairing) to each walk, mirroring `copy.test.js:72`.

---

_Reviewed: 2026-10-17T13:51:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
