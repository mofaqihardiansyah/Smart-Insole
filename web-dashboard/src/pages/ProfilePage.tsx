import React, { useEffect, useState } from "react";
import { Activity, CalendarDays, Save, Trash2, User } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useInsole } from "../context/InsoleContext";
import { useUser } from "../context/UserContext";
import { t } from "../utils/i18n";
import type { RiskLevel } from "../types/insole";
import {
  GlassButton,
  GlassCard,
  GlassInput,
  PageHeader,
  PanelHeader,
  StatePanel,
  StatusBanner,
  StatusChip,
} from "../components/ui/GlassComponents";

/**
 * ProfilePage: account identity, the editable display name, and the statistics
 * that actually exist.
 *
 * Every figure is derived from InsoleContext's `incidentLogs`, which the context
 * appends to only when a real reading changes the risk level. With nothing
 * recorded yet the statistics panel says so rather than showing a placeholder
 * count.
 */

/** One incident as this page counts it: its level, under either field name. */
interface CountedIncident {
  type?: RiskLevel;
  risk?: RiskLevel;
}

/** One figure in the statistics strip. */
interface StatItem {
  key: string;
  value: number;
  level: RiskLevel | null;
}

/**
 * Firebase reports these codes; the page turns them into one sentence each.
 * Anything unknown falls back to the generic "not deleted" line, because a
 * failed deletion must never read as a success.
 */
const DELETE_ERROR_KEYS: Record<string, string> = {
  "auth/wrong-password": "profile.deleteWrongPassword",
  "auth/invalid-credential": "profile.deleteWrongPassword",
  "auth/too-many-requests": "profile.deleteTooMany",
  "auth/network-request-failed": "profile.deleteNetwork",
  "auth/admin-account": "profile.deleteAdmin",
};

const deleteErrorKey = (code?: string) =>
  (code && DELETE_ERROR_KEYS[code]) || "profile.deleteFailed";

const ProfilePage = () => {
  const { user, displayName, loading, deleteAccount, updateDisplayName } =
    useAuth();
  const { role } = useUser();
  const { language, incidentLogs } = useInsole();

  const [fullName, setFullName] = useState(displayName || "");
  const [saved, setSaved] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // displayName arrives asynchronously from the auth listener, so the field
  // follows it until the user starts typing.
  useEffect(() => {
    setFullName(displayName || "");
  }, [displayName]);

  const identity = displayName || user?.email || "";
  const initial = identity.trim().charAt(0).toUpperCase();

  /**
   * Persist the name.
   *
   * The button used to raise a success banner without writing anything, so a
   * reload silently discarded the edit. It now reports the real outcome: the
   * banner appears only after `updateDisplayName` resolves, and a failed write
   * keeps the error on screen instead of claiming success.
   */
  const handleSaveName = async () => {
    if (savingName) return;
    setSaved(false);
    setSaveError(false);
    setSavingName(true);
    try {
      const result = await updateDisplayName(fullName);
      if (result.success) setSaved(true);
      else setSaveError(true);
    } finally {
      setSavingName(false);
    }
  };

  const creationTime = user?.metadata?.creationTime;
  const creationDate = creationTime ? new Date(creationTime) : null;
  const memberSince =
    creationDate && !Number.isNaN(creationDate.getTime())
      ? creationDate.toLocaleDateString(language === "id" ? "id-ID" : "en-GB")
      : t("common.notAvailable", language);

  const dangerCount = incidentLogs.filter(
    (log: CountedIncident) => (log.type ?? log.risk) === "danger"
  ).length;
  const warningCount = incidentLogs.filter(
    (log: CountedIncident) => (log.type ?? log.risk) === "warning"
  ).length;

  const stats: StatItem[] = [
    { key: "history.totalIncidents", value: incidentLogs.length, level: null },
    { key: "history.dangerCount", value: dangerCount, level: "danger" },
    { key: "history.warningCount", value: warningCount, level: "warning" },
  ];

  /**
   * Delete this account for real.
   *
   * The password is not decoration: Firebase refuses a stale session, and the
   * re-authentication it demands is the last confirmation the reader gives. On
   * success the auth listener signs the shell out, so there is nothing to
   * navigate here.
   */
  const handleDeleteAccount = async () => {
    if (!deletePassword || deleting) return;
    if (!window.confirm(t("profile.deleteConfirm", language))) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      const result = await deleteAccount(deletePassword);
      if (!result.success) setDeleteError(deleteErrorKey(result.code));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="space-y-5 lg:space-y-6">
      <PageHeader
        title={t("profile.title", language)}
        subtitle={t("profile.subtitle", language)}
      />

      {loading ? (
        <StatePanel
          variant="loading"
          title={t("app.loading", language)}
          rows={4}
        />
      ) : !user ? (
        <StatePanel
          variant="error"
          title={t("profile.unavailable", language)}
          nextAction={t("profile.accountNext", language)}
        />
      ) : (
        <>
          <GlassCard>
            <div className="flex items-center gap-4">
              <span
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-h4 text-primary"
                aria-hidden="true"
              >
                {initial || <User className="h-6 w-6" />}
              </span>
              <div className="min-w-0">
                <p className="truncate font-heading text-h4 text-fg">
                  {displayName || t("common.notAvailable", language)}
                </p>
                <p className="truncate text-body-sm text-muted">
                  {user.email || t("common.notAvailable", language)}
                </p>
              </div>
            </div>

            <p className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4 text-body-sm text-muted">
              <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{t("profile.memberSince", language)}</span>
              <span className="tabular-data text-fg">{memberSince}</span>
            </p>
          </GlassCard>

          <GlassCard className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <GlassInput
                id="profile-name"
                label={t("profile.name", language)}
                value={fullName}
                onChange={(event) => {
                  setFullName(event.target.value);
                  setSaved(false);
                }}
                autoComplete="name"
              />

              <GlassInput
                id="profile-email"
                label={t("profile.email", language)}
                value={user.email || ""}
                readOnly
                hint={t("profile.emailLocked", language)}
              />
            </div>

            {saved && (
              <StatusBanner
                tone="success"
                title={t("profile.saved", language)}
                onDismiss={() => setSaved(false)}
                dismissLabel={t("common.dismiss", language)}
              />
            )}

            {saveError && (
              <StatusBanner
                tone="danger"
                title={t("profile.saveFailed", language)}
                onDismiss={() => setSaveError(false)}
                dismissLabel={t("common.dismiss", language)}
              />
            )}

            <div className="flex justify-end">
              <GlassButton
                type="button"
                variant="filled"
                onClick={handleSaveName}
                disabled={savingName}
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                {t("profile.save", language)}
              </GlassButton>
            </div>
          </GlassCard>

          <GlassCard flush>
            <PanelHeader
              title={t("profile.stats", language)}
              icon={<Activity className="h-4 w-4" />}
            />

            <div className="px-6 pb-6">
              {incidentLogs.length === 0 ? (
                <StatePanel
                  variant="empty"
                  title={t("history.empty", language)}
                  description={t("history.emptyBody", language)}
                  nextAction={t("profile.emptyNext", language)}
                />
              ) : (
                <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  {stats.map((stat) => (
                    <div key={stat.key}>
                      <dt className="text-body-sm text-muted">
                        {t(stat.key, language)}
                      </dt>
                      <dd className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="tabular-data font-heading text-stat text-fg">
                          {stat.value}
                        </span>
                        {stat.level && (
                          <StatusChip
                            level={stat.level}
                            label={t(`risk.${stat.level}`, language)}
                            size="sm"
                          />
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </GlassCard>

          <GlassCard flush>
            <PanelHeader title={t("profile.deleteTitle", language)} />

            <div className="space-y-4 px-6 pb-6">
              <p className="max-w-prose text-body-sm text-muted">
                {t("profile.deleteBody", language)}
              </p>

              {role === "admin" ? (
                <p className="max-w-prose text-body-sm text-muted">
                  {t("profile.deleteAdmin", language)}
                </p>
              ) : (
                <>
                  {deleteError && (
                    <StatusBanner
                      tone="danger"
                      title={t(deleteError, language)}
                    />
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="sm:max-w-xs sm:flex-1">
                      <GlassInput
                        id="profile-delete-password"
                        type="password"
                        label={t("profile.deletePassword", language)}
                        value={deletePassword}
                        onChange={(event) => {
                          setDeletePassword(event.target.value);
                          setDeleteError(null);
                        }}
                        autoComplete="current-password"
                      />
                    </div>
                    <GlassButton
                      type="button"
                      variant="danger"
                      disabled={!deletePassword || deleting}
                      onClick={handleDeleteAccount}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      {deleting
                        ? t("profile.deleting", language)
                        : t("profile.deleteAction", language)}
                    </GlassButton>
                  </div>
                </>
              )}
            </div>
          </GlassCard>
        </>
      )}
    </section>
  );
};

export default ProfilePage;
