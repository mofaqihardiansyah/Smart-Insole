# AFD - App Flow Documentation

> Smart Insole IoT · Peta navigasi dan alur pengguna.
> Rujukan: [`PRD.md`](PRD.md), [`DBD.md`](DBD.md),
> [`../DESIGN.md`](../DESIGN.md).

## 1. Peta rute

| Rute | Halaman | Akses |
| --- | --- | --- |
| `/` | Landing (publik) | Tamu |
| `/login` | Masuk | Tamu |
| `/register` | Daftar | Tamu |
| `/verify-email` | Verifikasi email | Semua |
| `/forgot-password` | Reset kata sandi | Tamu |
| `/dashboard` | Dashboard | Terautentikasi |
| `/monitoring` | Monitoring | Terautentikasi |
| `/history` | Riwayat | Terautentikasi |
| `/device` | Perangkat | Terautentikasi |
| `/settings` | Pengaturan | Terautentikasi |
| `/profile` | Profil | Terautentikasi |
| `/admin/*` | Konsol admin (5 tab) | Admin |

Navigasi utama ada di **nav pill** (Dashboard, Monitoring, Riwayat, Perangkat,
Pengaturan, Profil). Notifikasi tidak di pill; ia hidup di lonceng header.
Di mobile, tujuan dipindah ke drawer.

## 2. Alur autentikasi

1. **Daftar:** Firebase membuat akun dan mengirim tautan verifikasi.
2. **Verifikasi:** `/verify-email` meminta membuka tautan; setelah diklik,
   Firebase menandai email terverifikasi.
3. **Masuk:** akun belum terverifikasi diarahkan ke `/verify-email`, bukan
   langsung ke dasbor.
4. **Lupa kata sandi:** masukkan email, Firebase mengirim tautan reset, tautan
   membuka formulir kata sandi baru.
5. Akun nonaktif ditolak: layar khusus ditampilkan, rules menolak baca saat
   `users/<uid>/active` bernilai false.

## 3. Alur dashboard

1. Shell memuat header (brand, nav pill, cari, lonceng, akun) dan kolom konten
   1400px.
2. Hero menampilkan sapaan, tanggal, verdict risiko (chip besar), ekspor CSV,
   dan tandai dibaca.
3. Meter band menampilkan empat pembacaan (puncak, skor, durasi, baterai).
4. Station 01/02: tren puncak dan beban per zona.
5. Station 03: feed bacaan langsung (section terbuka).
6. Station 04: peta tekanan telapak kaki dengan legenda kPa.
7. Nilai berubah tiap detik; hanya **perubahan level risiko** yang diumumkan
   ke pembaca layar.

## 4. Alur monitoring

- Grafik tren tiga region (forefoot, midfoot, heel) dari buffer langsung.
- Sumbu waktu dan nilai kPa memakai tabular numerals.
- Bila buffer kosong, grafik menggambar garis kosong, bukan bentuk karangan.

## 5. Alur riwayat

- Register insiden dibangun dari transisi level (verdict perangkat lebih dulu).
- Filter tingkat risiko (Semua / Bahaya / Waspada), kolom waktu dapat diurutkan.
- Header lengket dengan kolom waktu dibekukan saat register menggulir.
- Di bawah `md`, tabel berubah menjadi baris definisi bertumpuk.
- Ekspor CSV mencakup seluruh register.

## 6. Alur perangkat

- Status baterai, versi firmware, dan kondisi koneksi.
- Menampilkan pesan jujur saat perangkat tidak menjawab, bukan angka karangan.

## 7. Alur pengaturan

- Pengguna biasa melihat dua ambang sebagai nilai biasa (tanpa editor).
- Admin dapat mengubah ambang peringatan; skor contoh ikut berubah sebelum
  disimpan.
- Ambang durasi bahaya tidak dapat diubah klien (diputuskan perangkat).

## 8. Alur profil

- Identitas akun dan statistik sesi.
- Jumlah pembacaan dan peringatan memakai ukuran metrik yang sama seperti di
  riwayat (satu metrik, satu ukuran).

## 9. Alur admin (`/admin/*`)

- Dijaga `RequireAdmin`: menampilkan panel memuat selama peran belum pasti,
  tidak pernah berkedip menolak.
- Empat tab: Ringkasan, Pengguna, Perangkat, Insiden.
- Aksi destruktif: konfirmasi dulu, tulis entri audit setelah sukses, dan
  menonaktifkan diri terhadap akun pelaku (tanpa self-demote, self-deactivate,
  self-delete, atau menurunkan admin aktif terakhir).

## 10. Early warning

- Saat level naik ke Waspada/Bahaya, web memicu notifikasi dan alarm audio.
- Izin notifikasi hanya bisa diminta di konteks aman (`https://` atau
  `localhost`).

## 11. State kosong, memuat, dan galat

- Setiap tampilan data punya state kosong, memuat, dan galat dengan salinan yang
  menyebut sebab dan langkah berikutnya, bukan "Tidak ada data".
- Timeline dan sparkline menurun dengan cara yang sama: buffer kosong menggambar
  garis telanjang, tidak pernah bentuk yang dikarang.
