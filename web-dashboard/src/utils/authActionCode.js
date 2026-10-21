/**
 * ActionCodeSettings for Firebase email actions.
 *
 * `continueUrl` is where Firebase sends the user after the action widget has
 * finished. It must be an authorized domain in
 * Authentication > Settings > Authorized domains, which includes localhost and
 * the project's Hosting domain by default. The base path is preserved so the
 * app keeps working when it is served from a subpath.
 *
 * `handleCodeInApp` stays false: this is a web app, and the hosted Firebase
 * widget is what applies the action code before redirecting back here.
 */
export const buildActionCodeSettings = (path) => {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return {
    url: `${origin}${base}${path}`,
    handleCodeInApp: false,
  };
};

export default buildActionCodeSettings;
