import React, { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { useInsole } from "../../context/InsoleContext";
import { useUser } from "../../context/UserContext";
import { t } from "../../utils/i18n";
import { logAdminAction } from "../../utils/adminAudit";
import {
  GlassCard,
  GlassButton,
  GlassInput,
  PanelHeader,
  PageHeader,
  StatusBanner,
} from "../../components/ui/GlassComponents";
import { subscribeToGlobalConfig, setGlobalConfig } from "../../services/firebaseRealtime";

interface ConfigDraft {
  safeThreshold: number | string;
  dangerThreshold: number | string;
}

interface CaughtError {
  message?: string;
  code?: string;
}

/**
 * AdminConfigPage — the fleet-wide default thresholds.
 *
 * Behaviour is the pre-existing panel, moved verbatim out of the old single
 * AdminPage: the RTDB rules are mirrored client-side, and a PERMISSION_DENIED
 * save explains the missing RTDB admin mirror instead of blaming the network.
 */
const AdminConfigPage = () => {
  const { language } = useInsole();
  const { user } = useUser();

  const [config, setConfig] = useState<ConfigDraft>({
    safeThreshold: 35,
    dangerThreshold: 200,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [auditWarning, setAuditWarning] = useState(false);

  useEffect(() => {
    const unsub = subscribeToGlobalConfig(
      (cfg) => setConfig(cfg),
      () => {
        /* keep defaults if the read fails */
      }
    );
    return unsub;
  }, []);

  const safeValue = Number(config.safeThreshold);
  const dangerValue = Number(config.dangerThreshold);
  const invalid = !(
    Number.isFinite(safeValue) &&
    Number.isFinite(dangerValue) &&
    safeValue > 0 &&
    dangerValue > safeValue
  );

  const handleSave = async () => {
    if (invalid) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    setForbidden(false);
    setAuditWarning(false);
    try {
      await setGlobalConfig({
        safeThreshold: safeValue,
        dangerThreshold: dangerValue,
      });
      setSaved(true);
      try {
        await logAdminAction(
          { uid: user?.uid ?? "", email: user?.email ?? null },
          "config.thresholds",
          null,
          `safe ${safeValue}, danger ${dangerValue}`
        );
      } catch {
        setAuditWarning(true);
      }
    } catch (err) {
      const denied =
        (err as CaughtError)?.code === "PERMISSION_DENIED" ||
        /PERMISSION_DENIED/i.test((err as CaughtError)?.message || "");
      setForbidden(denied);
      setError(
        denied
          ? t("admin.config.forbidden", language)
          : (err as CaughtError)?.message || t("admin.actionError", language)
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-5 lg:space-y-6">
      <PageHeader
        title={t("admin.nav.config", language)}
        subtitle={t("admin.subtitle", language)}
      />

      <GlassCard flush>
        <PanelHeader
          title={t("admin.config.title", language)}
          subtitle={t("admin.config.hint", language)}
          icon={<Settings className="h-4 w-4" />}
        />
        <div className="px-6 pb-6">
          {invalid && (
            <StatusBanner
              tone="danger"
              className="mb-4"
              title={t("admin.config.invalidOrder", language)}
            />
          )}
          {error && (
            <StatusBanner
              tone="danger"
              className="mb-4"
              title={t("admin.actionError", language)}
              nextAction={
                forbidden ? undefined : t("common.nextStepCheckConnection", language)
              }
            >
              {error}
            </StatusBanner>
          )}
          {auditWarning && (
            <StatusBanner
              tone="warning"
              className="mb-4"
              title={t("admin.actionError", language)}
              nextAction={t("common.nextStepCheckConnection", language)}
            />
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <GlassInput
              id="admin-safe-threshold"
              type="number"
              inputMode="numeric"
              min={0}
              max={400}
              label={t("admin.config.safe", language)}
              value={config.safeThreshold}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, safeThreshold: e.target.value }))
              }
            />
            <GlassInput
              id="admin-danger-threshold"
              type="number"
              inputMode="numeric"
              min={0}
              max={400}
              label={t("admin.config.danger", language)}
              value={config.dangerThreshold}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, dangerThreshold: e.target.value }))
              }
            />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <GlassButton
              variant="filled"
              onClick={handleSave}
              disabled={saving || invalid}
            >
              {saving
                ? t("admin.config.saving", language)
                : t("admin.config.save", language)}
            </GlassButton>
            {saved && (
              <span className="text-body-sm font-medium text-safe" role="status">
                {t("admin.config.saved", language)}
              </span>
            )}
          </div>
        </div>
      </GlassCard>
    </section>
  );
};

export default AdminConfigPage;
