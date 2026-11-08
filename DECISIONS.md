# Decisions

Lightweight architecture decision records. One entry per decision that would
cost real rework to reverse. Append only; supersede with a new entry instead of
rewriting an old one.

## ADR-001: Hybrid Random Forest with clinical rules for danger

- **Date:** 2026-11-01
- **Status:** Accepted

**Context.** The DFN-DS dataset has 135 patients and 81k samples, but only 31
`danger` samples (0.05%) from 3 patients. A Random Forest cannot learn a
generalizable `danger` boundary from that.

**Decision.** Random Forest classifies `safe` vs `warning` (99.95% of data).
A clinical rule classifies `danger`: peak ≥ 70 kPa with sustained duration
≥ 0.1 s.

**Consequences.** The danger threshold is clinically defensible and testable
through the clinical contract. It is not learned from data, so the rule must be
documented in the thesis and reviewed against literature. See
`docs/rf-model-report.md`.

## ADR-002: TypeScript for the web dashboard

- **Date:** 2026-11-01
- **Status:** Accepted

**Context.** The web app grew across 12 pages plus shared services and a
firmware-dashboard data contract. Plain JavaScript let shape drift between the
firmware payload, the realtime service, and the UI.

**Decision.** Migrate source files to TypeScript with strict checking. Tests
may remain `.jsx` where they add no type value.

**Consequences.** `npm run typecheck` is part of the verification gate.
Shared contracts live in `src/types/`. New code is `.ts`/`.tsx`.

## ADR-003: Ship Indonesian only

- **Date:** 2026-11-01
- **Status:** Accepted

**Context.** An earlier design brief required an ID/EN language toggle. The
actual product serves Indonesian-speaking patients and caregivers, and
maintaining two surfaces doubled copy review for no clinical benefit.

**Decision.** The shipped surface is Indonesian only (`LANG-01`). The i18n
dictionary keeps both languages, but English is not exposed.

**Consequences.** Copy tests assert Indonesian strings. Do not re-introduce a
language toggle without a new decision.

## ADR-004: Light-only clinical console, one design authority

- **Date:** 2026-11-01
- **Status:** Accepted

**Context.** The original dashboard was dark glassmorphism, while the reference
direction moved to a warm light clinical console. Keeping both themes would
double the token and contrast surface.

**Decision.** Build one light theme, with colour reserved for pressure and risk
states. `DESIGN.md` is the design authority; `docs/DESIGN-BRIEF.md` is
historical.

**Consequences.** No dark mode. New UI work reads `DESIGN.md` first and verifies
contrast and layout at 360px, 768px, and 1280px.

## ADR-005: Agent documentation in one root location

- **Date:** 2026-11-01
- **Status:** Accepted

**Context.** Fresh agent sessions re-explored the repository, re-derived known
facts, and produced oversized plans. Instructions were scattered between
`AGENTS.md`, `README.md`, and `docs/`.

**Decision.** Keep the five agent files at the repository root: `AGENTS.md`
(rules), `READY.md` (verified state), `TASK.md` (ledger), `CHANGELOG.md`
(release history), `DECISIONS.md` (this file). Root is the only location where
`AGENTS.md` is auto-loaded.

**Consequences.** The agent reads these before exploring. `TASK.md` is updated
after every completed task; `READY.md` only when a fact changes.

## ADR-006: One page width inside the shell

- **Date:** 2026-11-03
- **Status:** Accepted

**Context.** `AppLayout` already caps the router outlet at 1400px, the same
width as the header. Five pages (Device, Settings, Profile, Notifications,
Admin) added their own `max-w-3xl` / `max-w-5xl` plus `mx-auto` on the page
`<section>`, so their cards rendered 768px wide under a 1400px nav pill, with
empty canvas on both sides. Two pages (Monitoring, History) had no cap, so the
app shipped two content widths at once.

**Decision.** The shell owns the content width. Page sections carry spacing
only (`space-y-5 lg:space-y-6`); they never re-cap or re-centre themselves.
Density inside the column is handled by the page: responsive grids for forms
and stat strips, `max-w-prose` for running prose.

**Consequences.** A narrower page needs a new decision, not a local `max-w-*`.
Wide cards expose stretched internals, so a page that gains width must lay its
content out in columns rather than let a single field or line span the card.

## ADR-008: Danger starts at 200 kPa, not 70

- **Date:** 2026-11-05
- **Status:** Accepted

**Context.** The danger rule shipped at 70 kPa with a 0.1 s window. A review of
the project's own library (Castro-Martins et al., Heliyon 2024, e26161) found
seven plantar-pressure thresholds and no 70 kPa among them; the most consensual
in-shoe figure is 200 kPa. The same review states that evidence for prolonged
low pressure is still missing, so no duration threshold can be cited.

**Decision.** Danger is `peak >= 200 kPa` on one sample. The `sustained`
feature still feeds the forest's safe/warning boundary, but it is not part of
the danger rule. The number is exported from `models/rf-model.json`, so web and
firmware cannot drift.

**Consequences.** The device alarms later than before, closer to published
practice. Figshare DFU cannot validate the new threshold (its peak is
123.8 kPa), so the validation report says so instead of claiming coverage. A
future duration-based rule needs new evidence and a new decision.

## ADR-007: Random Forest is the only risk algorithm

- **Date:** 2026-11-04
- **Status:** Accepted

**Context.** The first version shipped a fuzzy inference engine beside the
Random Forest: hand-tuned membership functions and a 3x3 rule base. The runtime
verdict already came from the forest, so the fuzzy engine survived only as a
reference and a labelling comparator, which made the thesis method ambiguous.

**Decision.** Remove fuzzy logic entirely. Random Forest is the only risk
algorithm: 20 trees classify `safe` vs `warning`, and a clinical rule classifies
`danger` (ADR-001). `RISK_THRESHOLDS`, `SCORE_BANDS`, and `alignScoreToLevel`
live in `randomForestRisk.ts`. The wire field is `risk_score`, not
`fuzzy_risk_score`.

**Consequences.** No fuzzy code, test, or agreement metric remains. Reintroducing
a second classifier needs a new decision. `docs/thesis-methodology.md` and
`docs/thesis-defense.md` describe the method as Random Forest only.

## ADR-008: The History register is rebuilt from stored rows, kept apart from live alerts

- **Date:** 2026-11-05
- **Status:** Accepted

**Context.** The History page only knew `InsoleContext.incidentLogs`, appended
in memory as the risk level changed. A reload erased the register even though
the firmware pushes every sample to `readings/history`. `subscribeToHistory`
existed in the transport but had no caller.

**Decision.** Derive the register from `readings/history` in
`src/utils/incidents.ts` and expose it as `storedIncidents`, separate from the
live `incidentLogs`. An incident is a transition into `warning`/`danger`, not
every sample; the device verdict wins over client inference. `HistoryPage`
merges stored and live rows, deduping per timestamp.

**Consequences.** The register survives a refresh. Because `incidentLogs` stays
the only input to `alertOpen` and `unreadIncidentCount`, a backfill cannot
resurface an old alert. The stored read is capped at 200 rows and the RTDB node
still grows unbounded — retention is a separate decision.


## ADR-009: The admin console is a separate shell

- **Date:** 2026-11-05
- **Status:** Accepted

**Context.** Admin used to be one extra link in the patient nav, rendering
inside the patient shell. The console then inherited a bell, a search box, a
patient nav pill, and the early-warning dialog, none of which belong to a tool
whose job is accounts and the fleet.

**Decision.** `/admin/*` gets `AdminLayout` and `RequireAdmin`. The patient
navigation no longer mentions admin, and `buildNavLinks` no longer takes a role.

**Consequences.** The console can grow its own tabs without touching the
patient shell. A shared header widget must now be added twice if both surfaces
genuinely need it, which is the point: the two surfaces serve different jobs.

## ADR-010: Deactivation is enforced, and admin actions are audited

- **Date:** 2026-11-05
- **Status:** Accepted

**Context.** The "deactivate" button wrote a Firestore field that nothing read.
An account marked inactive could sign in, open the dashboard, and read every
device. Meanwhile deletion and role changes left no record at all.

**Decision.** `active` is mirrored to `users/<uid>/active` in RTDB, and the
rules refuse reads when it is `false`. The app shows a deactivated screen before
mounting any route. Every successful admin action appends one entry to
`/audit`; failed audit writes surface as a warning, never as a failed action.

**Consequences.** Deactivation now works even against a signed-in session on
another device. Rules deployment is required for the new denial to take effect.
Audit adds one write per admin action, not per reading.

## ADR-011: Design artifacts live in `design/` as FigCraft, with substitute fonts

- **Date:** 2026-11-06
- **Status:** Accepted

**Context.** UI work needs a visual source that can be reviewed and revised
without touching shipped code, and `DESIGN.md` is prose, not a canvas. The
authoring machine (and FigCraft) does not have `DM Sans` or `Plus Jakarta Sans`
installed, and FigCraft font download is disabled, so the exact brand faces
cannot be drawn.

**Decision.** Keep design artifacts as `.figcraft` files under `design/`, with
the `DESIGN.md` palette stored as named colour variables so layers reference
tokens instead of hex. Draw headings and body in `Inter` and kPa figures in
`Fira Code` as visual stand-ins; the shipped app keeps the real families in
`src/index.css`.

**Consequences.** The design file is a layout and token reference, not a type
proof. Any pixel-exact type comparison needs the real fonts installed first.
`design/` is a durable location; new screens belong there rather than in an
untitled FigCraft document. If the fonts are installed later, re-run the
artboards instead of editing the substitutes.

## ADR-012: The session-level DFN/DM model is not shipped; the contribution stays rule-based

- **Date:** 2026-11-08
- **Status:** Accepted

**Context.** The thesis goal is real-time plantar pressure monitoring to
prevent ulcers. The sample-level Random Forest reproduces its own label rule
(`peak >= 35 kPa`), so its 100% accuracy is circular and carries no
generalisation claim. A session-level model (DFN vs DM from 17 pressure
aggregates, one row per patient, 135 rows) was built to give the thesis a real
ML contribution.

**Decision.** The gate was fixed before training: out-of-fold AUC >= 0.65 on
5-fold stratified CV, **and** at least 0.03 above the best single pressure
feature. The model scored AUC 0.503 (accuracy 60.7% against a 69.6% majority
baseline; best single feature 0.531). The demographic control scored 0.525,
which rules out a broken pipeline. `models/session-model.json` is therefore
**not** exported, and the dashboard and firmware are untouched. Bentuk 1 is
the shipped shape: the alarm stays a clinical rule, and the Random Forest is
documented as an artifact with an explicit limitation.

**Consequences.** The thesis claims a monitoring system, not a learned
diagnosis, and reports the negative result as evidence rather than hiding it.
The scripts stay in the repo so the result is reproducible
(`node scripts/train-session-model.js --sweep`). The full sweep lands the
pressure model between 0.503 and 0.511 across six regularisations, and the best
cell in the whole grid is 0.548 (demographics, depth 2) — no configuration
reaches the floor. Reversing this needs a different input, not a different
hyperparameter: clinical outcome labels (DFN-DS has none, Figshare DFU has no
non-ulcer controls) or a temporal model over raw sensor signals, with its gate
fixed the same way beforehand.
