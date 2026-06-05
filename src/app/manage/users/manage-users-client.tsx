"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  startTransition,
} from "react";
import { usePathname } from "next/navigation";

import { getLocalizedText, getManageRouteMeta } from "@/app/manage/config";
import { ManagerShell } from "@/components/manager-shell";
import { useToast } from "@/components/toast-provider";
import type { UserProfile } from "@/core/interfaces/auth.interface";
import type { ManageUserFormValues } from "@/core/validators/users.validator";
import { getManageUsers, updateManageUser } from "@/core/services/users.service";

import { UserSearchFilters } from "./components/user-search-filters";
import { UserTable } from "./components/user-table";
import { UserFormModal } from "./components/user-form-modal";

interface ManageUsersClientProps {
  initialUsers?: UserProfile[];
}

export function ManageUsersClient({
  initialUsers = [],
}: ManageUsersClientProps) {
  const pathname = usePathname();
  const { pushToast } = useToast();
  const routeMeta = useMemo(() => getManageRouteMeta(pathname), [pathname]);
  const pageTitle = useMemo(() => getLocalizedText(routeMeta.title), [routeMeta]);
  const pageSubtitle = useMemo(() => getLocalizedText(routeMeta.subtitle), [routeMeta]);

  // Data states
  const [users, setUsers] = useState<UserProfile[]>(initialUsers);
  const [isLoading, setIsLoading] = useState(initialUsers.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (initialUsers.length > 0) {
      setLastUpdatedAt(new Date());
    }
  }, [initialUsers.length]);

  // Filter states
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "newest" | "department">("name-asc");

  // Modal edit states
  const [editTarget, setEditTarget] = useState<UserProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const loadUsers = useCallback(async (options?: { silent?: boolean }) => {
    if (options?.silent) setIsRefreshing(true);
    else setIsLoading(true);
    setLoadError("");
    try {
      const data = await getManageUsers();
      setUsers(data);
      setLastUpdatedAt(new Date());
    } catch {
      setLoadError("Unable to load user directory at this time.");
      pushToast("Failed to fetch user directory.", "error");
    } finally {
      if (options?.silent) setIsRefreshing(false);
      else setIsLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    if (initialUsers.length === 0) {
      startTransition(() => {
        void loadUsers();
      });
    }
  }, [loadUsers, initialUsers.length]);

  // Client-side filtering & sorting
  const filteredUsers = useMemo(() => {
    let list = users.filter((u) => {
      const s = search.toLowerCase().trim();
      if (!s) return true;
      return (
        (u.firstName ?? "").toLowerCase().includes(s) ||
        (u.lastName ?? "").toLowerCase().includes(s) ||
        (u.email ?? "").toLowerCase().includes(s) ||
        (u.empid ?? "").toLowerCase().includes(s) ||
        (u.department ?? "").toLowerCase().includes(s) ||
        (u.position ?? "").toLowerCase().includes(s)
      );
    });

    if (sortBy === "name-desc") {
      list = [...list].sort((a, b) =>
        `${b.firstName ?? ""} ${b.lastName ?? ""}`.localeCompare(`${a.firstName ?? ""} ${a.lastName ?? ""}`)
      );
    } else if (sortBy === "newest") {
      list = [...list].sort((a, b) =>
        (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
      );
    } else if (sortBy === "department") {
      list = [...list].sort((a, b) =>
        (a.department ?? "").localeCompare(b.department ?? "")
      );
    } else {
      list = [...list].sort((a, b) =>
        `${a.firstName ?? ""} ${a.lastName ?? ""}`.localeCompare(`${b.firstName ?? ""} ${b.lastName ?? ""}`)
      );
    }

    return list;
  }, [users, search, sortBy]);

  async function handleUpdateSubmit(values: ManageUserFormValues) {
    if (!editTarget) return;
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const updated = await updateManageUser(editTarget.empid, values);

      setUsers((prev) =>
        prev.map((u) => (u.empid === updated.empid ? updated : u))
      );

      pushToast(`Saved changes for ${updated.firstName} successfully.`, "success");
      setEditTarget(null);
    } catch {
      setSubmitError("Failed to update user. Please try again.");
      pushToast("Failed to update user console configuration.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ManagerShell title={pageTitle} description={pageSubtitle} actions={null}>
      {/* Search and Filters Bar */}
      <UserSearchFilters
        search={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        lastUpdatedAt={lastUpdatedAt}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onRefresh={() => void loadUsers({ silent: true })}
      />

      {/* Users Data Table */}
      <UserTable
        users={filteredUsers}
        isLoading={isLoading}
        loadError={loadError}
        onRetry={() => void loadUsers()}
        onEdit={setEditTarget}
      />

      {/* User edit modal */}
      {editTarget && (
        <UserFormModal
          user={editTarget}
          isSubmitting={isSubmitting}
          submitError={submitError}
          onClose={() => setEditTarget(null)}
          onSubmit={handleUpdateSubmit}
        />
      )}
    </ManagerShell>
  );
}
