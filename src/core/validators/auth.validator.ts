import { z } from "zod";

const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN ?? "@company.com";

export const AuthTokenPayloadSchema = z
    .object({
        sub: z.string().min(1),
        email: z
            .string()
            .email()
            .refine((e) => e.endsWith(ALLOWED_DOMAIN), {
                message: `Only ${ALLOWED_DOMAIN} emails are allowed`,
            }),
        role: z.enum(["admin", "user", "viewer"]),
        name: z.string().max(100).optional(),
        image: z.string().url().optional(),
        iat: z.number(),
        exp: z.number(),
    })
    .strict();

export type AuthTokenPayload = z.infer<typeof AuthTokenPayloadSchema>;
