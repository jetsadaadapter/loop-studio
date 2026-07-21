import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { LoopTask } from "@/core/interfaces/loop-projects.interface";
import { BoardView } from "./BoardView";

const task = (overrides: Partial<LoopTask>): LoopTask =>
    ({
        id: "t1",
        projectId: "p1",
        name: "A task",
        status: "pending",
        kanbanColumn: "todo",
        currentStage: "BUILD",
        targetFiles: ["src/a.ts"],
        updatedAt: new Date("2026-07-20").toISOString(),
        chatHistory: [],
        activities: [],
        priority: "medium",
        ...overrides,
    } as unknown as LoopTask);

describe("BoardView drag guard", () => {
    it("exposes a draggable grip handle for a task that isn't running", () => {
        render(<BoardView projectId="p1" tasks={[task({ id: "t1", status: "pending", kanbanColumn: "todo" })]} />);
        const handle = screen.getByLabelText("Drag to move");
        expect(handle.getAttribute("draggable")).toBe("true");
        expect(screen.queryByLabelText("Locked while running")).toBeNull();
    });

    it("locks the handle (not draggable) while a task's pipeline is running", () => {
        render(<BoardView projectId="p1" tasks={[task({ id: "t2", status: "running", kanbanColumn: "in_progress" })]} />);
        const locked = screen.getByLabelText("Locked while running");
        expect(locked.getAttribute("draggable")).toBe("false");
        expect(screen.queryByLabelText("Drag to move")).toBeNull();
    });

    it("keeps the card itself non-draggable (only the grip is a drag source)", () => {
        render(<BoardView projectId="p1" tasks={[task({ id: "t3", name: "Openable" })]} />);
        const card = screen.getByRole("link", { name: /Openable/ });
        expect(card.getAttribute("draggable")).toBe("false");
    });
});
