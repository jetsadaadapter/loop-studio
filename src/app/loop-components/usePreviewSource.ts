import { useState, useEffect } from "react";
import type { PreviewTab } from "./usePreviewPane";

/**
 * Lazy code + git-diff loading for the PreviewPane's Code and Diff tabs. Split
 * out of usePreviewPane to keep that hook under the file-size cap; it owns only
 * the source-viewing state and its two fetch effects.
 */
export function usePreviewSource(projectId: string, taskId: string, tab: PreviewTab, targetFiles: string[]) {
    // Code viewing states
    const [selectedFile, setSelectedFile] = useState(targetFiles[0] || "");
    const [codeContent, setCodeContent] = useState("");
    const [loadingCode, setLoadingCode] = useState(false);
    const [codeError, setCodeError] = useState("");

    // Diff viewing states
    const [diffContent, setDiffContent] = useState("");
    const [loadingDiff, setLoadingDiff] = useState(false);
    const [diffError, setDiffError] = useState("");

    // Keep the user's selection if still valid, else fall back to the first file.
    const effectiveSelectedFile = targetFiles.includes(selectedFile)
        ? selectedFile
        : (targetFiles[0] ?? "");

    // Fetch code content
    useEffect(() => {
        if (tab !== "code" || !effectiveSelectedFile) return;
        const beginFetch = () => {
            setLoadingCode(true);
            setCodeError("");
            fetch(`/api/loop-projects/${projectId}/files?file=${encodeURIComponent(effectiveSelectedFile)}`)
                .then((res) => res.json())
                .then((json) => {
                    if (json.success) setCodeContent(json.data);
                    else setCodeError(json.error || "Failed to load file content.");
                })
                .catch(() => setCodeError("Network error: failed to load file content."))
                .finally(() => setLoadingCode(false));
        };
        beginFetch();
    }, [tab, effectiveSelectedFile, projectId]);

    // Fetch git diff
    useEffect(() => {
        if (tab !== "diff") return;
        const beginFetch = () => {
            setLoadingDiff(true);
            setDiffError("");
            fetch(`/api/loop-projects/${projectId}/tasks/${taskId}/diff`)
                .then((res) => res.json())
                .then((json) => {
                    if (json.success) setDiffContent(json.data);
                    else setDiffError(json.error || "Failed to load git diff.");
                })
                .catch(() => setDiffError("Network error: failed to load git diff."))
                .finally(() => setLoadingDiff(false));
        };
        beginFetch();
    }, [tab, taskId, projectId]);

    return {
        selectedFile,
        setSelectedFile,
        effectiveSelectedFile,
        codeContent,
        loadingCode,
        codeError,
        diffContent,
        loadingDiff,
        diffError,
    };
}
