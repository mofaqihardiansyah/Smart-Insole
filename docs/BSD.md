# BSD - Backend Schema Documentation

> Smart Insole IoT · Skema backend dan kontrak data.
> Rujukan: [`TRD.md`](TRD.md), [`../README.md`](../README.md),
> `web-dashboard/src/types/insole.ts`.

## 1. Ikhtisar

Backend tunggal: **Firebase Realtime Database (RTDB)**. Tidak ada server
aplikasi. ESP32 menulis langsung ke RTDB; web membaca lewat listener. Firmware
membangun nama field yang sama dengan yang dibaca web, dan
`src/types/insole.ts` adalah satu-satunya tempat yang menyatakan bentuk kabel.

## 2. Pohon RTDB

```
devices/<DEVICE_ID>/readings/latest     # di-overwrite tiap push
devices/<DEVICE_ID>/readings/history    # di-append
readings/latest                         # jalur legacy (firmware lama)
readings/history                        # jalur legacy
users/<uid>/active                      # bool: akun aktif
users/<uid>/role                        # "user" | "admin"
users/<uid>/devices                     # pemasangan perangkat ke akun
config/global                           # ambang risiko global
audit/                                  # catatan aksi admin
```

Catatan migrasi: akun tanpa pemasangan perangkat tetap memakai jalur legacy
`/readings` sampai firmware baru di-flash.

## 3. Node dan field

### 3.1 Wire packet (readings)

| Field | Tipe | Arti |
| --- | --- | --- |
| `deviceId` | string | ID perangkat |
| `timestamp` | number | Epoch milidetik |
| `forefoot_kpa` | number | Tekanan forefoot (kPa) |
| `midfoot_kpa` | number | Tekanan midfoot (kPa) |
| `heel_kpa` | number | Tekanan heel (kPa) |
| `sustained_duration_sec` | number | Durasi tumpuan (detik) |
| `risk_score` | number | Skor 0-100 |
| `risk_status` | string | `safe` / `warning` / `danger` |
| `battery_percent` | number? | Baterai (opsional) |

Setiap field bertipe `unknown` di web dengan sengaja: perangkat adalah batas
kepercayaan. Mapper mengoersi tiap field; field tak valid tampil sebagai "tidak
diketahui", bukan nol.

### 3.2 `config/global`

```json
{ "safeThreshold": 35, "dangerThreshold": 200 }
```

Ambang peak dapat diubah admin. Jendela durasi tidak dapat dikonfigurasi klien.

### 3.3 `users/<uid>`

| Field | Tipe | Arti |
| --- | --- | --- |
| `active` | boolean | Ditulis Firestore, dicerminkan ke RTDB; false memblokir baca |
| `role` | string | Peran akun |
| `devices` | object | Pemetaan perangkat yang dipasangkan |

### 3.4 `audit/`

Satu entri per aksi admin yang sukses (bukan per pembacaan). Dipakai untuk
triage dan jejak perubahan peran, aktivasi, dan pemasangan perangkat.

## 4. Tipe TypeScript bersama

`web-dashboard/src/types/insole.ts` mendefinisikan:

- `RiskLevel = 'safe' | 'warning' | 'danger'`
- `WireReadingPacket` (semua field `unknown`)
- `SensorReadings`, `MappedReading`, `HistoryEntry`
- `RiskThresholds`, `GlobalRiskConfig`
- `InsoleTransport` (permukaan RTDB yang dikonsumsi `InsoleContext`)

`InsoleContext` menerima `InsoleTransport`, bukan modul layanan, sehingga tes
dapat menyuntik stub.

## 5. Aturan keamanan

Default menolak. Contoh minimum:

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

Ketentuan tambahan yang berlaku di repo:

- Pembacaan terikat perangkat yang dipasangkan ke akun; dua pengguna tidak
  dapat mengintip kaki yang sama.
- Akun nonaktif ditolak baca saat `users/<uid>/active` false.
- Kredensial web bersifat public by design; proteksi lewat rules, bukan dengan
  menyembunyikan API key.

## 6. Kepercayaan dan validasi

- Perangkat adalah batas kepercayaan; tidak ada server yang memvalidasi bentuk.
- Firmware hanya mengirim saat kredensial nyata, Wi-Fi tersambung, dan jam NTP
  masuk akal; bila tidak, ia tetap alarm lokal dan serial.
- Waktu masuk akal mencegah pembacaan 1970 meracuni riwayat.

## 7. Retensi dan arsip

- Riwayat dapat dipangkas oleh admin ke arsip JSON.
- Register riwayat web membaca `readings/history` (via `subscribeToHistory`)
  dengan batas, lalu digabung dengan log langsung.

## 8. Rahasia

- `firmware/include/config.h` dan `web-dashboard/.env.local` tidak di-commit.
- Hanya berkas `.example` yang masuk repo.
