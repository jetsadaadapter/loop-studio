import type { ReactNode } from "react";
import { Workflow } from "lucide-react";

// The App Store's manage console (sidebar/breadcrumb/footer chrome, auth gate)
// was removed — Loop DevStudio is the only thing left under /manage, so this
// is just its dedicated full-bleed shell now. No auth gate: Loop Studio has
// no auth system.
export default function ManageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Workflow className="size-3.5 text-brand" />
          Loop DevStudio
        </span>
      </div>
      <main className="p-3 sm:p-5">{children}</main>
    </div>
  );
}
