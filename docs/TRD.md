# TRD - Technical Requirement Documentation

> Smart Insole IoT · Kebutuhan teknis sistem.
> Rujukan: [`PRD.md`](PRD.md), [`BSD.md`](BSD.md),
> [`guidebook.html`](guidebook.html), [`../DESIGN.md`](../DESIGN.md).

## 1. Ikhtisar arsitektur

```
[ 3x FSR ] → [ ESP32: inferensi RF + buzzer lokal ] → [ Firebase RTDB ] → [ React Web ]
```

- Klasifikasi risiko dihitung di ESP32 (alarm lokal) dan di web (tampilan),
  memakai bobot model dan kontrak ambang yang identik.
- Tidak ada server aplikasi: ESP32 menulis langsung ke Firebase, web membaca.

## 2. Hardware

| Komponen | Spesifikasi |
| --- | --- |
| Mikrokontroler | ESP32-WROOM-32 (dual-core 240 MHz, ADC 12-bit) |
| Sensor | 3x FSR 402 per kaki (6 total) |
| Power | LiPo 3.7V 600 mAh + TP4056 + step-up 5V |
| Alarm | Buzzer aktif di GPIO 27 |
| Insole | Busa EVA 5 mm (dasar) + 2 mm (cover) |

Pin: forefoot GPIO 34 (ADC1_CH6), midfoot GPIO 35 (ADC1_CH7), heel GPIO 32
(ADC1_CH4). Gunakan ADC1 karena ADC2 konflik dengan Wi-Fi.

## 3. Firmware

- Bahasa C++17, PlatformIO, dependensi `WiFi.h` dan `Firebase_ESP_Client`.
- Laju sampel 10 Hz; filter median-of-3 pada pembacaan ADC.
- Durasi tumpuan di atas ambang dilaporkan sebagai fitur model, bukan penentu
  tingkat.
- Inferensi `RandomForest` dua kelas tanpa dependensi: tingkat ditentukan
  kontrak `peak >= 45 kPa`, suara pohon hanya menempatkan skor di dalam pita
  tingkat itu.
- Buzzer: warning satu beep 100 ms tiap 3 s, safe senyap.
- Push Firebase tiap detik, hanya bila terkonfigurasi, Wi-Fi tersambung, dan
  jam NTP masuk akal.
- Model ter-ekspor dari `models/rf-model.json` ke
  `firmware/include/rf-model-data.h`.

## 4. Cloud dan backend

- Firebase Realtime Database sebagai satu-satunya backend.
- Firebase Authentication untuk akun, verifikasi email, dan reset kata sandi.
- Skema lengkap dan aturan keamanan: lihat [`BSD.md`](BSD.md).
- Kredensial web bersifat public by design; proteksi lewat rules.

## 5. Frontend web

- React 18 + Vite 5 + TypeScript (strict) + Tailwind CSS 3.
- State: `InsoleContext` (pembacaan, risiko, sumber data), `UserContext`
  (listener auth tunggal).
- Layanan: `firebaseConfig.ts`, `firebaseRealtime.ts`.
- Inferensi: `src/utils/randomForestRisk.ts` (satu sumber kebenaran).
- Visualisasi: SVG/Canvas (`PlantarHeatmap`, `TelemetryChart`, `TrendChart`).
- Notifikasi: Web Notification API + Web Audio API.
- Pengujian: Vitest, kolokasi `*.test.*`.

## 6. Kontrak data

Paket JSON per sampel dengan field: `deviceId`, `timestamp`,
`forefoot_kpa`, `midfoot_kpa`, `heel_kpa`, `sustained_duration_sec`,
`risk_score`, `risk_status` (`safe` atau `warning`), `battery_percent`
(opsional). Setiap field bertipe `unknown` di web dan di-koersi defensif. Nilai
`risk_status` lama `danger` dipetakan ke `warning` saat dibaca. Rincian di
[`BSD.md`](BSD.md) dan `web-dashboard/src/types/insole.ts`.

## 7. Deployment model Random Forest

- Pelatihan: `scripts/prepare-dataset.py` lalu `scripts/train-model.js`.
- Data: 135 pasien DFN-DS, 81.000 sampel; seluruhnya data latih. Data uji
  eksternal adalah subjek diabetes baru yang direkam sendiri.
- Label: `warning` bila tekanan puncak ≥ 45 kPa (persentil ke-95 DFN-DS),
  `safe` bila di bawahnya. Durasi tidak mengubah label.
- Validasi: 5 lipatan berkelompok per pasien; tiga skema (aturan murni, RF
  berbobot kelas, RF + SMOTE) dijalankan pada lipatan identik; SMOTE hanya di
  sisi latih.
- Model: 20 pohon, kedalaman maksimum 8, minSamples 4, Gini impurity.
- Ekspor: `scripts/export-model-cpp.js` menghasilkan header C++ dan salinan
  JSON web; daun menyimpan hitungan `uint32_t` karena SMOTE melampaui
  `uint16_t`.
- Kontrak: `peak >= 45 kPa → warning`, diterapkan dua arah di web
  (`randomForestRisk.ts`) dan firmware (`RandomForest.cpp`); pita skor aman
  0–47, waspada 48–74. Ambang tidak dapat dikonfigurasi klien.
- Paket bukti: `node scripts/evidence.js` menulis
  `docs/evidence/metrics.json` dan laporan HTML dari protokol yang sama.
- Sinkronisasi model web dan repo dijaga oleh `rf-modelSync.test.js`.

## 8. Kebutuhan non-fungsional

| Aspek | Ketentuan |
| --- | --- |
| Kinerja | Sampel 10 Hz; push Firebase 1/detik; client inference tanpa server |
| Keandalan | Alarm lokal tidak bergantung Wi-Fi; push gagal dicoba ulang siklus berikutnya |
| Keamanan | `config.h` dan `.env.local` tidak di-commit; rules menolak baca/tulis default |
| Privasi | Pembacaan terikat perangkat yang dipasangkan ke akun |
| Aksesibilitas | Kontras terukur, target 44px, risiko lewat ikon + teks + warna, `aria-live` hanya untuk perubahan level |
| Kompatibilitas | Browser modern Android/iOS/desktop; HTTPS atau localhost untuk notifikasi |
| Internasionalisasi | Permukaan terkirim hanya Indonesia (`LANG-01`) |

## 9. Ketergantungan dan toolchain

- Node v26, npm; build dan uji di `web-dashboard/`.
- Python 3 untuk persiapan dan validasi dataset.
- PlatformIO untuk firmware (`~/.venvs/platformio/bin/pio` bila tidak di PATH).
- Tanpa backend server tambahan.

## 10. Gate verifikasi

```bash
# Web
cd web-dashboard && npm test && npm run typecheck && npm run build

# Firmware
pio test -e native    # bila PlatformIO absen: lewati dan sebutkan
```
