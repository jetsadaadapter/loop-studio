#!/bin/bash
# PreToolUse guard — blocks a small set of AGENTS.md rule violations before they land.
# Anything not matched here falls through untouched (exit 0, no JSON).

input=$(cat)
tool_name=$(echo "$input" | jq -r '.tool_name // empty')
file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty')

if [[ "$tool_name" != "Edit" && "$tool_name" != "Write" ]]; then
  exit 0
fi

# Rule (AGENTS.md #5): files must not exceed 300 lines. Only checkable for Write,
# which carries the full resulting content; Edit only carries a diff fragment.
if [[ "$tool_name" == "Write" && "$file_path" == src/* ]]; then
  content=$(echo "$input" | jq -r '.tool_input.content // empty')
  # printf ... '%s\n' restores the trailing newline that command substitution stripped,
  # so the count isn't off by one regardless of whether content originally ended in \n.
  line_count=$(printf '%s\n' "$content" | wc -l | tr -d ' ')
  if [[ "$line_count" -gt 300 ]]; then
    echo "Blocked: $file_path would be $line_count lines. AGENTS.md caps files at 300 lines — split into focused sub-components/helpers before writing." >&2
    exit 2
  fi
fi

# Rule (AGENTS.md #4): src/proxy.ts enforces nonce-based CSP — never add unsafe-inline/unsafe-eval.
if [[ "$file_path" == "src/proxy.ts" ]]; then
  new_content=$(echo "$input" | jq -r '(.tool_input.new_string // .tool_input.content // empty)')
  if echo "$new_content" | grep -qE "unsafe-inline|unsafe-eval"; then
    echo "Blocked: edit to src/proxy.ts introduces unsafe-inline/unsafe-eval. AGENTS.md #4 forbids weakening CSP — use the nonce flow instead." >&2
    exit 2
  fi
fi

exit 0
