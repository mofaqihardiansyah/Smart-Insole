---
schema_version: 1
open_count: 5
waived_count: 0
fixed_count: 1
total_count: 6
last_updated: 2026-10-17T13:25:11.000Z
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
    "description": "The 02-04 plan's <automated> commands embed an unquoted absolute path containing a space, which fails as `cd: too many arguments`. Recurrence of the same plan-template defect recorded for 02-02. Commands were run with the shell workdir / a quoted path instead; the plan file was not edited.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-17T13:25:11.000Z",
    "resolved_at": null,
    "milestone": "v1.0"
  }
]
````
