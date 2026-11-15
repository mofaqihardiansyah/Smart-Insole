# Draf Materi Sidang (Fase 6.3 dan 6.4)

> Dua bagian: kerangka slide metode Random Forest, dan skrip demo
> ujung-ke-ujung. Angka bersumber dari `docs/evidence/metrics.json` dan
> [`docs/evidence/hasil-pengujian-model.html`](evidence/hasil-pengujian-model.html).

## 6.3 Slide: metode Random Forest

Enam slide, masing-masing satu pesan. Angka di slide harus sama dengan laporan;
jangan menambah klaim akurasi baru di luar itu.

### Slide 1 — Judul dan satu kalimat masalah

> Tekanan plantar yang berulang pada titik yang sama menyebabkan ulkus kaki
> diabetik. Alat ini mengukur tekanan itu dan memberi peringatan sebelum luka
> terbentuk.

### Slide 2 — Cara kerja model

| Komponen | Nilai |
| --- | --- |
| Kelas | dua: Aman dan Waspada |
| Ambang label | `peak >= 45 kPa` (persentil ke-95 DFN-DS, ≈5,7 N pada FSR 402) |
| Penentu tingkat | kontrak di web dan firmware; suara pohon hanya menempatkan skor |
| Perangkat | dashboard web dan ESP32 |

Poin bicara: durasi tumpuan tetap dihitung dan dilaporkan, tetapi tidak menaikkan
tingkat. Run terpanjang di dalam data hanya 13 sampel (1,3 detik), jadi syarat
durasi tidak pernah menyala.

### Slide 3 — Kinerja

Angka yang ditampilkan: macro-F1 100,0% pada 5 lipatan berkelompok per pasien
(135 pasien), dan clinical contract 8/8.

Poin bicara: akurasi 100% terjadi karena label dibuat oleh aturan 45 kPa yang
sama; yang diukur adalah kesesuaian dengan aturan, bukan generalisasi. Tiga skema
(aturan murni, RF berbobot kelas, RF + SMOTE) memberi angka yang sama, dan itu
dilaporkan sebagai temuan, bukan disembunyikan.

### Slide 4 — Validasi pada data nyata

Tiga pemeriksaan: OptiTrack (310 rekaman, 902 fase tumpu, tumit mendahului
forefoot 99,9%), Figshare DFU (1.296 pengukuran, 9,8% >= 45 kPa, 1,4% >= 70 kPa,
0% >= 200 kPa, puncak 123,8 kPa), dan edge case (input kosong, `NaN`, 500 kPa
tidak pernah melempar galat).

### Slide 5 — Interpretabilitas: jawaban jujur

Model ini 20 pohon dan hanya 60 simpul; setiap pohon berhenti pada satu
pertanyaan. Kompensasinya: (a) kontrak tingkat diuji eksplisit dan nilainya
terbaca, (b) skor selalu berada di pita tingkatnya, (c) 40 kPa tidak pernah
dilaporkan Waspada, dan (d) model cukup kecil untuk berjalan di ESP32 (7,7 KB
header C++).

### Slide 6 — Keterbatasan dan langkah berikutnya

Keterbatasan: tidak ada kelas ketiga (0 sampel >= 200 kPa; FSR 402 berhenti di
≈79 kPa), populasi hanya diabetes, resolusi midfoot tiga titik, ambang rapuh
terhadap galat kalibrasi (macro-F1 78,4% pada gain ×0,9 dan 69,7% pada ×1,2), dan
firmware belum diuji pada perangkat fisik. Langkah berikutnya: uji pada perangkat
nyata, kalibrasi FSR, dan uji subjek diabetes baru sebagai studi kasus eksternal.

## 6.4 Skrip demo ujung-ke-ujung

Demo menunjukkan alur ESP32 -> Firebase -> dashboard dengan model yang sama.
Perangkat keras dan `pio` tidak tersedia di mesin pengembangan, jadi langkah 1
dan 2 dijalankan pada perangkat yang sudah diflash sebelumnya.

### Persiapan (10 menit sebelum sidang)

1. Isi baterai insole, nyalakan ESP32.
2. Buka dashboard di layar presentasi, ukuran 1280 px.
3. Siapkan satu akun admin dan satu akun pengguna.
4. Buka Firebase Console pada tab Realtime Database, siap menunjuk node
   `readings/latest`.
5. Siapkan satu sesi uji 30 detik (berdiri, lalu berjalan di tempat).

### Langkah demo

1. **Sensor dan alarm lokal.** Tekan tumit pada insole selama lebih dari
   0,1 detik dengan tekanan tinggi. Buzzer berbunyi dan LED berubah. Kalimat:
   "keputusan ini dibuat di perangkat, tanpa jaringan."
2. **Data masuk Firebase.** Tunjuk `readings/latest` di Console: `forefoot_kpa`,
   `midfoot_kpa`, `heel_kpa`, `sustained_duration_sec`, `risk_score`,
   `risk_status`. Kalimat:
   "kontrak data yang sama dibaca dashboard."
3. **Dashboard realtime.** Di halaman pemantauan, tunjukkan tiga region terisi,
   metrik puncak, dan badge risiko berubah mengikuti langkah 1. Contohkan
   kontraknya: 44 kPa selama 12 detik tetap Aman, 45 kPa langsung Waspada.
4. **Riwayat.** Buka halaman riwayat, tunjukkan sesi tadi tersimpan dengan
   tingkat risiko dan waktu yang benar.
5. **Ambang tidak dapat diubah.** Buka halaman pengaturan dan tunjukkan ambang
   tampil sebagai nilai tetap 45 kPa tanpa editor. Tekankan bahwa ambang itu
   bagian dari model dua kelas yang juga dipakai firmware, jadi mengubahnya di
   klien akan membuat tampilan dan alarm berbeda.
6. **Model yang sama di dua tempat.** Tunjukkan `firmware/include/rf-model-data.h`
   dan `web-dashboard/src/utils/rf-model.json` berasal dari berkas yang sama,
   lalu sebutkan uji native firmware 10/10.

### Jaring pengaman

- Jika Firebase lambat, ulangi langkah 2 dan 3 tanpa jeda; data tertinggal
  dikirim ulang oleh perangkat pada siklus berikutnya.
- Jika sensor tidak merespons, gunakan data riwayat sesi sebelumnya; jangan
  mengarang pembacaan langsung.
- Jika ditanya hasil pengujian perangkat keras: jawab apa adanya bahwa firmware
  terbangun dan lulus uji native, tetapi uji pada insole fisik belum dijalankan.
