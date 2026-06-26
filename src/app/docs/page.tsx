import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUserProfile } from "@/core/services/users.service";
import { ApiDocsClient } from "./docs-client";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "API Reference — ADT Library",
  description: "Interactive API documentation for the ADT Library integration API",
};

export default async function ApiDocsPage() {
  let profile = null;
  let isUnauthorized = false;

  try {
    profile = await getUserProfile();
  } catch {
    isUnauthorized = true;
  }

  if (isUnauthorized) {
    redirect("/login");
  }

  // Check if user has developer or admin/system-admin roles
  const hasAccess = profile?.roles?.some(
    (role) => role === "developer" || role === "admin" || role === "system-admin"
  );

  if (!hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/50 px-4 py-12 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 transition-all dark:bg-slate-900">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-brand dark:bg-red-950/30">
              <ShieldAlert className="h-8 w-8 text-[#c20019]" />
            </div>
            
            <h1 className="mt-6 text-sm font-bold tracking-tight text-slate-950 dark:text-white font-sans">
              สิทธิ์การเข้าใช้งานไม่เพียงพอ
            </h1>
            
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 font-sans">
              หน้าเอกสาร API (API Reference) จำกัดสิทธิ์เฉพาะผู้ใช้กลุ่ม Developer หรือผู้ดูแลระบบที่เกี่ยวข้องเท่านั้น
            </p>
            
            <div className="mt-8 w-full">
              <Link
                href="/apps"
                className="flex w-full items-center justify-center rounded-xl bg-[#c20019] dark:bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-[#a30015] dark:hover:bg-zinc-900 dark:border dark:border-zinc-800 transition-all"
              >
                กลับสู่หน้าหลัก
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <ApiDocsClient />;
}
