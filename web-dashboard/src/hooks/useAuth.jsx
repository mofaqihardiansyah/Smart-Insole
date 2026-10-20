import { useState, useEffect, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import {
  auth,
  db,
  realtimeDb,
  createUserDoc,
  getUserDoc,
  getStorageInstance,
} from "../services/firebaseConfig";

// `firebase/storage` is loaded on demand inside uploadProfilePhoto instead of
// at module scope. Nothing on the critical path needs it, and it is a large
// SDK: keeping it out of the initial bundle saves it from being downloaded by
// every patient who never uploads a photo.

// Pastikan Firebase terinisialisasi di klien (Vitest akan menskip jika tidak ada)
let firebaseInitialized = false;

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("");

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
        // Ambil profil lengkap dari Firestore (gagal = tidak fatal)
        getUserDoc(currentUser.uid)
          .then((profile) => {
            if (profile) {
              setDisplayName(profile.displayName || currentUser.displayName);
              setRole(profile.role || "user");
            }
          })
          .catch((e) => console.warn("Gagal ambil profil:", e?.message));
      } else {
        setUser(null);
        setDisplayName("");
        setRole("");
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Fungsi login dengan email & password
  const doLogin = useCallback(
    async (email, password) => {
      // `loading` belongs to the auth listener (the first paint), not to a
      // form submit. Toggling it here unmounted the whole login page and
      // showed the splash for the duration of the request.
      try {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        // Simpan/perbarui profil pendek di Firestore (gagal = tidak fatal)
        try {
          await createUserDoc(userCred.user.uid, {
            email: userCred.user.email,
            displayName: userCred.user.displayName,
            lastLogin: new Date().toISOString(),
          });
        } catch (e) {
          console.warn("Gagal simpan profil (Firestore):", e?.message);
        }
        setUser(userCred.user);
        setDisplayName(userCred.user.displayName || "User");
        return { success: true, user: userCred.user };
      } catch (err) {
        console.error("Login error:", err?.code || err?.message);
        // Return the code, never the raw message: the pages translate a known
        // code and keep one generic answer for credential failures.
        return { success: false, code: err?.code };
      }
    },
    []
  );

  // Fungsi registrasi baru
  const doRegister = useCallback(
    async (email, password, name) => {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        // Simpan profil dasar ke Firestore (gagal = tidak fatal)
        try {
          await createUserDoc(cred.user.uid, {
            uid: cred.user.uid,
            email: cred.user.email,
            displayName: name,
            role: "user",
            active: true,
            createdAt: new Date().toISOString(),
          });
        } catch (e) {
          console.warn("Gagal simpan profil (Firestore):", e?.message);
        }
        // Kirim email verifikasi (gagal = tidak fatal)
        try {
          await sendEmailVerification(cred.user);
        } catch (e) {
          console.warn("Gagal kirim email verifikasi:", e?.message);
        }
        setUser(cred.user);
        setDisplayName(name);
        return { success: true, user: cred.user };
      } catch (err) {
        console.error("Register error:", err?.code || err?.message);
        return { success: false, code: err?.code };
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

  // Unggah foto profil. SDK Storage dimuat di sini saat pertama kali dipakai,
  // bukan di awal aplikasi.
  const uploadProfilePhoto = useCallback(
    async (fileBase64, mimeType = "image/png") => {
      try {
        // Only the Storage SDK is fetched on demand; the instance getter comes
        // from the already-loaded config module.
        const { ref, uploadString, getDownloadURL } = await import(
          "firebase/storage"
        );
        const storage = await getStorageInstance();

        const path = `profiles/${user?.uid}/photo.jpg`;
        const storageRef = ref(storage, path);
        await uploadString(storageRef, fileBase64, mimeType);
        const url = await getDownloadURL(ref(storage, path));
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
    role,
    login: doLogin,
    register: doRegister,
    logout: doLogout,
    uploadProfilePhoto,
  };
};