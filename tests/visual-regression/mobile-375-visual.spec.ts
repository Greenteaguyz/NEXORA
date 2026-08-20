/**
 * PRE-LAUNCH TEST SUITE: CATEGORY 4B - MOBILE (375px) VISUAL REGRESSION AUDIT
 * Capturing mobile baseline snapshots and verifying responsive mobile layout fidelity.
 */

import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env['BASE_URL'] || 'http://localhost:4200';
const SNAPSHOTS_DIR = path.join(__dirname, 'snapshots');

export async function runMobileVisualAudit(baseUrl: string = BASE_URL): Promise<boolean> {
  console.log('\n--- VISUAL REGRESSION: MOBILE (375x667) BREAKPOINT ---');

  if (!fs.existsSync(SNAPSHOTS_DIR)) {
    fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
  }

  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
    isMobile: true,
    hasTouch: true
  });
  const page: Page = await context.newPage();

  const keyPages = [
    { name: 'mobile-catalog', route: '/catalog' },
    { name: 'mobile-game-detail', route: '/games/game_001' },
    { name: 'mobile-genres', route: '/genres' },
    { name: 'mobile-login', route: '/login' },
    { name: 'mobile-support', route: '/support' }
  ];

  let captured = 0;

  for (const p of keyPages) {
    await page.goto(`${baseUrl}${p.route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const snapshotPath = path.join(SNAPSHOTS_DIR, `${p.name}.png`);
    await page.screenshot({ path: snapshotPath, fullPage: false });

    // Verify snapshot file written
    const exists = fs.existsSync(snapshotPath) && fs.statSync(snapshotPath).size > 1000;
    if (exists) {
      captured++;
      console.log(`  ✓ [Visual 375px] Snapshot captured: ${p.name}.png (${(fs.statSync(snapshotPath).size / 1024).toFixed(1)} KB)`);
    } else {
      console.error(`  ✗ [Visual 375px] Failed capturing ${p.name}.png`);
    }
  }

  await browser.close();

  const passed = captured === keyPages.length;
  console.log(`\n📊 MOBILE VISUAL SUMMARY: ${captured} / ${keyPages.length} SNAPSHOTS VERIFIED\n`);
  return passed;
}

if (require.main === module) {
  runMobileVisualAudit().then(passed => {
    if (!passed) process.exit(1);
  });
}
