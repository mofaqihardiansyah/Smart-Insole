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

## ADR-013: Risk thresholds are clinical constants, not settings

- **Date:** 2026-11-10
- **Status:** Accepted

**Context.** The dashboard stored the peak thresholds in localStorage, seeded
them from an admin-editable `/config/global`, and let an admin edit them in
Settings and a dedicated console page. The firmware compiled the same numbers.
`warningKpa` is not a free parameter either: the model's only split is
`sustained > 0`, and `sustained` counts samples at or above the safe limit, so
moving that limit changes what the model measures. The device's local alarm is
authoritative offline, so a dashboard that could move the boundary without
reflashing would disagree with the device beside the patient.

**Decision.** Keep one constant set: `RISK_THRESHOLDS` (35/200 kPa) and
`DURATION_WINDOWS` (20 s) in `randomForestRisk.ts`, identical to the firmware.
Settings shows the values read-only; the editor, the local override, the
`config/global` node and subscription, the admin config page, and their i18n
strings and tests are removed. Rules no longer carry a `config` block.

**Consequences.** Changing a threshold is now a clinical decision with a
release: edit both code paths, re-export the model if the label boundary moves,
reflash the device. There is no runtime knob to drift, and no browser that can
enforce 70 kPa while the device enforces 200. The tradeoff is that per-patient
tuning is not possible from the UI; it was not possible safely before, because
it never reached the alarm.

## ADR-014: Account deletion is self-service; the admin console has no delete

- **Date:** 2026-11-10
- **Status:** Accepted

**Context.** The admin console had a "Hapus" action that deleted only the
Firestore document, leaving the Firebase Auth user able to sign in while
vanishing from the user list. On the Spark plan there is no server and no
Admin SDK in the browser, so the only Auth account an app can delete is the
signed-in one (`deleteUser`, which requires a recent login). Faking wider
erasure was the mismatch.

**Decision.** Delete the console button and keep "Nonaktifkan". Implement real
erasure in Profile for the signed-in owner: re-authenticate, remove the RTDB
mirror (`users/<uid>`, including device pairings), remove the Firestore profile,
then `deleteUser`. If the last step fails, recreate the profile. Firestore and
RTDB rules allow a delete only by an admin or the owner; RTDB allows the owner
to delete only their own node. Admin accounts cannot self-delete.

**Consequences.** "Hapus akun" now means the account is gone: it cannot sign in
again, and no pairing is left under a dead uid. The order is load-bearing — a
mirror removed after a failed Auth delete is recoverable, a pairing left behind
is not. Operating an Admin SDK script to delete other users remains future
work, not a quiet half-feature.

## ADR-015: The profile name is written to Firestore before Firebase Auth

- **Date:** 2026-11-10
- **Status:** Accepted

**Context.** "Simpan profil" only raised a success banner; the name was never
persisted, so a reload discarded it. Two copies of the name exist: the Firestore
document (`users/<uid>.displayName`, which the admin console reads) and the
Firebase Auth profile (`displayName`, which the header shows). The auth listener
resolves the name as `profile.displayName || currentUser.displayName`.

**Decision.** Write the document first (`createUserDoc` merges, so role and
`active` are untouched and the existing owner-update rule already permits a name
change), then `updateProfile`, then local state. A document write failure returns
an error and the page keeps it on screen; an Auth failure is logged but does not
discard a durable write that succeeded.

**Consequences.** The source of truth is the document, and the UI can never show
a name the document does not have. Reversing the order would let a failed
document write leave the header claiming a name the console cannot see. If the
Auth write fails, other devices keep the old Auth name until the next document
read, which the listener already prefers.

## ADR-016: Landing motion is a CSS budget, not a motion library

- **Date:** 2026-11-10
- **Status:** Accepted

**Context.** The landing page wanted more motion than `MOTION 1` allows on the
app pages: staggered section openings, cards settling into place, a chip
cross-fade, a score count-up. `framer-motion` was still a dependency but imported
nowhere, and `shell.test.tsx` fails any import of it — the app shell has no
entrance animation by design, and the gate exists to keep it that way.

**Decision.** Keep the landing's motion in CSS: transitions on `[data-reveal]`,
one IntersectionObserver that adds a class, two keyframes (`chip-in`,
`sheet-in`), and two JavaScript moves that must read values rather than
interpolate with CSS — the score count-up and the drifting tiles. The engine
choice follows the gate rather than fighting it: adding `framer-motion` back
would mean relaxing a test that protects the app pages, and every move in the
new budget is a transition or a simple keyframe. The full budget, with timings,
now lives in `DESIGN.md` next to the colour and radius rules.

**Consequences.** The whole budget is disabled by the existing
`prefers-reduced-motion` block, plus the two JavaScript moves read the same query
before starting, so the preference is honoured in one place instead of per
effect. Motion cannot express anything CSS cannot (no spring physics, no
orchestration beyond transition delays), which is the trade accepted here. The
dependency itself is left in `package.json` until removing it is decided
separately; no shipped source imports it.

## ADR-017: Citation style is APA 7, verified against Crossref

- **Date:** 2026-11-11
- **Status:** Accepted

**Context.** The thesis needs a bibliography before the defense. Citations were
collected in Mendeley Desktop 1.19 (legacy) under the "TA" group, whose local
database is encrypted, so the only machine-readable path is an export. That
export carried publisher errors: one entry named the wrong journal, three had
missing or malformed DOIs, one had a broken URI field, and one article number
disagreed with both the publisher record and the project's own note. Meanwhile
`docs/HARDWARE-SPEC.md` already lists its references in APA.

**Decision.** Bibliographies live in `docs/daftar-pustaka.md` in APA 7, the
style the repository already uses. Every entry that has a DOI is checked against
the Crossref record, and the publisher record wins over the export. The export
itself (`docs/refs/ta.ris`) is committed so the path from Mendeley to the list
stays reproducible. A slot with no verifiable source stays marked
`[sitasi: …]` rather than being filled with a plausible-looking reference.

**Consequences.** Switching to another style (IEEE, Vancouver) is mechanical
from the same entries, so a campus requirement changes one file, not the
evidence. Every future export must be re-verified: the audit table in
`daftar-pustaka.md` records which field was corrected and why, so the same error
is not silently re-imported. A new citation now has to be added in both Mendeley
and the list, or the two drift apart.

## ADR-018: Hardware geometry lives in `docs/3d/`, 2D in CADCraft and 3D in OpenSCAD

- **Date:** 2026-11-12
- **Status:** Accepted

**Context.** The hardware build guide carries the insole and pouch dimensions in
prose. Checking them (does a 3-core bundle sink into the channel, does the ESP32
fit the 65 × 80 × 20 mm pouch cavity, does the pouch clear the shoe) needed
something a reader can measure. Two tools were available: CADCraft 0.20.0, a 2D
drafter with an AutoCAD-style command line and a CLI that writes DXF/SVG/PDF/PNG,
and OpenSCAD, which does real solids and STL. CADCraft 0.20.0 has no 3D mode.

**Decision.** `docs/3d/` is the single home for hardware geometry, and
`docs/3d/params.md` is the single source of the numbers. CADCraft owns the 2D
working drawings (`build-cad.py` drives the CLI and writes `cadcraft/out/`).
OpenSCAD owns the solids, the renders, and the STLs. Both read the same numbers:
`build-cad.py` also emits `gen/insole-data.scad`, so the 3D outline and channel
paths cannot drift from the 2D drawing. `build-3d.sh` rebuilds everything in one
command.

**Consequences.** Changing a dimension is a `params.md` edit plus one script run,
not a re-trace. The 2D drawings and the 3D model agree by construction because
they share generated geometry. The STLs are shape checks only: real insole is
flexible EVA and real pouch is neoprene, so nothing here is a print-ready part.
A CADCraft or OpenSCAD upgrade can alter the generated files, so they are
rebuilt, never hand-edited. The channel is 3,5 × 1,5 mm instead of the guide's
3 × 1–2 mm, because a 6-core AWG 30 bundle is Ø ± 3,2 mm; total depth stays
3,0 mm with the 1,5 mm relief under the cover. That deviation is stated in the
guide's 3D appendix so the model and the prose do not disagree.
