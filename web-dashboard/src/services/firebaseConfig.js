/**
 * Firebase Configuration — Smart Insole Dashboard
 * 
 * CARA PAKAI:
 * 1. Buka Firebase Console (console.firebase.google.com)
 * 2. Buat proyek baru -> bernama "smart-insole-dashboard"
 * 3. Aktifkan Authentication (Email/Password + Google optional)
 * 4. Aktifkan Realtime Database (mode test untuk awal)
 * 5. Salin konfigurasi di bawah ini ke file .env.local di root web-dashboard/
 * 6. Jangan commit file .env.asli (sudah di-.gitignore)
 *
 * Buka: https://console.firebase.google.com
 */

// --- Konfigurasi Firebase (disediakan oleh Firebase Console) ---
// Buat file .env.local di root web-dashboard/ dan masukkan nilai di bawah:

// VITE_FIREBASE_API_KEY=your_api_key_from_firebase
// VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
// VITE_FIREBASE_PROJECT_ID=your-project-id
// VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
// VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
// VITE_FIREBASE_APP_ID=your_app_id

// --- Realtime Database Paths ---
// /readings/latest        -> data live paling baru (dibaca Dashboard)
// /readings/history       -> array riwayat sesi lama
// /users/{uid}/profile    -> profil pengguna
// /devices/{deviceId}     -> status insole per perangkat

// --- Authentication Config ---
// Supported providers: email/password, Google
// Minimum database rules (dise-setting di Firebase Console):
//
// {
//   "rules": {
//     ".read": "auth != null",
//     ".write": "auth != null",
//     "readings": {
//       ".read": "auth != null",
//       ".write": "false"
//     },
//     "users": {
//       ".read": "auth.uid != null",
//       ".write": "auth.uid == $uid"
//     }
//   }
// }

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Inisialisasi Firebase (akan dijalankan di main.jsx setelah kondisi cek)