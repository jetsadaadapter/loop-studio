import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function LibraryGuidedCtaBlock() {
  return (
    <section
      className="relative left-1/2 mt-12 mb-0 w-screen -translate-x-1/2 overflow-hidden bg-linear-to-b from-white via-slate-50/40 to-[#c2c6ff] py-5 shadow-[0_18px_48px_-32px_rgba(99,102,241,0.32)] sm:py-7"
      aria-label="Get guided app recommendations"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-2/3 bg-linear-to-b from-white via-white/95 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-[#9ea6ff]/75 via-[#c8ccff]/50 to-transparent sm:h-44" />
      <div className="pointer-events-none absolute -right-24 bottom-0 size-72 translate-y-1/3 rounded-full bg-radial from-[#9fa8ff]/45 to-transparent blur-2xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-40 w-80 translate-y-1/4 rounded-full bg-radial from-[#d8dbff]/80 to-transparent blur-2xl" />

      <div className="relative mx-auto w-full max-w-7xl px-4 md:px-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center rounded-full border border-indigo-200/80 bg-white/80 px-3 py-1 text-[11px] font-semibold tracking-[0.08em] text-indigo-700">
              เก็บความต้องการใช้งาน
            </span>

            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2.15rem] sm:leading-tight">
              แจ้งความต้องการ MCP, Platform หรือ Tool ใหม่
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-700/90 sm:text-base md:text-lg">
              หากทีมของคุณต้องการเครื่องมือเพิ่ม สามารถกรอก requirement
              เพื่อให้เราประเมินและนำเข้าระบบให้เหมาะกับ workflow ได้เร็วขึ้น
              และตรงความต้องการมากขึ้น
            </p>
          </div>

          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center gap-3 self-start rounded-2xl border border-slate-900 bg-slate-950 px-6 text-sm font-semibold text-white shadow-[0_12px_30px_-16px_rgba(15,23,42,0.55)] transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-800/40 md:self-auto"
          >
            กรอกความต้องการ
            <ArrowRight className="size-4.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
