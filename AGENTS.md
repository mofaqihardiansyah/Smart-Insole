# AGENTS.md

Operating rules for AI coding agents in this repository. This file defines
*how* to work here. `READY.md` holds verified environment facts and `TASK.md`
holds the work ledger. Only the user edits this file.

## Read order (mandatory)

1. `AGENTS.md` — this file.
2. `READY.md` — environment, stack, verified state. Trust it; do not re-audit.
3. `TASK.md` — what is done, in progress, and next.
4. `DESIGN.md` — only for UI and visual work.
5. Then open only the files the task actually needs.

Do not scan the whole repository, re-grep known facts, or produce an audit
before starting. If a material fact is missing from `READY.md`, read the one
file that owns it.

## Project map

| Path | Contents |
| --- | --- |
| `web-dashboard/` | React 18 + Vite 5 + Tailwind 3 + TypeScript dashboard (active workstream) |
| `firmware/` | ESP32 PlatformIO project (C++17): `src/main.cpp`, `src/RandomForest.cpp` |
| `models/` | `rf-model.json`, `training-data.json` |
| `scripts/` | `prepare-dataset.py`, `train-model.js`, `export-model-cpp.js` |
| `docs/` | Hardware spec, roadmap, model report, design brief |
| `datasets/` | DFN-DS, Figshare DFU, OptiTrack (large, local only) |
| `tasks/` | PRDs |

## Hard rules

- Do not commit unless the user asks. When asked, use Conventional Commits.
- Do not edit or delete `AGENTS.md`. Propose changes to the user instead.
- Do not install tools or packages silently. `pio` is absent on this machine;
  report that and continue with what exists.
- Never read, print, commit, or overwrite secrets: `firmware/include/config.h`
  and `web-dashboard/.env.local`. Only `.example` files are committed.
- UI copy is Indonesian only (`LANG-01`). The i18n dictionary holds English,
  but English is not a shipped surface.
- Do not add icon libraries. Use `lucide-react`, which is already installed.
- Do not hard-code colours or spacing. Use tokens from `tailwind.config.js`
  and `src/index.css`.
- Do not rewrite `DESIGN.md`, the historical `docs/DESIGN-BRIEF.md`, or PRDs
  to make a change fit.
- `web-dashboard/dist/` is tracked. Rebuild it only when the user asks.

## Anti over-analysis

Stop and ask before:

- touching more than 5 files;
- adding or removing a dependency;
- changing Firebase rules, data schema, or the auth flow;
- deleting files or moving directories;
- refactoring beyond the requested task.

Limits:

- one repository exploration pass; no repeated scans;
- one verification round per change set;
- no plan document unless asked;
- no speculative abstractions and no "while I'm here" cleanup.

## Verification gates (before hand-over)

Web (`web-dashboard/`):

```bash
npm test
npm run typecheck
npm run build
```

Firmware (`firmware/`):

```bash
pio test -e native    # if PlatformIO is missing: skip and say so
```

Docs: code fences balanced, internal links resolve, tables render.

A change is not done until its gate passes and `TASK.md` is updated.

## Code conventions

- TypeScript strict; shared contracts live in `src/types/`.
- React function components; hooks in `src/hooks/`, shared state in `src/context/`.
- Tests: Vitest, colocated as `*.test.*`.
- Firmware: C++17; inference stays dependency-free in `RandomForest.cpp`.
- UI work: read `DESIGN.md` first; verify at 360px, 768px, and 1280px.
- Comments stay factual; no commented-out code.

## Definition of done

1. Requested behaviour implemented as the smallest sufficient change.
2. The gate for the touched area passes.
3. `TASK.md` updated (Done entry with date and commit hash or `(working tree)`).
4. `READY.md` updated only if environment, stack, or paths changed.
5. Hand-over states what changed, the proof, and any unresolved risk.
