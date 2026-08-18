import { test, expect } from '@playwright/test';

test('headful demo: verify page load and interaction', async ({ page }) => {
  console.log('Navigating to example.com...');
  await page.goto('https://example.com');

  // Verify page heading
  const heading = page.locator('h1');
  await expect(heading).toHaveText('Example Domain');

  console.log('Page header verified in headful browser!');

  // Short pause for visual inspection
  await page.waitForTimeout(2500);
});
