// Per-project request history for the API console, persisted in localStorage so
// it survives reloads. Capped and defensive — a corrupt/absent store reads as [].

export interface HistoryEntry {
    id: string;
    method: string;
    path: string;
    body?: string;
    status: number;
    ok: boolean;
    timeMs: number;
    at: number;
}

const MAX = 20;
const key = (projectId: string) => `loop_api_history_${projectId}`;

export function loadHistory(projectId: string): HistoryEntry[] {
    try {
        const raw = localStorage.getItem(key(projectId));
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function pushHistory(projectId: string, entry: HistoryEntry): HistoryEntry[] {
    const list = [entry, ...loadHistory(projectId)].slice(0, MAX);
    try {
        localStorage.setItem(key(projectId), JSON.stringify(list));
    } catch {
        /* storage full / unavailable — keep the in-memory list */
    }
    return list;
}

export function clearHistory(projectId: string): void {
    try {
        localStorage.removeItem(key(projectId));
    } catch {
        /* ignore */
    }
}
