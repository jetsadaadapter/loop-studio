import { z } from "zod";

export const ManageTagSchema = z.object({
  name: z
    .string()
    .min(1, "Tag name is required.")
    .max(50, "Tag name must be 50 characters or fewer."),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color code.")
    .or(z.literal("")),
});

export type ManageTagFormValues = z.infer<typeof ManageTagSchema>;
