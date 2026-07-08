import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    getKnowledgeEntries,
    upsertKnowledgeEntry,
    knowledgeForPrompt,
} from "./loop-knowledge.service";
import type { KnowledgeEntry } from "@/core/interfaces/loop-projects.interface";

// In-memory stand-in for json-store so tests exercise the knowledge logic
// (upsert/dedupe/prompt rendering) without touching the real .antigravity/.
const stores = new Map<string, unknown>();
vi.mock("./json-store", () => ({
    readJsonStore: (filePath: string, defaultValue: unknown) =>
        stores.has(filePath) ? stores.get(filePath) : defaultValue,
    writeJsonStore: (filePath: string, data: unknown) => {
        stores.set(filePath, data);
    },
}));

describe("loop-knowledge.service", () => {
    beforeEach(() => {
        stores.clear();
    });

    it("starts empty for an unknown project", () => {
        expect(getKnowledgeEntries("proj-a")).toEqual([]);
        expect(knowledgeForPrompt("proj-a")).toBe("");
    });

    it("rejects project ids that could traverse the filesystem", () => {
        expect(() => getKnowledgeEntries("../etc")).toThrow();
        expect(() => getKnowledgeEntries("a/b")).toThrow();
    });

    it("appends an entry and reads it back", () => {
        upsertKnowledgeEntry("proj-a", {
            taskId: "task-1",
            taskName: "Fix button",
            source: "manual",
            learnings: ["Tests: snapshot required"],
        });
        const entries = getKnowledgeEntries("proj-a");
        expect(entries).toHaveLength(1);
        expect(entries[0].taskName).toBe("Fix button");
        expect(entries[0].updatedAt).toBeTruthy();
    });

    it("replaces the entry for the same task instead of duplicating", () => {
        const base = { taskId: "task-1", taskName: "Fix button", source: "manual" as const };
        upsertKnowledgeEntry("proj-a", { ...base, learnings: ["first attempt"] });
        upsertKnowledgeEntry("proj-a", { ...base, learnings: ["second attempt"] });
        const entries = getKnowledgeEntries("proj-a");
        expect(entries).toHaveLength(1);
        expect(entries[0].learnings).toEqual(["second attempt"]);
    });

    it("ignores entries whose learnings are all blank", () => {
        upsertKnowledgeEntry("proj-a", {
            taskId: "task-1",
            taskName: "Fix button",
            source: "manual",
            learnings: ["  ", ""],
        });
        expect(getKnowledgeEntries("proj-a")).toEqual([]);
    });

    it("keeps projects isolated from each other", () => {
        upsertKnowledgeEntry("proj-a", {
            taskId: "task-1", taskName: "A", source: "manual", learnings: ["x"],
        });
        expect(getKnowledgeEntries("proj-b")).toEqual([]);
    });

    it("renders newest entries first in the prompt block", () => {
        upsertKnowledgeEntry("proj-a", {
            taskId: "task-1", taskName: "Older", source: "manual", learnings: ["old lesson"],
        });
        upsertKnowledgeEntry("proj-a", {
            taskId: "task-2", taskName: "Newer", source: "auto-run", learnings: ["new lesson"],
        });
        const prompt = knowledgeForPrompt("proj-a");
        expect(prompt).toContain("Accumulated project knowledge");
        expect(prompt.indexOf("Newer")).toBeLessThan(prompt.indexOf("Older"));
    });

    it("caps the prompt block and drops the oldest entries first", () => {
        for (let i = 0; i < 10; i++) {
            upsertKnowledgeEntry("proj-a", {
                taskId: `task-${i}`,
                taskName: `Task ${i}`,
                source: "manual",
                learnings: ["L".repeat(200)],
            });
        }
        const prompt = knowledgeForPrompt("proj-a", 500);
        expect(prompt.length).toBeLessThan(700); // cap + header
        expect(prompt).toContain("Task 9"); // newest survives
        expect(prompt).not.toContain("Task 0"); // oldest dropped
    });

    it("returns typed entries usable by the UI", () => {
        upsertKnowledgeEntry("proj-a", {
            taskId: "task-1", taskName: "A", source: "auto-run", learnings: ["x"],
        });
        const entry: KnowledgeEntry = getKnowledgeEntries("proj-a")[0];
        expect(entry.source).toBe("auto-run");
    });
});
