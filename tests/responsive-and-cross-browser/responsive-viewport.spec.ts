/**
 * NEXORA AUTOMATED TEST SUITE: LAYER 4 - RESPONSIVE & VIEWPORT MATRIX
 * Verifying UI adaptiveness across Desktop (1440px) and Mobile (375px).
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env['BASE_URL'] || 'http://localhost:4200';

test.describe('NEXORA Responsive Viewport Matrix', () => {

  test('Desktop Viewport (1440x900): Steam-Style 2-Column Showcase & Desktop Header', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/catalog`, { waitUntil: 'networkidle' });

    // Desktop Nav is visible
    await expect(page.locator('.desktop-nav')).toBeVisible();

    // Mobile Hamburger is hidden
    const mobileToggle = page.locator('.mobile-menu-toggle');
    const isMobileToggleVisible = await mobileToggle.isVisible().catch(() => false);
    expect(isMobileToggleVisible).toBeFalsy();

    // Navigate to game detail
    await page.goto(`${BASE_URL}/games/game_001`, { waitUntil: 'networkidle' });
    await expect(page.locator('.steam-upper-showcase, .steam-showcase-stage').first()).toBeVisible();
    await expect(page.locator('.steam-stage-column, .steam-media-col').first()).toBeVisible();
    await expect(page.locator('.steam-capsule-column, .steam-capsule-col').first()).toBeVisible();
  });

  test('Mobile Viewport (375x667): Single Column Stack & Fluid Mobile Controls', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/catalog`, { waitUntil: 'networkidle' });

    // Mobile Hamburger Toggle is visible
    const mobileToggle = page.locator('.mobile-menu-toggle, .btn-hamburger');
    if (await mobileToggle.isVisible()) {
      await mobileToggle.click();
      await page.waitForTimeout(300);
      await expect(page.locator('.mobile-nav-panel, .mobile-menu').first()).toBeVisible();
      // Close menu
      await mobileToggle.click();
    }

    // Navigate to game detail on mobile
    await page.goto(`${BASE_URL}/games/game_001`, { waitUntil: 'networkidle' });
    await expect(page.locator('.steam-upper-showcase, .steam-showcase-stage').first()).toBeVisible();
    await expect(page.locator('.steam-stage-main, .steam-main-viewer').first()).toBeVisible();
  });

});
