import React, { useEffect, useState } from "react";
import { Activity, CalendarDays, Save, User } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useInsole } from "../context/InsoleContext";
import { t } from "../utils/i18n";
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
const ProfilePage = () => {
  const { user, displayName, loading } = useAuth();
  const { language, incidentLogs } = useInsole();

  const [fullName, setFullName] = useState(displayName || "");
  const [saved, setSaved] = useState(false);

  // displayName arrives asynchronously from the auth listener, so the field
  // follows it until the user starts typing.
  useEffect(() => {
    setFullName(displayName || "");
  }, [displayName]);

  const identity = displayName || user?.email || "";
  const initial = identity.trim().charAt(0).toUpperCase();

  const creationTime = user?.metadata?.creationTime;
  const creationDate = creationTime ? new Date(creationTime) : null;
  const memberSince =
    creationDate && !Number.isNaN(creationDate.getTime())
      ? creationDate.toLocaleDateString(language === "id" ? "id-ID" : "en-GB")
      : t("common.notAvailable", language);

  const dangerCount = incidentLogs.filter(
    (log) => (log.type ?? log.risk) === "danger"
  ).length;
  const warningCount = incidentLogs.filter(
    (log) => (log.type ?? log.risk) === "warning"
  ).length;

  const stats = [
    { key: "history.totalIncidents", value: incidentLogs.length, level: null },
    { key: "history.dangerCount", value: dangerCount, level: "danger" },
    { key: "history.warningCount", value: warningCount, level: "warning" },
  ];

  return (
    <section className="mx-auto w-full max-w-3xl space-y-5 lg:space-y-6">
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

            {saved && (
              <StatusBanner
                tone="success"
                title={t("profile.saved", language)}
                onDismiss={() => setSaved(false)}
                dismissLabel={t("common.dismiss", language)}
              />
            )}

            <div className="flex justify-end">
              <GlassButton
                type="button"
                variant="filled"
                onClick={() => setSaved(true)}
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
                  title={t("profile.unavailable", language)}
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
        </>
      )}
    </section>
  );
};

export default ProfilePage;
