import { describe, it, expect } from "vitest";
import { stripHtmlWrappers } from "./ChatMessageContent";

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
