import { z } from "zod";

export const ManageBannerSchema = z.object({
  title: z.string().min(1, "Title is required."),
  subtitle: z.string().min(1, "Subtitle is required."),
  imageId: z.string().min(1, "Banner image is required."),
  appId: z.string().min(1, "Selecting an app is required."),
  sortOrder: z.number().int().nonnegative("Sort order must be a non-negative integer."),
  isActive: z.boolean().default(true),
  startsAt: z.string().nullable(),
  endsAt: z.string().nullable(),
}).refine((data) => {
  if (data.startsAt && data.endsAt) {
    return new Date(data.startsAt) <= new Date(data.endsAt);
  }
  return true;
}, {
  message: "End date must be after start date.",
  path: ["endsAt"],
});
