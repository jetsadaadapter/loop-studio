import { describe, it, expect, beforeEach } from "vitest";
import { loadHistory, pushHistory, clearHistory, type HistoryEntry } from "./apiHistory";

const entry = (n: number): HistoryEntry => ({
    id: `h${n}`,
    method: "GET",
    path: `/api/x/${n}`,
    status: 200,
    ok: true,
    timeMs: 5,
    at: n,
});

describe("apiHistory", () => {
    beforeEach(() => localStorage.clear());

    it("returns [] for an empty/absent store", () => {
        expect(loadHistory("p1")).toEqual([]);
    });

    it("prepends newest first and is scoped per project", () => {
        pushHistory("p1", entry(1));
        pushHistory("p1", entry(2));
        const list = loadHistory("p1");
        expect(list.map((e) => e.id)).toEqual(["h2", "h1"]);
        expect(loadHistory("p2")).toEqual([]); // isolated per project
    });

    it("caps history at 20 entries", () => {
        for (let i = 0; i < 25; i++) pushHistory("p1", entry(i));
        expect(loadHistory("p1")).toHaveLength(20);
        expect(loadHistory("p1")[0].id).toBe("h24"); // most recent kept
    });

    it("clears a project's history", () => {
        pushHistory("p1", entry(1));
        clearHistory("p1");
        expect(loadHistory("p1")).toEqual([]);
    });

    it("survives a corrupt store", () => {
        localStorage.setItem("loop_api_history_p1", "{not json");
        expect(loadHistory("p1")).toEqual([]);
    });
});
