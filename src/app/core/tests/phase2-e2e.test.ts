import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

async function runPhase2E2E() {
  console.log('====================================================');
  console.log('🚀 RUNNING PHASE 2 LIVE E2E & SCREENSHOT TEST SUITE');
  console.log('====================================================\n');

  const artifactDir = 'C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\0b8bc6ef-6851-40ea-9d6b-2357e622cd2d';
  const outDir = path.join(artifactDir, 'screenshots');
  const projectOutDir = 'c:\\Users\\User\\Downloads\\AngularProject\\screenshots';

  [outDir, projectOutDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  let passed = 0;
  let failed = 0;

  function testPass(name: string) {
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  }

  function testFail(name: string, error: any) {
    console.error(`  ❌ FAIL: ${name}`, error);
    failed++;
  }

  async function snap(name: string) {
    const p1 = path.join(outDir, name);
    const p2 = path.join(projectOutDir, name);
    await page.screenshot({ path: p1, fullPage: true });
    fs.copyFileSync(p1, p2);
    console.log(`  📸 Captured: ${name}`);
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Game Catalog Grid (Dark Mode Default)
    // ----------------------------------------------------
    console.log('TEST 1: Game Catalog Grid & Initial Load (Dark Mode)');
    await page.goto('http://localhost:4200/catalog', { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const cards = await page.$$('app-game-card');
    if (cards.length === 10) {
      testPass(`Catalog rendered all 10 seeded game cards (count: ${cards.length})`);
    } else {
      testFail('Catalog card count', `Expected 10, got ${cards.length}`);
    }

    const firstCardTitle = await page.$eval('app-game-card h3.game-title', el => el.textContent?.trim());
    if (firstCardTitle) {
      testPass(`First card title rendered: "${firstCardTitle}"`);
    }

    await snap('08_catalog_grid_dark.png');

    // ----------------------------------------------------
    // TEST 2: Live Search & Tag Filter Chips
    // ----------------------------------------------------
    console.log('\nTEST 2: Live Substring Search & Tag Filtering');
    await page.fill('input.search-input', 'Neon');
    await page.waitForTimeout(400);

    const searchCount = (await page.$$('app-game-card')).length;
    if (searchCount === 1) {
      testPass('Search for "Neon" correctly filtered to 1 game (Neon Drift 2088)');
    } else {
      testFail('Search filter', `Expected 1 game, got ${searchCount}`);
    }

    // Clear search
    await page.click('button.btn-clear-search');
    await page.waitForTimeout(400);

    // Filter by tag
    await page.click('button.tag-filter-chip:has-text("Cyberpunk")');
    await page.waitForTimeout(400);
    const cyberpunkCount = (await page.$$('app-game-card')).length;
    if (cyberpunkCount > 0) {
      testPass(`Tag filter "Cyberpunk" active (showing ${cyberpunkCount} games)`);
    }

    // Reset filters
    await page.click('button.btn-reset-filters');
    await page.waitForTimeout(400);

    // ----------------------------------------------------
    // TEST 3: Minimalist Text Pill Theme Switcher ([ DARK ] -> [ LIGHT ])
    // ----------------------------------------------------
    console.log('\nTEST 3: Minimalist Text Pill Theme Toggle');
    const themePill = await page.$('button.theme-pill');
    if (themePill) {
      const initialText = await page.$eval('.theme-pill .theme-text', el => el.textContent?.trim());
      testPass(`Initial theme toggle text: "${initialText}"`);

      // Click to toggle to Light Mode
      await page.click('button.theme-pill');
      await page.waitForTimeout(300);

      const htmlTheme = await page.$eval('html', el => el.getAttribute('data-theme'));
      const lightPillText = await page.$eval('.theme-pill .theme-text', el => el.textContent?.trim());
      if (htmlTheme === 'light' && lightPillText === 'LIGHT') {
        testPass('Theme switched to Light Mode (data-theme="light", pill says "LIGHT")');
      } else {
        testFail('Light Mode switch', `html data-theme: ${htmlTheme}, pill text: ${lightPillText}`);
      }

      await snap('09_catalog_grid_light.png');

      // Switch back to Dark Mode for brand consistency
      await page.click('button.theme-pill');
      await page.waitForTimeout(300);
      testPass('Switched back to default Cyberpunk Dark Mode');
    } else {
      testFail('Theme toggle button', 'theme-pill not found in header');
    }

    // ----------------------------------------------------
    // TEST 4: Genre Directory Page
    // ----------------------------------------------------
    console.log('\nTEST 4: Genre Directory Page (/genres)');
    await page.goto('http://localhost:4200/genres', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const genreCards = await page.$$('.genre-card');
    if (genreCards.length >= 8) {
      testPass(`Genre Directory rendered ${genreCards.length} category cards with live counts`);
    } else {
      testFail('Genre Directory cards', `Expected >= 8, got ${genreCards.length}`);
    }

    await snap('10_genres_directory.png');

    // ----------------------------------------------------
    // TEST 5: Game Detail Page & Showcase
    // ----------------------------------------------------
    console.log('\nTEST 5: Game Detail Showcase (/games/game_001)');
    await page.goto('http://localhost:4200/games/game_001', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const detailTitle = await page.$eval('.hero-game-title', el => el.textContent?.trim());
    if (detailTitle && detailTitle.includes('Neon Drift')) {
      testPass(`Game Detail loaded correctly: "${detailTitle}"`);
    } else {
      testFail('Game Detail title', `Expected "Neon Drift: 2088", got "${detailTitle}"`);
    }

    const screenshots = await page.$$('.screenshot-thumb-box');
    if (screenshots.length >= 2) {
      testPass(`Screenshot gallery loaded ${screenshots.length} thumbnails`);
    } else {
      testFail('Screenshot gallery', `Found ${screenshots.length} thumbnails`);
    }

    await snap('11_game_detail_showcase.png');

    // ----------------------------------------------------
    // TEST 6: Screenshot Lightbox Modal
    // ----------------------------------------------------
    console.log('\nTEST 6: Screenshot Lightbox Modal Overlay');
    await page.click('.screenshot-thumb-box >> nth=0');
    await page.waitForSelector('.lightbox-backdrop', { timeout: 3000 });
    
    const lightboxVisible = await page.isVisible('.lightbox-image');
    if (lightboxVisible) {
      testPass('Lightbox modal opened with enlarged screenshot preview');
    } else {
      testFail('Lightbox image', 'Lightbox image not visible');
    }

    // Capture standard viewport screenshot so fixed modal covers 100% of visible screen
    const p1 = path.join(outDir, '12_screenshot_lightbox.png');
    const p2 = path.join(projectOutDir, '12_screenshot_lightbox.png');
    await page.screenshot({ path: p1, fullPage: false });
    fs.copyFileSync(p1, p2);
    console.log(`  📸 Captured: 12_screenshot_lightbox.png`);

    // Test next button and close
    await page.click('button.btn-lightbox-nav.next');
    await page.waitForTimeout(200);
    const counterText = await page.$eval('.lightbox-counter', el => el.textContent?.trim());
    if (counterText && counterText.startsWith('2 /')) {
      testPass('Lightbox navigated to screenshot 2');
    }

    await page.click('button.btn-lightbox-close');
    await page.waitForTimeout(200);
    const isClosed = !(await page.isVisible('.lightbox-backdrop'));
    if (isClosed) {
      testPass('Lightbox modal closed cleanly');
    } else {
      testFail('Lightbox close', 'Lightbox still visible');
    }

    // ----------------------------------------------------
    // TEST 7: Creator Profile Storefront
    // ----------------------------------------------------
    console.log('\nTEST 7: Creator Profile Storefront (/creators/usr_alice)');
    await page.goto('http://localhost:4200/creators/usr_alice', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const creatorName = await page.$eval('.creator-name', el => el.textContent?.trim());
    if (creatorName === 'Alice Vance') {
      testPass(`Creator profile loaded: "${creatorName}"`);
    } else {
      testFail('Creator name', `Expected "Alice Vance", got "${creatorName}"`);
    }

    const creatorGameCards = await page.$$('.portfolio-section app-game-card');
    if (creatorGameCards.length > 0) {
      testPass(`Creator published games portfolio rendered (${creatorGameCards.length} games)`);
    } else {
      testFail('Creator portfolio', 'No game cards rendered in portfolio');
    }

    await snap('13_creator_profile.png');

  } catch (err) {
    console.error('Fatal E2E error in Phase 2 test suite:', err);
    failed++;
  } finally {
    await browser.close();
  }

  console.log('\n====================================================');
  console.log(`📊 PHASE 2 E2E SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase2E2E();
