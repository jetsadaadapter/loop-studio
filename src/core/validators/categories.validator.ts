import { z } from "zod";

export const ManageCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required.")
    .max(50, "Category name must be 50 characters or fewer."),
});

export type ManageCategoryFormValues = z.infer<typeof ManageCategorySchema>;
