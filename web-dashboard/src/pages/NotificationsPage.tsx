import React from "react";
import { Navigate } from "react-router-dom";

/**
 * The notification settings now live on the Settings page: browser permission,
 * alarm preferences and the live connection state sit beside the thresholds
 * they belong with. This route survives only so an old bookmark (or a stale
 * `/notifications` link) lands on the merged page instead of a dead end.
 *
 * The bell in the header no longer navigates; it opens a summary card and links
 * here from its footer.
 */
const NotificationsPage = () => <Navigate to="/settings" replace />;

export default NotificationsPage;
