import { useState, useEffect, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import type { User } from "firebase/auth";
import type { StringFormat } from "firebase/storage";
import {
  auth,
  db,
  realtimeDb,
  createUserDoc,
  deleteUserDoc,
  getUserDoc,
  getStorageInstance,
} from "../services/firebaseConfig";
import { removeUserMirror } from "../services/firebaseRealtime";
import { sendVerificationEmail } from "../utils/authMail";

// `firebase/storage` is loaded on demand inside uploadProfilePhoto instead of
// at module scope. Nothing on the critical path needs it, and it is a large
// SDK: keeping it out of the initial bundle saves it from being downloaded by
// every patient who never uploads a photo.

// Pastikan Firebase terinisialisasi di klien (Vitest akan menskip jika tidak ada)
let firebaseInitialized = false;

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("");
  /** Firestore `active`; true until the profile says otherwise. */
  const [active, setActive] = useState<boolean | null>(null);

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
        console.warn(
          "Firebase init skipped in this environment:",
          (e as Error).message
        );
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
              // Missing field means an older account: treated as active.
              setActive(profile.active !== false);
            }
          })
          .catch((e) => console.warn("Gagal ambil profil:", e?.message));
      } else {
        setUser(null);
        setDisplayName("");
        setRole("");
        setActive(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Fungsi login dengan email & password
  const doLogin = useCallback(
    async (email: string, password: string) => {
      // `loading` belongs to the auth listener (the first paint), not to a
      // form submit. Toggling it here unmounted the whole login page and
      // showed the splash for the duration of the request.
      try {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        // Simpan/perbarui profil pendek di Firestore (gagal = tidak fatal).
        // `displayName` is written only when Auth actually has one: setDoc
        // merges, and writing null here would erase the name stored at
        // registration for accounts created before Auth carried a name.
        try {
          const profile: {
            email: string | null;
            lastLogin: string;
            displayName?: string;
          } = {
            email: userCred.user.email,
            lastLogin: new Date().toISOString(),
          };
          if (userCred.user.displayName) {
            profile.displayName = userCred.user.displayName;
          }
          await createUserDoc(userCred.user.uid, profile);
        } catch (e) {
          console.warn("Gagal simpan profil (Firestore):", (e as Error)?.message);
        }
        setUser(userCred.user);
        setDisplayName(userCred.user.displayName || "User");
        return { success: true, user: userCred.user };
      } catch (err) {
        const code = (err as { code?: string })?.code;
        console.error("Login error:", code || (err as Error)?.message);
        // Return the code, never the raw message: the pages translate a known
        // code and keep one generic answer for credential failures.
        return { success: false, code };
      }
    },
    []
  );

  // Fungsi registrasi baru
  const doRegister = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);

        // Keep the Auth profile in step with the Firestore doc. The Firestore
        // copy supplies role and the admin console; this one is available to
        // the auth listener even when the network read has not finished.
        try {
          await updateProfile(cred.user, { displayName: name });
        } catch (e) {
          console.warn("Gagal simpan nama (Auth):", (e as Error)?.message);
        }

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
          console.warn("Gagal simpan profil (Firestore):", (e as Error)?.message);
        }

        // Firebase owns delivery, expiry and the verified flag. The continue
        // URL brings the reader back to the page that explains the next step.
        try {
          await sendVerificationEmail(cred.user);
        } catch (e) {
          console.warn("Gagal kirim email verifikasi:", (e as Error)?.message);
        }

        setUser(cred.user);
        setDisplayName(name);
        return { success: true, user: cred.user };
      } catch (err) {
        const code = (err as { code?: string })?.code;
        console.error("Register error:", code || (err as Error)?.message);
        return { success: false, code };
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
      setRole("");
      setActive(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  }, []);

  // Unggah foto profil. SDK Storage dimuat di sini saat pertama kali dipakai,
  // bukan di awal aplikasi.
  const uploadProfilePhoto = useCallback(
    async (fileBase64: string, mimeType = "image/png") => {
      try {
        // Only the Storage SDK is fetched on demand; the instance getter comes
        // from the already-loaded config module.
        const { ref, uploadString, getDownloadURL } = await import(
          "firebase/storage"
        );
        const storage = await getStorageInstance();

        const path = `profiles/${user?.uid}/photo.jpg`;
        const storageRef = ref(storage, path);
        // The caller passes an image MIME type where the SDK expects its
        // string format enum; kept as-is so behaviour is unchanged.
        await uploadString(storageRef, fileBase64, mimeType as StringFormat);
        const url = await getDownloadURL(ref(storage, path));
        // Update Firestore dengan URL foto
        if (user) {
          await createUserDoc(user.uid, { photoURL: url });
        }
        return { success: true, url };
      } catch (err) {
        console.error("Upload photo error:", err);
        return { success: false, error: (err as Error)?.message };
      }
    },
    [user]
  );

  /**
   * Delete this account for real.
   *
   * On Spark there is no server and no Admin SDK in the browser, so the only
   * account an app can delete is the signed-in one: `deleteUser` is a client
   * SDK call. The order is deliberate.
   *
   *   1. Re-authenticate. Firebase refuses to delete a session that is not
   *      recent, and the password is the proof we ask for anyway.
   *   2. Remove the RTDB mirror. It holds the device pairing, and a pairing
   *      left behind under a dead uid would block the device from ever being
   *      paired again, so a failure here aborts before anything is lost.
   *   3. Remove the Firestore profile.
   *   4. Delete the Auth user — the irreversible commit point.
   *
   * If step 4 fails, the profile is recreated so the account does not survive
   * as a signed-in shell with no role and no record. The mirror is not
   * recreated: the rules let the owner delete it but not write it back, so a
   * failure after step 2 leaves a live account without its pairing. Retrying is
   * safe (every step is idempotent), and an admin can pair the device again.
   *
   * Admins are excluded: the console would lose its only key, and the account
   * that can erase others is the one that must not erase itself.
   */
  const doDeleteAccount = useCallback(
    async (password: string): Promise<{ success: boolean; code?: string }> => {
      const current = auth.currentUser;
      if (!current || !current.email) {
        return { success: false, code: "auth/no-current-user" };
      }
      // Read the role from the store, not from the hook's copy: this is the
      // last moment the document exists, and the console must not lose its
      // only key to a stale render.
      const profile = await getUserDoc(current.uid).catch(() => null);
      if (profile?.role === "admin") {
        return { success: false, code: "auth/admin-account" };
      }

      try {
        await reauthenticateWithCredential(
          current,
          EmailAuthProvider.credential(current.email, password)
        );
      } catch (err) {
        return { success: false, code: (err as { code?: string })?.code };
      }

      const restoreProfile = async () => {
        try {
          await createUserDoc(current.uid, {
            uid: current.uid,
            email: current.email,
            displayName: current.displayName,
            role: "user",
            active: true,
            createdAt: new Date().toISOString(),
          });
        } catch (restoreError) {
          console.error("Gagal memulihkan profil:", (restoreError as Error)?.message);
        }
      };

      try {
        await removeUserMirror(current.uid);
      } catch (err) {
        return { success: false, code: (err as { code?: string })?.code };
      }

      try {
        await deleteUserDoc(current.uid);
      } catch (err) {
        return { success: false, code: (err as { code?: string })?.code };
      }

      try {
        await deleteUser(current);
      } catch (err) {
        await restoreProfile();
        return { success: false, code: (err as { code?: string })?.code };
      }

      setUser(null);
      setDisplayName("");
      setRole("");
      setActive(null);
      return { success: true };
    },
    []
  );

  /**
   * Save the display name the profile page edits.
   *
   * The Firestore copy is written first because the auth listener reads
   * `profile.displayName` before `currentUser.displayName`, and the admin
   * console reads only the document. `createUserDoc` merges, so it updates the
   * name without touching role or active. The Auth profile is best effort:
   * registration already treats it that way, and a failure there must not throw
   * away a write that succeeded.
   */
  const doUpdateDisplayName = useCallback(async (name: string) => {
    const current = auth.currentUser;
    if (!current) return { success: false, code: "auth/no-current-user" };

    const trimmed = name.trim();
    if (!trimmed) return { success: false, code: "profile/empty-name" };

    try {
      await createUserDoc(current.uid, { displayName: trimmed });
    } catch (err) {
      return { success: false, code: (err as { code?: string })?.code };
    }

    try {
      await updateProfile(current, { displayName: trimmed });
    } catch (err) {
      console.warn("Gagal simpan nama (Auth):", (err as Error)?.message);
    }

    setDisplayName(trimmed);
    return { success: true };
  }, []);

  return {
    user,
    loading,
    displayName,
    role,
    active,
    login: doLogin,
    register: doRegister,
    logout: doLogout,
    deleteAccount: doDeleteAccount,
    updateDisplayName: doUpdateDisplayName,
    uploadProfilePhoto,
  };
};