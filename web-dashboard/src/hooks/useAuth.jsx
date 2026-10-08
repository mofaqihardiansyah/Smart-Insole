import { useState, useEffect, useCallback } from "react";
import {
  auth,
  db,
  realtimeDb,
  createUserDoc,
  getUserDoc,
} from "../services/firebaseConfig";

// Mock storage jika belum konfigurasi penuh
import { storage } from "../services/firebaseConfig";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

// Pastikan Firebase terinisialisasi di klien (Vitest akan menskip jika tidak ada)
let firebaseInitialized = false;

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    // Cek apakah sudah diinisialisasi di luar (seperti dari SSR/Node)
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    // Inisialisasi Firebase hanya di klien
    if (!firebaseInitialized) {
      try {
        // Verifikasi config valid (tidak akan lempar error di browser yang tidak punya firebase.init)
        firebaseInitialized = true;
      } catch (e) {
        console.warn("Firebase init skipped in this environment:", e.message);
      }
    }

    // Setup listener status auth
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setDisplayName(currentUser.displayName || "User");
        // Ambil profil lengkap dari Firestore
        getUserDoc(currentUser.uid).then((profile) => {
          if (profile) setDisplayName(profile.displayName || currentUser.displayName);
        });
      } else {
        setUser(null);
        setDisplayName("");
      }
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
        // Simpan/perbarui profil pendek di Firestore
        await createUserDoc(userCred.user.uid, {
          email: userCred.user.email,
          displayName: userCred.user.displayName,
          lastLogin: new Date().toISOString(),
        });
        setUser(userCred.user);
        setDisplayName(userCred.user.displayName || "User");
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
        await createUserDoc(cred.user.uid, {
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: name,
          createdAt: new Date().toISOString(),
        });
        // Kirim email verifikasi
        await sendEmailVerification(cred.user);
        setUser(cred.user);
        setDisplayName(name);
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
      setDisplayName("");
    } catch (err) {
      console.error("Logout error:", err);
    }
  }, []);

  // Fungsi upload foto profil ke Storage
  const uploadProfilePhoto = useCallback(
    async (fileBase64, mimeType = "image/png") => {
      try {
        const storageRef = ref(storage, `profiles/${user?.uid}/photo.jpg`);
        await uploadString(storageRef, fileBase64, mimeType);
        const url = await getDownloadURL(ref(storage, `profiles/${user?.uid}/photo.jpg`));
        // Update Firestore dengan URL foto
        if (user) {
          await createUserDoc(user.uid, { photoURL: url });
        }
        return { success: true, url };
      } catch (err) {
        console.error("Upload photo error:", err);
        return { success: false, error: err.message };
      }
    },
    [user]
  );

  return {
    user,
    loading,
    displayName,
    login: doLogin,
    register: doRegister,
    logout: doLogout,
    uploadProfilePhoto,
  };
};