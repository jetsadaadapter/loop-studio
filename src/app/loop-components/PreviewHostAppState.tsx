import { MonitorOff } from "lucide-react";

// Shown in the Preview tab for the host app (Loop Studio itself). Its previewUrl
// is this server's own port, so a live iframe would render the app inside itself
// (recursive) and collide with the running dev server. The live App/API preview
// is therefore disabled — the same reasoning that disables build/dev for the host
// — while the Code and Diff tabs stay fully usable for reviewing task changes.
export function PreviewHostAppState() {
    return (
        <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-4 bg-slate-50 px-6 py-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 border border-slate-200">
                <MonitorOff className="size-5.5 text-slate-400" />
            </div>
            <div className="space-y-1 max-w-sm">
                <h3 className="text-sm font-semibold text-slate-800 font-sans">Live preview is off for the host app</h3>
                <p className="text-xs text-slate-500 font-sans leading-relaxed">
                    This project is Loop Studio itself — the app you&apos;re using right now. Previewing it
                    here would embed the app inside its own window and reuse the port it already runs on.
                    Use the <span className="font-semibold text-slate-700">Code</span> and{" "}
                    <span className="font-semibold text-slate-700">Diff</span> tabs to review this task&apos;s
                    changes instead.
                </p>
            </div>
        </div>
    );
}
