import { chromium } from '@playwright/test';

async function runSearchDiagnostics() {
  console.log('====================================================');
  console.log('🔍 RUNNING COMPREHENSIVE SEARCH & PALETTE DIAGNOSTICS');
  console.log('====================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log(`❌ [Browser Error]: ${msg.text()}`);
    } else if (msg.type() === 'warning') {
      consoleWarnings.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.message);
    console.log(`💥 [Page Error]: ${err.message}`);
  });

  try {
    // 1. Navigate to Store Catalog
    console.log('Step 1: Navigating to http://localhost:4200/catalog...');
    await page.goto('http://localhost:4200/catalog', { waitUntil: 'networkidle', timeout: 15000 });
    console.log('✅ Page loaded successfully');

    // 2. Open Command Palette via Header Button
    console.log('\nStep 2: Clicking Header Search button (.btn-cmd-search)...');
    const searchBtn = page.locator('button.btn-cmd-search');
    await searchBtn.click();
    await page.waitForTimeout(300);

    const paletteOverlay = page.locator('.cmd-backdrop');
    const isVisible = await paletteOverlay.isVisible();
    console.log(`Command Palette Modal Visible: ${isVisible}`);
    if (!isVisible) throw new Error('Command palette did not open on header button click!');

    // 3. Check Initial Default State
    const paletteItems = page.locator('.cmd-item');
    const initialCount = await paletteItems.count();
    console.log(`Initial game discovery items count: ${initialCount}`);
    if (initialCount === 0) throw new Error('Command palette has 0 initial items!');

    // 4. Test Search Query: "cyberpunk"
    console.log('\nStep 3: Typing query "cyberpunk"...');
    const input = page.locator('.cmd-search-input');
    await input.fill('cyberpunk');
    await page.waitForTimeout(200);

    const cyberpunkCount = await paletteItems.count();
    console.log(`Results for "cyberpunk": ${cyberpunkCount}`);
    const firstTitle = await page.locator('.cmd-item-title').first().textContent();
    console.log(`First result title: "${firstTitle?.trim()}"`);

    // 5. Test Search Query: "action"
    console.log('\nStep 4: Typing query "action"...');
    await input.fill('action');
    await page.waitForTimeout(200);
    const actionCount = await paletteItems.count();
    console.log(`Results for "action": ${actionCount}`);

    // 6. Test Search Query: "Marvel Rivals"
    console.log('\nStep 5: Typing full game title "Marvel Rivals"...');
    await input.fill('Marvel Rivals');
    await page.waitForTimeout(200);
    const marvelTitle = await page.locator('.cmd-item-title').first().textContent();
    console.log(`Top result for "Marvel Rivals": "${marvelTitle?.trim()}"`);

    // 7. Test Enter Keyboard Navigation
    console.log('\nStep 6: Pressing Enter to navigate to top result...');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(600);

    const currentUrl = page.url();
    console.log(`Current URL after Enter: ${currentUrl}`);
    if (!currentUrl.includes('/games/game_001')) {
      throw new Error(`Expected URL to include /games/game_001, got ${currentUrl}`);
    }
    console.log('✅ Navigation via Command Palette Enter succeeded!');

    // 8. Test Ctrl+K shortcut on Game Detail page
    console.log('\nStep 7: Pressing Ctrl+K on game detail page...');
    await page.keyboard.press('Control+KeyK');
    await page.waitForTimeout(300);
    const paletteReopened = await page.locator('.cmd-backdrop').isVisible();
    console.log(`Command Palette Reopened with Ctrl+K: ${paletteReopened}`);
    if (!paletteReopened) throw new Error('Ctrl+K shortcut failed to open palette!');

    // Close with Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    const paletteClosed = !(await page.locator('.cmd-backdrop').isVisible());
    console.log(`Command Palette Closed with Escape: ${paletteClosed}`);

    // 9. Test Catalog Page Search Input (#catalog-search)
    console.log('\nStep 8: Testing Store Catalog Page search input...');
    await page.goto('http://localhost:4200/catalog', { waitUntil: 'networkidle' });
    const catalogInput = page.locator('#catalog-search');
    await catalogInput.fill('Pixel');
    await page.waitForTimeout(400); // Allow 250ms debounce

    const catalogCards = page.locator('app-game-card');
    const catalogCardCount = await catalogCards.count();
    console.log(`Catalog results for "Pixel": ${catalogCardCount}`);
    const catalogCardTitle = await catalogCards.first().locator('.game-title, h3').textContent();
    console.log(`Filtered card title: "${catalogCardTitle?.trim()}"`);

    // 10. Summary & Console Error Check
    console.log('\n====================================================');
    console.log('📊 DIAGNOSTICS SUMMARY');
    console.log('====================================================');
    console.log(`Total Console Errors: ${consoleErrors.length}`);
    console.log(`Total Console Warnings: ${consoleWarnings.length}`);

    const hasNg0600 = consoleErrors.some(e => e.includes('NG0600') || e.includes('computed') || e.includes('effect'));
    console.log(`NG0600 Errors Detected: ${hasNg0600 ? 'YES ❌' : 'NONE (Clean) ✅'}`);

    if (consoleErrors.length > 0) {
      console.log('Error details:');
      consoleErrors.forEach(e => console.log(` - ${e}`));
    }

  } catch (err: any) {
    console.error(`💥 Diagnostic failed with exception: ${err.message}`);
  } finally {
    await browser.close();
  }
}

runSearchDiagnostics();
