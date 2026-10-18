/**
 * devWarn — the one development-only warning channel.
 *
 * The design system's primitives resolve an unknown key to a declared fallback
 * rather than refusing to render. That choice is deliberate: on a clinical
 * console a blank panel is strictly worse than a correct-looking one, so a bad
 * key at a call site degrades to a declared default in production instead of
 * emptying a view. The choice only holds while development is loud about the
 * degradation, and four fallback sites need that signal (GlassButton's variant
 * map, Chip's tone map, StatusChip's level map, StatePanel's variant branch),
 * so the signal lives in one place rather than four slightly different calls.
 *
 * The development flag is read at CALL time, never at module scope. A
 * module-scope read freezes whatever the bundler saw when the module loaded,
 * which makes the helper untestable and lets a build-time constant decide
 * whether a warning is reachable at all.
 *
 * Warning is best-effort by construction. A console that has been replaced or
 * deleted, or an environment object that is not present, must never become the
 * reason a view fails to render: a warning is a diagnostic, and a diagnostic
 * that throws is a worse defect than the one it reports.
 *
 * @param {string} component the primitive's name, used as the line's prefix
 * @param {string} message what was received and what was expected instead
 */
export function devWarn(component, message) {
  let enabled = false;
  try {
    enabled = Boolean(import.meta.env?.DEV);
  } catch {
    enabled = false;
  }

  if (!enabled) return;

  try {
    if (typeof console?.warn === "function") {
      console.warn(`[${component}] ${message}`);
    }
  } catch {
    // Swallowed on purpose: see the header.
  }
}
