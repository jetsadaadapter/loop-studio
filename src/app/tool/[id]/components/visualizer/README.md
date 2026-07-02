# Visualizer Components

This directory contains organized visualizer components for the tool job system.

## Directory Structure

```
visualizer/
├── analysis/          # Analysis-related components
│   ├── analysis-block-entry.tsx
│   ├── analysis-info-boxes.tsx
│   ├── intent-analysis-card.tsx
│   ├── intent-analysis-summary.tsx
│   ├── metrics-post-card.tsx
│   └── index.ts
│
├── comments/          # Comment display components
│   ├── comment-helpers.tsx
│   ├── comment-thread-card.tsx
│   └── index.ts
│
├── console/           # Console UI components
│   ├── console-header.tsx
│   ├── console-navigation.tsx
│   └── index.ts
│
├── export/            # Data export functionality
│   ├── export-advanced-options.tsx
│   ├── export-dataset-modal.tsx
│   ├── export-field-selector.tsx
│   ├── export-format-grid.tsx
│   ├── export-utils.ts
│   └── index.ts
│
├── overview/          # Overview & summary components
│   ├── execution-summary-section.tsx
│   ├── output-overview-table.tsx
│   ├── preprocess-overview.tsx
│   └── index.ts
│
├── presentation/      # Presentation view components
│   ├── slide-presentation-view.tsx
│   └── index.ts
│
├── shared/            # Shared utility components
│   ├── image-with-fallback.tsx
│   ├── media-cell.tsx
│   └── index.ts
│
├── table/             # Table & grid components
│   ├── all-fields-table.tsx
│   ├── cell-renderer.tsx
│   ├── table-pagination.tsx
│   └── index.ts
│
├── tabs/              # Tab view components
│   ├── tab-input-storage.tsx
│   ├── tab-json-view.tsx
│   ├── tab-log.tsx
│   ├── tab-output.tsx
│   ├── tab-output-overview.tsx
│   ├── tab-preprocess.tsx
│   ├── tab-output-helpers.ts
│   └── index.ts
│
└── tool-specific/     # Tool-specific visualizers
    ├── exportcomments-create-overview.tsx
    ├── exportcomments-fetch-overview.tsx
    ├── facebook-analyst-visualizer.tsx
    └── index.ts
```

## Import Guidelines

Each folder has an `index.ts` file that exports all components and types. Use these for cleaner imports:

```typescript
// ✅ Good - using index exports
import { TabOutput, TabLog } from "./visualizer/tabs";
import { AnalysisBlockEntry, MetricsPostCard } from "./visualizer/analysis";

// ❌ Avoid - direct file imports
import { TabOutput } from "./visualizer/tabs/tab-output";
import { TabLog } from "./visualizer/tabs/tab-log";
```

## Component Categories

### Analysis Components
Components for displaying AI analysis results, intent analysis, and metrics visualization.

### Comments Components
Components for rendering comment threads and comment-related utilities.

### Console Components
UI components for the console header and navigation tabs.

### Export Components
Modal and utilities for exporting data in various formats (JSON, CSV, Excel, etc.).

### Overview Components
Summary and overview displays for execution, preprocessing, and output data.

### Presentation Components
Slide-based presentation view for data visualization.

### Shared Components
Reusable utility components used across multiple sections (images, media cells).

### Table Components
Data table components with cell rendering and pagination.

### Tabs Components
Tab view components for different data displays (output, logs, input, preprocess, JSON).

### Tool-Specific Components
Specialized visualizers for specific tools (Facebook Analyst, Export Comments).

## Adding New Components

1. Place components in the appropriate category folder
2. Update the folder's `index.ts` to export the new component
3. Follow existing naming conventions
4. Keep components under 300 lines when possible
