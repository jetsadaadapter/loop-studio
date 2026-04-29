import { ArrowRight } from "lucide-react";
import { CONTACT_LINKS } from "@/lib/legal-links";
import styles from "./styles.module.css";

// Badge Tailwind classes per day of week: 0 = Sun, 1 = Mon, … 6 = Sat
const DAY_BADGE_CLASS = [
  "border-rose-200/80 text-rose-700", // Sun
  "border-indigo-200/80 text-indigo-700", // Mon
  "border-teal-200/80 text-teal-700", // Tue
  "border-violet-200/80 text-violet-700", // Wed
  "border-orange-200/80 text-orange-700", // Thu
  "border-sky-200/80 text-sky-700", // Fri
  "border-fuchsia-200/80 text-fuchsia-700", // Sat
] as const;

export function LibraryGuidedCtaBlock() {
  const day = new Date().getDay();

  return (
    <section
      data-day={day}
      className={`${styles.section} relative left-1/2 mt-12 mb-0 w-screen -translate-x-1/2 overflow-hidden py-5 sm:py-7`}
      aria-label="Get guided app recommendations"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-2/3 bg-linear-to-b from-white via-white/95 to-transparent" />
      <div
        data-day={day}
        className={`${styles.bottomOverlay} pointer-events-none absolute inset-x-0 bottom-0 h-32 sm:h-44`}
      />
      <div
        data-day={day}
        className={`${styles.blobRight} pointer-events-none absolute -right-24 bottom-0 size-72 translate-y-1/3 rounded-full blur-2xl`}
      />
      <div
        data-day={day}
        className={`${styles.blobLeft} pointer-events-none absolute -left-24 bottom-0 h-40 w-80 translate-y-1/4 rounded-full blur-2xl`}
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 md:px-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-8">
          <div className="max-w-3xl">
            <span
              className={`inline-flex items-center rounded-full border bg-white/80 px-3 py-1 text-[11px] font-semibold tracking-[0.08em] ${DAY_BADGE_CLASS[day]}`}
            >
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

          <a
            href={CONTACT_LINKS.requestForm}
            className="inline-flex h-12 items-center justify-center gap-3 self-start rounded-2xl border border-slate-900 bg-slate-950 px-6 text-sm font-semibold text-white shadow-[0_12px_30px_-16px_rgba(15,23,42,0.55)] transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-800/40 md:self-auto"
          >
            กรอกความต้องการ
            <ArrowRight className="size-4.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
