import { appendAudit } from "../services/firebaseRealtime";

/**
 * Record one administrative action.
 *
 * Audit is best-effort by design: a failed write must not undo an action the
 * admin already completed, so the caller gets a rejected promise it can turn
 * into a warning banner instead of an error that hides the success.
 */
export const logAdminAction = (
  actor: { uid: string; email: string | null },
  action: string,
  target: string | null = null,
  detail: string | null = null
): Promise<void> =>
  appendAudit({
    actorUid: actor.uid,
    actorEmail: actor.email,
    action,
    target,
    detail,
    at: Date.now(),
  });

export default logAdminAction;
