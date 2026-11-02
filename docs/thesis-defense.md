# Draf Materi Sidang (Fase 6.3 dan 6.4)

> Dua bagian: kerangka slide perbandingan fuzzy vs Random Forest, dan skrip
> demo ujung-ke-ujung. Angka bersumber dari `docs/rf-model-report.md` dan
> `docs/validation-report.md`.

## 6.3 Slide: fuzzy vs Random Forest

Enam slide, masing-masing satu pesan. Angka di slide harus sama dengan laporan;
jangan menambah klaim akurasi baru di luar itu.

### Slide 1 — Judul dan satu kalimat masalah

> Tekanan plantar yang berulang pada titik yang sama menyebabkan ulkus kaki
> diabetik. Alat ini mengukur tekanan itu dan memberi peringatan sebelum luka
> terbentuk.

### Slide 2 — Apa yang berubah

| | Fuzzy (versi awal) | Random Forest (versi akhir) |
| --- | --- | --- |
| Batas `safe`/`warning` | 9 aturan ahli, fungsi keanggotaan manual | dipelajari dari 81.000 sampel DFN-DS |
| Kelas `danger` | aturan ahli | aturan ahli (tidak berubah) |
| Perangkat | dashboard web | dashboard web dan ESP32 |
| Dasar keputusan | dapat dibaca aturan per aturan | suara 20 pohon |

Poin bicara: yang berubah hanya batas safe/warning. Aturan bahaya sengaja tetap
manual karena datanya hanya 31 sampel dari 3 pasien.

### Slide 3 — Kinerja

Angka yang ditampilkan: accuracy 100,0% dan macro-F1 100,0% pada 28 pasien yang
tidak dipakai melatih, clinical contract 4/4, agreement dengan aturan ahli
90,72% pada 81.000 sampel.

Poin bicara: akurasi 100% hanya berlaku untuk dua kelas, pada populasi diabetes,
dengan batas yang ditentukan durasi tumpu. Sebutkan ini lebih dulu sebelum
penguji bertanya.

### Slide 4 — Validasi pada data nyata

Tiga pemeriksaan: OptiTrack (310 rekaman, 902 fase tumpu, tumit mendahului
forefoot 99,9%), Figshare DFU (1.296 pengukuran, 19,3% >= 35 kPa, 1,4% >=
70 kPa, puncak 123,8 kPa), dan edge case (input kosong, `NaN`, 500 kPa tidak
pernah melempar galat).

### Slide 5 — Interpretabilitas: jawaban jujur

Fuzzy lebih mudah diaudit: setiap aturan punya derajat pengaktifan, sehingga
klinisi bisa melihat aturan mana yang memicu keputusan. Random Forest hanya
memberi suara 20 pohon; model 3,4 KB ini tidak dapat dijelaskan per pasien.

Kompensasinya: (a) kontrak klinis diuji eksplisit, (b) agreement 90,72% dengan
aturan ahli menunjukkan model tidak menyimpang, (c) tidak ada satu pun kasus
`safe` yang menurut aturan adalah `danger`, (d) model cukup kecil untuk berjalan
di ESP32 (7,9 KB header C++), sesuatu yang tidak dilakukan versi fuzzy.

### Slide 6 — Keterbatasan dan langkah berikutnya

Keterbatasan: 31 sampel bahaya (0,05%), populasi hanya diabetes, resolusi
midfoot tiga titik, gap pada beban sedang yang berlangsung lebih dari 20 detik,
dan firmware belum diuji pada perangkat fisik. Langkah berikutnya: uji pada
perangkat nyata, kalibrasi ambang per pasien, dan penambahan sampel bahaya dari
data klinis.

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
   `midfoot_kpa`, `heel_kpa`, `sustained_duration_sec`, `risk_status`. Kalimat:
   "kontrak data yang sama dibaca dashboard."
3. **Dashboard realtime.** Di halaman pemantauan, tunjukkan tiga region terisi,
   metrik puncak, dan badge risiko berubah mengikuti langkah 1. Contohkan
   regresi: tekan 40 kPa singkat -> `warning`, bukan `safe`.
4. **Riwayat.** Buka halaman riwayat, tunjukkan sesi tadi tersimpan dengan
   tingkat risiko dan waktu yang benar.
5. **Ambang admin.** Sebagai admin, ubah ambang peringatan di halaman
   pengaturan dan tunjukkan skor contoh ikut berubah sebelum disimpan. Tekankan
   bahwa ambang durasi bahaya tidak dapat diubah klien, karena model di
   perangkat yang memutuskan.
6. **Model yang sama di dua tempat.** Tunjukkan `firmware/include/rf-model-data.h`
   dan `web-dashboard/src/utils/rf-model.json` berasal dari berkas yang sama,
   lalu sebutkan uji native firmware 13/13.

### Jaring pengaman

- Jika Firebase lambat, ulangi langkah 2 dan 3 tanpa jeda; data tertinggal
  dikirim ulang oleh perangkat pada siklus berikutnya.
- Jika sensor tidak merespons, gunakan data riwayat sesi sebelumnya; jangan
  mengarang pembacaan langsung.
- Jika ditanya hasil pengujian perangkat keras: jawab apa adanya bahwa firmware
  terbangun dan lulus uji native, tetapi uji pada insole fisik belum dijalankan.
