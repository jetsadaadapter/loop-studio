# Validator Usage Examples

## Overview

This document shows real-world examples of how to use the Meta-Prompt Config and Analyzer Output validators in your application.

---

## 1. Meta-Prompt Config Validation

### When to Use

Validate **after** Meta-Prompt LLM generates config JSON, **before** sending to Apify Pipeline.

### Basic Usage

```typescript
import { validateMetaPromptConfigFull } from "@/core/validators/meta-prompt-config.validator";

// After LLM generates config
const configJson = await metaPromptLLM.generate(userInput);

// Validate
const result = validateMetaPromptConfigFull(configJson);

if (!result.success) {
  console.error("Validation errors:", result.errors);
  throw new Error("Invalid config");
}

// Safe to use
const validConfig = result.data;
await apifyPipeline.run(validConfig);
```

---

## 2. API Route Example (Next.js App Router)

### File: `src/app/api/analyze/meta-prompt/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { validateMetaPromptConfigFull } from "@/core/validators/meta-prompt-config.validator";
import { generateMetaPromptConfig } from "@/core/services/llm.service";
import { createApifyJob } from "@/core/services/apify.service";

export async function POST(request: NextRequest) {
  try {
    const { userInput } = await request.json();

    if (!userInput || typeof userInput !== "string") {
      return NextResponse.json(
        { error: "userInput is required and must be a string" },
        { status: 400 }
      );
    }

    // Step 1: Generate config with Meta-Prompt LLM
    console.log("[Meta-Prompt] Generating config from user input...");
    const rawConfig = await generateMetaPromptConfig(userInput);

    // Step 2: Parse JSON (handle potential markdown wrappers)
    let configJson: unknown;
    try {
      configJson = typeof rawConfig === "string" 
        ? JSON.parse(rawConfig) 
        : rawConfig;
    } catch (parseError) {
      return NextResponse.json(
        { 
          error: "Failed to parse LLM output as JSON",
          details: (parseError as Error).message
        },
        { status: 500 }
      );
    }

    // Step 3: 🔍 VALIDATE
    console.log("[Meta-Prompt] Validating config structure...");
    const validation = validateMetaPromptConfigFull(configJson);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid Meta-Prompt Configuration",
          validationErrors: validation.errors,
          rawConfig: configJson, // For debugging
        },
        { status: 400 }
      );
    }

    // Step 4: Create Apify job with validated config
    console.log("[Meta-Prompt] Config valid ✓ Creating Apify job...");
    const job = await createApifyJob(validation.data);

    return NextResponse.json({
      success: true,
      jobId: job.id,
      config: validation.data,
    });

  } catch (error) {
    console.error("[Meta-Prompt] Error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}
```

---

## 3. Analyzer Output Validation

### When to Use

Validate **after** Gemini/Analysis LLM returns structured report, **before** rendering UI.

### Basic Usage

```typescript
import { 
  validateAnalyzerOutputFull,
  extractJsonFromLLMOutput 
} from "@/core/validators/analyzer-output.validator";

// After analyzer LLM generates output
const rawOutput = await analyzerLLM.generate(prompt);

// Extract JSON (removes markdown wrappers)
let parsed: unknown;
try {
  parsed = extractJsonFromLLMOutput(rawOutput);
} catch (error) {
  console.error("Failed to parse JSON:", error.message);
  throw error;
}

// Validate
const result = validateAnalyzerOutputFull(parsed);

if (!result.success) {
  console.error("Validation errors:", result.errors);
  throw new Error("Invalid analyzer output");
}

// Safe to use
const validOutput = result.data;
await renderDashboard(validOutput);
```

---

## 4. Server Action Example (Next.js)

### File: `src/app/actions/analyze-comments.ts`

```typescript
"use server";

import { 
  validateAnalyzerOutputFull,
  extractJsonFromLLMOutput,
  type AnalyzerOutput
} from "@/core/validators/analyzer-output.validator";
import { runGeminiAnalysis } from "@/core/services/gemini.service";

export async function analyzeComments(
  config: unknown,
  comments: string[]
): Promise<{ success: true; data: AnalyzerOutput } | { success: false; error: string }> {
  try {
    // Step 1: Run Gemini analysis
    const rawOutput = await runGeminiAnalysis(config, comments);

    // Step 2: Extract JSON from potential markdown wrapper
    let parsed: unknown;
    try {
      parsed = extractJsonFromLLMOutput(rawOutput);
    } catch (parseError) {
      return {
        success: false,
        error: `Failed to parse JSON: ${(parseError as Error).message}`,
      };
    }

    // Step 3: 🔍 VALIDATE
    const validation = validateAnalyzerOutputFull(parsed);

    if (!validation.success) {
      console.error("[Analyzer] Validation failed:", validation.errors);
      return {
        success: false,
        error: `Validation errors: ${validation.errors.join(", ")}`,
      };
    }

    // Step 4: Return validated data
    return {
      success: true,
      data: validation.data,
    };

  } catch (error) {
    console.error("[Analyzer] Error:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
```

---

## 5. Frontend Integration

### File: `src/app/tool/[id]/page.tsx`

```typescript
"use client";

import { useState } from "react";
import { analyzeComments } from "@/app/actions/analyze-comments";
import type { AnalyzerOutput } from "@/core/validators/analyzer-output.validator";

export default function AnalysisPage() {
  const [result, setResult] = useState<AnalyzerOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAnalyze(config: unknown, comments: string[]) {
    setLoading(true);
    setError(null);

    const response = await analyzeComments(config, comments);

    if (response.success) {
      setResult(response.data); // ✅ Type-safe! Already validated
    } else {
      setError(response.error);
    }

    setLoading(false);
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <h3 className="font-bold text-red-900">Validation Error</h3>
        <p className="text-sm text-red-700 mt-2">{error}</p>
      </div>
    );
  }

  if (result) {
    return (
      <div>
        <h2>{result.summary.one_line}</h2>
        <p>Sentiment: {result.summary.overall_sentiment}</p>
        
        {result.section_meta.map((section) => (
          <div key={section.section_id}>
            <h3>{section.section_title}</h3>
            <p>Total items: {section.total_items}</p>
          </div>
        ))}
      </div>
    );
  }

  return <button onClick={() => handleAnalyze(config, comments)}>Analyze</button>;
}
```

---

## 6. Error Handling Examples

### Example 1: Unresolved Placeholder Error

```typescript
const invalidConfig = {
  preview: { /* ... */ },
  config: {
    prompt: "Goal: [fill: preview.goal]" // ❌ Not resolved!
  },
  // ...
};

const result = validateMetaPromptConfigFull(invalidConfig);

// result.success === false
// result.errors === [
//   "[config.prompt] Prompt must not contain unresolved [fill:...] placeholders"
// ]
```

### Example 2: Section ID Format Error

```typescript
const invalidConfig = {
  blueprint: {
    sections: [
      {
        section_id: "section1", // ❌ Wrong format (should be "s1")
        section_title: "Test",
        // ...
      }
    ]
  }
};

const result = validateMetaPromptConfigFull(invalidConfig);

// result.errors === [
//   "[blueprint.sections.0.section_id] section_id must be s1, s2, s3, etc."
// ]
```

### Example 3: Nested Array Error

```typescript
const invalidOutput = {
  section_rows: [
    {
      section_id: "s1",
      tags: ["tag1", ["nested", "array"]] // ❌ Nested array!
    }
  ]
};

const result = validateAnalyzerOutputFull(invalidOutput);

// result.errors === [
//   "Nested array detected at root.section_rows[0].tags[1] — FORBIDDEN (use comma-separated strings instead)"
// ]
```

### Example 4: Invalid Section Reference

```typescript
const invalidOutput = {
  section_meta: [
    { section_id: "s1", /* ... */ }
  ],
  section_rows: [
    {
      section_id: "s2", // ❌ References non-existent section!
      // ...
    }
  ]
};

const result = validateAnalyzerOutputFull(invalidOutput);

// result.errors === [
//   "section_rows references invalid section_id \"s2\" (valid: s1)"
// ]
```

---

## 7. Testing Examples

### Unit Test: Meta-Prompt Config Validator

```typescript
import { describe, it, expect } from "vitest";
import { validateMetaPromptConfigFull } from "@/core/validators/meta-prompt-config.validator";

describe("Meta-Prompt Config Validator", () => {
  it("should accept valid config", () => {
    const validConfig = {
      preview: {
        startUrls: ["https://facebook.com/post/123"],
        goal: "วิเคราะห์ความต้องการซื้อ",
        estimatedSections: 2
      },
      input: {
        startUrls: [{ url: "https://facebook.com/post/123" }]
      },
      config: {
        model: "gemini-2.5-flash",
        temperature: 0,
        prompt: "You are an analyst...\n\nData: {{currentItem}}",
        tools: {
          function_declarations: [
            {
              name: "submit_report",
              description: "Submit analysis report",
              parameters: {
                type: "OBJECT",
                properties: {
                  summary: {
                    type: "STRING",
                    description: "Summary text"
                  }
                },
                required: ["summary"]
              }
            }
          ]
        }
      },
      blueprint: {
        task_intent: "analyze_purchase_intent",
        task_description: "วิเคราะห์ความต้องการซื้อ",
        analysis_focus: "เจตนาซื้อ",
        sections: [
          {
            section_id: "s1",
            section_title: "กลุ่มเจตนา",
            section_type: "pie_chart",
            what_to_measure: "จำนวนคอมเมนต์",
            signal_keywords: "อยากซื้อ,ไม่สนใจ",
            priority: 1,
            expected_items: []
          },
          {
            section_id: "s2",
            section_title: "หัวข้อ",
            section_type: "bar_chart",
            what_to_measure: "ความถี่",
            signal_keywords: "ราคา,สี",
            priority: 2,
            expected_items: []
          }
        ],
        overall_sentiment_focus: "mixed",
        confidence_note: "ระวังภาษาสแลง"
      }
    };

    const result = validateMetaPromptConfigFull(validConfig);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it("should reject config with unresolved placeholders", () => {
    const invalidConfig = {
      // ... valid fields ...
      config: {
        prompt: "Goal: [fill: preview.goal]" // ❌ Unresolved
      }
    };

    const result = validateMetaPromptConfigFull(invalidConfig);
    expect(result.success).toBe(false);
    expect(result.errors).toContain(
      expect.stringContaining("unresolved [fill:...] placeholders")
    );
  });

  it("should reject config with wrong section_id format", () => {
    const invalidConfig = {
      blueprint: {
        sections: [
          {
            section_id: "section_1", // ❌ Wrong format
            // ...
          }
        ]
      }
    };

    const result = validateMetaPromptConfigFull(invalidConfig);
    expect(result.success).toBe(false);
    expect(result.errors).toContain(
      expect.stringContaining("section_id must be s1, s2, s3")
    );
  });
});
```

### Integration Test: API Route

```typescript
import { describe, it, expect, beforeAll } from "vitest";
import { POST } from "@/app/api/analyze/meta-prompt/route";

describe("POST /api/analyze/meta-prompt", () => {
  it("should return 400 for invalid config", async () => {
    const request = new Request("http://localhost:3000/api/analyze/meta-prompt", {
      method: "POST",
      body: JSON.stringify({
        userInput: "วิเคราะห์คอมเมนต์..." // Will generate invalid config
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid Meta-Prompt Configuration");
    expect(data.validationErrors).toBeInstanceOf(Array);
  });

  it("should return 200 for valid config", async () => {
    const request = new Request("http://localhost:3000/api/analyze/meta-prompt", {
      method: "POST",
      body: JSON.stringify({
        userInput: "วิเคราะห์คอมเมนต์ https://facebook.com/post/123"
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.jobId).toBeDefined();
    expect(data.config).toBeDefined();
  });
});
```

---

## 8. Performance Considerations

### Validation Cost

- **Schema validation**: ~2-5ms per config
- **Cross-field validation**: ~1-3ms
- **Total overhead**: <10ms per validation

### Caching Strategy

```typescript
import { LRUCache } from "lru-cache";
import { hashObject } from "@/lib/utils";

const validationCache = new LRUCache<string, { success: boolean; data?: unknown; errors?: string[] }>({
  max: 100,
  ttl: 1000 * 60 * 5, // 5 minutes
});

export async function validateWithCache(config: unknown) {
  const hash = hashObject(config);
  const cached = validationCache.get(hash);

  if (cached) {
    console.log("[Validator] Cache hit ✓");
    return cached;
  }

  console.log("[Validator] Cache miss - validating...");
  const result = validateMetaPromptConfigFull(config);
  
  validationCache.set(hash, result);
  return result;
}
```

---

## 9. Common Validation Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `[config.prompt] unresolved [fill:...] placeholders` | Meta-Prompt LLM didn't replace `[fill:...]` | Check prompt resolution logic |
| `[blueprint.sections.0.section_id] must be s1, s2, s3` | Wrong section_id format | Use `s1`, `s2`, not `section1` |
| `[config.tools.function_declarations] name must be snake_case` | Function name has camelCase | Convert to `snake_case` |
| `Nested array detected at section_rows[0].tags` | Array inside array | Use comma-separated string |
| `section_rows references invalid section_id "s3"` | Missing section_meta entry | Add section_meta for `s3` |
| `task_intent must be max 4 words` | Too many underscores | Reduce to 4 words max |

---

## Related Files

- [meta-prompt-config.validator.ts](../../src/core/validators/meta-prompt-config.validator.ts)
- [analyzer-output.validator.ts](../../src/core/validators/analyzer-output.validator.ts)
- [META_PROMPT_VALIDATION.md](./META_PROMPT_VALIDATION.md)
- [META_PROMPT_FINAL.md](./META_PROMPT_FINAL.md)

---

**Last Updated:** June 16, 2026  
**Maintained By:** AdapterWorks Engineering Team
