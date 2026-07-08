import path from "path";
import type { KnowledgeEntry } from "@/core/interfaces/loop-projects.interface";
import { assertSafeStoreId, deleteJsonStore, readJsonStore, writeJsonStore } from "./json-store";

// Per-project knowledge store — the "skill file" of the loop. LEARN-stage
// retrospectives and auto-run outcomes append here; the planner and the
// collaboration pipeline read it back into their prompts, so knowledge
// compounds across runs instead of dying inside a finished task.

function knowledgeFilePath(projectId: string): string {
    return path.join(process.cwd(), ".antigravity", `knowledge-${assertSafeStoreId(projectId)}.json`);
}

export function getKnowledgeEntries(projectId: string): KnowledgeEntry[] {
    return readJsonStore<KnowledgeEntry[]>(knowledgeFilePath(projectId), []);
}

/** Insert or replace the entry for a task (one entry per task keeps the file noise-free). */
export function upsertKnowledgeEntry(
    projectId: string,
    entry: Omit<KnowledgeEntry, "updatedAt">
): KnowledgeEntry[] {
    const learnings = entry.learnings.map((l) => l.trim()).filter(Boolean);
    if (learnings.length === 0) return getKnowledgeEntries(projectId);

    const entries = getKnowledgeEntries(projectId).filter((e) => e.taskId !== entry.taskId);
    entries.push({ ...entry, learnings, updatedAt: new Date().toISOString() });
    writeJsonStore(knowledgeFilePath(projectId), entries);
    return entries;
}

export function deleteKnowledge(projectId: string): void {
    deleteJsonStore(knowledgeFilePath(projectId));
}

/**
 * Render the newest entries as a compact prompt block, capped so accumulated
 * knowledge can never crowd out the actual task in the context window.
 * Returns "" when there is nothing to inject.
 */
export function knowledgeForPrompt(projectId: string, maxChars = 4000): string {
    const entries = getKnowledgeEntries(projectId);
    if (entries.length === 0) return "";

    const lines: string[] = [];
    let used = 0;
    // Newest first so the cap drops the oldest knowledge, not the freshest.
    for (const e of [...entries].reverse()) {
        const line = `- [${e.taskName}] ${e.learnings.join("; ")}`;
        if (used + line.length > maxChars) break;
        lines.push(line);
        used += line.length;
    }
    if (lines.length === 0) return "";

    return (
        `Accumulated project knowledge from previous loop runs (newest first). ` +
        `Respect these findings — do not repeat recorded mistakes:\n${lines.join("\n")}`
    );
}
