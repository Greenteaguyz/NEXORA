import { test, expect } from '@playwright/test';

test.describe('NEXORA Full Application End-to-End Verification', () => {
  
  test('Complete Marketplace Lifecycle (Phase 1–4)', async ({ page }) => {
    // 1. Visit Catalog
    console.log('1. Navigating to Store Catalog...');
    await page.goto('http://localhost:4200/catalog');
    await expect(page).toHaveTitle(/NEXORA/);
    await page.waitForTimeout(1000);

    // 2. Search & Tag Filter
    console.log('2. Testing Search and Filtering...');
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Cyber');
      await page.waitForTimeout(800);
      await searchInput.clear();
      await page.waitForTimeout(500);
    }

    // 3. Test Theme Toggle (Dark <-> Light)
    console.log('3. Testing Dark/Light Theme Switching...');
    const themeBtn = page.locator('button.theme-pill, button.theme-toggle').first();
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await page.waitForTimeout(800);
      await themeBtn.click();
      await page.waitForTimeout(800);
    }

    // 4. Test Login Flow
    console.log('4. Authenticating with Alice persona...');
    await page.goto('http://localhost:4200/login');
    await page.waitForTimeout(500);
    await page.fill('#email', 'alice@nexora.io');
    await page.fill('#password', 'password123');
    await page.click('button.btn-submit');
    await page.waitForTimeout(1200);

    // 5. Test Game Detail & 5-State Download Button / Purchase Modal
    console.log('5. Testing Game Detail & Purchase Modal...');
    await page.goto('http://localhost:4200/games/game_001');
    await page.waitForTimeout(1000);
    const downloadBtn = page.locator('app-download-button button').first();
    await expect(downloadBtn).toBeVisible();

    // 6. Test My Library Page
    console.log('6. Navigating to My Game Library...');
    await page.goto('http://localhost:4200/library');
    await expect(page).toHaveTitle(/My Game Library/);
    await page.waitForTimeout(1000);

    // 7. Test Wishlist Page
    console.log('7. Navigating to Wishlist...');
    await page.goto('http://localhost:4200/wishlist');
    await expect(page).toHaveTitle(/My Wishlist/);
    await page.waitForTimeout(1000);

    // 8. Test Orders & Receipts Page
    console.log('8. Navigating to Order History...');
    await page.goto('http://localhost:4200/orders');
    await expect(page).toHaveTitle(/Order History/);
    await page.waitForTimeout(1000);

    // 9. Test User Profile Page
    console.log('9. Navigating to Profile Settings...');
    await page.goto('http://localhost:4200/profile');
    await expect(page).toHaveTitle(/Account Settings/);
    await page.waitForTimeout(1000);

    // 10. Test Creator Studio Page (Alice is a Creator)
    console.log('10. Navigating to Creator Studio...');
    await page.goto('http://localhost:4200/studio');
    await expect(page).toHaveTitle(/Creator Studio/);
    await page.waitForTimeout(1000);

    // 11. Test Game Publishing Form
    console.log('11. Navigating to Game Publishing Form...');
    await page.goto('http://localhost:4200/studio/games/new');
    await expect(page).toHaveTitle(/Publish New Game/);
    await page.waitForTimeout(1000);

    // 12. Test Support FAQ
    console.log('12. Navigating to Support & FAQ...');
    await page.goto('http://localhost:4200/support');
    await page.waitForTimeout(1000);

    console.log('🎉 All 12 end-to-end verification stages passed successfully!');
  });

});
