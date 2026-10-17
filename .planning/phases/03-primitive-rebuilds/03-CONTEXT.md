# Phase 3: Primitive rebuilds - Context

**Gathered:** 2026-10-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 rebuilds the **component layer** of the design system: the five `Glass*` primitives (`GlassCard`, `GlassButton`, `GlassInput`, `GlassTable`, `GlassForm`), `StatusChip` and `Chip`, one new Alert/Banner primitive with a named cause and a next action, and one shared CVD-safe `SERIES` source consumed by the three charts. Requirements are COMP-01…COMP-05. Success criterion 5 is a **preserve-only** contract: `aria-live="off"` on live pressure numbers, exactly one `aria-live="polite"` region for risk-level changes, and `autoConnect={Boolean(user)}` intact.

Not this phase: the shell (AppLayout/AppSidebar/AppTopbar/AppSearch → Phase 4) and the pages, including `LandingPage`'s type scale and radius (→ Phase 5 / PAGE-10). Page-layer edits that appear below are narrow and forced by a decision taken here, not a page rebuild.

Scope discipline: the phase boundary is FIXED by `ROADMAP.md`. This discussion clarified **how** to implement COMP scope. Nothing was added as a new capability; the only backwards edits are a backlog supersession (D-01) and a documentation amendment (D-04/D-05) that the requirement itself forces.

### Carried-forward acceptance criteria (inherited, not re-decided)

These arrive from Phase 2's deferral ledger (`02-CONTEXT.md` D-11) and bind this phase's files:

- **Undeclared motion in this phase's own primitives** — `StatePanel.jsx:41` (`animate-pulse`) and `GlassButton.jsx:58` (hover translate/scale). DESIGN.md's MOTION 1 permits only colour/border/`scale-105` feedback at ≤150ms plus the single heatmap danger pulse. Owner: COMP-01 / COMP-03.
- **Radius-scale bypass inside the `Glass*` and chip primitives** — any off-scale radius in these files resolves to the declared scale (8px control / 12px tile / 16px card / full). Owner: COMP-01 / COMP-02.
- **`BentoCell` has no height assertion** — Phase 2 declined to pin one because the file belongs to Phase 3 and the cell is content-driven. Not re-decided here (see *the agent's Discretion*).

</domain>

<decisions>
## Implementation Decisions

### Landing register in the button primitive

- **D-01:** Restore the landing CTA variants **as keys on the shared `variant` map** — re-add `warm` (`bg-warm-accent-deep text-white hover:opacity-90 border border-transparent`) and `warmOutline` (`border border-warm-line bg-warm-card text-warm-ink hover:bg-warm-raised`) to `GlassButton.jsx`'s `VARIANTS`, and ship the anti-silent-fallback gate case **in the same commit**. This makes COMP-01 the owner of the defect recorded as backlog `ROADMAP.md` **999.1**, which must be marked superseded-by-COMP-01 with a pointer to this decision rather than deleted. The 8 call sites (`LandingPage.jsx:227,235,279,286,391,400,730,739`) already pass both keys, so no page edit is required. Rejected: a landing-only button component (contradicts `DESIGN.md:337-339`, duplicates the focus-ring pair and the 44px floor that `a11y.test.jsx:203-225` asserts, needs 8 import rewrites) and a `.landing-scope` token remap (measured bleed — `.landing-scope` already remaps `--primary-btn` at `index.css:272`, and `LanguageToggle` renders inside that scope at `LandingPage.jsx:225`, so the language toggle's active segment would flip with the CTA; nine non-button `bg-primary-btn` consumers share the token; and one token pair cannot express two CTA ranks).

### Feedback primitives

- **D-02:** COMP-03 takes the shape **two registers, one contract** rather than one merged component. The new Alert/Banner primitive owns the tone→role matrix (the a11y-critical part — `role` is chosen by tone in `StatusBanner.jsx` and by variant in `StatePanel.jsx` today, in two separate files); `StatePanel` keeps the centred-block register and all 9 of its call sites, including `ErrorBoundary.jsx:2`, which imports it by direct path rather than through the barrel — so FIX-08 and FIX-10 provably cannot regress; `StatusBanner` becomes a delegate so its 8 call sites keep working, which means the new primitive ships with real consumers instead of as dead code. Both legacy names stay exported for COMP-05. Rejected: absorbing everything into one component (all 11 consumers migrate in-phase, the `ErrorBoundary` direct import needs re-pointing, and a variant×tone matrix produces meaningless cells such as loading+success); adding a third overlapping primitive beside both (this is the drift `STATE.md:87` names, triplicates the role matrix, and risks a second always-on polite region); and extending `StatePanel` in place with no new component (smallest diff and honest reuse, but it fails COMP-03's wording and would need the supervisor's sign-off before planning). — **Reversibility:** costly — undoing this means re-splitting a merged tone→role matrix and re-migrating every feedback call site; the `ErrorBoundary` path and the two legacy export names are a published surface the later page rebuilds depend on.

- **D-03:** "Named cause + next action" is enforced **two-tier**. The primitive requires both a cause and a next action; the action is satisfied either by an `action` element (a retry button) or by an explicit `nextAction` string for states that legitimately have no button (for example "Hubungi administrator" on an access-denied state). Enforcement is by test — a literal like `admin.users.empty` currently ships with no next step and `npm test` is green. Development surfaces a warning; production keeps a benign declared fallback, so a bad key degrades to a declared default and never blanks a clinical view. Rejected: runtime refusal to render (on a clinical console a blank error or empty region is strictly worse than the defect it fixes, and `loading` has no next action by nature, so the rule cannot be uniform); CI-only enforcement with no dev signal; and advisory-only, which **is** the status quo that produced the violations. Consequence: the call sites that violate the contract are repaired in-phase — `AdminPage.jsx:61`, `:180`, `:264` render `StatePanel variant="error"` with a cause and no action, and `:182` and `:266` render `variant="empty"` with a title only. — **Reversibility:** costly — undoing this re-opens the FIX-08 defect class and requires reverting both the call-site repairs and the gate.

### Chart colour source

- **D-04:** The single `SERIES` source moves to a dedicated module — `web-dashboard/src/utils/series.js`, holding key + `varName` + dash — with a colocated test. `TelemetryChart`, `TrendChart` and `LoadDonut` consume it, and `LoadDonut`'s caller-supplied arc colours are **deleted** from `DashboardPage.jsx:386/392/398` (that is a three-line deletion, not a page rebuild, and it fixes a live defect: the `--border-strong` arc resolves to `#E2E8F0`, 1.3:1, failing the 3:1 graphical-object bar, where `--series-3` measures 3.42:1). The quartet is enforced by a **real quarantine gate**: a chart-file allowlist, a non-vacuity assertion that the allowlisted files actually reference the source, a file-count floor, and `.js` included in its walk — the existing sweeps in `a11y.test.jsx`, `copy.test.js` and `designTokens.test.js` walk only `.jsx`, so a `.js` module would otherwise sit outside its own guard. `DESIGN.md`'s "Single source" sentence is **amended** (Phase 3 proposes the diff; the product owner signs) to state where the array lives, which charts must read it, that `PlantarHeatmap` stays on risk tokens by design, and that `TrendChart`'s trace is carved out per D-05. Rejected: leaving `SERIES` in `TelemetryChart.jsx` and importing it from there (zero doc churn, but a monitoring leaf becomes the palette authority for a dashboard chart and quarantine stays unenforced prose — weaker than the project's own standard, since `copy.test.js:72` already asserts a file-count floor precisely so a sweep cannot pass vacuously) and chart-scoped CSS classes (a var→class→JS indirection with no precedent, plus `tailwind.config.js`/`token()` churn in a component phase, and the dash still cannot live in a class). — **Reversibility:** costly — `DESIGN.md` is the published design authority; un-amending it and re-scattering the source touches four consumers plus the gate, and the document becomes false again in the same motion.

- **D-05:** `TrendChart`'s single peak trace stays a **non-identity trace**: it keeps the declared `--secondary` sage line (4.60:1) and the carve-out is written into `DESIGN.md` alongside the D-04 amendment, so it is explicitly not a member of the series set. `DESIGN.md:349` already documents the panel as "One series, because the donut and the map already answer 'which zone'", so drawing it from the series source would falsely imply "blue = forefoot". Rejected: drawing it from `--series-1` (better contrast at 5.19:1, wrong semantics) and adding a dedicated identity-free token whose only consumer would be this one line. `PlantarHeatmap` is likewise settled by DESIGN.md, not by this discussion: it keeps the risk tokens because it encodes pressure magnitude, so "aligned" for it means it shares the zone keys and imports no series colour — which it already satisfies.

### the agent's Discretion

None of the five areas was delegated — the user chose every one. The following implementation details were **not** decided and are the planner's:

- The new Alert/Banner primitive's export name and prop names, and where the shared tone→role config module lives (a new module, or an export from the new primitive that `StatusBanner` imports).
- `series.js`'s export names and shape, and whether `TelemetryChart` keeps its currently-0-importer `TELEMETRY_SERIES` re-export as an alias or drops it as a stale surface.
- The dev-warn helper's shape and where it lives, given that four fallback sites need it (`GlassButton.jsx:61`, `Chip.jsx:39`, `StatusChip` — which has no fallback at all — and `StatePanel`).
- Whether `BentoCell` needs a height assertion at all. Phase 2 declined to pin a `min-h` because the file belongs to this phase; the cell is not an interactive target, so the 44×44px floor does not obviously apply and a content-driven floor may be the correct answer. Phase 2 recorded it as "a Phase 3 primitive with a content-driven floor" — resolve it against the accessibility contract rather than re-inheriting the deferral.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design authority
- `DESIGN.md` — the authority. Relevant sections: two surfaces/one product (`:6-25`), design read (`:26-37`), light-only theme (`:89-98`), palette and the `-ink` tokens (`:99-160`), data visualisation — single source + quarantine, amended by D-04/D-05 (`:161-182`), typography (`:183-217`), layout and breakpoints (`:218-251`), radius and elevation (`:252-282`), motion (`:283-302`), component naming — Glass* names frozen (`:335-356`), accessibility contract (`:357-380`), anti-slop constraints (`:381-404`), landing warm dialect incl. `warm-accent-deep` as button fill (`:405-440`).
- `web-dashboard/src/index.css` — the token layer (`:root` + `.landing-scope`), measured contrast in comments. `--series-1/2/3` at `:94-96` and re-declared at `:284-286`; `--primary-btn` remapped under `.landing-scope` at `:272` (the reason D-01 avoided the scope remap).
- `web-dashboard/tailwind.config.js` — the `token()` helper mapping CSS variables to utilities; radius/elevation/font-size scales; light-only, no `.dark` block.
- `.planning/phases/01-design-system-audit-token-lock/01-UI-SPEC.md` — the approved contract. Visual registers never mixed (`:82-91`), radius scale (`:196-208`), elevation pairs (`:212-236`), MOTION 1 (`:238-251`), accessibility contract (`:253-266`), copywriting contract (`:269-281`).
- `.planning/phases/01-design-system-audit-token-lock/01-UI-REVIEW.md` — 6-pillar baseline; the pillar 2 (off-scale radii), pillar 4 (landing type scale) and pillar 5 (spacing, touch targets) findings are the source of the carry-forwards.

### Gates that must stay green (extend them, do not fork)
- `web-dashboard/src/designTokens.test.js` — the token gate; asserts the declared value positively and scans for the undeclared one negatively.
- `web-dashboard/src/a11y.test.jsx` — rendered-DOM assertions for the focus ring and the 44×44px floor, plus the phase-wide `.jsx` sweep with a file-count floor.
- `web-dashboard/src/copy.test.js` — the dash guard; `SCRATCH = "__oil_ui_eval__"` exclusion at `:31`, file-count floor at `:72`.
- `web-dashboard/src/StatePanel.test.jsx` — per-variant role assertions; this is the regression net that makes D-02's "no migration" claim checkable.
- `web-dashboard/src/StatusChip.test.jsx:81` and `web-dashboard/src/StatePanel.test.jsx:106` — these currently **encode the silent fallback as intended behaviour**. D-04's chosen posture (gate + dev-warn + benign production fallback) keeps them valid; the rejected "props evolve + fail loudly" option would have required inverting them.

### Requirements and roadmap
- `.planning/REQUIREMENTS.md` — COMP-01…COMP-05; traceability rows at `:135-139`.
- `.planning/ROADMAP.md` — Phase 3 goal and its 5 success criteria; `## Backlog` **999.1** (superseded by D-01) and **999.2** (untouched).
- `.planning/PROJECT.md` — milestone goal, constraints (light-only, Delivery Gate at three breakpoints, antislop filter), Key Decisions table.
- `.planning/STATE.md` — `Blockers/Concerns`: five open Phase-02 items.

### Phase 2 evidence (the source of the carry-forwards)
- `.planning/phases/02-defect-fixes/02-CONTEXT.md` — D-11's deferral ledger; the undeclared-motion and radius-bypass rows are this phase's files.
- `.planning/phases/02-defect-fixes/02-UI-REVIEW.md` — 14/24; top priority fix 1 is D-01's defect, fix 2 is backlog 999.2, fix 3 is WR-02.
- `.planning/phases/02-defect-fixes/02-REVIEW-DISPOSITION.md` — 6 findings still `open` (CR-01, WR-01, WR-02, IN-01, IN-02, IN-03).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `GlassButton.jsx:31-32` — the `min-h-[44px]` touch-target pattern (44px on touch, dropping to 36/40 only from `lg`); the reference implementation the other primitives should match.
- `StatePanel.jsx` + `StateRetry` — the centred-block register D-02 preserves untouched, including the `role="status"`/`role="alert"` split and the `StateRetry` action.
- `StatusBanner.jsx` — becomes the delegating register; its tone map is one of the two places `role` is currently chosen from.
- `web-dashboard/src/utils/` — the precedent for D-04's module: `randomForestRisk.js` exports `RISK_THRESHOLDS`/`inferRisk` as domain constants consumed by context and pages, and 5 of the 7 utils modules ship a colocated test.
- `GlassComponents.jsx` (barrel, 17 names) and `GlassForm.jsx:111-120` (a second, overlapping 9-name re-export) — two re-export paths that an API change has to keep honest. `GlassForm`'s barrel has zero consumers outside the umbrella today, but Phase 4's shell starts using it.
- The three source-sweep gates (`designTokens.test.js`, `a11y.test.jsx`, `copy.test.js`) — the established idiom for a rule that must not be able to pass vacuously.

### Established Patterns
- One-way token flow: CSS variables (`index.css`) → `token()` (`tailwind.config.js`) → components → pages. No component hard-codes a hex.
- Light-only: no `.dark` block, no `dark:` utility.
- Risk never by colour alone: icon **and** text label **and** colour, on every risk element.
- `aria-live="off"` on live pressure numbers; **exactly one** `aria-live="polite"` region, and only risk-level changes are announced through it. A second always-mounted live region is a regression.
- `Glass*` component names are frozen (COMP-05); props are not.
- Silent fallbacks are the defect shape of this codebase: `GlassButton.jsx:61` (`VARIANTS[variant] || VARIANTS.filled`), `Chip.jsx:39` (`TONES[tone] || TONES.neutral`), and `StatusChip` with no fallback at all. That one behaviour produced both shipped defects — the eight collapsed CTAs and a grey tile for a *healthy* pressure score, where the caller passed `success` against a `safe` key (`STATE.md:84`).

### Integration Points
- `GlassComponents.jsx` → 10 page files; `GlassForm.jsx`'s barrel → 0 external consumers today. `LandingPage.jsx` and `AlertModal.jsx` are the only two files importing modules directly.
- `DashboardPage.jsx:386/392/398` — the donut segment colours D-04 deletes.
- `LandingPage.jsx:225` — `LanguageToggle` renders **inside** `.landing-scope`; this is why D-01 rejected the token-remap mechanism.
- `ErrorBoundary.jsx:2` — imports `StatePanel` and `StateRetry` by direct path, bypassing the barrel; D-02's no-migration choice is what keeps FIX-10 safe.
- `AdminPage.jsx:61`, `:180`, `:264`, `:182`, `:266` — the cause-with-no-next-action violations D-03 forces repairs at. The same file carries CR-01 and backlog 999.2, both explicitly out of this phase's scope.
- `InsoleContext.jsx:319-326` — the source-fallback guard named by criterion 5. Preserve it; do not correct it here (see Deferred).

</code_context>

<specifics>
## Specific Ideas

No specific references beyond the decisions above. The discussion was driven by `DESIGN.md`, the Phase 1 approved contract, and the Phase 2 audit evidence — all of which are listed in the canonical refs.

</specifics>

<deferred>
## Deferred Ideas

| Finding | Where it stands | Owner |
|---|---|---|
| **WR-02** — the dashboard's `connectionState === "error"` arm is unreachable, and `InsoleContext.jsx:319-326` reads `autoConnect` where the comment claims a manual-selection guard, so a clinician who deliberately selects live device data is silently swapped to simulated after a failure | Offered as a fifth area at the close of this discussion and deliberately not taken. Stays `open` in `02-REVIEW-DISPOSITION.md`. Success criterion 5 says the guard is **preserved**, so this phase must leave it intact | Not this phase |
| **CR-01** — `AdminPage.jsx:56-67` early-returns before three `useEffect` hooks, so an `/admin` deep link throws. Pre-existing | Recorded `open` in `02-REVIEW-DISPOSITION.md` | Not this phase |
| **999.2** — `AdminPage.jsx` ships five English error fallbacks against the Indonesian-only contract, and `copy.test.js` cannot see them | Stays a backlog phase; D-03 forces repairs at the *adjacent* cause/next-action sites on the same file but does not absorb this | Backlog |
| **WR-01** — the token gate can pass with the token deleted (substring match, not class match) | `open` in `02-REVIEW-DISPOSITION.md` | Not this phase |
| **IN-01** — `.nav-scrolled` uses a shadow geometry that is not one of the declared elevation tokens | `open` in `02-REVIEW-DISPOSITION.md`; the landing nav is rebuilt in Phase 5 | PAGE-10 |
| **IN-02** — the dashboard battery tile uses an ASCII `--` placeholder while every other view uses `common.notAvailable` | `open` in `02-REVIEW-DISPOSITION.md` | PAGE-01 |
| **IN-03** — three of the four source-scanning tests have no positive "the sweep saw N files" assertion | `open`; D-04's new quarantine gate adopts the file-count-floor idiom, so this may be partly addressed in passing | Not this phase |
| **Landing type scale and landing radius** — 49 non-token size classes and the off-scale landing radii | Phase 2 D-13 carry-forward, already recorded against PAGE-10 | PAGE-10 |

None of the above is dropped: Phase 6 GATE-04 is the safety net that proves nothing was lost.

</deferred>

---

*Phase: 3-Primitive rebuilds*
*Context gathered: 2026-10-17*
