#!/bin/bash
# PostToolUse check — lints the file that was just touched and feeds errors back
# to Claude immediately, instead of relying on it to remember to run lint later.

input=$(cat)
tool_name=$(echo "$input" | jq -r '.tool_name // empty')
file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty')

if [[ "$tool_name" != "Edit" && "$tool_name" != "Write" ]]; then
  exit 0
fi

case "$file_path" in
  *.ts|*.tsx) ;;
  *) exit 0 ;;
esac

if [[ ! -f "$file_path" ]]; then
  exit 0
fi

lint_output=$(npx eslint --no-warn-ignored "$file_path" 2>&1)
lint_status=$?

line_count=$(wc -l < "$file_path" | tr -d ' ')
size_note=""
if [[ "$line_count" -gt 300 ]]; then
  size_note="\n\n$file_path is now $line_count lines — AGENTS.md caps files at 300 lines, split it up."
fi

if [[ $lint_status -ne 0 ]]; then
  reason="ESLint found errors in $file_path"
  context="$lint_output$size_note"
  jq -n --arg reason "$reason" --arg ctx "$context" \
    '{decision: "block", reason: $reason, hookSpecificOutput: {hookEventName: "PostToolUse", additionalContext: $ctx}}'
  exit 0
fi

if [[ -n "$size_note" ]]; then
  jq -n --arg ctx "$size_note" \
    '{hookSpecificOutput: {hookEventName: "PostToolUse", additionalContext: $ctx}}'
fi

exit 0
