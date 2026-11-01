# Firmware — Smart Insole (ESP32)

Kode C++ untuk mikrokontroler **ESP32** pada *smart insole*. Program ini
membaca 3 sensor FSR 402, menjalankan **Random Forest** (model ter-trained), lalu
mengirim hasil ke **Firebase Realtime Database** lewat Wi-Fi.

## Isi Folder

| Path | Keterangan |
| --- | --- |
| `platformio.ini` | Konfigurasi build & dependensi PlatformIO |
| `include/config.h.example` | Templat kredensial Wi-Fi & Firebase |
| `include/RandomForest.h` | Deklarasi model Random Forest (pohon, threshold) |
| `include/rf-model-data.h` | Model ter-ekspor sebagai array C++ (dari `scripts/export-model-cpp.js`) |
| `src/main.cpp` | Program utama: ADC → filter → random forest → Firebase |
| `src/RandomForest.cpp` | Inference Random Forest (majority vote + rule klinis) |
| `test/` | Unit test native PlatformIO |

## Setup

```bash
# 1. Siapkan kredensial
cp include/config.h.example include/config.h
$EDITOR include/config.h

# 2. Build & upload
pio run
pio run --target upload

# 3. Pantau output serial
pio device monitor
```

## Peringatan

`include/config.h` memuat kredensial asli dan **tidak boleh** di-*commit*.
Yang di-*commit* hanya `config.h.example` sebagai templat.

## Skema Wiring Singkat

| Sensor | GPIO ESP32 | ADC Channel |
| --- | --- | --- |
| FSR Forefoot | 34 | ADC1_CH6 |
| FSR Midfoot | 35 | ADC1_CH7 |
| FSR Heel | 32 | ADC1_CH4 |

> Pembagian resistor pada setiap FSR: `VDD — FSR — 10kΩ — GND`,
> titik tengah ke pin ADC. Gunakan pin **ADC1** agar tidak BERGANTUNG
> dengan Wi-Fi (ADC2 konflik dengan modul Wi-Fi bawaan).
