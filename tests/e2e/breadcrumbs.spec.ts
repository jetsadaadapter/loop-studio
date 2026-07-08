import { test, expect, type APIRequestContext } from "@playwright/test";
import fs from "fs";
import os from "os";
import path from "path";

// Breadcrumb navigation across the sub-pages. The suite provisions its own
// fixture project + task through the real API (the app and tests run on the
// same machine), so it never depends on whatever happens to be registered.

let tmpDir: string;
let projectId: string;
let taskId: string;
let projectName: string;

async function api(request: APIRequestContext, method: "post" | "delete", url: string, data?: unknown) {
    const res = await request[method](url, data ? { data } : undefined);
    const body = await res.json();
    expect(body.success, `${method.toUpperCase()} ${url} failed: ${body.error ?? ""}`).toBe(true);
    return body.data;
}

test.beforeAll(async ({ request }) => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "loop-e2e-"));
    projectName = `E2E Breadcrumbs ${Date.now()}`;
    const project = await api(request, "post", "/api/loop-projects", {
        action: "register",
        name: projectName,
        path: tmpDir,
        template: "generic",
    });
    projectId = project.id;

    const task = await api(request, "post", `/api/loop-projects/${projectId}/tasks`, {
        name: "E2E breadcrumb task",
        targetFiles: ["src/example.ts"],
    });
    taskId = task.id;
});

test.afterAll(async ({ request }) => {
    if (projectId) await api(request, "delete", `/api/loop-projects/${projectId}`);
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("project workspace shows Home › project trail", async ({ page }) => {
    await page.goto(`/${projectId}`, { waitUntil: "domcontentloaded" });
    const nav = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(nav.getByTitle("Dashboard")).toHaveAttribute("href", "/");
    // Current page is plain text, not a link.
    await expect(nav.getByText(projectName)).toBeVisible();
    await expect(nav.getByRole("link", { name: projectName })).toHaveCount(0);
});

test("task studio trail links back to the project workspace", async ({ page }) => {
    await page.goto(`/${projectId}/tasks/${taskId}`, { waitUntil: "domcontentloaded" });
    const nav = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(nav.getByText("E2E breadcrumb task")).toBeVisible();

    // The project crumb is a link; clicking it navigates back to the workspace.
    await nav.getByRole("link", { name: projectName }).click();
    await expect(page).toHaveURL(new RegExp(`/${projectId}$`));
});

test("agents page trail returns Home to the dashboard", async ({ page }) => {
    await page.goto("/agents", { waitUntil: "domcontentloaded" });
    const nav = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(nav.getByText("AI Developer Team")).toBeVisible();

    await nav.getByTitle("Dashboard").click();
    await expect(page).toHaveURL(/\/$/);
});
