import React from "react";

// Token-based syntax highlighter for TS/TSX/JS/CSS lines. Pure — returns nodes.
export function highlightLine(lineText: string, fileExt: string): React.ReactNode {
    if (!lineText) return <br />;

    // For CSS files
    if (fileExt === "css") {
        // Selector / property / value
        const cssLine = lineText
            .replace(/([a-z-]+)\s*:/g, '<span class="css-prop">$1</span>:')
            .replace(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|[0-9.]+(?:px|em|rem|%|vh|vw|s))/g, '<span class="css-val">$1</span>');
        return <span dangerouslySetInnerHTML={{ __html: cssLine }} />;
    }

    // Token types and their Tailwind text colours
    type Token = { text: string; color: string };
    const tokens: Token[] = [];

    const TS_KEYWORDS = /^(import|export|from|default|const|let|var|function|return|if|else|for|while|switch|case|break|continue|class|extends|implements|interface|type|enum|async|await|try|catch|finally|throw|new|typeof|instanceof|void|null|undefined|true|false|in|of|as|declare|abstract|static|readonly|public|private|protected|override|super|this|keyof|infer|never|any|unknown|string|number|boolean|object|symbol|bigint|React|useState|useEffect|useRef|useCallback|useMemo|useContext)\b/;

    let remaining = lineText;
    while (remaining.length > 0) {
        // Single-line comment
        if (remaining.startsWith("//")) {
            tokens.push({ text: remaining, color: "#6b7280" }); // slate-500
            break;
        }
        // Template literal
        if (remaining.startsWith("`")) {
            const end = remaining.indexOf("`", 1);
            const chunk = end === -1 ? remaining : remaining.slice(0, end + 1);
            tokens.push({ text: chunk, color: "#fb923c" }); // orange-400
            remaining = end === -1 ? "" : remaining.slice(end + 1);
            continue;
        }
        // Double-quoted string
        if (remaining.startsWith('"')) {
            const match = remaining.match(/^"(?:[^"\\]|\\.)*"/);
            const chunk = match ? match[0] : remaining;
            tokens.push({ text: chunk, color: "#4ade80" }); // green-400
            remaining = remaining.slice(chunk.length);
            continue;
        }
        // Single-quoted string
        if (remaining.startsWith("'")) {
            const match = remaining.match(/^'(?:[^'\\]|\\.)*'/);
            const chunk = match ? match[0] : remaining;
            tokens.push({ text: chunk, color: "#4ade80" }); // green-400
            remaining = remaining.slice(chunk.length);
            continue;
        }
        // JSX tag name (e.g. <Component or </Component)
        const jsxTagMatch = remaining.match(/^(<\/?[A-Z][A-Za-z0-9]*)/);
        if (jsxTagMatch) {
            tokens.push({ text: jsxTagMatch[0], color: "#60a5fa" }); // blue-400
            remaining = remaining.slice(jsxTagMatch[0].length);
            continue;
        }
        // lowercase html tag
        const htmlTagMatch = remaining.match(/^(<\/?[a-z][a-z0-9-]*)/);
        if (htmlTagMatch) {
            tokens.push({ text: htmlTagMatch[0], color: "#94a3b8" }); // slate-400
            remaining = remaining.slice(htmlTagMatch[0].length);
            continue;
        }
        // Numbers
        const numMatch = remaining.match(/^\b\d+(\.\d+)?\b/);
        if (numMatch) {
            tokens.push({ text: numMatch[0], color: "#f472b6" }); // pink-400
            remaining = remaining.slice(numMatch[0].length);
            continue;
        }
        // Keywords
        const kwMatch = remaining.match(TS_KEYWORDS);
        if (kwMatch) {
            tokens.push({ text: kwMatch[0], color: "#c084fc" }); // purple-400
            remaining = remaining.slice(kwMatch[0].length);
            continue;
        }
        // JSX attribute
        const attrMatch = remaining.match(/^([a-zA-Z_][a-zA-Z0-9_-]*)(?==)/);
        if (attrMatch) {
            tokens.push({ text: attrMatch[0], color: "#7dd3fc" }); // sky-300
            remaining = remaining.slice(attrMatch[0].length);
            continue;
        }
        // Identifiers / punctuation
        const identMatch = remaining.match(/^[A-Za-z_$][A-Za-z0-9_$]*/);
        if (identMatch) {
            tokens.push({ text: identMatch[0], color: "#e2e8f0" }); // slate-200
            remaining = remaining.slice(identMatch[0].length);
            continue;
        }
        // Operators / brackets
        const opMatch = remaining.match(/^[=><!&|+\-*/%?:;,.()\[\]{}<]/);
        if (opMatch) {
            tokens.push({ text: opMatch[0], color: "#94a3b8" }); // slate-400
            remaining = remaining.slice(1);
            continue;
        }
        // Fallback: single char
        tokens.push({ text: remaining[0], color: "#e2e8f0" });
        remaining = remaining.slice(1);
    }

    return (
        <>
            {tokens.map((tok, i) => (
                <span key={i} style={{ color: tok.color }}>{tok.text}</span>
            ))}
        </>
    );
}

// Code with non-selectable line numbers + syntax highlighting.
export function formatCode(codeText: string, fileName: string) {
    if (!codeText) return null;
    const ext = fileName.split(".").pop()?.toLowerCase() ?? "ts";
    return codeText.split("\n").map((line, idx) => (
        <div key={idx} className="flex hover:bg-white/5 px-1 rounded-xs transition-colors py-[1px] group">
            <span className="w-10 select-none text-slate-600 text-right pr-3 font-sans font-normal text-[10px] leading-5 group-hover:text-slate-500">{idx + 1}</span>
            <span className="flex-1 whitespace-pre font-sans text-[11px] leading-5">{highlightLine(line, ext)}</span>
        </div>
    ));
}

// Colorize git diff output line-by-line.
export function formatDiff(diffText: string) {
    if (!diffText) return null;
    return diffText.split("\n").map((line, idx) => {
        let className = "text-slate-400";
        if (line.startsWith("+") && !line.startsWith("+++")) {
            className = "text-emerald-400 bg-emerald-950/20 px-1.5 py-0.5 rounded-xs block";
        } else if (line.startsWith("-") && !line.startsWith("---")) {
            className = "text-red-400 bg-red-950/20 px-1.5 py-0.5 rounded-xs block";
        } else if (line.startsWith("@@")) {
            className = "text-cyan-400 font-semibold py-0.5 block";
        } else if (line.startsWith("diff") || line.startsWith("index")) {
            className = "text-slate-500 font-semibold block";
        }
        return (
            <div key={idx} className={`${className} whitespace-pre`}>
                {line}
            </div>
        );
    });
}
