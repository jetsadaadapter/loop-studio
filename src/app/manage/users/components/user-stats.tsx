"use client";

import { useMemo } from "react";
import { Code2, Users, ShieldCheck, ShieldAlert, UserCheck } from "lucide-react";
import type { UserProfile } from "@/core/interfaces/auth.interface";

interface UserStatsProps {
  users: UserProfile[];
}

export function UserStats({ users }: UserStatsProps) {
  const stats = useMemo(() => {
    const total = users.length;
    const systemAdmins = users.filter((u) => u.roles?.includes("system-admin")).length;
    const admins = users.filter((u) => u.roles?.includes("admin")).length;
    const developers = users.filter((u) => u.roles?.includes("developer")).length;
    const generalUsers = users.filter((u) => u.roles?.includes("user")).length;
    return { total, systemAdmins, admins, developers, generalUsers };
  }, [users]);

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-5 mb-6 select-none animate-in fade-in duration-300">
      {/* Total Users */}
      <div className="flex flex-col items-center justify-center p-5 rounded-2xl border border-emerald-500/10 bg-gradient-to-br from-emerald-500/[0.02] via-emerald-500/[0.04] to-emerald-500/[0.08] shadow-3xs shadow-emerald-500/2 hover:shadow-2xs transition-all">
        <div className="flex items-center gap-2 mb-2 text-emerald-600">
          <Users className="size-4 text-emerald-500" />
          <span className="text-xs font-semibold tracking-tight">Total Users</span>
        </div>
        <span className="text-3xl font-bold tracking-tight text-slate-800">
          {stats.total}
        </span>
      </div>

      {/* System Admins */}
      <div className="flex flex-col items-center justify-center p-5 rounded-2xl border border-indigo-500/10 bg-gradient-to-br from-indigo-500/[0.02] via-indigo-500/[0.04] to-indigo-500/[0.08] shadow-3xs shadow-indigo-500/2 hover:shadow-2xs transition-all">
        <div className="flex items-center gap-2 mb-2 text-indigo-600">
          <ShieldCheck className="size-4 text-indigo-500" />
          <span className="text-xs font-semibold tracking-tight">System Admins</span>
        </div>
        <span className="text-3xl font-bold tracking-tight text-slate-800">
          {stats.systemAdmins}
        </span>
      </div>

      {/* Admins */}
      <div className="flex flex-col items-center justify-center p-5 rounded-2xl border border-rose-500/10 bg-gradient-to-br from-rose-500/[0.02] via-rose-500/[0.04] to-rose-500/[0.08] shadow-3xs shadow-rose-500/2 hover:shadow-2xs transition-all">
        <div className="flex items-center gap-2 mb-2 text-rose-600">
          <ShieldAlert className="size-4 text-rose-500" />
          <span className="text-xs font-semibold tracking-tight">Administrators</span>
        </div>
        <span className="text-3xl font-bold tracking-tight text-slate-800">
          {stats.admins}
        </span>
      </div>

      {/* Developers */}
      <div className="flex flex-col items-center justify-center p-5 rounded-2xl border border-violet-500/10 bg-gradient-to-br from-violet-500/[0.02] via-violet-500/[0.04] to-violet-500/[0.08] shadow-3xs shadow-violet-500/2 hover:shadow-2xs transition-all">
        <div className="flex items-center gap-2 mb-2 text-violet-600">
          <Code2 className="size-4 text-violet-500" />
          <span className="text-xs font-semibold tracking-tight">Developers</span>
        </div>
        <span className="text-3xl font-bold tracking-tight text-slate-800">
          {stats.developers}
        </span>
      </div>

      {/* Console Users */}
      <div className="flex flex-col items-center justify-center p-5 rounded-2xl border border-amber-500/10 bg-gradient-to-br from-amber-500/[0.02] via-amber-500/[0.04] to-amber-500/[0.08] shadow-3xs shadow-amber-500/2 hover:shadow-2xs transition-all">
        <div className="flex items-center gap-2 mb-2 text-amber-600">
          <UserCheck className="size-4 text-amber-500" />
          <span className="text-xs font-semibold tracking-tight">Console Users</span>
        </div>
        <span className="text-3xl font-bold tracking-tight text-slate-800">
          {stats.generalUsers}
        </span>
      </div>
    </div>
  );
}
