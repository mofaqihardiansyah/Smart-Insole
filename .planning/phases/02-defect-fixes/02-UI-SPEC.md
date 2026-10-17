---
phase: "02"
slug: defect-fixes
status: approved
contract_source: .planning/phases/01-design-system-audit-token-lock/01-UI-SPEC.md
contract_status: approved
reused_by_decision: true
created: "2026-10-17"
---

# Phase 02 — UI design contract (reused, not regenerated)

> **This file is a provenance stub, not a design contract.** It exists so the
> execution-time UI-safety gate (`check ui-safety-gate`, which resolves a
> `*-UI-SPEC.md` by filename inside the phase directory) can see the contract that
> actually governs Phase 02's UI work.

## The authoritative contract

`.planning/phases/01-design-system-audit-token-lock/01-UI-SPEC.md` — `status: approved`,
verified by `gsd-ui-checker`, with design authority `DESIGN.md`.

Phase 02 was planned with `--skip-ui` **by explicit user decision**: rather than
authoring a second, phase-local contract for defect fixes that only *apply* an already
locked contract, Phase 01's approved UI-SPEC is reused verbatim. No contract content is
duplicated here, so nothing can drift out of sync — Phase 01's file remains the single
source of truth.

## How it was applied

Phase 01's `## UI Considerations` section was lifted into each plan's `must_haves` at
planning time, and every plan carries its own row-by-row disposition table:

| Plan | Disposition section |
|------|---------------------|
| 02-02 | `## SPEC considerations disposition (01-UI-SPEC.md ## UI Considerations, unresolved rows are explicit assumptions, never dropped)` |
| 02-03 | `## SPEC considerations disposition (01-UI-SPEC.md ## UI Considerations)` |
| 02-05 | cites the approved spec directly (see its `key_links`) |

Unresolved rows were carried forward as explicit deferrals, not dropped. The two
deferrals that leave Phase 02 — the landing type scale and radius values — are recorded
against PAGE-10 in `ROADMAP.md` (Phase 5 criterion 3, Phase 6 criterion 3) and
`GATE-03`.

## Related

- `.planning/phases/01-design-system-audit-token-lock/01-UI-REVIEW.md` — the 16/24 audit
  that scoped this phase.
- `.planning/phases/02-defect-fixes/02-CONTEXT.md` — the locked decisions D-01…D-13 the
  plans implement.
