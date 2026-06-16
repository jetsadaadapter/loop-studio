import { z } from "zod";

/**
 * Zod Schema Validator for Analyzer LLM Output (PROMPT B)
 *
 * This validates the structured JSON output returned by the
 * downstream analysis LLM that follows the blueprint.
 */

// Sentiment enumeration (strict)
const SentimentEnum = z.enum(["positive", "negative", "neutral", "mixed"]);

// Data quality enumeration
const DataQualityEnum = z.enum(["good", "partial", "poor"]);

// Meta section schema
const MetaSchema = z.object({
  task_intent: z.string().min(1),
  comments_count: z.number().int().nonnegative().default(0),
  analyzed_at: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, "Must be ISO8601 datetime")),
  data_quality: DataQualityEnum.default("good"),
});

// Summary section schema
const SummarySchema = z.object({
  one_line: z.string().min(1, "one_line summary cannot be empty"),
  overall_sentiment: SentimentEnum,
  confidence_score: z.number().min(0).max(1).default(0),
});

// Section meta schema
const SectionMetaSchema = z.object({
  section_id: z.string().regex(/^s\d+$/, "section_id must be s1, s2, s3, etc."),
  section_title: z.string().min(1),
  section_type: z.string().min(1),
  section_note: z.string().optional(),
  total_items: z.number().int().nonnegative().default(0),
});

// Section row schema
const SectionRowSchema = z.object({
  section_id: z.string().regex(/^s\d+$/, "section_id must be s1, s2, s3, etc."),
  section_type: z.string().min(1),
  row_id: z.string().regex(/^s\d+_i\d+$/, "row_id must be sX_iY format (e.g., s1_i1)"),
  label: z.string().min(1),
  value: z.union([z.string(), z.number()]),
  percent: z
    .string()
    .regex(/^\d+%$/, "percent must be in XX% format (e.g., 42%)")
    .optional(),
  sentiment: SentimentEnum.optional(),
  note: z.string().optional(),
  // Additional fields for flexibility
  total_comments: z.number().int().nonnegative().optional(),
  comment_count: z.number().int().nonnegative().optional(),
  overall_percent: z.string().optional(),
  tags: z.string().optional(),
});

// Highlight schema
const HighlightSchema = z.object({
  highlight_id: z.string().min(1),
  comment_text: z.string().min(1, "comment_text must be verbatim, cannot be empty"),
  reason: z.string().min(1),
  sentiment: SentimentEnum,
  tags: z.string().optional(), // Comma-separated
});

// Insight schema
const InsightSchema = z.object({
  scope: z.enum(["item", "cross_item", "post", "cross_post"]),
  insight_text: z.string().min(1, "insight_text cannot be empty"),
  post_id: z.string().optional().nullable(),
});

// Main Analyzer Output Schema
export const AnalyzerOutputSchema = z.object({
  meta: MetaSchema,
  summary: SummarySchema,
  section_meta: z.array(SectionMetaSchema).min(1, "Must have at least 1 section_meta"),
  section_rows: z.array(SectionRowSchema).min(0),
  highlights: z.array(HighlightSchema).max(3, "highlights max 3 items"),
  insights: z.array(InsightSchema).min(1, "Must have at least 1 insight"),
});

// Type inference
export type AnalyzerOutput = z.infer<typeof AnalyzerOutputSchema>;
export type SectionRow = z.infer<typeof SectionRowSchema>;
export type Highlight = z.infer<typeof HighlightSchema>;
export type Insight = z.infer<typeof InsightSchema>;

/**
 * Validates Analyzer Output with detailed error reporting
 */
export function validateAnalyzerOutput(
  data: unknown
): { success: true; data: AnalyzerOutput } | { success: false; errors: string[] } {
  const result = AnalyzerOutputSchema.safeParse(data);

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
 * Cross-validates that section_rows[].section_id references
 * valid section_meta[].section_id
 */
export function validateSectionRowReferences(
  output: AnalyzerOutput
): { valid: true } | { valid: false; errors: string[] } {
  const errors: string[] = [];

  const validSectionIds = new Set(output.section_meta.map((s) => s.section_id));
  const referencedIds = new Set(output.section_rows.map((r) => r.section_id));

  for (const refId of referencedIds) {
    if (!validSectionIds.has(refId)) {
      errors.push(
        `section_rows references invalid section_id "${refId}" ` +
          `(valid: ${Array.from(validSectionIds).join(", ")})`
      );
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}

/**
 * Validates that arrays-inside-arrays are not present
 * (RULE 5: Arrays-inside-arrays FORBIDDEN)
 */
export function validateNoNestedArrays(
  data: unknown,
  path = "root"
): { valid: true } | { valid: false; errors: string[] } {
  const errors: string[] = [];

  function traverse(obj: unknown, currentPath: string): void {
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        const item = obj[i];
        if (Array.isArray(item)) {
          errors.push(
            `Nested array detected at ${currentPath}[${i}] — FORBIDDEN (use comma-separated strings instead)`
          );
        }
        traverse(item, `${currentPath}[${i}]`);
      }
    } else if (obj !== null && typeof obj === "object") {
      for (const [key, value] of Object.entries(obj)) {
        traverse(value, `${currentPath}.${key}`);
      }
    }
  }

  traverse(data, path);

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}

/**
 * Full validation pipeline for Analyzer Output
 */
export function validateAnalyzerOutputFull(data: unknown): {
  success: boolean;
  data?: AnalyzerOutput;
  errors?: string[];
} {
  // Step 1: Check for nested arrays (RULE 5)
  const nestedArrayCheck = validateNoNestedArrays(data);
  if (!nestedArrayCheck.valid) {
    return { success: false, errors: nestedArrayCheck.errors };
  }

  // Step 2: Schema validation
  const schemaValidation = validateAnalyzerOutput(data);
  if (!schemaValidation.success) {
    return { success: false, errors: schemaValidation.errors };
  }

  // Step 3: Cross-reference validation (section_id references)
  const refValidation = validateSectionRowReferences(schemaValidation.data);
  if (!refValidation.valid) {
    return { success: false, errors: refValidation.errors };
  }

  return { success: true, data: schemaValidation.data };
}

/**
 * Utility: Extract errors from LLM output that may be wrapped in markdown
 */
export function extractJsonFromLLMOutput(rawOutput: string): unknown {
  // Remove markdown code fences
  let cleaned = rawOutput.trim();

  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/```\s*$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/```\s*$/, "");
  }

  // Remove BOM and zero-width characters
  cleaned = cleaned.replace(/^﻿/, "").replace(/[​-‍﻿]/g, "");

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    throw new Error(`Failed to parse JSON from LLM output: ${(error as Error).message}`);
  }
}
