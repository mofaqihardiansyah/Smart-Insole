---
schema_version: 1
open_count: 38
waived_count: 0
fixed_count: 1
total_count: 39
last_updated: 2026-10-18T07:43:18.440Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 02 | deviation | web-dashboard/src/components/PlantarHeatmap.test.jsx |  | Rule 1 fix: the label-switch case asserted the pre-D-06 hydration contract, so it was inverted in the same commit as the reader change | fixed |  | 2026-10-17T12:10:29.031Z | 2026-10-17T12:10:43.897Z |
| 2 | 02 | unrun-verify | web-dashboard/src/components/ui/ErrorBoundary.jsx |  | Manual click-through not run at 02-06: temporarily make a page throw, confirm the fallback shows its cause and action, activate the action, confirm the view recovers, restore the page, and check 360px / 768px / 1280px. No browser in this execution environment | open |  | 2026-10-17T12:32:51.000Z |  |
| 3 | 02 | unrun-verify | web-dashboard/src/pages/LandingPage.jsx |  | Manual click-through of the landing at 360/768/1280px (painted focus ring + measured 44x44 trigger) was not run: jsdom has no layout engine. Owned by GATE-03 / human UAT (02-02 coverage D6). | open |  | 2026-10-17T13:09:48.343Z |  |
| 4 | 02 | deviation | web-dashboard/dist/index.html |  | web-dashboard/dist/ is tracked in git, so the AGENTS.md-mandated npm run build dirties the tree with build output no plan owns. 02-02 left it out of every commit and restored it to HEAD. Decide dist tracking policy (gitignore vs batch tracking commit). | open |  | 2026-10-17T13:09:48.536Z |  |
| 5 | 02 | unrun-verify | web-dashboard/src/pages/DashboardPage.test.jsx |  | Manual click-through of the dashboard and the admin users table at 360/768/1280px was not run (02-04 coverage D6): with the simulator running the Simulation banner must read correctly, and the admin users-table fallback must show a localised "not available" rather than a dash. jsdom has no layout engine and cannot run the simulator or a live Firebase connection; owned by GATE-03 / human UAT. | open |  | 2026-10-17T13:25:11.000Z |  |
| 6 | 02 | deviation | .planning/phases/02-defect-fixes/02-04-PLAN.md |  | The 02-04 plan's `<automated>` commands embed an unquoted absolute path containing a space (`cd /home/qihh/Documents/Tugas Akhir/smart-insole-ta/web-dashboard && …`), which fails as `cd: too many arguments`. Recurrence of the same plan-template defect recorded for 02-02. Commands were run with the shell workdir / a quoted path instead; the plan file was not edited. | open |  | 2026-10-17T13:25:11.000Z |  |
| 7 | 03 | unrun-verify | web-dashboard/src/pages/landingCta.test.jsx |  | Manual click-through of the rebuilt landing register at 360/768/1280px was not run (03-01 coverage D5): the eight CTAs must read as two registers, the hero primary and secondary actions must look different, and a long localised label must wrap inside the button with no horizontal overflow. jsdom has no layout engine. Owned by GATE-03 / human UAT. | open |  | 2026-10-18T03:28:51.544Z |  |
| 8 | 03 | deviation | .planning/phases/03-primitive-rebuilds/03-01-PLAN.md |  | Task 3 is tdd=true but produced no RED commit: Task 1 ships the behaviour by plan design, so all nine assertions were green on first run. Recorded as-is rather than fabricating a RED/GREEN pair. tdd_mode is not enabled and the plan is type=execute, so no RED-gate contract applied. | open |  | 2026-10-18T03:28:51.699Z |  |
| 9 | 03 | unrun-verify | web-dashboard/src/pages/MonitoringPage.jsx |  | The 360/768/1280 click-through of the rebuilt series path (chart plot, legend readout, screen-reader table, window control) could not be run: this environment has no browser. The structural half is locked by unit test; the visual half needs a human pass at the three breakpoints (AGENTS.md Delivery Gate). | open |  | 2026-10-18T03:39:51.224Z |  |
| 10 | 03 | deviation | web-dashboard/src/components/monitoring/TelemetryChart.test.jsx |  | Rule 2: added the literal three-series floor to TelemetryChart.test.jsx. The plan's Task-2 action derives the count from SERIES.length, which stayed self-consistent when SERIES was probed down to two entries; threat T-03-05 names 'asserts the three-series count' as the mitigation, so the literal floor was added to complete it. | open |  | 2026-10-18T03:39:51.412Z |  |
| 11 | 03 | deviation | web-dashboard/src/components/monitoring/TelemetryChart.test.jsx |  | Rule 1: the new chart test's literal SVG dash attribute name tripped designTokens.test.js, whose sweep reads any stroke-* token in a .jsx as a Tailwind utility. The name is now assembled from parts at the point of use. | open |  | 2026-10-18T03:39:51.609Z |  |
| 12 | 03 | unrun-verify | web-dashboard/src/components/ui/AlertBanner.jsx |  | Manual click-through of the rebuilt banner primitives at 360/768/1280px was not run (03-03 coverage D5/D6): the cause/next-action hierarchy must read as two tiers at every breakpoint, a long localised next-action label must wrap inside the link without horizontal overflow, and the danger tone must stay perceivable by more than hue alone. jsdom has no layout engine. Owned by GATE-03 / human UAT. | open |  | 2026-10-18T04:02:37.487Z |  |
| 13 | 03 | deviation | web-dashboard/src/pages/LoginPage.jsx | 114 | Consequence of D-03: the AlertBanner primitive dev-warns on a danger tone with a cause but no next action and no children. LoginPage.jsx:114 and RegisterPage.jsx:100 are exactly that shape (pre-existing pages, outside this plan's scope fence), so they now emit the warning in development. Production copy is unchanged and the fallback is benign; the repair belongs to PAGE-08/PAGE-09 (or 03-07). | open |  | 2026-10-18T04:02:41.332Z |  |
| 14 | 03 | deviation | web-dashboard/src/components/ui/GlassTable.test.jsx |  | New test file outside 03-06's files_modified. The plan allowed the raised-head ink assertion in 'the gate's file or the existing table coverage'; no table coverage existed, and a source-scanning static gate (variantKeys.test.js) is the wrong owner for a jsdom render assertion. The table's contract therefore lives beside the table, following the Chip.test.jsx precedent. | open |  | 2026-10-18T04:34:13.979Z |  |
| 15 | 03 | deviation | web-dashboard/src/components/dashboard/BentoGrid.jsx |  | The bento icon tile keeps its decorative h-12 w-12 square, against the letter of 03-06 Task 3. That task asked for no height utility at all 'and the same for the icon tile inside it', while its own acceptance criteria require 'git diff BentoGrid.jsx' to be empty. The lock asserts the full no-height property on the CELL (min, fixed, max) and on the tile asserts no floor, ceiling or stretch. The protected invariant is unaffected: the tile holds no copy that could be clipped. | open |  | 2026-10-18T04:34:14.169Z |  |
| 16 | 03 | deviation | web-dashboard/src/components/ui/StatePanel.jsx |  | nextActionLabel is a prop rather than a dictionary lookup inside the primitive (03-07). StatePanel is pure and tested without providers and this codebase has no language context, so a lookup would either make the primitive impure or hardcode a language. The caller localises it, matching AlertBanner's dismissLabel precedent. | open |  | 2026-10-18T04:34:14.368Z |  |
| 17 | 03 | deviation | web-dashboard/src/seriesQuarantine.test.js |  | Comments are stripped before the quarantine search (03-05), which the plan's action text did not specify. Without stripping, TelemetryChart.jsx:12 (a header comment naming the series property) would fail a gate it should pass; the alternative, exempting every chart file by name, would weaken the rule to 'charts may reference series properties'. | open |  | 2026-10-18T04:34:14.555Z |  |
| 18 | 03 | deviation | .planning/ROADMAP.md |  | Success criterion 5 is phrased as aria-live=off on the live pressure numbers. No such attribute exists anywhere under src/: the numbers are simply outside every live region, which is the stronger form of the same rule. liveRegion.test.js asserts the absence rather than adding the attribute, so both adding an 'off' attribute and adding a real region fail the gate. | open |  | 2026-10-18T04:34:14.755Z |  |
| 19 | 03 | deviation | .planning/phases/03-primitive-rebuilds/03-UI-SPEC.md |  | C-03's heading claims its off-grid-spacing list is complete but omits StatusBanner.jsx:57 mt-0.5, BentoGrid.jsx:70 ml-1.5 and LoadDonut.jsx:99 space-y-2.5. Cosmetic spec defect: the list is read by no gate. | open |  | 2026-10-18T04:34:14.942Z |  |
| 20 | 03 | deviation | web-dashboard/src/pages/AdminPage.jsx |  | The two-tier feedback sweep is scoped to AdminPage.jsx (03-07). A whole-app sweep fails today on eight panels that name a cause with no next step: DashboardPage.jsx:515, DashboardPage.jsx:557, DevicePage.jsx:142, HistoryPage.jsx:305, MonitoringPage.jsx:137, ProfilePage.jsx:82, ProfilePage.jsx:185, SettingsPage.jsx:303. StatePanel dev-warns about them; the repair belongs to Phase 5. | open |  | 2026-10-18T04:34:15.130Z |  |
| 21 | 03 | deviation | DESIGN.md |  | The two DESIGN.md amendments (the Single source clause naming src/utils/series.js, and the TrendChart non-identity carve-out record) are awaiting owner countersignature. Non-blocking: the code side of D-04/D-05 is enforced by seriesQuarantine.test.js and 03-04's tests. | open |  | 2026-10-18T04:34:15.338Z |  |
| 22 | 03 | unrun-verify | web-dashboard/src/components/ui/GlassTable.jsx |  | 360/768/1280 click-through of the raised column head not run: the fg-2 ink must clear AA on the bg-surface-2 tint at every breakpoint, at 12px uppercase. jsdom has no layout engine and cannot measure contrast on a rendered surface. Owned by GATE-03 / human UAT. | open |  | 2026-10-18T04:34:15.532Z |  |
| 23 | 03 | unrun-verify | web-dashboard/src/components/ui/StatePanel.jsx |  | 360/768/1280 click-through of the rebuilt state primitive not run (03-07): the next-action paragraph must read as a second tier under the description at every breakpoint, and a long localised next-step string must wrap without horizontal overflow. jsdom has no layout engine. Owned by GATE-03 / human UAT. | open |  | 2026-10-18T04:34:15.745Z |  |
| 24 | 03 | unrun-verify | web-dashboard/src/components/dashboard/LoadDonut.jsx |  | 360/768/1280 click-through of the rebuilt donut not run (03-04): the three arcs must stay distinguishable at every breakpoint and the caption must stay readable under the ring. jsdom has no layout engine. Owned by GATE-03 / human UAT. | open |  | 2026-10-18T04:34:15.936Z |  |
| 25 | 03 | unrun-verify | web-dashboard/src/components/monitoring/TrendChart.jsx |  | 360/768/1280 click-through of the rebuilt trend trace not run (03-04): the carve-out sage line must keep the contrast the palette table measures for it against the plot surface, and the threshold label must not collide with the trace at 360px. jsdom has no layout engine. Owned by GATE-03 / human UAT. | open |  | 2026-10-18T04:34:16.130Z |  |
| 26 | 04 | deviation | web-dashboard/src/components/layout/AppSidebar.jsx |  | buildNavLinks gives the admin destination icon "Shield", but ICONS had no Shield entry, so renderIcon fell back to LayoutDashboard and an admin saw the dashboard glyph on a second rail item. Found while writing the shell gate; named by no SHELL requirement. Fixed by registering Shield. | open |  | 2026-10-18T05:13:29.232Z |  |
| 27 | 04 | deviation | web-dashboard/src/components/layout/AppSearch.jsx |  | The combobox set aria-controls to the listbox id and aria-expanded to true, but the listbox is not rendered when nothing matches, so the reference dangled in exactly the state a screen-reader user is most likely to be in. The popup now owns that id. Not named by SHELL-04's wording. | open |  | 2026-10-18T05:13:32.156Z |  |
| 28 | 04 | deviation | web-dashboard/src/components/layout/AppLayout.jsx |  | The drawer carried role=dialog aria-modal=true, which declares the page behind inert, while Tab could leave it. SHELL-05 names focus in, Escape, scroll lock and focus return but not the trap; the trap is what aria-modal already promised. Added. | open |  | 2026-10-18T05:13:32.940Z |  |
| 29 | 04 | deviation | web-dashboard/src/App.jsx |  | The Phase 3 record put App.jsx:111 animate-spin at Phase 4 (N-05) and it is now removed: the splash is the product mark holding still. MOTION 1's permitted list has no loading spinner, and the announced sentence already carries the meaning. | open |  | 2026-10-18T05:13:35.063Z |  |
| 30 | 04 | deviation | .planning/phases/04-shell-rebuild/04-PHASE-SUMMARY.md |  | Phase 4 was executed directly without plan files, so there is no 04-xx-PLAN.md and no per-plan acceptance criteria. The phase's claims are locked by src/components/layout/shell.test.jsx instead (24 tests, one describe per SHELL requirement, three gates proved failing first). | open |  | 2026-10-18T05:13:36.681Z |  |
| 31 | 04 | deviation | web-dashboard/src/components/layout/shell.test.jsx |  | The shell had zero test coverage before this file: no test touched AppLayout, AppSidebar, AppTopbar or AppSearch. The six SHELL requirements were roadmap prose with no gate. This is the phase's real deliverable. | open |  | 2026-10-18T05:13:39.382Z |  |
| 32 | 04 | unrun-verify | web-dashboard/src/components/layout/AppLayout.jsx |  | 360/768/1280 click-through of the shell not run: the 288px rail, the 72px bar, the 1400px cap and the drawer's 19rem width must be checked at all three widths, including that the drawer does not overflow at 360px. jsdom applies no stylesheets, so it can prove the class and not the width. Owned by GATE-03 / human UAT. | open |  | 2026-10-18T05:13:41.462Z |  |
| 33 | 04 | unrun-verify | web-dashboard/src/App.jsx |  | 360/768/1280 click-through of the new first paint not run: the product mark must sit centred with the announced sentence under it at every width. jsdom has no layout engine. Owned by GATE-03 / human UAT. | open |  | 2026-10-18T05:13:45.056Z |  |
| 34 | 05 | deviation | web-dashboard/src/context/InsoleContext.jsx |  | An orphaned Theme preference comment (was lines 178-185) documented a theme state that does not exist anywhere under src/. Removed in Batch 0 before the pages are rebuilt, because a page author reading it would have re-added a theme switch, which DESIGN.md:432 refuses as a dead control. | open |  | 2026-10-18T07:43:17.507Z |  |
| 35 | 05 | deviation | web-dashboard/src/pages/ProfilePage.jsx |  | An orphaned comment claimed this page carries the labelled theme control. The control does not exist; the page carries the language selector instead, which LANG-01 now removes too. Removed in Batch 0. | open |  | 2026-10-18T07:43:17.693Z |  |
| 36 | 05 | deviation | web-dashboard/src/components/layout/LanguageToggle.jsx |  | LANG-01 executed as option a1 (the user's choice): the toggle is deleted with all four mounts (rail, topbar, drawer, landing) and ProfilePage's own language picker. setLanguage stays on the context because two tests drive it and the sweep-wide a3 was declined; DICTIONARY.en (~360 lines) stays as dead weight by the same decision. | open |  | 2026-10-18T07:43:17.874Z |  |
| 37 | 05 | deviation | web-dashboard/src/utils/i18n.js |  | LANGUAGES is now a single-entry registry (id only). dictionaryKeys(), the id/en parity tests and t()'s lang parameter are untouched by decision. | open |  | 2026-10-18T07:43:18.056Z |  |
| 38 | 05 | deviation | DESIGN.md |  | DESIGN.md:326 named the topbar's account controls as (language, notifications, profile). After LANG-01 the clause names (notifications, profile) and records the switch's removal. Awaiting owner countersignature, non-blocking. | open |  | 2026-10-18T07:43:18.260Z |  |
| 39 | 05 | deviation | docs/DESIGN-BRIEF |  | The October design brief predates the redesign and contradicts the shipped product (bilingual ID/EN vs LANG-01, dark glassmorphism palette vs light-only, FloatingNavbar which no longer exists). A historical note in its header marks section 5's page inventory as the surviving authority and the rest as historical record. | open |  | 2026-10-18T07:43:18.440Z |  |

````json
[
  {
    "id": 1,
    "kind": "deviation",
    "phase": "02",
    "file": "web-dashboard/src/components/PlantarHeatmap.test.jsx",
    "line": null,
    "description": "Rule 1 fix: the label-switch case asserted the pre-D-06 hydration contract, so it was inverted in the same commit as the reader change",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-10-17T12:10:29.031Z",
    "resolved_at": "2026-10-17T12:10:43.897Z",
    "milestone": "v1.0"
  },
  {
    "id": 2,
    "kind": "unrun-verify",
    "phase": "02",
    "file": "web-dashboard/src/components/ui/ErrorBoundary.jsx",
    "line": null,
    "description": "Manual click-through not run at 02-06: temporarily make a page throw, confirm the fallback shows its cause and action, activate the action, confirm the view recovers, restore the page, and check 360px / 768px / 1280px. No browser in this execution environment",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-17T12:32:51.000Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 3,
    "kind": "unrun-verify",
    "phase": "02",
    "file": "web-dashboard/src/pages/LandingPage.jsx",
    "line": null,
    "description": "Manual click-through of the landing at 360/768/1280px (painted focus ring + measured 44x44 trigger) was not run: jsdom has no layout engine. Owned by GATE-03 / human UAT (02-02 coverage D6).",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-17T13:09:48.343Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 4,
    "kind": "deviation",
    "phase": "02",
    "file": "web-dashboard/dist/index.html",
    "line": null,
    "description": "web-dashboard/dist/ is tracked in git, so the AGENTS.md-mandated npm run build dirties the tree with build output no plan owns. 02-02 left it out of every commit and restored it to HEAD. Decide dist tracking policy (gitignore vs batch tracking commit).",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-17T13:09:48.536Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 5,
    "kind": "unrun-verify",
    "phase": "02",
    "file": "web-dashboard/src/pages/DashboardPage.test.jsx",
    "line": null,
    "description": "Manual click-through of the dashboard and the admin users table at 360/768/1280px was not run (02-04 coverage D6): with the simulator running the Simulation banner must read correctly, and the admin users-table fallback must show a localised \"not available\" rather than a dash. jsdom has no layout engine and cannot run the simulator or a live Firebase connection; owned by GATE-03 / human UAT.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-17T13:25:11.000Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 6,
    "kind": "deviation",
    "phase": "02",
    "file": ".planning/phases/02-defect-fixes/02-04-PLAN.md",
    "line": null,
    "description": "The 02-04 plan's `<automated>` commands embed an unquoted absolute path containing a space (`cd /home/qihh/Documents/Tugas Akhir/smart-insole-ta/web-dashboard && …`), which fails as `cd: too many arguments`. Recurrence of the same plan-template defect recorded for 02-02. Commands were run with the shell workdir / a quoted path instead; the plan file was not edited.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-17T13:25:11.000Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 7,
    "kind": "unrun-verify",
    "phase": "03",
    "file": "web-dashboard/src/pages/landingCta.test.jsx",
    "line": null,
    "description": "Manual click-through of the rebuilt landing register at 360/768/1280px was not run (03-01 coverage D5): the eight CTAs must read as two registers, the hero primary and secondary actions must look different, and a long localised label must wrap inside the button with no horizontal overflow. jsdom has no layout engine. Owned by GATE-03 / human UAT.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T03:28:51.544Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 8,
    "kind": "deviation",
    "phase": "03",
    "file": ".planning/phases/03-primitive-rebuilds/03-01-PLAN.md",
    "line": null,
    "description": "Task 3 is tdd=true but produced no RED commit: Task 1 ships the behaviour by plan design, so all nine assertions were green on first run. Recorded as-is rather than fabricating a RED/GREEN pair. tdd_mode is not enabled and the plan is type=execute, so no RED-gate contract applied.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T03:28:51.699Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 9,
    "kind": "unrun-verify",
    "phase": "03",
    "file": "web-dashboard/src/pages/MonitoringPage.jsx",
    "line": null,
    "description": "The 360/768/1280 click-through of the rebuilt series path (chart plot, legend readout, screen-reader table, window control) could not be run: this environment has no browser. The structural half is locked by unit test; the visual half needs a human pass at the three breakpoints (AGENTS.md Delivery Gate).",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T03:39:51.224Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 10,
    "kind": "deviation",
    "phase": "03",
    "file": "web-dashboard/src/components/monitoring/TelemetryChart.test.jsx",
    "line": null,
    "description": "Rule 2: added the literal three-series floor to TelemetryChart.test.jsx. The plan's Task-2 action derives the count from SERIES.length, which stayed self-consistent when SERIES was probed down to two entries; threat T-03-05 names 'asserts the three-series count' as the mitigation, so the literal floor was added to complete it.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T03:39:51.412Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 11,
    "kind": "deviation",
    "phase": "03",
    "file": "web-dashboard/src/components/monitoring/TelemetryChart.test.jsx",
    "line": null,
    "description": "Rule 1: the new chart test's literal SVG dash attribute name tripped designTokens.test.js, whose sweep reads any stroke-* token in a .jsx as a Tailwind utility. The name is now assembled from parts at the point of use.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T03:39:51.609Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 12,
    "kind": "unrun-verify",
    "phase": "03",
    "file": "web-dashboard/src/components/ui/AlertBanner.jsx",
    "line": null,
    "description": "Manual click-through of the rebuilt banner primitives at 360/768/1280px was not run (03-03 coverage D5/D6): the cause/next-action hierarchy must read as two tiers at every breakpoint, a long localised next-action label must wrap inside the link without horizontal overflow, and the danger tone must stay perceivable by more than hue alone. jsdom has no layout engine. Owned by GATE-03 / human UAT.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T04:02:37.487Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 13,
    "kind": "deviation",
    "phase": "03",
    "file": "web-dashboard/src/pages/LoginPage.jsx",
    "line": 114,
    "description": "Consequence of D-03: the AlertBanner primitive dev-warns on a danger tone with a cause but no next action and no children. LoginPage.jsx:114 and RegisterPage.jsx:100 are exactly that shape (pre-existing pages, outside this plan's scope fence), so they now emit the warning in development. Production copy is unchanged and the fallback is benign; the repair belongs to PAGE-08/PAGE-09 (or 03-07).",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T04:02:41.332Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 14,
    "kind": "deviation",
    "phase": "03",
    "file": "web-dashboard/src/components/ui/GlassTable.test.jsx",
    "line": null,
    "description": "New test file outside 03-06's files_modified. The plan allowed the raised-head ink assertion in 'the gate's file or the existing table coverage'; no table coverage existed, and a source-scanning static gate (variantKeys.test.js) is the wrong owner for a jsdom render assertion. The table's contract therefore lives beside the table, following the Chip.test.jsx precedent.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T04:34:13.979Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 15,
    "kind": "deviation",
    "phase": "03",
    "file": "web-dashboard/src/components/dashboard/BentoGrid.jsx",
    "line": null,
    "description": "The bento icon tile keeps its decorative h-12 w-12 square, against the letter of 03-06 Task 3. That task asked for no height utility at all 'and the same for the icon tile inside it', while its own acceptance criteria require 'git diff BentoGrid.jsx' to be empty. The lock asserts the full no-height property on the CELL (min, fixed, max) and on the tile asserts no floor, ceiling or stretch. The protected invariant is unaffected: the tile holds no copy that could be clipped.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T04:34:14.169Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 16,
    "kind": "deviation",
    "phase": "03",
    "file": "web-dashboard/src/components/ui/StatePanel.jsx",
    "line": null,
    "description": "nextActionLabel is a prop rather than a dictionary lookup inside the primitive (03-07). StatePanel is pure and tested without providers and this codebase has no language context, so a lookup would either make the primitive impure or hardcode a language. The caller localises it, matching AlertBanner's dismissLabel precedent.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T04:34:14.368Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 17,
    "kind": "deviation",
    "phase": "03",
    "file": "web-dashboard/src/seriesQuarantine.test.js",
    "line": null,
    "description": "Comments are stripped before the quarantine search (03-05), which the plan's action text did not specify. Without stripping, TelemetryChart.jsx:12 (a header comment naming the series property) would fail a gate it should pass; the alternative, exempting every chart file by name, would weaken the rule to 'charts may reference series properties'.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T04:34:14.555Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 18,
    "kind": "deviation",
    "phase": "03",
    "file": ".planning/ROADMAP.md",
    "line": null,
    "description": "Success criterion 5 is phrased as aria-live=off on the live pressure numbers. No such attribute exists anywhere under src/: the numbers are simply outside every live region, which is the stronger form of the same rule. liveRegion.test.js asserts the absence rather than adding the attribute, so both adding an 'off' attribute and adding a real region fail the gate.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T04:34:14.755Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 19,
    "kind": "deviation",
    "phase": "03",
    "file": ".planning/phases/03-primitive-rebuilds/03-UI-SPEC.md",
    "line": null,
    "description": "C-03's heading claims its off-grid-spacing list is complete but omits StatusBanner.jsx:57 mt-0.5, BentoGrid.jsx:70 ml-1.5 and LoadDonut.jsx:99 space-y-2.5. Cosmetic spec defect: the list is read by no gate.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T04:34:14.942Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 20,
    "kind": "deviation",
    "phase": "03",
    "file": "web-dashboard/src/pages/AdminPage.jsx",
    "line": null,
    "description": "The two-tier feedback sweep is scoped to AdminPage.jsx (03-07). A whole-app sweep fails today on eight panels that name a cause with no next step: DashboardPage.jsx:515, DashboardPage.jsx:557, DevicePage.jsx:142, HistoryPage.jsx:305, MonitoringPage.jsx:137, ProfilePage.jsx:82, ProfilePage.jsx:185, SettingsPage.jsx:303. StatePanel dev-warns about them; the repair belongs to Phase 5.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T04:34:15.130Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 21,
    "kind": "deviation",
    "phase": "03",
    "file": "DESIGN.md",
    "line": null,
    "description": "The two DESIGN.md amendments (the Single source clause naming src/utils/series.js, and the TrendChart non-identity carve-out record) are awaiting owner countersignature. Non-blocking: the code side of D-04/D-05 is enforced by seriesQuarantine.test.js and 03-04's tests.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T04:34:15.338Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 22,
    "kind": "unrun-verify",
    "phase": "03",
    "file": "web-dashboard/src/components/ui/GlassTable.jsx",
    "line": null,
    "description": "360/768/1280 click-through of the raised column head not run: the fg-2 ink must clear AA on the bg-surface-2 tint at every breakpoint, at 12px uppercase. jsdom has no layout engine and cannot measure contrast on a rendered surface. Owned by GATE-03 / human UAT.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T04:34:15.532Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 23,
    "kind": "unrun-verify",
    "phase": "03",
    "file": "web-dashboard/src/components/ui/StatePanel.jsx",
    "line": null,
    "description": "360/768/1280 click-through of the rebuilt state primitive not run (03-07): the next-action paragraph must read as a second tier under the description at every breakpoint, and a long localised next-step string must wrap without horizontal overflow. jsdom has no layout engine. Owned by GATE-03 / human UAT.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T04:34:15.745Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 24,
    "kind": "unrun-verify",
    "phase": "03",
    "file": "web-dashboard/src/components/dashboard/LoadDonut.jsx",
    "line": null,
    "description": "360/768/1280 click-through of the rebuilt donut not run (03-04): the three arcs must stay distinguishable at every breakpoint and the caption must stay readable under the ring. jsdom has no layout engine. Owned by GATE-03 / human UAT.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T04:34:15.936Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 25,
    "kind": "unrun-verify",
    "phase": "03",
    "file": "web-dashboard/src/components/monitoring/TrendChart.jsx",
    "line": null,
    "description": "360/768/1280 click-through of the rebuilt trend trace not run (03-04): the carve-out sage line must keep the contrast the palette table measures for it against the plot surface, and the threshold label must not collide with the trace at 360px. jsdom has no layout engine. Owned by GATE-03 / human UAT.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T04:34:16.130Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 26,
    "kind": "deviation",
    "phase": "04",
    "file": "web-dashboard/src/components/layout/AppSidebar.jsx",
    "line": null,
    "description": "buildNavLinks gives the admin destination icon \"Shield\", but ICONS had no Shield entry, so renderIcon fell back to LayoutDashboard and an admin saw the dashboard glyph on a second rail item. Found while writing the shell gate; named by no SHELL requirement. Fixed by registering Shield.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T05:13:29.232Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 27,
    "kind": "deviation",
    "phase": "04",
    "file": "web-dashboard/src/components/layout/AppSearch.jsx",
    "line": null,
    "description": "The combobox set aria-controls to the listbox id and aria-expanded to true, but the listbox is not rendered when nothing matches, so the reference dangled in exactly the state a screen-reader user is most likely to be in. The popup now owns that id. Not named by SHELL-04's wording.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T05:13:32.156Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 28,
    "kind": "deviation",
    "phase": "04",
    "file": "web-dashboard/src/components/layout/AppLayout.jsx",
    "line": null,
    "description": "The drawer carried role=dialog aria-modal=true, which declares the page behind inert, while Tab could leave it. SHELL-05 names focus in, Escape, scroll lock and focus return but not the trap; the trap is what aria-modal already promised. Added.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T05:13:32.940Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 29,
    "kind": "deviation",
    "phase": "04",
    "file": "web-dashboard/src/App.jsx",
    "line": null,
    "description": "The Phase 3 record put App.jsx:111 animate-spin at Phase 4 (N-05) and it is now removed: the splash is the product mark holding still. MOTION 1's permitted list has no loading spinner, and the announced sentence already carries the meaning.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T05:13:35.063Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 30,
    "kind": "deviation",
    "phase": "04",
    "file": ".planning/phases/04-shell-rebuild/04-PHASE-SUMMARY.md",
    "line": null,
    "description": "Phase 4 was executed directly without plan files, so there is no 04-xx-PLAN.md and no per-plan acceptance criteria. The phase's claims are locked by src/components/layout/shell.test.jsx instead (24 tests, one describe per SHELL requirement, three gates proved failing first).",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T05:13:36.681Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 31,
    "kind": "deviation",
    "phase": "04",
    "file": "web-dashboard/src/components/layout/shell.test.jsx",
    "line": null,
    "description": "The shell had zero test coverage before this file: no test touched AppLayout, AppSidebar, AppTopbar or AppSearch. The six SHELL requirements were roadmap prose with no gate. This is the phase's real deliverable.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T05:13:39.382Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 32,
    "kind": "unrun-verify",
    "phase": "04",
    "file": "web-dashboard/src/components/layout/AppLayout.jsx",
    "line": null,
    "description": "360/768/1280 click-through of the shell not run: the 288px rail, the 72px bar, the 1400px cap and the drawer's 19rem width must be checked at all three widths, including that the drawer does not overflow at 360px. jsdom applies no stylesheets, so it can prove the class and not the width. Owned by GATE-03 / human UAT.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T05:13:41.462Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 33,
    "kind": "unrun-verify",
    "phase": "04",
    "file": "web-dashboard/src/App.jsx",
    "line": null,
    "description": "360/768/1280 click-through of the new first paint not run: the product mark must sit centred with the announced sentence under it at every width. jsdom has no layout engine. Owned by GATE-03 / human UAT.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T05:13:45.056Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 34,
    "kind": "deviation",
    "phase": "05",
    "file": "web-dashboard/src/context/InsoleContext.jsx",
    "line": null,
    "description": "An orphaned Theme preference comment (was lines 178-185) documented a theme state that does not exist anywhere under src/. Removed in Batch 0 before the pages are rebuilt, because a page author reading it would have re-added a theme switch, which DESIGN.md:432 refuses as a dead control.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T07:43:17.507Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 35,
    "kind": "deviation",
    "phase": "05",
    "file": "web-dashboard/src/pages/ProfilePage.jsx",
    "line": null,
    "description": "An orphaned comment claimed this page carries the labelled theme control. The control does not exist; the page carries the language selector instead, which LANG-01 now removes too. Removed in Batch 0.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T07:43:17.693Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 36,
    "kind": "deviation",
    "phase": "05",
    "file": "web-dashboard/src/components/layout/LanguageToggle.jsx",
    "line": null,
    "description": "LANG-01 executed as option a1 (the user's choice): the toggle is deleted with all four mounts (rail, topbar, drawer, landing) and ProfilePage's own language picker. setLanguage stays on the context because two tests drive it and the sweep-wide a3 was declined; DICTIONARY.en (~360 lines) stays as dead weight by the same decision.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T07:43:17.874Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 37,
    "kind": "deviation",
    "phase": "05",
    "file": "web-dashboard/src/utils/i18n.js",
    "line": null,
    "description": "LANGUAGES is now a single-entry registry (id only). dictionaryKeys(), the id/en parity tests and t()'s lang parameter are untouched by decision.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T07:43:18.056Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 38,
    "kind": "deviation",
    "phase": "05",
    "file": "DESIGN.md",
    "line": null,
    "description": "DESIGN.md:326 named the topbar's account controls as (language, notifications, profile). After LANG-01 the clause names (notifications, profile) and records the switch's removal. Awaiting owner countersignature, non-blocking.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T07:43:18.260Z",
    "resolved_at": null,
    "milestone": "v1.0"
  },
  {
    "id": 39,
    "kind": "deviation",
    "phase": "05",
    "file": "docs/DESIGN-BRIEF",
    "line": null,
    "description": "The October design brief predates the redesign and contradicts the shipped product (bilingual ID/EN vs LANG-01, dark glassmorphism palette vs light-only, FloatingNavbar which no longer exists). A historical note in its header marks section 5's page inventory as the surviving authority and the rest as historical record.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-18T07:43:18.440Z",
    "resolved_at": null,
    "milestone": "v1.0"
  }
]
````
