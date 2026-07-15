import { Loader2 } from "lucide-react";
import { formatCode, formatDiff } from "./preview-highlight";

interface PreviewCodeViewProps {
    targetFiles: string[];
    effectiveSelectedFile: string;
    onSelectFile: (file: string) => void;
    loadingCode: boolean;
    codeError: string;
    codeContent: string;
}

/** The "Code" tab: optional file switcher + syntax-highlighted source. */
export function PreviewCodeView({
    targetFiles,
    effectiveSelectedFile,
    onSelectFile,
    loadingCode,
    codeError,
    codeContent,
}: PreviewCodeViewProps) {
    return (
        <>
            {/* File selection tab header if there are multiple targetFiles */}
            {targetFiles.length > 1 && (
                <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-1 bg-slate-50 shrink-0 overflow-x-auto select-none">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Files:</span>
                    {targetFiles.map((file) => {
                        const active = file === effectiveSelectedFile;
                        const filename = file.split("/").pop() || file;
                        return (
                            <button
                                key={file}
                                onClick={() => onSelectFile(file)}
                                className={`rounded-sm px-2 py-0.5 text-[10px] font-semibold transition-all cursor-pointer border ${
                                    active
                                        ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                                        : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                                }`}
                            >
                                {filename}
                            </button>
                        );
                    })}
                </div>
            )}

            <div className="flex-1 min-h-0 overflow-auto p-4 bg-slate-950 font-sans text-xs text-slate-300 select-text">
                {loadingCode ? (
                    <div className="flex h-full items-center justify-center gap-2 text-slate-500 animate-pulse font-sans">
                        <Loader2 className="size-4 animate-spin text-indigo-500" /> Loading file content...
                    </div>
                ) : codeError ? (
                    <div className="text-red-400 p-2 font-sans">{codeError}</div>
                ) : (
                    <div className="space-y-0.5">
                        {formatCode(codeContent, effectiveSelectedFile)}
                    </div>
                )}
            </div>
        </>
    );
}

interface PreviewDiffViewProps {
    loadingDiff: boolean;
    diffError: string;
    diffContent: string;
}

/** The "Diff" tab: colorized git diff of the task's working changes. */
export function PreviewDiffView({ loadingDiff, diffError, diffContent }: PreviewDiffViewProps) {
    return (
        <div className="flex-1 min-h-0 overflow-auto p-4 bg-slate-950 font-sans text-xs text-slate-300 select-text">
            {loadingDiff ? (
                <div className="flex h-full items-center justify-center gap-2 text-slate-500 animate-pulse font-sans">
                    <Loader2 className="size-4 animate-spin text-indigo-500" /> Loading git diff...
                </div>
            ) : diffError ? (
                <div className="text-red-400 p-2 font-sans">{diffError}</div>
            ) : !diffContent || diffContent.trim() === "" ? (
                <div className="flex h-full items-center justify-center text-slate-500 font-sans">
                    No changes detected (working directory clean)
                </div>
            ) : (
                <div className="space-y-0.5">
                    {formatDiff(diffContent)}
                </div>
            )}
        </div>
    );
}
