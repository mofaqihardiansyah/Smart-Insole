# Berkas cetak kotak smart insole

Berkas di folder ini siap dikirim ke jasa cetak 3D. Semua satuan
**milimeter** dan setiap STL sudah berorientasi siap cetak: bidang
terbawah ada di z = 0, tanpa perlu diputar lagi.

## Isi folder

| Berkas | Jumlah cetak | Keterangan |
| --- | --- | --- |
| `case-body-kanan.stl` | 1 | Badan kotak untuk kaki kanan |
| `case-body-kiri.stl` | 1 | Badan cermin untuk kaki kiri |
| `case-lid.stl` | **2** | Tutup; satu desain dipakai untuk kedua sisi |
| `case-test.stl` | 1 | Kupon uji coba, cetak lebih dulu |
| `case-denah.dxf` | — | Proyeksi 2D tampak atas, untuk pemeriksaan |
| `case-potong.dxf` | — | Proyeksi 2D potongan, untuk pemeriksaan |

Render untuk pemeriksaan ada di `../render/case-*.png`, termasuk
`case-congkel.png` yang memperlihatkan takik congkel dari dekat.

## Spesifikasi cetak

| Parameter | Nilai |
| --- | --- |
| Proses | FDM (filamen) |
| Material | **PETG**; PLA+ boleh sebagai alternatif |
| Tinggi lapisan | 0,2 mm |
| Perimeter (dinding) | 3 |
| Isi | 20–25 % gyroid |
| Lapis atas dan bawah | 4 |
| Penyangga | **Tidak perlu** bila orientasi dipertahankan |
| Toleransi yang diharapkan | ± 0,2 mm |

Alasannya memilih PETG: kotak ini dibuka-tutup dan disekrup, dan PETG
lebih ulet daripada PLA yang getas. Resin (SLA) tidak disarankan karena
tutup yang sering dibuka akan retak di sekitar lubang sekrup; kalau tetap
memilih resin, jalankan `./docs/3d/build-case.sh sla` supaya dinding dan
lubang sekrup memakai ukuran resin, lalu pakai insert heat-set M3.

## Urutan pengerjaan yang disarankan

1. **Cetak `case-test.stl` dulu** (±15 g, di bawah Rp 15 ribu). Kupon ini
   berisi satu bos sekrup, satu sudut curb baterai, dan satu dinding
   berisi slot USB-C.
2. Uji kupon: baterai harus masuk longgar di curb, sekrup M3 × 12 harus
   masuk tanpa retak, dan kabel charger USB-C harus lewat slot.
3. Kalau kupon lolos, baru cetak empat bagian utama (2 badan, 2 tutup).
4. Kalau ada yang tidak pas, ubah satu angka di `docs/3d/case.scad`,
   jalankan ulang `./docs/3d/build-case.sh`, lalu kirim STL baru. Ekspor
   ulang hanya 30 detik, sedangkan cetak ulang berbayar.

## Dimensi yang bisa diverifikasi

| Bagian | Ukuran |
| --- | --- |
| Rongga dalam | 68 × 68 × 18 mm |
| Dimensi luar badan | 73 × 73 × 20,5 mm |
| Dimensi tutup | 73 × 73 × 4,5 mm (pelat 3 mm + lidah 1,5 mm) |
| Tebal kotak terpasang | 23,5 mm |
| Tebal dinding | 2,5 mm |
| Bos sekrup | Ø 7 mm, lubang pilot Ø 2,5 mm, dalam 12 mm |
| Reses sekrup di tutup | Ø 6 mm, dalam 2 mm (untuk kepala bulat rendah) |
| Lidah tutup | 1,5 mm, jarak main 0,15 mm per sisi, keliling penuh |
| Takik congkel | Ø 6 mm di tepi atas dinding bawah, 1,5 mm dalam |
| Slot USB ESP32 | 12 × 6 mm di dinding atas, terpusat 8,1 mm dari lantai |
| Slot USB TP4056 | 10 × 6 mm di dinding samping, terpusat 7,1 mm dari lantai |
| Slot masuk kabel | 5 × 4 mm di dinding bawah, tengah |
| Dudukan board | 4 pad 2,5 mm (ESP32) dan 4 pad 1,5 mm (TP4056) |
| Ruang bebas di atas isi | ± 5 mm, cukup untuk bundel kabel Ø 3,2 mm |
| Alur band elastis | 44 × 4 × 0,8 mm di muka luar |
| Ventilasi | 3 × Ø 2,5 mm di dinding samping, y 22–30 mm (di atas jangkauan band) |

## Tata letak isi

Rongga 68 × 68 × 18 mm. Titik (0, 0) di tengah rongga, x mendatar, y tegak,
z dari lantai. Ada dua kolom yang dipisahkan koridor sekrup selebar 7 mm.

```
   +y ┌────────────────────────────────────────────┐
      │                                            │  ← dinding atas:
      │ ┌───────────────┐    ┌───────────────────┐ │    slot USB ESP32 12×6
      │ │ papan bolong  │    │                   │ │
      │ │ 36 × 26       │    │      ESP32        │ │
      │ │               │    │      50 × 27      │ │
      │ │ (ditumpuk di  │    │                   │ │
      │ │  atas baterai)│    │  (di atas 4 pad)  │ │
      │ ├───────────────┤    └───────────────────┘ │
      │ │  busa 2 mm    │             ○ bos       │
      │ ├───────────────┤             (0, +27)    │
      │ │               │                          │
      │ │   BATERAI     │    ┌───────────────────┐ │ → slot USB TP4056 10×6
      │ │   29 × 40     │    │      TP4056       │ │   di dinding samping
      │ │               │    │      20 × 13      │ │   + 4 ventilasi Ø2,5
      │ └───────────────┘    └───────────────────┘ │
      │       ○ bos (0, -27)          ▲            │
   -y └────── masuk kabel 5×4 ─────────────────────┘
      -x                                          +x
```

| Isi | Rentang x | Rentang y | Duduk di | Ditahan oleh |
| --- | --- | --- | --- | --- |
| Baterai 29 × 40 | −33,5 … −4,5 | −33,5 … 6,5 | Lantai | Curb 2 mm di kanan dan atas, takik jari 14 mm |
| Papan bolong 36 × 26 | −31,5 … −5,5 | −31 … 5 | Atas baterai, busa 2 mm | Beratnya sendiri + busa |
| ESP32 50 × 27 | 5,5 … 32,5 | −17 … 33 | Empat pad 2,5 mm | Dua bibir sisi 1 mm |
| TP4056 20 × 13 | 11,5 … 31,5 | −33,5 … −20,5 | Empat pad juga | Dua bibir penahan |
| Bundel kabel | koridor x −3,5 … 3,5 | sepanjang rongga | Masuk dari bawah | Lem tembak di mulut slot |

Tiga hal yang mudah salah:

1. **Sisi resistor papan bolong menghadap ke atas.** Sisa ruang di atas tumpukan
   hanya 1,4 mm sebelum kena lidah tutup, jadi tekuk kaki resistor rata.
2. **Dua slot USB ada di dua dinding berbeda** (atas dan samping) dan keduanya
   harus tetap terjangkau saat dipakai. Alur band ada di tengah muka luar,
   jadi tidak menutupi keduanya.
3. **Kotak kiri adalah cermin dari kanan.** Isinya memakai posisi relatif yang
   sama; tidak ada yang perlu ditukar.

## Perakitan

1. Buka tutup lewat **takik congkel** di dinding bawah: masukkan kuku atau
   uang logam ke lekukan 6 mm itu, lalu ungkit tepi tutup. Lidah tutup memakai
   pas-cerat 0,15 mm, jadi cukup ditahan gesekan dan tidak ada pin yang perlu
   dicongkel.
2. Letakkan papan bolong dan baterai di kolom kiri, dengan busa 2 mm di
   antara keduanya. Takik jari 14 mm ada di sisi atas relung baterai.
3. Letakkan ESP32 di kolom kanan atas di atas empat pad, dengan **pin header
   menghadap ke atas**. Posisi inilah yang membuat soket micro-USB-nya jatuh
   tepat di depan slot 12 × 6 mm. Pin menghadap ke bawah akan menaikkan board
   sekitar 1 mm dan soketnya jadi tidak sejajar.
4. Letakkan TP4056 di kolom kanan bawah, di atas empat pad 1,5 mm dan di
   belakang dua bibir penahan. Port USB-C-nya harus menghadap slot 10 × 6 mm
   di dinding samping.
5. Masukkan bundel kabel lewat slot 5 × 4 mm di dinding bawah, alirkan di
   atas tumpukan papan (ada ruang bebas ± 5 mm), lalu beri setitik lem
   tembak di mulut slot sebagai penahan tarikan. Tidak ada alur kabel
   khusus di dalam kotak: ruang di atas isi sudah cukup dan relung busa
   1 mm di tutup mencegah kabel terjepit.
6. Tutup dengan lidah tutup masuk ke rongga, tekan sampai rata.
7. Pasang band elastis 30–40 mm dengan velcro; band masuk ke alur 44 mm
   di muka luar supaya tidak meluncur.
8. Ikat tali pengaman dari kotak ke tali sepatu.

**Sekrup tidak wajib.** Band elastis menekan kotak ke arah kaki, dan
tekanan itu yang menahan tutup. Lubang sekrup tetap disediakan sebagai
cadangan: kalau tutup terasa longgar, tambahkan 2 sekrup **M3 × 12 mm kepala
bulat rendah** (tinggi kepala maksimal 2 mm) per kotak, langsung menggigit
plastik tanpa mur. Jangan pakai kepala soket 3 mm karena akan menonjol dari
reses 2 mm. Kalau memilih resin, pakai insert heat-set M3 × 5,7 mm.

## Pertanyaan untuk jasa cetak

1. Bisa mencetak PETG? Kalau tidak, PLA+ boleh.
2. Toleransi yang dijamin berapa?
3. Harga per gram atau per bagian, dan berapa lama?
4. Bisa menerima STL satuan milimeter (bukan inci)?
5. Boleh minta hasil slice (perkiraan berat dan waktu) sebelum dicetak?

## Berat perkiraan

| Bagian | Volume pejal | Perkiraan tercetak PETG | Jumlah potong |
| --- | --- | --- | --- |
| Badan (satu sisi) | 27,3 cm³ | 31 g | 2 |
| Tutup (satu buah) | 12,7 cm³ | 15 g | 2 |
| Kupon uji | 13,2 cm³ | 15 g | 1 |
| **Dua kotak lengkap** | — | **± 92 g** (2 badan + 2 tutup) | 4 |
| Dua kotak + kupon | — | ± 107 g | 5 |

Angka ini perkiraan dari volume model; hasil slicer bisa berbeda sekitar
15 % karena bergantung pada jumlah perimeter dan pola isi.
