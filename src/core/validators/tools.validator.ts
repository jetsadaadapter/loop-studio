import { z } from "zod";
import type { ToolParam } from "../interfaces/tools.interface";

/**
 * Dynamically creates a Zod schema based on tool parameters.
 */
export function createToolExecutionSchema(params: ToolParam[]) {
    const shape: Record<string, z.ZodTypeAny> = {};

    params.forEach((param) => {
        let schema: z.ZodTypeAny;

        // Determine base schema by type
        switch (param.type) {
            case "number":
                schema = z.coerce.number({
                    message: `${param.label} must be a number`,
                });
                break;
            case "boolean":
                schema = z.boolean({
                    message: `${param.label} must be a boolean`,
                });
                break;
            case "select":
                if (param.options && param.options.length > 0) {
                    schema = z.enum(param.options as [string, ...string[]], {
                        message: `Please select a valid option for ${param.label}`,
                    });
                } else {
                    schema = z.string();
                }
                break;
            case "url":
                schema = z.string({ message: `${param.label} is required` }).url(`${param.label} must be a valid URL`);
                break;
            default:
                schema = z.string({ message: `${param.label} is required` });
        }

        // Apply transformations/special types
        if (param.transform === "urlArray") {
            schema = z.array(z.string().url("Must be a valid URL"), {
                message: `${param.label} is required`,
            }).min(param.required ? 1 : 0, `At least one ${param.label.toLowerCase()} is required`);
        }

        // Apply requirement
        if (param.required) {
            if (schema instanceof z.ZodString) {
                schema = schema.min(1, `${param.label} is required`);
            }
        } else {
            schema = schema.optional().nullable();
        }

        shape[param.key] = schema;
    });

    return z.object(shape);
}
