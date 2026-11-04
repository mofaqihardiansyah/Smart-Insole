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
