export async function importMarkdownFile(
  file: File,
  fieldName: string,
  touch: (field: string) => void,
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  applyContent: (content: string) => void,
) {
  const isMarkdown = /\.md$/i.test(file.name) || file.type === "text/markdown";
  const fieldLabel = fieldName === "integration" ? "Integration" : "Instructions";
  if (!isMarkdown) {
    touch(fieldName);
    setFieldErrors((current) => ({
      ...current,
      [fieldName]: `Please use a .md file for ${fieldLabel}.`,
    }));
    return;
  }

  try {
    const markdownText = await file.text();
    if (!markdownText.trim()) {
      touch(fieldName);
      setFieldErrors((current) => ({
        ...current,
        [fieldName]: `The .md file is empty.`,
      }));
      return;
    }
    applyContent(markdownText);
  } catch {
    touch(fieldName);
    setFieldErrors((current) => ({
      ...current,
      [fieldName]: `Unable to read the .md file.`,
    }));
  }
}

export async function handleCopyInstructions(
  instructions: string,
  pushDialogToast: (msg: string, type: "success" | "error") => void,
  setDidCopy: (copied: boolean) => void,
) {
  const value = instructions?.trim();
  if (!value) {
    pushDialogToast("No instructions to copy.", "error");
    return;
  }
  if (!navigator?.clipboard?.writeText) {
    pushDialogToast("Clipboard is not supported in this browser.", "error");
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
    setDidCopy(true);
    window.setTimeout(() => setDidCopy(false), 1600);
  } catch {
    pushDialogToast("Unable to copy instructions.", "error");
  }
}

export function handleDownloadMarkdown(
  instructions: string,
  appName: string,
  pushDialogToast: (msg: string, type: "success" | "error") => void,
) {
  const value = instructions?.trim();
  if (!value) {
    pushDialogToast("No instructions to download.", "error");
    return;
  }

  try {
    const blob = new Blob([value], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${
      appName.trim().replace(/\s+/g, "-").toLowerCase() || "instructions"
    }.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    pushDialogToast("Instructions downloaded as .md file.", "success");
  } catch {
    pushDialogToast("Unable to download instructions.", "error");
  }
}

export async function handleCopyIntegration(
  integration: string,
  pushDialogToast: (msg: string, type: "success" | "error") => void,
  setDidCopy: (copied: boolean) => void,
) {
  const value = integration?.trim();
  if (!value) {
    pushDialogToast("No integration to copy.", "error");
    return;
  }
  if (!navigator?.clipboard?.writeText) {
    pushDialogToast("Clipboard is not supported in this browser.", "error");
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
    setDidCopy(true);
    window.setTimeout(() => setDidCopy(false), 1600);
  } catch {
    pushDialogToast("Unable to copy integration.", "error");
  }
}

export function handleDownloadIntegrationMarkdown(
  integration: string,
  appName: string,
  pushDialogToast: (msg: string, type: "success" | "error") => void,
) {
  const value = integration?.trim();
  if (!value) {
    pushDialogToast("No integration to download.", "error");
    return;
  }

  try {
    const blob = new Blob([value], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${
      appName.trim().replace(/\s+/g, "-").toLowerCase() || "integration"
    }-integration.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    pushDialogToast("Integration downloaded as .md file.", "success");
  } catch {
    pushDialogToast("Unable to download integration.", "error");
  }
}

