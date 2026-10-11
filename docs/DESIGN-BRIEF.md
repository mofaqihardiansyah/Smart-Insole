# Design Brief — Smart Insole IoT Dashboard (Web)

> Dokumen ini ditujukan untuk AI agent/designer: berisi semua yang perlu diketahui
> untuk merancang ulang UI dashboard ini **tanpa merusak logika yang sudah jalan**.
> Tanggal: 11 Oktober 2026.

---

## 1. Konteks Proyek

- **Tugas Akhir (TA)**: Rancang bangun pemantauan tekanan telapak kaki berbasis IoT
  untuk penderita **Diabetes Mellitus**, mencegah terjadinya **Ulkus Kaki Diabetik**.
- **Perangkat**: Insole (sol sepatu pintar) dengan 3 sensor tekanan (kPa):
  - `forefoot` (depan kaki)
  - `midfoot` (tengah kaki)
  - `heel` (tumit)
- **Pipeline data**: ESP32 → Firebase Realtime Database → Web dashboard (realtime).
- **Target pengguna**: pasien diabetes, dokter/kader kesehatan, keluarga pasien.
  Banyak yang **lansia** → keterbacaan besar, kontras tinggi, dan navigasi sederhana wajib.

## 2. Kebutuhan Desain (hard requirement)

1. **Mobile-first, tapi desktop tetap optimal/seimbang** — HP (360–430px) adalah
   pengguna utama, tapi desktop (≥1024px) harus tetap pengalaman kelas satu,
   **bukan sekadar tampilan HP yang dibesarkan**. Concretely:
   - **Navbar**: mobile = icon-only yang mengambang; desktop = tampil penuh
     dengan label teks + ikon, lebar maksimal, posisi tetap di atas.
   - **Bento grid**: mobile 1 kolom, tablet 2 kolom, desktop 3+ kolom dengan
     variasi ukuran cell (asimetris) yang memanfaatkan lebar layar.
   - **Konten utama** (dashboard, monitoring): di desktop gunakan layout
     multi-kolom — mis. heatmap/plantar view di kiri, metrik & grafik di kanan —
     bukan satu kolom sempit yang di-center.
   - **Maksimal lebar konten** (`max-w-*`): mobile full-width, desktop dibatasi
     (mis. `max-w-7xl`) agar tidak terlalu renggang, tapi tetap lapang.
   - **Interaksi**: hover states, tooltip, dan target mouse 24–32px cukup di
     desktop; di mobile tetap ≥44px touch target.
   - **Tipografi**: heading & angka vital sedikit lebih besar di desktop
     (mis. `text-2xl md:text-3xl`), proporsional.
   - Gunakan breakpoint Tailwind (`sm:`, `md:`, `lg:`) secara konsisten di
     seluruh komponen.
2. **Bento grid** — layout kartu asimetris (khas bento box) untuk dashboard & landing.
3. **Floating navbar** — navigasi mengambang (floating/blurred), mobile-friendly.
4. **Clean & ramah semua pengguna (accessible)**:
   - Kontras teks minimal WCAG AA (4.5:1), ideal AAA untuk angka vital.
   - Fokus keyboard terlihat (focus ring).
   - Area sentuh minimal 44×44px.
   - Status risiko **tidak hanya dibedakan oleh warna** (pakai ikon/label teks juga).
   - Hormati `prefers-reduced-motion`.
5. **Bilingual ID/EN** — semua teks bisa berganti bahasa (dictionary di `src/utils/i18n.js`).
   Desain harus tahan terhadap teks EN yang lebih panjang (~30% lebih lebar).
6. **Online realtime only** — tidak ada mode offline; boleh ada indikator "koneksi live".

## 3. Sistem Warna (tema saat ini — boleh diganti total)

Sumber: `web-dashboard/tailwind.config.js` + CSS variables di `web-dashboard/src/index.css`.

| Token | Hex | Peran |
|---|---|---|
| `bg` | `#0a0a0f` | Background utama (gelap) |
| `fg` | `#e5e2e3` | Teks utama |
| `muted` | `#8f8fa1` | Teks sekunder |
| `card` | `#111119` | Permukaan kartu |
| `border` | `#2a2a2d` | Garis/border |
| `primary` | `#5E6BFF` | Aksi utama, link, sorotan |
| `secondary` | `#50D8E9` | Aksen (mis. grafik midfoot) |
| `accent` | `#FFB689` | Aksen hangat |
| `safe` | `#10B981` | Status **Aman** |
| `warning` | `#F59E0B` | Status **Waspada** |
| `danger` | `#EF4444` | Status **Bahaya**, error |

**Semantik risiko** (dipakai di seluruh aplikasi, jangan diubah artinya):
- `safe` = Aman / Safe
- `warning` = Waspada / Warning
- `danger` = Bahaya / Danger

Desainer boleh mengganti palet, tapi pertahankan 3 warna semantik risiko yang
mudah dibedakan dan paling menonjol di antara warna lain.

## 4. Font & Ikon

- **Font**: Inter (body/angka), Manrope (heading) — via Google Fonts di `index.html`.
- **Ikon**: `lucide-react` (sudah terpasang). Jangan tambah library ikon lain.
- Angka tekanan/kPa gunakan `font-variant-numeric: tabular-nums` agar tidak goyang saat update realtime.

## 5. Kebutuhan per Halaman (10 halaman)

Route dilindungi auth (harus login) kecuali Landing, Login, Register.

### Halaman Publik
| # | Route | File | Isi |
|---|---|---|---|
| 1 | `/` | `pages/LandingPage.jsx` | Hero (judul + USP), bento grid 3 fitur utama, CTA **Masuk** & **Daftar**, ringkasan edukasi DM |
| 2 | `/login` | `pages/LoginPage.jsx` | Form email + password, link daftar, "masuk sebagai tamu" |
| 3 | `/register` | `pages/RegisterPage.jsx` | Form nama, email, password, konfirmasi, catatan verifikasi email |

### Halaman Terproteksi
| # | Route | File | Isi |
|---|---|---|---|
| 4 | `/` | `pages/DashboardPage.jsx` | **Halaman utama**: BentoGrid metrik (Forefoot/Midfoot/Heel dalam kPa), PlantarHeatmap (visualisasi telapak kaki), status risiko global, indikator sumber data (Simulasi/Firebase Live) |
| 5 | `/monitoring` | `pages/MonitoringPage.jsx` | Grafik tren 3 sensor (Swiper carousel, 1 slide = 1 sesi), placeholder jika data kosong |
| 6 | `/history` | `pages/HistoryPage.jsx` | Statistik ringkas (total sesi, jumlah bahaya), tabel riwayat (waktu, durasi, tekanan rata-rata, risiko, device), tombol **Export CSV** |
| 7 | `/device` | `pages/DevicePage.jsx` | Status insole: baterai (progress bar), versi firmware, koneksi terakhir, badge Online/Offline (live region), tips koneksi |
| 8 | `/settings` | `pages/SettingsPage.jsx` | Ambang batas risiko (angka kPa untuk batas Aman & Waspada + validasi), preferensi notifikasi, tombol simpan |
| 9 | `/profile` | `pages/ProfilePage.jsx` | Avatar + nama + email, pemilih bahasa (ID/EN), statistik (total sesi, total deteksi risiko), tombol simpan |
| 10 | `/notifications` | `pages/NotificationsPage.jsx` | Izin notifikasi browser, toggle suara alarm & vibrasi, status koneksi Firebase |

## 6. Inventaris Komponen (jangan dihapus logikanya)

| File | Exports | Catatan |
|---|---|---|
| `components/ui/GlassButton.jsx` | `GlassButton` | props: `variant` = filled/outline/ghost, `size`, `disabled`, meneruskan `...props` ke `<button>` (termasuk `type="submit"`) |
| `components/ui/GlassInput.jsx` | `GlassInput` | props: `label`, `error`, `type`, `placeholder`, `value`, `onChange`; sudah punya id/aria otomatis |
| `components/ui/GlassCard.jsx` | `GlassCard`, `GlassIcon` | Container kartu + wrapper ikon |
| `components/ui/GlassForm.jsx` | `GlassFormGroup`, `GlassLabel`, `GlassSelect`, `GlassSwitch` (+ re-export lain) | `GlassSwitch` props: `checked`, `onCheckedChange` |
| `components/ui/GlassTable.jsx` | `GlassTable`, `GlassTableRow`, `GlassTableCell` | `GlassTableCell` props: `as` = td/th |
| `components/ui/GlassComponents.jsx` | barrel semua komponen di atas | |
| `components/layout/FloatingNavbar.jsx` | `FloatingNavbar` | props: `links` (array `{id,label,icon,accessibilityLabel}`), `activeLink`, `onSelect`, `hasUnread`. `icon` = nama ikon di map `ICONS` (Home, Chart, History, Device, Settings, User, Landing) |
| `components/dashboard/BentoGrid.jsx` | `BentoGrid` | props: `cards` (array `{icon,title,value,label,action,onSelect}`), `columns`, `gutters`; responsif 1/2/3 kolom via resize listener |
| `context/InsoleContext.jsx` | `useInsole` | Return `{ readings: {forefoot,midfoot,heel}, risk, source }` — **sekarang mock, nanti diganti Firebase RTDB** (jangan ubah bentuk return) |
| `hooks/useAuth.jsx` | `useAuth` | Return `{ user, loading, displayName, login, register, logout, uploadProfilePhoto }` |
| `hooks/useRoute.jsx` | `useRoute` | Return `{ pathname, search, hash, navigate }` |

## 7. Batasan Teknis (penting!)

1. **Framework**: React 18 + Vite 5 + Tailwind CSS 3 + React Router v7 (`BrowserRouter`).
2. **Struktur file**: semua halaman di `src/pages/`, komponen di `src/components/`.
   Ubah **class/style** sebisa mungkin; jangan pindah file tanpa alasan.
3. **Warna via Tailwind**: gunakan token yang sudah ada (`bg-card`, `text-muted`,
   `text-safe`, dll). Kalau menambah warna baru, tambahkan di `tailwind.config.js`.
4. **Firebase**: `services/firebaseConfig.js` sudah terisi kredensial nyata.
   Halaman masih memakai **mock data** — jangan hapus mock sebelum integrasi RTDB.
5. **Jangan ubah**: bentuk return hook, nama export komponen, dan path route.
6. **Verifikasi wajib**: setelah ubah desain, jalankan
   `npm run build` di `web-dashboard/` — build harus sukses tanpa error.
7. **PWA**: `index.html` + `public/manifest` — pertahankan meta viewport & title.

## 8. Kondisi Saat Ini (baseline)

- Desain sekarang: **glassmorphism gelap** (blur, kartu translusen, aksen indigo).
  Silakan dipertahankan, dimodifikasi, atau diganti — keputusan desainer.
- Sudah berjalan & terverifikasi: `npm run build` sukses; landing & login tampil benar
  di viewport mobile 390×844.
- Yang **belum** ada (tampilan mock/plausible dulu boleh):
  - Integrasi Firebase RTDB untuk readings live
  - Grafik garis asli di Monitoring (sekarang angka per slide)
  - **Layout desktop optimal** (navbar dengan label, grid multi-kolom, dsb.)
    — ini bagian dari requirement desain, bukan opsional

## 9. Deliverable yang Diharapkan

1. Update class/struktur halaman & komponen sesuai rancangan baru.
2. (Opsional) Token tema baru di `tailwind.config.js` + `index.css`.
3. `npm run build` tetap sukses.
4. Ringkasan singkat perubahan (file apa saja yang disentuh).
