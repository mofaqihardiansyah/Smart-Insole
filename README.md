# 🦶 Smart Insole IoT — Plantar Pressure Monitoring System

> **Rancang Bangun Smart Insole Berbasis IoT Menggunakan Metode Fuzzy Logic untuk Monitoring Tekanan Plantar Pasien Diabetes Mellitus Menggunakan Platform Web**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Framework: React](https://img.shields.io/badge/Frontend-React.js-61DAFB?logo=react)](https://reactjs.org/)
[![Styling: Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38BDF8?logo=tailwindcss)](https://tailwindcss.com/)
[![Database: Firebase](https://img.shields.io/badge/Cloud-Firebase_Realtime_DB-FFCA28?logo=firebase)](https://firebase.google.com/)
[![Hardware: ESP32](https://img.shields.io/badge/Hardware-ESP32-000000?logo=espressif)](https://www.espressif.com/)

---

## 📌 Deskripsi Proyek

**Smart Insole IoT** adalah sistem pemantauan tekanan telapak kaki (*plantar pressure*) secara *real-time* berbasis perangkat lunak web dan sistem tertanam (*embedded system*). Sistem ini dirancang untuk membantu penderita **Diabetes Mellitus (DM)** yang mengalami *Diabetic Peripheral Neuropathy* (DPN) atau hilangnya *loss of protective sensation* dalam mencegah terjadinya **Ulkus Kaki Diabetik (*Diabetic Foot Ulcer* / DFU)**.

Sistem menggunakan **3 sensor Force Sensitive Resistor (FSR 402 Series)** pada titik anatomis kritis (*forefoot*, *midfoot*, *heel*) dan dikendalikan oleh mikrokontroler **ESP32**. Algoritma **Fuzzy Logic Inference System** ditanamkan langsung pada ESP32 untuk mengevaluasi kombinasi besaran tekanan (kPa) dan durasi tumpuan (*sustained pressure duration*) ke dalam 3 kategori tingkat risiko: **Aman**, **Waspada**, dan **Bahaya**. Data ditransmisikan nirkabel ke **Google Firebase Realtime Database** dan ditayangkan pada **Web Dashboard Multiplatform (*Mobile-First Responsive Design*)**.

---

## ✨ Fitur Utama

- ⚡ **Real-time Plantar Heatmap** — visualisasi gradasi warna kontur tekanan telapak kaki secara langsung pada layar *browser* HP maupun PC.
- 🧠 **Embedded Fuzzy Logic Assessment** — klasifikasi risiko adaptif langsung di tingkat mikro (*Aman*, *Waspada*, *Bahaya*) tanpa ketergantungan pemrosesan *server-side*.
- ⏱️ **Sustained Pressure Monitoring** — mengukur akumulasi durasi waktu tumpuan berulang untuk mencegah pembentukan lesi jaringan lunak.
- 🚨 **Early Warning System (EWS)** — pemicuan notifikasi web (*Web Notification API*) dan peringatan alarm audio/getar pada ponsel saat risiko mencapai kategori *Waspada* atau *Bahaya*.
- 📊 **Histori & Analytics** — rekam medis kuantitatif pola tumpuan harian pasien untuk membantu rekomendasi terapi dokter/*orthotics*.
- 📱 **Cross-Platform Responsive Web** — antarmuka web yang ringan, cepat, dan ramah akses melalui *browser* perangkat apa pun (Android, iOS, Windows, Mac) tanpa perlu instalasi APK.

---

## 🛠️ Tech Stack & Komponen

### Hardware & Firmware
- **Mikrokontroler**: ESP32 Dev Module / WROOM-32
- **Sensor**: 3x Force Sensitive Resistor (FSR 402 Series)
- **Power Management**: Baterai LiPo 3.7V + Modul TP4056 Charger + Step-Up Boost Converter 5V
- **Bahasa Pemrograman**: C++ (PlatformIO)
- **Pustaka Utama**: `WiFi.h`, `FirebaseESP32.h`

### Cloud & Backend
- **Cloud Database**: Google Firebase Realtime Database
- **Format Data**: JSON
- **Protokol Komunikasi**: Wi-Fi (HTTP REST API / WebSockets)

### Frontend Web Dashboard
- **Framework**: React.js
- **Styling**: Tailwind CSS (*Mobile-First Responsive Design*)
- **Visualisasi**: HTML5 Canvas / Custom CSS Gradients (*plantar heatmap*), Chart.js / Recharts
- **Notifikasi**: Web Notification API & Web Audio API
- **Deployment / Hosting**: Vercel / Netlify / Firebase Hosting
- **Version Control**: Git & GitHub

---

## 🏗️ Arsitektur & Alur Data

```text
[ 3x FSR Sensors ] ──(Analog ADC)──> [ ESP32 (Embedded Fuzzy Logic) ]
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

---

## 📁 Struktur Folder Repositori

```text
smart-insole-ta/
├── firmware/                   # Kode C++/PlatformIO untuk ESP32
│   ├── platformio.ini
│   ├── include/
│   │   └── config.h            # Kredensial Wi-Fi & Firebase (tidak di-commit)
│   ├── lib/
│   └── src/
│       ├── main.cpp            # Program utama, Wi-Fi, & Firebase Sync
│       ├── FuzzyLogic.cpp      # Fuzzifikasi, Rules, & Defuzzifikasi
│       └── FuzzyLogic.h
│   └── README.md
│
├── web-dashboard/              # Frontend React.js & Tailwind CSS
│   ├── public/
│   ├── src/
│   │   ├── components/         # Heatmap, StatusCard, AlertModal
│   │   ├── config/             # Konfigurasi Firebase SDK
│   │   ├── pages/              # Dashboard, History, Settings
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── docs/                       # Diagram blok, skematik hardware, & dokumentasi
│   ├── block-diagram.png
│   └── schematic.png
│
├── .gitignore
├── LICENSE
└── README.md                   # Penjelasan projek, setup guide, & tech stack
```

---

## 🚀 Panduan Memulai (Quick Start)

### 1. Hardware & Firmware Setup

1. Instal **PlatformIO Core** atau gunakan ekstensi **PlatformIO IDE** di VS Code.
2. Buka folder `firmware/` sebagai proyek PlatformIO.
3. Salin `include/config.h.example` menjadi `include/config.h`, lalu isi kredensial Anda:
   ```cpp
   #define WIFI_SSID     "Nama_WiFi_Anda"
   #define WIFI_PASSWORD "Password_WiFi"
   #define FIREBASE_HOST "smartinsole-project.firebaseio.com"
   #define FIREBASE_AUTH "Firebase_Database_Secret"
   ```
4. Hubungkan ESP32 ke komputer melalui kabel Micro-USB, lalu build & upload:
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
   VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   ```
4. Jalankan server pengembangan lokal:
   ```bash
   npm run dev
   ```
5. Buka *browser* di `http://localhost:5173`.

### 3. Deployment

```bash
cd web-dashboard
npm run build      # output statis di dist/
```

Deploy folder `dist/` ke **Vercel**, **Netlify**, atau **Firebase Hosting** (free tier). Tidak ada *backend* tambahan yang perlu di-*deploy* — ESP32 menulis langsung ke Firebase.

---

## 🔐 Catatan Keamanan

- `firmware/include/config.h` dan `web-dashboard/.env.local` **tidak** di-*commit* ke repositori (sudah masuk `.gitignore`).
- Yang di-*commit* hanya berkas `.example` sebagai templat.
- Kredensial Firebase untuk *web* (`VITE_FIREBASE_*`) bersifat *public by design* — andalkan proteksi lewat **Firebase Realtime Database Rules**, bukan dengan menyembunyikan *API key*.
- Aturan *database* minimum yang disarankan:
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

---

## 👨‍💻 Tim Pengembang & Institusi

Proyek Tugas Akhir ini disusun oleh mahasiswa Program Studi **D3 Teknik Informatika**, **Politeknik Negeri Semarang (POLINES)**:

- **M. Haikal Zacki Al Awaly** — NIM. 3.34.24.2.14
- **Mochamad Faqih Ardiansyah** — NIM. 3.34.24.2.16

**Dosen Pembimbing:**

1. **Dr. Sukamto, S.Kom., M.T.** — NIP. 197101172003121001
2. **Slamet Handoko, S.Kom., M.Kom.** — NIP. 197501302001121001

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE) — bebas digunakan dan dikembangkan untuk kepentingan akademis dan riset non-komersial.
