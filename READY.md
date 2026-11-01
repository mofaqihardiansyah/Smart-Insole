# READY.md

Verified environment and repository state. Read this before exploring.
Snapshot: **1 November 2026**. Update only when a fact changes.

## Runtime

| Tool | Version / status |
| --- | --- |
| Node.js | v26.7.0 |
| npm | 12.0.2 |
| PlatformIO (`pio`) | **not installed** on this machine |
| PlatformIO envs | `esp32dev` (hardware), `native` (Unity unit tests) |
| Git branch | `main` |

## Stack

- **Web**: React 18, Vite 5, Tailwind CSS 3, TypeScript (strict), React Router,
  lucide-react, Vitest.
- **Firmware**: ESP32-WROOM-32, Arduino framework, C++17, Firebase Arduino
  Client Library `^4.4.14`.
- **Cloud**: Firebase Realtime Database (project `sole-3b2e8`), Auth,
  Firestore, Storage.
- **Model**: Random Forest hybrid with clinical rules; artifacts as JSON and as
  a C++ header.

## Where things live

| Path | Contents |
| --- | --- |
| `web-dashboard/src/pages/` | 12 route pages (`DashboardPage.tsx`, `AdminPage.tsx`, ...) |
| `web-dashboard/src/components/` | `layout/`, `dashboard/`, `monitoring/`, `ui/`, `auth/`, `landing/`, `PlantarHeatmap.tsx` |
| `web-dashboard/src/context/` | `InsoleContext.tsx` (readings + risk + source), `UserContext.tsx` |
| `web-dashboard/src/services/` | `firebaseConfig.ts`, `firebaseRealtime.ts` |
| `web-dashboard/src/utils/` | `randomForestRisk.ts`, `rf-model.json`, `i18n.ts`, `audioAlert.ts`, `exportCsv.ts` |
| `web-dashboard/src/hooks/` | `useAuth.ts` |
| `web-dashboard/src/types/` | Shared TypeScript contracts |
| `firmware/src/` | `main.cpp`, `RandomForest.cpp` |
| `firmware/include/` | `config.h.example`, `RandomForest.h`, `rf-model-data.h` |
| `firmware/test/` | `test_randomforest.cpp` |
| `models/` | `rf-model.json`, `training-data.json` |
| `scripts/` | `prepare-dataset.py`, `train-model.js`, `export-model-cpp.js` |
| `datasets/` | `dfn-ds/` (273 MB), `optitrack/` (84 MB), `figshare-dfu/` (32 KB) |

## Current state (as of 1 Nov 2026)

- TypeScript migration of the web app is complete for source files. There are
  44 test files: 28 `.test.jsx` and 16 `.test.js`; none are migrated to TS yet
  (kept on purpose, see `375267a6`).
- `web-dashboard/dist/` is tracked in git (10 files). Do not rebuild or patch
  it unless the user asks.
- Firebase project `sole-3b2e8`; rules live in `database.rules.json`,
  `firestore.rules`, `storage.rules`, wired through `firebase.json`.
- `web-dashboard/public/` contains `icon.svg` and `manifest.webmanifest`.
- UI ships Indonesian only (`LANG-01`); the i18n dictionary keeps ID + EN.
- Model is hybrid: `danger` is rule-based (peak ≥ 70 kPa and sustained ≥ 0.1 s),
  Random Forest separates `safe` / `warning`.
- `DISCUSSION-GUIDE.md` is git-ignored (personal working note, not in history).

## Known gaps

- PlatformIO is absent: firmware build and test cannot run here. Say so; do not
  install it silently.
- Vitest is the only executable proof for web. Browser checks are manual.
- `docs/DESIGN-BRIEF.md` is historical. `DESIGN.md` is the design authority.
- `docs/HARDWARE-SPEC.md` is still marked Draft.

## Secrets policy

Names only, never values: `VITE_FIREBASE_*`, `WIFI_SSID`, `WIFI_PASSWORD`,
`FIREBASE_HOST`, `FIREBASE_AUTH`. Real files are `web-dashboard/.env.local`
and `firmware/include/config.h`, both git-ignored.

## Fast start

```bash
cd web-dashboard
npm install        # only if node_modules is missing
npm run dev        # http://localhost:5173
```

Do not re-verify the facts above. If one is wrong, fix this file in the same
change that proves it wrong.
