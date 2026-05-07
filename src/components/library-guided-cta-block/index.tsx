import { ArrowUpRight } from "lucide-react";
import { CONTACT_LINKS } from "@/lib/legal-links";

export function LibraryGuidedCtaBlock() {
  return (
    <section
      className="relative left-1/2 mt-12 mb-0 w-screen -translate-x-1/2 bg-[linear-gradient(90deg,#cdeffb_0%,#e7f7fd_14%,#ffffff_34%,#ffffff_62%,#ffefd2_84%,#fdcf8d_100%)] py-16 backdrop-blur-[200px] md:py-28"
      aria-label="Get guided app recommendations"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.72)_42%,rgba(255,255,255,0)_100%)]" />
      <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <div className="flex flex-col items-center gap-3">
            {/* <span className="inline-flex items-center rounded-full border border-amber-300/70 bg-white/75 px-4 py-1.5 text-[11px] font-semibold tracking-[0.08em] text-amber-700 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.45)]">
              เก็บความต้องการใช้งาน
            </span> */}

            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl md:leading-[1.1]">
              แจ้งความต้องการ
              <span className="mt-1 block text-[0.92em] font-medium text-slate-900 md:text-[0.88em]">
                MCP, Platform หรือ Tool ใหม่
              </span>
            </h2>

            <p className="max-w-2xl text-sm leading-relaxed text-slate-700 md:text-base">
              หากทีมของคุณต้องการเครื่องมือเพิ่ม สามารถกรอก requirement
              เพื่อให้เราประเมินและนำเข้าระบบให้เหมาะกับ workflow ได้เร็วขึ้น
              และตรงความต้องการมากขึ้น
            </p>
          </div>

          <a
            href={CONTACT_LINKS.requestForm}
            className="group relative inline-flex h-12 w-fit items-center justify-center overflow-hidden rounded-full bg-slate-950 p-1 ps-6 pe-14 text-sm font-medium text-white transition-all duration-500 hover:bg-slate-950 hover:ps-14 hover:pe-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
          >
            <span className="relative z-10 transition-all duration-500">
              กรอกความต้องการ
            </span>
            <span className="absolute right-1 top-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-950 transition-all duration-500 group-hover:right-[calc(100%-44px)] group-hover:rotate-45">
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
