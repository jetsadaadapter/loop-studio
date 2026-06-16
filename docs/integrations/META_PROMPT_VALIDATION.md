# Meta-Prompt Configuration Validation Guide

## Overview

This document describes the validation system for the Facebook social media analysis pipeline's **Meta-Prompt Architecture**. The system ensures that LLM-generated configurations are correct before entering the analysis pipeline.

## Architecture Flow

```
[User Input]
     │
     ▼
[Meta-Prompt LLM] → Generates Config JSON
     │
     ▼
[Validation Layer] ← Zod Schema Validator
     │
     ├─ ✅ Valid → [Apify Pipeline]
     │
     └─ ❌ Invalid → [Error Report to User]
```

## Validation Files

### Core Validators

1. **[meta-prompt-config.validator.ts](../../src/core/validators/meta-prompt-config.validator.ts)**
   - Validates Meta-Prompt Config (PROMPT A output)
   - Checks schema structure, field types, and constraints
   - Validates cross-field alignment (labels ↔ properties)

2. **[analyzer-output.validator.ts](../../src/core/validators/analyzer-output.validator.ts)**
   - Validates Analyzer Output (PROMPT B output)
   - Checks structured report format
   - Validates section references and nested array rules

## Meta-Prompt Config Schema

### Top-Level Structure

```typescript
{
  preview: PreviewSchema,
  input: InputSchema,
  config: ConfigSchema,
  blueprint: BlueprintSchema
}
```

### Schema Rules

#### 1. Preview Schema

```typescript
preview: {
  startUrls: string[],           // All URLs as plain strings
  goal: string,                   // Thai summary, 1 sentence
  generatedSystemPrompt: string,  // English prompt
  expectedOutputSchema: {
    description: string
  }
}
```

**Validation:**
- ✅ `startUrls` must have at least 1 valid URL
- ✅ All fields required and non-empty

#### 2. Input Schema

```typescript
input: {
  startUrls: [
    { url: "https://..." },
    { url: "https://..." }
  ]
}
```

**Validation:**
- ✅ Must have at least 1 URL object
- ✅ Each URL must be valid (protocol + domain)

#### 3. Config Schema

```typescript
config: {
  model: "gemini-2.5-flash",
  temperature: 0,
  prompt: "...",
  tools: {
    function_declarations: [...]
  }
}
```

**Validation:**
- ✅ `prompt` must not contain unresolved `[fill:...]` placeholders
- ✅ `prompt` must contain `{{currentItem}}` placeholder
- ✅ `tools.function_declarations` must be an array (not nested object)
- ✅ Each function name must be `snake_case`

#### 4. Blueprint Schema

```typescript
blueprint: {
  task_intent: "snake_case_max_4_words",
  task_description: "Thai description",
  analysis_focus: "What to extract",
  sections: [
    {
      section_id: "s1",                    // Must be s1, s2, s3, etc.
      section_title: "Thai title",
      section_type: "pie_chart",           // Enum: bar_chart | pie_chart | table | list | scorecard | heatmap
      what_to_measure: "Description",
      signal_keywords: "keyword,list",
      priority: 1,
      labels: {
        "property_key": "Thai label"       // Must match function properties
      }
    }
  ],
  overall_sentiment_focus: "mixed",        // Enum: positive | negative | neutral | mixed
  confidence_note: "Thai note"
}
```

**Validation:**
- ✅ `task_intent` must be `snake_case` with max 4 words
- ✅ `sections` must have 2-5 items
- ✅ `section_id` must match pattern `s\d+` (s1, s2, s3, etc.)
- ✅ `section_type` must be one of valid enum values
- ✅ `labels` keys must match function declaration properties exactly

### Cross-Field Validation

**CRITICAL RULE:** `blueprint.sections[].labels` keys **MUST** match `config.tools.function_declarations[].parameters.properties` keys exactly.

#### ✅ Valid Example

```json
{
  "blueprint": {
    "sections": [
      {
        "section_id": "s1",
        "labels": {
          "intent_group": "กลุ่มเจตนา",
          "mention_count": "จำนวน"
        }
      }
    ]
  },
  "config": {
    "tools": {
      "function_declarations": [
        {
          "name": "analyze_purchase_intent",
          "parameters": {
            "type": "OBJECT",
            "properties": {
              "intent_group": {
                "type": "STRING",
                "description": "Purchase intent category"
              },
              "mention_count": {
                "type": "NUMBER",
                "description": "Number of mentions"
              }
            }
          }
        }
      ]
    }
  }
}
```

#### ❌ Invalid Example (Mismatch)

```json
{
  "blueprint": {
    "sections": [
      {
        "labels": {
          "intent_group": "กลุ่มเจตนา",
          "count": "จำนวน"              // ❌ Different key name
        }
      }
    ]
  },
  "config": {
    "tools": {
      "function_declarations": [
        {
          "parameters": {
            "properties": {
              "intent_group": {...},
              "mention_count": {...}     // ❌ No matching "count" key
            }
          }
        }
      ]
    }
  }
}
```

## Analyzer Output Schema

### Top-Level Structure

```typescript
{
  meta: MetaSchema,
  summary: SummarySchema,
  section_meta: SectionMetaSchema[],
  section_rows: SectionRowSchema[],
  highlights: HighlightSchema[],      // Max 3 items
  insights: InsightSchema[]
}
```

### Schema Rules

#### 1. Meta Schema

```typescript
meta: {
  task_intent: string,
  comments_count: number,              // Non-negative integer
  analyzed_at: string,                 // ISO8601 datetime
  data_quality: "good" | "partial" | "poor"
}
```

#### 2. Summary Schema

```typescript
summary: {
  one_line: string,                    // Thai summary, 1 sentence
  overall_sentiment: "positive" | "negative" | "neutral" | "mixed",
  confidence_score: number             // 0.0 - 1.0
}
```

#### 3. Section Row Schema

```typescript
section_rows: [
  {
    section_id: "s1",                  // Must match section_meta
    section_type: string,
    row_id: "s1_i1",                   // Must be sX_iY format
    label: string,
    value: string | number,
    percent: "42%",                    // Must be XX% format
    sentiment: "positive" | "negative" | "neutral",
    note: string                       // Optional
  }
]
```

**Validation:**
- ✅ `section_id` must reference valid `section_meta[].section_id`
- ✅ `row_id` must match pattern `s\d+_i\d+` (e.g., s1_i1, s2_i3)
- ✅ `percent` must be in `XX%` format (e.g., "42%")
- ✅ `sentiment` must be exactly one of enum values

#### 4. Highlight Schema

```typescript
highlights: [
  {
    highlight_id: string,
    comment_text: string,              // Verbatim only, never fabricated
    reason: string,                    // Thai explanation
    sentiment: "positive" | "negative" | "neutral",
    tags: string                       // Comma-separated
  }
]
```

**Validation:**
- ✅ Maximum 3 highlights allowed
- ✅ `comment_text` must be verbatim, cannot be empty

#### 5. Insight Schema

```typescript
insights: [
  {
    scope: "item" | "cross_item" | "post" | "cross_post",
    insight_text: string,              // Thai, 2-3 sentences
    post_id: string | null             // Optional
  }
]
```

### Critical Rules

#### RULE 5: No Nested Arrays

**❌ FORBIDDEN:**

```json
{
  "section_rows": [
    {
      "tags": ["tag1", ["nested", "array"]]   // ❌ Arrays inside arrays
    }
  ]
}
```

**✅ CORRECT:**

```json
{
  "section_rows": [
    {
      "tags": "tag1,nested,array"            // ✅ Comma-separated string
    }
  ]
}
```

The validator will detect and reject nested arrays at any depth.

## Usage Examples

### 1. Validate Meta-Prompt Config

```typescript
import { validateMetaPromptConfigFull } from "@/core/validators/meta-prompt-config.validator";

// After LLM generates config
const llmOutput = await metaPromptLLM.generate(userInput);
const parsed = JSON.parse(llmOutput);

// Full validation
const result = validateMetaPromptConfigFull(parsed);

if (!result.success) {
  console.error("Validation errors:", result.errors);
  // Display errors to user
  return;
}

// Safe to use
const validConfig = result.data;
await apifyPipeline.run(validConfig);
```

### 2. Validate Analyzer Output

```typescript
import { 
  validateAnalyzerOutputFull,
  extractJsonFromLLMOutput 
} from "@/core/validators/analyzer-output.validator";

// After analyzer LLM generates output
const rawOutput = await analyzerLLM.generate(prompt);

// Extract JSON from potential markdown wrapper
let parsed;
try {
  parsed = extractJsonFromLLMOutput(rawOutput);
} catch (error) {
  console.error("Failed to parse JSON:", error.message);
  return;
}

// Full validation
const result = validateAnalyzerOutputFull(parsed);

if (!result.success) {
  console.error("Validation errors:", result.errors);
  return;
}

// Safe to use
const validOutput = result.data;
await renderDashboard(validOutput);
```

### 3. Frontend Integration

```typescript
// In API route or server action
import { validateMetaPromptConfigFull } from "@/core/validators/meta-prompt-config.validator";

export async function POST(request: Request) {
  const { userInput } = await request.json();

  // Generate config with Meta-Prompt LLM
  const configJson = await generateMetaPromptConfig(userInput);

  // Validate before proceeding
  const validation = validateMetaPromptConfigFull(configJson);

  if (!validation.success) {
    return Response.json(
      { 
        error: "Invalid configuration", 
        details: validation.errors 
      },
      { status: 400 }
    );
  }

  // Proceed with valid config
  const job = await createAnalysisJob(validation.data);

  return Response.json({ jobId: job.id });
}
```

## Error Messages

### Common Validation Errors

#### 1. Unresolved Placeholders

```
[config.prompt] Prompt must not contain unresolved [fill:...] placeholders
```

**Fix:** Ensure all `[fill:...]` are replaced before validation:

```typescript
let prompt = template;
prompt = prompt.replace("[fill: preview.goal]", config.preview.goal);
prompt = prompt.replace("[fill: JSON.stringify(blueprint, null, 2)]", JSON.stringify(config.blueprint, null, 2));
```

#### 2. Label-Property Mismatch

```
Section "s1" has labels [mention_count] missing in function "analyze_intent" properties
```

**Fix:** Add the missing property to function declaration or remove from labels.

#### 3. Invalid section_id Format

```
[blueprint.sections.0.section_id] section_id must be s1, s2, s3, etc.
```

**Fix:** Use correct format: `s1`, `s2`, `s3` (not `section1`, `sec_1`, etc.)

#### 4. Nested Arrays Detected

```
Nested array detected at section_rows[0].tags — FORBIDDEN (use comma-separated strings instead)
```

**Fix:** Convert array to comma-separated string:

```typescript
// ❌ Before
tags: ["tag1", "tag2"]

// ✅ After
tags: "tag1,tag2"
```

## Testing

### Unit Tests

```typescript
import { validateMetaPromptConfigFull } from "@/core/validators/meta-prompt-config.validator";

describe("Meta-Prompt Config Validator", () => {
  it("should accept valid config", () => {
    const validConfig = {
      preview: { /* ... */ },
      input: { /* ... */ },
      config: { /* ... */ },
      blueprint: { /* ... */ }
    };

    const result = validateMetaPromptConfigFull(validConfig);
    expect(result.success).toBe(true);
  });

  it("should reject config with unresolved placeholders", () => {
    const invalidConfig = {
      config: {
        prompt: "Goal: [fill: preview.goal]"  // ❌ Unresolved
      }
    };

    const result = validateMetaPromptConfigFull(invalidConfig);
    expect(result.success).toBe(false);
    expect(result.errors).toContain(
      expect.stringContaining("unresolved [fill:...] placeholders")
    );
  });
});
```

## Integration with Dynamic Layout Visualizer

The validated output automatically works with the existing dynamic layout system:

```typescript
import { generateDynamicLayoutFromSchema } from "@/app/tool/[id]/components/visualizer/tabs/tab-output-dynamic-schema";

// After validation
const validOutput = validateAnalyzerOutputFull(llmOutput).data;

// Generate UI sections
const dynamicLayout = generateDynamicLayoutFromSchema(
  job,
  [validOutput]  // Pass as array of items
);

// Render dashboard
<DynamicLayoutVisualizer items={dynamicLayout} />
```

## Performance Considerations

### Validation Cost

- **Schema validation**: ~2-5ms for typical config
- **Cross-field validation**: ~1-3ms
- **Total overhead**: <10ms per validation

### Caching Strategy

```typescript
// Cache validation results for same config hash
const configHash = hashObject(configJson);
const cached = validationCache.get(configHash);

if (cached) {
  return cached;
}

const result = validateMetaPromptConfigFull(configJson);
validationCache.set(configHash, result);
return result;
```

## Future Enhancements

- [ ] Add auto-repair for common issues (e.g., fix `percent` format)
- [ ] Support custom validation rules per tool type
- [ ] Generate TypeScript types from validated schemas
- [ ] Add validation warnings (non-blocking issues)
- [ ] Support partial validation for streaming LLM output
- [ ] Add validation metrics dashboard
- [ ] Generate JSON Schema for external tools

## Related Files

- [meta-prompt-config.validator.ts](../../src/core/validators/meta-prompt-config.validator.ts)
- [analyzer-output.validator.ts](../../src/core/validators/analyzer-output.validator.ts)
- [tab-output-dynamic-schema.ts](../../src/app/tool/[id]/components/visualizer/tabs/tab-output-dynamic-schema.ts)
- [FACEBOOK_ANALYST_INTEGRATION.md](./FACEBOOK_ANALYST_INTEGRATION.md)
- [EXECUTION_SUMMARY_RENDERER.md](./EXECUTION_SUMMARY_RENDERER.md)

## Support

For validation issues:

1. Check error message details
2. Verify LLM output format
3. Test with example valid config
4. Review schema definitions in validator files
5. Check console for detailed error paths

---

**Last Updated:** June 15, 2026  
**Maintained By:** AdapterWorks Engineering Team
