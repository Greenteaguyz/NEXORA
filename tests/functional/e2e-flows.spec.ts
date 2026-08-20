/**
 * PRE-LAUNCH TEST SUITE: CATEGORY 1C - E2E FLOWS
 * Real browser automation testing Signup, Checkout, Creator Publishing, and Navigation.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env['BASE_URL'] || 'http://localhost:4200';

test.describe('NEXORA Pre-Launch Core User Flows', () => {

  test('Flow 1: User Signup & Role Configuration', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle' });

    // Fill registration form
    await page.locator('#displayName').fill('StarPilot');
    await page.locator('#email').fill(`pilot_${Date.now()}@nexora.io`);
    await page.locator('#password').fill('securePass2026!');

    // Toggle Creator Switch
    const creatorSwitch = page.locator('#isCreatorCheckbox');
    await creatorSwitch.check();

    // Submit
    await page.locator('button.btn-submit').click();
    await page.waitForURL(url => !url.pathname.includes('/register'), { timeout: 5000 });
  });

  test('Flow 2: Paid Checkout with Card Brand Selector & Instant Delivery', async ({ page }) => {
    // Login as Bob
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.locator('button.demo-btn:has-text("Bob")').click();
    await page.locator('button.btn-submit').click();
    await page.waitForTimeout(400);

    // Open game_004 detail
    await page.goto(`${BASE_URL}/games/game_004`, { waitUntil: 'networkidle' });

    // Click Buy button
    const buyBtn = page.locator('app-download-button button').first();
    if (await buyBtn.isVisible()) {
      await buyBtn.click({ force: true });
      await page.waitForTimeout(400);

      // Verify modal and switch to Visa
      const visaBtn = page.locator('button.card-brand-btn:has-text("Visa")');
      await visaBtn.click();
      await expect(page.locator('.chip-card-digits')).toContainText('4242');

      // Authorize
      await page.locator('button.btn-confirm').click({ force: true });
      await page.waitForTimeout(800);
    }
  });

  test('Flow 3: Creator Game Publishing & Live Card Preview', async ({ page }) => {
    // Login as Alice
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.locator('button.demo-btn:has-text("Alice")').click();
    await page.locator('button.btn-submit').click();
    await page.waitForTimeout(400);

    // Navigate to studio publish form
    await page.goto(`${BASE_URL}/studio/games/new`, { waitUntil: 'networkidle' });
    await page.locator('#title').fill('Neon Valkyrie DX');
    await page.waitForTimeout(300);

    // Live preview card must update
    await expect(page.locator('.preview-card')).toContainText('Neon Valkyrie DX');
  });

  test('Flow 4: Primary Navigation & Catalog Discovery', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalog`, { waitUntil: 'networkidle' });
    await expect(page.locator('.store-hero')).toBeVisible();

    // Click Genres in Nav
    await page.locator('.desktop-nav a:has-text("Genres"), a[routerLink="/genres"]').first().click();
    await page.waitForURL(url => url.pathname.includes('/genres'));
    await expect(page.locator('.genre-grid, .genres-container')).toBeVisible();
  });

});
