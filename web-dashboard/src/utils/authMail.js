import {
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import { buildActionCodeSettings } from "./authActionCode";

/**
 * The two Firebase email actions this app sends.
 *
 * Both attach a continue URL so the reader lands back in the app. A project
 * that has not authorized that domain yet rejects the settings object, not the
 * email address. Falling back to Firebase's hosted page keeps registration and
 * recovery working until the domain is added in the console.
 */
const isUnauthorizedContinue = (error) =>
  error?.code === "auth/unauthorized-continue-uri";

export async function sendVerificationEmail(user) {
  try {
    await sendEmailVerification(user, buildActionCodeSettings("/verify-email"));
  } catch (error) {
    if (!isUnauthorizedContinue(error)) throw error;
    await sendEmailVerification(user);
  }
}

export async function sendResetEmail(auth, email) {
  try {
    await sendPasswordResetEmail(
      auth,
      email,
      buildActionCodeSettings("/forgot-password?mode=resetPassword")
    );
  } catch (error) {
    if (!isUnauthorizedContinue(error)) throw error;
    await sendPasswordResetEmail(auth, email);
  }
}
