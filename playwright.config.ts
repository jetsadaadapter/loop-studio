import { defineConfig, devices } from "@playwright/test";

// Visual-regression config. Scope for this round: the dev component gallery only.
// The dev server MUST run in development mode (NODE_ENV=development) because the
// /dev/component-gallery route is gated to non-production, so we cannot use a
// production `next start` server here.
export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: "list",
  timeout: 60_000,
  expect: {
    // Always freeze CSS animations/transitions and hold a tight diff budget so a
    // baseline only changes when the rendered pixels genuinely change.
    toHaveScreenshot: {
      animations: "disabled",
      maxDiffPixelRatio: 0.01,
    },
  },
  use: {
    baseURL: "http://localhost:3000",
    // Fixed viewport — never inherit the host machine's default.
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
