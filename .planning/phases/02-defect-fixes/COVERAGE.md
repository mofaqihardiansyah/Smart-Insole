# API Coverage — Phase 02 (defect fixes)

No external API integration: Phase 2 adds no external call, SDK, endpoint or subscription; it edits the project's own tokens, source, CSS layer, test gates and planning docs.

This phase integrates no external API, SDK or service. It edits the project's own design tokens, page and component source, CSS variable layer, test gates, the provider's stored-preference reader, a design document, and two planning documents. The Firebase Realtime Database reads its labels already exist in `src/services/firebaseRealtime.js` and `src/services/firebaseConfig.js` from an earlier phase; Phase 2 neither adds nor changes a call, a verb or a subscription.

## Why no matrix

The coverage checkpoint exists so an API-integrating phase cannot seal with an un-enumerated capability surface. There is no surface to enumerate here:

| Question | Answer for this phase |
|---|---|
| Does any task add a call to an external service? | No. The only network-adjacent code touched is the provider's `readStoredLanguage`, which reads `localStorage`. |
| Does any task add, rename or remove an SDK dependency? | No. `package.json` is not in any plan's `files_modified`. |
| Does any task consume a new endpoint, verb or webhook? | No. |
| Does any task change how existing Firebase data is shaped or subscribed? | No. `subscribeToReadings` / `subscribeToHistory` are read by tests and mirrored in a stub; no production call site changes. |

The word "Firebase" appears in the phase scope only because the FIX-07 work asserts that a readout is labelled with its source. That is a labelling defect fix, not an integration.

## Per-plan confirmation

| Plan | External surface touched |
|---|---|
| `02-01` | none — Tailwind config, `index.css`, `designTokens.test.js`, `token-inventory.md` |
| `02-02` | none — `LandingPage.jsx`, `a11y.test.jsx` |
| `02-03` | none — `DashboardPage.jsx` plus three component test files and one page test file |
| `02-04` | none — `copy.test.js`, `AdminPage.jsx`, `DashboardPage.test.jsx` |
| `02-05` | none — `InsoleContext.jsx`, `InsoleContext.test.jsx`, `DESIGN.md` |
| `02-06` | none — `ErrorBoundary.jsx`, `ErrorBoundary.test.jsx`, `App.errorBoundary.test.jsx`, `App.jsx`, `utils/i18n.js` |

## Other `plan:pre` capability contributions (evaluated, recorded here for the seal record)

- **security** (active, ASVS L1, block on `high`): fires. Every plan carries a `<threat_model>` with a STRIDE register, a severity per threat, a disposition per threat, and `T-02-SC` reserved in each plan. The two `high` threats are `T-02-01` (the token gate) and `T-02-04` (keyboard operability of every interactive element), plus phase-high rows `T-02-07`, `T-02-08`, `T-02-10` and `T-02-15`; all are `mitigate`. No packages are installed by this phase, so the package-legitimacy checkpoint does not fire and no blocking human checkpoint is required.
- **assumption-delta**: does not fire. No plan introduces a second case for a previously singular identity, changes a required field to optional, or turns a derived value into a chosen one. The only narrowing is `readStoredLanguage` accepting fewer stored values, which is a constraint rather than a generalisation.
- **schema-gate**: does not fire. No plan's `files_modified` matches a Payload, Prisma, Drizzle, Supabase or TypeORM schema path; the phase's milestone is a browser dashboard with no local schema. No `[BLOCKING]` schema-push task is injected.

## Probe-disposition summary (spec-less fallback)

`/tmp/opencode/fix-coverage.json` reports 31 items. 30 are authored as `must_haves.truths` strings or flat-scalar `verification: backstop` markers across plans `02-01` through `02-04`. The single unclassifiable row (`FIX-10` / `unclassified`) is surfaced as a flagged, named assumption in `02-06-PLAN.md` rather than dropped. Each plan carries its own per-row disposition table.
