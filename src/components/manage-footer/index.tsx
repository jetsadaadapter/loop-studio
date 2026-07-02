import Link from "next/link";

export function ManageFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-100 bg-white px-6 py-5">
      <div className="mx-auto flex max-w-(--breakpoint-2xl) flex-col items-center justify-between gap-4 md:flex-row">
        <p className="text-[11px] text-slate-400">
          © {currentYear} Adapter Digital Group. All rights reserved.
        </p>

        <div className="flex items-center gap-6 text-[11px] font-medium text-slate-400">
          <Link href="/" className="flex items-center gap-2 transition-colors hover:text-brand">
            <span className="size-2 rounded-full bg-brand" aria-hidden="true" />
            Library Home
          </Link>
          <div className="h-3 w-px bg-slate-200" aria-hidden="true" />
          <span className="font-bold uppercase tracking-wider text-slate-300">
            v1.0.2
          </span>
        </div>
      </div>
    </footer>
  );
}
