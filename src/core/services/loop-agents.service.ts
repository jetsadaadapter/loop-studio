import path from "path";
import type { LoopAgent } from "@/core/interfaces/loop-projects.interface";
import { readJsonStore, writeJsonStore } from "./json-store";

const AGENTS_FILE_PATH = path.join(process.cwd(), ".antigravity", "loop-agents.json");

const DEFAULT_AGENTS: LoopAgent[] = [
    {
        id: "agent-somchai",
        name: "Somchai (Architect)",
        role: "Tech Lead & Architect",
        model: "claude-sonnet-5",
        systemPrompt: "You are Somchai, an experienced Tech Lead and Software Architect. Your job is to analyze requirements, evaluate file dependencies, determine the Risk Tier (Red, Orange, Yellow, Green), and specify safety nets (e.g. unit tests, snapshots, visual audits). Speak in a professional, constructive tone.",
        skills: ["nextjs", "security", "git"],
        gender: "male",
    },
    {
        id: "agent-somsri",
        name: "Somsri (Developer)",
        role: "Lead Developer",
        model: "claude-sonnet-5",
        systemPrompt: "You are Somsri, a senior software engineer. Your job is to write clean, maintainable TypeScript/React code. Always adhere to CSS styling guidelines, never use raw inline styles where components exist, and keep file sizes modular. You write code based on requirements and fix bugs when reported.",
        skills: ["react", "nextjs"],
        gender: "female",
    },
    {
        id: "agent-wichai",
        name: "Wichai (QA)",
        role: "QA Engineer",
        model: "gpt-4o",
        systemPrompt: "You are Wichai, a meticulous QA Engineer. Your job is to write unit tests using Vitest or integration/visual tests using Playwright. When code changes, ensure proper coverage. If a test fails, analyze the console log stack trace and explain to the developer exactly what failed and why.",
        skills: ["vitest", "playwright"],
        gender: "male",
    },
    {
        id: "agent-mana",
        name: "Mana (DevOps)",
        role: "DevOps Specialist",
        model: "gemini-1-5-pro",
        systemPrompt: "You are Mana, a DevOps Specialist. Your job is to inspect type check outputs, solve lint issues, resolve build script conflicts, and ensure CI compilation succeeds. You focus on details like imports, type interfaces, and package dependency resolutions.",
        skills: ["devops", "git"],
        gender: "male",
    },
    {
        id: "agent-preecha",
        name: "Preecha (Auditor)",
        role: "Security Auditor",
        model: "claude-sonnet-5",
        systemPrompt: "You are Preecha, an eagle-eyed Security Auditor. Your job is to inspect Git Diffs. You search for credentials, weak authorization checks, routes bypasses, or potential security vulnerabilities. You provide a summary audit and decide whether to approve or reject the diff.",
        skills: ["security", "git"],
        gender: "male",
    },
];

// Read/save semantics (corrupt-file backup, atomic writes, throwing on
// failure) live in json-store.ts. The default roster seeds the file on first read.
export function getAgents(): LoopAgent[] {
    return readJsonStore<LoopAgent[]>(AGENTS_FILE_PATH, structuredClone(DEFAULT_AGENTS));
}

export function saveAgents(agents: LoopAgent[]): void {
    writeJsonStore(AGENTS_FILE_PATH, agents);
}

export function updateAgent(id: string, partial: Partial<LoopAgent>): LoopAgent {
    const agents = getAgents();
    const idx = agents.findIndex((a) => a.id === id);
    if (idx === -1) {
        throw new Error(`Agent with ID ${id} not found.`);
    }
    const updated = { ...agents[idx], ...partial };
    agents[idx] = updated;
    saveAgents(agents);
    return updated;
}

export function createAgent(agent: Omit<LoopAgent, "id">): LoopAgent {
    const agents = getAgents();
    const newAgent: LoopAgent = {
        ...agent,
        id: `agent-${Date.now()}`,
    };
    agents.push(newAgent);
    saveAgents(agents);
    return newAgent;
}

export function deleteAgent(id: string): void {
    const agents = getAgents();
    const filtered = agents.filter((a) => a.id !== id);
    saveAgents(filtered);
}
