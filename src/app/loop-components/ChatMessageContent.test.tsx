import { describe, it, expect } from "vitest";
import { stripHtmlWrappers, formatCodeBlobs } from "./ChatMessageContent";

describe("stripHtmlWrappers", () => {
    it("removes layout-only wrapper tags so the Markdown inside shows as a preview", () => {
        const input = '<div style="font-family: system-ui, sans-serif;">\n## Title\n\nHello **world**\n</div>';
        const out = stripHtmlWrappers(input);
        expect(out).not.toContain("<div");
        expect(out).not.toContain("</div>");
        expect(out).toContain("## Title");
        expect(out).toContain("Hello **world**");
    });

    it("strips wrapping tags anywhere, not only at the start", () => {
        expect(stripHtmlWrappers("text <span class='x'>inner</span> more")).toBe("text inner more");
    });

    it("converts <br> to a newline", () => {
        expect(stripHtmlWrappers("line one<br>line two")).toBe("line one\nline two");
        expect(stripHtmlWrappers("a<br />b")).toBe("a\nb");
    });

    it("never touches HTML shown inside a fenced code block", () => {
        const code = "```html\n<div style=\"color:red\">x</div>\n```";
        expect(stripHtmlWrappers(code)).toBe(code);
    });

    it("never touches HTML shown inside inline code", () => {
        expect(stripHtmlWrappers("use the `<div>` element")).toBe("use the `<div>` element");
    });

    it("leaves plain Markdown and comparison operators untouched", () => {
        const md = "if x < 5 then **ok**\n\n- item";
        expect(stripHtmlWrappers(md)).toBe(md);
    });
});

describe("formatCodeBlobs", () => {
    const codeBlob =
        "app.get('/', (req, res) => { const baseUrl = `${req.protocol}://${req.get('host')}`; " +
        "return res.json(buildPostmanCollection(baseUrl)); }); " +
        "const METHOD_COLORS = { GET: { bg: '#dbeafe', fg: '#1e40af' }, POST: { bg: '#dcfce7', fg: '#166534' } }; " +
        "function toRequest(ep) { return { name: ep.desc, method: ep.method }; }";

    it("wraps an unfenced code-dominant blob in a fenced block", () => {
        const out = formatCodeBlobs(codeBlob);
        expect(out).toContain("```");
        expect(out.match(/```/g)).toHaveLength(2); // exactly one fence pair
        expect(out).not.toContain("`${req.protocol}"); // stray inline-code markers dropped
    });

    it("leaves normal Thai prose alone", () => {
        const thai = "สวัสดีครับ นี่คือคำอธิบายเกี่ยวกับระบบ CRM ".repeat(6);
        expect(formatCodeBlobs(thai)).toBe(thai);
    });

    it("leaves short text and brief code mentions alone", () => {
        expect(formatCodeBlobs("ใช้ const กับ arrow => ได้")).toBe("ใช้ const กับ arrow => ได้");
    });

    it("does not double-fence an already fenced block", () => {
        const fenced = "here is code:\n```\nconst x = 1;\n```\ndone";
        expect(formatCodeBlobs(fenced)).toBe(fenced);
    });
});
