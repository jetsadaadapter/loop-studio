---
description: Run type check and build, report any errors with file+line
---

Run the following checks in sequence and report results:

1. `npx tsc --noEmit` — report all type errors with file:line
2. `npm run lint 2>&1 | grep " error "` — report only errors (not warnings)
3. `npm run build` — report if passed or failed with the relevant error lines

If all pass: confirm "✓ Type check, lint, and build all passed."
If any fail: show only the relevant error lines (max 20 lines per step), grouped by file.
