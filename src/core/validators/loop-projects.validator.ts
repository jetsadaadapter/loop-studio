import { z } from "zod";

/**
 * Map a ZodError to one message per field (first issue wins), keyed by the
 * field's path — powers per-field <FieldError> rendering in the form modals
 * instead of the browser's native `required` tooltips.
 */
export function zodFieldErrors(error: z.ZodError): Record<string, string> {
    const out: Record<string, string> = {};
    for (const issue of error.issues) {
        const key = issue.path.join(".") || "_form";
        if (!out[key]) out[key] = issue.message;
    }
    return out;
}

// Validation schemas for every form/boundary under Loop Studio. Used both at the
// API routes (authoritative) and in the modals (instant field-level feedback), so the
// two never drift.

// A preview target is either blank, an http(s) dev-server URL, or a same-repo path.
const previewUrlField = z
    .string()
    .trim()
    .refine((v) => v === "" || /^https?:\/\//.test(v) || v.startsWith("/"), {
        message: "Enter an http(s) URL or a path starting with /.",
    })
    .optional()
    .or(z.literal(""));

// An absolute POSIX path (the project lives on the server's local disk).
const absolutePath = z
    .string()
    .trim()
    .min(1, "Directory path is required.")
    .refine((v) => v.startsWith("/"), { message: "Path must be absolute (start with /)." });

export const RegisterProjectSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Project name must be at least 2 characters.")
        .max(60, "Project name must be 60 characters or fewer."),
    path: absolutePath,
    template: z.string().trim().min(1, "Template is required.").default("nextjs-app"),
    previewUrl: previewUrlField,
});

export const BootstrapProjectSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Project name must be at least 2 characters.")
        .max(60, "Project name must be 60 characters or fewer."),
    // Blank = the server creates the folder under its .projects/ workspace root.
    path: z
        .string()
        .trim()
        .refine((v) => v === "" || v.startsWith("/"), { message: "Path must be absolute (start with /)." })
        .optional()
        .or(z.literal("")),
    template: z.string().trim().min(1, "Template is required.").default("nextjs-app"),
});

export const CreateTaskSchema = z.object({
    name: z
        .string()
        .trim()
        .min(3, "Task title must be at least 3 characters.")
        .max(120, "Task title must be 120 characters or fewer."),
    targetFiles: z
        .array(z.string().trim().min(1))
        .min(1, "Add at least one target file.")
        .max(20, "A task can target at most 20 files."),
});

// Every field optional for PATCH; at least one must be present. Built field-by-
// field (not RegisterProjectSchema.partial()) because template's .default()
// would survive partial() and silently reset the template on unrelated updates.
export const UpdateProjectSchema = z
    .object({
        name: z.string().trim().min(2, "Project name must be at least 2 characters.").max(60, "Project name must be 60 characters or fewer.").optional(),
        path: absolutePath.optional(),
        template: z.string().trim().min(1, "Template is required.").optional(),
        previewUrl: previewUrlField,
        // "" clears the setting (off); "claude"/"gemini"/"claude-sdk" select an auto-fulfill agent.
        autoAgent: z.enum(["claude", "gemini", "claude-sdk", ""]).optional(),
        // Isolate each task in its own git worktree + loop/task-* branch (checkpoints).
        useWorktree: z.boolean().optional(),
    })
    .refine((data) => Object.values(data).some((v) => v !== undefined), { message: "No fields to update." });

// Heartbeat schedule. Minimum 15 minutes: a headless auto-run burns tokens and
// spawns build/test processes, so a tighter cadence would be reckless.
export const UpdateScheduleSchema = z.object({
    enabled: z.boolean(),
    intervalMinutes: z.number().int().min(15, "Interval must be at least 15 minutes.").max(1440, "Interval must be 24 hours or less."),
});

export const PlanFromGoalSchema = z.object({
    goal: z
        .string()
        .trim()
        .min(10, "Describe the goal in at least 10 characters.")
        .max(2000, "Goal must be 2000 characters or fewer."),
    apply: z.boolean().optional().default(false),
});

// Shape the Architect LLM must return when decomposing a goal. Validated before
// any task is created so a malformed model reply can never corrupt the store.
const PlannedTaskSchema = z.object({
    name: z.string().trim().min(3).max(120),
    targetFiles: z.array(z.string().trim().min(1)).min(1).max(20),
    rationale: z.string().trim().max(500).optional(),
    priority: z.enum(["low", "medium", "high", "critical"]).optional(),
    storyPoints: z.number().int().min(1).max(13).optional(),
    tags: z.array(z.string().trim().min(1)).max(10).optional(),
    group: z.string().trim().min(1).max(60).optional(),
});

export const GoalPlanSchema = z.object({
    tasks: z.array(PlannedTaskSchema).min(1, "Plan must contain at least one task.").max(15, "Plan may contain at most 15 tasks."),
});

// A single path segment (folder name): no separators, no traversal, no leading dot-dot.
const folderName = z
    .string()
    .trim()
    .min(1, "Folder name is required.")
    .max(80, "Folder name must be 80 characters or fewer.")
    .refine((v) => !/[/\\]/.test(v) && v !== "." && v !== "..", { message: "Folder name cannot contain path separators." });

export const FolderActionSchema = z.discriminatedUnion("action", [
    z.object({ action: z.literal("mkdir"), path: absolutePath, name: folderName }),
    z.object({ action: z.literal("rename"), path: absolutePath, newName: folderName }),
    z.object({ action: z.literal("delete"), path: absolutePath }),
]);

export const CreateAgentSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Agent name must be at least 2 characters.")
        .max(60, "Agent name must be 60 characters or fewer."),
    role: z
        .string()
        .trim()
        .min(2, "Role is required.")
        .max(80, "Role must be 80 characters or fewer."),
    model: z.string().trim().min(1, "Model is required."),
    systemPrompt: z
        .string()
        .trim()
        .min(10, "System prompt must be at least 10 characters."),
    skills: z.array(z.string()).default([]),
    gender: z.enum(["male", "female"]).optional(),
});

// Every field optional for PATCH; at least one must be present.
export const UpdateAgentSchema = CreateAgentSchema.partial().refine(
    (data) => Object.keys(data).length > 0,
    { message: "No fields to update." },
);

export type PlanFromGoalInput = z.infer<typeof PlanFromGoalSchema>;
export type GoalPlan = z.infer<typeof GoalPlanSchema>;
export type PlannedTask = GoalPlan["tasks"][number];

export type RegisterProjectInput = z.infer<typeof RegisterProjectSchema>;
export type BootstrapProjectInput = z.infer<typeof BootstrapProjectSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type CreateAgentInput = z.infer<typeof CreateAgentSchema>;
export type UpdateAgentInput = z.infer<typeof UpdateAgentSchema>;
