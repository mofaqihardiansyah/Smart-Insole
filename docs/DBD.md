# DBD - Design Brief Documentation

> Smart Insole IoT · Ringkasan brief desain.
> **Otoritas desain tetap [`../DESIGN.md`](../DESIGN.md).** Dokumen ini merangkum
> dan menautkan, bukan menggantikan. Brief historis: [`DESIGN-BRIEF.md`](DESIGN-BRIEF.md).

## 1. Arah

Instrumen klinis yang tenang, terang, dan dapat dipercaya. Dibaca di cahaya
siang oleh pasien diabetes lanjut usia dan pendampingnya.
**ENERGY 2 / RHYTHM 2 / MOTION 1.**

## 2. Motif identitas: warna adalah tanda vital

Kerangka hampir monokrom (ink, putih, abu hangat). Saturasi **hanya** untuk
tekanan dan risiko. Ketika sesuatu di layar berwarna, itu karena sebuah kaki
butuh perhatian.

## 3. Register permukaan

| Permukaan | Register |
| --- | --- |
| Aplikasi (masuk) dan form autentikasi | Konsol klinis terang: kanvas `#EFEFEC`, kartu putih, nav pill gelap di kolom 1400px |
| Landing (publik) | Palet yang sama pada skala pemasaran: radius lebih besar, bayangan lebih dalam |
| Konsol admin | Token sama pada kepadatan operasional: satu instrumen band, section terbuka berpemisah garis, mono figures |

## 4. Token ringkas

### Warna inti

| Token | Hex | Peran |
| --- | --- | --- |
| `bg` | `#EFEFEC` | kanvas halaman |
| `surface` | `#FFFFFF` | kartu, hero, baris nav |
| `surface-2` | `#F7F7F5` | kepala tabel, kolom cari, baris hover |
| `surface-3` | `#EBEBE7` | well inset, track meter |
| `fg` | `#0A0A0F` | ink utama |
| `fg-2` | `#282832` | teks sekunder |
| `muted` | `#46464F` | keterangan, satuan |
| `secondary` | `#04644C` | sage: interaktif, state positif |
| `tertiary` | `#0987B8` | info biru (tint dan teks besar saja) |
| `safe` | `#15803D` | risiko Aman |
| `warning` | `#A16207` | risiko Waspada |
| `danger` | `#B41E1E` | risiko Bahaya |

Ink pasangan (untuk teks di atas tint 15%): `safe-ink` `#12552D`,
`warning-ink` `#823700`, `danger-ink` `#821414`, `secondary-ink` `#054B37`.

Tint stat-card Cadra: `tint-cream` `#F3DFA6` (durasi), `tint-mint` `#CBE8D4`
(skor), `tint-blue` `#CADCF1` (baterai/total). Satu kartu terbalik `#141414`
untuk metrik utama (puncak).

### Visualisasi data

Okabe-Ito (aman untuk buta warna): Forefoot `#0072B2`, Midfoot `#D55E00`,
Heel `#009E73`. Hanya di dalam chart; jalur tren memakai sage non-identitas.
Didefinisikan sekali di `web-dashboard/src/utils/series.js`.

### Tipografi

| Pemakaian | Keluarga |
| --- | --- |
| Judul, angka besar | Plus Jakarta Sans |
| Isi, label, data | DM Sans |
| Vital, kode | Fira Code |

Setiap angka kPa memakai tabular numerals.

### Radius

Chip 4px, kontrol 8px, ikon/tile 12px, kartu 16px, pill penuh (nav pill, brand
card, roundel akun). Pill hanya untuk tiga elemen itu.

### Elevasi

`panel` (kartu, nav pill), `md` (kartu terangkat), `overlay` (dialog), `fab`
(kontrol melayang). Satu token terangkat per permukaan.

## 5. Komposisi dashboard

1. Kartu hero: sapaan `h1`, tanggal, verdict risiko, ekspor CSV, tandai dibaca,
   timeline buffer.
2. Meter band: empat kartu Cadra, satu kartu terbalik untuk puncak.
3. Station 01/02: tren (dua per tiga) + funnel beban zona (satu per tiga).
4. Station 03: feed bacaan langsung, full width dan terbuka.
5. Station 04: peta tekanan, full width, dengan legenda kPa.

Nomor stasiun (01-04) adalah penunjuk jalan, bukan salinan.

## 6. Motion

`MOTION 1`: hover, focus, transisi nilai, pulse node bahaya pada heatmap, satu
scroll ke peta (hormati `prefers-reduced-motion`). Dilarang: scroll reveal,
parallax, animasi masuk, `animate-*`.

## 7. Aksesibilitas

- Setiap pasangan teks/latar diukur, bukan dikira-kira.
- Target sentuh minimal 44px (turun ke 34-40px dari `lg`).
- Risiko tidak pernah lewat warna saja: ikon + label teks + warna.
- Setiap tampilan data punya state kosong, memuat, dan galat.
- `aria-live="off"` untuk angka langsung; hanya perubahan level yang diumumkan.

## 8. Anti-slop

- Tanpa em dash pada salinan terkirim. Pemisah: middot atau pipe.
- Tanpa telemetri karangan; hanya satu sumber data nyata.
- Tanpa statistik, testimoni, atau klaim kepatuhan yang dikarang.
- Tanpa kontrol mati. Tombol terisi adalah tugas, bukan perabot.

## 9. Artefak desain

- `design/smart-insole-dashboard.figcraft`: dashboard 1440 + 375.
- Token disimpan sebagai variabel warna bernama (koleksi "Token").
- Catatan font: DM Sans dan Plus Jakarta Sans tidak terpasang pada mesin
  penulis, jadi artefak memakai Inter + Fira Code sebagai pengganti; aplikasi
  terkirim tetap mendeklarasikan keluarga asli di `src/index.css`.

## 10. Rujukan

- [`../DESIGN.md`](../DESIGN.md) (otoritas)
- [`DESIGN-BRIEF.md`](DESIGN-BRIEF.md) (historis)
- [`../DECISIONS.md`](../DECISIONS.md) ADR-006 dan ADR-011
