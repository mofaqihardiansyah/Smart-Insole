# Smart Insole IoT Dashboard

## What This Is

A React 18 + Vite 5 + Tailwind CSS 3 web dashboard for a smart insole IoT system. It is a clinical plantar-pressure console for elderly diabetic patients and their caregivers, showing real-time pressure readings, risk classification (safe/warning/danger via Random Forest), telemetry charts, heatmaps, and device management across Dashboard, Monitoring, History, Device, Settings, Profile, Login, Register, and Notifications pages.

## Core Value

Trustworthy, legible real-time plantar pressure monitoring that flags risk states clearly — nothing on screen is decorative colour; colour means a foot needs attention.

## Business Context

<!-- OPTIONAL — only for monetized or customer-facing projects. Delete this section otherwise. -->

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] Audit existing web-dashboard UI/UX against DESIGN.md design system
- [ ] Fix UI/UX defects found during audit
- [ ] Rebuild UI/UX components to match DESIGN.md specification
- [ ] Evaluate oil-ui design system for potential adoption

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Firmware / ESP32 PlatformIO work — separate workstream, no UI impact
- Thesis document writing — docs/ workstream, not UI

## Context

- `web-dashboard/` is the active workstream (React 18 + Vite 5 + Tailwind CSS 3)
- `DESIGN.md` holds the design direction: two visual registers (clinical app + warm landing), three dials (ENERGY 2 / RHYTHM 2 / MOTION 1), measured palette, breakpoints at <640 / 640–1023 / >=1024px, radius and elevation scale, motion budget, accessibility contract, antislop constraints
- `AGENTS.md` requires reading DESIGN.md before touching UI, applying the antislop filter, and running the Delivery Gate (npm test + npm run build + click-through at 360px, 768px, 1280px) before handing over
- oil-ui (https://github.com/oil-oil/oil-ui) raised as a candidate design system to evaluate during this milestone

## Constraints

- **Design system**: DESIGN.md is authoritative; every token carries measured contrast values
- **Antislop**: antislop core + task-specific antislop skills required for UI, copy, people, mobile layout, code comments work
- **Verification**: `npm test` (Vitest) and `npm run build` must succeed with zero errors; UI must be click-through verified at 360px, 768px, 1280px
- **Theme**: light-only, no dark mode toggle
- **Accessibility**: 44x44px touch targets, keyboard operability, risk never by colour alone, loading/empty/error states

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| DESIGN.md as design authority | Owner-supplied clinical console reference + measured tokens | — Pending |

---

## Current Milestone: v1.0 Audit, Fix, Rebuild UI/UX Design

**Goal:** Audit, fix, and rebuild the web-dashboard UI/UX to conform to DESIGN.md, evaluating oil-ui as a candidate design system.

**Target features:**
- UI/UX audit against DESIGN.md
- Defect fixes from audit findings
- Component rebuilds to match DESIGN.md specification
- oil-ui design system evaluation

---

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: Sat Oct 17 2026 after v1.0 milestone start*
