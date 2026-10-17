# Project Research Summary

**Project:** Smart Insole IoT Dashboard (web-dashboard UI/UX audit, fix, rebuild)
**Domain:** Clinical plantar-pressure console for elderly diabetic patients + caregivers
**Researched:** Sat Oct 17 2026
**Confidence:** HIGH (overall)

## Executive Summary

This is a clinical plantar-pressure dashboard web UI/UX rebuild — a React 18 + Vite 5 + Tailwind CSS 3 single-page application backed by Firebase Realtime Database, serving elderly diabetic patients and caregivers who monitor foot-pressure risk. Experts build it as a measured design system: DESIGN.md is the single normative source (measured contrast tokens, light-only theme, two never-mixed visual registers, MOTION 1 motion budget, 44×44px touch targets, colour-never-alone risk contract). oil-ui is evaluated as an external AI design *skill* for direction exploration only — it is NOT an npm component library and adds zero dependencies. The recommended approach is token-first (audit DESIGN.md tokens → lock into index.css/tailwind.config.js → fix defects → rebuild Glass* primitives → shell → pages → Delivery Gate), with oil-ui running in a parallel scratch sandbox so it cannot regress production.

Key risks: shipping a "looks approximately right" rebuild that fails the measured DESIGN.md contract (contrast, touch targets, colour-alone risk); mixing the clinical app register with the warm landing register; breaking the realtime Firebase data contract (aria-live off on live numbers, ring-buffer deltas, autoConnect guard) during visual rebuilds; silent Tailwind class regressions where unknown classes generate no CSS and no error; and adopting oil-ui without a token-mapping/governance contract creating a second competing design system. Mitigations are the designTokens.test.js build gate, the three-breakpoint click-through Delivery Gate, and a recorded oil-ui go/no-go decision before any adoption.

## Key Findings

### Recommended Stack

The existing stack is current and adequate; oil-ui requires zero stack additions. Only minor version bumps are recommended.

**Core technologies:**
- **React 18.3.1** — UI framework/runtime; latest stable 18.x, no React 19 migration needed for this milestone.
- **Vite 5.4.10 → ^5.4.21** — Build tool/dev server; one patch behind latest, bump at rebuild start; fast HMR suits iterative UI rebuild.
- **Tailwind CSS 3.4.14 → ^3.4.19** — Utility-first CSS / design-token carrier; stay on v3 (PostCSS-based, already configured); do NOT migrate to Tailwind v4.
- **PostCSS 8.4.47 + autoprefixer 10.4.20** — Required by existing Tailwind v3 setup; keep.
- **Firebase 10.14.1** — Backend/realtime telemetry and device data; keep.
- **Vitest 2.1.3 + @testing-library (react/jest-dom/user-event) + jsdom** — Test runner stack; `npm test` must pass zero errors.
- **lucide-react 1.55.0, framer-motion 14.1.0, react-router-dom 7.18.4, swiper 14.3.0** — Already installed; keep.

**oil-ui:** AI agent design skill (`npx skills add oil-oil/oil-ui`), installed outside the project — no package.json entry, no runtime bundle impact, no React components to import.

**Do not add:** daisyUI v5 (requires Tailwind v4), @tailwindcss/vite/Tailwind v4, shadcn/ui, MUI/Chakra/Ant Design, dark mode toggle, oil-ui as npm dependency. daisyUI v4.12.24 is optional and deferred — only add if oil-ui evaluation surfaces a justified component-layer gap.

### Expected Features

**Must have (table stakes):**
- Uniform token application across all 10 pages mapping 1:1 to DESIGN.md tokens
- Risk communicated by icon **and** text label **and** colour (never colour alone)
- 44×44px touch targets on every interactive element
- Keyboard operability with visible focus ring (3:1 or better)
- Loading, empty, and error states on every data view
- Light-only theme, no dark mode toggle
- Real measured data only — no fabricated telemetry (Simulation label required if not measured)
- Responsive breakpoints <640 / 640–1023 / >=1024px
- Nav rail (desktop) + drawer (mobile); notifications on bell, not in rail
- Skip-to-content link + ARIA labels; live numbers `aria-live="off"`
- Two actions only: Export CSV + Mark as read (no dead controls)
- Consistent Glass* component naming retained

**Should have (differentiators):**
- Measured contrast values baked into every token; `designTokens.test.js` fails build on missing rules
- oil-ui AI design-skill evaluation (direction exploration, comparison page) — go/no-go recorded in PROJECT.md
- Random Forest risk classifier with clinical contract assertions (must not regress)
- Pressure heatmap as unambiguous focal point with semantic (CVD-safe Okabe-Ito) colour
- `tabular-nums` on all kPa figures so live updates don't twitch layout
- Real heatmap component running on landing page (no skeleton/placeholder)
- No em dashes in shipped copy; middot/pipe separators
- Combobox search jumping to pages AND records

**Defer (v2+):**
- oil-ui Pro adoption ($9.99); open-source skill sufficient for MVP
- Any new features (additional pages, new charts, user preferences, theme switcher)
- Dark mode (explicitly out of scope)
- Additional differentiators beyond measured tokens + real heatmap on landing

### Architecture Approach

The stack already functions as a design system with a one-way flow: tokens → Tailwind utilities → component primitives → page composition → shell/providers. oil-ui sits *outside* this flow as an external design-decision input; its outputs are captured in DESIGN.md before reaching a component.

**Major components:**
1. **Token layer (src/index.css, tailwind.config.js)** — Measured design tokens as CSS variables (`:root` + `.landing-scope`), mapped to Tailwind utilities via `token()` helper; light-only, no `.dark` block. Single source of truth.
2. **Component primitives (src/components/ui/)** — GlassCard, GlassButton, GlassInput, GlassTable, GlassForm, StatusChip, Chip, TrendChart, LoadDonut, PlantarHeatmap, RowMenu; re-exported through GlassComponents.jsx barrel; named imports, never renamed.
3. **Data viz (TrendChart / LoadDonut / PlantarHeatmap)** — Single SERIES source (Okabe-Ito, CVD-safe, quarantined to charts); `tabular-nums` on kPa figures.
4. **Shell (AppLayout, AppSidebar, AppTopbar, AppSearch)** — 288px rail, 72px top bar, combobox search, bell (notifications state, not a route).
5. **Pages (src/pages/)** — Thin composers of primitives + context: Dashboard, Monitoring, History, Device, Settings, Profile, Notifications, Login, Register, Landing.
6. **Context layer (UserContext, InsoleContext)** — Single auth listener + single telemetry provider; Firebase `autoConnect={Boolean(user)}` guard; unchanged by design-system work.

**Key patterns:** Token Layer → Tailwind → Component (always); Wrapper/Adapter barrel + className escape hatch (variant → className → new variant → wrapper as last resort); Design Decision Capture (oil-ui → DESIGN.md → tokens → components, manual transcription step).

### Critical Pitfalls

1. **Subjective audit vs DESIGN.md contract** — Auditing "look and feel" instead of measuring contrast, touch targets, and colour-alone rule. Every finding must cite a specific DESIGN.md clause with measured evidence. *Avoid:* audit as contract-clause checklist with measurements, not aesthetic opinions. (Phase 1)
2. **Risk by colour alone** — Risk shown as hue only (no icon/text). Elderly colour-vision-deficit and screen-reader users miss deterioration. *Avoid:* every risk element carries icon + text label + colour; darkened ink tokens only, bright accents never shipped. (Phases 1–3)
3. **Mixing the two visual registers** — Clinical app (pale slate, 8px control scale) vs warm landing (warm grey, larger radii, pill nav) must never be mixed inside one surface. Already caused a real incident (deleted `warm.*` tokens silently broke LandingPage). *Avoid:* `.landing-scope` scopes landing tokens; one shadow name = one value; designTokens.test.js stays green. (Phases 1, 3)
4. **Dead controls and fabricated telemetry** — Export PDF/New Session buttons, invented patient rows, decorative tints, random numbers dressed as live. *Avoid:* adopt layout, reject content; every control maps to a real action; every number measured or labeled Simulation; no skeleton placeholders as screenshots. (Phases 2–3)
5. **oil-ui evaluation without an adoption contract** — Screenshots but no token-mapping table, migration list, or go/no-go; risks shelfware and a second competing design system. *Avoid:* go/no-go with token parity to DESIGN.md, bundle impact, theming story, and concrete migration list. (Phase 1–6)
6. **Breaking the realtime data contract during rebuilds** — Dropping `aria-live="off"` on live numbers, breaking ring-buffer delta chips, losing connection-state handling, starting Firebase for anonymous visitors. *Avoid:* audit data flow as part of every component rebuild; keep `aria-live="off"` + one polite region for risk changes only. (Phase 3)
7. **Silent Tailwind utility-class regressions** — Renaming/deleting a token; components keep old classes; unknown classes generate no CSS and no error (already happened to landing page). *Avoid:* `designTokens.test.js` as hard build gate on every config change. (All phases)
8. **Shipping without three-breakpoint click-through** — Verifying only at 1280px; mobile (360px) and tablet (768px) unusable for elderly users. *Avoid:* click-through at 360/768/1280 for every rebuilt page; mobile drawer as real dialog; tables as stacked rows below `md`. (Phases 2–5)

## Implications for Roadmap

Based on combined research, the phase structure respects the Build Order from ARCHITECTURE.md (tokens first, primitives, shell, pages, gate) and the Feature Dependencies chain from FEATURES.md (token audit → defect fixes → rebuilds → Delivery Gate). oil-ui evaluation runs in parallel scratch space and does not block production, but its go/no-go decision must be recorded before rebuilds commit to a design direction.

### Phase 1: Design-system audit & token lock (+ oil-ui evaluation sandbox, parallel)
**Rationale:** Token mapping precedes all component work; components reference tokens and cannot match DESIGN.md until tokens are inventoried and mapped. oil-ui evaluation is independent and de-risked as scratch-only. This phase also establishes the designTokens.test.js build gate that prevents silent regressions in all later phases.
**Delivers:** Inventory of every colour/radius/shadow/type value in `src/` mapped to DESIGN.md tokens; hard-coded values flagged; `designTokens.test.js` green; `npm run build` clean; light-only confirmed (no `.dark` block). oil-ui comparison pages + screenshots in `src/__oil_ui_eval__/` (scratch, not shipped); go/no-go decision criteria drafted.
**Addresses:** Uniform token application (table stake); measured contrast values + build gate (differentiator); responsive breakpoints (table stake).
**Avoids:** Subjective audit without contract citations (Pitfall 1); silent Tailwind regressions (Pitfall 7); mixing registers (Pitfall 3).
**Research flag:** Needs deeper research — oil-ui go/no-go adoption contract (token-mapping table, migration list, bundle impact). Not skippable; this is the decision point.

### Phase 2: Defect fixes
**Rationale:** Fix precedes rebuild — the rebuild target is the fixed, spec-conformant component, not the defective one. Defects must be corrected before primitives are rebuilt so rebuilds start from a clean baseline.
**Delivers:** Contrast failures fixed; missing focus rings added; touch targets brought to 44×44px; colour-only risk replaced with icon+text+colour; dead controls removed/rewired; decorative pastel tints removed; fabricated telemetry replaced with real measured output or Simulation labels; empty/error states given actionable copy.
**Addresses:** Risk communicated by icon+text+colour; 44×44px touch targets; loading/empty/error states; real measured data only; no dead controls; Export CSV + Mark as read only; no em dashes.
**Avoids:** Risk by colour alone (Pitfall 2); dead controls/fabricated telemetry (Pitfall 4).
**Research flag:** Standard patterns (well-documented accessibility contract); skip research-phase.

### Phase 3: Primitive rebuilds + realtime data-contract review
**Rationale:** All pages depend on these primitives; rebuilding them to DESIGN.md spec is the core UI/UX defect fix. Must include data-contract review so rebuilds don't break the live Firebase contract.
**Delivers:** GlassCard, GlassButton, GlassInput, GlassTable, GlassForm, StatusChip, Chip rebuilt against DESIGN.md; new Alert/Banner primitive (unified loading/empty/error/danger banner with named cause + next action); TrendChart/LoadDonut/PlantarHeatmap aligned to single SERIES source; `aria-live="off"` preserved on live numbers; one polite region for risk-level changes only; ring-buffer delta computation intact; `autoConnect={Boolean(user)}` guard intact.
**Addresses:** Glass* naming retained; pressure heatmap focal point; tabular-nums on kPa; CVD-safe series colours; realtime data contract.
**Avoids:** Breaking realtime data contract (Pitfall 6); colour-only risk (Pitfall 2); silent Tailwind regressions (Pitfall 7).
**Research flag:** Standard patterns; skip research-phase.

### Phase 4: Shell rebuild
**Rationale:** Shell (rail, top bar, search, drawer) is shared by every page and defines navigation structure; rebuilds after primitives so shell consumes the fixed primitives.
**Delivers:** AppLayout, AppSidebar, AppTopbar, AppSearch rebuilt (288px rail, 72px top bar, combobox search, bell unread dot); mobile drawer as real dialog (focus in, Escape closes, body scroll locked, focus returns); route structure in App.jsx unchanged; register separation enforced (clinical register on app pages).
**Addresses:** Nav rail + drawer; notifications on bell; skip-to-content + ARIA; keyboard operability; register purity.
**Avoids:** Mixing registers (Pitfall 3); bottom nav bar on mobile (anti-feature).
**Research flag:** Standard patterns; skip research-phase.

### Phase 5: Page-by-page rebuild
**Rationale:** Pages are thin composers of primitives + shell; rebuild last so they consume fixed primitives and shell. Landing keeps `.landing-scope` warm dialect; app pages keep clinical register — never mixed.
**Delivers:** Dashboard, Monitoring, History, Device, Settings, Profile, Notifications, Login, Register, Landing rebuilt; Landing shows real PlantarHeatmap (no skeleton/placeholder); each data view has loading/empty/error states; heatmap as unambiguous focal point; combobox search jumps to pages AND records.
**Addresses:** Two visual registers never mixed; real heatmap on landing; Export CSV + Mark as read; responsive breakpoints at page level.
**Avoids:** Register mixing (Pitfall 3); skeleton placeholders as screenshots (anti-feature).
**Research flag:** Standard patterns; skip research-phase.

### Phase 6: Delivery Gate & oil-ui go/no-go decision
**Rationale:** Final verification before handoff; oil-ui decision recorded so it is not re-litigated. If oil-ui is adopted, components must be wrapped/configured to emit DESIGN.md tokens, not defaults.
**Delivers:** `npm test` zero errors (Vitest); `npm run build` zero errors; click-through verified at 360px/768px/1280px; accessibility verified (44px targets, keyboard, colour-alone rule, reduced-motion); `src/__oil_ui_eval__/` artifacts deleted or gitignored; oil-ui go/no-go with token-mapping table recorded in PROJECT.md Key Decisions.
**Addresses:** Delivery Gate (test + build + click-through); oil-ui evaluation decision; measured contrast build gate.
**Avoids:** oil-ui adopted without contract (Pitfall 5); shipping without three-breakpoint verification (Pitfall 8).
**Research flag:** Needs deeper research only if oil-ui go/no-go is "adopt" — then migration path and token wrapping need research; otherwise skippable.

### Phase Ordering Rationale
- **Dependencies:** Tokens must be locked before primitives (components consume utilities); primitives fixed before shell; shell fixed before pages; pages fixed before Delivery Gate. Defect fixes sit between audit and rebuilds (fix precedes rebuild).
- **Architecture groupings:** The layered flow (token → utility → primitive → shell → page) dictates the phase sequence; each phase consumes the previous layer's output.
- **Pitfall avoidance:** The designTokens.test.js gate (Phase 1, enforced all phases) prevents silent Tailwind regressions; register separation is enforced at Phase 3–5 boundaries; realtime data contract is audited at Phase 3; the three-breakpoint click-through is the Phase 6 gate but verified incrementally in Phases 2–5.

### Research Flags
- **Needs deeper research:** Phase 1 (oil-ui adoption contract — token-mapping table, migration list, bundle impact); Phase 6 (only if oil-ui go/no-go is "adopt" — migration/wrapping research).
- **Standard patterns (skip research-phase):** Phases 2, 3, 4, 5 (well-documented Tailwind v3 + React 18 component patterns, accessibility contract, Firebase realtime pattern already in codebase).

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified against package.json + npm latest checks + official docs (oil-ui README, daisyUI v4/v5, Tailwind v4). |
| Features | HIGH | Grounded in PROJECT.md + DESIGN.md + AGENTS.md; industry sources on elderly diabetes UX and clinical UX agree. |
| Architecture | MEDIUM | Project sources (DESIGN.md, tailwind.config.js, index.css) HIGH; oil-ui finding MEDIUM per ARCHITECTURE.md (single primary source). |
| Pitfalls | HIGH | Grounded in DESIGN.md documented real incidents (warm.* token deletion, shadow conflation) + PROJECT.md + AGENTS.md + industry design-system adoption research. |

**Overall confidence:** HIGH

### Gaps to Address
- **Exact DESIGN.md token values** not captured in research files — need to read DESIGN.md during planning to capture measured contrast ratios, type scale, breakpoints, radius/elevation values for token lock (Phase 1).
- **oil-ui go/no-go outcome pending** — adoption decision depends on evaluation output; migration path research needed only if "adopt."
- **daisyUI v4 component-layer justification** deferred — only revisit if oil-ui evaluation surfaces a gap custom Tailwind components cannot fill.
- **Random Forest risk classifier test coverage** — rebuild must not regress `randomForestRisk.test.js`; verify coverage during Phase 3 planning.

## Sources

### Primary (HIGH confidence)
- DESIGN.md (project repo root) — measured design tokens, two visual registers, accessibility contract, antislop constraints, documented real incidents.
- PROJECT.md — project context, milestone v1.0, constraints (light-only theme, verification gate at 3 breakpoints).
- AGENTS.md — antislop filter; Delivery Gate (npm test, npm run build, click-through at 360/768/1280).
- web-dashboard/src/designTokens.test.js — regression test; silent Tailwind class regression incident.
- web-dashboard/src/App.jsx — navigation structure, AlertModal app-wide dialog, autoConnect Firebase guard.
- package.json — React 18.3.1, Vite 5.4.10, Tailwind 3.4.14, dependency baseline.

### Secondary (MEDIUM confidence)
- oil-ui official README (https://github.com/oil-oil/oil-ui) — AI interface design skill, `npx skills add`, not an npm component library.
- daisyUI v4/v5 docs — daisyUI v4 compatible with Tailwind v3; v5 requires Tailwind v4.
- Tailwind CSS docs — theme.extend pattern, @apply, utility generation.

### Tertiary (LOW confidence, needs validation)
- Industry design-system adoption sources (Netguru, Rangle.io, Adobe Design, The Skins Factory) — creation vs adoption failure modes; used for pitfall framing only.
- Elderly diabetes UX research (PMC, Frontiers, Regenstrief) — large touch targets, high contrast, colour-vision considerations; directional only.

---
*Research completed: Sat Oct 17 2026*
*Ready for roadmap: yes*
