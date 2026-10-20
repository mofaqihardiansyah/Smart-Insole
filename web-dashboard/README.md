# Web Dashboard — Smart Insole

Frontend **React.js + Tailwind CSS** untuk menampilkan data tekanan telapak
kaki secara *real-time* dari Firebase, lengkap dengan *plantar heatmap* dan
*Early Warning System*.

## Isi Folder

| Path | Keterangan |
| --- | --- |
| `src/pages/Dashboard.jsx` | Halaman utama: status real-time + heatmap |
| `src/pages/History.jsx` | Grafik histori tekanan & durasi tumpuan |
| `src/pages/Settings.jsx` | Konfigurasi ambang batas & perangkat |
| `src/components/Heatmap.jsx` | Visualisasi plantar heatmap (Canvas) |
| `src/components/StatusCard.jsx` | Kartu status risiko (Aman/Waspada/Bahaya) |
| `src/components/AlertModal.jsx` | Notifikasi & alarm audio |
| `src/config/firebase.js` | Inisialisasi Firebase Web SDK |
| `src/hooks/useInsoleData.js` | Hook listener *realtime* dari Firebase |

## Setup

```bash
npm install
cp .env.example .env.local     # lalu isi kredensial Firebase
npm run dev                    # http://localhost:5173
```

## Build & Deploy

```bash
npm run build                  # output di dist/
```

Upload folder `dist/` ke Vercel / Netlify / Firebase Hosting (free tier).
Backend tidak perlu di-*deploy* — ESP32 menulis langsung ke Firebase.

## Catatan Notifikasi

Izin notifikasi hanya bisa diminta setelah halaman dimuat di konteks
*secure* (`https://` atau `localhost`) dan **tidak** bisa di-*prompt* di
seluler non-HTTPS. Untuk uji coba di HP via jaringan lokal, gunakan
`localhost` dengan *port forwarding* atau deploy ke domain HTTPS.

## Verifikasi OTP dan Lupa Kata Sandi

Dua halaman menangani alur ini:

| Rute | Keterangan |
| --- | --- |
| `/verify-otp` | Verifikasi email setelah mendaftar. Enam digit, berlaku 10 menit, maksimal 5 percobaan. |
| `/forgot-password` | Kirim kode, verifikasi, lalu Firebase mengirim tautan reset. Tautan membuka formulir kata sandi baru di rute yang sama. |

Kode dikirim melalui **EmailJS** (gratis untuk pemakaian kecil). Isi
`VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, dan
`VITE_EMAILJS_PUBLIC_KEY` di `.env.local`; contoh variabel template ada di
`.env.example`. Tanpa konfigurasi tersebut, `npm run dev` menampilkan kode
di halaman agar alur bisa dicoba, sedangkan build produksi menolak berpura-pura
sudah mengirim email.

Tautan reset memakai `continueUrl` ke halaman ini. Tambahkan domain produksi
ke **Firebase Console > Authentication > Settings > Authorized domains** agar
tautan kembali ke aplikasi. Bila domain belum diizinkan, pengiriman otomatis
memakai halaman reset bawaan Firebase sehingga akun tetap bisa dipulihkan.
