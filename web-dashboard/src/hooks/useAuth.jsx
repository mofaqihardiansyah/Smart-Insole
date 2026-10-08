import { useState, useEffect, useCallback } from "react";
import { auth, db } from "../services/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
} from "firebase/auth";
import {
  doc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";

// Placeholder: Jika firebase belum diinisialisasi penuh, gunakan state lokal
let firebaseInitialized = false;

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cek status autentikasi saat komponen mount
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Fungsi login dengan email & password
  const doLogin = useCallback(
    async (email, password) => {
      setLoading(true);
      try {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        // Ambil profil pendek dari Firestore
        const userRef = doc(db, "users", userCred.user.uid);
        // (opsional: tampilkan data di sini)
        setUser(userCred.user);
        return { success: true, user: userCred.user };
      } catch (err) {
        console.error("Login error:", err);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Fungsi registrasi baru
  const doRegister = useCallback(
    async (email, password, name) => {
      setLoading(true);
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        // Simpan profil dasar ke Firestore
        await setDoc(doc(db, "users", cred.user.uid), {
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: name,
          createdAt: new Date(),
          photoURL: cred.user.photoURL,
        });
        // Kirim email verifikasi
        await sendEmailVerification(cred.user);
        setUser(cred.user);
        return { success: true, user: cred.user };
      } catch (err) {
        console.error("Register error:", err);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Fungsi logout
  const doLogout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  }, []);

  return {
    user,
    loading,
    login: doLogin,
    register: doRegister,
    logout,
  };
};