# BSD - Backend Schema Documentation

> Smart Insole IoT · Skema backend dan kontrak data.
> Rujukan: [`TRD.md`](TRD.md), [`../README.md`](../README.md),
> `web-dashboard/src/types/insole.ts`.

## 1. Ikhtisar

Backend tunggal: **Firebase Realtime Database (RTDB)**. Tidak ada server
aplikasi. ESP32 menulis langsung ke RTDB; web membaca lewat listener. Profil
akun (`role`, `active`) tinggal di Firestore koleksi `users`, dan RTDB
menyimpan mirror yang dibaca aturan database. Firmware membangun nama field
yang sama dengan yang dibaca web, dan `src/types/insole.ts` adalah satu-satunya
tempat yang menyatakan bentuk kabel.

## 2. Pohon RTDB

```
devices/<DEVICE_ID>/readings/latest     # di-overwrite tiap push
devices/<DEVICE_ID>/readings/history    # di-append
readings/latest                         # jalur legacy (firmware lama)
readings/history                        # jalur legacy
users/<uid>/active                      # bool: akun aktif
users/<uid>/role                        # "user" | "admin"
users/<uid>/devices                     # pemasangan perangkat ke akun
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

### 3.2 `users/<uid>`

| Field | Tipe | Arti |
| --- | --- | --- |
| `active` | boolean | Ditulis Firestore, dicerminkan ke RTDB; false memblokir baca |
| `role` | string | Peran akun |
| `devices` | object | Pemetaan perangkat yang dipasangkan |

Tidak ada node `config/global`. Ambang risiko adalah konstanta klinis yang
sama di `randomForestRisk.ts` dan firmware, jadi tidak ada jalur tulis dari
klien.

### 3.3 `audit/`

Satu entri per aksi admin yang sukses (bukan per pembacaan). Dipakai untuk
triage dan jejak perubahan peran, aktivasi, dan pemasangan perangkat.

### 3.4 Penghapusan akun

Penghapusan bersifat layanan mandiri, hanya untuk akun yang sedang masuk.
Urutannya tetap dan tidak boleh ditukar:

1. autentikasi ulang dengan kata sandi (`reauthenticateWithCredential`);
2. hapus `users/<uid>` di RTDB — termasuk pemasangan perangkat, karena
   pemasangan di bawah uid mati akan memblokir perangkat itu dipasangkan lagi;
3. hapus dokumen profil di Firestore;
4. hapus pengguna Firebase Authentication (`deleteUser`) — titik commit.

Bila langkah 4 gagal, dokumen profil dibuat ulang agar akun tidak bertahan
sebagai sesi tanpa peran. Akun admin tidak dapat menghapus dirinya sendiri.
Konsol admin tidak punya tombol hapus; browser tidak dapat menghapus pengguna
Auth akun lain tanpa server, dan menghapus dokumen saja akan meninggalkan akun
yang tetap bisa masuk.

## 4. Tipe TypeScript bersama

`web-dashboard/src/types/insole.ts` mendefinisikan:

- `RiskLevel = 'safe' | 'warning' | 'danger'`
- `WireReadingPacket` (semua field `unknown`)
- `SensorReadings`, `MappedReading`, `HistoryEntry`
- `RiskThresholds`
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
      "$uid": {
        ".read": "auth.uid === $uid",
        ".write": "auth.uid === $uid && !newData.exists()"
      }
    }
  }
}
```

Contoh di atas adalah bentuk minimum: pemilik hanya membaca dan menghapus
mirror-nya sendiri; penulisan peran, aktivasi, dan pemasangan perangkat
dilakukan admin lewat konsol.

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
