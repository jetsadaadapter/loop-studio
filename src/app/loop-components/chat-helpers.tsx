import React from "react";
import { FileJson, FileText, FileCode } from "lucide-react";
import type { ChatAttachment } from "@/core/interfaces/loop-projects.interface";

// Slash-command actions offered by the composer's "/" autocomplete.
export const CHAT_ACTIONS = [
    { name: "/collaborate", desc: "Delegate to AI Agent Team" },
    { name: "/clear", desc: "Clear input box" },
];

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

export function generateUniqueId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function readFileAsAttachment(file: File): Promise<ChatAttachment> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({
            id: generateUniqueId("att"),
            name: file.name,
            mimeType: file.type || "application/octet-stream",
            dataUrl: reader.result as string,
        });
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}
