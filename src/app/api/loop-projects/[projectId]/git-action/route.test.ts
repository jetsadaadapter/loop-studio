import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the service the git-action route delegates to, so we exercise its init
// control flow (guards + git calls) without touching a real repo.
const { getProjectsMock, execGitMock, isOwnRepoMock, isHostMock, gitInfoMock } = vi.hoisted(() => ({
    getProjectsMock: vi.fn(),
    execGitMock: vi.fn(),
    isOwnRepoMock: vi.fn(),
    isHostMock: vi.fn(),
    gitInfoMock: vi.fn(),
}));

vi.mock("@/core/services/loop-projects.service", () => ({
    getProjects: getProjectsMock,
    executeGitCommand: execGitMock,
    isOwnGitRepo: isOwnRepoMock,
    isHostProject: isHostMock,
    getGitInfo: gitInfoMock,
}));

import { POST } from "./route";

function post(body: unknown, projectId = "p1") {
    const req = new Request("http://localhost/api/loop-projects/p1/git-action", {
        method: "POST",
        body: JSON.stringify(body),
    });
    return POST(req, { params: Promise.resolve({ projectId }) });
}

beforeEach(() => {
    vi.clearAllMocks();
    getProjectsMock.mockReturnValue([{ id: "p1", path: "/proj" }]);
    execGitMock.mockResolvedValue("");
    isHostMock.mockReturnValue(false);
    isOwnRepoMock.mockResolvedValue(false);
    gitInfoMock.mockResolvedValue({ branch: "main", commit: "abc1234", modifiedFiles: [] });
});

describe("git-action init", () => {
    it("initializes a repo (init -b main + commit) and returns the fresh git info", async () => {
        const res = await post({ action: "init", initialCommit: true });
        const json = await res.json();

        expect(json.success).toBe(true);
        expect(execGitMock).toHaveBeenCalledWith("/proj", ["init", "-b", "main"]);
        expect(execGitMock).toHaveBeenCalledWith("/proj", ["add", "-A"]);
        expect(execGitMock).toHaveBeenCalledWith("/proj", ["commit", "-m", "Initial commit"]);
        expect(json.data.gitInfo.branch).toBe("main");
    });

    it("links a remote when a URL is supplied", async () => {
        await post({ action: "init", initialCommit: false, remoteUrl: "git@github.com:me/repo.git" });
        expect(execGitMock).toHaveBeenCalledWith("/proj", ["remote", "add", "origin", "git@github.com:me/repo.git"]);
        expect(execGitMock).not.toHaveBeenCalledWith("/proj", ["add", "-A"]); // initialCommit false
    });

    it("refuses to init the host app", async () => {
        isHostMock.mockReturnValue(true);
        const res = await post({ action: "init" });
        expect(res.status).toBe(400);
        expect(execGitMock).not.toHaveBeenCalledWith("/proj", ["init", "-b", "main"]);
    });

    it("refuses to init a project that is already a repo", async () => {
        isOwnRepoMock.mockResolvedValue(true);
        const res = await post({ action: "init" });
        expect(res.status).toBe(400);
        expect(execGitMock).not.toHaveBeenCalledWith("/proj", ["init", "-b", "main"]);
    });

    it("still succeeds (with a warning) when the initial commit fails", async () => {
        execGitMock.mockImplementation((_cwd: string, args: string[]) =>
            args[0] === "commit" ? Promise.reject(new Error("no identity")) : Promise.resolve(""),
        );
        const res = await post({ action: "init", initialCommit: true });
        const json = await res.json();
        expect(json.success).toBe(true);
        expect(json.warning).toMatch(/user\.name/);
    });
});
