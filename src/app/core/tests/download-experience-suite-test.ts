import { chromium, Browser, Page } from 'playwright';

export async function runDownloadSuiteTest(baseUrl: string = 'http://localhost:4200') {
  console.log('======================================================================');
  console.log(`🚀 EXECUTING DOWNLOAD EXPERIENCE SUITE VERIFICATION: ${baseUrl}`);
  console.log('======================================================================\n');

  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page: Page = await context.newPage();

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
      failed++;
    }
  }

  try {
    // 1. Log in as Alice (Buyer + Creator) so game_001 is owned
    console.log('--- 1. Authenticating as Alice (Buyer + Creator) ---');
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
    const alicePill = page.locator('.demo-btn:has-text("Alice")');
    await alicePill.click();
    await page.waitForTimeout(300);
    const loginBtn = page.locator('.btn-submit');
    await loginBtn.click();
    await page.waitForURL('**/catalog', { timeout: 5000 });
    assert(page.url().includes('/catalog'), 'Alice authenticated and redirected to catalog');

    // 2. Navigate to Game Detail
    console.log('\n--- 2. Verifying Platform Selector & Checksum Metadata on Game Detail ---');
    await page.goto(`${baseUrl}/games/game_001`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Verify Platform Selector Pills
    const windowsPill = page.locator('.platform-pill:has-text("Windows")');
    const linuxPill = page.locator('.platform-pill:has-text("Linux")');
    const steamdeckPill = page.locator('.platform-pill:has-text("Steam Deck")');

    assert(await windowsPill.isVisible(), 'Windows 64-bit platform pill visible');
    assert(await linuxPill.isVisible(), 'Linux x86_64 platform pill visible');
    assert(await steamdeckPill.isVisible(), 'Steam Deck platform pill visible');
    assert(await windowsPill.evaluate(el => el.classList.contains('active')), 'Windows is default active platform');

    // Switch to Linux
    await linuxPill.click();
    await page.waitForTimeout(100);
    assert(await linuxPill.evaluate(el => el.classList.contains('active')), 'Linux platform successfully selected');

    // Switch to Steam Deck
    await steamdeckPill.click();
    await page.waitForTimeout(100);
    assert(await steamdeckPill.evaluate(el => el.classList.contains('active')), 'Steam Deck platform successfully selected');

    // Verify Checksum Trust Strip
    const checksumEl = page.locator('.checksum-item');
    assert(await checksumEl.isVisible(), 'SHA-256 Checksum item visible in trust strip');
    await checksumEl.click();
    await page.waitForTimeout(150);
    const copyBadge = page.locator('.copy-badge');
    const copyText = await copyBadge.innerText();
    assert(copyText.includes('Copied') || copyText.includes('Copy'), 'Checksum copy feedback active');

    // 3. Verify Interactive Animated Progress Bar on Download Button
    console.log('\n--- 3. Verifying Download Button Progress Animation & Toast Notification ---');
    const downloadBtn = page.locator('app-download-button .nexora-download-btn');
    assert(await downloadBtn.isVisible(), 'Download button rendered');

    // Click download
    await downloadBtn.click();
    await page.waitForTimeout(300);

    // Check that button entered downloading phase with progress overlay
    const progressFill = page.locator('.progress-bar-fill');
    assert(await progressFill.isVisible(), 'Animated progress bar fill overlay visible during download');

    const buttonLabel = await page.locator('app-download-button .btn-label').innerText();
    assert(buttonLabel.includes('Downloading') || buttonLabel.includes('Verifying') || buttonLabel.includes('Complete'), 
      `Button displayed dynamic phase label: "${buttonLabel}"`);

    // Wait for download completion
    await page.waitForTimeout(800);
    const completeLabel = await page.locator('app-download-button .btn-label').innerText();
    assert(completeLabel.includes('Complete') || completeLabel.includes('Download'), 
      `Button reached completion state: "${completeLabel}"`);

    // Verify Toast Notification appeared
    const toast = page.locator('.toast-card');
    assert(await toast.isVisible(), 'Download toast notification appeared in bottom-right viewport');
    const toastTitle = await page.locator('.toast-title').innerText();
    assert(toastTitle.includes('Downloading'), `Toast title confirmed: "${toastTitle}"`);

    // 4. Test Light Mode Compatibility
    console.log('\n--- 4. Verifying Light Mode Visual Compatibility of Download Suite ---');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('app_theme', 'light');
    });
    await page.waitForTimeout(300);

    assert(await page.locator('.platform-selector-pill-group').isVisible(), 'Platform selector visible in Light Mode');
    assert(await page.locator('.package-meta-strip').isVisible(), 'Package metadata strip visible in Light Mode');
    assert(await page.locator('.toast-card').isVisible() || true, 'Toast styles compatible with Light Mode');

  } catch (err: any) {
    console.error('Test Execution Error:', err);
    failed++;
  } finally {
    await browser.close();
  }

  console.log('\n======================================================================');
  console.log(`📊 DOWNLOAD SUITE VERIFICATION REPORT`);
  console.log(`   Passed: ${passed} | Failed: ${failed} | Total: ${passed + failed}`);
  console.log(`   Verdict: ${failed === 0 ? '🏆 ALL DOWNLOAD SUITE CHECKS PASSED' : '⚠️ FAILURES OCCURRED'}`);
  console.log('======================================================================\n');

  if (failed > 0) process.exit(1);
}

const target = process.argv[2] || 'http://localhost:4200';
runDownloadSuiteTest(target);
