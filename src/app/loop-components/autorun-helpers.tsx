import React from "react";
import { FileText, FileJson, FileCode } from "lucide-react";
import type { BadgeVariant } from "@/components/ui/badge";

export const TIER_VARIANTS: Record<string, BadgeVariant> = {
    RED: "error",
    ORANGE: "orange",
    YELLOW: "warning",
    GREEN: "success",
};

export function apiKeyHeader(): Record<string, string> {
    const key = typeof window !== "undefined" ? localStorage.getItem("loop_anthropic_api_key") : null;
    return key ? { "X-Anthropic-API-Key": key } : {};
}

export function getFileIcon(filePath: string, className = "size-3.5") {
    const ext = filePath.split(".").pop()?.toLowerCase();
    const cn = `${className} shrink-0`;
    if (ext === "json") return <FileJson className={`${cn} text-amber-500`} />;
    if (ext === "md" || ext === "mdx") return <FileText className={`${cn} text-blue-500`} />;
    if (["ts", "tsx", "js", "jsx", "mjs", "cjs"].includes(ext || "")) {
        return <FileCode className={`${cn} text-emerald-500`} />;
    }
    return <FileText className={`${cn} text-slate-400`} />;
}

export function renderSuggestionItem(pathStr: string) {
    const parts = pathStr.split("/");
    const fileName = parts.pop() || "";
    const dirPath = parts.join("/");
    return (
        <div className="flex items-center gap-2 w-full min-w-0 text-xs">
            {getFileIcon(pathStr, "size-3.5")}
            <span className="font-medium text-slate-800 truncate shrink-0">{fileName}</span>
            {dirPath && (
                <span className="text-[11px] text-slate-400 truncate font-normal">
                    {dirPath}
                </span>
            )}
        </div>
    );
}
