import { useState, useEffect, useRef } from "react";
import { Monitor, Code2, GitCompare } from "lucide-react";
import type { CheckState } from "./PreviewStatusBadge";

export type PreviewTab = "preview" | "code" | "diff";

export const ALL_TABS: { key: PreviewTab; label: string; icon: typeof Monitor }[] = [
    { key: "preview", label: "Preview", icon: Monitor },
    { key: "code", label: "Code", icon: Code2 },
    { key: "diff", label: "Diff", icon: GitCompare },
];

// Backend templates default to the API console; frontend templates to the live
// iframe. "generic"/unknown returns null → fall through to a content-type probe.
function kindFromTemplate(t?: string): "app" | "api" | null {
    if (t === "nodejs") return "api";
    if (t === "nextjs-app" || t === "nextjs-pages" || t === "vite-react") return "app";
    return null;
}

interface UsePreviewPaneArgs {
    initialUrl: string;
    projectId: string;
    projectTemplate?: string;
    taskId: string;
    verifyStatus: CheckState;
    buildStatus: CheckState;
    targetFiles: string[];
}

/**
 * All PreviewPane state and side effects: URL + reachability polling, App/API
 * mode detection, tab visibility, and lazy code/diff fetching. Returns the state
 * and handlers the presentational subviews need.
 */
export function usePreviewPane({ initialUrl, projectId, projectTemplate, taskId, verifyStatus, buildStatus, targetFiles }: UsePreviewPaneArgs) {
    const [url, setUrl] = useState(initialUrl);
    const [inputUrl, setInputUrl] = useState(initialUrl);
    const [tab, setTab] = useState<PreviewTab>("preview");
    // Preview body mode: "app" = live iframe (frontend), "api" = request console
    // (backend). Opt-in toggle so existing behaviour is unchanged by default.
    const [previewKind, setPreviewKind] = useState<"app" | "api">("app");
    const [reloadKey, setReloadKey] = useState(0);

    // Reachability of the preview target. null/true render the live iframe
    // optimistically (the common case); only a confirmed `false` swaps in the
    // offline empty state — avoids flashing it on every normal load.
    const [reachable, setReachable] = useState<boolean | null>(null);
    const wasUnreachableRef = useRef(false);
    // Once the user picks a mode, detection stops overriding their choice.
    const manualKindRef = useRef(false);

    const checkReachability = async (): Promise<boolean> => {
        try {
            const res = await fetch(`/api/loop-projects/${projectId}/preview-status?url=${encodeURIComponent(url)}`);
            const data = await res.json();
            return Boolean(data.success && data.data?.reachable);
        } catch {
            return false;
        }
    };

    // Relative paths (this app's own routes, e.g. the "/" fallback) are always
    // same-origin — only probe absolute http(s) targets, which is what a
    // project's own dev server preview URL looks like.
    useEffect(() => {
        if (tab !== "preview" || !/^https?:\/\//.test(url)) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setReachable(true);
            return;
        }

        let cancelled = false;
        let timer: ReturnType<typeof setTimeout> | undefined;

        const poll = async () => {
            const ok = await checkReachability();
            if (cancelled) return;
            if (ok && wasUnreachableRef.current) {
                // Server just came back — force the iframe to remount so it
                // doesn't keep showing the browser's stale error page.
                setReloadKey((k) => k + 1);
            }
            wasUnreachableRef.current = !ok;
            setReachable(ok);
            if (!ok) timer = setTimeout(poll, 3000);
        };

        void poll();
        return () => {
            cancelled = true;
            if (timer) clearTimeout(timer);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, url, projectId]);

    // Auto-pick App vs API mode: template first, else probe the target's content
    // type (through our proxy). A manual toggle wins and disables detection.
    useEffect(() => {
        if (manualKindRef.current) return;
        const fromTemplate = kindFromTemplate(projectTemplate);
        if (fromTemplate) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setPreviewKind(fromTemplate);
            return;
        }
        if (reachable !== true || !/^https?:\/\//.test(url)) return;
        let cancelled = false;
        (async () => {
            try {
                const r = await fetch(`/api/loop-projects/${projectId}/api-request`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url, method: "GET" }),
                });
                const j = await r.json();
                if (cancelled || !j.success) return;
                const ct = String(j.data.contentType || "").toLowerCase();
                const head = String(j.data.body || "").slice(0, 400).toLowerCase();
                const isApi = ct.includes("json") || (!ct.includes("html") && !head.includes("<html") && !head.includes("<!doctype"));
                if (!manualKindRef.current) setPreviewKind(isApi ? "api" : "app");
            } catch {
                /* keep current mode */
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [reachable, url, projectId, projectTemplate]);

    // Only surface the App/API toggle when the project can plausibly serve an API
    // (backend template, "generic", or detected/selected as API). A pure frontend
    // shows just the live preview — no empty "API" mode to click into.
    const apiCapable = projectTemplate === "nodejs" || projectTemplate === "generic" || previewKind === "api";
    const bodyKind: "app" | "api" = apiCapable ? previewKind : "app";

    // Code viewing states
    const [selectedFile, setSelectedFile] = useState(targetFiles[0] || "");
    const [codeContent, setCodeContent] = useState("");
    const [loadingCode, setLoadingCode] = useState(false);
    const [codeError, setCodeError] = useState("");

    // Diff viewing states
    const [diffContent, setDiffContent] = useState("");
    const [loadingDiff, setLoadingDiff] = useState(false);
    const [diffError, setDiffError] = useState("");

    // Derive the file to display: keep user's selection if still valid, else fall back to first file.
    const effectiveSelectedFile = targetFiles.includes(selectedFile)
        ? selectedFile
        : (targetFiles[0] ?? "");

    // Determine which tabs have data to show
    const hasCodeFiles = targetFiles.length > 0;
    const hasDiffData = verifyStatus !== "idle" || buildStatus !== "idle";

    const visibleTabs = ALL_TABS.filter((t) => {
        if (t.key === "code") return hasCodeFiles;
        if (t.key === "diff") return hasDiffData;
        return true;
    });

    // If the current tab becomes hidden (e.g. files cleared), fall back to preview
    useEffect(() => {
        const checkFallback = () => {
            if (!visibleTabs.some((t) => t.key === tab)) {
                setTab("preview");
            }
        };
        checkFallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasCodeFiles, hasDiffData]);

    // Fetch code content
    useEffect(() => {
        if (tab !== "code" || !effectiveSelectedFile) return;

        const beginFetch = () => {
            setLoadingCode(true);
            setCodeError("");
            fetch(`/api/loop-projects/${projectId}/files?file=${encodeURIComponent(effectiveSelectedFile)}`)
                .then((res) => res.json())
                .then((json) => {
                    if (json.success) {
                        setCodeContent(json.data);
                    } else {
                        setCodeError(json.error || "Failed to load file content.");
                    }
                })
                .catch(() => {
                    setCodeError("Network error: failed to load file content.");
                })
                .finally(() => {
                    setLoadingCode(false);
                });
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
                    if (json.success) {
                        setDiffContent(json.data);
                    } else {
                        setDiffError(json.error || "Failed to load git diff.");
                    }
                })
                .catch(() => {
                    setDiffError("Network error: failed to load git diff.");
                })
                .finally(() => {
                    setLoadingDiff(false);
                });
        };
        beginFetch();
    }, [tab, taskId, projectId]);

    const loadUrl = (e: React.FormEvent) => {
        e.preventDefault();
        const next = inputUrl.trim();
        if (!next) return;
        setUrl(next);
        setReloadKey((k) => k + 1);
    };

    // Reload button: remount the iframe and re-probe reachability.
    const reload = async () => {
        setReloadKey((k) => k + 1);
        const ok = await checkReachability();
        wasUnreachableRef.current = !ok;
        setReachable(ok);
    };

    // Offline empty-state retry: only remount once we confirm it's back.
    const retry = async () => {
        const ok = await checkReachability();
        if (ok) setReloadKey((k) => k + 1);
        wasUnreachableRef.current = !ok;
        setReachable(ok);
    };

    const selectApp = () => { manualKindRef.current = true; setPreviewKind("app"); };
    const selectApi = () => { manualKindRef.current = true; setPreviewKind("api"); };

    return {
        url,
        inputUrl,
        setInputUrl,
        loadUrl,
        reloadKey,
        reachable,
        reload,
        retry,
        tab,
        setTab,
        visibleTabs,
        previewKind,
        apiCapable,
        bodyKind,
        selectApp,
        selectApi,
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
