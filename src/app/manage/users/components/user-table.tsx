import { User, Edit3, Coins, Zap } from "lucide-react";
import { ManagerActionsDropdown } from "@/components/manager-actions-dropdown";
import type { UserProfile } from "@/core/interfaces/auth.interface";
import { Button } from "@/components/ui/button";
import {
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface UserTableProps {
  users: UserProfile[];
  isLoading: boolean;
  loadError: string;
  onRetry: () => void;
  onEdit: (user: UserProfile) => void;
  onAdjustCredits?: (user: UserProfile) => void;
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  return iso.slice(0, 10);
}

function getInitials(firstName: string, lastName: string) {
  const f = firstName?.trim().charAt(0) || "";
  const l = lastName?.trim().charAt(0) || "";
  return `${f}${l}`.toUpperCase();
}

function getAvatarBgColor(empid: string) {
  // Generate a premium pastel/slate color based on empid hash
  const colors = [
    "bg-indigo-50 text-indigo-700 border-indigo-100",
    "bg-violet-50 text-violet-700 border-violet-100",
    "bg-emerald-50 text-emerald-700 border-emerald-100",
    "bg-amber-50 text-amber-700 border-amber-100",
    "bg-rose-50 text-rose-700 border-rose-100",
    "bg-sky-50 text-sky-700 border-sky-100",
  ];
  let hash = 0;
  for (let i = 0; i < empid.length; i++) {
    hash = empid.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

function getRoleBadgeStyle(role: string) {
  const r = role.toLowerCase();
  if (r === "system-admin") {
    return "bg-indigo-50/80 text-indigo-700 border-indigo-100/50 hover:bg-indigo-100/30";
  }
  if (r === "admin") {
    return "bg-rose-50/80 text-rose-700 border-rose-100/50 hover:bg-rose-100/30";
  }
  if (r === "developer") {
    return "bg-violet-50/80 text-violet-700 border-violet-100/50 hover:bg-violet-100/30";
  }
  if (r === "user" || r === "editor") {
    return "bg-amber-50/80 text-amber-700 border-amber-100/50 hover:bg-amber-100/30";
  }
  return "bg-slate-50/80 text-slate-600 border-slate-100/50 hover:bg-slate-100/30";
}

function UserTableSkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={`skeleton-user-row-${i}`} className="animate-pulse">
          {/* # */}
          <TableCell className="px-4 hidden xs:table-cell">
            <div className="h-4 w-4 bg-slate-100 rounded" />
          </TableCell>
          {/* User Profile */}
          <TableCell>
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-slate-100 shrink-0" />
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="h-3.5 w-32 bg-slate-100 rounded" />
                <div className="h-2.5 w-40 bg-slate-100 rounded" />
                {/* Mobile-only attributes skeletons */}
                <div className="flex flex-wrap gap-1.5 mt-1.5 md:hidden">
                  <div className="h-3.5 w-12 bg-slate-100 rounded-sm" />
                  <div className="h-3.5 w-24 bg-slate-100 rounded-sm" />
                  <div className="h-3.5 w-16 bg-slate-100 rounded-sm" />
                </div>
              </div>
            </div>
          </TableCell>
          {/* Department / Position */}
          <TableCell className="hidden md:table-cell">
            <div className="space-y-1.5">
              <div className="h-3.5 w-28 bg-slate-100 rounded" />
              <div className="h-2.5 w-20 bg-slate-100 rounded" />
            </div>
          </TableCell>
          {/* Security Roles */}
          <TableCell className="hidden md:table-cell">
            <div className="flex gap-1.5">
              <div className="h-5 w-16 bg-slate-100 rounded-full" />
              <div className="h-5 w-14 bg-slate-100 rounded-full" />
            </div>
          </TableCell>
          {/* Credits */}
          <TableCell className="hidden md:table-cell">
            <div className="h-4 w-12 bg-slate-100 rounded-full" />
          </TableCell>
          {/* Last Updated */}
          <TableCell className="hidden md:table-cell">
            <div className="h-3.5 w-20 bg-slate-100 rounded" />
          </TableCell>
          {/* Actions */}
          <TableCell className="px-4 text-right">
            <div className="flex justify-end pr-1">
              <div className="h-7 w-7 bg-slate-100 rounded-sm" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function UserTable({
  users,
  isLoading,
  loadError,
  onRetry,
  onEdit,
  onAdjustCredits,
}: UserTableProps) {
  return (
    <TableContainer>
      <Table className="min-w-full md:min-w-4xl">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="px-4 hidden xs:table-cell">
              #
            </TableHead>
            <TableHead>
              User Profile
            </TableHead>
            <TableHead className="hidden md:table-cell">
              Department / Position
            </TableHead>
            <TableHead className="hidden md:table-cell">
              Security Roles
            </TableHead>
            <TableHead className="hidden md:table-cell">
              Credits
            </TableHead>
            <TableHead className="hidden md:table-cell">
              Last Updated
            </TableHead>
            <TableHead className="px-4 text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <UserTableSkeletonRows />
          ) : loadError ? (
            <TableRow>
              <TableCell colSpan={7} className="p-8 text-center">
                <div className="flex flex-col items-center gap-3">
                  <p className="text-sm text-slate-500">{loadError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetry}
                    className="h-8 border-slate-200 cursor-pointer"
                  >
                    Retry
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-16 text-center select-none">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-slate-400">
                    <User className="size-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-800">
                      No users found
                    </p>
                    <p className="text-xs text-slate-500">
                      No registered user accounts match your active search terms.
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            users.map((user, index) => (
              <TableRow
                key={user.empid}
              >
                {/* # */}
                <TableCell className="px-4 align-middle whitespace-nowrap text-xs font-semibold text-slate-400 hidden xs:table-cell">
                  {index + 1}
                </TableCell>

                {/* Profile Card */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold shadow-3xs ${getAvatarBgColor(user.empid)}`}>
                      {getInitials(user.firstName, user.lastName)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-semibold text-slate-800 tracking-tight block leading-tight">
                        {user.firstName} {user.lastName}
                      </span>
                      <span className="text-[10px] font-sans text-slate-400 block mt-0.5 leading-none">
                        {user.email}
                      </span>
                      <span className="text-[9px] font-sans text-slate-300 block mt-0.5 leading-none">
                        #{user.empid.slice(0, 8)}
                      </span>
                      {/* Mobile-only inline attributes */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5 md:hidden">
                        {(user.department || user.position) && (
                          <span className="inline-flex items-center rounded-sm bg-slate-50 px-1.5 py-0.5 text-[8px] font-bold text-slate-600 border border-slate-200">
                            {[user.department, user.position].filter(Boolean).join(" / ")}
                          </span>
                        )}
                        {user.roles && user.roles.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {user.roles.map((role) => (
                              <span
                                key={role}
                                className={`inline-flex items-center rounded-full border px-1.5 py-0.2 text-[7px] font-bold uppercase tracking-wider ${getRoleBadgeStyle(role)}`}
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        )}
                        {user.credits !== undefined && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 border border-amber-200/70 px-1.5 py-0.5 text-[8px] font-bold text-amber-700">
                            <Coins className="size-2.5 shrink-0" />
                            {user.credits.toLocaleString()}
                          </span>
                        )}
                        <span className="text-[9px] text-slate-400 font-sans ml-auto">
                          Updated: {formatDate(user.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* Dept / Pos */}
                <TableCell className="hidden md:table-cell">
                  <span className="text-xs font-semibold text-slate-700 block leading-tight">
                    {user.department}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 leading-none">
                    {user.position}
                  </span>
                </TableCell>

                {/* Roles */}
                <TableCell className="hidden md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {user.roles && user.roles.length > 0 ? (
                      user.roles.map((role) => (
                        <span
                          key={role}
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-colors shadow-2xs ${getRoleBadgeStyle(role)}`}
                        >
                          {role}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic">No Roles</span>
                    )}
                  </div>
                </TableCell>

                {/* Credits */}
                <TableCell className="whitespace-nowrap hidden md:table-cell">
                  {user.credits !== undefined ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/70 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                      <Zap className="size-2.5 shrink-0" />
                      {user.credits.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs">—</span>
                  )}
                </TableCell>

                {/* Updated */}
                <TableCell className="whitespace-nowrap text-xs text-slate-500 hidden md:table-cell">
                  {formatDate(user.updatedAt)}
                </TableCell>

                {/* Actions */}
                <TableCell className="px-4 whitespace-nowrap text-right">
                  <div className="flex justify-end">
                    <ManagerActionsDropdown
                      triggerClassName="flex size-7 items-center justify-center rounded-sm text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer border-0 shadow-none bg-transparent p-0"
                      actions={[
                        {
                          label: "Edit User",
                          icon: Edit3,
                          onClick: () => onEdit(user),
                        },
                        ...(onAdjustCredits ? [{
                          label: "Adjust Credits",
                          icon: Coins,
                          onClick: () => onAdjustCredits(user),
                        }] : []),
                      ]}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Footer count */}
      {!isLoading && users.length > 0 && (
        <div className="border-t border-slate-100 px-4 py-2.5">
          <span className="text-[11px] text-slate-400">
            Showing {users.length} {users.length === 1 ? "user" : "users"}
          </span>
        </div>
      )}
    </TableContainer>
  );
}
