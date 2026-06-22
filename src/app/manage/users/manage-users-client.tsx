"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
  startTransition,
} from "react";
import { usePathname } from "next/navigation";

import { getLocalizedText, getManageRouteMeta } from "@/app/manage/config";
import { ManagerShell } from "@/components/manager-shell";
import { useToast } from "@/components/toast-provider";
import type { UserProfile } from "@/core/interfaces/auth.interface";
import type { ManageUserFormValues } from "@/core/validators/users.validator";
import { adjustUserCredits, getManageUsers, getManageUsersResponse, updateManageUser } from "@/core/services/users.service";

import { UserSearchFilters } from "./components/user-search-filters";
import { UserTable } from "./components/user-table";
import { UserFormModal } from "./components/user-form-modal";
import { UserCreditModal } from "./components/user-credit-modal";
import { UserStats } from "./components/user-stats";
import { ManagerPagination } from "@/components/manager-pagination";

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
  const [allUsersForStats, setAllUsersForStats] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(initialUsers.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    if (initialUsers.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLastUpdatedAt(new Date());
    }
  }, [initialUsers.length]);

  const isInitialMount = useRef(true);

  // Load all users once for calculations in statistics cards
  useEffect(() => {
    getManageUsers({ page: 1, limit: 1000 })
      .then((data) => {
        setAllUsersForStats(data);
        setTotalItems((prev) => (prev === 0 ? data.length : prev));
      })
      .catch((err) => console.error("Failed to load users for statistics:", err));
  }, []);

  // Filter states
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "newest" | "department">("name-asc");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal edit states
  const [editTarget, setEditTarget] = useState<UserProfile | null>(null);
  const [creditTarget, setCreditTarget] = useState<UserProfile | null>(null);
  const [isCreditSubmitting, setIsCreditSubmitting] = useState(false);
  const [creditError, setCreditError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const loadUsers = useCallback(async (options?: { silent?: boolean }) => {
    if (options?.silent) setIsRefreshing(true);
    else setIsLoading(true);
    setLoadError("");
    try {
      const response = await getManageUsersResponse({ page: currentPage, limit: pageSize });
      setUsers(response.data ?? []);
      if (response.meta) {
        setTotalItems(response.meta.total);
      } else {
        setTotalItems((response.data ?? []).length);
      }
      setLastUpdatedAt(new Date());
    } catch {
      setLoadError("Unable to load user directory at this time.");
      pushToast("Failed to fetch user directory.", "error");
    } finally {
      if (options?.silent) setIsRefreshing(false);
      else setIsLoading(false);
    }
  }, [pushToast, currentPage, pageSize]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (initialUsers.length > 0) {
        return;
      }
    }

    startTransition(() => {
      void loadUsers();
    });
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

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  async function handleUpdateSubmit(values: ManageUserFormValues) {
    if (!editTarget) return;
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const updated = await updateManageUser(editTarget.empid, values);

      setUsers((prev) =>
        prev.map((u) => (u.empid === updated.empid ? updated : u))
      );
      setAllUsersForStats((prev) =>
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

  async function handleCreditSubmit(amount: number, description: string) {
    if (!creditTarget) return;
    setIsCreditSubmitting(true);
    setCreditError("");
    try {
      await adjustUserCredits(creditTarget.empid, amount, description);
      const label = amount > 0 ? `+${amount}` : String(amount);
      pushToast(`Credits adjusted (${label}) for ${creditTarget.firstName ?? creditTarget.email}.`, "success");
      setCreditTarget(null);
    } catch {
      setCreditError("Failed to adjust credits. Please try again.");
    } finally {
      setIsCreditSubmitting(false);
    }
  }

  return (
    <ManagerShell title={pageTitle} description={pageSubtitle} actions={null}>
      {/* User Statistics Overview */}
      {!isLoading && <UserStats users={allUsersForStats.length > 0 ? allUsersForStats : users} />}

      {/* Search and Filters Bar */}
      <UserSearchFilters
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setCurrentPage(1);
        }}
        sortBy={sortBy}
        onSortByChange={(val) => {
          setSortBy(val);
          setCurrentPage(1);
        }}
        lastUpdatedAt={lastUpdatedAt}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onRefresh={() => void loadUsers({ silent: true })}
      />

      {/* Users Data Table */}
      <div className="space-y-4">
        <UserTable
          users={filteredUsers}
          isLoading={isLoading}
          loadError={loadError}
          onRetry={() => void loadUsers()}
          onEdit={setEditTarget}
          onAdjustCredits={setCreditTarget}
        />

        {!isLoading && totalItems > 0 && (
          <ManagerPagination
            currentPage={safeCurrentPage}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={(val) => {
              setPageSize(val);
              setCurrentPage(1);
            }}
          />
        )}
      </div>

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

      {/* Credit adjustment modal */}
      {creditTarget && (
        <UserCreditModal
          user={creditTarget}
          isSubmitting={isCreditSubmitting}
          submitError={creditError}
          onSubmit={(amount, description) => void handleCreditSubmit(amount, description)}
          onClose={() => { setCreditTarget(null); setCreditError(""); }}
        />
      )}
    </ManagerShell>
  );
}
