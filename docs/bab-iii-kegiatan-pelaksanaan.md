# BAB III — KEGIATAN PELAKSANAAN

> **Status berkas.** Draf narasi untuk laporan Tugas Akhir jenjang **D3 Teknik Informatika**. Disusun dari kode yang ada di repositori (firmware/, web-dashboard/, models/, scripts/, database.rules.json, firestore.rules) dan dari `docs/thesis-methodology.md`. Angka yang dicantumkan adalah nilai desain, bukan hasil pengukuran; hasil pengukuran menjadi isi Bab IV.

> **Cara pakai.** Setiap gambar diberi blok PLACEHOLDER. Ganti blok itu dengan gambar hasil render dari docs/diagram/*.mmd. Penomoran tabel dan gambar di sini sudah urut; sesuaikan bila ada tabel yang ditambah atau dihapus.

> **Catatan jenjang.** Laporan ini jenjang **D3**, sehingga gelar pada halaman persetujuan dan pengesahan adalah **Ahli Madya**, bukan "Sarjana Terapan". Sisa template D4 pada dokumen sumber perlu diganti. Bab III berorientasi penerapan, bukan pengembangan kerangka teoretis.

---

## 3.1 Metode Pelaksanaan

Pengerjaan Tugas Akhir ini memakai dua kerangka kerja yang berjalan bersama. Sisi rekayasa perangkat lunak mengikuti model *Waterfall* (Pressman & Maxim, 2020; Sommerville, 2016), sedangkan sisi pengolahan data dan pelatihan model mengikuti *Cross Industry Standard Process for Data Mining* (CRISP-DM) (Wirth & Hipp, 2000). Pemisahan ini diperlukan karena sistem memiliki dua jenis pekerjaan yang berbeda sifatnya. Perangkat keras dan aplikasi web bersifat deterministik, sehingga kebutuhannya dapat dibekukan di awal. Model klasifikasi bersifat iteratif karena hasil pelatihan menentukan langkah praproses berikutnya.

### 3.1.1 Model Waterfall

*Waterfall* dipilih untuk sisi perangkat keras dan aplikasi web karena kebutuhan fungsional sistem sudah dapat ditetapkan sebelum implementasi dimulai. Jumlah sensor, titik penempatan sensor, ambang risiko, dan daftar halaman antarmuka tidak berubah selama pengerjaan. Kondisi ini sesuai dengan prinsip *Waterfall*, yaitu setiap tahap diselesaikan sebelum tahap berikutnya dimulai, sehingga kesalahan kebutuhan terdeteksi lebih awal dan biaya perbaikan tetap rendah (Sommerville, 2016). Tahapan yang dilalui adalah analisis kebutuhan, perancangan, implementasi, pengujian, dan penerapan.

### 3.1.2 CRISP-DM

CRISP-DM dipakai untuk pipeline model Random Forest. Kerangka ini terdiri atas enam tahap, yaitu *business understanding*, *data understanding*, *data preparation*, *modeling*, *evaluation*, dan *deployment* (Wirth & Hipp, 2000). Tahap *evaluation* pada CRISP-DM tidak selalu berakhir di tahap akhir; bila kinerja model belum memenuhi kriteria, proses kembali ke *data preparation* atau *modeling*. Sifat iteratif inilah yang tidak dapat diakomodasi *Waterfall*.

### 3.1.3 Pemetaan Tahapan

Hubungan antara kedua kerangka kerja dan luaran tiap tahap disajikan pada Tabel 3.1. Kolom luaran menunjuk subbab laporan tempat hasil tahap tersebut didokumentasikan.

**Tabel 3.1 Pemetaan Tahapan Waterfall dan CRISP-DM**

| Tahap Waterfall | Tahap CRISP-DM | Kegiatan | Luaran | Subbab |
| --- | --- | --- | --- | --- |
| Analisis kebutuhan | *Business understanding* | Menetapkan tujuan sistem, aktor, dan batasan | Kebutuhan fungsional dan non-fungsional | 3.2 |
| Analisis kebutuhan | *Data understanding* | Memeriksa dataset DFN-DS, OptiTrack, dan Figshare DFU | Profil dataset dan keputusan kelayakan | 3.4.1 |
| Perancangan | *Data preparation* | Agregasi 8 sensor menjadi 3 region, kalibrasi ambang | Data latih dan data validasi | 3.4.2 |
| Perancangan | — | Memodelkan kebutuhan dan arsitektur | Diagram UML, arsitektur, skema data | 3.3 |
| Implementasi | *Modeling* | Melatih Random Forest, mengekspor ke C++ | Berkas model dan *header* C++ | 3.4.4 |
| Pengujian | *Evaluation* | Menguji model, alat, aplikasi, dan latensi | Skenario dan kriteria uji | 3.5 |
| Penerapan | *Deployment* | Memasang firmware dan menyerahkan panduan | Alat terpasang dan panduan pemakaian | Bab IV |

> **[PLACEHOLDER GAMBAR 3.1 — Metode CRISP-DM]** Gambar ini sudah ada di draf laporan. Pertahankan, lalu tambahkan satu gambar alur *Waterfall* bila pembimbing meminta kedua kerangka ditampilkan.

---

## 3.2 Analisis Kebutuhan

Analisis kebutuhan menghasilkan daftar perangkat keras, perangkat lunak, serta kebutuhan fungsional dan non-fungsional. Daftar ini menjadi dasar perancangan pada subbab 3.3 dan skenario pengujian pada subbab 3.5.

### 3.2.1 Kebutuhan Perangkat Keras

Perangkat keras dirancang agar dapat dipakai di dalam sepatu dan tetap memberi alarm tanpa koneksi internet. Karena itu unit pengolah ditempatkan pada wadah pergelangan kaki, bukan pada telapak insole. Daftar komponen disajikan pada Tabel 3.2.

**Tabel 3.2 Kebutuhan Perangkat Keras**

| No | Komponen | Jumlah | Fungsi |
| --- | --- | --- | --- |
| 1 | ESP32-WROOM-32 | 1 | Membaca sensor, menjalankan inferensi, mengirim data, dan mengendalikan buzzer |
| 2 | Sensor FSR 402 | 3 per insole | Mengukur tekanan pada region *forefoot*, *midfoot*, dan *heel* |
| 3 | Buzzer aktif | 1 | Alarm lokal untuk level Waspada dan Bahaya |
| 4 | Baterai LiPo | 1 | Catu daya portabel |
| 5 | Modul TP4056 | 1 | Pengisian daya dan perlindungan baterai |
| 6 | Insole EVA | 1 pasang | Alas tempat sensor ditanam |
| 7 | Wadah pergelangan kaki | 1 | Melindungi ESP32 dan baterai |
| 8 | Kabel jumper dan PCB | secukupnya | Penghubung sensor, buzzer, dan modul daya |

ESP32 dipilih karena tiga alasan yang semuanya dipakai sistem ini. Wi-Fi bawaan menghilangkan kebutuhan modul komunikasi tambahan. ADC 12-bit menyediakan pin yang cukup untuk tiga sensor. Dua inti prosesor memberi ruang bagi inferensi Random Forest yang berjalan bersamaan dengan pengiriman data (Billings et al., 2024; Khandakar et al., 2022). Sensor FSR 402 dipilih karena tipis, fleksibel, dan lazim dipakai pada penelitian insole (Castro-Martins et al., 2024; Tahir et al., 2020).

### 3.2.2 Kebutuhan Perangkat Lunak

Perangkat lunak dibagi menjadi tiga bagian: firmware, aplikasi web, dan perkakas pelatihan model. Rinciannya disajikan pada Tabel 3.3.

**Tabel 3.3 Kebutuhan Perangkat Lunak**

| No | Perangkat lunak | Versi | Fungsi |
| --- | --- | --- | --- |
| 1 | PlatformIO | — | Lingkungan pengembangan firmware ESP32 |
| 2 | C++ | C++17 | Bahasa firmware |
| 3 | Firebase Arduino Client Library | 4.4.14 | Klien Realtime Database pada ESP32 |
| 4 | React | 18.3 | Pustaka antarmuka dashboard |
| 5 | Vite | 5.4 | *Build tool* dan *development server* |
| 6 | TypeScript | 5.x | Pengetikan statis pada aplikasi web |
| 7 | Tailwind CSS | 3.4 | Penataan tampilan |
| 8 | Firebase SDK | 10.14 | Authentication, Realtime Database, dan Firestore |
| 9 | Vitest | 2.1 | Pengujian unit aplikasi web |
| 10 | Node.js | 20.x | Pelatihan model (`scripts/train-model.js`) |
| 11 | Python | 3.x | Penyiapan dataset (`scripts/prepare-dataset.py`) |
| 12 | Mermaid | — | Pembuatan diagram pada laporan |

Versi pustaka pada Tabel 3.3 adalah versi yang tercatat di `package.json` dan `platformio.ini`. Aplikasi web memakai TypeScript dengan mode *strict* agar bentuk paket data yang dikirim ESP32 dan yang dibaca antarmuka tidak menyimpang. Kontrak data dinyatakan pada satu berkas tipe dan dipakai oleh kedua sisi.

### 3.2.3 Kebutuhan Fungsional

Kebutuhan fungsional disusun dari dua sisi: sisi perangkat (FR-01 sampai FR-06) dan sisi aplikasi web (FR-07 sampai FR-13). Penomoran ini dipakai pada skenario pengujian di subbab 3.5.2.

**Tabel 3.4 Kebutuhan Fungsional**

| Kode | Kebutuhan | Aktor |
| --- | --- | --- |
| FR-01 | Sistem membaca tiga sensor FSR pada region *forefoot*, *midfoot*, dan *heel* sekali per detik | Perangkat |
| FR-02 | Sistem mengubah nilai ADC menjadi tekanan dalam kPa memakai parameter kalibrasi | Perangkat |
| FR-03 | Sistem menghitung durasi tumpuan kumulatif selama tekanan melewati ambang | Perangkat |
| FR-04 | Sistem mengklasifikasikan tingkat risiko menjadi Aman, Waspada, atau Bahaya | Perangkat |
| FR-05 | Sistem mengaktifkan buzzer dengan pola berbeda untuk Waspada dan Bahaya | Perangkat |
| FR-06 | Sistem mengirim paket JSON ke Realtime Database memakai stempel waktu NTP | Perangkat |
| FR-07 | Pengguna dapat mendaftar akun dan memverifikasi alamat email | Pengguna |
| FR-08 | Pengguna dapat masuk, keluar, dan mengatur ulang kata sandi | Pengguna, Admin |
| FR-09 | Pengguna dapat melihat dashboard tekanan terkini beserta heatmap tiga region | Pengguna |
| FR-10 | Pengguna dapat melihat grafik tren, riwayat, dan mengekspor riwayat ke CSV | Pengguna |
| FR-11 | Pengguna menerima notifikasi ketika status risiko berubah menjadi Bahaya | Pengguna |
| FR-12 | Pengguna dapat mengubah profil dan preferensi tampilan | Pengguna |
| FR-13 | Admin dapat mengelola pengguna, perangkat, insiden, dan melihat jejak audit | Admin |

### 3.2.4 Kebutuhan Non-Fungsional

**Tabel 3.5 Kebutuhan Non-Fungsional**

| Aspek | Kriteria | Cara verifikasi |
| --- | --- | --- |
| Performa | Selang waktu dari pembacaan sensor sampai tampil di dashboard di bawah 2 detik | Pengukuran stempel waktu ujung ke ujung (3.5.4) |
| Keandalan | Alarm lokal tetap berfungsi saat Wi-Fi atau Firebase tidak tersedia | Uji dengan jaringan dimatikan (3.5.2) |
| Keamanan | Data hanya dapat dibaca pengguna yang berhak; peran ditetapkan admin | Peninjauan *security rules* dan uji akses |
| Kegunaan | Tata letak dapat dipakai pada layar 360 px tanpa gulir horizontal | Pemeriksaan pada tiga lebar layar (3.5.5) |
| Kompatibilitas | Berjalan pada Chrome, Edge, Firefox, dan Safari versi terkini | Uji lintas peramban |
| Portabilitas | Insole tersedia untuk ukuran EU 42/43 | Pemeriksaan fisik |
| Pemeliharaan | Kode TypeScript *strict* dan memiliki uji unit | `npm run typecheck` dan `npm test` |

---

## 3.3 Analisis dan Perancangan Sistem

Subbab ini memuat perancangan kebutuhan (UML), arsitektur, skema data, algoritma, rangkaian, dan antarmuka. Diagram UML dipakai untuk menyatakan kebutuhan dan perilaku sistem sebelum implementasi, sesuai fungsi UML sebagai bahasa pemodelan yang memvisualisasikan, menspesifikasikan, membangun, dan mendokumentasikan artefak perangkat lunak (Booch et al., 2005; OMG, 2017).

### 3.3.1 Unified Modeling Language

Lima jenis diagram dipakai. Use case diagram menyatakan batas sistem dan aktor. Activity diagram menyatakan alur kerja. Sequence diagram menyatakan pertukaran pesan antar komponen. Class diagram menyatakan struktur data dan perilaku objek. State machine diagram menyatakan perpindahan status risiko pada firmware. Component dan deployment diagram diletakkan pada subbab 3.3.2 karena keduanya menjelaskan arsitektur, bukan kebutuhan pengguna.

#### 3.3.1.1 Use Case Diagram

Sistem memiliki tiga aktor. **Pengguna** adalah pasien atau pendamping yang memantau tekanan plantar. **Admin** adalah pengelola yang mengatur akun, perangkat, dan insiden. **Perangkat** adalah unit smart insole yang berinteraksi dengan sistem secara otomatis tanpa manusia. Pembagian hak akses disajikan pada Tabel 3.6.

**Tabel 3.6 Aktor dan Hak Akses**

| Aktor | Hak akses | Batasan |
| --- | --- | --- |
| Pengguna | Dashboard, heatmap, grafik, riwayat, ekspor, notifikasi, profil, preferensi | Hanya data perangkat yang terpasang pada akunnya |
| Admin | Ringkasan sistem, kelola pengguna, kelola perangkat, insiden, audit | Tidak dapat mengubah hasil klasifikasi |
| Perangkat | Memantau tekanan, membaca sensor, klasifikasi, alarm, kirim data | Menulis hanya ke node perangkatnya sendiri |

Use case Pengguna dan Admin dihubungkan dengan relasi asosiasi. Dua relasi antar-use case dipakai. Relasi *include* menyatakan bahwa use case dasar selalu memerlukan use case pemasok, misalnya Melihat Dashboard Real-time selalu memerlukan Melihat Heatmap Tekanan. Relasi *extend* menyatakan perluasan yang bersifat opsional, misalnya Lupa Kata Sandi memperluas Login dan Menerima Notifikasi Peringatan memperluas Dashboard ketika status berubah menjadi Bahaya. Kedua relasi tidak menyatakan urutan eksekusi (Kurniawan, 2018).

> **[PLACEHOLDER GAMBAR 3.2 — Use Case Diagram]** Berkas: docs/diagram/gambar-3-2-usecase.mmd Ganti dengan: ![Gambar 3.2 Use Case Diagram](gambar-3-2-usecase.png)

#### 3.3.1.2 Activity Diagram

Activity diagram menggambarkan alur kerja sistem. Dua alur dibuat: alur pemantauan tekanan dari sensor sampai dashboard, dan alur login beserta pemeriksaan hak akses.

Alur pemantauan berjalan berulang setiap detik. Perangkat membaca tiga sensor, mengubah nilai ADC menjadi kPa, memperbarui durasi tumpuan, menjalankan inferensi, lalu menggerakkan buzzer sesuai level. Setelah itu paket dikirim ke Realtime Database dan diterima dashboard melalui *listener*. Dashboard memvalidasi paket, memperbarui heatmap dan grafik, lalu menampilkan notifikasi bila status berubah menjadi Bahaya.

> **[PLACEHOLDER GAMBAR 3.3 — Activity Diagram Alur Monitoring]** Berkas: docs/diagram/gambar-3-3-activity-monitoring.mmd Ganti dengan: ![Gambar 3.3 Activity Diagram Alur Monitoring](gambar-3-3-activity-monitoring.png)

Alur login memeriksa empat hal secara berurutan: format masukan, kebenaran kredensial, status verifikasi email, dan peran akun. Akun yang dinonaktifkan diarahkan ke layar khusus dan tidak dapat membuka dashboard.

> **[PLACEHOLDER GAMBAR 3.4 — Activity Diagram Login]** Berkas: docs/diagram/gambar-3-4-activity-login.mmd Ganti dengan: ![Gambar 3.4 Activity Diagram Login](gambar-3-4-activity-login.png)

#### 3.3.1.3 Sequence Diagram

Sequence diagram menekankan urutan pesan antar komponen. Diagram pertama menunjukkan siklus satu detik pada jalur data, termasuk perbedaan perilaku buzzer untuk tiap level. Diagram kedua menunjukkan pemeriksaan kredensial dan peran pada saat login.

> **[PLACEHOLDER GAMBAR 3.5 — Sequence Diagram Pengiriman Data]** Berkas: docs/diagram/gambar-3-5-sequence-realtime.mmd Ganti dengan: ![Gambar 3.5 Sequence Diagram Pengiriman Data](gambar-3-5-sequence-realtime.png)

> **[PLACEHOLDER GAMBAR 3.6 — Sequence Diagram Login]** Berkas: docs/diagram/gambar-3-6-sequence-login.mmd Ganti dengan: ![Gambar 3.6 Sequence Diagram Login](gambar-3-6-sequence-login.png)

Pada Gambar 3.6 terlihat bahwa peran akun tidak disimpan pada token, melainkan dibaca dari dokumen pengguna di Firestore. Cara ini memungkinkan admin menonaktifkan akun tanpa menunggu token kedaluwarsa.

#### 3.3.1.4 Class Diagram

Class diagram memuat kelas domain yang benar-benar dipakai implementasi, bukan kelas rekaan. Kelas `Reading` adalah bentuk tervalidasi dari paket yang dikirim perangkat, dengan field `forefoot_kpa`, `midfoot_kpa`, `heel_kpa`, `sustained_duration_sec`, `risk_score`, `risk_status`, dan `battery_percent`. Kelas `RiskLevel` berupa enumerasi `SAFE`, `WARNING`, dan `DANGER`. Kelas `RandomForestModel` menyimpan jumlah pohon, kedalaman, dan daftar simpul, serta menyediakan operasi `predict` dan `toCpp`.

Relasi yang dipakai adalah asosiasi satu-ke-banyak antara User dan Device, antara Device dan Reading, serta antara Reading dan Alert. Kelas HistoryEntry mewarisi Reading dan menambahkan kunci *push* Firebase sebagai identitas baris.

> **[PLACEHOLDER GAMBAR 3.7 — Class Diagram]** Berkas: docs/diagram/gambar-3-7-class.mmd Ganti dengan: ![Gambar 3.7 Class Diagram](gambar-3-7-class.png)

#### 3.3.1.5 State Machine Diagram

Status risiko pada firmware dimodelkan sebagai state machine dengan tiga state. Perpindahan state diperiksa setiap sampel. Ambang yang dipakai mengikuti implementasi pada `firmware/src/RandomForest.cpp`, yaitu Bahaya ketika tekanan puncak mencapai 200 kPa pada satu sampel, Aman ketika tekanan puncak di bawah 35 kPa dan durasi tumpuan di bawah 20 detik, dan Waspada untuk keadaan lainnya. Nilai 20 detik setara 200 sampel pada laju 10 Hz.

> **[PLACEHOLDER GAMBAR 3.8 — State Machine Diagram]** Berkas: docs/diagram/gambar-3-8-state-machine.mmd Ganti dengan: ![Gambar 3.8 State Machine Diagram](gambar-3-8-state-machine.png)

> **Catatan penyelarasan.** Ambang risiko yang dipakai laporan ini adalah ambang implementasi pada `firmware/src/RandomForest.cpp`: Bahaya ketika tekanan puncak mencapai 200 kPa pada satu sampel, Waspada ketika tekanan puncak mencapai 35 kPa atau durasi tumpuan mencapai 20 detik, dan Aman untuk keadaan lainnya. Tabel 2.4 pada Bab II masih mencantumkan 70 kPa dengan durasi 0,1 detik karena diwarisi dari acuan pustaka. **Angka tekanan pada Tabel 2.4 perlu direvisi dari 70 kPa menjadi 200 kPa** agar Bab II, Bab III, dan Bab IV memakai ambang yang sama. Syarat durasi 0,1 detik pada Tabel 2.4 tidak perlu diubah karena implementasi memakai `DANGER_SUSTAINED_RAW` = 1 sampel, yang pada laju 10 Hz setara 0,1 detik.

### 3.3.2 Arsitektur IoT Tiga Lapis

Arsitektur sistem dibagi menjadi tiga lapisan. **Lapisan perangkat** berisi insole, sensor FSR, dan ESP32 yang melakukan akuisisi serta inferensi. **Lapisan jaringan** berupa koneksi Wi-Fi 2,4 GHz yang membawa paket JSON. **Lapisan layanan** berupa Firebase yang menyimpan dan menyinkronkan data ke aplikasi web. Pembagian ini memisahkan tanggung jawab sehingga kegagalan jaringan tidak mematikan fungsi alarm.

> **[PLACEHOLDER GAMBAR 3.9 — Diagram Blok Arsitektur Tiga Lapis]** Berkas: docs/diagram/gambar-3-9-arsitektur-tiga-lapis.mmd. Ganti dengan: ![Gambar 3.9 Diagram Blok Arsitektur Tiga Lapis](gambar-3-9-arsitektur-tiga-lapis.png)

Component diagram memperlihatkan komponen perangkat lunak beserta ketergantungan antarkomponen. Pada sisi tepi, sensor FSR masuk ke ADC, dilanjutkan ke modul kalibrasi, penghitung durasi, dan modul inferensi. Modul inferensi memberi keluaran ke driver buzzer dan ke klien Firebase. Pada sisi cloud, *security rules* membatasi akses ke Realtime Database dan Firestore. Pada sisi web, modul autentikasi dan layanan data real-time memberi masukan ke antarmuka dashboard, riwayat, dan konsol admin.

> **[PLACEHOLDER GAMBAR 3.10 — Component Diagram]** Berkas: docs/diagram/gambar-3-10-component.mmd Ganti dengan: ![Gambar 3.10 Component Diagram](gambar-3-10-component.png)

Deployment diagram memperlihatkan letak fisik setiap artefak. Firmware berjalan pada node smart insole bersama sensor, buzzer, dan baterai. Peramban pengguna dan peramban admin berjalan pada perangkat berbeda. Authentication, Realtime Database, dan Firestore berjalan sebagai layanan di Google Cloud. NTP server dipakai perangkat untuk memperoleh stempel waktu yang sah, karena tanpa waktu yang benar riwayat tidak dapat diurutkan.

> **[PLACEHOLDER GAMBAR 3.11 — Deployment Diagram]** Berkas: docs/diagram/gambar-3-11-deployment.mmd Ganti dengan: ![Gambar 3.11 Deployment Diagram](gambar-3-11-deployment.png)

### 3.3.3 Skema Basis Data Firebase

Firebase yang dipakai terdiri atas dua layanan dengan model data berbeda. Realtime Database menyimpan data deret waktu sebagai pohon JSON, sedangkan Cloud Firestore menyimpan dokumen profil dan peran pengguna. Karena keduanya bukan basis data relasional, ERD pada Gambar 3.12 diposisikan sebagai model konseptual, bukan skema fisik. Pemetaan entitas ke node dan koleksi disajikan pada Tabel 3.7, dan kontrak paket data pada Tabel 3.8.

> **[PLACEHOLDER GAMBAR 3.12 — Entity Relationship Diagram]** Berkas: docs/diagram/gambar-3-12-erd.mmd Ganti dengan: ![Gambar 3.12 Entity Relationship Diagram](gambar-3-12-erd.png)

**Tabel 3.7 Pemetaan Entitas ERD ke Firebase**

| Entitas | Penyimpanan | Lokasi | Keterangan |
| --- | --- | --- | --- |
| USER | Firestore | `users/{uid}` | Menyimpan `role` dan `active` |
| DEVICE | Realtime Database | `users/{uid}/devices/{deviceId}` | Penanda perangkat yang terpasang pada akun |
| READING | Realtime Database | `devices/{deviceId}/readings/latest` | Satu paket terbaru |
| READING | Realtime Database | `devices/{deviceId}/readings/history/{pushId}` | Deret riwayat |
| ALERT | Turunan (tidak disimpan) | — | Dibentuk di sisi web dari paket readings yang bernilai `risk_status`: "danger"; tidak ada node khusus |
| AUDIT_LOG | Realtime Database | `audit/{pushId}` | Jejak tindakan admin |
| TRIAGE | Realtime Database | `triage/{deviceId}/{pushId}` | Catatan penanganan insiden |

Lima entitas disimpan sebagai node atau koleksi nyata, yaitu USER, DEVICE, READING, AUDIT_LOG, dan TRIAGE. Entitas ALERT tetap digambarkan pada ERD karena merupakan konsep yang dipakai antarmuka, tetapi tidak disimpan tersendiri. Notifikasi bahaya dibentuk di sisi web dari paket readings yang berstatus danger. Cara ini dipilih agar tidak ada dua sumber kebenaran untuk kejadian yang sama. Bila alert disimpan terpisah, satu paket danger dapat tercatat dua kali atau tidak tercatat sama sekali ketika penulisan kedua gagal. Riwayat kejadian bahaya tetap dapat ditelusuri karena setiap paket tersimpan pada `readings/history`.

Struktur pohon JSON untuk satu perangkat adalah sebagai berikut.

```
{
  "devices": {
    "<deviceId>": {
      "readings": {
        "latest": {
          "deviceId": "insole-01",
          "timestamp": 1762905000000,
          "forefoot_kpa": 42.5,
          "midfoot_kpa": 18.0,
          "heel_kpa": 63.2,
          "sustained_duration_sec": 8,
          "risk_score": 61,
          "risk_status": "warning",
          "battery_percent": 78
        },
        "history": {
          "<pushId>": { "timestamp": 1762905000000 }
        }
      }
    }
  }
}
```

**Tabel 3.8 Kontrak Data Paket Reading**

| Field | Tipe | Satuan | Wajib | Keterangan |
| --- | --- | --- | --- | --- |
| deviceId | string | — | ya | Identitas perangkat |
| timestamp | number | milidetik | ya | Waktu epoch dari NTP |
| forefoot_kpa | number | kPa | ya | Tekanan region depan |
| midfoot_kpa | number | kPa | ya | Tekanan region tengah |
| heel_kpa | number | kPa | ya | Tekanan region tumit |
| sustained_duration_sec | number | detik | ya | Durasi tumpuan kumulatif |
| risk_score | number | 0–100 | ya | Skor risiko dari inferensi |
| `risk_status` | string | — | ya | safe, warning, atau danger |
| battery_percent | number | persen | tidak | Sisa daya baterai |

Kontrak pada Tabel 3.8 divalidasi di sisi web. Nilai yang tidak sesuai tipe diubah menjadi nol atau null agar antarmuka menampilkan keadaan tidak diketahui alih-alih menampilkan angka palsu. Pembacaan yang tidak pernah dikirim perangkat juga dibedakan dari pembacaan bernilai nol.

### 3.3.4 Flowchart Sistem dan Inferensi

Flowchart sistem menggambarkan urutan dari akuisisi sensor sampai penyajian data. Flowchart inferensi memuat pemeriksaan aturan klinis lebih dahulu, kemudian klasifikasi Random Forest. Urutannya: hitung tekanan puncak, periksa aturan Bahaya, periksa aturan Aman, lalu jalankan klasifikasi untuk memilih Aman atau Waspada bila kedua aturan tidak terpenuhi.

> **[PLACEHOLDER GAMBAR 3.13 — Flowchart Sistem]** Berkas: docs/diagram/gambar-3-13-flowchart-sistem.mmd. Ganti dengan: ![Gambar 3.13 Flowchart Sistem](gambar-3-13-flowchart-sistem.png)

> **[PLACEHOLDER GAMBAR 3.14 — Flowchart Inferensi Random Forest]** Berkas: docs/diagram/gambar-3-14-flowchart-inferensi.mmd. Ganti dengan: ![Gambar 3.14 Flowchart Inferensi Random Forest](gambar-3-14-flowchart-inferensi.png)

### 3.3.5 Wiring Diagram dan Desain 3D Insole

Wiring diagram menghubungkan tiga sensor FSR ke pin ADC ESP32 dan buzzer ke pin digital. Pemetaan pin disajikan pada Tabel 3.9. Ketiga pin ADC dipilih dari ADC1 agar tidak bertabrakan dengan pemakaian Wi-Fi, yang membatasi ADC2 pada ESP32.

**Tabel 3.9 Pemetaan Pin ESP32**

| Komponen | Pin ESP32 | Keterangan |
| --- | --- | --- |
| FSR *forefoot* | GPIO34 (ADC1_CH6) | Masukan analog |
| FSR *midfoot* | GPIO35 (ADC1_CH7) | Masukan analog |
| FSR *heel* | GPIO32 (ADC1_CH4) | Masukan analog |
| Buzzer aktif | GPIO27 | Keluaran digital |

Rangkaian pembaca sensor memakai pembagi tegangan dengan resistor tetap. Tegangan keluaran mengikuti persamaan Vout = Vcc × R / (R + R_FSR), lalu dibaca ADC 12-bit dengan rentang 0 sampai 4095 (Khandakar et al., 2022). Nilai mentah dikoreksi dengan `ADC_OFFSET` dan dikalikan `ADC_TO_KPA`, dua parameter yang diisi setelah kalibrasi.

> **[PLACEHOLDER GAMBAR 3.15 — Wiring Diagram]** Belum dibuat. Gunakan Fritzing atau KiCad. Tampilkan ESP32, tiga FSR beserta resistor pembagi, buzzer, TP4056, dan baterai LiPo.

Desain 3D insole memuat posisi tiga sensor pada telapak, jalur kabel, dan wadah pergelangan kaki. Wadah diperlukan karena baterai dan ESP32 tidak muat di dalam insole tanpa mengganggu kenyamanan.

> **[PLACEHOLDER GAMBAR 3.16 — Desain 3D Insole]** Berkas acuan: docs/3d/ (berkas OpenSCAD dan hasil render).

### 3.3.6 Desain Antarmuka Web

Antarmuka disusun dengan pendekatan *mobile-first*: tata letak dirancang untuk layar 360 px lebih dahulu, lalu diperlebar untuk tablet dan desktop. Sebelas halaman disiapkan untuk pengguna dan empat halaman untuk admin, seperti pada Tabel 3.10.

**Tabel 3.10 Daftar Halaman Antarmuka**

| No | Halaman | Rute | Aktor | Isi utama |
| --- | --- | --- | --- | --- |
| 1 | Landing | / | Publik | Pengenalan sistem dan ajakan mendaftar |
| 2 | Login | /login | Publik | Formulir masuk |
| 3 | Register | /register | Publik | Formulir pendaftaran |
| 4 | Verifikasi Email | /verify-email | Publik | Status dan kirim ulang verifikasi |
| 5 | Lupa Kata Sandi | /forgot-password | Publik | Permintaan tautan atur ulang |
| 6 | Dashboard | /dashboard | Pengguna | Heatmap, status, dan ringkasan |
| 7 | Monitoring | /monitoring | Pengguna | Grafik tren tekanan |
| 8 | Riwayat | /history | Pengguna | Tabel riwayat dan ekspor CSV |
| 9 | Perangkat | /device | Pengguna | Status perangkat dan baterai |
| 10 | Notifikasi | /notifications | Pengguna | Daftar peringatan |
| 11 | Profil | /profile | Pengguna | Data akun |
| 12 | Pengaturan | /settings | Pengguna | Bahasa dan tema |
| 13 | Ringkasan Admin | /admin | Admin | Statistik sistem |
| 14 | Kelola Pengguna | /admin/users | Admin | Aktifkan, nonaktifkan, ubah peran |
| 15 | Kelola Perangkat | /admin/devices | Admin | Pemasangan dan pencabutan perangkat |
| 16 | Insiden | /admin/incidents | Admin | Penanganan dan catatan insiden |

> **Catatan jumlah halaman.** Rancangan awal menyebut 12 halaman. Angka itu berlaku untuk halaman publik dan pengguna, yaitu nomor 1 sampai 12 pada Tabel 3.10. Empat halaman admin adalah tambahan, sehingga totalnya 16 halaman. Angka 12 tidak salah; yang perlu disebutkan adalah cakupannya.

> **[PLACEHOLDER GAMBAR 3.17–3.22 — Wireframe Enam Halaman Utama]** Belum dibuat. Minimal: Landing, Login, Dashboard, Monitoring, Riwayat, dan Ringkasan Admin. Gunakan Figma atau draw.io dengan lebar 360 px.

---

## 3.4 Perancangan Model Random Forest

### 3.4.1 Dataset

Model dilatih dengan dataset DFN-DS yang memuat rekaman tekanan plantar dari 135 pasien, masing-masing 600 sampel, sehingga totalnya 81.000 sampel. Setiap rekaman mencatat delapan sensor per kaki pada 6.001 baris waktu. Dataset ini dipakai karena menyediakan data tekanan plantar pasien diabetes, populasi yang menjadi sasaran sistem.

Dua dataset lain dipakai sebagai pembanding, bukan untuk melatih. Dataset OptiTrack dipakai untuk memeriksa pola tiga region saat berjalan, dan dataset Figshare DFU dipakai untuk memeriksa apakah ambang tekanan berada di dalam rentang yang nyata. Rincian ketiga dataset dan hasil pemeriksaan tersedia pada `docs/thesis-methodology.md` bagian 3.2.

### 3.4.2 Praproses

Delapan sensor per kaki diagregasi menjadi tiga region yang sesuai susunan insole: L1–L3 menjadi *forefoot*, L4–L5 menjadi *midfoot*, dan L6–L8 menjadi *heel*. Setiap langkah waktu menghasilkan dua fitur, yaitu tekanan puncak (peak) dalam kPa dan durasi tumpuan (sustained) dalam satuan sampel 10 Hz.

Ambang peringatan ditetapkan dari kuantil ke-75 distribusi tekanan DFN-DS, yaitu 12,39 kPa mentah, diskalakan 2,8249 kali menjadi 35 kPa. Jendela durasi peringatan ditetapkan 20 detik atau 200 sampel.

### 3.4.3 Pelabelan

Label tidak memakai kelompok pasien. Aturan pelabelan menetapkan kelas warning ketika tekanan puncak mencapai 35 kPa atau durasi mencapai 200 sampel, dan safe untuk keadaan lainnya. Kelompok DM dan DFN hanya dipakai untuk memastikan pembagian data seimbang. Pembagian data dilakukan per pasien dengan rasio 80:20, yaitu 107 pasien untuk pelatihan dan 28 pasien untuk validasi, agar karakteristik satu pasien tidak muncul di kedua sisi.

Kelas danger tidak dilatih karena dataset tidak memuat satu pun sampel dengan tekanan puncak di atas 200 kPa; puncak tertinggi DFN-DS adalah 87,06 kPa. Kelas ini ditangani aturan klinis, bukan oleh pohon keputusan.

### 3.4.4 Pelatihan dan Ekspor

Pelatihan dijalankan di Node.js melalui `scripts/train-model.js` atas berkas `models/training-data.json` hasil `scripts/prepare-dataset.py`, sehingga seluruh pipeline dapat diulang dari data mentah. Sapuan hiperparameter mencakup 20 dan 50 pohon serta kedalaman 8 dan 12, dengan minimum 4 sampel per daun. Konfigurasi terpilih disajikan pada Tabel 3.11.

**Tabel 3.11 Parameter Model Random Forest**

| Parameter | Nilai | Alasan |
| --- | --- | --- |
| Jumlah pohon | 20 | Ukuran model tetap kecil untuk memori ESP32 |
| Kedalaman maksimum | 8 | Paling banyak 511 simpul per pohon |
| Kriteria pemisahan | Gini | Standar untuk klasifikasi |
| Minimum sampel per daun | 4 | Menghindari daun yang terlalu spesifik |
| Pembobotan kelas | Berbanding terbalik frekuensi, maksimum 10× | Menjaga kelas minoritas tetap terwakili |
| Fitur | peak, sustained | Dua besaran yang menentukan risiko |
| Kelas keluaran | safe, warning | danger ditangani aturan klinis |

Model hasil pelatihan diekspor dua kali: ke JSON untuk aplikasi web dan ke *header* C++ untuk firmware. Ekspor ke C++ mengubah setiap pohon menjadi rangkaian percabangan if, sehingga inferensi berjalan tanpa pustaka tambahan dan tanpa server. Pendekatan *on-device* ini membedakan sistem dari penelitian terdahulu yang memproses data di luar perangkat (Veran et al., 2026).

---

## 3.5 Perancangan Pengujian

Pengujian dibagi menjadi lima kelompok. Setiap kelompok menetapkan objek uji, prosedur, dan kriteria keberhasilan sebelum pengujian dijalankan, agar hasil pada Bab IV dapat dinilai terhadap kriteria yang sama.

### 3.5.1 Pengujian Alat dan Kalibrasi Sensor

Pengujian ini memeriksa hubungan antara beban yang diberikan dan nilai yang dibaca sistem. Beban acuan diberikan bertingkat, lalu nilai kPa hasil konversi dibandingkan dengan nilai acuan.

**Tabel 3.12 Rancangan Pengujian Kalibrasi FSR**

| Objek uji | Perlakuan | Data yang diambil | Kriteria |
| --- | --- | --- | --- |
| Tiga sensor FSR | Beban bertingkat 0–20 kg | Nilai ADC dan kPa | Galat relatif rata-rata di bawah 5% |
| Tiga sensor FSR | Beban berulang 5 kali | Sebaran nilai | Simpangan baku kecil dan dapat diulang |
| ADC ESP32 | Pembacaan tanpa beban | Nilai dasar | Tidak ada nilai negatif setelah koreksi offset |

### 3.5.2 Pengujian Fungsionalitas Web

Pengujian fungsional memakai metode *black-box*: penguji hanya mengamati masukan dan luaran tanpa memeriksa kode. Setiap kebutuhan fungsional pada Tabel 3.4 diuji minimal satu kali.

**Tabel 3.13 Rancangan Pengujian Black-Box**

| No | Kebutuhan | Skenario | Hasil yang diharapkan |
| --- | --- | --- | --- |
| 1 | FR-07 | Daftar dengan email baru | Akun dibuat dan email verifikasi terkirim |
| 2 | FR-08 | Login dengan kata sandi salah | Pesan galat tampil, dashboard tidak terbuka |
| 3 | FR-08 | Login dengan akun nonaktif | Layar akun dinonaktifkan tampil |
| 4 | FR-09 | Buka dashboard saat perangkat mengirim data | Heatmap dan status diperbarui di bawah 2 detik |
| 5 | FR-10 | Buka riwayat lalu unduh CSV | Berkas terunduh dengan kolom lengkap |
| 6 | FR-11 | Perangkat mengirim status Bahaya | Notifikasi peringatan tampil |
| 7 | FR-13 | Admin menonaktifkan akun pengguna | Pengguna tidak dapat masuk pada percobaan berikutnya |
| 8 | FR-05 | Matikan Wi-Fi saat status Bahaya | Buzzer tetap berbunyi |

### 3.5.3 Pengujian Model

Pengujian model mengukur kinerja klasifikasi dan kepatuhan terhadap kontrak klinis. Kinerja diukur pada 28 pasien yang tidak dipakai melatih.

**Tabel 3.14 Rancangan Pengujian Model**

| Aspek | Metrik | Data | Kriteria |
| --- | --- | --- | --- |
| Kinerja klasifikasi | Accuracy, precision, recall, F1 per kelas | 28 pasien validasi | Dilaporkan apa adanya, tanpa ambang lolos |
| Keseimbangan kelas | Macro-F1 | 28 pasien validasi | Lebih bermakna daripada accuracy pada data tidak seimbang |
| Kontrak klinis | Persentase kasus acuan yang sesuai | Kasus terkontrol | Seluruh kasus acuan terpenuhi |
| Konsistensi level dan skor | Kesepadanan level dengan pita skor | Sapuan grid 0–120 kPa dan 0–60 detik | Tidak ada skor di luar pita levelnya |
| Kesamaan firmware dan web | Perbandingan keputusan | Masukan identik pada kedua sisi | Tidak ada perbedaan keputusan |

Kasus acuan yang dipakai adalah 40 kPa harus Waspada, 199 kPa selama 31 detik tetap Waspada, 210 kPa selama 31 detik harus Bahaya, dan 20 kPa tanpa durasi harus Aman.

### 3.5.4 Pengujian Latensi dan Kualitas Layanan

Latensi diukur dari waktu pembacaan sensor sampai data tampil di dashboard. Pengukuran memakai selisih stempel waktu perangkat dan waktu terima di peramban, sehingga mencakup perjalanan Wi-Fi, penulisan basis data, dan pembaruan antarmuka.

**Tabel 3.15 Rancangan Pengujian Latensi dan QoS**

| Parameter | Cara ukur | Sampel | Kriteria |
| --- | --- | --- | --- |
| Latensi ujung ke ujung | Selisih stempel waktu | 100 paket | Rata-rata di bawah 2 detik |
| Kehilangan paket | Jumlah paket diterima dibagi jumlah dikirim | 5 menit | Diketahui dan dilaporkan |
| Waktu sambung ulang | Selang sampai data kembali masuk setelah Wi-Fi diputus | 10 percobaan | Kembali tanpa memuat ulang halaman |
| Kestabilan sesi | Durasi tanpa putus | 1 jam | Tidak ada kegagalan yang menghentikan pengiriman |

### 3.5.5 Pengujian Kepuasan Pengguna

Pengujian kepuasan memakai kuesioner kepada sejumlah responden yang mencoba sistem. Instrumen memakai skala Likert 1–5 untuk aspek kemudahan, kejelasan informasi, dan manfaat, serta *User Experience Questionnaire* untuk menilai daya tarik, kejelasan, efisiensi, ketepatan, stimulasi, dan kebaruan (Laugwitz et al., 2008).

**Tabel 3.16 Instrumen Kepuasan Pengguna**

| Aspek | Jumlah butir | Skala | Kriteria |
| --- | --- | --- | --- |
| Kemudahan penggunaan | 5 | Likert 1–5 | Rata-rata minimal 4,0 |
| Kejelasan informasi tekanan | 5 | Likert 1–5 | Rata-rata minimal 4,0 |
| Manfaat bagi pemantauan mandiri | 4 | Likert 1–5 | Rata-rata minimal 4,0 |
| Pengalaman pengguna | 26 | UEQ 1–7 | Dilaporkan per skala |

Jumlah responden ditetapkan setelah rancangan pengujian disetujui pembimbing, karena jumlah tersebut bergantung pada ketersediaan pasien atau pendamping di lokasi pengujian.

---

## Lampiran A — Daftar Gambar Usulan

| Gambar | Judul | Sumber |
| --- | --- | --- |
| 3.1 | Metode CRISP-DM | Sudah ada |
| 3.2 | Use Case Diagram | docs/diagram/gambar-3-2-usecase.mmd |
| 3.3 | Activity Diagram Alur Monitoring | docs/diagram/gambar-3-3-activity-monitoring.mmd |
| 3.4 | Activity Diagram Login | docs/diagram/gambar-3-4-activity-login.mmd |
| 3.5 | Sequence Diagram Pengiriman Data | docs/diagram/gambar-3-5-sequence-realtime.mmd |
| 3.6 | Sequence Diagram Login | docs/diagram/gambar-3-6-sequence-login.mmd |
| 3.7 | Class Diagram | docs/diagram/gambar-3-7-class.mmd |
| 3.8 | State Machine Diagram | docs/diagram/gambar-3-8-state-machine.mmd |
| 3.9 | Diagram Blok Arsitektur Tiga Lapis | docs/diagram/gambar-3-9-arsitektur-tiga-lapis.mmd |
| 3.10 | Component Diagram | docs/diagram/gambar-3-10-component.mmd |
| 3.11 | Deployment Diagram | docs/diagram/gambar-3-11-deployment.mmd |
| 3.12 | Entity Relationship Diagram | docs/diagram/gambar-3-12-erd.mmd |
| 3.13 | Flowchart Sistem | docs/diagram/gambar-3-13-flowchart-sistem.mmd |
| 3.14 | Flowchart Inferensi Random Forest | docs/diagram/gambar-3-14-flowchart-inferensi.mmd |
| 3.15 | Wiring Diagram | Belum dibuat |
| 3.16 | Desain 3D Insole | docs/3d/render/ |
| 3.17–3.22 | Wireframe Halaman Utama | Belum dibuat |

## Lampiran B — Daftar Tabel Usulan

| Tabel | Judul |
| --- | --- |
| 3.1 | Pemetaan Tahapan Waterfall dan CRISP-DM |
| 3.2 | Kebutuhan Perangkat Keras |
| 3.3 | Kebutuhan Perangkat Lunak |
| 3.4 | Kebutuhan Fungsional |
| 3.5 | Kebutuhan Non-Fungsional |
| 3.6 | Aktor dan Hak Akses |
| 3.7 | Pemetaan Entitas ERD ke Firebase |
| 3.8 | Kontrak Data Paket Reading |
| 3.9 | Pemetaan Pin ESP32 |
| 3.10 | Daftar Halaman Antarmuka |
| 3.11 | Parameter Model Random Forest |
| 3.12 | Rancangan Pengujian Kalibrasi FSR |
| 3.13 | Rancangan Pengujian Black-Box |
| 3.14 | Rancangan Pengujian Model |
| 3.15 | Rancangan Pengujian Latensi dan QoS |
| 3.16 | Instrumen Kepuasan Pengguna |

## Lampiran C — Referensi Tambahan yang Perlu Masuk Daftar Pustaka

Entri berikut belum ada di docs/daftar-pustaka.md maupun di daftar pustaka revisi3, tetapi dikutip pada draf ini.

```
Elmasri, R., & Navathe, S. B. (2016). Fundamentals of database systems
  (7th ed.). Pearson.

Fowler, M. (2003). UML distilled: A brief guide to the standard object
  modeling language (3rd ed.). Addison-Wesley.

Laugwitz, B., Held, T., & Schrepp, M. (2008). Construction and evaluation of
  a user experience questionnaire. In A. Holzinger (Ed.), HCI and usability
  for education and work (pp. 63–76). Springer.
  https://doi.org/10.1007/978-3-540-89350-9_6

Pressman, R. S., & Maxim, B. R. (2020). Software engineering: A
  practitioner's approach (9th ed.). McGraw-Hill.

Sommerville, I. (2016). Software engineering (10th ed.). Pearson.

Wirth, R., & Hipp, J. (2000). CRISP-DM: Towards a standard process model for
  data mining. Proceedings of the 4th International Conference on the
  Practical Application of Knowledge Discovery and Data Mining, 29–39.
```

## Lampiran D — Keputusan yang Sudah Ditetapkan

Keempat butir berikut sudah diputuskan dan draf ini mengikutinya.

1. **Ambang risiko memakai versi firmware.** Bahaya ≥ 200 kPa selama ≥ 1 sampel (`DANGER_PEAK_KPA` = 200, `DANGER_SUSTAINED_RAW` = 1), Waspada ≥ 35 kPa atau ≥ 200 sampel (20 detik), Aman untuk keadaan lainnya. Konsekuensinya **angka tekanan pada Tabel 2.4 Bab II harus diubah dari 70 kPa menjadi 200 kPa**. Syarat durasi 0,1 detik pada tabel itu sudah sesuai karena 1 sampel pada 10 Hz sama dengan 0,1 detik. Selama Tabel 2.4 belum disunting, Bab II dan Bab III saling bertentangan.
2. **Entitas ALERT tetap turunan.** Tidak dibuat node baru di Realtime Database. Alert dibentuk di sisi web dari paket readings berstatus danger. ERD tetap menampilkan ALERT sebagai entitas konseptual, dan Tabel 3.7 menyatakannya sebagai turunan.
3. **Jumlah halaman 16.** Dua belas halaman publik dan pengguna, ditambah empat halaman admin. Pembagian ini disebutkan pada catatan setelah Tabel 3.10.
4. **Jenjang D3, gelar Ahli Madya.** Halaman persetujuan dan pengesahan mengikuti jenjang D3. Sisa template D4 pada dokumen sumber diganti.

## Lampiran E — Sisa Pekerjaan

| Butir | Keadaan | Penghambat |
| --- | --- | --- |
| Tabel 2.4 Bab II | Masih 70 kPa / 0,1 detik | Ubah angka tekanan menjadi 200 kPa pada dokumen laporan; syarat 0,1 detik sudah sesuai |
| Gambar 3.15 Wiring diagram | Belum dibuat | Perlu keputusan alat gambar (Fritzing atau KiCad) |
| Gambar 3.16 Desain 3D insole | Tersedia di docs/3d/render/ | Perlu dipilih render mana yang dipakai |
| Gambar 3.17–3.22 Wireframe | Belum dibuat | Perlu keputusan enam halaman mana yang ditampilkan |
| Ekspor DOCX | Belum | pandoc tidak terpasang di mesin ini |
