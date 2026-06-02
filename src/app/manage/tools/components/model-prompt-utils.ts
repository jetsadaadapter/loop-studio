function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function syncPromptModelReferences(
  promptText: string,
  nextModel: string,
  previousModel?: string,
): string {
  if (!promptText || !nextModel) {
    return promptText;
  }

  let normalizedPrompt = promptText;

  // Keep JSON config snippets aligned with the selected model.
  normalizedPrompt = normalizedPrompt.replace(
    /("model"\s*:\s*")[^"]*(")/gi,
    `$1${nextModel}$2`,
  );

  if (previousModel && previousModel !== nextModel) {
    normalizedPrompt = normalizedPrompt.replace(
      new RegExp(`\\b${escapeForRegex(previousModel)}\\b`, "g"),
      nextModel,
    );
  }

  // Update explicit Gemini model mentions declared in free-form system prompts.
  normalizedPrompt = normalizedPrompt.replace(/\bgemini-[a-z0-9.-]+\b/gi, nextModel);

  return normalizedPrompt;
}