# TRD - Technical Requirement Documentation

> Smart Insole IoT · Kebutuhan teknis sistem.
> Rujukan: [`PRD.md`](PRD.md), [`BSD.md`](BSD.md),
> [`guidebook.html`](guidebook.html), [`../DESIGN.md`](../DESIGN.md).

## 1. Ikhtisar arsitektur

```
[ 3x FSR ] → [ ESP32: inferensi RF + buzzer lokal ] → [ Firebase RTDB ] → [ React Web ]
```

- Klasifikasi risiko dihitung di ESP32 (alarm lokal) dan di web (tampilan),
  memakai bobot model dan aturan klinis yang identik.
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
- Akumulasi durasi tumpuan di atas ambang peringatan, dibatasi 60 detik.
- Inferensi `RandomForest` (majority vote + aturan danger), tanpa dependensi.
- Buzzer: danger 300/200 ms, warning 100/2900 ms, safe senyap.
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
`risk_score`, `risk_status`, `battery_percent` (opsional). Setiap field
bertipe `unknown` di web dan di-koersi defensif. Rincian di
[`BSD.md`](BSD.md) dan `web-dashboard/src/types/insole.ts`.

## 7. Deployment model Random Forest

- Pelatihan: `scripts/prepare-dataset.py` lalu `scripts/train-model.js`.
- Ekspor: `scripts/export-model-cpp.js` menghasilkan header C++ dan salinan
  JSON web.
- Model: 20 pohon, kedalaman maksimum 8, Gini impurity, bootstrap berbobot.
- Ambang: warning 35 kPa, danger 200 kPa; jendela durasi tidak dapat
  dikonfigurasi klien.
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
