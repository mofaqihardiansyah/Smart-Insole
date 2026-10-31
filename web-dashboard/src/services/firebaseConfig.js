// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported as analyticsIsSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
//
// Note on these values being committed: the Firebase web config (apiKey,
// authDomain, databaseURL, ...) is a public project identifier, not a secret.
// It is shipped to every browser by design. Access control lives in the
// security rules, versioned at the repository root:
//
//   database.rules.json    readings: auth read, no client write
//   firestore.rules        users: self or admin, role pinned at sign-up
//   storage.rules          profiles/<uid>: owner-only write
//
// Deploy them with `firebase deploy --only database,firestore:rules,storage`.
// The ESP32 writes with its own database secret; the web client only reads.
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA3qPDVxf-TMtkZtuUQG34cdN4DRUmlZfM",
  authDomain: "sole-3b2e8.firebaseapp.com",
  // Was `...firebasatabase.app` (missing the "d"), which made every Realtime
  // Database call fail with an unresolvable host.
  databaseURL: "https://sole-3b2e8-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sole-3b2e8",
  storageBucket: "sole-3b2e8.firebasestorage.app",
  messagingSenderId: "460660331762",
  appId: "1:460660331762:web:779e46e8ebef3596e5ac6b",
  measurementId: "G-XBZ6KZ989V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Analytics opsional. Diperiksa dulu apakah lingkungan mendukungnya (butuh
// IndexedDB): di jsdom dan di peramban mode privat, memanggilnya akan
// memunculkan peringatan atau gagal. Analytics bukan bagian dari fungsionalitas
// inti, jadi kegagalannya tidak boleh mengganggu apa pun.
let analytics = null;
if (typeof window !== "undefined") {
  analyticsIsSupported()
    .then((supported) => {
      if (supported) analytics = getAnalytics(app);
    })
    .catch(() => {
      /* Analytics tidak tersedia; abaikan. */
    });
}

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const realtimeDb = getDatabase(app);

/**
 * Cloud Storage is created on first use rather than at import time, so the
 * Storage SDK stays out of the initial download. Only the optional profile
 * photo upload needs it, and most sessions never call it.
 *
 * @returns {Promise<import('firebase/storage').FirebaseStorage>}
 */
let storageInstance = null;
export async function getStorageInstance() {
  if (!storageInstance) {
    const { getStorage } = await import("firebase/storage");
    storageInstance = getStorage(app);
  }
  return storageInstance;
}

// Export app for wider use
export { app };

// Helper: bikin doc di Firestore
export async function createUserDoc(uid, data) {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, data, { merge: true });
}

// Helper: baca user doc
export async function getUserDoc(uid) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  return snap.exists() ? snap.data() : null;
}

// Helper: list semua user (admin only — Firestore rules harus mengizinkan
// read collection users hanya untuk role admin)
export async function listUsers() {
  const { collection, getDocs } = await import("firebase/firestore");
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}

// Helper: update field user (aktif/nonaktif, role, dll)
export async function updateUserDoc(uid, data) {
  return createUserDoc(uid, data);
}

// Helper: hapus user doc (admin)
export async function deleteUserDoc(uid) {
  const { deleteDoc } = await import("firebase/firestore");
  await deleteDoc(doc(db, "users", uid));
}