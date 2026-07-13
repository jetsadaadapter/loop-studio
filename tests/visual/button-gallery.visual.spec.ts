
import { test, expect } from '@playwright/test';

// Define a base URL for your application if not already configured in playwright.config.ts
// test.use({ baseURL: 'http://localhost:3000' }); // Uncomment and adjust if needed

test.describe("Button gallery visual regression", () => {
  // Navigate to the page containing the button gallery before each test
  test.beforeEach(async ({ page }) => {
    // !!! IMPORTANT: You MUST replace "/your-button-gallery-page-path" with the actual URL path where your button gallery is rendered.
    // For example: "/components/button-gallery" or "/" if it's on the homepage.
    await page.goto("/button-gallery");
    // Wait for the network to be idle, implying the page has loaded its main content
    await page.waitForLoadState('networkidle', { timeout: 10000 }); // Increased timeout for loading
  });

  test("renders the full button gallery", async ({ page }) => {
    const gallery = page.getByTestId("gallery-root");
    // Wait for the gallery element to be visible and stable before taking a screenshot
    await gallery.waitFor({ state: 'visible', timeout: 10000 }); // Wait up to 10 seconds for element
    await expect(gallery).toHaveScreenshot("button-gallery-full.png", {
      timeout: 10000, // Increased screenshot timeout to 10 seconds
      maxDiffPixelRatio: 0.01, // Optional: Allows a small pixel difference
    });
  });

  test("renders the outline variant in hover state", async ({ page }) => {
    // Wait for the page to be fully stable and scroll to the button if it's not in view
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    const button = page.getByTestId("button-outline-default");

    // Wait for the button to be visible and interactive
    await button.waitFor({ state: 'visible', timeout: 10000 });
    await button.scrollIntoViewIfNeeded(); // Ensure the button is in the viewport

    await button.hover({ timeout: 15000 }); // Increase hover timeout to 15 seconds as a precaution

    await expect(button).toHaveScreenshot("button-outline-hover.png", {
      timeout: 10000, // Increased screenshot timeout to 10 seconds
      maxDiffPixelRatio: 0.01,
    });
  });
});
