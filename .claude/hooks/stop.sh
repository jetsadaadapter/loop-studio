#!/bin/bash
# Stop hook — advisory typecheck gate. Fires whenever Claude finishes responding,
# so this stays non-blocking (exit 1, visible to the user only): a hard block
# (exit 2 / decision:block) would trap Claude in a loop on pre-existing type
# errors unrelated to the current turn. Tighten to blocking once the baseline is clean.

cd "$CLAUDE_PROJECT_DIR" || exit 0

tsc_output=$(npx tsc --noEmit 2>&1)
tsc_status=$?

if [[ $tsc_status -ne 0 ]]; then
  echo "tsc --noEmit found type errors (AGENTS.md #7 pre-merge check):" >&2
  echo "$tsc_output" | head -40 >&2
  exit 1
fi

exit 0
