# Smart Insole IoT — Sistem Pemantauan Tekanan Plantar

> **Rancang Bangun Smart Insole Berbasis IoT Menggunakan Metode Random Forest untuk Monitoring Tekanan Plantar Pasien Diabetes Mellitus Menggunakan Platform Web**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Framework: React](https://img.shields.io/badge/Frontend-React.js-61DAFB?logo=react)](https://reactjs.org/)
[![Styling: Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38BDF8?logo=tailwindcss)](https://tailwindcss.com/)
[![Database: Firebase](https://img.shields.io/badge/Cloud-Firebase_Realtime_DB-FFCA28?logo=firebase)](https://firebase.google.com/)
[![Hardware: ESP32](https://img.shields.io/badge/Hardware-ESP32-000000?logo=espressif)](https://www.espressif.com/)

## Daftar Isi

- [Deskripsi Proyek](#deskripsi-proyek)
- [Fitur Utama](#fitur-utama)
- [Tech Stack](#tech-stack)
- [Arsitektur & Alur Data](#arsitektur--alur-data)
- [Struktur Folder](#struktur-folder)
- [Panduan Memulai (Quick Start)](#panduan-mulai-quick-start)
- [Dokumentasi](#dokumentasi)
- [Catatan Keamanan](#catatan-keamanan)
- [Lisensi](#lisensi)

## Deskripsi Proyek

**Smart Insole IoT** adalah sistem pemantauan tekanan telapak kaki (_plantar
pressure_) secara _real-time_ yang terdiri dari perangkat keras tertanam
(_embedded system_) dan aplikasi web. Sistem ini dirancang untuk membantu
penderita **Diabetes Mellitus (DM)** yang mengalami _Diabetic Peripheral
Neuropathy_ (DPN) — hilangnya _loss of protective sensation_ — dalam mencegah
terjadinya **Ulkus Kaki Diabetik (_Diabetic Foot Ulcer_ / DFU)**.

Sistem menggunakan **3 sensor Force Sensitive Resistor (FSR 402 Series)** pada
titik anatomis kritis (_forefoot_, _midfoot_, _heel_) dan dikendalikan oleh
mikrokontroler **ESP32**. Model **Random Forest** dilatih pada _dataset_
tekanan plantar pasien diabetes (DFN-DS, 135 pasien) untuk mengevaluasi
kombinasi besaran tekanan (kPa) dan durasi tumpuan (_sustained pressure
duration_) ke dalam 3 kategori tingkat risiko: **Aman**, **Waspada**, dan
**Bahaya**. Data ditransmisikan nirkabel ke **Google Firebase Realtime
Database** dan ditayangkan pada **Web Dashboard Multiplatform (_Mobile-First
Responsive Design_)**.

## Fitur Utama

- **Real-time Plantar Heatmap** — visualisasi gradasi warna kontur tekanan
  telapak kaki secara langsung di layar browser, baik HP maupun PC
  (komponen SVG `PlantarHeatmap`).
- **Random Forest Risk Assessment** — klasifikasi risiko berbasis _machine
  learning_ (hybrid Random Forest + rule klinis) yang dilatih dari data pasien
  diabetes asli, dijalankan di sisi client tanpa pemrosesan _server-side_.
- **Sustained Pressure Monitoring** — mengukur akumulasi durasi waktu tumpuan
  berulang untuk mencegah pembentukan lesi jaringan lunak.
- **Early Warning System (EWS)** — pemicuan notifikasi web (_Web Notification
  API_) dan alarm audio (_Web Audio API_) saat risiko mencapai kategori
  Waspada atau Bahaya.
- **Histori & Analytics** — rekam medis kuantitatif pola tumpuan harian
  beserta ekspor CSV untuk membantu rekomendasi terapi dokter/_orthotics_.
- **Panel Admin** — pengelolaan pengguna dan konfigurasi sistem tanpa menyentuh
  kode atau database secara langsung.
- **Cross-Platform Responsive Web** — antarmuka web yang ringan dan dapat
  diakses melalui browser perangkat apa pun (Android, iOS, Windows, Mac)
  tanpa instalasi aplikasi tambahan.
- **Navigasi Adaptif & Bento Grid** — sidebar penuh di desktop, nav-pill
  ringkas di mobile; layout kartu asimetris (_bento box_) untuk dashboard.
- **Multibahasa (kamus i18n)** — kamus ID/EN tersedia di `src/utils/i18n.ts`;
  permukaan yang dikirim saat ini hanya bahasa Indonesia (LANG-01).

## Tech Stack

### Hardware & Firmware

- **Mikrokontroler**: ESP32 Dev Module / WROOM-32
- **Sensor**: 3x Force Sensitive Resistor (FSR 402 Series)
- **Power Management**: baterai LiPo 3.7V + modul TP4056 _charger_ + _step-up boost converter_ 5V
- **Bahasa Pemrograman**: C++ (PlatformIO)
- **Pustaka Utama**: `WiFi.h`, `FirebaseESP32.h`

### Cloud & Backend

- **Cloud Database**: Google Firebase Realtime Database
- **Format Data**: JSON
- **Protokol Komunikasi**: Wi-Fi (HTTP REST API / WebSockets)

### Frontend Web Dashboard

- **Framework**: React 18 + Vite 5 (migrasi TypeScript berlangsung)
- **Styling**: Tailwind CSS 3 (_Mobile-First Responsive Design_)
- **Visualisasi**: SVG/HTML5 Canvas (_plantar heatmap_, grafik tekanan)
- **Notifikasi**: Web Notification API & Web Audio API
- **Pengujian**: Vitest
- **Deployment / Hosting**: Vercel / Netlify / Firebase Hosting
- **Version Control**: Git & GitHub

## Arsitektur & Alur Data

```text
[ 3x FSR Sensors ] ──(Analog ADC)──> [ ESP32 (Random Forest Inference) ]
                                                   │
                                            (Wi-Fi / JSON)
                                                   ▼
                                   [ Firebase Realtime Database ]
                                                   │
                                          (Realtime Listener)
                                                   ▼
                                  [ React Web Dashboard (Heatmap) ]
                                                   │
                                       (Web Notification & Alarm)
```

## Struktur Folder

```text
smart-insole-ta/
├── firmware/                    # Firmware ESP32 (PlatformIO, C++)
│   ├── platformio.ini           # Konfigurasi build & dependensi
│   ├── include/
│   │   ├── config.h.example     # Templat kredensial Wi-Fi & Firebase
│   │   ├── RandomForest.h       # Deklarasi model Random Forest
│   │   └── rf-model-data.h      # Model ter-ekspor sebagai array C++
│   ├── src/
│   │   ├── main.cpp             # Program utama: ADC → filter → inferensi → Firebase
│   │   └── RandomForest.cpp     # Inference Random Forest (majority vote + rule)
│   ├── test/                    # Unit test native (PlatformIO)
│   └── README.md
│
├── web-dashboard/               # Frontend React + Tailwind (mobile-first)
│   ├── public/
│   ├── src/
│   │   ├── App.tsx              # Root: router + auth guard + layout
│   │   ├── main.tsx
│   │   ├── pages/               # 12 halaman (.tsx): Landing, Login, Register,
│   │   │                        #   VerifyEmail, ForgotPassword, Dashboard,
│   │   │                        #   Monitoring, History, Device, Settings,
│   │   │                        #   Profile, Admin
│   │   ├── components/
│   │   │   ├── layout/          # AppLayout, AppSidebar, AppNavPill, AppTopbar
│   │   │   ├── dashboard/       # BentoGrid, AlertModal, Sparkline, dll.
│   │   │   ├── monitoring/      # TelemetryChart, TrendChart
│   │   │   ├── auth/            # AuthShell, PasswordField, PasswordStrength
│   │   │   ├── landing/         # RiskExplorer
│   │   │   ├── ui/              # GlassCard, GlassButton, StatusChip, dll.
│   │   │   └── PlantarHeatmap.tsx
│   │   ├── context/             # InsoleContext (readings + risk + source)
│   │   ├── hooks/               # useAuth (Firebase Auth state)
│   │   ├── services/            # firebaseConfig.ts, firebaseRealtime.ts
│   │   ├── types/               # Tipe TypeScript bersama
│   │   └── utils/               # randomForestRisk.ts, rf-model.json,
│   │                            #   i18n.ts, audioAlert.ts, exportCsv.ts, dll.
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.js
│
├── docs/                        # Dokumentasi proyek (lihat docs/README.md)
│   ├── HARDWARE-SPEC.md         # Spesifikasi hardware & build guide
│   ├── DESIGN-BRIEF.md          # Brief desain dashboard (historis)
│   ├── ROADMAP-RF.md            # Roadmap pelatihan model Random Forest
│   ├── rf-model-report.md       # Laporan hasil pelatihan model
│   ├── diagrams/                # Diagram blok & flowchart
│   ├── schematics/              # Skematik rangkaian
│   └── reference-design/        # Referensi visual dashboard
│
├── models/                      # rf-model.json + training-data.json
├── scripts/                     # prepare-dataset.py, train-model.js,
│                                #   export-model-cpp.js
├── datasets/                    # DFN-DS, Figshare DFU, OptiTrack (lokal)
├── tasks/                       # PRD & dokumen tugas
│
├── AGENTS.md                    # Routing untuk coding agent
├── DESIGN.md                    # Otoritas arah desain visual dashboard
├── DISCUSSION-GUIDE.md          # Panduan diskusi & checkpoint mingguan
├── firebase.json                # Konfigurasi Firebase Hosting/Rules
├── firestore.rules
├── database.rules.json
├── storage.rules
├── LICENSE
└── README.md                    # Berkas ini
```

## Panduan Mulai (Quick Start)

### 1. Hardware & Firmware Setup

1. Instal **PlatformIO Core** atau gunakan ekstensi **PlatformIO IDE** di VS Code.
2. Buka folder `firmware/` sebagai proyek PlatformIO.
3. Salin `include/config.h.example` menjadi `include/config.h`, lalu isi
   kredensial Anda:

   ```cpp
   #define WIFI_SSID     "Nama_WiFi_Anda"
   #define WIFI_PASSWORD "Password_WiFi"
   #define FIREBASE_HOST "smartinsole-project.firebaseio.com"
   #define FIREBASE_AUTH "Firebase_Database_Secret"
   ```

4. Hubungkan ESP32 ke komputer melalui kabel Micro-USB, lalu _build_ & _upload_:

   ```bash
   cd firmware
   pio run
   pio run --target upload
   pio device monitor
   ```

### 2. Frontend Web Dashboard Setup

1. Masuk ke direktori web:

   ```bash
   cd web-dashboard
   ```

2. Install seluruh dependensi paket:

   ```bash
   npm install
   ```

3. Salin `.env.example` menjadi `.env.local` dan isi konfigurasi Firebase Anda:

   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   ```

4. Jalankan server pengembangan lokal:

   ```bash
   npm run dev
   ```

5. Buka browser di `http://localhost:5173`.

Perintah lain yang tersedia: `npm test` (Vitest), `npm run typecheck`
(TypeScript), dan `npm run build`.

### 3. Deployment

```bash
cd web-dashboard
npm run build      # output statis di dist/
```

Deploy folder `dist/` ke **Vercel**, **Netlify**, atau **Firebase Hosting**
(_free tier_). Tidak ada backend tambahan yang perlu di-_deploy_ — ESP32
menulis langsung ke Firebase.

## Dokumentasi

Dokumentasi lanjutan ada di folder [`docs/`](docs/README.md):

| Dokumen | Isi |
| --- | --- |
| [`docs/HARDWARE-SPEC.md`](docs/HARDWARE-SPEC.md) | Spesifikasi hardware, daftar bahan, dan panduan perakitan |
| [`docs/ROADMAP-RF.md`](docs/ROADMAP-RF.md) | Roadmap pelatihan dan integrasi model Random Forest |
| [`docs/rf-model-report.md`](docs/rf-model-report.md) | Hasil pelatihan model, metrik evaluasi, dan clinical contract |
| [`docs/DESIGN-BRIEF.md`](docs/DESIGN-BRIEF.md) | Brief desain dashboard (dokumen historis) |
| [`DESIGN.md`](DESIGN.md) | Otoritas arah desain visual dashboard saat ini |
| [`DISCUSSION-GUIDE.md`](DISCUSSION-GUIDE.md) | Panduan diskusi tim dan checkpoint mingguan |

## Catatan Keamanan

- `firmware/include/config.h` dan `web-dashboard/.env.local` **tidak**
  di-_commit_ ke repositori (sudah masuk `.gitignore`).
- Yang di-_commit_ hanya berkas `.example` sebagai templat.
- Kredensial Firebase untuk web (`VITE_FIREBASE_*`) bersifat _public by
  design_ — andalkan proteksi lewat **Firebase Realtime Database Rules**,
  bukan dengan menyembunyikan _API key_.
- Aturan _database_ minimum yang disarankan:

  ```json
  {
    "rules": {
      ".read": false,
      ".write": false,
      "readings": { ".read": "auth != null", ".write": false },
      "users": {
        "$uid": { ".read": "$uid", ".write": "$uid" }
      }
    }
  }
  ```

## Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE) — bebas digunakan dan
dikembangkan untuk kepentingan akademis dan riset non-komersial.
