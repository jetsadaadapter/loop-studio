import { describe, it, expect } from "vitest";
import { autoTagsFor, groupTasks, parsePlanResponse } from "./loop-planner.service";
import type { PlannedTask } from "@/core/validators/loop-projects.validator";

describe("autoTagsFor", () => {
    it("tags component files as react + nextjs", () => {
        const tags = autoTagsFor(["src/app/loop-components/ChatPanel.tsx"]);
        expect(tags).toContain("react");
        expect(tags).toContain("nextjs");
    });

    it("tags test files as vitest", () => {
        expect(autoTagsFor(["src/lib/utils.test.ts"])).toContain("vitest");
    });

    it("tags visual specs as playwright", () => {
        expect(autoTagsFor(["tests/visual/button-gallery.visual.spec.ts"])).toContain("playwright");
    });

    it("tags proxy/security files as security", () => {
        expect(autoTagsFor(["src/proxy.ts"])).toContain("security");
    });

    it("returns no tags for unknown paths", () => {
        expect(autoTagsFor(["README.md"])).toEqual([]);
    });
});

describe("groupTasks", () => {
    const task = (targetFiles: string[], group?: string): PlannedTask => ({
        name: "t",
        targetFiles,
        group,
    });

    it("groups tasks sharing a semantic label", () => {
        const groups = groupTasks([task(["a.ts"], "auth"), task(["b.ts"], "auth"), task(["c.ts"], "ui")]);
        expect(groups[0]).toBe(groups[1]);
        expect(groups[0]).not.toBe(groups[2]);
    });

    it("merges groups that touch the same file even if labels differ", () => {
        const groups = groupTasks([task(["shared.ts"], "one"), task(["shared.ts"], "two")]);
        expect(groups[0]).toBe(groups[1]);
    });

    it("keeps independent tasks in separate groups", () => {
        const groups = groupTasks([task(["a.ts"]), task(["b.ts"])]);
        expect(groups[0]).not.toBe(groups[1]);
    });
});

describe("parsePlanResponse", () => {
    const validPlan = JSON.stringify({ tasks: [{ name: "Add button", targetFiles: ["src/components/ui/button.tsx"] }] });

    it("parses a bare JSON reply", () => {
        expect(parsePlanResponse(validPlan).tasks).toHaveLength(1);
    });

    it("strips markdown fences", () => {
        expect(parsePlanResponse("```json\n" + validPlan + "\n```").tasks).toHaveLength(1);
    });

    it("extracts JSON surrounded by prose", () => {
        expect(parsePlanResponse("Here is the plan:\n" + validPlan + "\nDone.").tasks).toHaveLength(1);
    });

    it("rejects a reply without JSON", () => {
        expect(() => parsePlanResponse("no plan here")).toThrow(/no JSON/);
    });

    it("salvages complete tasks from a max-token-truncated reply", () => {
        const full = JSON.stringify({
            tasks: [
                { name: "First task", targetFiles: ["a.ts"], rationale: "one" },
                { name: "Second task", targetFiles: ["b.ts"], rationale: "two" },
            ],
        });
        // Cut mid-way through the second task object, as token truncation does.
        const truncated = full.slice(0, full.indexOf('"Second task"') + 5);
        const plan = parsePlanResponse(truncated);
        expect(plan.tasks).toHaveLength(1);
        expect(plan.tasks[0].name).toBe("First task");
    });

    it("throws a friendly error when nothing is salvageable", () => {
        expect(() => parsePlanResponse('{"tasks":[{"name":"cut')).toThrow(/truncated or malformed/);
    });

    it("rejects a plan failing schema validation", () => {
        expect(() => parsePlanResponse(JSON.stringify({ tasks: [] }))).toThrow(/validation/);
    });
});
