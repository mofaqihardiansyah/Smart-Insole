---
schema_version: 1
open_count: 0
waived_count: 0
fixed_count: 1
total_count: 1
last_updated: 2026-10-17T12:10:43.897Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 02 | deviation | web-dashboard/src/components/PlantarHeatmap.test.jsx |  | Rule 1 fix: the label-switch case asserted the pre-D-06 hydration contract, so it was inverted in the same commit as the reader change | fixed |  | 2026-10-17T12:10:29.031Z | 2026-10-17T12:10:43.897Z |

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
  }
]
````
