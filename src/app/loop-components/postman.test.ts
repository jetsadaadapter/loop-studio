import { describe, it, expect } from "vitest";
import { parsePostman, applyVars } from "./postman";

// Mirrors the real Angoon CRM collection shape (Postman v2.1).
const COLLECTION = {
    info: { name: "Angoon CRM Mock Backend" },
    variable: [
        { key: "baseUrl", value: "http://localhost:3001" },
        { key: "line_user_id", value: "U1234567890abcdef" },
    ],
    item: [
        {
            name: "User & Registration",
            item: [
                { name: "Get user profile by LINE ID", request: { method: "GET", url: { raw: "{{baseUrl}}/api/user/{{line_user_id}}", path: ["api", "user", "{{line_user_id}}"] } } },
                { name: "Register a new user", request: { method: "post", url: { raw: "{{baseUrl}}/api/register", path: ["api", "register"] }, body: { mode: "raw", raw: '{\n  "pdpa_consent": true\n}' } } },
            ],
        },
        {
            name: "Recipes",
            item: [
                { name: "Remove a recipe from favorites", request: { method: "DELETE", url: { raw: "{{baseUrl}}/api/favorites", path: ["api", "favorites"] }, body: { mode: "raw", raw: "{}" } } },
            ],
        },
    ],
};

describe("parsePostman", () => {
    it("parses groups and resolves variables against the real Angoon shape", () => {
        const parsed = parsePostman(COLLECTION);
        expect(parsed.name).toBe("Angoon CRM Mock Backend");
        expect(parsed.groups.map((g) => g.name)).toEqual(["User & Registration", "Recipes"]);

        const profile = parsed.groups[0].endpoints[0];
        expect(profile.method).toBe("GET");
        expect(profile.path).toBe("/api/user/{{line_user_id}}"); // {{baseUrl}} dropped, other vars kept templated

        const register = parsed.groups[0].endpoints[1];
        expect(register.method).toBe("POST"); // uppercased
        expect(register.rawBody).toContain("pdpa_consent");

        const del = parsed.groups[1].endpoints[0];
        expect(del.method).toBe("DELETE");
        expect(del.path).toBe("/api/favorites");
    });

    it("exposes collection variables (minus baseUrl) for the env editor", () => {
        const parsed = parsePostman(COLLECTION);
        expect(parsed.variables).toEqual({ line_user_id: "U1234567890abcdef" });
    });

    it("throws on input that is not a collection", () => {
        expect(() => parsePostman({})).toThrow();
        expect(() => parsePostman({ item: [] })).toThrow();
    });
});

describe("applyVars", () => {
    it("resolves known vars and leaves unknown ones visible", () => {
        expect(applyVars("/api/user/{{line_user_id}}", { line_user_id: "U9" })).toBe("/api/user/U9");
        expect(applyVars("/api/user/{{missing}}", {})).toBe("/api/user/{{missing}}");
    });
});
