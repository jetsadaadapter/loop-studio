# Validator Quick Start Guide

## 🎯 One-Minute Overview

**When:** After LLM generates JSON, before using it  
**Why:** Prevent invalid data from breaking your pipeline  
**Cost:** <10ms overhead per validation

---

## 📦 Import

```typescript
// Meta-Prompt Config Validator
import { validateMetaPromptConfigFull } from "@/core/validators/meta-prompt-config.validator";

// Analyzer Output Validator
import { 
  validateAnalyzerOutputFull,
  extractJsonFromLLMOutput 
} from "@/core/validators/analyzer-output.validator";
```

---

## 🔍 Validate Meta-Prompt Config

```typescript
// After Meta-Prompt LLM generates config
const configJson = await metaPromptLLM.generate(userInput);

// Validate
const result = validateMetaPromptConfigFull(configJson);

if (!result.success) {
  console.error("Errors:", result.errors);
  throw new Error("Invalid config");
}

// ✅ Safe to use
await apifyPipeline.run(result.data);
```

---

## 🔍 Validate Analyzer Output

```typescript
// After Gemini/Analysis LLM returns output
const rawOutput = await analyzerLLM.generate(prompt);

// Extract JSON (removes markdown wrappers)
const parsed = extractJsonFromLLMOutput(rawOutput);

// Validate
const result = validateAnalyzerOutputFull(parsed);

if (!result.success) {
  console.error("Errors:", result.errors);
  throw new Error("Invalid output");
}

// ✅ Safe to render
renderDashboard(result.data);
```

---

## ✅ What Gets Validated?

### Meta-Prompt Config

- ✓ `preview.startUrls` has valid URLs
- ✓ `config.prompt` fully resolved (no `[fill:...]`)
- ✓ `config.prompt` contains `{{currentItem}}`
- ✓ `blueprint.sections` between 2-5
- ✓ `section_id` format: `s1`, `s2`, `s3`
- ✓ `section_type` is valid enum
- ✓ `task_intent` is snake_case, max 4 words
- ✓ Function names are snake_case

### Analyzer Output

- ✓ No nested arrays (arrays inside arrays forbidden)
- ✓ `section_id` references valid sections
- ✓ `row_id` format: `sX_iY` (e.g., `s1_i1`)
- ✓ `percent` format: `XX%` (e.g., `42%`)
- ✓ `sentiment` is valid enum
- ✓ `highlights` max 3 items
- ✓ Required fields present

---

## ❌ Common Errors

| Error | Fix |
|-------|-----|
| `unresolved [fill:...] placeholders` | Replace all `[fill:...]` in prompt |
| `section_id must be s1, s2, s3` | Use `s1` not `section1` |
| `Nested array detected` | Use comma-separated string |
| `percent must be in XX% format` | Use `"42%"` not `42` |
| `row_id must be sX_iY format` | Use `"s1_i1"` not `"row_1"` |

---

## 📚 Full Documentation

- [VALIDATOR_USAGE_EXAMPLES.md](./VALIDATOR_USAGE_EXAMPLES.md) - Complete examples with API routes, tests
- [META_PROMPT_VALIDATION.md](./META_PROMPT_VALIDATION.md) - Full schema reference
- [META_PROMPT_FINAL.md](./META_PROMPT_FINAL.md) - Meta-prompt instructions

---

## 🚀 Next Steps

1. Add validation to your API routes
2. Add error handling for validation failures
3. Log validation errors for monitoring
4. Consider caching validation results

---

**Pro Tip:** Always validate after LLM output, never trust LLM-generated JSON blindly!
