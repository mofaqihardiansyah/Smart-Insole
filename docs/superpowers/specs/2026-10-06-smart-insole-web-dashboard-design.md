# Specification: Smart Insole IoT Web Dashboard

**Date:** 2026-10-06  
**Status:** Approved for Implementation Planning  
**Reference Design:** Google Stitch Project "TUGAS AKHIR" (ID: `16236079672903425797`, Style: *Cinematic Precision*)  

---

## 1. Overview & Objectives

The **Smart Insole IoT Web Dashboard** is a cross-platform progressive web application built to monitor plantar pressure distributions (*forefoot*, *midfoot*, *heel*) and early warning risk states in patients with Diabetic Peripheral Neuropathy (DPN). The application helps prevent Diabetic Foot Ulcers (DFU) by analyzing continuous pressure magnitude (kPa) and sustained loading duration.

### Key Objectives
1. **Real-time Plantar Heatmap**: Visual anatomical SVG projection reflecting localized pressure across 3 sensor points.
2. **Embedded & Client Risk Classification**: Display risk tiers (**Aman / Safe**, **Waspada / Warning**, **Bahaya / Danger**) with Fuzzy inference risk scores (0–100).
3. **Early Warning System (EWS)**: Auditory alert synthesization (Web Audio API) and visual alarm modal when prolonged critical pressure is detected.
4. **Bilingual Support (i18n)**: Seamless instant toggling between **Bahasa Indonesia** and **English** for academic presentations, clinical evaluation, and international reviews.
5. **Hybrid Data Engine**: Simultaneous support for real-time Firebase Realtime Database ingestion and an interactive on-screen hardware simulator for demonstrations.
6. **Design Fidelity**: Complete visual alignment with the "Cinematic Precision" dark theme aesthetic established in Stitch.

---

## 2. Design System & Theming

Adopted directly from the Stitch *Cinematic Precision* design tokens:

### 2.1 Color Palette
- **Background Base**: `#131314` (Deep canvas)
- **Surface Panels**: `#101112` (Cards and widgets), `#151617` (Telemetry frames)
- **Borders & Dividers**: `#1B1C1E` (Internal dividers), `#232426` (Card boundaries)
- **Primary Accent**: `#5E6BFF` (Buttons, active tabs, primary indicators)
- **Secondary Accent (Cyan Telemetry)**: `#50D8E9` (Signals, live graph, forefoot sensor)
- **Tertiary Accent (Violet/Peach)**: `#7A85FF` (Midfoot sensor), `#FFB689` (Heel sensor)
- **Risk Status Colors**:
  - Safe / Aman: `#10B981` (Emerald green, glowing dot)
  - Warning / Waspada: `#F59E0B` (Amber yellow)
  - Danger / Bahaya: `#EF4444` / `#FFB4AB` (Critical red, pulsing animation)
- **Text & Foreground**:
  - Primary: `#E5E2E3`
  - Secondary/Muted: `#C6C5D8` / `#8F8FA1`

### 2.2 Typography & Icons
- **Headings**: Manrope (Weight 520 / 700) with `-0.04em` tracking
- **Body & Data**: Inter (`mono-data` with tabular lining for kPa metrics)
- **Iconography**: Google Material Symbols Outlined

---

## 3. Architecture & Routing

The application operates as a responsive client-side Single-Page Application with lightweight client-side routing to separate focused views without severing the persistent background telemetry stream:

```text
               ┌────────────────────────────────────────────────────────┐
               │              InsoleContext (Global Provider)           │
               │  - Firebase Listener / Simulated Engine                │
               │  - Web Audio API Alarm Synthesizer                     │
               │  - Language State (id / en)                            │
               │  - Telemetry Ring Buffer (last 30 samples)             │
               └──────────────────────────┬─────────────────────────────┘
                                          │
                   ┌──────────────────────┴──────────────────────┐
                   │               AppShell Layout               │
                   │  - Desktop Sidebar / Mobile Bottom Nav      │
                   │  - Topbar (Battery, Connection, Audio, Lang)│
                   └──────────────────────┬──────────────────────┘
                                          │
             ┌────────────────────────────┼────────────────────────────┐
             ▼                            ▼                            ▼
      / (Live Telemetry)         /history (Signals & Logs)   /settings (Clinical & DB)
   - Plantar Heatmap SVG         - Multi-sensor Live Chart    - DFU Threshold Settings
   - StatusCard & Risk Badge     - Incident Alarm Log Table   - Foot Anatomy Education
   - Live KPI Metrics            - Session Summary Stats      - Firebase Config Check
   - On-screen Simulator
```

---

## 4. Detailed Component Specifications

### 4.1 Global Context (`InsoleContext`)
- **State Properties**:
  - `readings`: `{ forefoot: number, midfoot: number, heel: number, peakPressure: number, sustainedDuration: number }`
  - `risk`: `{ level: 'SAFE' | 'WARNING' | 'DANGER', score: number, message: string }`
  - `source`: `'FIREBASE' | 'SIMULATOR'`
  - `isMuted`: `boolean` (persisted in localStorage)
  - `language`: `'id' | 'en'` (persisted in localStorage)
  - `batteryLevel`: `number` (percentage 0–100%)
  - `history`: Array of past 30 data packets for live charting
  - `incidentLogs`: Array of timestamped warning/danger events
- **Audio Synthesizer**: Uses `AudioContext` oscillator emitting pulse tones (440Hz / 880Hz alert beeps) during `WARNING` and `DANGER` states unless `isMuted` is true.

### 4.2 Bilingual Translation Dictionary (`src/utils/i18n.js`)
Comprehensive key-value pairs supporting both Indonesian and English:
- Navigation titles (`command`, `signals`, `settings`)
- Metric labels (`signalUptime`, `approvalLatency`, `peakPressure`, `sustainedTime`)
- Risk levels (`safe`: "Aman" / "Safe", `warning`: "Waspada" / "Warning", `danger`: "Bahaya" / "Danger")
- Anatomical positions (`forefoot`: "Kaki Depan", `midfoot`: "Kaki Tengah", `heel`: "Tumit")
- Simulator controls and clinical guidelines.

### 4.3 Plantar Heatmap (`src/components/PlantarHeatmap.jsx`)
- Scalable SVG anatomical foot outline (sole perimeter + toe pads).
- 3 dynamic radial gradient heat nodes positioned at:
  - Forefoot (Metatarsal head: `cx="50%" cy="30%"`)
  - Midfoot (Lateral arch: `cx="42%" cy="55%"`)
  - Heel (Calcaneus: `cx="50%" cy="80%"`)
- Gradients adapt in real time:
  - `< 30 kPa`: Transparent to soft cyan
  - `30 - 70 kPa`: Cyan to yellow-orange
  - `> 70 kPa`: Orange to intense pulsing red
- Interactive hover tooltips displaying exact pressure values in kPa.

### 4.4 Status & Telemetry Cards
- **StatusCard**:
  - Prominent risk badge with status indicator dot.
  - Risk score bar (0–100) derived from Fuzzy logic inference.
  - Contextual advice (e.g., *"Silakan kurangi tumpuan pada tumit"* / *"Please relieve heel pressure"*).
- **KPI Metrics Row**:
  - Peak Pressure (kPa) with delta indicator.
  - Sustained Pressure Duration (seconds) with visual progress bar toward warning threshold (30s).
  - Active Sensor Balance (% distribution Forefoot vs Midfoot vs Heel).

### 4.5 Telemetry Waveform (`src/components/TelemetryChart.jsx`)
- Canvas or SVG polyline rendering the 30-sample sliding buffer.
- 3 distinct color-coded curves:
  - Forefoot: Cyan (`#50D8E9`)
  - Midfoot: Violet (`#7A85FF`)
  - Heel: Amber/Peach (`#FFB689`)
- Threshold boundary line at 70 kPa indicating ulcer danger boundary.

### 4.6 Simulator Control Panel (`src/components/SimulatorControl.jsx`)
- Quick-toggle drawer/card accessible from the dashboard.
- Mode Selector: `Normal Walking Gait`, `Forefoot Overload`, `Prolonged Standing (Danger Trigger)`, `Resting/Unloaded`.
- Manual sliders for fine-tuning Forefoot, Midfoot, Heel, and Duration inputs.

### 4.7 Early Warning Alert Modal (`src/components/AlertModal.jsx`)
- Triggered automatically when sustained loading in Warning or Danger state exceeds safe window.
- Displays flashing red/amber border, pressure point illustration, and button to acknowledge/silence.

---

## 5. Firebase Realtime Database Structure

```json
{
  "readings": {
    "latest": {
      "deviceId": "insole-01",
      "timestamp": 1791244800000,
      "forefoot_kpa": 42.5,
      "midfoot_kpa": 18.2,
      "heel_kpa": 84.1,
      "sustained_duration_sec": 35,
      "fuzzy_risk_score": 82.4,
      "risk_status": "DANGER",
      "battery_percent": 94
    },
    "history": {
      "-OXXXXXXX": {
        "timestamp": 1791244800000,
        "forefoot_kpa": 42.5,
        "midfoot_kpa": 18.2,
        "heel_kpa": 84.1,
        "risk_status": "DANGER"
      }
    }
  }
}
```

---

## 6. Implementation Strategy

1. **Scaffold Vite Project**: Initialize React with Tailwind CSS configured with the Stitch color palette and fonts.
2. **Implement Internationalization (`i18n.js`)**: Establish all bilingual strings upfront.
3. **Build Core Provider & Synthesizer**: Create `InsoleContext.jsx` with audio oscillators and dual-mode data generator.
4. **Develop Visual Components**: Build `PlantarHeatmap.jsx`, `StatusCard.jsx`, `TelemetryChart.jsx`, `SimulatorControl.jsx`, and `AlertModal.jsx`.
5. **Assemble Page Views**: Construct `Dashboard.jsx`, `History.jsx`, and `Settings.jsx` inside the responsive `AppShell`.
6. **Integrate Firebase**: Wire `src/config/firebase.js` to live database listeners when valid credentials exist, gracefully defaulting to Simulator mode otherwise.
7. **Verification**: Verify responsive rendering, simulator reactivity, audio synthesizer, and language switching.
