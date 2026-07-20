import { describe, it, expect, afterEach } from "vitest";
import path from "path";
import { assertBrowsePathAllowed, browseRootFromEnv } from "./route";

// The folder picker is intentionally unrestricted by default (browse anywhere
// under the local user), but LOOP_BROWSE_ROOT can confine it to one subtree.
// These cover the pure guard that both GET (listing) and POST (mutations) share.

describe("browseRootFromEnv", () => {
    const original = process.env.LOOP_BROWSE_ROOT;
    afterEach(() => {
        if (original === undefined) delete process.env.LOOP_BROWSE_ROOT;
        else process.env.LOOP_BROWSE_ROOT = original;
    });

    it("returns null when unset (no confinement)", () => {
        delete process.env.LOOP_BROWSE_ROOT;
        expect(browseRootFromEnv()).toBeNull();
    });

    it("returns the resolved absolute root when set", () => {
        process.env.LOOP_BROWSE_ROOT = "/srv/workspaces/../workspaces";
        expect(browseRootFromEnv()).toBe(path.resolve("/srv/workspaces/../workspaces"));
    });
});

describe("assertBrowsePathAllowed", () => {
    it("rejects a path containing a null byte", () => {
        expect(() => assertBrowsePathAllowed("/home/user\0/etc", null)).toThrow(/Invalid path/);
    });

    it("allows any path when no root is configured", () => {
        expect(() => assertBrowsePathAllowed("/etc", null)).not.toThrow();
        expect(() => assertBrowsePathAllowed("/anywhere/at/all", null)).not.toThrow();
    });

    const ROOT = "/srv/workspaces";
    it("allows the root itself and paths inside it", () => {
        expect(() => assertBrowsePathAllowed(ROOT, ROOT)).not.toThrow();
        expect(() => assertBrowsePathAllowed(`${ROOT}/proj/src`, ROOT)).not.toThrow();
    });

    it("rejects a path outside the root", () => {
        expect(() => assertBrowsePathAllowed("/etc/passwd", ROOT)).toThrow(/browse root/);
    });

    it("rejects a traversal that escapes the root", () => {
        expect(() => assertBrowsePathAllowed(`${ROOT}/../secret`, ROOT)).toThrow(/browse root/);
    });

    it("rejects a sibling that only shares the root as a name prefix", () => {
        // "/srv/workspaces-evil" must not pass as inside "/srv/workspaces".
        expect(() => assertBrowsePathAllowed(`${ROOT}-evil/x`, ROOT)).toThrow(/browse root/);
    });
});
