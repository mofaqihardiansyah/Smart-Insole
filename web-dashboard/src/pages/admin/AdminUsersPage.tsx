import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Trash2, UserCheck, UserX, Users } from "lucide-react";
import { useInsole } from "../../context/InsoleContext";
import { useUser } from "../../context/UserContext";
import { t } from "../../utils/i18n";
import { logAdminAction } from "../../utils/adminAudit";
import {
  GlassButton,
  GlassCard,
  GlassInput,
  GlassTable,
  GlassTableCell,
  GlassTableRow,
  PageHeader,
  PanelHeader,
  StatePanel,
  StatusBanner,
  StatusChip,
} from "../../components/ui/GlassComponents";
import {
  deleteUserDoc,
  listUsers,
  updateUserDoc,
} from "../../services/firebaseConfig";
import {
  pairDevice,
  removeUserMirror,
  subscribeToAllUserDevices,
  unpairDevice,
  mirrorAccountFlag,
} from "../../services/firebaseRealtime";

type AdminUserRow = {
  uid: string;
  displayName?: string;
  email?: string;
  role?: string;
  active?: boolean;
};

type SortKey = "name" | "email" | "status";

const PAGE_SIZE = 20;
const DEVICE_ID = /^[a-z0-9-]{3,32}$/;

const csvCell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

/**
 * AdminUsersPage — accounts and the device each one may read.
 *
 * Two stores are in play and both must be written for a change to take effect:
 * Firestore holds the canonical `role`/`active`, while the Realtime Database
 * holds the mirror the database rules actually read. Pairing lives only in
 * RTDB (`users/<uid>/devices/<id>`).
 *
 * Safety rails are deliberate: an admin cannot deactivate, demote, or delete
 * themselves, and the last active admin cannot be demoted, so the console can
 * never lock its own door.
 */
const AdminUsersPage = () => {
  const { language } = useInsole();
  const { user } = useUser();

  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [auditWarning, setAuditWarning] = useState(false);

  const [pairings, setPairings] = useState<Record<string, string[]>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    let cancelled = false;
    listUsers()
      .then((rows) => {
        if (cancelled) return;
        setUsers(rows as AdminUserRow[]);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err?.message || "Failed to load users");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => subscribeToAllUserDevices(setPairings), []);

  const actor = { uid: user?.uid ?? "", email: user?.email ?? null };

  const record = useCallback(
    async (action: string, target: string | null, detail: string | null) => {
      setAuditWarning(false);
      try {
        await logAdminAction(actor, action, target, detail);
      } catch {
        setAuditWarning(true);
      }
    },
    // actor is rebuilt every render; key on its fields instead.
    [user?.uid, user?.email]
  );

  const activeAdmins = users.filter(
    (u) => u.role === "admin" && u.active !== false
  ).length;

  const setUser = (uid: string, patch: Partial<AdminUserRow>) =>
    setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, ...patch } : u)));

  const handleToggleActive = async (row: AdminUserRow) => {
    if (row.uid === user?.uid) return;
    const next = row.active === false;
    setActionError(null);
    if (!window.confirm(t(next ? "admin.confirmActivate" : "admin.confirmDeactivate", language))) return;
    try {
      await updateUserDoc(row.uid, { active: next });
      setUser(row.uid, { active: next });
      try {
        await mirrorAccountFlag(row.uid, "active", next);
      } catch {
        setActionError(t("admin.mirrorError", language));
      }
      await record("user.active", row.uid, next ? "active" : "inactive");
    } catch (err) {
      setActionError((err as { message?: string })?.message || t("admin.actionError", language));
    }
  };

  const handleChangeRole = async (row: AdminUserRow) => {
    if (row.uid === user?.uid) return;
    const next = row.role === "admin" ? "user" : "admin";
    if (next === "user" && activeAdmins <= 1) return;
    setActionError(null);
    if (!window.confirm(t("admin.confirmRole", language))) return;
    try {
      await updateUserDoc(row.uid, { role: next });
      setUser(row.uid, { role: next });
      try {
        await mirrorAccountFlag(row.uid, "role", next);
      } catch {
        setActionError(t("admin.mirrorError", language));
      }
      await record("user.role", row.uid, next);
    } catch (err) {
      setActionError((err as { message?: string })?.message || t("admin.actionError", language));
    }
  };

  const handleDelete = async (row: AdminUserRow) => {
    if (row.uid === user?.uid) return;
    setActionError(null);
    if (!window.confirm(t("admin.confirmDelete", language))) return;
    try {
      await deleteUserDoc(row.uid);
      setUsers((prev) => prev.filter((u) => u.uid !== row.uid));
      try {
        await removeUserMirror(row.uid);
      } catch {
        setActionError(t("admin.mirrorError", language));
      }
      await record("user.delete", row.uid, row.email ?? null);
    } catch (err) {
      setActionError((err as { message?: string })?.message || t("admin.actionError", language));
    }
  };

  const deviceOwner = (deviceId: string) =>
    Object.entries(pairings).find(([, ids]) => ids.includes(deviceId))?.[0] ?? null;

  const handlePair = async (row: AdminUserRow) => {
    const deviceId = (drafts[row.uid] ?? "").trim();
    setActionError(null);
    if (!DEVICE_ID.test(deviceId)) {
      setActionError(t("admin.users.invalidDevice", language));
      return;
    }
    const owner = deviceOwner(deviceId);
    if (owner && owner !== row.uid) {
      setActionError(t("admin.users.pairTaken", language));
      return;
    }
    try {
      await pairDevice(row.uid, deviceId);
      setPairings((prev) => ({ ...prev, [row.uid]: [deviceId] }));
      setDrafts((prev) => ({ ...prev, [row.uid]: "" }));
      await record("device.pair", deviceId, row.uid);
    } catch (err) {
      setActionError((err as { message?: string })?.message || t("admin.actionError", language));
    }
  };

  const handleUnpair = async (row: AdminUserRow, deviceId: string) => {
    try {
      await unpairDevice(row.uid, deviceId);
      setPairings((prev) => ({ ...prev, [row.uid]: [] }));
      await record("device.unpair", deviceId, row.uid);
    } catch (err) {
      setActionError((err as { message?: string })?.message || t("admin.actionError", language));
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setVisibleCount(PAGE_SIZE);
  };

  const ariaSort = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? "ascending" : "descending") : undefined;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const valueOf = (row: AdminUserRow) =>
      sortKey === "name"
        ? (row.displayName ?? "").toLowerCase()
        : sortKey === "email"
          ? (row.email ?? "").toLowerCase()
          : row.active === false
            ? "inactive"
            : "active";
    const rows = users.filter(
      (row) =>
        !needle ||
        (row.displayName ?? "").toLowerCase().includes(needle) ||
        (row.email ?? "").toLowerCase().includes(needle)
    );
    return rows.sort((a, b) => {
      const left = valueOf(a);
      const right = valueOf(b);
      return sortDir === "asc"
        ? left.localeCompare(right)
        : right.localeCompare(left);
    });
  }, [users, query, sortKey, sortDir]);

  const visible = filtered.slice(0, visibleCount);

  const handleExport = () => {
    const header = [
      t("admin.users.name", language),
      t("admin.users.email", language),
      t("admin.users.role", language),
      t("admin.users.status", language),
      t("admin.users.device", language),
    ];
    const body = filtered.map((row) =>
      [
        row.displayName ?? "",
        row.email ?? "",
        row.role ?? "user",
        row.active === false ? "inactive" : "active",
        (pairings[row.uid] ?? []).join(" "),
      ]
        .map(csvCell)
        .join(",")
    );
    const csv = `\uFEFF${[header.map(csvCell).join(","), ...body].join("\r\n")}\r\n`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `smart-insole-users-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const unavailable = t("common.notAvailable", language);

  return (
    <section className="space-y-5 lg:space-y-6">
      <PageHeader
        title={t("admin.nav.users", language)}
        subtitle={t("admin.users.title", language)}
      />

      <GlassCard flush>
        <PanelHeader
          title={t("admin.users.title", language)}
          icon={<Users className="h-4 w-4" />}
          action={
            <GlassButton type="button" variant="outline" size="sm" onClick={handleExport}>
              {t("admin.users.export", language)}
            </GlassButton>
          }
        />
        <div className="px-6 pb-6">
          {actionError && (
            <StatusBanner
              tone="danger"
              className="mb-4"
              title={t("admin.actionError", language)}
              nextAction={t("common.nextStepCheckConnection", language)}
            >
              {actionError}
            </StatusBanner>
          )}
          {auditWarning && (
            <StatusBanner
              tone="warning"
              className="mb-4"
              title={t("admin.auditError", language)}
            />
          )}

          <div className="mb-4 max-w-sm">
            <GlassInput
              id="admin-user-search"
              type="search"
              label={t("admin.users.search", language)}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
            />
          </div>

          {loading ? (
            <StatePanel variant="loading" title={t("admin.users.loading", language)} />
          ) : loadError ? (
            <StatePanel
              variant="error"
              title={t("admin.users.error", language)}
              description={loadError}
              nextAction={t("admin.retryNext", language)}
              nextActionLabel={t("common.nextStep", language)}
            />
          ) : filtered.length === 0 ? (
            <StatePanel
              variant="empty"
              title={t("admin.users.empty", language)}
              nextAction={t("admin.users.emptyNext", language)}
              nextActionLabel={t("common.nextStep", language)}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <GlassTable>
                  <thead>
                    <GlassTableRow>
                      {([
                        ["name", "admin.users.name"],
                        ["email", "admin.users.email"],
                        ["status", "admin.users.status"],
                      ] as Array<[SortKey, string]>).map(([key, label]) => (
                        <GlassTableCell as="th" scope="col" key={key} aria-sort={ariaSort(key)}>
                          <button
                            type="button"
                            onClick={() => toggleSort(key)}
                            className="inline-flex items-center gap-1 uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            {t(label, language)}
                            {sortKey === key && <Search className="h-3 w-3" aria-hidden="true" />}
                          </button>
                        </GlassTableCell>
                      ))}
                      <GlassTableCell as="th" scope="col">
                        {t("admin.users.device", language)}
                      </GlassTableCell>
                      <GlassTableCell as="th" scope="col">
                        {t("admin.users.role", language)}
                      </GlassTableCell>
                      <GlassTableCell as="th" scope="col">
                        {t("admin.users.actions", language)}
                      </GlassTableCell>
                    </GlassTableRow>
                  </thead>
                  <tbody>
                    {visible.map((row) => {
                      const isSelf = row.uid === user?.uid;
                      const isLastAdmin =
                        row.role === "admin" && activeAdmins <= 1 && row.active !== false;
                      const devices = pairings[row.uid] ?? [];
                      return (
                        <GlassTableRow key={row.uid}>
                          <GlassTableCell>
                            <span className="font-medium text-fg">
                              {row.displayName || unavailable}
                            </span>
                          </GlassTableCell>
                          <GlassTableCell>
                            <span className="text-muted">{row.email || unavailable}</span>
                          </GlassTableCell>
                          <GlassTableCell>
                            <StatusChip
                              level={row.active === false ? "danger" : "safe"}
                              label={
                                row.active === false
                                  ? t("admin.users.inactive", language)
                                  : t("admin.users.active", language)
                              }
                              size="sm"
                            />
                          </GlassTableCell>
                          <GlassTableCell>
                            {devices.length === 0 ? (
                              <div className="flex min-w-[12rem] items-end gap-2">
                                <GlassInput
                                  id={`pair-${row.uid}`}
                                  label={t("admin.users.noDevice", language)}
                                  value={drafts[row.uid] ?? ""}
                                  onChange={(event) =>
                                    setDrafts((prev) => ({
                                      ...prev,
                                      [row.uid]: event.target.value,
                                    }))
                                  }
                                />
                                <GlassButton
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlePair(row)}
                                >
                                  {t("admin.users.pair", language)}
                                </GlassButton>
                              </div>
                            ) : (
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="tabular-data text-body-sm">{devices[0]}</span>
                                <GlassButton
                                  type="button"
                                  size="sm"
                                  variant="quiet"
                                  onClick={() => handleUnpair(row, devices[0])}
                                >
                                  {t("admin.users.unpair", language)}
                                </GlassButton>
                              </div>
                            )}
                          </GlassTableCell>
                          <GlassTableCell>
                            <div className="flex flex-col items-start gap-1">
                              <span className="text-body-sm font-medium">
                                {row.role === "admin" ? "admin" : "user"}
                              </span>
                              <GlassButton
                                type="button"
                                size="sm"
                                variant="quiet"
                                disabled={isSelf || isLastAdmin}
                                onClick={() => handleChangeRole(row)}
                              >
                                {row.role === "admin"
                                  ? t("admin.users.makeUser", language)
                                  : t("admin.users.makeAdmin", language)}
                              </GlassButton>
                              {(isSelf || isLastAdmin) && (
                                <span className="text-caption text-muted">
                                  {isSelf
                                    ? t("admin.users.selfLocked", language)
                                    : t("admin.users.lastAdmin", language)}
                                </span>
                              )}
                            </div>
                          </GlassTableCell>
                          <GlassTableCell>
                            <div className="flex flex-wrap gap-2">
                              <GlassButton
                                type="button"
                                size="sm"
                                variant={row.active === false ? "filled" : "outline"}
                                disabled={isSelf}
                                onClick={() => handleToggleActive(row)}
                              >
                                {row.active === false ? (
                                  <>
                                    <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                                    {t("admin.users.activate", language)}
                                  </>
                                ) : (
                                  <>
                                    <UserX className="h-3.5 w-3.5" aria-hidden="true" />
                                    {t("admin.users.deactivate", language)}
                                  </>
                                )}
                              </GlassButton>
                              <GlassButton
                                type="button"
                                size="sm"
                                variant="danger"
                                disabled={isSelf}
                                onClick={() => handleDelete(row)}
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                {t("admin.users.delete", language)}
                              </GlassButton>
                            </div>
                          </GlassTableCell>
                        </GlassTableRow>
                      );
                    })}
                  </tbody>
                </GlassTable>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-body-sm text-muted">
                  {t("history.showing", language, {
                    shown: visible.length,
                    total: filtered.length,
                  })}
                </p>
                {filtered.length > visibleCount && (
                  <GlassButton
                    type="button"
                    variant="outline"
                    onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                  >
                    {t("history.loadMore", language)}
                  </GlassButton>
                )}
              </div>
            </>
          )}
        </div>
      </GlassCard>
    </section>
  );
};

export default AdminUsersPage;
