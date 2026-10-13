import React, { createContext, useContext } from "react";

/**
 * UserContext — who is signed in.
 *
 * The auth listener lives in one place (`useAuth`, mounted once in AppShell).
 * Shell chrome and pages read the resolved identity from here instead of each
 * calling `useAuth` themselves, which would register a second Firebase auth
 * listener per caller.
 */
export const UserContext = createContext({
  user: null,
  displayName: "",
  role: "",
  signOut: () => {},
});

export const UserProvider = UserContext.Provider;

export const useUser = () => useContext(UserContext);

export default UserContext;
