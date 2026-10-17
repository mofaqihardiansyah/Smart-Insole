---
phase: "2"
slug: "defect-fixes"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-17"
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded from `02-RESEARCH.md` § Validation Architecture. Per-task rows are filled at plan time
> (PLAN.md task IDs do not exist yet); requirement-level rows below are the contract to map onto.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.1.3 |
| **Config file** | `web-dashboard/vite.config.js` `test` block |
| **Quick run command** | `cd web-dashboard && npm test` |
| **Full suite command** | `cd web-dashboard && npm test && npm run build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd web-dashboard && npm test`
- **After every plan wave:** Run `cd web-dashboard && npm test && npm run build`
- **Before `/gsd-verify-work`:** Full suite must be green + build zero errors
- **Max feedback latency:** 30 seconds

---

## Verification Map (by requirement; task IDs assigned at plan time)

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | FIX-01 | — | Undeclared `#232427` absent from `tailwind.config.js` + `index.css`; `designTokens.test.js` asserts `warm-dark` | token gate | `cd web-dashboard && npx vitest run src/designTokens.test.js` | ✅ `src/designTokens.test.js` | ⬜ pending |
| TBD | TBD | TBD | FIX-02 | — | Visible focus ring (≥3:1) on every interactive element | component | `cd web-dashboard && npm test` | ❌ W0 gap | ⬜ pending |
| TBD | TBD | TBD | FIX-03 | — | Every interactive target ≥44×44px on touch (incl. landing drawer trigger + nav links) | component | `cd web-dashboard && npm test` | ❌ W0 gap | ⬜ pending |
| TBD | TBD | TBD | FIX-04 | — | Risk conveyed by icon AND text label AND colour | component | `cd web-dashboard && npm test` | ❌ W0 gap (`StatusChip`) | ⬜ pending |
| TBD | TBD | TBD | FIX-05 | — | Only Export CSV and Mark as read stand as actions | page | `cd web-dashboard && npm test` | ⚠️ `DashboardPage.test.jsx` | ⬜ pending |
| TBD | TBD | TBD | FIX-06 | — | No decorative pastel stat tints; icon tile uses semantic colour | component | `cd web-dashboard && npm test` | ❌ W0 gap (`BentoGrid`) | ⬜ pending |
| TBD | TBD | TBD | FIX-07 | — | Telemetry is real or explicitly labelled Simulation | source audit | `cd web-dashboard && npm test` | ⚠️ no dedicated test | ⬜ pending |
| TBD | TBD | TBD | FIX-08 | — | Actionable loading/empty/error on every data view (names cause + next action) | component | `cd web-dashboard && npm test` | ❌ W0 gap (`StatePanel`) | ⬜ pending |
| TBD | TBD | TBD | FIX-09 | — | No em dashes in shipped copy | lint/grep | `cd web-dashboard && npm test` (+ copy guard) | ❌ W0 gap | ⬜ pending |
| TBD | TBD | TBD | FIX-10 | — | App-level ErrorBoundary catches a render throw with named cause + recovery | component | `cd web-dashboard && npm test` | ❌ W0 gap | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/ui/StatePanel.test.jsx` — stubs for FIX-08
- [ ] `src/components/ui/BentoGrid.test.jsx` — stubs for FIX-06
- [ ] `src/components/**/StatusChip.test.jsx` — stubs for FIX-04
- [ ] Focus-ring + 44px target assertions for FIX-02 / FIX-03
- [ ] Copy guard for em dashes (FIX-09) — grep-based pre-commit step
- [ ] `src/designTokens.test.js` — extend for FIX-01 (shadow uniqueness) and FIX-10 (ErrorBoundary)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Contrast meets DESIGN.md measured values | FIX-01 | Colour contrast is a rendered property; the token gate only proves the value, not the pairing | Inspect each token pair against `DESIGN.md` measured table at 1280px; confirm fg 18.1:1 AAA and muted 4.8:1 AA |
| Click-through at 360 / 768 / 1280px | FIX-03, GATE-03 | No Playwright/Chrome in this environment (audit ran code-only) | Manual click-through at the three breakpoints; landing nav drawer trigger `h-11 w-11`, nav links `min-h-[44px]` |
| `prefers-reduced-motion` respected | FIX-02 / motion | Needs OS-level media emulation | Toggle OS reduced-motion; confirm transitions/animations stop |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
