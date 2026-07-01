import { z } from "zod";

export const ManageApiKeySchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters.")
    .max(50, "Name must be 50 characters or fewer.")
    .trim(),
  webhookUrl: z
    .string()
    .url("Must be a valid URL (e.g., https://example.com/webhook)")
    .or(z.literal(""))
    .optional(),
  isActive: z.boolean().optional(),
  projectId: z.string().nullable().optional(),
});
