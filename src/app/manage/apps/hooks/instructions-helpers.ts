export async function importMarkdownFile(
  file: File,
  touch: (field: string) => void,
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  applyInstructionsContent: (content: string) => void,
) {
  const isMarkdown = /\.md$/i.test(file.name) || file.type === "text/markdown";
  if (!isMarkdown) {
    touch("instructions");
    setFieldErrors((current) => ({
      ...current,
      instructions: "Please use a .md file for Instructions.",
    }));
    return;
  }

  try {
    const markdownText = await file.text();
    if (!markdownText.trim()) {
      touch("instructions");
      setFieldErrors((current) => ({
        ...current,
        instructions: "The .md file is empty.",
      }));
      return;
    }
    applyInstructionsContent(markdownText);
  } catch {
    touch("instructions");
    setFieldErrors((current) => ({
      ...current,
      instructions: "Unable to read the .md file.",
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
    pushDialogToast("Instructions copied to clipboard.", "success");
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
