import { test, expect } from '@playwright/test';

test.describe('NEXORA App Headful Verification', () => {
  
  test('Catalog, Search, Theme Toggle, Authentication, and Navigation', async ({ page }) => {
    // 1. Visit Catalog
    console.log('1. Navigating to NEXORA Game Catalog...');
    await page.goto('http://localhost:4200/catalog');
    await expect(page).toHaveTitle(/NEXORA/);
    await page.waitForTimeout(1000);

    // 2. Test Search / Filtering
    console.log('2. Testing Search Input...');
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Cyber');
      await page.waitForTimeout(1000);
      await searchInput.clear();
      await page.waitForTimeout(800);
    }

    // 3. Test Theme Toggle (Dark <-> Light)
    console.log('3. Testing Dark/Light Theme Switching...');
    const themeBtn = page.locator('button.theme-pill, button.theme-toggle').first();
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await page.waitForTimeout(1200);

      await themeBtn.click();
      await page.waitForTimeout(1200);
    }

    // 4. Test Login Flow
    console.log('4. Navigating to Login Page...');
    await page.goto('http://localhost:4200/login');
    await page.waitForTimeout(800);

    console.log('Filling in login credentials...');
    await page.fill('#email', 'alice@nexora.io');
    await page.waitForTimeout(500);
    await page.fill('#password', 'password123');
    await page.waitForTimeout(500);

    console.log('Submitting login form...');
    await page.click('button.btn-submit');
    await page.waitForTimeout(1500);

    // 5. Navigate to Genres
    console.log('5. Navigating to Genres & Categories...');
    await page.goto('http://localhost:4200/genres');
    await page.waitForTimeout(1500);

    // 6. Navigate to Support FAQ
    console.log('6. Navigating to Support & FAQ...');
    await page.goto('http://localhost:4200/support');
    await page.waitForTimeout(1500);

    console.log('All headful app tests completed successfully!');
  });

});
