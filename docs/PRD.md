# PRD - Product Requirement Documentation

> Smart Insole IoT · Dokumen kebutuhan produk.
> Rujukan: [`guidebook.html`](guidebook.html), [`TRD.md`](TRD.md),
> [`AFD.md`](AFD.md), [`../README.md`](../README.md).

## 1. Latar belakang dan masalah

Diabetes Mellitus dapat menimbulkan **Diabetic Peripheral Neuropathy (DPN)**,
yaitu hilangnya sensasi pelindung pada kaki. Penderita tidak merasakan nyeri
saat telapak kaki menerima tekanan berlebih. Tekanan yang berulang pada titik
yang sama, ditambah iskemia, memicu **ulkus kaki diabetik (DFU)**.

Masalah yang disasar:

- Tekanan plantar berlebih pada titik kritis tidak terdeteksi dini.
- Pemantauan berkala di klinik tidak menangkap pola tumpuan harian.
- Belum ada alat murah yang memberi peringatan dini mandiri di rumah.

## 2. Pengguna dan persona

| Persona | Kebutuhan utama |
| --- | --- |
| Pasien diabetes dengan neuropati | Melihat status kaki saat ini dengan cepat, menerima peringatan sebelum luka terbentuk |
| Keluarga atau pendamping | Memantau dari jauh, memahami arti status tanpa istilah teknis |
| Tenaga kesehatan / orthotist | Riwayat kuantitatif dan ekspor data untuk rekomendasi terapi |
| Administrator | Mengelola pengguna, perangkat, insiden, dan konfigurasi ambang |

Catatan desain: banyak pembaca adalah lansia, membaca di cahaya siang, sering
memakai ponsel.

## 3. Tujuan

- Mengukur tekanan plantar pada tiga titik kritis secara berkelanjutan.
- Menilai risiko ke dalam dua tingkat: **Aman** dan **Waspada**, dengan ambang
  label **45 kPa** pada tekanan puncak. Tidak ada tingkat ketiga: data acuan
  berhenti di 87,1 kPa, FSR 402 hanya menjangkau ≈79 kPa, dan pasien neuropati
  yang melewati ambang sudah kehilangan sensasi pelindung sehingga tindakannya
  sama.
- Memberi peringatan dini lokal (buzzer) dan di web (notifikasi).
- Menyimpan riwayat kuantitatif dan menyediakan ekspor CSV.

### Non-tujuan (out of scope)

- Bukan alat diagnosis. Keluaran berupa tingkat risiko dan alarm, bukan
  diagnosis medis.
- Bukan pengganti pemeriksaan klinis.
- Tidak menargetkan populasi non-diabetes sebagai pengguna tervalidasi.
- Tidak memodelkan tingkat di atas Waspada: tidak ada data acuan maupun
  jangkauan sensor untuk melatih atau mengukurnya.

## 4. Ruang lingkup

| Kategori | Isi |
| --- | --- |
| Hardware | Insole EVA + 3 FSR 402 per kaki, ESP32-WROOM-32, pouch pergelangan, LiPo + TP4056 |
| Firmware | Baca sensor 10 Hz, inferensi RF di perangkat, buzzer lokal, upload ke Firebase |
| Web | 12 halaman: dashboard, monitoring, riwayat, perangkat, pengaturan, profil, admin, landing, autentikasi |
| Model | Random Forest dua kelas + kontrak ambang 45 kPa; dilatih dari DFN-DS, diuji pada subjek diabetes baru |

## 5. Kebutuhan fungsional

| ID | Kebutuhan | Status |
| --- | --- | --- |
| FR-01 | Membaca 3 sensor FSR per kaki dan mengonversinya ke kPa | Selesai |
| FR-02 | Menjalankan inferensi risiko di perangkat tanpa jaringan | Selesai |
| FR-03 | Menggerakkan buzzer lokal berdasarkan tingkat risiko | Selesai |
| FR-04 | Mengunggah telemetri ke Firebase per perangkat | Selesai |
| FR-05 | Menampilkan heatmap tekanan real-time di web | Selesai |
| FR-06 | Menampilkan grafik tren tiga region | Selesai |
| FR-07 | Menghitung ulang risiko di klien dari model yang sama | Selesai |
| FR-08 | Menyimpan dan menampilkan riwayat sesi serta insiden | Selesai |
| FR-09 | Mengekspor riwayat ke CSV | Selesai |
| FR-10 | Early warning: notifikasi web dan alarm audio | Selesai |
| FR-11 | Panel admin: pengguna, perangkat, insiden, konfigurasi | Selesai |
| FR-12 | Ambang risiko terkunci di model dan kontrak klien (45 kPa), tidak dapat diubah dari konsol | Selesai |
| FR-13 | Uji firmware pada insole fisik | Belum |

## 6. Kebutuhan non-fungsional (ringkas, rujuk TRD)

- **Kinerja:** sampel 10 Hz, paket ke Firebase 1 per detik.
- **Keandalan:** jalur alarm tidak bergantung jaringan.
- **Keamanan:** rahasia tidak masuk repo; proteksi lewat aturan database.
- **Aksesibilitas:** risiko tidak pernah disampaikan lewat warna saja; target
  sentuh minimum 44px; kontras teks terukur.
- **Bahasa:** permukaan yang dikirim hanya bahasa Indonesia (`LANG-01`).

## 7. Metrik keberhasilan

| Metrik | Target / hasil |
| --- | --- |
| Clinical contract lulus | 100% kasus acuan (20 / 40 / 44,9 / 45 / 60 / 80 / 210 / 500 kPa) |
| Macro-F1 `safe` vs `warning` | 100,0% out-of-fold, 5 lipatan berkelompok per pasien (135 pasien) |
| Sapuan gain sensor ×0,9–×1,3 | 78,4% / 100,0% / 82,4% / 69,7% / 60,9% macro-F1 |
| Edge case tanpa galat | Semua input degenerat aman, skor 0–100 |
| Uji native firmware | 10/10 lolos |
| Waktu tanggap alarm lokal | Tidak menunggu jaringan |

Catatan kejujuran: akurasi 100% berasal dari label yang dibuat oleh aturan
`peak >= 45 kPa` itu sendiri, jadi ia mengukur kesesuaian dengan aturan, bukan
generalisasi. Uji subjek baru diperlakukan sebagai studi kasus.

## 8. Risiko dan asumsi

- Tidak ada kelas ketiga: 0 sampel ≥ 200 kPa, hanya 31 sampel (3 pasien)
  ≥ 70 kPa, dan FSR 402 berhenti di ≈79 kPa.
- Ambang 45 kPa hanya berarti bila FSR dikalibrasi; macro-F1 turun ke 78,4%
  pada gain ×0,9 dan 69,7% pada ×1,2.
- Dataset hanya populasi diabetes; model belum divalidasi untuk populasi umum.
- Resolusi midfoot pada perangkat hanya tiga titik ukur.
- Uji pada perangkat fisik belum dijalankan.

## 9. Referensi

- [`docs/rf-model-report.md`](rf-model-report.md)
- [`docs/validation-report.md`](validation-report.md)
- [`docs/HARDWARE-SPEC.md`](HARDWARE-SPEC.md)
- [`tasks/prd-firebase-live-monitoring-admin.md`](../tasks/prd-firebase-live-monitoring-admin.md)
