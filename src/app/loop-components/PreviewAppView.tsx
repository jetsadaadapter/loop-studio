import { Monitor, RotateCw, ExternalLink, ArrowRight, Server, Square } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PreviewOfflineState } from "./PreviewOfflineState";
import { PreviewHostAppState } from "./PreviewHostAppState";
import { ApiConsole } from "./ApiConsole";

interface PreviewAppViewProps {
    url: string;
    inputUrl: string;
    onInputUrlChange: (value: string) => void;
    onLoadUrl: (e: React.FormEvent) => void;
    onReload: () => void;
    onRetry: () => Promise<void>;
    onStopServer: () => void;
    reloadKey: number;
    reachable: boolean | null;
    apiCapable: boolean;
    previewKind: "app" | "api";
    bodyKind: "app" | "api";
    onSelectApp: () => void;
    onSelectApi: () => void;
    deviceMode: "desktop" | "mobile";
    projectId: string;
    // The host app is Loop Studio itself, served on this very port. Rendering its
    // live preview would embed the app inside its own iframe (recursive) and point
    // at the port the server is already using — so the App/API preview is disabled
    // for it, mirroring how build/dev are. Code and Diff tabs still work.
    isHost?: boolean;
}

/** The "Preview" tab: URL bar, App/API toggle, and the iframe / API console body. */
export function PreviewAppView({
    url,
    inputUrl,
    onInputUrlChange,
    onLoadUrl,
    onReload,
    onRetry,
    onStopServer,
    reloadKey,
    reachable,
    apiCapable,
    previewKind,
    bodyKind,
    onSelectApp,
    onSelectApi,
    deviceMode,
    projectId,
    isHost = false,
}: PreviewAppViewProps) {
    if (isHost) {
        return <PreviewHostAppState />;
    }

    const body = bodyKind === "api" ? null : reachable === false ? (
        <PreviewOfflineState url={url} projectId={projectId} onRetry={onRetry} />
    ) : (
        <iframe
            key={reloadKey}
            src={url}
            title="Live app preview"
            className="size-full border-0 bg-white"
        />
    );

    return (
        <>
            {/* URL bar */}
            <form onSubmit={onLoadUrl} className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 shrink-0">
                <Input
                    type="text"
                    value={inputUrl}
                    onChange={(e) => onInputUrlChange(e.target.value)}
                    placeholder="/ or http://localhost:3001"
                    className="h-7 flex-1 border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder:text-slate-400 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30"
                    spellCheck={false}
                />
                <button
                    type="submit"
                    aria-label="Load URL"
                    title="Load URL"
                    className="flex size-7 items-center justify-center rounded-sm border border-slate-200 text-slate-500 bg-white transition-colors hover:bg-slate-50 hover:text-slate-800 cursor-pointer"
                >
                    <ArrowRight className="size-3.5" />
                </button>
                <button
                    type="button"
                    onClick={onReload}
                    aria-label="Reload preview"
                    title="Reload preview"
                    className="flex size-7 items-center justify-center rounded-sm border border-slate-200 text-slate-500 bg-white transition-colors hover:bg-slate-50 hover:text-slate-800 cursor-pointer"
                >
                    <RotateCw className="size-3.5" />
                </button>
                {reachable === true && (
                    <button
                        type="button"
                        onClick={onStopServer}
                        aria-label="Stop dev server"
                        title="Stop dev server"
                        className="flex size-7 items-center justify-center rounded-sm border border-slate-200 text-slate-500 bg-white transition-colors hover:bg-red-50 hover:text-red-650 hover:border-red-200 cursor-pointer"
                    >
                        <Square className="size-3 fill-current" />
                    </button>
                )}
                <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Open in new tab"
                    title="Open in new tab"
                    className="flex size-7 items-center justify-center rounded-sm border border-slate-200 text-slate-500 bg-white transition-colors hover:bg-slate-50 hover:text-slate-800"
                >
                    <ExternalLink className="size-3.5" />
                </a>
                {/* App (live iframe) vs API (request console). Shown only for
                    API-capable projects; a pure frontend just gets the preview. */}
                {apiCapable && (
                    <div className="ml-1 flex shrink-0 items-center gap-0.5 rounded-md border border-slate-200 bg-slate-100 p-0.5">
                        <button
                            type="button"
                            onClick={onSelectApp}
                            aria-pressed={previewKind === "app"}
                            title="Live app preview"
                            className={`flex items-center gap-1 rounded-sm px-2 py-0.5 text-[11px] font-semibold font-sans transition-colors cursor-pointer ${previewKind === "app" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            <Monitor className="size-3.5" /> App
                        </button>
                        <button
                            type="button"
                            onClick={onSelectApi}
                            aria-pressed={previewKind === "api"}
                            title="API request console"
                            className={`flex items-center gap-1 rounded-sm px-2 py-0.5 text-[11px] font-semibold font-sans transition-colors cursor-pointer ${previewKind === "api" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            <Server className="size-3.5" /> API
                        </button>
                    </div>
                )}
            </form>

            {/* API console (backend) or live app iframe (frontend), full bleed */}
            {bodyKind === "api" ? (
                <div className="relative flex flex-1 min-h-0 flex-col overflow-hidden">
                    <ApiConsole baseUrl={url} projectId={projectId} />
                </div>
            ) : deviceMode === "mobile" ? (
                <div className="relative flex-1 min-h-0 bg-slate-200 flex items-center justify-center overflow-hidden">
                    <div className="w-[375px] h-[95%] border-[12px] border-slate-800 rounded-[32px] overflow-hidden shadow-2xl flex flex-col">
                        {body}
                    </div>
                </div>
            ) : (
                <div className="relative flex-1 min-h-0 overflow-hidden flex flex-col">
                    {body}
                </div>
            )}
        </>
    );
}
