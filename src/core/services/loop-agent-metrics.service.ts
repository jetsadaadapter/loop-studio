import { getProjects } from "@/core/services/loop-projects.service";
import { getAgents } from "@/core/services/loop-agents.service";
import type { LoopAgent, LoopTask } from "@/core/interfaces/loop-projects.interface";

// Derives per-agent operational metrics from real task data (chat history +
// activities across every registered project). Agents are matched to the work
// they touched by the sender name the collaboration pipeline stamps on each
// message (e.g. "Somchai (Architect)", "Somsri (Developer) - Fix 1").

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const ACTIVE_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface AgentMetrics {
    taskThisWeek: number;
    openTickets: number;
    successRate: number; // 0–100, over tasks the agent touched
    avgResolutionDays: number; // over completed tasks the agent touched
    totalTasks: number;
    lastActivity: string | null; // first line of the agent's most recent message
    lastActivityAt: string | null;
    active: boolean; // touched something within the active window
    volumeByWeekday: number[]; // length 7, Sun→Sat, count of the agent's messages
}

export type AgentWithMetrics = LoopAgent & { metrics: AgentMetrics };

/** The token used to attribute a chat/activity entry to an agent (its first name, lowercased). */
function matchToken(agentName: string): string {
    return agentName.split("(")[0].trim().split(/\s+/)[0]?.toLowerCase() ?? "";
}

function firstLine(text: string): string {
    const line = text.split("\n").find((l) => l.trim().length > 0)?.trim() ?? "";
    return line.length > 90 ? `${line.slice(0, 90)}…` : line;
}

function parseTime(ts: string | undefined): number {
    const t = ts ? Date.parse(ts) : NaN;
    return Number.isNaN(t) ? 0 : t;
}

interface AgentTouch {
    tasks: Set<string>;
    completedTasks: number;
    openTasks: number;
    tasksThisWeek: Set<string>;
    resolutionDaysSum: number;
    resolutionCount: number;
    lastActivity: string | null;
    lastActivityAt: number;
    volumeByWeekday: number[];
}

function emptyTouch(): AgentTouch {
    return {
        tasks: new Set(),
        completedTasks: 0,
        openTasks: 0,
        tasksThisWeek: new Set(),
        resolutionDaysSum: 0,
        resolutionCount: 0,
        lastActivity: null,
        lastActivityAt: 0,
        volumeByWeekday: [0, 0, 0, 0, 0, 0, 0],
    };
}

function computeTouches(tasks: LoopTask[], tokens: string[], now: number): Map<string, AgentTouch> {
    const touches = new Map<string, AgentTouch>();
    for (const token of tokens) touches.set(token, emptyTouch());

    for (const task of tasks) {
        const createdAt = parseTime(task.createdAt);
        const updatedAt = parseTime(task.updatedAt);
        const isCompleted = task.status === "completed";
        const resolutionDays = createdAt && updatedAt > createdAt ? (updatedAt - createdAt) / DAY_MS : 0;

        // Which tokens participated in this task, and when they were last seen here.
        const seenThisTask = new Set<string>();
        for (const msg of task.chatHistory ?? []) {
            const sender = (msg.senderName ?? "").toLowerCase();
            const ts = parseTime(msg.timestamp);
            for (const token of tokens) {
                if (!token || !sender.includes(token)) continue;
                const touch = touches.get(token)!;
                seenThisTask.add(token);
                if (ts) {
                    touch.volumeByWeekday[new Date(ts).getDay()]++;
                    if (now - ts <= WEEK_MS) touch.tasksThisWeek.add(task.id);
                    if (ts > touch.lastActivityAt) {
                        touch.lastActivityAt = ts;
                        touch.lastActivity = firstLine(msg.content ?? "");
                    }
                }
            }
        }

        for (const token of seenThisTask) {
            const touch = touches.get(token)!;
            touch.tasks.add(task.id);
            if (isCompleted) {
                touch.completedTasks++;
                if (resolutionDays > 0) {
                    touch.resolutionDaysSum += resolutionDays;
                    touch.resolutionCount++;
                }
            } else {
                touch.openTasks++;
            }
        }
    }
    return touches;
}

function toMetrics(touch: AgentTouch, now: number): AgentMetrics {
    const total = touch.tasks.size;
    return {
        taskThisWeek: touch.tasksThisWeek.size,
        openTickets: touch.openTasks,
        successRate: total > 0 ? Math.round((touch.completedTasks / total) * 100) : 0,
        avgResolutionDays: touch.resolutionCount > 0
            ? Math.round((touch.resolutionDaysSum / touch.resolutionCount) * 10) / 10
            : 0,
        totalTasks: total,
        lastActivity: touch.lastActivity,
        lastActivityAt: touch.lastActivityAt ? new Date(touch.lastActivityAt).toISOString() : null,
        active: touch.lastActivityAt > 0 && now - touch.lastActivityAt <= ACTIVE_WINDOW_MS,
        volumeByWeekday: touch.volumeByWeekday,
    };
}

/** Roster enriched with metrics derived from every project's task history. */
export function getAgentsWithMetrics(): AgentWithMetrics[] {
    const agents = getAgents();
    const now = Date.now();
    const allTasks = getProjects().flatMap((p) => p.tasks ?? []);

    const tokens = agents.map((a) => matchToken(a.name));
    const touches = computeTouches(allTasks, tokens, now);

    return agents.map((agent, i) => ({
        ...agent,
        metrics: toMetrics(touches.get(tokens[i]) ?? emptyTouch(), now),
    }));
}
