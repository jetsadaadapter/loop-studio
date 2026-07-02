---
description: Find and remove debug artifacts, temp files, and dead code in the project
---

Use the `refactor-agent` to find and clean up the following:

1. **Temp/debug files** in project root:
   - `find . -maxdepth 2 -name "*.mjs" -not -path "*/node_modules/*"`
   - `find . -maxdepth 2 -name "*_FIX.md" -o -name "*_DEBUG*" -not -path "*/node_modules/*"`
   - Any `.md` files in root that are fix notes (not README/CLAUDE/AGENTS/DESIGN)

2. **Console.log in source** (not node_modules):
   - `grep -rn "console\.log" src/ --include="*.ts" --include="*.tsx"`

3. **Files over 300 lines**:
   - `find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | sort -rn | head -15`

Report findings as a list. Ask before deleting anything. For console.logs: remove them directly. For large files: report them and ask if refactor is wanted.
