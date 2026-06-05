import { z } from "zod";

export const ManageUserSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required.")
    .max(50, "First name must be 50 characters or fewer."),
  lastName: z
    .string()
    .min(1, "Last name is required.")
    .max(50, "Last name must be 50 characters or fewer."),
  department: z
    .string()
    .min(1, "Department is required.")
    .max(100, "Department must be 100 characters or fewer."),
  position: z
    .string()
    .min(1, "Position is required.")
    .max(100, "Position must be 100 characters or fewer."),
  roles: z
    .array(z.string())
    .min(1, "At least one role is required."),
});

export type ManageUserFormValues = z.infer<typeof ManageUserSchema>;
