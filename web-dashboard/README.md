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
