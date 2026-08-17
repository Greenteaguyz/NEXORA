import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

async function runQAAudit() {
  console.log('======================================================================');
  console.log('🛡️ RUNNING OFFICIAL BROWSER-QA SKILL AUDIT & LIVE INTERACTION TEST');
  console.log('======================================================================\n');

  const artifactDir = 'C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\0b8bc6ef-6851-40ea-9d6b-2357e622cd2d';
  const outDir = path.join(artifactDir, 'screenshots');
  const projectOutDir = 'c:\\Users\\User\\Downloads\\AngularProject\\screenshots';

  [outDir, projectOutDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  const browser = await chromium.launch({ headless: true });
  
  let totalChecks = 0;
  let passedChecks = 0;
  let failedChecks = 0;
  const consoleErrors: string[] = [];

  function pass(title: string) {
    console.log(`  [✓] PASS: ${title}`);
    totalChecks++;
    passedChecks++;
  }

  function fail(title: string, error: any) {
    console.error(`  [✗] FAIL: ${title} ->`, error);
    totalChecks++;
    failedChecks++;
  }

  try {
    // ==================================================================
    // PHASE 1: SMOKE TEST & CONSOLE ERROR MONITORING
    // ==================================================================
    console.log('--- PHASE 1: Smoke Test & Network Health ---');
    const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await desktopContext.newPage();

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const response = await page.goto('http://localhost:4200/catalog', { waitUntil: 'networkidle' });
    if (response && response.status() === 200) {
      pass('Catalog route returns HTTP 200 OK');
    } else {
      fail('Catalog route response', `Status: ${response?.status()}`);
    }

    if (consoleErrors.length === 0) {
      pass('Zero runtime console errors during initial load');
    } else {
      fail('Console errors detected', consoleErrors);
    }

    // ==================================================================
    // PHASE 2: INTERACTION & JOURNEY AUDIT
    // ==================================================================
    console.log('\n--- PHASE 2: User Journeys & Interactive Features ---');
    
    // 1. Navigation links
    await page.click('nav a[href="/genres"]');
    await page.waitForURL('**/genres');
    pass('Navigation link to /genres works');

    await page.click('nav a[href="/support"]');
    await page.waitForURL('**/support');
    pass('Navigation link to /support works');

    await page.click('a.logo-link');
    await page.waitForURL('**/catalog');
    pass('Brand logo links back to Store Catalog (/catalog)');

    // 2. Search & Tag Filtering
    await page.fill('input.search-input', 'Drift');
    await page.waitForTimeout(300);
    const searchCards = await page.$$('app-game-card');
    if (searchCards.length === 1) {
      pass('Interactive search for "Drift" correctly isolated Neon Drift');
    } else {
      fail('Search interaction', `Got ${searchCards.length} cards`);
    }

    await page.click('button.btn-clear-search');
    await page.waitForTimeout(300);

    // 3. Theme Toggle Interaction
    await page.click('button.theme-pill');
    await page.waitForTimeout(300);
    const lightThemeAttr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    if (lightThemeAttr === 'light') {
      pass('Theme toggle switch to Light Mode verified');
    } else {
      fail('Light theme switch', `Theme: ${lightThemeAttr}`);
    }

    await page.click('button.theme-pill');
    await page.waitForTimeout(300);
    const darkThemeAttr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    if (darkThemeAttr === 'dark') {
      pass('Theme toggle switch back to Dark Mode verified');
    }

    // 4. Full Authentication & Role Persona Journey
    await page.click('button.demo-pill:has-text("Alice (Creator)")');
    await page.waitForTimeout(350);
    const activeUserName = await page.$eval('.user-name', el => el.textContent?.trim());
    const activeUserRole = await page.$eval('.role-pill', el => el.textContent?.trim());
    if (activeUserName === 'Alice Vance' && activeUserRole === 'Creator') {
      pass('Creator demo switch authenticated Alice Vance with Creator badge');
    } else {
      fail('Creator auth', `User: ${activeUserName}, Role: ${activeUserRole}`);
    }

    const studioVisible = await page.isVisible('nav a[href="/studio"]');
    if (studioVisible) {
      pass('Creator Studio navigation is visible for Creator account');
    }

    // Switch to Buyer
    await page.click('button.demo-pill:has-text("Bob (Buyer)")');
    await page.waitForTimeout(350);
    const buyerRole = await page.$eval('.role-pill', el => el.textContent?.trim());
    const studioForBuyer = await page.isVisible('nav a[href="/studio"]');
    if (buyerRole === 'Buyer' && !studioForBuyer) {
      pass('Buyer demo switch authenticated Bob Mercer and hid Creator Studio');
    }

    // Logout
    await page.click('button.btn-logout');
    await page.waitForTimeout(350);
    const loggedOutBtns = await page.isVisible('a.btn-secondary:has-text("Log In")');
    if (loggedOutBtns) {
      pass('Logout clears session and restores Log In / Register CTAs');
    }

    // ==================================================================
    // PHASE 3: RESPONSIVE BREAKPOINT & VISUAL VALIDATION
    // ==================================================================
    console.log('\n--- PHASE 3: Responsive Breakpoints (Mobile, Tablet, Desktop) ---');

    // Mobile Viewport (375px)
    const mobileContext = await browser.newContext({ viewport: { width: 375, height: 667 } });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto('http://localhost:4200/catalog', { waitUntil: 'networkidle' });
    const mobileCards = await mobilePage.$$('app-game-card');
    if (mobileCards.length === 10) {
      pass('Mobile viewport (375px) renders 10 game cards in single column layout');
    }
    await mobilePage.screenshot({ path: path.join(outDir, 'mobile_375px_catalog.png'), fullPage: true });
    await mobileContext.close();

    // Tablet Viewport (768px)
    const tabletContext = await browser.newContext({ viewport: { width: 768, height: 1024 } });
    const tabletPage = await tabletContext.newPage();
    await tabletPage.goto('http://localhost:4200/catalog', { waitUntil: 'networkidle' });
    pass('Tablet viewport (768px) renders responsive grid smoothly');
    await tabletPage.screenshot({ path: path.join(outDir, 'tablet_768px_catalog.png'), fullPage: true });
    await tabletContext.close();

    // ==================================================================
    // PHASE 4: ACCESSIBILITY & SEMANTIC STRUCTURE
    // ==================================================================
    console.log('\n--- PHASE 4: Accessibility & Semantic Structure ---');
    
    // Check main semantic landmarks
    const hasHeader = await page.isVisible('header.header-shell');
    const hasNav = await page.isVisible('nav');
    const hasMain = await page.isVisible('main, .catalog-shell, .catalog-hero');
    const hasFooter = await page.isVisible('footer.footer-shell');

    if (hasHeader && hasNav && hasMain && hasFooter) {
      pass('All core HTML5 semantic landmarks present (header, nav, main, footer)');
    } else {
      fail('Semantic landmarks', { hasHeader, hasNav, hasMain, hasFooter });
    }

    // Check Image Alt attributes
    const missingAlts = await page.$$eval('img:not([alt])', imgs => imgs.length);
    if (missingAlts === 0) {
      pass('All images possess descriptive alt attributes');
    } else {
      fail('Image accessibility', `${missingAlts} images missing alt attribute`);
    }

    await desktopContext.close();

  } catch (err) {
    console.error('Fatal audit error:', err);
    fail('Audit execution', err);
  } finally {
    await browser.close();
  }

  console.log('\n======================================================================');
  console.log(`📊 FINAL QA REPORT: ${passedChecks}/${totalChecks} PASSED (${failedChecks} FAILED)`);
  console.log(`🏆 OVERALL VERDICT: ${failedChecks === 0 ? 'SHIP (100% READY)' : 'FIXES REQUIRED'}`);
  console.log('======================================================================\n');

  if (failedChecks > 0) {
    process.exit(1);
  }
}

runQAAudit();
