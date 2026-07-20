import { describe, it, expect } from "vitest";
import { isAllowedHost, isCrossSite } from "./proxy-guards";

describe("isAllowedHost", () => {
    it("allows localhost / loopback (any port)", () => {
        expect(isAllowedHost("localhost:3000")).toBe(true);
        expect(isAllowedHost("127.0.0.1:3000")).toBe(true);
        expect(isAllowedHost("localhost")).toBe(true);
    });

    it("rejects any other host (DNS rebinding lands here)", () => {
        expect(isAllowedHost("evil.com")).toBe(false);
        expect(isAllowedHost("attacker.localhost.evil.com:3000")).toBe(false);
    });
});

describe("isCrossSite", () => {
    const HOST = "localhost:3000";

    it("treats a same-origin request as same-site", () => {
        expect(isCrossSite(HOST, "http://localhost:3000", "same-origin")).toBe(false);
        expect(isCrossSite(HOST, "http://localhost:3000", null)).toBe(false);
    });

    it("blocks a mismatched Origin (classic cross-site read/write)", () => {
        expect(isCrossSite(HOST, "http://evil.com", null)).toBe(true);
        // different port on the same hostname is still a different origin
        expect(isCrossSite(HOST, "http://localhost:3001", null)).toBe(true);
    });

    it("treats an unparseable Origin (Origin: null) as cross-site", () => {
        expect(isCrossSite(HOST, "null", null)).toBe(true);
    });

    it("blocks when Sec-Fetch-Site reports cross-site even with no Origin", () => {
        expect(isCrossSite(HOST, null, "cross-site")).toBe(true);
        expect(isCrossSite(HOST, null, "cross-origin")).toBe(true);
    });

    it("does not treat absent fetch-metadata as cross-site (curl, navigations, old browsers)", () => {
        expect(isCrossSite(HOST, null, null)).toBe(false);
    });

    it("allows same-site fetch-metadata (e.g. a sibling localhost port navigation with no Origin)", () => {
        expect(isCrossSite(HOST, null, "same-site")).toBe(false);
    });
});
