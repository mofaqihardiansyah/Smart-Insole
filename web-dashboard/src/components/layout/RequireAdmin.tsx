import React from "react";
import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { useInsole } from "../../context/InsoleContext";
import { useUser } from "../../context/UserContext";
import { t } from "../../utils/i18n";
import { StatePanel } from "../ui/GlassComponents";

/**
 * RequireAdmin — the console's front door.
 *
 * The role arrives asynchronously from Firestore, so an empty string means
 * "still loading", not "not allowed". Rendering the denied panel during that
 * window would flash a refusal at the admin on every hard refresh; rendering
 * the children would run the console's hooks before the role exists. The
 * loading state is the only honest third option.
 *
 * The guard is UX, not security: the Realtime Database rules are what actually
 * refuse a non-admin's reads and writes.
 */
const RequireAdmin = ({ children }: { children: ReactNode }) => {
  const { role } = useUser();
  const { language } = useInsole();

  if (role === "") {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8">
        <StatePanel
          variant="loading"
          title={t("admin.accessLoading", language)}
          rows={3}
        />
      </div>
    );
  }

  if (role !== "admin") {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8">
        <StatePanel
          variant="error"
          title={t("admin.accessDenied", language)}
          description={t("admin.accessDeniedBody", language)}
          nextAction={t("admin.accessDeniedNext", language)}
          nextActionLabel={t("common.nextStep", language)}
        />
      </div>
    );
  }

  return <>{children}</>;
};

export { RequireAdmin };
export default RequireAdmin;
