/**
 * Server-side HTML sanitizer.
 *
 * This is a lightweight allow-list sanitizer for use in Next.js Server Components
 * where DOMPurify (browser-only) cannot run natively.
 *
 * USAGE: Replace with `isomorphic-dompurify` or `sanitize-html` for richer
 * content once installed:
 *   npm install isomorphic-dompurify @types/dompurify
 *   import DOMPurify from "isomorphic-dompurify";
 *   export function sanitizeHtml(dirty: string) { return DOMPurify.sanitize(dirty, DOMPURIFY_CONFIG); }
 */

// Tags that are safe for instructional rich-text content
const ALLOWED_TAGS = new Set([
    "p", "br", "b", "strong", "i", "em", "u", "s", "strike",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li",
    "a",
    "pre", "code", "blockquote",
    "table", "thead", "tbody", "tr", "th", "td",
    "hr", "span", "div",
]);

// Attributes that are safe per tag
const ALLOWED_ATTRS: Record<string, Set<string>> = {
    a:    new Set(["href", "title", "target", "rel"]),
    span: new Set(["class"]),
    div:  new Set(["class"]),
    td:   new Set(["colspan", "rowspan"]),
    th:   new Set(["colspan", "rowspan", "scope"]),
    code: new Set(["class"]),
    pre:  new Set(["class"]),
};

const DANGEROUS_PROTOCOLS = /^(javascript|vbscript|data):/i;

/**
 * Strip all tags not on the allow-list, remove dangerous attributes,
 * and sanitize href values.
 *
 * This runs on the server only. For client-side use, reach for DOMPurify.
 */
export function sanitizeHtml(dirty: string): string {
    // Remove script/style blocks entirely (including their content)
    let clean = dirty
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

    // Remove all HTML comments (can hide payloads)
    clean = clean.replace(/<!--[\s\S]*?-->/g, "");

    // Strip disallowed tags
    clean = clean.replace(/<\/?([a-z][a-z0-9]*)\b([^>]*)>/gi, (match, tag: string, attrs: string) => {
        const tagLower = tag.toLowerCase();

        if (!ALLOWED_TAGS.has(tagLower)) {
            return ""; // Drop the tag entirely
        }

        // Parse and filter attributes
        const allowed = ALLOWED_ATTRS[tagLower];
        if (!allowed || allowed.size === 0) {
            return `<${tagLower}>`;
        }

        const safeAttrs = attrs
            .replace(/([a-z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/gi,
                (attrMatch: string, attrName: string, dq: string, sq: string, bare: string) => {
                    const name = attrName.toLowerCase();
                    const value = dq ?? sq ?? bare ?? "";

                    if (!allowed.has(name)) return "";

                    // Sanitize URL attributes
                    if (name === "href") {
                        const trimmed = value.trim();
                        if (DANGEROUS_PROTOCOLS.test(trimmed)) return "";
                        // Enforce rel=noopener on external links
                        return `href="${trimmed}"`;
                    }

                    return `${name}="${value}"`;
                })
            .trim();

        // Force rel="noopener noreferrer" on all <a> tags with href
        if (tagLower === "a" && safeAttrs.includes("href")) {
            const withRel = safeAttrs.includes("target=")
                ? safeAttrs
                : `${safeAttrs} target="_blank"`;
            return `<a ${withRel} rel="noopener noreferrer">`;
        }

        return safeAttrs ? `<${tagLower} ${safeAttrs}>` : `<${tagLower}>`;
    });

    // Strip any remaining event handler attributes (belt-and-suspenders)
    clean = clean.replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|\S+)/gi, "");

    return clean;
}
