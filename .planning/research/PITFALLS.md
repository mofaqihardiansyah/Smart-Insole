# Pitfalls Research

**Domain:** Clinical plantar-pressure console UI/UX audit, fix, rebuild, and design system (oil-ui) evaluation in an existing React 18 + Vite 5 + Tailwind 3 web dashboard for elderly diabetic patients and caregivers.

**Researched:** Sat Oct 17 2026

**Confidence:** HIGH — grounded in DESIGN.md (which documents real incidents that already occurred in this project), PROJECT.md, AGENTS.md antislop constraints, and industry research on design system adoption and clinical UX.

---

## Critical Pitfalls

### Pitfall 1: Auditing "look and feel" instead of auditing against the DESIGN.md contract

**What goes wrong:**
The reviewer treats the audit as a subjective visual pass — "does it look clinical?" — and files defects like "buttons feel off" or "make it calmer." DESIGN.md is not a mood board; it carries measured contrast ratios (e.g. `fg` 18.1:1 on white AAA, `muted` 4.8:1 AA), a fixed type scale, a 44x44px touch-target contract, an explicit motion budget (MOTION 1), and a hard rule that colour is a vital sign — nothing decorative is saturated. An audit that never measures contrast, never checks touch-target sizes, and never verifies the risk-by-colour-alone rule will ship components that look approximately right but fail the actual contract. Elderly diabetic users and caregivers depend on risk states being unambiguous; an approximate pass is a patient-safety issue, not a cosmetic one.

**Why it happens:**
Visual judgement is faster than measurement, and DESIGN.md's measured values require opening a contrast checker and a ruler. Reviewers drift toward subjective language because DESIGN.md enforcement is not yet automated in CI.

**How to avoid:**
Every audit finding must cite the specific DESIGN.md token or contract clause it violates (contrast pair, token name, breakpoint, motion rule, antislop constraint). The audit output is a checklist of contract clauses with measured evidence, not a list of aesthetic opinions. Contrast values are measured, never eyeballed.

**Warning signs:**
- Audit tickets worded as preferences ("feels", "looks", "prettier")
- No contrast ratio or pixel measurement attached to any finding
- Reviewer cannot point to the DESIGN.md section each defect maps to

**Phase to address:** Phase 1 — UI/UX audit against DESIGN.md

---

### Pitfall 2: Conveying risk by colour alone

**What goes wrong:**
A stat card, status chip, or heatmap node goes amber/red and the only signal that something is wrong is the hue. DESIGN.md explicitly forbids this: "icon **and** text label **and** colour, always." Elderly users with colour-vision deficiency cannot distinguish the risk semantics, and a screen-reader user hears nothing different. In a clinical console this directly causes missed deterioration.

**Why it happens:**
Designers and developers reach for colour as the fastest signal. The reference design's decorative pastel icon tiles (indigo, blue, grey, mint) encourage the habit of using hue for decoration, which then bleeds into risk semantics.

**How to avoid:**
Every risk-bearing element carries three redundant signals: an icon, a text label (e.g. "Waspada"/"Warning", "Bahaya"/"Danger"), and the colour. The bright risk accents (`#22C55E`, `#EAB308`, `#EF4444`) fail AA as text and are not shipped at all; the darkened ink tokens (`safe-ink`, `warning-ink`, `danger-ink`) are used on tinted backgrounds. Audit must verify each risk-bearing component has all three signals, not just the colour.

**Warning signs:**
- Any status chip that is just a coloured pill with no text
- Risk shown only as a colour change on a number or dot
- Heatmap legend that uses hue without a text scale

**Phase to address:** Phase 1 — audit; Phase 2 — fixes; Phase 3 — rebuilds

---

### Pitfall 3: Mixing the two visual registers (clinical app vs warm landing)

**What goes wrong:**
This app has two registers that are never mixed inside one surface: the Verdana Health clinical console (pale slate canvas, white cards, 288px rail, 72px top bar) and the warm marketing landing (warm grey canvas, larger radii, deeper shadows). A real incident already occurred here: a previous layout pass deleted the `warm.*` colour group, `rounded-panel`, `shadow-card`, `shadow-lift`, etc. from `tailwind.config.js` while `LandingPage.jsx` kept referencing them. Unknown Tailwind classes are not errors — they silently produce no rule — so the landing page lost its colours, radii and elevation with zero test failures. The same failure mode happens in reverse: landing shadows (`shadow-card` 14px 30px warm 25%) get applied to app cards, or app card lift (`shadow-panel`) gets applied to landing panels, destroying each surface's hierarchy.

**Why it happens:**
Shared components (`GlassCard`, `GlassButton`, `StatusChip`) are restyled per surface instead of keeping one measured light form under `.landing-scope`. Component names are historical identifiers, not descriptions of surface treatment, so developers assume a name implies one styling everywhere.

**How to avoid:**
- Never mix registers inside one surface. App pages keep the clinical console; landing keeps the warm dialect.
- Shared components render their measured light form everywhere; `.landing-scope` in `src/index.css` re-declares light semantic tokens on the warm surface.
- The `designTokens.test.js` regression test must remain green: it fails the build if any Tailwind class used in `src/` has no generated rule. Treat it as a hard gate, not optional.
- One shadow name = one value. `shadow-panel` (app) and `shadow-card` (landing) are deliberately different names.

**Warning signs:**
- A `rounded-full` pill appearing inside the app register (pills are landing-only; app keeps 8px control scale)
- App cards floating with landing shadows (`shadow-card`/`shadow-lift`)
- Landing panels flat with no elevation (`warm.*` tokens missing from generated CSS)

**Phase to address:** Phase 1 — audit includes register-purity check; Phase 3 — rebuilds enforce register separation

---

### Pitfall 4: Keeping dead controls and fabricated telemetry from the reference design

**What goes wrong:**
The reference design ships "Export PDF", "New Session", invented patient rows, a revenue figure, "Clinic status: Optimal", and four decorative stat-card tints. None of these exist in this product: the real actions are "export the session buffer to CSV" and "mark the alert queue as read." Antislop forbids dead controls ("a button that cannot act is a defect, not decoration"), fabricated telemetry ("no random numbers dressed as live data"), and invented statistics/testimonials. If the rebuild keeps the reference's decorative layout but swaps in real data only in some places, the dashboard becomes a Potemkin console — controls that do nothing, numbers that don't measure anything.

**Why it happens:**
Rebuilding to match the reference's layout is easier than redesigning for the product's actual data model. The layout is adopted; the content is not. Developers copy the reference wholesale because it looks finished.

**How to avoid:**
Adopt the layout, reject the content. Every control must map to a real action (CSV export, mark-as-read, device settings, language toggle, sign out). Every number must be measured output or carry an explicit "Simulation" label. No skeleton or placeholder blocks as product screenshots — the landing shows the real `PlantarHeatmap` component running. Em dashes are banned from shipped copy in both languages; use a middot or pipe.

**Warning signs:**
- A button whose `onClick` is empty or navigates to a route that does not exist
- Numbers that change every second with no Firebase source
- "Lorem ipsum", "Clinic status", or patient names that are not real measured output
- Skeleton screens used anywhere in the app

**Phase to address:** Phase 2 — defect fixes remove dead controls; Phase 3 — rebuilds adopt layout not content

---

### Pitfall 5: Evaluating oil-ui without an adoption contract (design system shelfware)

**What goes wrong:**
oil-ui is raised as a candidate design system. The evaluation installs the package, renders a few components side by side with the existing `Glass*` components, declares "it looks fine," and stops. No migration path, no governance, no consumer contract, no token mapping to DESIGN.md's measured values. Six months later oil-ui sits unused while local one-off components proliferate — the design system is built but not adopted, which industry research identifies as the most common design-system failure mode (creation is easy; adoption is hard). Worse, adopting oil-ui wholesale would conflict with DESIGN.md's single-source tokens (series colours quarantined to the chart, ink tokens for tinted backgrounds, no dark mode), creating a second, competing design system.

**Why it happens:**
Evaluating a third-party library feels like concrete progress; defining token mappings, writing a migration plan, and deciding governance feels like bureaucracy. The product is a one-developer thesis instrument, so "adoption" is assumed to be automatic.

**How to avoid:**
The evaluation must produce a go/no-go decision with written criteria: token parity with DESIGN.md (contrast values, ink pairs, series colours), Tailwind v3 + React 18 + Vite 5 compatibility, bundle impact, theming story (light-only, no dark mode toggle), and a concrete migration list (which existing components oil-ui would replace, which it would not). If adopted, there is exactly one source of tokens — DESIGN.md — and oil-ui components are wrapped or configured to emit those tokens, not their own defaults. If not adopted, the decision is recorded so it is not re-litigated every phase.

**Warning signs:**
- Evaluation report contains screenshots but no token-mapping table
- "Adopt oil-ui" decided without listing which existing components it replaces
- oil-ui components imported directly alongside `Glass*` components with no wrapper
- No go/no-go date or decision owner

**Phase to address:** Phase 4 — oil-ui design system evaluation

---

### Pitfall 6: Rebuilding components while breaking the realtime data contract

**What goes wrong:**
The dashboard is a clinical console fed by Firebase Realtime Database (`autoConnect` only when signed in; anonymous visitors never open a connection). Numbers update every second. Rebuilds that "clean up" the components often drop the `aria-live="off"` behaviour on live pressure numbers, begin announcing every value change through screen readers (making the page unusable), break the ring-buffer delta chips (computed from the real ring buffer with a 3% dead band), or lose the connection-state handling (loading while auth resolves, offline when Firebase is unreachable). The app becomes pretty but unreliable — dangerous for a risk-monitoring console.

**Why it happens:**
Component rebuilds focus on styling and treat data flow as "already working somewhere." The realtime contract (Firebase listener, ring buffer, risk classifier, single `aria-live="polite"` region for risk-level changes only) lives in context/hooks that are invisible during a visual pass.

**How to avoid:**
Rebuilds preserve the data contract by construction: keep `InsoleProvider`/`UserProvider` shape, keep `aria-live="off"` on live numbers, keep one polite region for risk-level changes only, keep the ring-buffer delta computation, and keep `autoConnect={Boolean(user)}`. Audit the data flow as part of every component rebuild, not just the styles.

**Warning signs:**
- A rebuilt component no longer receives `risk`, `riskScore`, or `unreadIncidentCount`
- Live numbers announce on every update via screen reader
- Delta chips hardcoded instead of computed from the ring buffer
- Firebase listener started for anonymous visitors

**Phase to address:** Phase 3 — component rebuilds include data-contract review

---

### Pitfall 7: Silent Tailwind utility-class regressions

**What goes wrong:**
A developer renames or deletes a Tailwind token in `tailwind.config.js` (e.g. `warm.*`, landing radius steps, landing shadows). Components keep referencing the old classes. Because unknown Tailwind classes generate no CSS rule and no error, the UI silently degrades — colours vanish, radii flatten, elevation disappears — and nothing in the build or test suite catches it until someone looks. This already happened to the landing page.

**Why it happens:**
Tailwind class names are strings in JSX, not typed references. The generated CSS is not asserted against source usage in most setups.

**How to avoid:**
Keep `designTokens.test.js` green as a hard build gate: it generates the real stylesheet from the real config and asserts every utility-shaped token used in `src/` has a rule. Any Tailwind config change runs this test. Never delete a token that a page still references; deprecate by renaming the component, not the class.

**Warning signs:**
- `tailwind.config.js` edited without running `npm test`
- A page looks "washed out" or flat after a config change
- `designTokens.test.js` commented out to speed up CI

**Phase to address:** Phase 1 — audit verifies test gate; all phases — test stays green

---

### Pitfall 8: Shipping without the three-breakpoint click-through verification

**What goes wrong:**
AGENTS.md requires the Delivery Gate: `npm test`, `npm run build` zero errors, and click-through at 360px, 768px, and 1280px. Teams verify only at desktop (1280px) and assume the rest. DESIGN.md's breakpoints are content-driven (`<640`, `640–1023`, `>=1024`), not device-driven: below 640px tables become stacked definition rows, the rail becomes a drawer (focus-managed dialog), and the 56px floating map-control hides below `lg`. A rebuild that passes at 1280px can be unusable at 360px — icon-only navigation, unscrollable tables, touch targets under 44px — exactly where elderly mobile users are.

**Why it happens:**
Development happens on wide screens. Mobile and tablet verification is treated as a final polish step rather than a design constraint.

**How to avoid:**
Every rebuilt page is click-through verified at all three breakpoints before the phase is complete. The mobile drawer is a real dialog (focus in, Escape closes, body scroll locked, focus returns to trigger). Tables render only from `md` up; below that, stacked definition rows. Touch targets ≥44x44px on touch, 34–40px from `lg` up.

**Warning signs:**
- Verification performed at one screen size only
- No record of which breakpoint each page was checked at
- Touch targets measured below 44px on mobile views

**Phase to address:** Phases 2 and 3 — fixes and rebuilds verified at 360/768/1280

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Copy reference layout including decorative tints and invented content | Fast rebuild, looks finished immediately | Dead controls, fabricated telemetry, antislop violations; must be torn out later | Never |
| Keep unknown Tailwind classes instead of fixing `tailwind.config.js` | No config churn | Silent visual regressions, `designTokens.test.js` red | Never |
| One auth/data listener per caller instead of shared `UserContext` | Quick local fix | Inconsistent auth state, multiple Firebase connections | Never |
| Rename `Glass*` components to match styling | "Accurate" names | Breaks page imports; DESIGN.md forbids renaming exports | Never |
| Adopt oil-ui defaults without token mapping | Fast component library | Second design system, token conflicts with DESIGN.md | Never |
| Announce every live number via `aria-live` | "Accessible" feeling | Screen-reader unusable (numbers every second) | Never |
| Use `100vh` for full-height sections | Simple CSS | Clipped on mobile viewports; DESIGN.md requires `min-h-[100dvh]` | Never |
| Horizontal-scroll table on phone | Reuses desktop table | Unusable layout; DESIGN.md requires stacked definition rows below `md` | Never |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Firebase Realtime Database | Anonymous visitor opens a live connection; listener left running after sign-out | `autoConnect={Boolean(user)}`; one listener in `InsoleProvider`, not per component |
| `UserContext` / `useAuth` | Each page hooks auth independently; language and user state diverge | One auth listener read by shell and pages via shared context |
| `AlertModal` (app-wide early-warning dialog) | Multiple alert modals per page; dismiss state lost on navigation | Single dialog at app root; alert state persists across route changes |
| i18n (English / Indonesian) | Copy hardcoded in one language; em dashes used; language toggle misses rebuilt components | All copy via `t()`; no em dashes in either language; middot/pipe separators |
| oil-ui (candidate design system) | Import oil-ui components raw alongside `Glass*` components | Wrap/configure oil-ui to emit DESIGN.md tokens; or reject with recorded go/no-go |
| Click-through verification | Verified only at desktop | Verify at 360px, 768px, 1280px; mobile drawer as real dialog |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Decorative motion competing with live data | Scroll reveals, parallax, entrance animations on app pages | MOTION 1: only hover/focus/value transitions; one reduced-motion-aware scroll to map | Any scroll-based animation on app pages |
| Live numbers + screen reader on every update | Page unusable with NVDA/VoiceOver | `aria-live="off"` on live numbers; one polite region for risk-level change only | `aria-live` on any value updating every second |
| Heatmap Canvas re-render on every Firebase tick | Frame drops on low-end elderly devices | Memoize heatmap; draw only on data change | Canvas redraws at 1Hz on constrained devices |
| Large third-party component library (oil-ui) bundle | Bundle size grows; slow load on 3G | Evaluate bundle impact before adoption; tree-shake | oil-ui adopted without bundle check |
| Tables rendering at all breakpoints | Horizontal scroll on phone | Tables only from `md` up; stacked definition rows below | Table used below 640px |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Displaying patient identifiers or readings in page title / URL | Sensitive data leaked via browser history, referrer headers, screenshots | Keep patient data in body only; no PII in URLs or titles |
| Announcing risk state via screen reader without consent context | Health status audible to bystanders | `aria-live="polite"` only on explicit risk-level change, not continuous |
| Export CSV without confirming what leaves the device | Accidental sharing of health data | Export action is explicit and named; no silent background export |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Risk by colour alone | Colour-blind or low-vision users miss deterioration | Icon + text label + colour on every risk-bearing element |
| Empty state reads "No data" | User does not know if device is offline, unpaired, or healthy | Copy names the cause and next action ("Sensor not sending — check device pairing") |
| Em dashes in copy (both languages) | Antislop violation; harder to read for some cognitive profiles | Middot or pipe separates ideas |
| Touch targets under 44x44px on mobile | Elderly users with motor limitations miss taps | ≥44x44px touch targets on touch; 34–40px from `lg` up |
| No visible focus ring at 3:1 or better | Keyboard users cannot tell where they are | Visible focus ring on every interactive element |
| `100vh` full-height sections | Content clipped by mobile browser chrome | `min-h-[100dvh]`; nothing clipped at 200% zoom |
| Icon-only bottom navigation | Elderly users cannot interpret unlabeled icons | Mobile drawer with readable labels; no icon-only rows |

---

## "Looks Done But Isn't" Checklist

- [ ] **Contrast:** Every text/background pair measured against DESIGN.md values, not eyeballed — including ink tokens on tinted backgrounds (`safe-ink` on `bg-safe/15`, etc.)
- [ ] **Risk signal:** Every risk-bearing element has icon **and** text label **and** colour
- [ ] **Touch targets:** All interactive targets ≥44x44px on touch, verified at 360px
- [ ] **Keyboard:** Every interactive element reachable and operable by keyboard with visible focus ring ≥3:1
- [ ] **Data states:** Every data view has loading, empty, and error states; copy names cause and next action
- [ ] **Aria-live:** Live pressure numbers are `aria-live="off"`; only risk-level changes use one polite region
- [ ] **Dead controls:** No button that cannot act; no route to a non-existent page; every export/mark-as-read works
- [ ] **Fabricated telemetry:** No random numbers dressed as live data; every number is measured or explicitly labeled "Simulation"
- [ ] **Screenshots:** No skeleton or placeholder blocks used as product screenshots; landing shows real `PlantarHeatmap`
- [ ] **Em dashes:** None in shipped copy in either language; middot/pipe used instead
- [ ] **Register purity:** No landing shadows/radii on app pages; no app styling on landing
- [ ] **Tailwind gate:** `designTokens.test.js` green — every class in `src/` has a generated rule
- [ ] **Breakpoints:** Click-through verified at 360px, 768px, 1280px; mobile drawer is a real dialog
- [ ] **oil-ui decision:** Recorded go/no-go with token-mapping table and migration list, not just screenshots

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Subjective audit (no contract citations) | HIGH | Re-audit with DESIGN.md clause citations and measurements; rewrite findings as contract violations |
| Risk by colour alone | MEDIUM | Add icon and text label to every risk-bearing component; verify all three signals present |
| Registers mixed | HIGH | Strip landing tokens from app pages (or vice versa); restore `warm.*` tokens; re-run `designTokens.test.js` |
| Dead controls / fabricated telemetry | MEDIUM | Remove or rewire every non-functional button; replace invented numbers with real measured output or Simulation labels |
| oil-ui adopted without contract | HIGH | Uninstall or wrap to DESIGN.md tokens; record go/no-go; purge unused oil-ui imports |
| Realtime contract broken | HIGH | Restore `aria-live="off"`, single polite region, ring-buffer deltas, `autoConnect` guard; re-verify Firebase flow |
| Tailwind silent regression | MEDIUM | Restore deleted tokens or update references; re-run `designTokens.test.js` until green |
| Missing breakpoint verification | MEDIUM | Click-through at 360/768/1280; fix mobile drawer as dialog; convert tables to stacked rows below `md` |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Subjective audit vs DESIGN.md contract | Phase 1 — UI/UX audit | Audit findings cite DESIGN.md clauses with measurements |
| Risk by colour alone | Phase 1 (audit) → Phase 2 (fixes) → Phase 3 (rebuilds) | Every risk element has icon + text + colour |
| Registers mixed | Phase 1 → Phase 3 | `designTokens.test.js` green; no landing tokens on app pages |
| Dead controls / fabricated telemetry | Phase 2 → Phase 3 | Every control has a real action; every number measured or labeled |
| oil-ui adoption without contract | Phase 4 — design system evaluation | Recorded go/no-go with token-mapping table |
| Realtime data contract broken | Phase 3 — component rebuilds | `aria-live="off"`; one polite region; ring-buffer deltas intact |
| Tailwind silent regression | Phase 1 (test gate) → all phases | `designTokens.test.js` passes on every build |
| Missing breakpoint verification | Phase 2 (fixes) → Phase 3 (rebuilds) | Click-through recorded at 360/768/1280 |
| Missing loading/empty/error states | Phase 2 → Phase 3 | Every data view has all three states with actionable copy |

---

## Sources

- DESIGN.md — project design system authority with measured contrast values, accessibility contract, antislop constraints, and documented real incidents (warm.* token deletion, shadow conflation)
- PROJECT.md — project context, current milestone v1.0, constraints (light-only theme, verification gate at 3 breakpoints)
- AGENTS.md — antislop filter requirements; Delivery Gate (npm test, npm run build, click-through at 360/768/1280)
- web-dashboard/src/designTokens.test.js — regression test with real incident behind it (silent Tailwind class regressions)
- web-dashboard/src/App.jsx — navigation structure, `AlertModal` app-wide dialog, `autoConnect` Firebase guard
- Netguru, "Design System Adoption Pitfalls" — creation vs adoption; systems shelved when not adopted
- Rangle.io, "Design Systems Adoption Pitfalls and Recommendations" — local workarounds split the system into competing versions
- Adobe Design, "Designing design systems: Supporting implementation and adoption" — governance and contribution models
- The Skins Factory, "Healthtech UI/UX" — hierarchy as clinical decision; speed as safety feature; accessibility as patient safety
- PMC, "Optimizing mobile app design for older adults: systematic review" — simplified navigation, cognitive load reduction for elderly users
- josephanson.com, "Migrating a Design System to Tailwind Without Breaking Its Consumers" — existing classes treated as API; subtle regressions in combinations

---
*Pitfalls research for: clinical dashboard UI/UX audit, fix, rebuild, and design system evaluation*
*Researched: Sat Oct 17 2026*