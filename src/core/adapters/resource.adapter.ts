import { AppResourceSchema, type AppResource } from "@/core/validators/resource.validator";
import { ZodError } from "zod";

/**
 * Transforms raw external API payloads into validated internal AppResource types.
 * Parse once at the boundary; internal layers consume typed values only.
 */
export function adaptExternalResource(raw: unknown): AppResource {
    try {
        return AppResourceSchema.parse(raw);
    } catch (err) {
        if (err instanceof ZodError) {
            // Safe user-facing message — never expose raw stack traces
            throw new Error(
                `Invalid resource data: ${err.issues.map((i: { message: string }) => i.message).join(", ")}`
            );
        }
        throw err;
    }
}

export function adaptExternalResources(raw: unknown[]): AppResource[] {
    return raw.map(adaptExternalResource);
}
