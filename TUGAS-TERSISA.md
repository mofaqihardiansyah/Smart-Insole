# TUGAS-TERSISA.md — daftar kerja halaman Riwayat

Work list untuk agent berikutnya. Bahasa Indonesia, tapi kode dan tes tetap
sesuai konvensi repo. Baca `AGENTS.md` → `READY.md` → `TASK.md` dulu sebelum
menyentuh file.

Status: **H-02 sampai H-04 selesai** (2026-11-05). Sisa backlog L-01 sampai
L-05.

Semua nomor baris ditulis pada 5 Nov 2026 dan bisa bergeser setelah edit;
cari nama simbol, bukan nomor.

---

## Sudah selesai (jangan dikerjakan ulang)

- **H-00 — Register bertahan setelah refresh.** `src/utils/incidents.ts`
  (`incidentsFromHistory`, `mergeIncidents`), `InsoleContext.storedIncidents`,
  langganan `subscribeToHistory` (limit `STORED_HISTORY_LIMIT = 200`),
  `HistoryPage` menggabungkan tersimpan + live.
- **H-01 — Batas render + "Muat lebih banyak".** `PAGE_SIZE = 20`,
  `PAGE_STEP = 20`, `visibleRows`, `hasMore`, tombol `history.loadMore`, baris
  `history.showing` ("Menampilkan X dari Y insiden"), catatan
  `history.storedLimited` saat `storedIncidents.length >= STORED_HISTORY_LIMIT`.
  Ringkasan dan ekspor CSV tetap melihat seluruh register.

- **H-02 — Filter level risiko.** Chip `as="button"` dengan `aria-pressed`
  dalam `role="group"`; `filteredRows` memakai `history.showing`; summary tetap
  seluruh register; filter kosong memakai `StatePanel` empty.
- **H-03 — Urutkan kolom Waktu.** `sortDir` default `asc`, tombol di `<th>`
  dengan `aria-sort` dan panah `lucide-react`, satu sumber `rows` untuk desktop
  dan mobile.
- **H-04 — Header lengket + kolom Waktu beku.** `GlassTable maxHeight` memakai
  pembungkus yang sama; `th` `sticky top-0` (z-20, kolom pertama z-30) dan `td`
  pertama `sticky left-0 z-10` dengan `bg-surface`.

Verifikasi terakhir: `npx vitest run` 46 file / 414 tes, `npx tsc --noEmit`
bersih, `npm run build` lolos, `dist/` dikembalikan ke versi commit.

---

## H-02 — Filter level risiko

**Tujuan.** Pengguna memilih melihat Semua / Bahaya / Waspada, bukan menggulir
semua baris.

**Titik kode.**
- `web-dashboard/src/pages/HistoryPage.tsx`
  - `rows` (`useMemo`, sekitar :120), `dangerCount`/`warningCount` (:146-147),
    `visibleRows` (:152), footer (:457-475), `<thead>` (:393), daftar mobile
    (:433).
- `web-dashboard/src/components/ui/Chip.tsx` — dipakai sebagai tombol filter
  (`as="button"`); `TONES.danger` / `TONES.warning` sudah ada.
- `web-dashboard/src/utils/i18n.ts` — tambah key baru, **ID dan EN**.

**Langkah.**
1. State `levelFilter: 'all' | 'danger' | 'warning'` (default `'all'`).
2. `filteredRows = levelFilter === 'all' ? rows : rows.filter(r => r.level === levelFilter)`.
3. Hitung `dangerCount`/`warningCount` dari `rows` (tetap), tapi `visibleRows`
   dan teks `history.showing` memakai `filteredRows`.
4. Reset `visibleCount` ke `PAGE_SIZE` saat filter berubah, supaya tidak
   menyisakan halaman kosong.
5. Tiga `Chip` `as="button"` dengan `aria-pressed`, dibungkus
   `<div role="group" aria-label={t('history.filterLabel')}>`. Tombol harus
   punya nama aksesibel dari teksnya.
6. Label: `history.filter.all` = "Semua"; bahaya/waspada pakai key risiko yang
   sudah ada (`risk.danger`, `risk.warning`).

**Kriteria terima.**
- Pilih "Bahaya" → hanya baris danger; "Menampilkan X dari Y" menghitung
  himpunan terfilter.
- Kartu ringkasan tetap menghitung seluruh register (jangan diam-diam berubah
  arti).
- Filter kosong menampilkan `StatePanel` varian empty (pakai keadaan yang ada),
  bukan tabel kosong.
- `aria-pressed` benar; tiga tombol, bukan checkbox tersembunyi.

**Tes.** `web-dashboard/src/pages/HistoryPage.test.tsx` — tambah blok:
filter menyaring baris, teks X-dari-Y ikut, ringkasan tidak berubah, reset saat
ganti filter.

**Estimasi.** 30-45 menit.

---

## H-03 — Urutkan kolom Waktu

**Tujuan.** Balik urutan register tanpa membaca ulang.

**Titik kode.** `HistoryPage.tsx` `<thead>` (:393-406), `const columns` (:259),
`rows` (:120).

**Langkah.**
1. State `sortDir: 'asc' | 'desc'` (default `'asc'`, sama seperti perilaku
   sekarang: terlama dulu).
2. `rows` diurut ulang setelah merge, sebelum `filteredRows`.
3. Header "Waktu" jadi `<button>` di dalam `<th scope="col" aria-sort=...>`.
   `aria-sort="ascending" | "descending"` di `<th>`, bukan di tombol.
4. Ikon panah dari `lucide-react` (sudah terpasang; **jangan tambah pustaka
   ikon**), `aria-hidden`.
5. Key i18n baru: `history.sortAsc` ("Terlama dulu"), `history.sortDesc`
   ("Terbaru dulu"), `history.sortLabel` ("Urutkan menurut waktu"). Nama
   tombol memakai `sortAsc`/`sortDesc` sesuai arah aktif.

**Kriteria terima.**
- Klik header membalik urutan; klik lagi kembali.
- `<th>` membawa `aria-sort` yang cocok dengan urutan tampil.
- Daftar mobile ikut urutan baru (satu sumber `rows`).
- Urutan tidak mengubah isi ekspor CSV selain urutannya.

**Tes.** Tambah di `HistoryPage.test.tsx`: klik header → urutan baris berubah
(periksa timestamp/Waktu baris pertama), `aria-sort` berubah, dan state awal
tetap `ascending`.

**Estimasi.** 45-60 menit.

---

## H-04 — Header lengket + kolom Waktu beku

**Tujuan.** Saat register digulir, header kolom tetap terlihat; kolom Waktu
tidak hilang saat tabel digeser mendatar.

**Kendala nyata.** `GlassTable` merender pembungkusnya sendiri dengan
`overflow-x-auto` dan `min-w-[40rem]` (`components/ui/GlassTable.tsx:49-54`),
tanpa batas tinggi. Karena `overflow-x: auto` membuat sumbu Y juga jadi
scrollport setinggi konten, `sticky top-0` pada `<th>` tidak akan menempel.
Perlu batas tinggi pada pembungkus **yang sama**.

**Langkah.**
1. `GlassTable`: tambah prop opsional `maxHeight?: string` (nilai utility
   Tailwind, mis. `"max-h-[70vh]"`). Terapkan ke pembungkus yang sudah ada:
   `w-full overflow-x-auto <maxHeight>`, **bukan div baru**.
2. `GlassTable.test.tsx` punya asersi "hanya satu pembungkus overflow-x-auto";
   jangan menambah div sehingga jumlah itu tetap 1. Tambah satu tes: dengan
   `maxHeight`, pembungkus membawa `overflow-y-auto`/kelas tinggi dan jumlah
   scroll container tetap 1.
3. `HistoryPage.tsx`:
   - Kirim `maxHeight="max-h-[70vh]"` ke `GlassTable` desktop.
   - `<th>`: `sticky top-0 z-20` (sudah `bg-surface-2`, jadi latarnya menutup).
   - `<th>` pertama: tambah `sticky left-0 z-30`, plus garis kanan
     (`border-r border-border`).
   - `<td>` pertama tiap baris: `sticky left-0 z-10 bg-surface border-r
     border-border`. Perhatikan `GlassTableRow` punya `hover:bg-surface-2`;
     sel beku dengan `bg-surface` akan menutupi hover — pilih salah satu dan
     catat di komentar (mis. `group-hover` atau biarkan).
4. Pastikan `dist/` tidak dibangun ulang.

**Kriteria terima.**
- Gulir vertikal di dalam kartu: header tetap di atas, latarnya opak.
- Gulir horizontal: kolom Waktu tetap di kiri, tidak tumpang tindih dengan
  header (z-index berlapis: th-kiri 30, th 20, td-kiri 10).
- Tanpa `maxHeight`, `GlassTable` berperilaku persis seperti sebelumnya
  (ubah ini harus aditif/opt-in).
- Tidak ada scroll horizontal pada `<body>` (aturan repo; lihat
  `pages.test.tsx` "keeps any wide element inside a bounded scroll container").

**Tes.** `GlassTable.test.tsx` + satu tes `HistoryPage.test.tsx` yang memeriksa
kelas `sticky` pada th/td pertama. Uji piksel nyata butuh peramban; sebut di
hand-over kalau tidak dijalankan.

**Estimasi.** 45-60 menit (GlassTable + halaman + tes).

---

## Backlog (belum masuk H-02..H-04)

- **L-01 — Retensi `readings/history` di RTDB.** Firmware push 1 Hz dan node
  tak pernah dibersihkan; tumbuh tanpa batas. Butuh aturan retensi/arsip atau
  pindah ke Firestore. Lihat `TASK.md` Next.
- **L-02 — Virtualisasi list** (`react-window`) kalau register konsisten
  >500 baris. Jangan tambah dependensi tanpa persetujuan pengguna.
- **L-03 — State filter/sort di URL** (`useSearchParams`) agar bisa dibagikan.
- **L-04 — Ekspor CSV mengikuti filter aktif**, bukan selalu seluruh register.
- **L-05 — Kerangka tabel generik** (sort/filter/paginasi) untuk
  `AdminPage` juga; sekarang AdminPage tanpa cari/sort/paginasi.

---

## Aturan repo yang mengikat

- Jangan commit kecuali diminta. Kalau diminta: Conventional Commits.
- Jangan tambah pustaka ikon; pakai `lucide-react`.
- Jangan hard-code warna/spasi; pakai token `tailwind.config.js` dan
  `src/index.css`. `text-faint` **tidak ada**; pakai `text-muted`.
- Salinan UI **Indonesia saja** (`LANG-01`). Kamus menyimpan EN juga, jadi
  tambahkan key ke **kedua** bahasa atau tes paritas key akan merah.
- `web-dashboard/dist/` di-track. Jangan rebuild kecuali diminta; setelah
  `npm run build` untuk gate, kembalikan dengan
  `git checkout -- web-dashboard/dist && git clean -fd web-dashboard/dist`.
- Jangan mengubah Firebase rules, schema data, atau alur auth tanpa bertanya.
- Batas lunak 5 file per tugas; kalau lewat, minta persetujuan dulu.

## Gate sebelum serah terima

```bash
cd web-dashboard
npx tsc --noEmit
npx vitest run
npm run build
git checkout -- dist && git clean -fd dist
```

Tugas belum selesai sampai gate hijau **dan** `TASK.md` diperbarui.

## Upkeep `.md` setiap tugas

- `TASK.md` — entri Done (tanggal + `(working tree)` atau hash), Next.
- `CHANGELOG.md` — kalau perubahan terlihat pengguna (Added/Changed).
- `READY.md` — kalau jumlah file tes/path berubah.
- `DECISIONS.md` — kalau keputusan mahal dibalik diambil (mis. bentuk filter
  atau cara sticky).
