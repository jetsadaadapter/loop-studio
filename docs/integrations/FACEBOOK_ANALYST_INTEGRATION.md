# Facebook Analyst Visualizer Integration

## Overview

Facebook Analyst Visualizer has been successfully integrated into the **Output Tab => Summary/Overview** section. It automatically detects Facebook Analyst results from API responses and renders a comprehensive dashboard with advanced filtering, dark mode support, and responsive design.

## Location

**Component:** `/src/app/tool/[id]/components/visualizer/tool-specific/facebook-analyst-visualizer.tsx`

**Integration Point:** `/src/app/tool/[id]/components/visualizer/tabs/tab-output-overview.tsx`

**Main Visualizer Shell:** `/src/app/tool/[id]/components/tool-job-visualizer.tsx`

## How It Works

### 1. Auto-Detection

The visualizer automatically activates when the job result contains:

- `posts` array
- Proper Facebook Analyst JSON structure

```typescript
const isFacebookAnalystResult = Boolean(
  job.result &&
  typeof job.result === "object" &&
  !Array.isArray(job.result) &&
  "posts" in job.result &&
  Array.isArray((job.result as Record<string, unknown>).posts)
);
```

### 2. Data Extraction

The component extracts Facebook Analyst data from `job.result`:

```typescript
interface FacebookAnalystPayload {
  task_id: string;
  task_intent: string;
  posts_analyzed: number;
  generated_at: string;
  posts: Post[];
  metrics: Metric[];
  segments: Segment[];
  comments: Comment[];
  insights: Insight[];
}
```

### 3. Rendering

When detected, the visualizer replaces the standard output view with:

- **5 Tabbed Views**: Posts, Metrics, Segments, Comments, Insights
- **Tag Filtering**: Filter comments by tags (comma-separated)
- **Highlight Support**: Emphasize `is_highlight=true` comments
- **Auto-Grouping**: Segments grouped by `segment_type`
- **Cross-Post Insights**: Separate panel for global insights
- **Theme Toggle**: Light/Dark mode support

## API Response Format

### Expected JSON Structure

```json
{
  "task_id": "task-1716000000000",
  "task_intent": "post_type_and_comment_multilabel_classification",
  "posts_analyzed": 3,
  "generated_at": "2023-10-27T08:30:00Z",
  "posts": [
    {
      "post_id": "1723654446081572",
      "post_url": "https://www.facebook.com/1723654446081572",
      "page_name": "MCOT News",
      "post_summary": "Post summary text",
      "post_type": "ข่าว",
      "comments_analyzed": 1
    }
  ],
  "metrics": [
    {
      "post_id": "1723654446081572",
      "metric_key": "political_engagement_score",
      "metric_value": 85,
      "metric_type": "score"
    }
  ],
  "segments": [
    {
      "post_id": "1723654446081572",
      "segment_type": "topic",
      "segment_key": "political_scandal",
      "count": 1,
      "percent": "100%",
      "sentiment": "negative"
    }
  ],
  "comments": [
    {
      "post_id": "1723654446081572",
      "comment_text": "Comment text here",
      "tags": "ทั่วไป, ชมสินค้า",
      "sentiment": "positive",
      "entities": "Person Name, Organization",
      "is_highlight": true
    }
  ],
  "insights": [
    {
      "scope": "post",
      "post_id": "1723654446081572",
      "insight_text": "Post-level insight text"
    },
    {
      "scope": "cross_post",
      "post_id": null,
      "insight_text": "Cross-post global insight"
    }
  ]
}
```

## Features

### ✅ Dynamic Tables

1. **Posts Table**
   - Page name, post type, summary
   - Comments count
   - Direct Facebook link

2. **Metrics Table**
   - Color-coded scores (80+: green, 60-79: amber, <60: red)
   - Post association
   - Metric key auto-formatting

3. **Segments Table**
   - Auto-grouped by `segment_type`
   - Sentiment indicators
   - Count and percentage

4. **Comments Table**
   - Tag filtering dropdown
   - Highlight emphasis (amber accent)
   - Entity recognition display
   - Active tag highlighting

5. **Insights Panel**
   - Post-level insights
   - Cross-post insights (special styling)
   - Post name badges

### ✅ Interactive Features

- **Tag Filter**: Dropdown in header filters comments by tag
- **Dark Mode**: Theme toggle for light/dark
- **Sentiment Icons**: Visual indicators (😊/😢/😐)
- **Responsive**: Works on all screen sizes

## Usage

### 1. Via Tool Execution

When a tool returns Facebook Analyst JSON:

```typescript
// Your API endpoint should return:
{
  result: {
    task_id: "...",
    task_intent: "...",
    posts: [...],
    metrics: [...],
    segments: [...],
    comments: [...],
    insights: [...]
  }
}
```

### 2. Viewing Results

1. Navigate to: `/tool/[toolId]`
2. Click **Output** tab
3. Click **Summary/Overview** inner tab
4. If result contains Facebook Analyst data, visualizer renders automatically

### 3. Filtering Comments

1. In visualizer header, find **Filter** dropdown
2. Select a tag to filter
3. Comments table updates immediately
4. Selected tags highlighted in comment cards

## Styling

### Theme Colors

```typescript
// Light Mode
background: "bg-slate-50"
text: "text-slate-900"
border: "border-slate-200"

// Dark Mode  
background: "bg-slate-900"
text: "text-slate-100"
border: "border-slate-700"
```

### Sentiment Colors

```typescript
positive: "emerald" // Green
negative: "rose"    // Red
neutral: "slate"    // Gray
```

### Metric Thresholds

```typescript
>= 80: "emerald" // High performance
60-79: "amber"   // Medium performance
< 60:  "rose"    // Needs attention
```

## Error Handling

The visualizer gracefully handles:

- **Missing data**: Shows empty state
- **Invalid format**: Returns `null` (no render)
- **Partial data**: Renders available sections only

```typescript
function extractFacebookAnalystData(job: ToolJob): FacebookAnalystPayload | null {
  try {
    // Validation logic
    if (!result.posts || !Array.isArray(result.posts)) return null;
    return validatedData;
  } catch (error) {
    console.error('Failed to extract Facebook Analyst data:', error);
    return null;
  }
}
```

## Customization

### Adding New Fields

To add new fields to the visualizer:

1. Update `FacebookAnalystPayload` interface
2. Add extraction logic in `extractFacebookAnalystData`
3. Create new tab in `tabs` array
4. Add rendering logic in content section

### Styling Adjustments

All components use Tailwind CSS:

```typescript
className={cn(
  "base-classes",
  darkMode ? "dark-classes" : "light-classes"
)}
```

## Performance

- **Memoization**: Data extraction memoized with `useMemo`
- **Conditional Rendering**: Tabs render only when active
- **Efficient Filtering**: Tag filtering computed on-demand

## Testing

### Manual Testing

1. **Create test job** with Facebook Analyst result
2. **Navigate** to tool output page
3. **Verify** visualizer renders
4. **Test** all 5 tabs
5. **Test** tag filtering
6. **Test** dark mode toggle
7. **Test** external links

### Sample Test Data

Use the JSON structure provided in "API Response Format" section above.

## Troubleshooting

### Visualizer Not Showing

**Check:**
1. Does `job.result` contain `posts` array?
2. Is `posts` a valid array (not empty)?
3. Check browser console for errors

### Tags Not Filtering

**Check:**
1. Are tags comma-separated in data?
2. Is dropdown populated with tags?
3. Check console for filter logic errors

### Dark Mode Issues

**Check:**
1. Theme state properly initialized
2. All components have `darkMode` prop
3. Conditional classes applied correctly

## Tool-Specific Visualizers

The visualizer system now supports multiple tool-specific renderers that automatically activate based on job result structure:

### Facebook Analyst Visualizer

**Activation Trigger:** Detects `posts` array in job result

**Features:**

- 5 tabbed views (Posts, Metrics, Segments, Comments, Insights)
- Tag-based comment filtering
- Dark mode support
- Sentiment visualization with icons and colors
- Post-level and cross-post insights

### Export Comments Visualizers

**Create Overview** (`exportcomments-create-overview.tsx`)

- Displays created comment export datasets
- Shows summary statistics

**Fetch Overview** (`exportcomments-fetch-overview.tsx`)

- Visualizes fetched comment data
- Table-based presentation with pagination

### PreProcess Overview

**Activation Trigger:** Detects `preview` or `config` fields in job result

**Features:**

- Configuration parameter display
- Preview of execution plan
- Visual hierarchy of preprocessing steps

## Integration with Analysis Components

The Facebook Analyst Visualizer integrates seamlessly with the broader analysis ecosystem:

### Shared Components

- **AnalysisBlockEntry**: Used for structured analysis display with grid layouts
- **AnalysisInfoBoxes**: Provides summary statistics boxes compatible with Facebook Analyst metrics
- **MetricsPostCard**: Can be used to display Facebook post metrics in card format
- **IntentAnalysisCard/Summary**: Compatible with Facebook comment intent classification

### Visualization Strategies

The system uses pluggable visualization strategies defined in `visualizer-strategies.tsx`:

- **RatioVisualizer**: For percentage-based metrics (engagement scores)
- **MultiLabelVisualizer**: For multi-label classification (comment tags)
- **AccordionVisualizer**: For collapsible detailed views

## Migration Notes

### From `/manage/facebook-analyst`

The standalone page at `/manage/facebook-analyst` has been **removed**.

**Changes:**
- ✅ Component now embedded in Output tab
- ✅ Uses real API data from `job.result`
- ✅ No mock data
- ✅ Auto-detection based on result structure
- ✅ All features preserved
- ✅ Consistent styling with other visualizers

### Breaking Changes

**None** - This is a new integration, not a replacement of existing functionality.

## Architecture Overview

### Visualizer Component Structure

```plaintext
src/app/tool/[id]/components/
├── tool-job-visualizer.tsx                 # Main visualizer shell (Sheet container)
└── visualizer/
    ├── tabs/
    │   ├── tab-output.tsx                  # Main output tab container
    │   ├── tab-output-overview.tsx         # Overview/Summary integration point
    │   ├── tab-json-view.tsx               # Raw JSON viewer
    │   ├── tab-log.tsx                     # Execution logs
    │   ├── tab-input-storage.tsx           # Input data viewer
    │   └── tab-preprocess.tsx              # Preprocessing details
    ├── tool-specific/
    │   ├── facebook-analyst-visualizer.tsx # Facebook Analyst renderer
    │   ├── exportcomments-create-overview.tsx
    │   └── exportcomments-fetch-overview.tsx
    ├── console/
    │   ├── console-header.tsx              # Visualizer header bar
    │   └── console-navigation.tsx          # Tab navigation
    ├── analysis/
    │   ├── analysis-block-entry.tsx        # AI analysis blocks
    │   ├── analysis-info-boxes.tsx         # Analysis summary boxes
    │   ├── intent-analysis-card.tsx        # Intent classification cards
    │   ├── intent-analysis-summary.tsx     # Intent statistics
    │   └── metrics-post-card.tsx           # Post metrics display
    ├── comments/
    │   ├── comment-thread-card.tsx         # Comment thread rendering
    │   └── comment-helpers.tsx             # Comment utilities
    ├── export/
    │   ├── export-dataset-modal.tsx        # Data export modal
    │   ├── export-field-selector.tsx       # Field selection UI
    │   ├── export-format-grid.tsx          # Format options
    │   ├── export-advanced-options.tsx     # Export settings
    │   └── export-utils.ts                 # Export logic
    ├── overview/
    │   ├── output-overview-table.tsx       # Generic output table
    │   └── preprocess-overview.tsx         # Preprocessing visualization
    ├── table/
    │   ├── all-fields-table.tsx            # Dynamic table component
    │   ├── cell-renderer.tsx               # Cell rendering logic
    │   └── table-pagination.tsx            # Pagination controls
    ├── presentation/
    │   └── slide-presentation-view.tsx     # Slide-based presentation mode
    └── shared/
        ├── image-with-fallback.tsx         # Image loading with fallback
        └── media-cell.tsx                  # Media display cell
```

## Recent Updates (June 2026)

### Component Reorganization

- **Modularized Structure**: All visualizer components now organized into logical subdirectories (`analysis/`, `comments/`, `export/`, `console/`, `table/`, `overview/`, `presentation/`, `shared/`, `tool-specific/`)
- **Moved Facebook Analyst**: Relocated from root visualizer directory to `tool-specific/` subfolder for better organization
- **Analysis Components**: Created dedicated `analysis/` directory for AI analysis rendering components including metrics cards and info boxes
- **Export System**: Centralized all export-related components in `export/` directory with advanced options support
- **Comment System**: Separated comment rendering logic into `comments/` directory with helper utilities
- **Console Components**: Dedicated `console/` directory for header and navigation components

### New Features Added

- **Slide Presentation View**: Added `slide-presentation-view.tsx` for presentation-style output viewing with slide navigation
- **Block-Themed Analysis**: Enhanced analysis sections with improved visual hierarchy and color-coded sentiment indicators
- **Responsive Mobile Layouts**: Updated table components to hide secondary columns on mobile with inline details expansion
- **PreProcess Overview**: New component (`preprocess-overview.tsx`) to visualize tool configuration and execution parameters
- **Modular Output Visualizer**: Specialized summary and table components for different job types (export comments, fetch comments, analysis)
- **Tabbed Markdown Summary**: Component for single-text outputs with intelligent tab splitting logic
- **Analysis Block Entry**: Improved grid layout responsiveness for AI analysis cards with AnalysisBlockEntry component
- **Grouped Post Analysis**: New `grouped-post-analysis.tsx` component for categorizing and sorting posts by classification and buy intent
- **Job AI Analysis**: Enhanced `job-ai-analysis.tsx` with support for intent payload, sentiment visualization, and multi-label classification
- **Metrics Post Card**: Dedicated component for displaying post-level metrics with visual indicators
- **Analysis Info Boxes**: Summary boxes showing key statistics (total comments, sentiment distribution, purchase signals)

### Styling Improvements

- **Font Standardization**: All visualizer components now use `text-xs` for consistency
- **Mobile Responsiveness**: Updated padding and typography scales across all components
- **Status Tracking**: Enhanced status indicators and visual feedback
- **Dark Mode**: Consistent dark mode support across all visualizer components

## Future Enhancements

Potential improvements:

- [ ] Export to CSV/PDF (Export infrastructure already in place)
- [ ] Advanced filtering (multi-select tags)
- [ ] Sentiment trend charts
- [ ] Real-time updates via WebSocket
- [ ] Comment search and full-text filtering
- [ ] Bookmark insights for later reference
- [ ] Share links with permalink support
- [ ] Enhanced presentation mode features
- [ ] Cross-post comparison views
- [ ] Time-series analysis for metrics

## Performance Considerations

- **Lazy Loading**: Tab content only renders when active
- **Memoization**: Heavy data transformations are memoized
- **Pagination**: Large datasets are paginated to prevent performance degradation
- **Conditional Rendering**: Components only mount when their data is available
- **Efficient Updates**: React state updates are batched and optimized

## Support

For issues or questions:

- Check console logs for errors
- Verify API response structure matches expected schema
- Review integration point in `tab-output-overview.tsx`
- Check component imports in `tool-job-visualizer.tsx`
- Ensure job result format matches `FacebookAnalystPayload` interface

## Version History

- **v2.0.0** (June 2026): Major restructuring with modular architecture
- **v1.5.0** (May 2026): Added presentation view and enhanced analysis sections
- **v1.0.0** (Initial): Basic Facebook Analyst visualization with 5 tabs

## License

Proprietary - AdapterWorks 2026

---

**Last Updated:** June 10, 2026  
**Maintained By:** AdapterWorks Engineering Team
