"use client";

import React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileCode } from "lucide-react";

// Renders an assistant message: prose is rendered as Markdown (headings, bold,
// lists, tables, code), and <file_edit path="...">...</file_edit> blocks become
// labelled code blocks. User/system messages render as plain preserved text.
const FILE_EDIT_RE = /<file_edit\s+path=["']([^"']+)["']\s*>([\s\S]*?)<\/file_edit>/g;

type Tone = "assistant" | "user" | "system";

type Segment =
    | { type: "text"; text: string }
    | { type: "file"; path: string; code: string };

function parseSegments(content: string): Segment[] {
    const segments: Segment[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    FILE_EDIT_RE.lastIndex = 0;
    while ((match = FILE_EDIT_RE.exec(content)) !== null) {
        if (match.index > lastIndex) {
            segments.push({ type: "text", text: content.slice(lastIndex, match.index) });
        }
        segments.push({ type: "file", path: match[1], code: match[2].replace(/^\n+|\s+$/g, "") });
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) {
        segments.push({ type: "text", text: content.slice(lastIndex) });
    }
    return segments.length > 0 ? segments : [{ type: "text", text: content }];
}

export function messageHasCode(content: string): boolean {
    return content.includes("<file_edit");
}

// Readable chat typography with a clear hierarchy: headings step down in size,
// h2 gets a divider for section separation, h3 uses the indigo accent, lists get
// visible markers, and body copy has comfortable spacing.
const PROSE_CLASS = [
    "prose prose-sm max-w-none break-words text-xs leading-relaxed text-slate-700",
    "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
    "prose-headings:font-semibold prose-headings:text-slate-900 prose-headings:leading-snug",
    "prose-h1:text-sm prose-h1:font-bold prose-h1:mt-3 prose-h1:mb-1.5",
    "prose-h2:text-sm prose-h2:mt-3 prose-h2:mb-2 prose-h2:pb-1 prose-h2:border-b prose-h2:border-slate-200/70",
    "prose-h3:text-xs prose-h3:text-indigo-700 prose-h3:mt-3 prose-h3:mb-1",
    "prose-h4:text-xs prose-h4:font-semibold prose-h4:text-slate-500 prose-h4:mt-2.5 prose-h4:mb-1",
    "prose-p:my-1.5 prose-p:text-slate-700",
    "prose-strong:font-semibold prose-strong:text-slate-900",
    "prose-ul:my-2 prose-ul:pl-1 prose-ol:my-2 prose-ol:pl-1 prose-li:my-1 prose-li:marker:text-indigo-400",
    "prose-hr:my-3 prose-hr:border-slate-200",
    "prose-blockquote:border-l-2 prose-blockquote:border-indigo-300 prose-blockquote:pl-3 prose-blockquote:not-italic prose-blockquote:text-slate-500 prose-blockquote:my-2",
    "prose-code:before:content-none prose-code:after:content-none",
    "prose-pre:my-2 prose-a:text-indigo-600 prose-a:font-medium",
].join(" ");

// Markdown component overrides — font-mono is used only for code (allowed per DESIGN.md).
const MD_COMPONENTS = {
    pre: ({ children }: { children?: React.ReactNode }) => (
        <pre className="max-w-full overflow-x-auto rounded-lg bg-slate-900 p-2.5 text-2xs leading-relaxed text-slate-100">{children}</pre>
    ),
    code: ({ className, children }: { className?: string; children?: React.ReactNode }) => {
        const isBlock = (className || "").includes("language-") || String(children).includes("\n");
        return isBlock ? (
            <code className="font-mono">{children}</code>
        ) : (
            <code className="rounded bg-slate-200/70 px-1 py-0.5 text-2xs font-mono text-slate-800">{children}</code>
        );
    },
    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
        <a href={href} target="_blank" rel="noreferrer" className="text-blue-600 underline hover:text-blue-700">{children}</a>
    ),
};

function FileEditBlock({ path, code }: { path: string; code: string }) {
    return (
        <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-900 max-w-full">
            <div className="flex items-center gap-1.5 border-b border-slate-700 bg-slate-800 px-2.5 py-1.5 min-w-0">
                <FileCode className="size-3 shrink-0 text-indigo-300" />
                <span className="truncate text-xs font-semibold text-slate-200 font-sans min-w-0">{path}</span>
            </div>
            <pre className="overflow-x-auto p-2.5 text-2xs leading-relaxed text-slate-100 font-mono whitespace-pre max-w-full">{code}</pre>
        </div>
    );
}

export function ChatMessageContent({ content, tone = "assistant" }: { content: string; tone?: Tone }) {
    // User/system messages are short and literal — render as plain preserved text.
    if (tone !== "assistant") {
        return <p className="whitespace-pre-wrap break-words">{content}</p>;
    }

    const segments = parseSegments(content);
    return (
        <div className="space-y-1.5 min-w-0 overflow-hidden">
            {segments.map((seg, i) => {
                if (seg.type === "file") return <FileEditBlock key={i} path={seg.path} code={seg.code} />;
                const text = seg.text.trim();
                if (!text) return null;
                return (
                    <div key={i} className={PROSE_CLASS}>
                        <Markdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>{text}</Markdown>
                    </div>
                );
            })}
        </div>
    );
}
