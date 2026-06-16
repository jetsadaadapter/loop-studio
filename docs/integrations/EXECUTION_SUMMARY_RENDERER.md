# Execution Summary Dynamic Renderer

## Overview

The Execution Summary component provides an intelligent, adaptive rendering system that automatically detects and visualizes structured JSON data from LLM analysis outputs. It's designed to handle the two-prompt analysis flow used in social media and content analysis tasks.

## Architecture Flow

```
[User Input: URL + Goal]
        │
        ▼
[PROMPT A — Meta Prompt]
  → task_intent
  → task_description
  → sections[] (analysis blueprint)
        │
        ▼
[PROMPT B — Analyzer Prompt]
  Input: blueprint + posts_raw + comments_raw
  Output: Strict JSON (Envelope Schema)
        │
        ▼
[Dynamic UI Renderer]
  Reads section_type → renders correct component
```

## Component Location

**File:** `src/app/tool/[id]/components/visualizer/overview/execution-summary-section.tsx`

## Key Features

### 1. Automatic JSON Detection

The component uses `tryParseStructuredJson()` to intelligently detect and parse JSON from LLM output text:

- Strips markdown code fences (```json)
- Removes BOM and zero-width characters
- Fixes unquoted keys
- Handles incomplete JSON with iterative repair
- Validates nested structure

### 2. Adaptive Rendering

When structured JSON is detected, the component automatically switches from Markdown rendering to structured view mode:

```typescript
structuredData ? (
  <StructuredView data={structuredData} />
) : (
  <Markdown>{displayedSummaryText}</Markdown>
)
```

### 3. Smart Object-to-String Conversion

The `renderItemValue()` function intelligently converts complex objects to readable strings:

```typescript
function renderItemValue(v: unknown): string {
  // Handles null/undefined
  // Handles primitives (string, number, boolean)
  // Handles arrays (recursive)
  // Handles objects with special keys:
  //   - section_title
  //   - title
  //   - name
  // Handles generic objects with key-value pairs
}
```

### 4. Section-Based Organization

The component automatically organizes data into collapsible sections:

- **SectionCard**: Renders array data as bullet lists
- **ObjectSection**: Renders nested object hierarchies
- **StructuredView**: Handles top-level tabs for major sections

## Data Structure Examples

### Meta Prompt Output (PROMPT A)

```json
{
  "task_intent": "purchase_intent_analysis",
  "task_description": "วิเคราะห์เจตนาการซื้อ...",
  "sections": [
    {
      "section_id": "s1",
      "section_title": "สัดส่วนเจตนาการซื้อ",
      "section_type": "pie_chart",
      "what_to_measure": "สัดส่วนของคอมเมนต์...",
      "signal_keywords": "อยากได้, ซื้อ, สนใจ...",
      "priority": 1
    }
  ],
  "overall_sentiment_focus": "mixed",
  "confidence_note": "ต้องระวังการตีความ..."
}
```

### Analyzer Output (PROMPT B)

```json
{
  "task_id": "01KTTMD5",
  "task_intent": "purchase_intent_analysis",
  "posts_analyzed": 2,
  "posts": [...],
  "metrics": [...],
  "segments": [...],
  "comments": [...],
  "insights": [...]
}
```

## Rendering Logic

### For Meta Prompt (Blueprint)

When the JSON contains `sections` with `section_title`:

1. Top-level fields render as info cards
2. `sections` array renders as a collapsible list
3. Each section object shows its `section_title` as the display text

### For Analyzer Results

When the JSON contains `posts` array:

1. Automatically routes to `FacebookAnalystVisualizer`
2. Provides specialized tabs: Posts, Metrics, Segments, Comments, Insights
3. Renders interactive data visualizations

### For Generic Structured Data

When the JSON has nested objects but no specific schema:

1. Auto-detects top-level object keys
2. Creates tabs for major sections (if > 1 object)
3. Renders nested arrays as collapsible cards
4. Shows scalar values as labeled fields

## Visual Features

### Collapsible Sections

- Chevron icon indicates expand/collapse state
- Default open for main sections
- Percentage badges extracted from titles
- Hover effects for better interactivity

### Typography & Styling

- Font: Inter via `font-sans` utility
- Size hierarchy:
  - Section titles: `text-xs font-bold`
  - List items: `text-xs text-slate-700`
  - Labels: `text-[9px] font-bold uppercase`

### Markdown Support

When structured JSON is not detected, falls back to rich Markdown rendering with custom components for:

- Headers (h1, h2, h3)
- Lists (ul, ol)
- Code blocks
- Blockquotes
- Links

## Error Handling

### JSON Parsing Failures

- Iterative repair attempts (up to 15 iterations)
- Handles trailing junk after valid JSON
- Closes unclosed braces/brackets
- Removes trailing commas

### Display Fallbacks

- Objects without recognized keys → key-value pair display
- Empty arrays → no render
- Null/undefined values → empty string

## Integration Points

### TabOutputOverview

Checks for social analyst results and routes accordingly:

```typescript
const isSocialAnalystResult = Boolean(
  job.result &&
  typeof job.result === "object" &&
  "posts" in job.result &&
  Array.isArray(job.result.posts)
);

if (isSocialAnalystResult) {
  return <FacebookAnalystVisualizer job={job} />;
}
```

### FacebookAnalystVisualizer

Specialized visualizer for post-based analysis:

- Extract typed data from `job.result`
- Tab-based navigation
- Tag filtering for comments
- Dark mode support
- Sentiment color coding

## Best Practices

### For Meta Prompts

1. Always include `section_title` in section objects
2. Use `section_type` to hint at visualization type
3. Provide `priority` for ordering
4. Include `confidence_note` for caveats

### For Analyzer Prompts

1. Use consistent field names across schema
2. Include display-friendly fields (e.g., `post_url_display`)
3. Normalize sentiment values to standard strings
4. Provide `task_intent` for routing logic

### For UI Components

1. Always normalize object fields to strings before rendering
2. Use `renderItemValue()` for unknown data types
3. Provide loading states for async operations
4. Test with incomplete/malformed JSON

## Troubleshooting

### Issue: `[object Object]` in Lists

**Cause:** Calling `String(v)` directly on objects

**Fix:** Use `renderItemValue()` to intelligently extract display values

### Issue: JSON Not Detected

**Cause:** Unexpected prefixes or format variations

**Fix:** Check `extractJsonBody()` and add new patterns if needed

### Issue: Tabs Not Showing

**Cause:** Less than 2 top-level objects detected

**Fix:** Ensure data structure has multiple major sections

## Future Enhancements

- [ ] Support for pie charts based on `section_type: "pie_chart"`
- [ ] Bar charts for metric visualizations
- [ ] Timeline views for temporal data
- [ ] Export functionality (CSV, PDF)
- [ ] Search/filter across all sections
- [ ] Comparison mode for multiple runs
- [ ] AI-generated insights overlay

## Related Files

- `src/app/tool/[id]/components/visualizer/overview/execution-summary-section.tsx`
- `src/app/tool/[id]/components/visualizer/tabs/tab-output-overview.tsx`
- `src/app/tool/[id]/components/visualizer/tool-specific/facebook-analyst-visualizer.tsx`
- `src/app/tool/[id]/components/visualizer/overview/output-overview-table.tsx`
