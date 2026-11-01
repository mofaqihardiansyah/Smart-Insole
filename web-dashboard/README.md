# Web Dashboard — Smart Insole

Frontend **React 18 + Vite 5 + Tailwind CSS** untuk menampilkan data tekanan
telapak kaki secara _real-time_ dari Firebase, lengkap dengan _plantar
heatmap_, grafik tren, dan _Early Warning System_.

> Catatan: basis kode sedang dimigrasikan ke TypeScript secara bertahap.
> Berkas sumber utama sudah `.tsx`/`.ts`; sebagian berkas uji masih `.jsx`.

## Isi Folder

| Path | Keterangan |
| --- | --- |
| `src/pages/DashboardPage.tsx` | Halaman utama: status real-time + heatmap |
| `src/pages/MonitoringPage.tsx` | Grafik tren tekanan 3 sensor (live) |
| `src/pages/HistoryPage.tsx` | Statistik & tabel riwayat sesi + ekspor CSV |
| `src/pages/DevicePage.tsx` | Status perangkat: baterai, firmware, koneksi |
| `src/pages/SettingsPage.tsx` | Konfigurasi ambang batas & notifikasi |
| `src/pages/ProfilePage.tsx` | Identitas akun & statistik |
| `src/pages/AdminPage.tsx` | Panel admin: kelola pengguna & konfigurasi |
| `src/pages/LandingPage.tsx` | Halaman publik (landing) |
| `src/pages/LoginPage.tsx` / `RegisterPage.tsx` | Halaman masuk / daftar akun |
| `src/pages/VerifyEmailPage.tsx` / `ForgotPasswordPage.tsx` | Verifikasi email & reset kata sandi |
| `src/components/PlantarHeatmap.tsx` | Visualisasi plantar heatmap (SVG) |
| `src/components/dashboard/AlertModal.tsx` | Notifikasi & alarm audio |
| `src/components/dashboard/BentoGrid.tsx` | Layout grid asimetris (bento box) |
| `src/components/monitoring/TelemetryChart.tsx` | Grafik tekanan live |
| `src/components/layout/` | Kerangka aplikasi: `AppLayout`, `AppSidebar`, `AppNavPill`, `AppTopbar` |
| `src/components/ui/` | Primitif UI: `GlassCard`, `GlassButton`, `StatusChip`, dll. |
| `src/context/InsoleContext.tsx` | State readings + risiko + sumber data (live/simulasi) |
| `src/hooks/useAuth.ts` | Listener status autentikasi Firebase |
| `src/services/firebaseConfig.ts` | Inisialisasi Firebase Web SDK |
| `src/services/firebaseRealtime.ts` | Listener _realtime_ dari Firebase RTDB |
| `src/utils/randomForestRisk.ts` | Inferensi risiko (hybrid RF + rule) |
| `src/utils/rf-model.json` | Model Random Forest ter-ekspor |
| `src/utils/i18n.ts` | Kamus teks ID/EN (permukaan terkirim: Indonesia) |

## Setup

```bash
npm install
cp .env.example .env.local     # lalu isi kredensial Firebase
npm run dev                    # http://localhost:5173
```

## Pengujian & Build

```bash
npm test                       # Vitest (sekali jalan)
npm run typecheck              # TypeScript: tsc --noEmit
npm run build                  # output di dist/
```

Upload folder `dist/` ke Vercel / Netlify / Firebase Hosting (_free tier_).
Backend tidak perlu di-_deploy_ — ESP32 menulis langsung ke Firebase.

## Catatan Notifikasi

Izin notifikasi hanya bisa diminta setelah halaman dimuat di konteks
_secure_ (`https://` atau `localhost`) dan **tidak** bisa di-_prompt_ di
seluler non-HTTPS. Untuk uji coba di HP via jaringan lokal, gunakan
`localhost` dengan _port forwarding_ atau deploy ke domain HTTPS.

## Verifikasi Email dan Lupa Kata Sandi

Keduanya memakai tautan bawaan **Firebase Authentication**. Tidak ada layanan
email pihak ketiga dan tidak ada kode OTP yang disimpan di browser.

| Rute | Keterangan |
| --- | --- |
| `/verify-email` | Halaman tujuan setelah tautan verifikasi diklik. Halaman ini membaca `emailVerified` dari Firebase dan menyediakan tombol kirim ulang. |
| `/forgot-password` | Masukkan email, Firebase mengirim tautan reset, lalu tautan membuka formulir kata sandi baru di rute yang sama. |

Alurnya:

1. Daftar akun. Firebase membuat akun dan mengirim tautan verifikasi.
2. Halaman `/verify-email` meminta pembaca membuka tautan tersebut.
3. Setelah tautan diklik, Firebase menandai email terverifikasi dan
   mengembalikan pembaca ke `/verify-email`.
4. Login akun yang belum terverifikasi diarahkan ke `/verify-email`, bukan
   langsung ke dasbor.

Tautan memakai `continueUrl` ke halaman ini. Tambahkan domain produksi ke
**Firebase Console > Authentication > Settings > Authorized domains** agar
tautan kembali ke aplikasi. Isi email dapat disesuaikan di
**Authentication > Templates**.
