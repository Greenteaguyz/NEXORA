/**
 * NEXORA AUTOMATED TEST SUITE: LAYER 3 - E2E USER JOURNEYS
 * Playwright browser-driven simulation of real visitor, buyer, and creator journeys.
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env['BASE_URL'] || 'http://localhost:4200';

test.describe('NEXORA E2E User Journeys', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/catalog`, { waitUntil: 'networkidle' });
  });

  test('Journey 1: Anonymous Discovery & Public Storefront', async ({ page }) => {
    // 1. Check title & brand
    await expect(page).toHaveTitle(/NEXORA/);

    // 2. Search & Tag Filtering
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('Marvel');
    await page.waitForTimeout(300);
    const marvelCard = page.locator('app-game-card:has-text("Marvel Rivals")');
    await expect(marvelCard).toBeVisible();

    // 3. Open Game Detail
    await page.goto(`${BASE_URL}/games/game_001`, { waitUntil: 'networkidle' });
    await expect(page.locator('.steam-showcase-title, h1').first()).toContainText('Marvel Rivals');

    // 4. Toggle OS specs
    const linuxTab = page.locator('button:has-text("Linux"), .os-tab:has-text("Linux")').first();
    if (await linuxTab.isVisible()) {
      await linuxTab.click();
      await page.waitForTimeout(200);
      await expect(page.locator('.spec-card').first()).toBeVisible();
    }
  });

  test('Journey 2: Authentication & Password Visibility Toggle', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });

    // 1. Password Visibility Eye Toggle
    const passwordInput = page.locator('#password');
    const eyeToggle = page.locator('.btn-toggle-password');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    await eyeToggle.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    await eyeToggle.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // 2. 1-Click Demo Quick-Fill & Login
    const bobBtn = page.locator('button.demo-btn:has-text("Bob")');
    await bobBtn.click();
    await expect(page.locator('#email')).toHaveValue('bob@nexora.io');

    await page.locator('button.btn-submit').click();
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 5000 });
    await expect(page.locator('.desktop-nav')).toContainText('Library');
  });

  test('Journey 3: Paid Checkout with Visa/Mastercard Brand Switcher & Invoice Print', async ({ page }) => {
    // Log in as Bob
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.locator('button.demo-btn:has-text("Bob")').click();
    await page.locator('button.btn-submit').click();
    await page.waitForTimeout(500);

    // Navigate to paid game
    await page.goto(`${BASE_URL}/games/game_004`, { waitUntil: 'networkidle' });

    // Click Buy button to open modal
    const buyBtn = page.locator('app-download-button button').first();
    if (await buyBtn.isVisible()) {
      await buyBtn.click({ force: true });
      await page.waitForTimeout(400);

      // Verify modal and switch to Mastercard
      const modal = page.locator('app-purchase-confirm-modal .modal-card');
      await expect(modal).toBeVisible();

      const mastercardBtn = page.locator('button.card-brand-btn:has-text("Mastercard")');
      await mastercardBtn.click();
      await expect(page.locator('.chip-card-digits')).toContainText('5555');

      // Authorize & Buy
      const confirmBtn = page.locator('button.btn-confirm');
      await confirmBtn.click({ force: true });
      await page.waitForTimeout(800);
    }

    // Check Orders history & receipt modal
    await page.goto(`${BASE_URL}/orders`, { waitUntil: 'networkidle' });
    const viewReceiptBtn = page.locator('button:has-text("View Receipt"), button:has-text("Receipt")').first();
    if (await viewReceiptBtn.isVisible()) {
      await viewReceiptBtn.click();
      await expect(page.locator('.receipt-modal-card')).toBeVisible();
    }
  });

  test('Journey 4: Creator Studio Game Publishing & Live Card Preview', async ({ page }) => {
    // Log in as Alice (Creator)
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.locator('button.demo-btn:has-text("Alice")').click();
    await page.locator('button.btn-submit').click();
    await page.waitForTimeout(500);

    // Access Creator Studio
    await page.goto(`${BASE_URL}/studio`, { waitUntil: 'networkidle' });
    await expect(page.locator('.studio-header')).toBeVisible();

    // Open Publish New Game form
    await page.goto(`${BASE_URL}/studio/games/new`, { waitUntil: 'networkidle' });
    await expect(page.locator('.form-shell')).toBeVisible();

    // Verify Live Storefront Card Preview
    const titleInput = page.locator('#title');
    await titleInput.fill('Aero Cyber Strike');
    await page.waitForTimeout(200);
    await expect(page.locator('.preview-card')).toContainText('Aero Cyber Strike');
  });

  test('Journey 5: Profile Avatar Edit, Preset Selection & Instant Header Sync', async ({ page }) => {
    // 1. Log in as Bob
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.locator('button.demo-btn:has-text("Bob")').click();
    await page.locator('button.btn-submit').click();
    await page.waitForTimeout(500);

    // 2. Navigate to Profile
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle' });
    await expect(page.locator('.user-display-name')).toContainText('Bob');

    // 3. Open Edit Profile Modal
    await page.locator('button.btn-edit-profile').click();
    const editModal = page.locator('.edit-profile-modal');
    await expect(editModal).toBeVisible();

    // 4. Select Preset Avatar & change Display Name
    const presetBtns = page.locator('.preset-avatar-btn');
    if (await presetBtns.count() > 0) {
      await presetBtns.first().click();
      await page.waitForTimeout(200);
    }

    const nameInput = page.locator('#displayName');
    await nameInput.fill('Bob The Gamer');

    // 5. Save Changes
    await page.locator('button.btn-save').click();
    await page.waitForTimeout(600);

    // 6. Verify Profile Hero & Top Header Sync
    await expect(page.locator('.user-display-name')).toContainText('Bob The Gamer');
    await expect(page.locator('.user-chip')).toContainText('Bob The Gamer');
  });

});
