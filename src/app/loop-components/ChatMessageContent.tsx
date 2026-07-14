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

// Some models wrap their Markdown answer in structural HTML (e.g.
// `<div style="font-family: system-ui, …">…</div>`). Without rehype-raw those tags
// render as literal text in the bubble. Strip layout-only wrapper tags so the
// Markdown inside renders as a clean preview — but never touch fenced or inline
// code, where the assistant may be legitimately showing HTML as an example.
const HTML_WRAPPER_RE = /<\/?(?:div|span|section|article|main|header|footer|aside|figure|figcaption|center|font|p|body|html)(?:\s[^>]*)?>/gi;
const HTML_BR_RE = /<br\s*\/?>/gi;
const CODE_SPLIT_RE = /(```[\s\S]*?```|`[^`\n]*`)/g;

export function stripHtmlWrappers(text: string): string {
    return text
        .split(CODE_SPLIT_RE)
        .map((chunk, i) => (i % 2 === 1 ? chunk : chunk.replace(HTML_BR_RE, "\n").replace(HTML_WRAPPER_RE, "")))
        .join("")
        .replace(/\n{3,}/g, "\n\n");
}

// Readable chat typography with a clear hierarchy: headings step down in size,
// h2 gets a divider for section separation, h3 uses the indigo accent, lists get
// visible markers, and body copy has comfortable spacing.
const PROSE_CLASS = [
    "prose prose-sm max-w-none break-words text-xs leading-relaxed text-slate-700 font-sans",
    "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
    "prose-headings:font-semibold prose-headings:text-slate-900 prose-headings:leading-snug",
    "prose-h1:text-sm prose-h1:font-bold prose-h1:mt-3 prose-h1:mb-1.5",
    "prose-h2:text-sm prose-h2:mt-3.5 prose-h2:mb-2 prose-h2:pb-1.5 prose-h2:border-b prose-h2:border-slate-200/70",
    "prose-h3:text-xs prose-h3:text-indigo-700 prose-h3:mt-3 prose-h3:mb-1.5",
    "prose-h4:text-xs prose-h4:font-semibold prose-h4:text-slate-500 prose-h4:mt-2.5 prose-h4:mb-1.5",
    "prose-p:my-1.5 prose-p:text-slate-700 prose-p:leading-relaxed",
    "prose-strong:font-semibold prose-strong:text-slate-900",
    "prose-ul:my-1.5 prose-ul:pl-4 prose-ol:my-1.5 prose-ol:pl-4 prose-li:my-0.5 prose-li:marker:text-indigo-400",
    "prose-hr:my-4 prose-hr:border-slate-200",
    "prose-blockquote:border-l-2 prose-blockquote:border-indigo-300 prose-blockquote:pl-3 prose-blockquote:not-italic prose-blockquote:text-slate-500 prose-blockquote:my-2",
    "prose-code:before:content-none prose-code:after:content-none",
    "prose-pre:my-3 prose-a:text-indigo-650 prose-a:font-medium",
].join(" ");

// Markdown component overrides — font-mono is used only for code (allowed per DESIGN.md).
const MD_COMPONENTS = {
    pre: ({ children }: { children?: React.ReactNode }) => (
        <pre className="max-w-full overflow-x-auto rounded-lg bg-slate-900 p-3.5 text-2xs leading-relaxed text-slate-100 font-sans shadow-xs my-3">{children}</pre>
    ),
    code: ({ className, children }: { className?: string; children?: React.ReactNode }) => {
        const isBlock = (className || "").includes("language-") || String(children).includes("\n");
        return isBlock ? (
            <code>{children}</code>
        ) : (
            <code className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-2xs text-slate-800 mx-0.5 font-medium">{children}</code>
        );
    },
    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
        <a href={href} target="_blank" rel="noreferrer" className="text-blue-600 underline hover:text-blue-700">{children}</a>
    ),
    hr: () => (
        <hr className="my-4 border-t border-slate-200" />
    ),
};

function FileEditBlock({ path, code }: { path: string; code: string }) {
    return (
        <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-900 max-w-full shadow-xs my-3">
            <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-800 px-3.5 py-2 min-w-0">
                <FileCode className="size-3.5 shrink-0 text-indigo-300" />
                <span className="truncate text-xs font-semibold text-slate-200 font-sans min-w-0">{path}</span>
            </div>
            <pre className="overflow-x-auto p-3.5 text-2xs leading-relaxed text-slate-100 font-sans whitespace-pre max-w-full">{code}</pre>
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
                const text = stripHtmlWrappers(seg.text).trim();
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
