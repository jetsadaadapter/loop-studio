import { z } from "zod";

// Validation schemas for every form/boundary under Loop DevStudio. Used both at the
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
    path: absolutePath,
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
});

// Every field optional for PATCH; at least one must be present.
export const UpdateAgentSchema = CreateAgentSchema.partial().refine(
    (data) => Object.keys(data).length > 0,
    { message: "No fields to update." },
);

export type RegisterProjectInput = z.infer<typeof RegisterProjectSchema>;
export type BootstrapProjectInput = z.infer<typeof BootstrapProjectSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type CreateAgentInput = z.infer<typeof CreateAgentSchema>;
export type UpdateAgentInput = z.infer<typeof UpdateAgentSchema>;
