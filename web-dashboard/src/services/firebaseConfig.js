// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA3qPDVxf-TMtkZtuUQG34cdN4DRUmlZfM",
  authDomain: "sole-3b2e8.firebaseapp.com",
  databaseURL: "https://sole-3b2e8-default-rtdb.asia-southeast1.firebasatabase.app",
  projectId: "sole-3b2e8",
  storageBucket: "sole-3b2e8.firebasestorage.app",
  messagingSenderId: "460660331762",
  appId: "1:460660331762:web:779e46e8ebef3596e5ac6b",
  measurementId: "G-XBZ6KZ989V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const realtimeDb = getDatabase(app);
export const storage = getStorage(app);

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