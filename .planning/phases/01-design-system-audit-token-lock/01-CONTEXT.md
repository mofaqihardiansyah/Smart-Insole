# Phase 1: Design-system audit & token lock - Context

**Gathered:** 2026-10-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 inventories every colour/radius/shadow/type value used in `web-dashboard/src/` and maps them 1:1 to DESIGN.md tokens; locks tokens into `src/index.css` (`:root` + `.landing-scope`) and `tailwind.config.js`; confirms light-only theme (no `.dark` block, no `dark:` variants, `color-scheme: light` only); establishes `design-tokens.test.js` as a hard build gate; generates oil-ui design directions in a scratch sandbox (`src/__oil_ui_eval__/`, not shipped). Scope is locked to these TOKEN/THEME/OIL requirements — defect fixes (FIX-*) and component rebuilds (COMP-*) belong to Phases 2–3.

</domain>

<decisions>
## Implementation Decisions

### Token inventory output
- **D-01:** Phase 1 produces both a written token inventory mapping document AND code changes to `index.css`/`tailwind.config.js` (not code-only). — **Reversibility:** reversible — swapping to code-only later only means losing the auditable artifact; no system depends on it yet.

### Token inventory location and detail
- **D-02:** Mapping document lives at `.planning/phases/01-design-system-audit-token-lock/token-inventory.md` (markdown table). — **Reversibility:** reversible — moving it later only changes a file path; no downstream agent hardcodes this path.
- **D-03:** Mapping doc columns: source file, current value, DESIGN.md token, measured contrast ratio, status (matched/flagged), FIX phase reference. — **Reversibility:** reversible — adding/removing columns is an editorial change.

### Near-miss value handling
- **D-04:** Values close to but not exactly a DESIGN.md token are normalized to the exact DESIGN.md equivalent during Phase 1; originals are noted in the inventory for traceability. — **Reversibility:** costly — normalizing touches many values across `src/`; reverting would require re-auditing each near-miss and re-applying originals. Rationale: meets the "locked 1:1 to DESIGN.md tokens" goal and prevents near-miss drift into Phase 2/3 rebuilds.

### oil-ui evaluation depth
- **D-05:** oil-ui evaluation in Phase 1 is direction comparison / scratch pages only (`src/__oil_ui_eval__/`), no component prototyping. Adopt/do-not-adopt decision recorded in PROJECT.md Key Decisions. If adopted, component wrapping to DESIGN.md tokens happens in Phase 6 (OIL-04). — **Reversibility:** reversible — scratch pages are deletable; adding prototyping later is additive, not destructive.

### Quick-fix vs. flag-only
- **D-06:** Phase 1 is flag-only for defects. All audit findings (contrast, focus rings, touch targets, colour-alone risk, dead controls, telemetry, copy) are flagged in the inventory doc with FIX-XX references and carried to Phase 2. Phase 1 stays strictly scoped to token inventory + lock + oil-ui eval. — **Reversibility:** reversible — un-flagging and fixing in Phase 1 is just re-scoping; no Phase 2 work depends on flags existing.

### the agent's Discretion
- Near-miss normalization (D-04): user delegated; decided to normalize.
- oil-ui evaluation depth (D-05): user delegated; decided scratch pages only.
- Quick-fix vs. flag-only (D-06): user delegated; decided flag-only.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design authority
- `DESIGN.md` — measured design tokens, two visual registers (clinical app + warm landing), accessibility contract, antislop constraints, radius/elevation scale, motion budget
- `web-dashboard/src/index.css` — token layer (`:root` + `.landing-scope`), measured contrast values in comments; source of truth for CSS variables
- `web-dashboard/tailwind.config.js` — `token()` helper mapping CSS variables to Tailwind utilities; radius/elevation/font-size scales; light-only (no `.dark` block)
- `web-dashboard/src/designTokens.test.js` — regression test; generates real stylesheet and verifies every utility class used in `src/` has a generated rule

### Phase requirements and roadmap
- `.planning/REQUIREMENTS.md` — TOKEN-01–04, THEME-01, OIL-01, OIL-02 requirements for this phase
- `.planning/ROADMAP.md` — Phase 1 goal, 6 success criteria, dependencies (first phase, depends on nothing)

### Milestone context
- `.planning/PROJECT.md` — milestone v1.0 goal, constraints (light-only, Delivery Gate at 3 breakpoints, antislop filter), Key Decisions table
- `.planning/STATE.md` — current phase status, progress counters

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `GlassCard`, `GlassButton`, `GlassInput`, `GlassTable`, `GlassForm` — existing component primitives (src/components/ui/), re-exported through GlassComponents.jsx barrel; named imports, never renamed
- `StatusChip`, `Chip` — filter labels, deltas, state tokens; semantic tone vocabulary only
- `token()` helper in `tailwind.config.js` — resolves CSS variables (`rgb(var(--name) / <alpha-value>)`) to Tailwind utilities; the one-way token flow (CSS vars → utilities → components)
- `designTokens.test.js` — existing build gate; must stay green after any token change

### Established Patterns
- One-way token flow: CSS variables in `index.css` (`:root` + `.landing-scope`) → Tailwind utilities via `token()` → component primitives → page composition
- Light-only theme: `color-scheme: light` on `:root` and `.landing-scope`; no `.dark` block, no `dark:` utility anywhere
- Glass* naming retained: design brief forbids renaming exports; pages import by name
- Risk colors: safe `#16A34A` / warning `#CA8A04` / danger `#DC2626` (darkened forms that clear AA on light); ink variants (`safe-ink`, `warning-ink`, `danger-ink`, `secondary-ink`) for text-on-tint
- Chart series: Okabe-Ito (`#0072B2` / `#D55E00` / `#009E73`), quarantined to charts only, single SERIES source in `TelemetryChart.jsx`
- `aria-live="off"` on live pressure numbers; one polite region for risk-level changes only
- Firebase `autoConnect={Boolean(user)}` guard; unchanged by design-system work

### Integration Points
- `src/index.css` tokens consumed by `tailwind.config.js` `theme.extend` → consumed by all components → consumed by all pages
- `designTokens.test.js` runs on build; any Tailwind class with no generated rule fails the build (hard gate)
- Landing page scopes tokens under `.landing-scope`; app pages use `:root` — registers never mixed
- `UserContext` / `InsoleContext` — single auth listener + single telemetry provider; untouched by design-system work

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the decisions above — open to standard approaches for executing the token inventory and lock.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Design-system audit & token lock*
*Context gathered: 2026-10-17*
