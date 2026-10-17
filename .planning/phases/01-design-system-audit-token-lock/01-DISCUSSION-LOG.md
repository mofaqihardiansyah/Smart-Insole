# Phase 1: Design-system audit & token lock - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-17
**Phase:** 1-Design-system audit & token lock
**Areas discussed:** Token inventory output format, Near-miss value handling, oil-ui evaluation depth, Quick-fix vs. flag-only

---

## Token inventory output format

| Option | Description | Selected |
|--------|-------------|----------|
| Written mapping doc + code changes | Thorough and auditable artifact for downstream phases | ✓ |
| Code changes only | Faster; the lock itself is the inventory | |
| You decide | Agent picks based on what makes Phase 2 easiest | |

**User's choice:** Written mapping document + code changes
**Follow-up:** Mapping doc lives at `.planning/phases/01-design-system-audit-token-lock/token-inventory.md`, markdown table with columns: source file, current value, DESIGN.md token, measured contrast ratio, status (matched/flagged), FIX phase reference.

**Notes:** All columns selected (source + value + token + contrast + status + FIX ref).

---

## Near-miss value handling

| Option | Description | Selected |
|--------|-------------|----------|
| Normalize to exact DESIGN.md tokens | Change close values to exact DESIGN.md equivalent; cleaner, one source of truth | |
| Flag only, don't normalize | Leave as-is, mark for Phase 2 review; fewer changes now | |
| You decide | Agent picks based on what reduces risk for Phase 2 | ✓ |

**User's choice:** You decide (delegated to agent)
**Agent's decision:** Normalize near-misses to exact DESIGN.md tokens during Phase 1; originals noted in inventory for traceability.

**Notes:** Rationale — meets "locked 1:1 to DESIGN.md tokens" goal; prevents near-miss drift into Phase 2/3 rebuilds. Reversibility: costly (touches many values; reverting requires re-auditing each near-miss).

---

## oil-ui evaluation depth

| Option | Description | Selected |
|--------|-------------|----------|
| Direction comparison/scratch pages only | Install oil-ui, generate directions in scratch sandbox, compare side-by-side, record decision; no component prototyping | |
| Also prototype a wrapped component | Build one wrapped component mapping oil-ui direction to DESIGN.md tokens; more concrete | |
| You decide | Agent picks based on what best informs the go/no-go decision | ✓ |

**User's choice:** You decide (delegated to agent)
**Agent's decision:** Direction comparison/scratch pages only (`src/__oil_ui_eval__/`), no component prototyping in Phase 1. If adopted, component wrapping happens in Phase 6 (OIL-04).

**Notes:** Keeps skill-vs-library boundary clean; avoids wasted work if decision is "do-not-adopt."

---

## Quick-fix vs. flag-only

| Option | Description | Selected |
|--------|-------------|----------|
| Quick-fix obvious issues immediately | Fix clear-cut defects during audit; fewer items carry to Phase 2 | |
| Flag-only | Everything found goes to Phase 2; Phase 1 stays strictly scoped | |
| You decide | Agent picks based on what keeps Phase 1 clean | ✓ |

**User's choice:** You decide (delegated to agent)
**Agent's decision:** Flag-only. Phase 1 stays strictly scoped to token inventory + lock + oil-ui evaluation. All defects flagged with FIX-XX references and carried to Phase 2.

**Notes:** Keeps Phase 1 clean and scoped; Phase 2 can batch all fixes together efficiently.

---

## the agent's Discretion

- Near-miss normalization (decided: normalize to exact DESIGN.md tokens)
- oil-ui evaluation depth (decided: scratch pages only)
- Quick-fix vs. flag-only (decided: flag-only)

## Deferred Ideas

None — discussion stayed within phase scope.
