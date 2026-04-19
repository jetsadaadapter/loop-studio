import { z } from "zod";

const APPROVED_ICON_HOSTS = ["cdn.company.com", "storage.googleapis.com"];

const iconUrlSchema = z
    .string()
    .url()
    .refine(
        (url) => {
            try {
                const { protocol, hostname } = new URL(url);
                return protocol === "https:" && APPROVED_ICON_HOSTS.includes(hostname);
            } catch {
                return false;
            }
        },
        { message: "iconUrl must be https and from an approved host" }
    );

export const ResourceType = z.enum(["APP", "MCP", "APIFY", "MEDIA"]);

export const BaseResourceSchema = z
    .object({
        id: z.string().uuid(),
        title: z.string().min(1).max(100),
        type: ResourceType,
        iconUrl: iconUrlSchema,
        description: z.string().max(500).optional(),
        version: z.string().max(30).optional(),
    })
    .strict();

export const MCPSchema = BaseResourceSchema.extend({
    type: z.literal("MCP"),
    config: z
        .object({
            command: z.string().min(1).max(256),
            args: z.array(z.string().max(256)).max(20),
            env: z.record(z.string(), z.string().max(256)).optional(),
        })
        .strict(),
}).strict();

export const ApifySchema = BaseResourceSchema.extend({
    type: z.literal("APIFY"),
    actorId: z.string().min(1).max(100),
    inputSchema: z.record(z.string(), z.unknown()).optional(),
}).strict();

export const MediaSchema = BaseResourceSchema.extend({
    type: z.literal("MEDIA"),
    mediaUrl: z
        .string()
        .url()
        .refine((url) => new URL(url).protocol === "https:", {
            message: "mediaUrl must use https",
        }),
}).strict();

export const AppSchema = BaseResourceSchema.extend({
    type: z.literal("APP"),
    appUrl: z
        .string()
        .url()
        .refine((url) => new URL(url).protocol === "https:", {
            message: "appUrl must use https",
        }),
}).strict();

export const AppResourceSchema = z.discriminatedUnion("type", [
    MCPSchema,
    ApifySchema,
    MediaSchema,
    AppSchema,
]);

export type ResourceTypeValue = z.infer<typeof ResourceType>;
export type AppResource = z.infer<typeof AppResourceSchema>;
export type MCPResource = z.infer<typeof MCPSchema>;
