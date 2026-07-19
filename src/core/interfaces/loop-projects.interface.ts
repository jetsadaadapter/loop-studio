export type ProjectTemplate = "nextjs-app" | "nextjs-pages" | "vite-react" | "nodejs" | "generic";

export const AVAILABLE_SKILLS: SkillTag[] = [
    { key: "nextjs", label: "Next.js 16", description: "Expertise in App Router, Server Components, and NextJS configurations." },
    { key: "react", label: "React 19", description: "Building responsive, premium UI components following design guidelines." },
    { key: "vitest", label: "Vitest", description: "Writing unit tests, visual snapshot assertions, and component testing." },
    { key: "playwright", label: "Playwright", description: "Writing end-to-end integration and visual regression tests." },
    { key: "git", label: "Git & Versioning", description: "Managing git branches, merging, staging, commit messages, and pushes." },
    { key: "security", label: "Security & Auth", description: "Auditing authentication, authorization, token headers, and CSP policies." },
    { key: "devops", label: "DevOps & Pipelines", description: "Fixing compiler type check errors, build configurations, and linting." },
];

export const AVAILABLE_MODELS = [
    { id: "claude-opus-4-8", label: "Claude Opus 4.8 (Recommended)", provider: "Anthropic" },
    { id: "claude-fable-5", label: "Claude Fable 5", provider: "Anthropic" },
    { id: "claude-sonnet-5", label: "Claude Sonnet 5", provider: "Anthropic" },
    { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", provider: "Anthropic" },
    { id: "gemini-3-5-flash-medium", label: "Gemini 3.5 Flash (Medium)", provider: "Google" },
    { id: "gemini-3-5-flash-high", label: "Gemini 3.5 Flash (High)", provider: "Google" },
    { id: "gemini-3-5-flash-low", label: "Gemini 3.5 Flash (Low)", provider: "Google" },
    { id: "gemini-3-1-pro-low", label: "Gemini 3.1 Pro (Low)", provider: "Google" },
    { id: "gemini-3-1-pro-high", label: "Gemini 3.1 Pro (High)", provider: "Google" },
];

/**
 * Model actually sent to the Anthropic Messages API by the chat/collaborate
 * routes. All agent personas share one call to keep setup simple, so this is the
 * single source of truth — update here to switch the Loop Studio LLM.
 */
export const LOOP_LLM_MODEL = "claude-opus-4-8";

/** Approximate Sonnet-class pricing (USD per 1M tokens) used for cost display. */
export const LOOP_LLM_PRICING = { inputPerM: 3, outputPerM: 15 } as const;

/** Cost in USD for a single LLM call given token counts. */
export function estimateLlmCost(inputTokens: number, outputTokens: number): number {
    return (inputTokens * LOOP_LLM_PRICING.inputPerM + outputTokens * LOOP_LLM_PRICING.outputPerM) / 1_000_000;
}

export type RiskTier = "RED" | "ORANGE" | "YELLOW" | "GREEN";

export type TaskStage = "PLAN" | "BUILD" | "VERIFY" | "AUTOMATE" | "OBSERVE" | "LEARN";

export type TaskStatus = "pending" | "running" | "completed" | "failed";

export type TaskPriority = "low" | "medium" | "high" | "critical";

export type KanbanColumn = "backlog" | "todo" | "in_progress" | "done";

export interface SkillTag {
    key: string;
    label: string;
    description: string;
}

export interface LoopAgent {
    id: string;
    name: string;
    role: string;
    model: string;
    systemPrompt: string;
    skills: string[]; // key references
    /** Drives the avatar's gendered features (hair/clothing). Defaults to male when unset. */
    gender?: "male" | "female";
}

export interface ProjectActivity {
    id: string;
    taskId: string;
    agentId?: string;
    agentName?: string;
    stage: TaskStage;
    action: string;
    message: string;
    timestamp: string;
}

// A pasted/uploaded image or file attached to a chat message. Images are sent
// to the LLM as vision content; other file types are context-only (shown as a
// chip, not sent as an image block).
export interface ChatAttachment {
    id: string;
    name: string;
    mimeType: string;
    dataUrl: string; // "data:<mime>;base64,<data>"
}

export interface ChatMessage {
    id: string;
    role: "user" | "assistant" | "system";
    senderName: string;
    content: string;
    timestamp: string;
    attachments?: ChatAttachment[];
    tokensUsed?: {
        input: number;
        output: number;
        cost: number;
    };
}

export interface RetroAnswers {
    testsProven: string;
    envVerified: string;
    sideEffects: string;
}

/**
 * One accumulated learning per task, persisted per project and fed back into
 * the planner/collaboration prompts so later loops start from what earlier
 * loops discovered ("skills" in loop-engineering terms).
 */
export interface KnowledgeEntry {
    taskId: string;
    taskName: string;
    source: "manual" | "auto-run";
    /** Short bullet lines, e.g. "Tests: snapshot needed jsdom cleanup". */
    learnings: string[];
    updatedAt: string;
}

/** A Loop-Studio-authored commit on a task's branch — a rollback target. */
export interface TaskCheckpoint {
    sha: string;
    label: string;
    stage: TaskStage;
    createdAt: string;
}

/**
 * Per-task git isolation (see docs/branch-per-task-checkpoint.md). Each task gets
 * its own worktree + branch so agent edits are isolated, checkpointed, and
 * undoable. Absent = the task edits the target repo directly (legacy behavior /
 * non-git targets).
 */
export interface TaskGit {
    /** Absolute path to the task's dedicated git worktree. */
    worktreeDir: string;
    /** Branch name, `loop/task-<taskId>`. */
    branch: string;
    /** Commit the task branched from. */
    baseSha: string;
    checkpoints: TaskCheckpoint[];
    integration?: { mode: "leave-branch" | "open-pr" | "merge"; ref?: string; prUrl?: string } | null;
}

export interface LoopTask {
    id: string;
    projectId: string;
    name: string;
    status: TaskStatus;
    currentStage: TaskStage;
    targetFiles: string[];
    riskTier?: RiskTier;
    /** Git worktree + checkpoints for this task (opt-in). */
    git?: TaskGit | null;
    safetyNets?: string[];
    logs?: string;
    testRunner?: "vitest" | "playwright";
    chatHistory: ChatMessage[];
    activities: ProjectActivity[];
    retroAnswers?: RetroAnswers;
    priority?: TaskPriority;
    kanbanColumn?: KanbanColumn;
    startDate?: string;
    endDate?: string;
    sprintId?: string;
    storyPoints?: number;
    /** SkillTag keys (see AVAILABLE_SKILLS) — used for filtering and agent routing. */
    tags?: string[];
    tokensUsed: {
        input: number;
        output: number;
        cost: number;
    };
    createdAt: string;
    updatedAt: string;
}

/**
 * Heartbeat config: fire an auto-run on a cadence instead of the user clicking
 * "Plan from Goal" every time. Headless runs use the server env API key
 * (ANTHROPIC_API_KEY/GEMINI_API_KEY) — there is no per-user key on the server.
 */
export interface ProjectSchedule {
    enabled: boolean;
    intervalMinutes: number;
    /** ISO timestamp of the last time the scheduler evaluated this project. */
    lastRunAt?: string;
    /** Short human-readable outcome of the last heartbeat (started / skipped + why). */
    lastResult?: string;
}

// Local agent CLIs that can auto-fulfill the IDE bridge (read-only). Kept as a
// const list so UI option menus and the worker's allow-list stay in sync.
export type AutoAgent = "claude" | "gemini";
export const AUTO_AGENTS: { value: AutoAgent; label: string }[] = [
    { value: "claude", label: "Claude Code" },
    { value: "gemini", label: "Gemini CLI" },
];

export interface LoopProject {
    id: string;
    name: string;
    path: string; // absolute local path
    template: ProjectTemplate;
    tasks: LoopTask[];
    schedule?: ProjectSchedule;
    // Which local agent auto-fulfills this project's bridged chat/collaborate
    // requests. Unset = off (wait for a human, or fall back to LOOP_BRIDGE_AUTO).
    autoAgent?: AutoAgent;
    // Where this project's app runs, used by the Studio preview pane — usually the
    // project's own dev server URL (e.g. "http://localhost:3001"). A relative path
    // works for a project that is this same repo.
    previewUrl?: string;
    /** Computed by the API (not persisted): this project is the running app's own repo. */
    isHost?: boolean;
    createdAt: string;
    updatedAt: string;
}
