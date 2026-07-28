import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { writeGuardedFile } from "./loop-file-guards";

// End-to-end guard tests against a REAL temp project dir (loop-projects.test.ts
// mocks fs, so it can't exercise the new-directory-depth cap). Focus: the
// standard-path guard that stops an agent auto-creating a deep phantom tree.
describe("writeGuardedFile — new-directory-depth cap (standard-path guard)", () => {
    let root: string;

    beforeEach(() => {
        root = fs.mkdtempSync(path.join(os.tmpdir(), "loop-guard-"));
        // Pre-existing layout: root has an "src/" and a "docs/" already.
        fs.mkdirSync(path.join(root, "src"), { recursive: true });
        fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    });

    afterEach(() => {
        fs.rmSync(root, { recursive: true, force: true });
    });

    it("allows editing a file in an existing directory (0 new levels)", () => {
        const r = writeGuardedFile(root, "src/foo.ts", "x");
        expect(r.written).toBe("src/foo.ts");
        expect(fs.existsSync(path.join(root, "src/foo.ts"))).toBe(true);
    });

    it("allows a file directly at the project root", () => {
        const r = writeGuardedFile(root, "README.md", "x");
        expect(r.written).toBe("README.md");
    });

    it("allows creating one new directory level", () => {
        const r = writeGuardedFile(root, "src/newfeat/x.ts", "x");
        expect(r.written).toBe("src/newfeat/x.ts");
    });

    it("blocks the phantom deep-nesting path", () => {
        const r = writeGuardedFile(root, "loop-studio/projects/crm-thai-oil/docs/x.md", "x");
        expect(r.written).toBeUndefined();
        expect(r.blocked?.reason).toContain("new directory levels");
        // Nothing was written to disk.
        expect(fs.existsSync(path.join(root, "loop-studio"))).toBe(false);
    });

    it("blocks two new directory levels (boundary just over the cap)", () => {
        const r = writeGuardedFile(root, "a/b/x.ts", "x");
        expect(r.written).toBeUndefined();
        expect(r.blocked?.reason).toContain("new directory levels");
    });

    it("still blocks path traversal before the depth check", () => {
        const r = writeGuardedFile(root, "../../etc/evil.ts", "x");
        expect(r.blocked?.reason).toContain("outside the project root");
    });
});

describe("writeGuardedFile — per-project docs-location standard", () => {
    let root: string;

    beforeEach(() => {
        root = fs.mkdtempSync(path.join(os.tmpdir(), "loop-docs-"));
        fs.mkdirSync(path.join(root, "docs"), { recursive: true });
        fs.mkdirSync(path.join(root, "src", "components"), { recursive: true });
    });

    afterEach(() => {
        fs.rmSync(root, { recursive: true, force: true });
    });

    it("blocks a new nested markdown doc outside docs/", () => {
        const r = writeGuardedFile(root, "src/notes.md", "x");
        expect(r.written).toBeUndefined();
        expect(r.blocked?.reason).toContain('docs/');
    });

    it("allows a new markdown doc under docs/", () => {
        const r = writeGuardedFile(root, "docs/customer_profile.md", "x");
        expect(r.written).toBe("docs/customer_profile.md");
    });

    it("allows a root-level convention doc (README.md)", () => {
        const r = writeGuardedFile(root, "README.md", "x");
        expect(r.written).toBe("README.md");
    });

    it("does not relocate an EXISTING nested markdown doc (edits pass)", () => {
        fs.writeFileSync(path.join(root, "src/components/COMPONENTS.md"), "old");
        const r = writeGuardedFile(root, "src/components/COMPONENTS.md", "new");
        expect(r.written).toBe("src/components/COMPONENTS.md");
    });

    it("allows a nested markdown doc explicitly named in the task scope", () => {
        const r = writeGuardedFile(root, "src/spec.md", "x", { allowedPaths: ["src/spec.md"] });
        expect(r.written).toBe("src/spec.md");
    });

    it("leaves non-markdown files unaffected by the docs standard", () => {
        const r = writeGuardedFile(root, "src/util.ts", "x");
        expect(r.written).toBe("src/util.ts");
    });
});
