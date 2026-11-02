# Laporan Validasi Fase 3

> Terakhir diperbarui: 2 November 2026.

Validasi model risiko (Random Forest + aturan klinis) terhadap data nyata dan
terhadap aturan ahli. Semua angka di bawah dapat direproduksi dengan perintah
pada bagian **Reproduksi**.

Ringkasan:

| Butir | Hasil | Status |
| --- | --- | --- |
| 3.1 Pola 3 region saat gait (OptiTrack v2) | 902 fase tumpu, tumit memuncak sebelum forefoot pada 99,9% | Lolos |
| 3.2 Ambang klinis vs peak pressure DFU (Figshare) | 1.296 pengukuran, 19,3% >= 35 kPa, 1,4% >= 70 kPa | Lolos |
| 3.3 Edge case (kosong, NaN, 500 kPa) | Semua input degenerat -> `safe`, tidak pernah melempar galat | Lolos |
| 3.4 Agreement RF vs aturan ahli | 90,72% pada 81.000 sampel DFN-DS; 0 kasus RF `safe` saat aturan `danger` | Lolos |

## 3.1 Validasi silang OptiTrack v2

**Data.** `datasets/optitrack/InsolesOpitrackDataset_v2.zip` — 15 partisipan,
155 take, 310 rekaman tekanan (kiri dan kanan terpisah), 32 sensor per insole.

**Pemetaan region.** Arsip tidak menyertakan peta sensor dalam bentuk mesin;
pemetaan dibaca dari `insoles-number.jpeg` di dalam arsip (nomor 1-32 per
insole, ujung kaki di atas). Celah baris pada gambar memisahkan tiga blok:

| Region | Jumlah sensor | Nomor sensor |
| --- | --- | --- |
| Forefoot | 19 | 1, 17, 4, 20, 18, 2, 3, 19, 8, 5, 24, 10, 21, 6, 7, 22, 9, 11, 23 |
| Midfoot | 3 | 12, 15, 16 |
| Heel | 10 | 13, 29, 14, 27, 30, 32, 26, 28, 31, 25 |

**Metode.** Tiap rekaman dijumlahkan per region. Fase tumpu dipotong pada awal
kenaikan beban tumit (20% dari maksimum tumit), lalu dicari frame puncak tiap
region di dalam fase itu.

**Hasil.**

| Ukuran | Nilai |
| --- | --- |
| Rekaman diproses | 310 |
| Fase tumpu terdeteksi | 902 |
| Puncak tumit mendahului forefoot | 99,9% |
| Urutan lengkap tumit -> midfoot -> forefoot | 69,7% |
| Porsi beban (rata-rata per sensor) F / M / H | 42,1% / 20,7% / 37,3% |

**Tafsir.** Struktur temporal yang dipakai model — tumit lebih dulu, forefoot
terakhir — muncul pada hampir semua fase tumpu, jadi agregasi tiga region pada
insole memang menangkap pola gait, bukan artefak. Urutan lengkap turun ke 69,7%
karena midfoot hanya diwakili 3 sensor dan membawa 20,7% beban; puncaknya
bergerak liar di antara dua region lain. Ini keterbatasan resolusi midfoot pada
perangkat, bukan kesalahan model.

## 3.2 Ambang klinis vs data DFU (Figshare)

**Data.** `datasets/figshare-dfu/Data Sheets.xlsx` — 22 partisipan dengan
ulkus kaki diabetik, 12 region, 5 kondisi *offloading* (control, post-op shoe,
post-op shoe + wool felt, RCW, RCW + Even-Up). Kolom yang dipakai hanya *peak
plantar pressure*; buku kerja tidak memuat durasi.

**Hasil.**

| Ukuran | Nilai |
| --- | --- |
| Pengukuran peak pressure | 1.296 |
| Median | 18,1 kPa |
| Puncak tertinggi | 123,8 kPa |
| >= ambang warning (35 kPa) | 19,3% |
| >= ambang danger (70 kPa) | 1,4% |

**Tafsir.** Kedua ambang model berada di dalam rentang yang benar-benar dicapai
kaki diabetik: 70 kPa bukan angka teoretis, melainkan tekanan yang terukur pada
1,4% pengukuran DFU dan terlampaui sampai 123,8 kPa. Ambang 35 kPa memisahkan
sepertiga terbawah distribusi. Catatan penting: validasi ini hanya untuk
tekanan, bukan durasi — dataset tidak menyediakan durasi tumpu.

## 3.3 Edge case

Diuji di `web-dashboard/src/utils/riskAgreement.test.js`, untuk kedua mesin
(RF dan fuzzy):

| Input | Hasil |
| --- | --- |
| Tanpa argumen / `peakPressure` kosong | `safe` |
| `NaN` atau `Infinity` pada tekanan atau durasi | `safe` |
| Tekanan negatif, durasi negatif | `safe` |
| 500 kPa sesaat | `warning` (kedua mesin) |
| 500 kPa selama 1 s | RF `danger`, fuzzy `warning` (selisih kontrak durasi, lihat 3.4) |
| Ambang admin diubah (warning 25, danger 50) | Level dan skor tetap konsisten |

Tidak ada input yang melempar galat atau menghasilkan skor di luar 0-100.
Paket sensor yang hilang dibaca sebagai nol, bukan sebagai peringatan palsu.

## 3.4 Agreement RF vs aturan ahli

**Data.** Seluruh 81.000 sampel DFN-DS (135 pasien x 600) — distribusi yang
sama dengan data latih, karena tujuannya memeriksa apakah model data-driven
mengikuti aturan klinis pada kasus yang benar-benar ada, bukan pada ruang input
yang tidak pernah terjadi.

| Pembanding | Agreement |
| --- | --- |
| 81.000 sampel DFN-DS | **90,72%** (73.485 sampel) |
| Grid seragam 0-120 kPa x 0-60 s (14.641 titik) | 74,06% (10.843 titik) |

**Kasus berbahaya.** Tidak ada satu pun sampel di mana RF menyebut `safe`
sementara aturan ahli menyebut `danger`. Arah kesalahan yang tersisa aman:
7.484 sampel RF `safe` vs fuzzy `warning` (tekanan rendah yang ditahan lama),
dan 31 sampel RF `danger` vs fuzzy `warning` (sampel DFN pada durasi pendek).

**Selisih yang memang dirancang.** Pada grid seragam, seluruh 3.798
ketidaksepakatan jatuh tepat di tiga pita, dan tidak ada satu pun di luar itu
(diuji sebagai assertion):

1. **Tekanan < 35 kPa.** Himpunan "medium" fuzzy bertumpang tindih ke bawah
   ambang, jadi kaki bertekanan rendah yang ditahan bisa langsung `warning`,
   sementara RF mempertahankan lantai `safe` 20 detik.
2. **Tekanan >= 70 kPa.** RF memanggil `danger` sejak 0,1 detik tumpu; fuzzy
   baru `danger` setelah beban berlangsung lama (±30 detik). Ini konsekuensi
   kontrak klinis hybrid: bahaya dipicu oleh aturan, bukan oleh hutan.
3. **35-69 kPa ditahan >= 20 detik.** Fuzzy menaikkan ke `danger`, RF tetap
   `warning`. Ini **temuan nyata**: RF tidak memanggil bahaya untuk beban
   sedang yang berlangsung lama. Tidak berdampak pada DFN-DS karena durasi
   tumpu di dataset tidak pernah melewati 3 detik, tetapi harus dicatat sebagai
   keterbatasan: pada pemakaian sangat lama (misalnya pasien bedridden), RF
   akan lebih permisif daripada aturan ahli.

## Keterbatasan

- Batas 3 region OptiTrack berasal dari gambar tata letak vendor, bukan metadata
  mesin; kesalahan pemetaan satu sensor akan menggeser porsi beban, tidak
  mengubah kesimpulan urutan.
- Figshare DFU tidak memuat durasi, jadi 3.2 memvalidasi tekanan saja.
- Agreement 90,72% diukur pada distribusi DFN-DS, yang tidak memuat tumpu
  panjang; pita divergensi ketiga hanya teruji di grid.

## Reproduksi

```bash
python3 scripts/validate-datasets.py        # 3.1 dan 3.2

cd web-dashboard
npx vitest run src/utils/riskAgreement.test.js   # 3.3 dan 3.4
```
