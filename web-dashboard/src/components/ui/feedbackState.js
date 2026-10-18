/**
 * feedbackState: the one tone/state to live-region role decision.
 *
 * `role` decides whether a message interrupts a screen reader (`alert`) or waits
 * for a pause (`status`). That decision used to be written twice, in two files
 * that could drift apart while both still looked correct: by tone in
 * `StatusBanner.jsx` and by variant in `StatePanel.jsx`. D-02 gives the decision
 * one owner, and both registers read it from here.
 *
 * The matrix (`03-UI-SPEC.md` Accessibility 1):
 *   error, danger                     -> "alert"    announced immediately
 *   loading, info, success, warning   -> "status"   announced at the next pause
 *   empty, anything unrecognised      -> undefined  ordinary content, read in order
 *
 * `undefined` is the benign default on purpose. A state that announces nothing
 * reads in document order, whereas an unrecognised state that invented urgency
 * would interrupt a clinician for no reason.
 *
 * No Tailwind class string lives here: the token gate walks `.jsx` sources, and
 * the tone vocabulary belongs to the primitive that renders it.
 */

const IMMEDIATE = new Set(["error", "danger"]);
const DEFERRED = new Set(["loading", "info", "success", "warning"]);

/**
 * The role a feedback surface carries for a given state.
 *
 * @param {string} state a tone name (`info`, `success`, `warning`, `danger`) or
 *   a register state (`loading`, `error`, `empty`)
 * @returns {"alert" | "status" | undefined} the live-region role, or undefined
 *   when the state is ordinary content
 */
export function roleFor(state) {
  if (IMMEDIATE.has(state)) return "alert";
  if (DEFERRED.has(state)) return "status";
  return undefined;
}
