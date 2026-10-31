# Hardware Specification & Build Guide

Smart Insole IoT — Tugas Akhir

## Overview

Dokumen ini menjelaskan spesifikasi hardware, daftar bahan, dan panduan pembuatan smart insole untuk monitoring tekanan plantar pada pasien diabetes.

**Status:** Draft — Last updated: 14 Oktober 2026

**Reference Design:** Billings et al. (2024) — Smart Compression Sock for Early Detection of Diabetic Foot Ulcers. *Sensors*, 24(21), 6928.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SMART INSOLE SYSTEM                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                    ANKLE AREA                                │
│                       ┌─────────────┐                       │
│                       │   POUCH     │  ← fabric-sewn pouch  │
│                       │ ┌─────────┐ │     di top of sock     │
│                       │ │ ESP32   │ │     (Billings et al.)  │
│                       │ │WROOM-32 │ │                        │
│                       │ └─────────┘ │                        │
│                       │ ┌─────────┐ │                        │
│                       │ │ LiPo    │ │  ← removable,         │
│                       │ │ 600mAh  │ │     rechargeable       │
│                       │ └─────────┘ │                        │
│                       └──────┬──────┘                       │
│                              │ WiFi                         │
│                              ▼                              │
│  FOOT/SHOE                   ▼                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    INSOLE                            │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │  EVA Foam Base (5mm)                         │    │   │
│  │  │                                             │    │   │
│  │  │   📍 Forefoot    📍 Midfoot    📍 Heel     │    │   │
│  │  │    FSR #1         FSR #2        FSR #3     │    │   │
│  │  │                                             │    │   │
│  │  │  [wire channels → pouch]                    │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │  EVA Foam Cover (2mm) + Fabric (optional)   │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│                              ▼                              │
│                     ┌────────────────┐                      │
│                     │    Firebase    │                      │
│                     │   Realtime DB  │                      │
│                     └────────┬───────┘                      │
│                              │                              │
│                     ┌────────▼───────┐                      │
│                     │  Web Dashboard │                      │
│                     │   (React PWA)  │                      │
│                     └────────────────┘                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Design Decision:** Pouch ditempatkan di **top of sock (ankle area)**, bukan di bawah tumit. Hal ini mengikuti Billings et al. (2024) dan alasan klinis:

- ❌ **Heel berbahaya:** Area tumit menerima impact tinggi saat heel strike
- ❌ **Risiko cedera:** Komponen keras di heel bisa menyebabkan ischemia pada pasien diabetes
- ✅ **Ankle aman:** Area pergelangan kaki tidak menerima impact plantar
- ✅ **Literature support:** Billings et al. (2024), SoleMate (2024), Khandakar et al. (2022)

---

## Sensor Configuration

### Jumlah Sensor

**Keputusan: 3 FSR per kaki (6 total untuk sepasang)**

| Lokasi Sensor | Fungsi | Keterangan |
|---|---|---|
| **Forefoot** | Tekanan area depan | Ball of foot |
| **Midfoot** | Tekanan area tengah | Arch support |
| **Heel** | Tekanan tumit | Impact area (hanya sensor, TIDAK ada elektronik) |

### Anatomical Placement

```
         INSOLE LAYOUT (Top View)
    ┌─────────────────────────────────┐
    │                                 │
    │   📍 Forefoot (Metatarsal)     │  ← Sensor 1
    │                                 │
    │                                 │
    │         📍 Midfoot             │  ← Sensor 2
    │           (Arch)               │
    │                                 │
    │                                 │
    │                 📍 Heel        │  ← Sensor 3
    │                  (Calcaneus)   │     ⚠️ HANYA sensor,
    │                                 │        TIDAK ada electronics!
    └─────────────────────────────────┘
    
    Sensor Position (persentase panjang insole):
    - Forefoot:  20-25% dari ujung depan
    - Midfoot:   50-55% dari ujung depan (tengah)
    - Heel:      80-85% dari ujung depan
```

**⚠️ CRITICAL: Heel area HARUS pure foam (EVA/PORON), TIDAK ADA elektronik di sini!**

Alasan (dari literature):
- Heel strike menghasilkan impact 1.5-2× body weight
- Komponen keras di heel → risiko rusak + cedera jaringan
- Pasien diabetes: neuropathy → tidak feel pain → ischemia → ulcer
- Heel harus **offloading** (tekanan berkurang), bukan **added thickness**

### Sensor Specification: FSR 402

| Parameter | Value |
|---|---|
| **Active Area** | 12.7 mm diameter |
| **Force Range** | 0.1 N – 100 N |
| **Thickness** | 0.5 mm |
| **Response Time** | < 1 ms |
| **Operating Voltage** | 3.3V (compatible with ESP32) |
| **Connection** | 2-pin male header (0.1") |
| **Lifetime** | > 1 million actuations |

**Sourcing:**
- Tokopedia: "FSR 402 sensor" (35-80k per pcs)
- AliExpress: "FSR 402 force sensor" (20-50k per pcs)

---

## Microcontroller: ESP32

### Specification (mengikuti Billings et al., 2024)

| Parameter | Value |
|---|---|
| **Model** | ESP32-WROOM-32 |
| **Chip** | D0WDQ6 |
| **Core** | Dual-core @ 240 MHz |
| **ADC** | 12-bit (18 ADC pins) |
| **Bluetooth** | BLE 4.2 (10-40m range) |
| **WiFi** | 802.11 b/g/n |
| **Sleep Mode** | Deep sleep (low power) |

**Quantity:** 3 units (sudah tersedia)

### Pin Configuration

```
ESP32 Pin Mapping (per insole):
┌─────────────────────────────────────┐
│  FSR Forefoot  →  GPIO 34 (ADC1)   │
│  FSR Midfoot   →  GPIO 35 (ADC1)   │
│  FSR Heel      →  GPIO 32 (ADC1)   │
│  Buzzer (+)    →  GPIO 27 (alarm   │
│                  lokal, offline)   │
│                                     │
│  VCC (3.3V)    →  FSR voltage       │
│                  divider            │
│  GND           →  Common ground    │
│                                     │
│  WiFi          →  Firebase RTDB     │
└─────────────────────────────────────┘
```

**Note:** Billings et al. menggunakan BLE untuk phone app. Kita menggunakan WiFi → Firebase (sudah ada infrastruktur web dashboard).

### ESP32 Allocation

```
ESP32 #1: Left Insole  → WiFi → Firebase
ESP32 #2: Right Insole → WiFi → Firebase
ESP32 #3: Backup / Debug
```

---

## Power Supply

### Battery Specification (mengikuti Billings et al., 2024)

| Parameter | Value |
|---|---|
| **Type** | LiPo (Lithium Polymer) |
| **Voltage** | 3.7V (nominal) |
| **Capacity** | **600 mAh** (original) atau 1000 mAh (extended) |
| **Dimensions (600mAh)** | ~40 × 30 × 5 mm |
| **Dimensions (1000mAh)** | ~50 × 30 × 6 mm |
| **Weight** | ~15-20g |
| **Runtime (600mAh)** | 8-10 hours (WiFi continuous) |
| **Runtime (1000mAh)** | 12-15 hours |
| **Connector** | JST-PH 2-pin |
| **Protection** | Over-charge, over-discharge |
| **Removable** | ✅ Yes (untuk charging) |

**Recommendation:** 600mAh (mengikuti paper, lebih ringan, cukup untuk daily use)

**Sourcing:**
- Tokopedia: "LiPo battery 3.7V 600mAh" atau "1000mAh" (50-100k per pcs)

### Charging Module: TP4056

| Parameter | Value |
|---|---|
| **Input** | 5V (USB Micro/C) |
| **Output** | 4.2V (LiPo charging) |
| **Max Current** | 1A |
| **Protection** | Over-charge, over-discharge |
| **Dimensions** | ~25 × 19 mm |

**Sourcing:**
- Tokopedia: "TP4056 charging module" (5-10k per pcs)

### Power Circuit

```
USB 5V ──► TP4056 ──► LiPo 3.7V ──► ESP32 3.3V (via regulator)
              │
              └──► Charging indicator LED
```

**Removable Battery Design (mengikuti paper):**
- Battery bisa dilepas dari pouch untuk charging
- Atau charge langsung via USB (jika TP4056 accessible)

---

## Insole Material: EVA Foam

### Material Specification

| Property | Value |
|---|---|
| **Material** | EVA (Ethylene Vinyl Acetate) |
| **Ketebalan (base)** | 5 mm |
| **Ketebalan (cover)** | 2 mm |
| **Density** | Medium (30-40 PPI) |
| **Ukuran sheet** | 30 × 30 cm |
| **Warna** | Hitam (recommended) |
| **Harga** | 30-50k per sheet |

**Alternatives (dari literature):**
- **PORON** — high-performance cushioning (mahal)
- **Silicone gel** — excellent damping (expensive)
- **Latex foam** — good alternative

**Sourcing:**
- Tokopedia: "EVA foam sheet 5mm" (30-50k)
- Ace Hardware: EVA foam sheet
- Craft store: EVA foam

### Layer Structure

```
INSOLE CROSS-SECTION:
┌─────────────────────────────────────────┐
│  Top Layer: Fabric (optional)           │  ← 0.5mm, nyaman
│  ┌───────────────────────────────────┐  │
│  │ Cover Foam: EVA 2mm               │  │  ← protect sensor
│  │ ┌───────────────────────────────┐ │  │
│  │ │ FSR Sensor (embedded)         │ │  │  ← 0.5mm
│  │ ├───────────────────────────────┤ │  │
│  │ │ Base Foam: EVA 5mm            │ │  │  ← cushioning
│  │ │  - Wire routing channels      │ │  │
│  │ │  - Sensor pockets              │ │  │
│  │ │  - ⚠️ Heel: PURE FOAM ONLY    │ │  │
│  │ └───────────────────────────────┘ │  │
│  └───────────────────────────────────┘  │
│  Bottom: Anti-slip coating (optional)   │
└─────────────────────────────────────────┘

Total thickness: ~7.5-8mm
```

### Sensor Pocket Design

```
TOP VIEW - Sensor Pocket:
    ┌─────────────────────────────────────┐
    │           EVA Foam Base             │
    │                                     │
    │    ┌─────────────┐                  │
    │    │   POCKET    │                  │  ← Cutout untuk FSR
    │    │  (14×14mm)  │                  │     (FSR 12.7mm + margin)
    │    │             │                  │
    │    └──────┬──────┘                  │
    │           │                         │
    │      [wire channel]                 │  ← Alur untuk wire
    │           │                         │     (2-3mm depth)
    │           │                         │     menuju heel area
    └───────────┼─────────────────────────┘
                │
                ▼ wire ke pouch (ankle)
```

**⚠️ Wire routing:** Channel menuju **heel area**, lalu wire **naik ke ankle** (bukan ke electronics di heel).

---

## ESP32 Pouch (Sock-Top Design)

### Design Reference

Mengikuti **Billings et al. (2024)**:
> *"The battery is housed in a fabric-sewn pouch at the top of the sock. The battery is removable and can be recharged."*

### Pouch Location

```
SIDE VIEW - Pouch Placement:

              ANKLE AREA
                 ┌───────┐
                 │ Pouch │  ← fabric-sewn pouch
                 │(ESP32 │     di top of sock
                 │+LiPo) │     
                 └───┬───┘
                     │ wire (10-15cm)
    ┌────────────────┼────────────────────────────┐
    │                │        FOOT/SHOE           │
    │                ▼                            │
    │   ┌─────────────────────┐                   │
    │   │      INSOLE         │                   │
    │   │  📍 📍 📍           │                   │
    │   │  FSR di foam        │                   │
    │   │                     │                   │
    │   │  Heel: PURE FOAM    │                   │
    │   │  (no electronics!)  │                   │
    │   └─────────────────────┘                   │
    │                                             │
    └─────────────────────────────────────────────┘
```

### Pouch Specification

| Property | Value |
|---|---|
| **Location** | Top of sock (ankle area) |
| **Material** | Neoprene 3-5mm atau fabric |
| **Dimensions (internal)** | 65 × 80 × 20 mm |
| **Dimensions (external)** | 70 × 85 × 22 mm |
| **Weight** | ~15g (empty) |
| **Attachment** | Sewn ke sock ATAU Velcro (removable) |
| **Opening** | Top (slip-in design) |
| **Battery** | Removable untuk charging |

### Pouch Contents

```
┌─────────────────────────────┐
│      SOCK-TOP POUCH         │
│  ┌───────────────────────┐  │
│  │                       │  │
│  │   ┌───────────────┐   │  │
│  │   │    ESP32      │   │  │  ← 55 × 28 mm
│  │   │  WROOM-32     │   │  │
│  │   └───────────────┘   │  │
│  │                       │  │
│  │   ┌───────────────┐   │  │
│  │   │  LiPo 600mAh  │   │  │  ← 40 × 30 × 5 mm
│  │   │   (removable) │   │  │     (atau 1000mAh)
│  │   └───────────────┘   │  │
│  │                       │  │
│  │   ┌───────────────┐   │  │
│  │   │   TP4056      │   │  │  ← charging module
│  │   │   charger     │   │  │
│  │   └───────────────┘   │  │
│  │                       │  │
│  │   [JST connector]     │  │  ← quick disconnect
│  │   [USB access]        │  │  ← charging port
│  │                       │  │
│  └───────────────────────┘  │
│                             │
│   Attachment ke sock:       │
│   - Sewn (permanent) ATAU   │
│   - Velcro (removable) ⭐   │
│                             │
└─────────────────────────────┘
```

### Attachment Options

**Option A: Sewn ke sock (mengikuti paper)**
```
- Sew pouch langsung ke top of sock
- Permanent attachment
- Butuh sewing machine atau needle + thread
- Pro: Clean look, secure
- Con: Susah remove untuk wash sock
```

**Option B: Velcro ke sock (DIY-friendly) ⭐ RECOMMEND**
```
- Pouch dengan velcro dots di belakang
- Sock dengan velcro dots di ankle area
- Bisa dilepas untuk charging/wash sock
- Pro: Flexible, mudah maintenance
- Con: Sedikit lebih bulky
```

**Option C: Ankle strap (hybrid)**
```
- Pouch + velcro strap (kayak fitness tracker)
- Wrap di ankle (bukan di sock)
- Universal, bisa pindah ke sock lain
- Pro: Universal, mudah
- Con: Kurang integrated look
```

### Pouch Material Recommendation

**Option 1: Neoprene Sheet 3-5mm (DIY)** ⭐

| Property | Value |
|---|---|
| **Material** | Neoprene (CR foam) |
| **Ketebalan** | 3-5mm |
| **Ukuran** | 30 × 30 cm (cukup untuk 2 pouches) |
| **Harga** | 30-50k |
| **Sumber** | Tokopedia: "neoprene sheet 3mm" |

**Kelebihan Neoprene:**
- ✅ Flexible — mengikuti bentuk ESP32
- ✅ Protective — cushioning, shock absorption
- ✅ Water-resistant — sweat-proof
- ✅ Easy to work — bisa dipotong & disambung
- ✅ Cheap & available

**Option 2: Fabric Pouch (mengikuti paper)**

| Property | Value |
|---|---|
| **Material** | Polyester/cotton fabric |
| **Ketebalan** | Double layer |
| **Ukuran** | 20 × 25 cm |
| **Harga** | 20-30k |
| **Sumber** | Fabric store |

**Option 3: Pre-made Pouch**

| Option | Material | Harga | Notes |
|---|---|---|---|
| Wristband pouch | Neoprene/Fabric | 30-50k | Ready-made, instant |
| Silicone case | Silicone | 50-100k | Premium, water-resistant |
| Microfiber pouch | Microfiber | 20-30k | Soft, cheap |

---

## Complete Shopping List

### Sensors

| No | Component | Qty | Est. Harga | Source | Notes |
|---|---|---|---|---|---|
| 1 | FSR 402 | 6 pcs | 300-600k | Tokopedia/AliExpress | 3 per kaki |
| 2 | Resistor 10kΩ | 10 pcs | 5-10k | Tokopedia | Voltage divider |

### Power

| No | Component | Qty | Est. Harga | Source | Notes |
|---|---|---|---|---|---|
| 3 | LiPo 3.7V 600mAh | 2 pcs | 100-180k | Tokopedia | 1 per insole (removable) |
| 4 | TP4056 charging module | 2 pcs | 10-20k | Tokopedia | USB charging |
| 5 | JST connector (2-pin) | 4 pcs | 10-20k | Tokopedia | Quick disconnect |

### Insole

| No | Component | Qty | Est. Harga | Source | Notes |
|---|---|---|---|---|---|
| 6 | EVA foam 5mm (30×30cm) | 2 sheets | 60-100k | Tokopedia/Ace | Base |
| 7 | EVA foam 2mm (30×30cm) | 1 sheet | 30-50k | Tokopedia/Ace | Cover |
| 8 | Fabric (nylon/polyester) | 1 meter | 20-30k | Fabric store | Top layer (optional) |

### Pouch (Sock-Top Design)

| No | Component | Qty | Est. Harga | Source | Notes |
|---|---|---|---|---|---|
| 9 | Neoprene sheet 3-5mm | 1 sheet | 30-50k | Tokopedia | Pouch material |
| 10 | Velcro dots (adhesive) | 1 pack | 15-25k | Tokopedia | Attachment ke sock |
| 11 | (Optional) Sewing kit | 1 set | 20-30k | Craft store | Kalau mau sew permanen |

### Wiring

| No | Component | Qty | Est. Harga | Source | Notes |
|---|---|---|---|---|---|
| 12 | Silicone wire 30AWG | 5 meter | 30-50k | Tokopedia | Flexible (10-15cm per insole) |
| 13 | Heat shrink tubing | 1 pack | 15-25k | Tokopedia | Insulation |
| 14 | Female header pins | 2 pcs | 10-20k | Tokopedia | ESP32 socket (optional) |

### Tools (kalau belum ada)

| No | Component | Qty | Est. Harga | Source | Notes |
|---|---|---|---|---|---|
| 15 | Solder + soldering iron | 1 set | 100-200k | Tokopedia | Essential |
| 16 | Multimeter | 1 pc | 80-150k | Tokopedia | Debug |
| 17 | Cutter + scissors | - | 20-30k | Ace Hardware | Cut foam |
| 18 | Super glue / hot glue gun | - | 20-40k | Ace Hardware | Assembly |

### Miscellaneous

| No | Component | Qty | Est. Harga | Source | Notes |
|---|---|---|---|---|---|
| 19 | Cable ties (small) | 1 pack | 10k | Tokopedia | Wire management |
| 20 | Double-sided tape (3M) | 1 roll | 20-30k | Ace Hardware | Mounting |

---

### Total Cost Estimation

| Category | Cost (IDR) |
|---|---|
| Sensors (FSR + resistor) | 305-610k |
| Power (LiPo + charging) | 120-220k |
| Insole (EVA + fabric) | 110-180k |
| Pouch + Velcro + Sewing | 65-105k |
| Wiring | 55-95k |
| Tools (kalau belum ada) | 320-620k |
| Miscellaneous | 30-60k |
| **TOTAL (dengan tools)** | **1.005k - 1.89jt** |
| **TOTAL (tanpa tools)** | **685k - 1.27jt** |

---

## Build Guide

### Phase 1: Procurement (Minggu 1-2)

**Checklist:**

- [ ] Beli FSR 402 × 6
- [ ] Beli Resistor 10kΩ
- [ ] Beli LiPo battery 600mAh × 2 (atau 1000mAh)
- [ ] Beli TP4056 charging module × 2
- [ ] Beli EVA foam sheets (5mm × 2, 2mm × 1)
- [ ] Beli Neoprene sheet 3-5mm (untuk pouch)
- [ ] Beli Velcro dots adhesive
- [ ] Beli Silicone wire 30AWG
- [ ] Beli Heat shrink tubing
- [ ] Beli JST connectors
- [ ] (Optional) Beli sewing kit
- [ ] (Optional) Beli tools yang belum ada

**Verification:**

- [ ] Test FSR dengan multimeter (resistance berubah saat ditekan)
- [ ] Test ESP32 (upload basic blink sketch)
- [ ] Test LiPo + TP4056 (charging berfungsi)

---

### Phase 2: Sensor Testing (Minggu 2)

**Goal:** Verifikasi FSR + ESP32 bisa membaca tekanan

**Circuit Setup:**

```
Voltage Divider Circuit:

    3.3V (ESP32)
      │
      │
     [FSR 402]
      │
      ├──── GPIO 34/35/32 (ADC input)
      │
     [10kΩ Resistor]
      │
      │
     GND (ESP32)
```

**Wiring:**

1. Solder wire ke FSR pins (panjang 30-50cm untuk reach ke ankle pouch)
2. Connect FSR ke ESP32 sesuai diagram di atas
3. Upload test sketch (lihat Appendix A)
4. Monitor serial output
5. Tekan FSR, verify nilai berubah

**Expected Output:**

```
FSR Forefoot: 512  ← idle
FSR Forefoot: 847  ← ditekan ringan
FSR Forefoot: 1023 ← ditekan kuat
```

---

### Phase 3: Insole Fabrication (Minggu 3)

**Goal:** Cut EVA foam, mount FSR sensors

**Materials:**
- EVA foam 5mm (base)
- EVA foam 2mm (cover)
- FSR sensors (sudah ter-wire)
- Super glue / B-7000 glue
- Cutter / scissors
- Marker / pen

**Steps:**

1. **Trace foot shape**
   ```
   - Taruh kaki di EVA foam 5mm
   - Trace outline dengan marker
   - Tambah margin 5-10mm
   - Cut dengan cutter
   ```

2. **Mark sensor positions**
   ```
   - Forefoot: 20-25% dari ujung depan, center
   - Midfoot: 50-55% dari ujung depan, center
   - Heel: 80-85% dari ujung depan, center
   ```

3. **Create sensor pockets**
   ```
   - Cut square 14×14mm di setiap sensor position
   - Depth: 2-3mm (jangan tembus)
   - FSR akan duduk di pocket ini
   ```

4. **Create wire channels**
   ```
   - Cut shallow channel (2mm depth) dari each pocket
   - Channel menuju HEEL AREA (bukan ke electronics)
   - Wire akan NAKE dari heel ke ankle (ke pouch)
   ```

5. **Mount FSR sensors**
   ```
   - Place FSR di pocket (active area facing up)
   - Glue edges dengan super glue (jangan cover active area!)
   - Route wires through channel
   - Tape wire di channel dengan double-sided tape
   ```

6. **Add cover layer**
   ```
   - Cut EVA 2mm sesuai base shape
   - Glue di atas base (cover sensor + wires)
   - Tekan rata, tunggu kering
   ```

7. **Optional: Add fabric top layer**
   ```
   - Cut fabric 1cm larger dari insole
   - Wrap ke edges, glue di bawah
   - Untuk kenyamanan ekstra
   ```

**⚠️ CRITICAL: Pastikan heel area TIDAK ADA elektronik! Hanya foam + FSR sensor.**

---

### Phase 4: Pouch Fabrication (Minggu 3)

**Goal:** Buat sock-top pouch untuk ESP32 + battery

**Materials:**
- Neoprene sheet 3-5mm (atau fabric)
- Velcro dots (adhesive)
- Super glue / B-7000 glue (atau sewing kit)
- Scissors
- Ruler

**Steps:**

1. **Cut neoprene/fabric**
   ```
   - Cut 2 pieces: 70 × 85 mm
   - (1 untuk left insole, 1 untuk right)
   ```

2. **Form pouch**
   ```
   - Fold piece in half (jadi 70 × 42 mm)
   - Glue 3 sisi (left, right, bottom)
   - Leave top open (slip-in opening)
   - Tekan kuat, tunggu kering
   
   OR (sewn version):
   - Sew 3 sides dengan needle + thread
   - Leave top open
   ```

3. **Add velcro dots**
   ```
   - Attach 2-3 velcro dots (hook side) di belakang pouch
   - Attach matching velcro dots (loop side) di sock ankle area
   ```

4. **Test fit**
   ```
   - Insert ESP32 + LiPo ke pouch
   - Verify fit (tidak terlalu ketat/longgar)
   - Check USB port accessible untuk charging
   - Verify battery removable
   ```

5. **Attach ke sock**
   ```
   - Tempel pouch di ankle area sock (velcro)
   - Verify secure attachment
   - Test walking (pouch tidak goyang/lepas)
   ```

---

### Phase 5: Assembly (Minggu 4)

**Goal:** Integrate semua components

**Steps:**

1. **Mount pouch ke sock**
   ```
   - Tempel pouch di ankle area sock (velcro)
   - ATAU sew langsung ke sock (permanent)
   - Verify secure attachment
   ```

2. **Connect FSR ke ESP32**
   ```
   - Colok FSR wires ke ESP32 GPIO pins
   - Solder permanen atau pakai header pins
   - Insulate connections dengan heat shrink
   - Wire routing: insole → heel → up ke ankle pouch
   ```

3. **Connect power**
   ```
   - Solder LiPo ke TP4056
   - Connect TP4056 output ke ESP32 VIN
   - Insert LiPo ke pouch (removable)
   - Test: LED ESP32 menyala
   ```

4. **Cable management**
   ```
   - Tuck excess wires ke wire channels
   - Secure dengan cable ties / tape
   - Verify no loose wires
   - Wire dari insole ke pouch: 10-15cm
   ```

5. **Final assembly**
   ```
   - Insert ESP32 + battery ke pouch
   - Close pouch opening
   - Verify all components secure
   - Test walking (comfort check)
   ```

---

### Phase 6: Testing & Calibration (Minggu 4-5)

**Goal:** Verify system works end-to-end

**Tests:**

- [ ] Wear test (1-2 jam) — comfort check
- [ ] Sensor reading test — semua FSR berfungsi
- [ ] WiFi connectivity — ESP32 connect ke WiFi
- [ ] Firebase sync — data masuk ke RTDB
- [ ] Dashboard display — data terlihat di web app
- [ ] Pressure calibration — adjust threshold berdasarkan data nyata
- [ ] Pouch security — pouch tidak lepas saat berjalan
- [ ] Battery removable — bisa lepas untuk charging

---

## Wiring Diagram (Detailed)

### Single FSR to ESP32

```
                    ESP32 DevKit (di pouch)
                   ┌───────────┐
                   │           │
    FSR #1 ────────┼── GPIO 34 │
    (forefoot)     │           │
                   │           │
    FSR #2 ────────┼── GPIO 35 │
    (midfoot)      │           │
                   │           │
    FSR #3 ────────┼── GPIO 32 │
    (heel)         │           │
                   │           │
         3.3V ─────┼── VCC     │
                   │           │
         GND ──────┼── GND     │
                   │           │
                   └───────────┘
                        ▲
                        │
                   Wire dari insole
                   (10-15cm)
```

### FSR Voltage Divider (per sensor)

```
         3.3V (dari ESP32)
          │
          │
     ┌────┴────┐
     │         │
   [FSR]    [Wire to ESP32 GPIO]
     │         │
     └────┬────┘
          │
       [10kΩ]
          │
          │
         GND (dari ESP32)

Note: FSR dan 10kΩ resistor form voltage divider.
GPIO membaca voltage yang berubah sesuai tekanan.
```

### Complete Wiring (3 FSR + ESP32 di Ankle Pouch)

```
POUCH (Top of Sock - Ankle Area):
┌─────────────────────────────────────────────────┐
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │              ESP32-WROOM-32             │   │
│  │  ┌─────┬─────┬─────┬─────┬─────┐       │   │
│  │  │3V3  │GND  │GPIO │GPIO │GPIO │       │   │
│  │  │     │     │34   │35   │32   │       │   │
│  │  └──┬──┴──┬──┴──┬──┴──┬──┴──┬──┘       │   │
│  │     │     │     │     │     │          │   │
│  └─────┼─────┼─────┼─────┼─────┼──────────┘   │
│        │     │     │     │     │              │
│  ┌─────┼─────┼─────┼─────┼─────┼──────────┐   │
│  │     │     │     │     │     │          │   │
│  │  LiPo 3.7V     │     │     │          │   │
│  │  600mAh        │     │     │          │   │
│  │  (removable)   │     │     │          │   │
│  │     │          │     │     │          │   │
│  │  TP4056        │     │     │          │   │
│  │  charger       │     │     │          │   │
│  │     │          │     │     │          │   │
│  └─────┼──────────┼─────┼─────┼──────────┘   │
│        │          │     │     │              │
│        │ USB      │     │     │              │
│        │ (charging)│    │     │              │
│        │          │     │     │              │
└────────┼──────────┼─────┼─────┼──────────────┘
         │          │     │     │
         │          │     │     │
         │     Wire ke Insole (10-15cm)
         │          │     │     │
         │     ┌────┼─────┼─────┼──────────────┐
         │     │    │     │     │              │
         │     │    ▼     ▼     ▼              │
         │     │  FSR1  FSR2  FSR3             │
         │     │ Fore. Mid. Heel               │
         │     │                                │
         │     └────────────────────────────────┘
         │              INSOLE
         │     ⚠️ Heel area: PURE FOAM ONLY
         │        (no electronics!)
         │
    (untuk charging, 
     lepas pouch dari sock)
```

---

## Firmware Pin Mapping

### Arduino/PlatformIO Code

```cpp
// Pin definitions
const int FSR_FOREFOOT_PIN = 34;  // ADC1_CH6
const int FSR_MIDFOOT_PIN = 35;   // ADC1_CH7
const int FSR_HEEL_PIN = 32;      // ADC1_CH4

// ADC settings (12-bit resolution)
const int ADC_RESOLUTION = 4095;
const float ADC_VREF = 3.3;

// Sensor calibration
const float FSR_VCC = 3.3;
const float R_FIXED = 10000.0;  // 10kΩ

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);
}

void loop() {
  int forefoot_raw = analogRead(FSR_FOREFOOT_PIN);
  int midfoot_raw = analogRead(FSR_MIDFOOT_PIN);
  int heel_raw = analogRead(FSR_HEEL_PIN);
  
  // Convert to voltage
  float forefoot_v = forefoot_raw * ADC_VREF / ADC_RESOLUTION;
  float midfoot_v = midfoot_raw * ADC_VREF / ADC_RESOLUTION;
  float heel_v = heel_raw * ADC_VREF / ADC_RESOLUTION;
  
  // Convert to force (approximate)
  float forefoot_force = calculateForce(forefoot_v);
  float midfoot_force = calculateForce(midfoot_v);
  float heel_force = calculateForce(heel_v);
  
  Serial.print("Forefoot: ");
  Serial.print(forefoot_force);
  Serial.print(" N | Midfoot: ");
  Serial.print(midfoot_force);
  Serial.print(" N | Heel: ");
  Serial.print(heel_force);
  Serial.println(" N");
  
  delay(100);  // 10Hz sampling
}

float calculateForce(float voltage) {
  // FSR resistance from voltage divider
  float fsr_resistance = R_FIXED * (FSR_VCC / voltage - 1.0);
  
  // Convert resistance to force (calibration needed!)
  // This is approximate - needs calibration dengan actual weights
  float force = 0;
  if (fsr_resistance < 1000000) {
    force = pow(10, (log10(fsr_resistance) - 6.523) / -0.629);
  }
  
  return force;
}
```

---

## Appendix A: Test Sketch

Basic FSR reading test untuk ESP32:

```cpp
/*
 * FSR Test Sketch
 * 
 * Reads 3 FSR sensors via voltage divider
 * Outputs to Serial Monitor (115200 baud)
 */

const int FSR1_PIN = 34;  // Forefoot
const int FSR2_PIN = 35;  // Midfoot
const int FSR3_PIN = 32;  // Heel

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);
  Serial.println("FSR Test Started");
}

void loop() {
  int fsr1 = analogRead(FSR1_PIN);
  int fsr2 = analogRead(FSR2_PIN);
  int fsr3 = analogRead(FSR3_PIN);
  
  Serial.print("Forefoot: ");
  Serial.print(fsr1);
  Serial.print(" | Midfoot: ");
  Serial.print(fsr2);
  Serial.print(" | Heel: ");
  Serial.println(fsr3);
  
  delay(100);
}
```

**Expected behavior:**
- Idle: nilai rendah (500-600)
- Tekan ringan: nilai naik (700-850)
- Tekan kuat: nilai maks (1000-1023)

---

## Appendix B: Calibration Procedure

### Equipment needed:
- Weights with known mass (e.g., 100g, 500g, 1kg)
- Flat surface
- Serial monitor

### Procedure:

1. **Zero calibration**
   ```
   - Tidak ada tekanan di FSR
   - Catat baseline ADC value
   - Ini adalah "0 N" reference
   ```

2. **Point calibration**
   ```
   - Letakkan weight 100g di FSR
   - Catat ADC value → ini "0.98 N" (100g × 9.8 m/s²)
   - Letakkan weight 500g
   - Catat ADC value → ini "4.9 N"
   - Letakkan weight 1kg
   - Catat ADC value → ini "9.8 N"
   ```

3. **Create calibration curve**
   ```
   - Plot ADC value (x) vs Force (y)
   - Fit curve (biasanya logaritmic untuk FSR)
   - Save calibration constants di firmware
   ```

4. **Validate**
   ```
   - Test dengan weight yang belum dipakai
   - Verify predicted force ≈ actual force
   ```

---

## Troubleshooting

### FSR tidak membaca nilai

**Check:**
- [ ] Wiring connections (solder joints)
- [ ] Voltage divider circuit (10kΩ resistor connected?)
- [ ] GPIO pin assigned correctly
- [ ] Test dengan multimeter (voltage berubah saat tekan?)

### Nilai tidak stabil / noisy

**Solution:**
- Tambahkan capacitor 100nF di GPIO pin (low-pass filter)
- Software averaging (baca 10x, ambil rata-rata)
- Check wire routing (jangan dekat WiFi antenna)

### ESP32 tidak connect ke WiFi

**Check:**
- [ ] SSID & password correct
- [ ] Signal strength adequate
- [ ] Firebase URL correct
- [ ] Check serial output untuk error messages

### Battery drain cepat

**Check:**
- [ ] Deep sleep mode enabled (untuk non-sampling period)
- [ ] WiFi duty cycle (jangan always-on)
- [ ] LED indicators (matikan jika tidak perlu)
- [ ] Sensor sampling rate (10Hz cukup, jangan 100Hz)

### Pouch lepas saat berjalan

**Check:**
- [ ] Velcro attachment secure
- [ ] Pouch position correct (ankle, bukan heel)
- [ ] Wire length adequate (10-15cm, tidak terlalu ketat)

---

## References

1. **Billings, J., Gee, J., Ghulam, Z., & Abdullah, H.A. (2024).** Smart Compression Sock for Early Detection of Diabetic Foot Ulcers. *Sensors*, 24(21), 6928. https://doi.org/10.3390/s24216928
   - Primary design reference untuk sock-top pouch placement
   - ESP32-WROOM-32, LiPo 600mAh, BLE communication
   
2. **FSR 402 Datasheet:** Interlink Electronics FSR Integration Guide

3. **ESP32 Technical Reference:** Espressif Systems

4. **EVA Foam Properties:** Wikipedia - Ethylene-vinyl acetate

5. **LiPo Battery Safety:** Battery University - BU-409

---

## Document History

| Date | Version | Changes |
|---|---|---|
| 14 Okt 2026 | 1.0 | Initial hardware spec & build guide |
| 14 Okt 2026 | 1.1 | **Updated pouch design:** Changed from heel pouch (WRONG) to sock-top pouch (following Billings et al., 2024). Heel area sekarang PURE FOAM ONLY, tidak ada elektronik. |

---

## Contact & Resources

- **Firmware repo:** `firmware/` (PlatformIO project)
- **Web dashboard:** `web-dashboard/` (React PWA)
- **ML model:** `models/rf-model.json`
- **Dataset:** `datasets/` (DFN-DS, Figshare, OptiTrack)

---

*Document created: 14 Oktober 2026*
*Last updated: 14 Oktober 2026 (v1.1 — sock-top pouch design)*
*Author: Smart Insole IoT Team*

