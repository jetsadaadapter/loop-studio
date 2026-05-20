import { z } from "zod";

export const toolIdSchema = z.string().regex(/^01[A-Z0-9]{23,}$/);
