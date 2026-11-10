# READY.md

Verified environment and repository state. Read this before exploring.
Snapshot: **10 November 2026**. Update only when a fact changes.

## Runtime

| Tool | Version / status |
| --- | --- |
| Node.js | v26.7.0 |
| npm | 12.0.2 |
| Python | 3.14.9 (`openpyxl` 3.1.5 present; `pandas` absent) |
| PlatformIO (`pio`) | Core 6.2.0, two copies: `~/.platformio/penv/bin/pio` (used for builds) and `~/.venvs/platformio/bin/pio`; neither is on `PATH` |
| PlatformIO envs | `esp32dev` (hardware), `native` (Unity unit tests) |
| Git branch | `main` |

## Stack

- **Web**: React 18, Vite 5, Tailwind CSS 3, TypeScript (strict), React Router,
  lucide-react, Vitest.
- **Firmware**: ESP32-WROOM-32, Arduino framework, C++17, Firebase Arduino
  Client Library `^4.4.14`.
- **Cloud**: Firebase Realtime Database (project `sole-3b2e8`), Auth,
  Firestore, Storage.
- **Model**: Random Forest (20 trees) for `safe` / `warning` plus a clinical
  rule for `danger`; artifacts as JSON and as a C++ header.

## Where things live

| Path | Contents |
| --- | --- |
| `web-dashboard/src/pages/` | 13 route pages (`NotificationsPage` only redirects) + `admin/` (5 konsol) |
| `web-dashboard/src/components/` | `layout/`, `dashboard/`, `monitoring/`, `ui/`, `auth/`, `landing/`, `PlantarHeatmap.tsx` |
| `web-dashboard/src/context/` | `InsoleContext.tsx` (readings + risk + source), `UserContext.tsx` |
| `web-dashboard/src/services/` | `firebaseConfig.ts`, `firebaseRealtime.ts` |
| `web-dashboard/src/utils/` | `randomForestRisk.ts`, `incidents.ts`, `rf-model.json`, `i18n.ts`, `audioAlert.ts`, `exportCsv.ts`, `authErrors.ts`, `adminErrors.ts` |
| `web-dashboard/src/hooks/` | `useAuth.ts`, `useLandingMotion.ts` |
| `web-dashboard/src/types/` | Shared TypeScript contracts |
| `firmware/src/` | `main.cpp`, `RandomForest.cpp` |
| `firmware/include/` | `config.h.example`, `RandomForest.h`, `rf-model-data.h` |
| `firmware/test/` | `test_randomforest.cpp` |
| `models/` | `rf-model.json`, `training-data.json` |
| `scripts/` | `prepare-dataset.py`, `train-model.js`, `export-model-cpp.js`, `validate-datasets.py`, `prepare-session-dataset.py`, `train-session-model.js`, `lib/forest.js` |
| `datasets/` | `dfn-ds/` (273 MB), `optitrack/` (84 MB), `figshare-dfu/` (32 KB) |
| `design/` | `smart-insole-dashboard.figcraft` (FigCraft: dashboard 1440 + 375) |

## Current state (as of 10 Nov 2026)

- The admin console lives at `/admin/*` (`pages/admin/`) with its own
  `AdminLayout` and `RequireAdmin`; `/admin` is no longer part of the patient
  navigation or the patient shell.
- TypeScript migration of the web app is complete for source files. There are
  50 test files: 32 `.test.tsx`, 2 `.test.ts`, and 16 `.test.js` (the plain-JS
  ones are kept on purpose, see `375267a6`).
- The landing's motion is CSS only, documented as a timing table in `DESIGN.md`
  (ADR-016): `landing/` owns its content and sections, `useLandingMotion.ts`
  owns the reveal observer, the drift loop and the nav state. `framer-motion`
  is still in `package.json` but imported nowhere, and `shell.test.tsx` fails
  any import of it, so app pages cannot regain entrance animation.
- Console failures render as cause + next step from `utils/adminErrors.ts`, never
  the SDK message; a write that landed but whose mirror or audit entry did not
  is reported as a warning, not a failure.
- `web-dashboard/dist/` is tracked in git (10 files). Do not rebuild or patch
  it unless the user asks.
- Firebase project `sole-3b2e8`; rules live in `database.rules.json`,
  `firestore.rules`, `storage.rules`, wired through `firebase.json`.
- `web-dashboard/public/` contains `icon.svg` and `manifest.webmanifest`.
- UI ships Indonesian only (`LANG-01`); the i18n dictionary keeps ID + EN.
- Model is Random Forest + clinical rule: the forest separates `safe` /
  `warning`; `danger` is rule-based (`peak >= 200 kPa` on one sample). Warning
  is `peak >= 35 kPa` sustained 20 s (200 samples at 10 Hz).
- Firmware is flashed and boots clean: WiFi joins, Firebase is configured,
  `RandomForest model loaded (20 trees)`, and live samples print with
  `warning`/`safe` transitions. Sensor calibration is still the template
  default (`ADC_OFFSET 0.0f`, `ADC_TO_KPA 0.085f`), so unloaded readings jump
  between 0 and ~125 kPa.
- `firmware/platformio.ini` pins `[platformio] default_envs = esp32dev`;
  without it `pio run` also builds `native`, which has no `main()` and fails to
  link. Native tests still run through `pio test -e native`.
- `DISCUSSION-GUIDE.md` is git-ignored (personal working note, not in history).

## Known gaps

- PlatformIO is not on `PATH`; call `~/.platformio/penv/bin/pio` by full path.
  Build, native tests, and USB flash were verified 8 Nov 2026 on an
  ESP32-D0WD-V3 (CP2102, `/dev/ttyUSB0`, `10C4:EA60`). `qihh` is in `uucp`,
  so the port is writable after a fresh login; a session started before the
  group change still needs `sudo chmod a+rw /dev/ttyUSB0`. `upload_speed` is
  **460800** because 921600 fails with `Unable to verify flash chip
  connection`. Flash usage is 83.1% of 1.25 MB (`1089753 / 1310720` bytes);
  `board_build.partitions = huge_app.csv` is the escape hatch if it overflows.
- Vitest is the only executable proof for web. Browser checks are manual.
- The design fonts `DM Sans` and `Plus Jakarta Sans` are not installed on this
  machine and FigCraft font download is disabled, so the design artifact in
  `design/` uses `Inter` and `Fira Code` instead. The shipped web app still
  declares the real families in `src/index.css`.
- `docs/DESIGN-BRIEF.md` is historical. `DESIGN.md` is the design authority.
- `docs/HARDWARE-SPEC.md` is still marked Draft.
- Profile-photo upload needs a provisioned Storage bucket; it was deferred
  pending the Blaze plan (reported, not verifiable from this machine). The
  Storage rules are versioned, but nothing proves the bucket exists.

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
