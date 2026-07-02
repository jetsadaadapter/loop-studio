export function normalizeStartUrls(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (typeof entry === "string") {
        return entry.trim();
      }

      if (typeof entry === "object" && entry !== null) {
        const maybeUrl = (entry as { url?: unknown }).url;
        if (typeof maybeUrl === "string") {
          return maybeUrl.trim();
        }
      }

      return "";
    })
    .filter((url) => url.length > 0);
}