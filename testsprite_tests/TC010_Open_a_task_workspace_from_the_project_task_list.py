import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host",
                "--single-process"
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        # Wider default timeout to match the agent's DOM-stability budget;
        # auto-waiting Playwright APIs (expect, locator.wait_for) inherit this.
        context.set_default_timeout(15000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> navigate
        await page.goto("http://localhost:3000")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Click the 'Open Studio' link on the 'App Store (Host)' project card to open its workspace.
        # Open Studio link
        elem = page.locator('a[href="/app-store-default"]')
        await elem.click(timeout=10000)
        
        # -> Click the 'Tasks' tab to switch to the Tasks view.
        # Tasks button
        elem = page.get_by_role('button', name='Tasks', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Enter Loop' button on the task row to open the task workspace.
        # Enter Loop link
        elem = page.get_by_role('link', name='Enter Loop', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the task workspace is displayed
        # Assert: The URL shows the task workspace for task-1783322272499.
        await expect(page).to_have_url(re.compile("/app\\-store\\-default/tasks/task\\-1783322272499"), timeout=15000), "The URL shows the task workspace for task-1783322272499."
        await page.locator("xpath=/html/body/main/div/div[2]/div[1]/div[2]/button").nth(0).scroll_into_view_if_needed()
        # Assert: The 'Commit & Publish' button is visible in the task workspace.
        await expect(page.locator("xpath=/html/body/main/div/div[2]/div[1]/div[2]/button").nth(0)).to_be_visible(timeout=15000), "The 'Commit & Publish' button is visible in the task workspace."
        await page.locator("xpath=/html/body/main/div/div[2]/div[2]/div[1]/div[1]/form/div/textarea").nth(0).scroll_into_view_if_needed()
        # Assert: The task chat input ('Ask a follow-up…') is visible in the workspace.
        await expect(page.locator("xpath=/html/body/main/div/div[2]/div[2]/div[1]/div[1]/form/div/textarea").nth(0)).to_be_visible(timeout=15000), "The task chat input ('Ask a follow-up\u2026') is visible in the workspace."
        await page.locator("xpath=/html/body/main/div/div[2]/div[2]/div[2]/div[1]/div[2]/div/iframe").nth(0).scroll_into_view_if_needed()
        # Assert: The workspace preview iframe is present.
        await expect(page.locator("xpath=/html/body/main/div/div[2]/div[2]/div[2]/div[1]/div[2]/div/iframe").nth(0)).to_be_visible(timeout=15000), "The workspace preview iframe is present."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    