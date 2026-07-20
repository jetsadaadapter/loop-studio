import { describe, it, expect } from "vitest";
import {
    zodFieldErrors,
    RegisterProjectSchema,
    CreateTaskSchema,
    CreateAgentSchema,
    UpdateProjectSchema,
} from "./loop-projects.validator";

describe("zodFieldErrors", () => {
    it("maps each invalid field to its own message", () => {
        const result = RegisterProjectSchema.safeParse({ name: "x", path: "relative/path", template: "nextjs-app" });
        expect(result.success).toBe(false);
        if (result.success) return;
        const errors = zodFieldErrors(result.error);
        expect(errors.name).toMatch(/at least 2 characters/);
        expect(errors.path).toMatch(/absolute/);
    });

    it("keeps only the first message per field", () => {
        const result = CreateTaskSchema.safeParse({ name: "", targetFiles: [] });
        expect(result.success).toBe(false);
        if (result.success) return;
        const errors = zodFieldErrors(result.error);
        expect(typeof errors.name).toBe("string");
        expect(errors.targetFiles).toMatch(/at least one target file/i);
    });

    it("returns an empty object shape usable for valid-field lookups", () => {
        const result = CreateAgentSchema.safeParse({ name: "Ada", role: "", model: "m", systemPrompt: "Long enough prompt here." });
        expect(result.success).toBe(false);
        if (result.success) return;
        const errors = zodFieldErrors(result.error);
        expect(errors.role).toBeTruthy();
        expect(errors.name).toBeUndefined();
        expect(errors.systemPrompt).toBeUndefined();
    });
});

describe("UpdateProjectSchema autoAgent", () => {
    // AUTO_AGENTS / the AutoAgent type and the Edit Project modal all offer
    // "claude-sdk"; the update validator must accept it too or saving that choice
    // fails at the API boundary.
    it.each(["claude", "gemini", "claude-sdk", ""])("accepts autoAgent %j", (value) => {
        expect(UpdateProjectSchema.safeParse({ autoAgent: value }).success).toBe(true);
    });

    it("rejects an unknown autoAgent value", () => {
        expect(UpdateProjectSchema.safeParse({ autoAgent: "rogue-cli" }).success).toBe(false);
    });
});

describe("UpdateProjectSchema useWorktree", () => {
    it.each([true, false])("accepts a boolean useWorktree (%s)", (value) => {
        const r = UpdateProjectSchema.safeParse({ useWorktree: value });
        expect(r.success).toBe(true);
        if (r.success) expect(r.data.useWorktree).toBe(value);
    });

    it("rejects a non-boolean useWorktree", () => {
        expect(UpdateProjectSchema.safeParse({ useWorktree: "yes" }).success).toBe(false);
    });
});
