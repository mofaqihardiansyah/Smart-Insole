# Smart Insole Web Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-grade, bilingual (ID/EN) responsive Web Dashboard (React.js + Tailwind CSS) for Smart Insole Plantar Pressure monitoring featuring interactive SVG heatmaps, on-device/client Fuzzy risk assessment, early warning audio synthesizer alarms, and dual Firebase/Simulator data modes based on the Stitch "Cinematic Precision" design system.

**Architecture:** A client-side React SPA with a centralized `InsoleContext` managing live sensor streams (Forefoot, Midfoot, Heel), risk state derivation, audio synthesizer alerting, bilingual translations, and a 30-sample ring buffer. The shell provides desktop sidebar navigation and mobile bottom navigation across 3 modular views: Live Telemetry (`/`), Signals & History (`/history`), and Clinical Settings (`/settings`).

**Tech Stack:** React 18 / 19, Vite, Tailwind CSS, Lucide / Material Symbols, Web Audio API, Firebase SDK v10+, Vitest, React Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-06-smart-insole-web-dashboard-design.md`

## Global Constraints

- Root background: `#131314` (Deep canvas), Card surface: `#101112` / `#151617`, Border: `#1B1C1E` / `#232426`.
- Accent colors: Primary `#5E6BFF`, Cyan Telemetry `#50D8E9`, Violet `#7A85FF`, Peach `#FFB689`.
- Typography: Manrope (Headings), Inter (Body & `mono-data`).
- Language: Instant switcher supporting Bahasa Indonesia (`id`) and English (`en`) with persistent storage in `localStorage`.
- Audio alarm: Synthesized via native Web Audio API (`AudioContext`), zero external mp3 dependencies, respects mute toggle.
- Dual Data Mode: Works seamlessly in offline Simulation Mode without Firebase keys, and automatically connects to Firebase Realtime Database when configured.

## Review Focus

- Unconfigured Firebase credentials must not crash the app; it must gracefully fallback to Simulator Mode with an informational banner.
- Rapid switching between Bahasa Indonesia and English must update all UI labels instantaneously without re-rendering or resetting live sensor buffers.
- Sustained high pressure (>70 kPa) lasting past threshold (30s) must trigger both the visual AlertModal and synthesized audio alert.
- Plantar Heatmap SVG must render correctly with reactive radial gradients on both mobile screen widths (360px) and desktop (1280px+).
- Audio alert must remain silent if user clicked "Mute" in the top bar.

---

### Task 1: Project Scaffolding & Tailwind Theming

**Files:**
- Create: `web-dashboard/package.json`
- Create: `web-dashboard/vite.config.js`
- Create: `web-dashboard/tailwind.config.js`
- Create: `web-dashboard/postcss.config.js`
- Create: `web-dashboard/index.html`
- Create: `web-dashboard/src/index.css`
- Test: `web-dashboard/src/App.test.jsx`

**Interfaces:**
- Produces: Tailwind classes (`bg-background`, `text-on-background`, `font-h1`, `font-mono-data`, `bg-secondary`, etc.) configured according to Stitch tokens.

- [ ] **Step 1: Write setup test verifying testing framework works**
- [ ] **Step 2: Initialize `package.json` with React, Vite, Tailwind CSS, Vitest, and testing libraries**
- [ ] **Step 3: Configure `tailwind.config.js` with Stitch "Cinematic Precision" color palette and typography**
- [ ] **Step 4: Create `index.html` including Google Fonts (Manrope, Inter) and Material Symbols**
- [ ] **Step 5: Run `npm install` and verify `npm test` runs cleanly**
- [ ] **Step 6: Commit**

```bash
git add web-dashboard/
git commit -m "chore(web): scaffold Vite project with Tailwind and Stitch design tokens"
```

---

### Task 2: Bilingual Translation Dictionary (i18n)

**Files:**
- Create: `web-dashboard/src/utils/i18n.js`
- Test: `web-dashboard/src/utils/i18n.test.js`

**Interfaces:**
- Produces: `t(key: string, lang: 'id' | 'en'): string`
- Produces: `DICTIONARY` object containing translation pairs for all dashboard modules.

- [ ] **Step 1: Write unit tests in `i18n.test.js` checking dictionary completeness for both 'id' and 'en'**
- [ ] **Step 2: Implement translation dictionary and helper `t(key, lang)` covering navigation, metrics, risk states, anatomical names, and alerts**
- [ ] **Step 3: Run `npx vitest run src/utils/i18n.test.js` and verify PASS**
- [ ] **Step 4: Commit**

```bash
git add web-dashboard/src/utils/i18n.js web-dashboard/src/utils/i18n.test.js
git commit -m "feat(web): add bilingual translation dictionary (ID/EN)"
```

---

### Task 3: Web Audio Alarm Synthesizer

**Files:**
- Create: `web-dashboard/src/utils/audioAlert.js`
- Test: `web-dashboard/src/utils/audioAlert.test.js`

**Interfaces:**
- Produces: `playAlertBeep(level: 'WARNING' | 'DANGER'): void`
- Produces: `stopAlertBeep(): void`

- [ ] **Step 1: Write unit tests testing audio alert trigger and mute logic with mocked AudioContext**
- [ ] **Step 2: Implement `playAlertBeep` using Web Audio API oscillator (Warning: 440Hz intermittent, Danger: 880Hz rapid pulse)**
- [ ] **Step 3: Run `npx vitest run src/utils/audioAlert.test.js` and verify PASS**
- [ ] **Step 4: Commit**

```bash
git add web-dashboard/src/utils/audioAlert.js web-dashboard/src/utils/audioAlert.test.js
git commit -m "feat(web): add Web Audio API synthesized early warning alarm"
```

---

### Task 4: Global Insole Context & Simulator Engine

**Files:**
- Create: `web-dashboard/src/context/InsoleContext.jsx`
- Test: `web-dashboard/src/context/InsoleContext.test.jsx`

**Interfaces:**
- Produces: `useInsole(): { readings, risk, source, setSource, isMuted, toggleMute, language, setLanguage, activeTab, setActiveTab, simulationScenario, setSimulationScenario, history, incidentLogs }`

- [ ] **Step 1: Write test verifying state initialization, language persistence, simulation switching, and ring buffer tracking**
- [ ] **Step 2: Implement `InsoleProvider` with dual-mode ingestion, fuzzy risk categorization (Aman < 35 kPa, Waspada 35-70 kPa or duration > 20s, Bahaya > 70 kPa & duration > 30s)**
- [ ] **Step 3: Run `npx vitest run src/context/InsoleContext.test.jsx` and verify PASS**
- [ ] **Step 4: Commit**

```bash
git add web-dashboard/src/context/
git commit -m "feat(web): add InsoleContext with dual data engine and risk classification"
```

---

### Task 5: Plantar Heatmap SVG Component

**Files:**
- Create: `web-dashboard/src/components/PlantarHeatmap.jsx`
- Test: `web-dashboard/src/components/PlantarHeatmap.test.jsx`

**Interfaces:**
- Consumes: `useInsole().readings`
- Produces: `<PlantarHeatmap showLabels={boolean} />`

- [ ] **Step 1: Write test checking SVG rendering of sole outline and the 3 reactive pressure nodes (Forefoot, Midfoot, Heel)**
- [ ] **Step 2: Implement anatomical foot SVG with dynamic radial gradients, Gaussian blur filters, and kPa value tooltips**
- [ ] **Step 3: Run `npx vitest run src/components/PlantarHeatmap.test.jsx` and verify PASS**
- [ ] **Step 4: Commit**

```bash
git add web-dashboard/src/components/PlantarHeatmap.jsx web-dashboard/src/components/PlantarHeatmap.test.jsx
git commit -m "feat(web): build anatomical SVG plantar heatmap with dynamic pressure gradients"
```

---

### Task 6: Metric Cards, Status Card, and Alert Modal

**Files:**
- Create: `web-dashboard/src/components/StatusCard.jsx`
- Create: `web-dashboard/src/components/MetricCards.jsx`
- Create: `web-dashboard/src/components/AlertModal.jsx`
- Test: `web-dashboard/src/components/StatusCard.test.jsx`

**Interfaces:**
- Produces: `<StatusCard />`, `<MetricCards />`, `<AlertModal />`

- [ ] **Step 1: Write tests for StatusCard risk badges (Aman, Waspada, Bahaya) and AlertModal auto-triggering on Danger**
- [ ] **Step 2: Implement `StatusCard` with score gauge and glowing dot indicator**
- [ ] **Step 3: Implement `MetricCards` showing Peak Pressure (kPa), Sustained Time (s), and Balance (%)**
- [ ] **Step 4: Implement `AlertModal` with dismissal button and audio acknowledge**
- [ ] **Step 5: Run `npx vitest run src/components/StatusCard.test.jsx` and verify PASS**
- [ ] **Step 6: Commit**

```bash
git add web-dashboard/src/components/StatusCard* web-dashboard/src/components/MetricCards* web-dashboard/src/components/AlertModal*
git commit -m "feat(web): add StatusCard, MetricCards, and EarlyWarningAlert modal"
```

---

### Task 7: Telemetry Chart & Simulator Control Drawer

**Files:**
- Create: `web-dashboard/src/components/TelemetryChart.jsx`
- Create: `web-dashboard/src/components/SimulatorControl.jsx`
- Test: `web-dashboard/src/components/TelemetryChart.test.jsx`

**Interfaces:**
- Produces: `<TelemetryChart />` (multi-line live SVG chart for Forefoot, Midfoot, Heel)
- Produces: `<SimulatorControl />` (preset scenarios: Normal Gait, Heel Danger, Forefoot Spike, Standing)

- [ ] **Step 1: Write tests for TelemetryChart rendering SVG data points from history**
- [ ] **Step 2: Implement `TelemetryChart` with gridlines and threshold indicator**
- [ ] **Step 3: Implement `SimulatorControl` with scenario selector and manual pressure sliders**
- [ ] **Step 4: Run `npx vitest run src/components/TelemetryChart.test.jsx` and verify PASS**
- [ ] **Step 5: Commit**

```bash
git add web-dashboard/src/components/TelemetryChart* web-dashboard/src/components/SimulatorControl*
git commit -m "feat(web): add live telemetry waveform chart and simulator controls"
```

---

### Task 8: App Navigation Shell & Page Views

**Files:**
- Create: `web-dashboard/src/components/AppShell.jsx`
- Create: `web-dashboard/src/pages/Dashboard.jsx`
- Create: `web-dashboard/src/pages/History.jsx`
- Create: `web-dashboard/src/pages/Settings.jsx`
- Modify: `web-dashboard/src/App.jsx`
- Test: `web-dashboard/src/App.test.jsx`

**Interfaces:**
- Produces: Fully interactive responsive application with Desktop Sidebar, Mobile Bottom Bar, Topbar (Battery, Connection, Audio Mute, Language Selector).

- [ ] **Step 1: Write test testing view navigation between Dashboard, History, and Settings**
- [ ] **Step 2: Implement `AppShell` with Stitch styling (Desktop Sidebar + Mobile Bottom Nav)**
- [ ] **Step 3: Implement `Dashboard` page (Heatmap + StatusCard + Metrics + Telemetry)**
- [ ] **Step 4: Implement `History` page (Historical trend + Incident log table)**
- [ ] **Step 5: Implement `Settings` page (Clinical DFU guidelines + Firebase status check)**
- [ ] **Step 6: Run `npm test` and verify all tests PASS**
- [ ] **Step 7: Commit**

```bash
git add web-dashboard/src/
git commit -m "feat(web): assemble AppShell, Dashboard, History, and Settings pages"
```

---

### Task 9: Firebase Service & Production Build Verification

**Files:**
- Create: `web-dashboard/src/config/firebase.js`
- Test: `web-dashboard/src/config/firebase.test.js`

**Interfaces:**
- Produces: `initFirebaseListener(onData: (data) => void): () => void`

- [ ] **Step 1: Implement `src/config/firebase.js` with graceful fallback when `VITE_FIREBASE_API_KEY` is not configured**
- [ ] **Step 2: Connect Firebase listener in `InsoleContext.jsx` when source is 'FIREBASE'**
- [ ] **Step 3: Run `npm run build` in `web-dashboard/` to verify zero build errors and optimize asset bundling**
- [ ] **Step 4: Verify end-to-end responsiveness and bilingual toggles in preview server**
- [ ] **Step 5: Commit final implementation**

```bash
git add web-dashboard/
git commit -m "feat(web): complete Firebase service integration and verify production build"
```
