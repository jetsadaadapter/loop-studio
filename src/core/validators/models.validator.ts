import { z } from "zod";

export const AIModelSchema = z.object({
  modelSlug: z
    .string()
    .min(3, "Model slug must be at least 3 characters.")
    .regex(/^[a-z0-9.-]+$/, "Model slug must be lowercase, kebab-case, or contain dots (e.g., gemini-3.5-flash)."),
  name: z.string().min(3, "Name must be at least 3 characters."),
  provider: z.string().min(1, "Provider is required."),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

export type AIModelPayload = z.infer<typeof AIModelSchema>;
