import { createContext, useContext } from "react";
import type { User } from "firebase/auth";

/**
 * UserContext — who is signed in.
 *
 * The auth listener lives in one place (`useAuth`, mounted once in AppShell).
 * Shell chrome and pages read the resolved identity from here instead of each
 * calling `useAuth` themselves, which would register a second Firebase auth
 * listener per caller.
 */
export interface UserValue {
  user: User | null;
  displayName: string;
  /** Firestore's role field; "" until the profile document resolves. */
  role: string;
  signOut: () => void;
}

export const UserContext = createContext<UserValue>({
  user: null,
  displayName: "",
  role: "",
  signOut: () => {},
});

export const UserProvider = UserContext.Provider;

export const useUser = (): UserValue => useContext(UserContext);

export default UserContext;
