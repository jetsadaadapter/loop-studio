import { z } from "zod";

/**
 * Zod Schema Validator for Meta-Prompt Configuration
 *
 * This validates the JSON config output from the Meta-Prompt LLM
 * before it enters the analysis pipeline.
 */

// Section types enumeration
const SectionTypeEnum = z.enum([
  "bar_chart",
  "pie_chart",
  "table",
  "list",
  "scorecard",
  "heatmap",
]);

// Sentiment enumeration
const SentimentEnum = z.enum([
  "positive",
  "negative",
  "neutral",
  "mixed",
]);

// Function parameter property schema (recursive)
const FunctionPropertySchema: z.ZodType<{
  type: string;
  description?: string;
  enum?: string[];
  items?: Record<string, unknown>;
  properties?: Record<string, unknown>;
  required?: string[];
}> = z.lazy(() =>
  z.object({
    type: z.enum(["STRING", "BOOLEAN", "NUMBER", "ARRAY", "OBJECT"]),
    description: z.string().optional(),
    enum: z.array(z.string()).optional(),
    items: z.record(z.string(), z.unknown()).optional(),
    properties: z.record(z.string(), FunctionPropertySchema).optional(),
    required: z.array(z.string()).optional(),
  })
);

// Function declaration schema
const FunctionDeclarationSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-z][a-z0-9_]*$/, "Function name must be snake_case"),
  description: z.string().min(1),
  parameters: z.object({
    type: z.literal("OBJECT"),
    properties: z.record(z.string(), FunctionPropertySchema),
    required: z.array(z.string()),
  }),
});

// Blueprint section schema
const BlueprintSectionSchema = z.object({
  section_id: z
    .string()
    .regex(/^s\d+$/, "section_id must be s1, s2, s3, etc."),
  section_title: z.string().min(1, "section_title cannot be empty"),
  section_type: SectionTypeEnum,
  what_to_measure: z.string().min(1),
  signal_keywords: z.string().min(1),
  priority: z.number().int().positive(),
  labels: z.record(z.string(), z.string()).optional(),
});

// Blueprint schema
const BlueprintSchema = z.object({
  task_intent: z
    .string()
    .regex(
      /^[a-z_]+$/,
      "task_intent must be snake_case"
    )
    .refine(
      (val) => val.split("_").length <= 4,
      "task_intent must be max 4 words"
    ),
  task_description: z.string().min(1),
  analysis_focus: z.string().min(1),
  sections: z
    .array(BlueprintSectionSchema)
    .min(2, "Must have at least 2 sections")
    .max(5, "Cannot exceed 5 sections"),
  overall_sentiment_focus: SentimentEnum,
  confidence_note: z.string().min(1),
});

// Preview schema
const PreviewSchema = z.object({
  startUrls: z.array(z.string().url()).min(1, "Must have at least 1 URL"),
  goal: z.string().min(1),
  generatedSystemPrompt: z.string().min(1),
  expectedOutputSchema: z.object({
    description: z.string().min(1),
  }),
});

// Input schema
const InputSchema = z.object({
  startUrls: z
    .array(
      z.object({
        url: z.string().url(),
      })
    )
    .min(1, "Must have at least 1 URL"),
});

// Config schema
const ConfigSchema = z.object({
  model: z.string().default("gemini-2.5-flash"),
  temperature: z.number().min(0).max(2).default(0),
  prompt: z
    .string()
    .min(1)
    .refine(
      (val) => !val.includes("[fill:"),
      "Prompt must not contain unresolved [fill:...] placeholders"
    )
    .refine(
      (val) => val.includes("{{currentItem}}"),
      "Prompt must contain {{currentItem}} placeholder for Apify injection"
    ),
  tools: z.object({
    function_declarations: z.array(FunctionDeclarationSchema).min(1),
  }),
});

// Main Meta-Prompt Config Schema
export const MetaPromptConfigSchema = z.object({
  preview: PreviewSchema,
  input: InputSchema,
  config: ConfigSchema,
  blueprint: BlueprintSchema,
});

// Type inference
export type MetaPromptConfig = z.infer<typeof MetaPromptConfigSchema>;
export type BlueprintSection = z.infer<typeof BlueprintSectionSchema>;
export type FunctionDeclaration = z.infer<typeof FunctionDeclarationSchema>;

/**
 * Validates Meta-Prompt Config with detailed error reporting
 */
export function validateMetaPromptConfig(
  data: unknown
): { success: true; data: MetaPromptConfig } | { success: false; errors: string[] } {
  const result = MetaPromptConfigSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.issues.map((err) => {
    const path = err.path.join(".");
    return `[${path}] ${err.message}`;
  });

  return { success: false, errors };
}

/**
 * Cross-validates that blueprint.sections[].labels keys match
 * config.tools.function_declarations[].parameters.properties keys
 */
export function validateLabelPropertyAlignment(
  config: MetaPromptConfig
): { valid: true } | { valid: false; errors: string[] } {
  const errors: string[] = [];

  const { sections } = config.blueprint;
  const { function_declarations } = config.config.tools;

  // Assumption: 1 function per section
  if (sections.length !== function_declarations.length) {
    errors.push(
      `Mismatch: ${sections.length} sections but ${function_declarations.length} function declarations`
    );
  }

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const func = function_declarations[i];

    if (!section || !func) continue;

    const sectionLabels = Object.keys(section.labels || {});
    const functionProps = Object.keys(func.parameters.properties || {});

    const missingInFunction = sectionLabels.filter((key) => !functionProps.includes(key));
    const missingInSection = functionProps.filter((key) => !sectionLabels.includes(key));

    if (missingInFunction.length > 0) {
      errors.push(
        `Section "${section.section_id}" has labels [${missingInFunction.join(", ")}] ` +
          `missing in function "${func.name}" properties`
      );
    }

    if (missingInSection.length > 0) {
      errors.push(
        `Function "${func.name}" has properties [${missingInSection.join(", ")}] ` +
          `missing in section "${section.section_id}" labels`
      );
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}

/**
 * Full validation pipeline
 */
export function validateMetaPromptConfigFull(data: unknown): {
  success: boolean;
  data?: MetaPromptConfig;
  errors?: string[];
} {
  // Step 1: Schema validation
  const schemaValidation = validateMetaPromptConfig(data);
  if (!schemaValidation.success) {
    return { success: false, errors: schemaValidation.errors };
  }

  // Step 2: Cross-field validation (labels ↔ properties)
  const alignmentValidation = validateLabelPropertyAlignment(schemaValidation.data);
  if (!alignmentValidation.valid) {
    return { success: false, errors: alignmentValidation.errors };
  }

  return { success: true, data: schemaValidation.data };
}
