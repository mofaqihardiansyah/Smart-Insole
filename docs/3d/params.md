# Parameter model 3D — insole & pouch

Satu sumber angka untuk gambar kerja (`docs/3d/cadcraft/`) dan model solid
(`docs/3d/*.scad`). Semua nilai dalam milimeter. Sumber utama:
`docs/hardware-build-guide.html` §04, §07, dan §08.

Berkas lain yang melengkapi: `legend.json` (nomor, nama, warna, bahan);
`annotations.json` (kamera, judul, titik penunjuk tiap render);
`contents.json` (tata letak isi pouch); `gen/` (berkas turunan — jangan diedit
tangan).

## Insole

| Parameter | Nilai | Sumber / catatan |
| --- | --- | --- |
| Panjang total `L` | 270 | Asumsi EU 42 (± 27 cm); panduan hanya menyebut "jiplak insole sepatu" |
| Lebar bola kaki | 95 | Profil tapak, titik terlebar |
| Lebar tumit | 62 | Profil tapak |
| Lebar pinggang (arch) | 70 | Profil tapak |
| Alas EVA | 5 | §07 struktur lapisan |
| Cover EVA | 2 | §07 struktur lapisan |
| Sensor FSR 402 | Ø 12,7 × 0,5 area aktif | §02 BOM |
| Pocket sensor | 14 × 14, dalam 2 | §07 langkah 3 |
| Channel kabel | lebar 3,5; dalam 1,5 (+ relief 1,5 di cover) | §07 langkah 3 menyebut 3 × 1–2; dilebarkan karena bundel Ø 3,2 |
| Posisi `F` forefoot | 20–25 % dari ujung depan → `x = 209,25` | §07 langkah 2, diambil 22,5 % |
| Posisi `M` midfoot | 50–55 % dari ujung depan → `x = 128,25` | diambil 52,5 % |
| Posisi `H` heel | 80–85 % dari ujung depan → `x = 47,25` | diambil 82,5 % |
| Zona tumit bebas elektronik | `x < 30` | §07 Gambar 4, aturan 1 §01 |
| Bundel kabel | 6 × AWG 30 ≈ Ø 3,2 | turunan: 6 inti Ø 1,0 terbungkus |
| Kain atas (opsional) | 0,5 | §07 lapisan paling atas |
| Total tebal | 7,5–8 | §07 Gambar 3 |

Sistem koordinat: `x` = 0 di tumit, naik ke ujung jari; `y` = 0 di garis
tengah, positif ke sisi **lateral** (luar), negatif ke **medial** (dalam).

## Nilai khusus render 3D

Angka yang hanya dipakai model 3D (tidak ada di gambar kerja 2D), semuanya di
`insole.scad`.

| Parameter | Nilai | Alasan |
| --- | --- | --- |
| `POCKET_D` | 2 | Kedalaman cerukan sensor; FSR 0,5 mm ditanam rata dengan alas |
| `SENSOR_T` | 0,5 | Tebal film FSR 402 |
| `FILM_Z` | `ALAS − POCKET_D + 0,05` | Film dinaikkan 0,05 mm; kalau menempel tepat, bidang bawah film dan dasar cerukan berebut kedalaman |
| `RELIEF` | 1,5 | Relief channel di sisi bawah cover; 1,5 + 1,5 = 3,0 mm total |
| `COVER_GAP` | 0,02 | Jarak cover di atas alas untuk alasan yang sama: dua bidang berimpit menimbulkan garis z-fighting |
| `CABLE_R` | 1,6 | Radius bundel 6 inti AWG 30 |
| `TAIL_W` | 5 | Lebar ekor FSR |
| `FABRIC_LIFT` | 12 | Jarak kain di atas cover pada tampak ledak |
| `SLIDE_DY` | 78 | Geser lapisan ke samping pada tampak ledak; hanya mengangkat selalu menyisakan tepi lapisan atas menutupi lapisan bawah |
| `GHOST_A` | 0,30 | Kepekatan cover tembus pandang; gambar 5 memakai 0,55 supaya lebih terbaca sebagai permukaan |
| `DETAIL_BOX` | `[95, −60, −4, 70, 120, 18]` | Kotak potong detail midfoot: x 95…165, y −60…60, z −4…14 |
| `ANKLE_H` | 190 | Tinggi silinder penanda pergelangan di `assembly.scad`; dipotong bingkai gambar, bukan bagian dari model |

## Legenda dan warna

Nomor badge, nama, warna, dan bahan ada di `legend.json` — satu sumber untuk
render, tabel legenda di guidebook (ditulis ulang `annotate.py`), dan palet
OpenSCAD (`gen/palette.scad`). Nomor = urutan di array + 1, jadi komponen tidak
boleh disisipkan di tengah tanpa membangun ulang semua gambar.

## Pouch pergelangan

| Parameter | Nilai | Sumber |
| --- | --- | --- |
| Rongga dalam | 65 × 80 × 20 | §08 |
| Panel pola | 70 × 85 (atau 70 × 170 dilipat) | §08 langkah 1 |
| Kampuh | 5 | §08 langkah 2 |
| Tebal neoprene | 3 (rentang 3–5) | §02 BOM |
| Dimensi luar | 70 × 85 × 26 | turunan: rongga + 2 × 3 tebal dinding |
| Lubang port USB | 12 × 8 | §08 langkah 4 |
| Titik velcro | 3 × Ø 20 | §08 "2–3 titik velcro" |
| Posisi pakai | 2–3 cm di atas bibir sepatu, sisi lateral | §08 posisi pemakaian |

## Isi pouch (untuk gambar potong)

| Komponen | Dimensi | Catatan |
| --- | --- | --- |
| ESP32-WROOM-32 DevKit | 51,5 × 25,5 × 11 | termasuk pin header |
| TP4056 berproteksi | 25 × 19 × 2 | modul + chip |
| LiPo 3,7 V 600 mAh | 40 × 30 × 5 | kemasan tipikal |
| Buzzer aktif | Ø 9,5 × 6 | tipe 3,3–5 V |
| PCB bolong pembagi | 20 × 20 × 1,6 | §05 langkah 3 |

## Asumsi yang harus disebut di laporan

1. **Ukuran insole** memakai EU 42 (L 270). Ganti `L` di `insole.scad` dan
   jalankan ulang `build.sh` untuk ukuran lain; semua posisi sensor dan
   channel diskalakan.
2. **Sensor diletakkan di garis tengah.** Panduan menaruh `M` di sisi lateral
   lengkungan, tetapi Gambar 4 memakai garis tengah. Model mengikuti gambar.
3. **Geometri ekor FSR 402** (lebar ±10, panjang ±45) hanya perkiraan; yang
   terukur dan menentukan adalah area aktif Ø 12,7.
4. **Pouch 3D adalah mockup bentuk**, bukan pengganti jahitan neoprene: bahan
   aslinya lentur, STL-nya hanya untuk cek volume dan tata letak.
5. **Channel 3,5 × 1,5 mm**, bukan 3 × 1–2 mm seperti §07. Bundel 6 inti
   AWG 30 berukuran Ø ± 3,2 mm, jadi alur 3 mm tidak cukup. Kedalaman total
   tetap 3,0 mm: 1,5 mm di alas ditambah relief 1,5 mm di sisi bawah cover.
   Kembalikan ke 3 mm bila kabel yang dipakai lebih tipis.
6. **Tata letak isi pouch satu lapisan** (Gambar 12): LiPo kiri-bawah, TP4056
   kanan-bawah, PCB kiri-atas, ESP32 berdiri di kanan, buzzer di pojok kiri
   atas. Semuanya masuk rongga 65 × 80 tanpa bertumpuk; ini usulan, bukan
   aturan, dan susunan sebenarnya ditentukan panjang kabel di dalam pouch.
7. **Nomor gambar di lampiran 3D**: Gambar 5 tampilan bahan, 6 terakit, 7
   ledak, 8 detail midfoot, 9 tampak atas, 10–11 pouch depan-belakang, 12 isi
   pouch, 13–14 posisi pakai.
