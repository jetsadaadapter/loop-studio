import { z } from "zod";

/**
 * Signed install request — validated at the API boundary before any execution.
 * command must be resolved from a server-side allowlist; never trust client-supplied command values.
 */
export const InstallRequestSchema = z
    .object({
        resourceId: z.string().uuid(),
        version: z.string().min(1).max(30),
        checksum: z.string().regex(/^[a-f0-9]{64}$/).refine((v) => v.length === 64, "Must be a SHA-256 hex string"),
        publisher: z.string().min(1).max(100),
        signature: z.string().min(1),
    })
    .strict();

export type InstallRequest = z.infer<typeof InstallRequestSchema>;

export const AuditEventSchema = z
    .object({
        action: z.enum(["requested", "approved", "installed", "failed"]),
        resourceId: z.string().uuid(),
        actorId: z.string().min(1),
        actorEmail: z.string().email(),
        timestamp: z.string().datetime(),
        metadata: z.record(z.string(), z.string()).optional(),
    })
    .strict();

export type AuditEvent = z.infer<typeof AuditEventSchema>;
