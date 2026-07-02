import { test, expect } from "@playwright/test";

// Visual-regression baseline for the shared Button primitive. Scope: the dev
// component gallery ONLY (no forms/drawers/dialogs). These two shots are the
// tripwire for a className/style regression flowing through buttonVariants() + cn().
test.describe("Button gallery visual regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dev/component-gallery");

    // Fonts use display:"swap" in the root layout — wait for them to settle so a
    // FOUT never lands in the first paint and makes the baseline flaky.
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    // Hide the Next.js dev overlay/indicator so it can never leak into a shot.
    await page.addStyleTag({
      content: "nextjs-portal{display:none !important}",
    });
  });

  test("renders the full button gallery", async ({ page }) => {
    const gallery = page.getByTestId("gallery-root");
    await expect(gallery).toHaveScreenshot("button-gallery-full.png");
  });

  test("renders the outline variant in hover state", async ({ page }) => {
    // Uses `outline` because its hover state produces a real, visible delta
    // (bg-muted fill + text-foreground) — unlike `default`, whose hover rule is
    // [a]:hover:* and never fires on a <button>. This actually guards that cn()
    // composes a valid className for the :hover class set.
    const button = page.getByTestId("button-outline-default");
    await button.hover();
    await expect(button).toHaveScreenshot("button-outline-hover.png");
  });
});
