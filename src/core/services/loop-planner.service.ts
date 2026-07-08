import { AVAILABLE_SKILLS, type LoopTask, type RiskTier, type TaskPriority } from "@/core/interfaces/loop-projects.interface";
import { GoalPlanSchema, type GoalPlan, type PlannedTask } from "@/core/validators/loop-projects.validator";
import { getProjects, saveProjects, calculateRiskTier, getSafetyNets } from "@/core/services/loop-projects.service";

// Goal → plan decomposition. The Architect agent returns a JSON plan; this
// service validates it, enriches every planned task (auto-tags from file paths,
// overlap-safe grouping, risk tier), and materializes tasks into the backlog.

const VALID_TAGS = new Set(AVAILABLE_SKILLS.map((s) => s.key));

// Path-pattern → SkillTag key. First match per rule adds the tag; a file can
// contribute several tags (a component test hits both "react" and "vitest").
const AUTO_TAG_RULES: { pattern: RegExp; tag: string }[] = [
    { pattern: /\.(test|spec)\.[jt]sx?$|vitest/i, tag: "vitest" },
    { pattern: /playwright|\.visual\.spec\.|tests\/visual/i, tag: "playwright" },
    { pattern: /\.tsx$|src\/components/i, tag: "react" },
    { pattern: /src\/app\/|route\.ts$|next\.config|middleware|proxy\.ts$/i, tag: "nextjs" },
    { pattern: /proxy\.ts$|auth|csp|token|security/i, tag: "security" },
    { pattern: /tsconfig|eslint|\.github\/|Dockerfile|postcss/i, tag: "devops" },
];

/** Deterministic tags inferred from a task's target file paths. */
export function autoTagsFor(targetFiles: string[]): string[] {
    const tags = new Set<string>();
    for (const file of targetFiles) {
        for (const rule of AUTO_TAG_RULES) {
            if (rule.pattern.test(file)) tags.add(rule.tag);
        }
    }
    return [...tags];
}

/** Merge the model's suggested tags (only known SkillTag keys) with inferred ones. */
function mergeTags(suggested: string[] | undefined, inferred: string[]): string[] {
    const tags = new Set(inferred);
    for (const t of suggested ?? []) {
        if (VALID_TAGS.has(t)) tags.add(t);
    }
    return [...tags];
}

/**
 * Assign group indices so tasks that touch the same file are never in
 * different groups (they must run sequentially to avoid conflicting edits).
 * Starts from the model's semantic `group` labels, then union-merges any
 * groups that share a target file.
 */
export function groupTasks(tasks: PlannedTask[]): number[] {
    // Union-find over task indices.
    const parent = tasks.map((_, i) => i);
    const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
    const union = (a: number, b: number) => { parent[find(a)] = find(b); };

    // Same semantic group label → same group.
    const byLabel = new Map<string, number>();
    tasks.forEach((t, i) => {
        const label = (t.group || "").toLowerCase();
        if (!label) return;
        if (byLabel.has(label)) union(i, byLabel.get(label)!);
        else byLabel.set(label, i);
    });

    // Shared target file → same group, regardless of what the model said.
    const byFile = new Map<string, number>();
    tasks.forEach((t, i) => {
        for (const f of t.targetFiles) {
            if (byFile.has(f)) union(i, byFile.get(f)!);
            else byFile.set(f, i);
        }
    });

    // Normalize roots to sequential group numbers in first-seen order.
    const groupOf = new Map<number, number>();
    return tasks.map((_, i) => {
        const root = find(i);
        if (!groupOf.has(root)) groupOf.set(root, groupOf.size + 1);
        return groupOf.get(root)!;
    });
}

/** System prompt for the Architect: decompose a goal into a strict-JSON plan. */
export function buildPlanPrompt(architectPersona: string): string {
    const tagList = AVAILABLE_SKILLS.map((s) => `"${s.key}" (${s.label})`).join(", ");
    return (
        `${architectPersona}\n\n` +
        `Decompose the user's goal into small, independently verifiable tasks for this codebase. ` +
        `Respond with ONLY a JSON object — no markdown fences, no prose — matching exactly:\n` +
        `{"tasks":[{"name":string,"targetFiles":string[],"rationale":string,` +
        `"priority":"low"|"medium"|"high"|"critical","storyPoints":number(1-13),` +
        `"tags":string[],"group":string}]}\n` +
        `Rules: 1-15 tasks; targetFiles are repo-relative paths; tags only from: ${tagList}; ` +
        `tasks that belong to the same feature share the same short "group" label; ` +
        `order tasks so prerequisites come first; keep every "rationale" to one short ` +
        `sentence (under 20 words) so the whole plan stays compact.`
    );
}

/** Strip optional markdown fences and validate the model's JSON plan. */
export function parsePlanResponse(text: string): GoalPlan {
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const start = cleaned.indexOf("{");
    if (start === -1) throw new Error("Planner reply contained no JSON object.");

    const raw = salvageJson(cleaned.slice(start));
    if (raw === null) throw new Error("Planner reply was truncated or malformed JSON — try again, or narrow the goal so the plan is smaller.");

    const parsed = GoalPlanSchema.safeParse(raw);
    if (!parsed.success) throw new Error(`Planner reply failed validation: ${parsed.error.issues[0].message}`);
    return parsed.data;
}

/**
 * Parse a {"tasks":[...]} payload, tolerating a reply that was cut off
 * mid-stream (max-token truncation): retry from each complete task object
 * boundary backwards, closing the array/object, so every fully-emitted task
 * is recovered instead of failing the whole plan.
 */
function salvageJson(text: string): unknown | null {
    const end = text.lastIndexOf("}");
    if (end !== -1) {
        try { return JSON.parse(text.slice(0, end + 1)); } catch { /* fall through to salvage */ }
    }

    let idx = text.lastIndexOf("}");
    for (let attempts = 0; idx > 0 && attempts < 20; attempts++) {
        try { return JSON.parse(text.slice(0, idx + 1) + "]}"); } catch { /* try the previous object boundary */ }
        idx = text.lastIndexOf("}", idx - 1);
    }
    return null;
}

export interface EnrichedPlannedTask extends PlannedTask {
    tags: string[];
    groupNumber: number;
    riskTier: RiskTier;
    safetyNets: string[];
}

/** Enrich a validated plan with tags, conflict-safe groups, and risk tiers. */
export function enrichPlan(projectPath: string, plan: GoalPlan): EnrichedPlannedTask[] {
    const groups = groupTasks(plan.tasks);
    return plan.tasks.map((t, i) => {
        const { tier } = calculateRiskTier(projectPath, t.targetFiles[0]);
        return {
            ...t,
            tags: mergeTags(t.tags, autoTagsFor(t.targetFiles)),
            groupNumber: groups[i],
            riskTier: tier,
            safetyNets: getSafetyNets(tier),
        };
    });
}

/** Materialize an enriched plan into backlog tasks on the project. */
export function createTasksFromPlan(projectId: string, goal: string, enriched: EnrichedPlannedTask[]): LoopTask[] {
    const projects = getProjects();
    const project = projects.find((p) => p.id === projectId);
    if (!project) throw new Error("Project not found");

    const planId = `goal-${Date.now()}`;
    const now = new Date().toISOString();
    const created: LoopTask[] = enriched.map((t, i) => ({
        id: `task-${Date.now()}-${i}`,
        projectId,
        name: t.name,
        status: "pending",
        currentStage: "PLAN",
        targetFiles: t.targetFiles,
        riskTier: t.riskTier,
        safetyNets: t.safetyNets,
        priority: (t.priority as TaskPriority) ?? "medium",
        kanbanColumn: "backlog",
        sprintId: `${planId}-g${t.groupNumber}`,
        storyPoints: t.storyPoints ?? 3,
        tags: t.tags,
        logs: `[Plan] Created from goal plan (${planId}). Risk tier: ${t.riskTier}\n`,
        chatHistory: [{
            id: `msg-init-${i}`,
            role: "system",
            senderName: "System",
            content: `Task created by Plan-from-Goal.\nGoal: ${goal}\nRationale: ${t.rationale || "-"}\nRisk tier: ${t.riskTier}. Safety nets: ${t.safetyNets.join(", ")}`,
            timestamp: now,
        }],
        activities: [{
            id: `act-plan-${Date.now()}-${i}`,
            taskId: `task-${Date.now()}-${i}`,
            stage: "PLAN",
            action: "create",
            message: `Created from goal plan (group ${t.groupNumber}, tags: ${t.tags.join("/") || "none"})`,
            timestamp: now,
        }],
        tokensUsed: { input: 0, output: 0, cost: 0 },
        createdAt: now,
        updatedAt: now,
    }));

    if (!project.tasks) project.tasks = [];
    project.tasks.push(...created);
    saveProjects(projects);
    return created;
}
