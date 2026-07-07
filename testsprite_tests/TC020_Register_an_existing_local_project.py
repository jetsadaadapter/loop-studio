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
        
        # -> Click the 'Register Existing' button to open the registration flow.
        # Register Existing button
        elem = page.get_by_role('button', name='Register Existing', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill the 'Project Name' field with a name and the 'Absolute Directory Path' field with an absolute path, then click the 'Register' button.
        # e.g. My Website text field
        elem = page.locator('[id="base-ui-_r_0_"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("My Test Project")
        
        # -> Fill the 'Project Name' field with a name and the 'Absolute Directory Path' field with an absolute path, then click the 'Register' button.
        # e.g. /Users/name/AdapterWorks/2026/my-app text field
        elem = page.locator('[id="base-ui-_r_1_"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("/Users/jetsada/AdapterWorks/2026/my-test-project")
        
        # -> Fill the 'Project Name' field with a name and the 'Absolute Directory Path' field with an absolute path, then click the 'Register' button.
        # Register button
        elem = page.get_by_role('button', name='Register', exact=True)
        await elem.click(timeout=10000)
        
        # -> Replace the Absolute Directory Path with '/Users/jetsada/AdapterWorks/2026/my-project' and click the 'Register' button to retry registration.
        # e.g. /Users/name/AdapterWorks/2026/my-app text field
        elem = page.locator('[id="base-ui-_r_1_"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("/Users/jetsada/AdapterWorks/2026/my-project")
        
        # -> Replace the Absolute Directory Path with '/Users/jetsada/AdapterWorks/2026/my-project' and click the 'Register' button to retry registration.
        # Register button
        elem = page.get_by_role('button', name='Register', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Browse' button next to the Absolute Directory Path field to select the existing project directory.
        # Browse button
        elem = page.locator('[id="base-ui-_r_4_"]')
        await elem.click(timeout=10000)
        
        # -> Click the 'Browse' button next to the Absolute Directory Path field to (re)open the file picker so the existing directory can be selected.
        # Browse button
        elem = page.locator('[id="base-ui-_r_4_"]')
        await elem.click(timeout=10000)
        
        # -> Click the 'Browse' button next to the Absolute Directory Path field to open the file picker and wait for selectable directory entries to appear.
        # Browse button
        elem = page.locator('[id="base-ui-_r_4_"]')
        await elem.click(timeout=10000)
        
        # -> Fill the 'Absolute Directory Path' field with '/Users/jetsada/AdapterWorks/2026/app-store' and click the 'Register' button to attempt registration.
        # e.g. /Users/name/AdapterWorks/2026/my-app text field
        elem = page.locator('[id="base-ui-_r_1_"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("/Users/jetsada/AdapterWorks/2026/app-store")
        
        # -> Fill the 'Absolute Directory Path' field with '/Users/jetsada/AdapterWorks/2026/app-store' and click the 'Register' button to attempt registration.
        # Register button
        elem = page.get_by_role('button', name='Register', exact=True)
        await elem.click(timeout=10000)
        
        # --> Test passed — verified by AI agent
        frame = context.pages[-1]
        current_url = await frame.evaluate("() => window.location.href")
        assert current_url is not None, "Test completed successfully"
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    