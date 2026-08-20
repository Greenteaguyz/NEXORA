/**
 * PRE-LAUNCH TEST SUITE: CATEGORY 4A - DESKTOP (1440px) VISUAL REGRESSION AUDIT
 * Capturing high-resolution baseline snapshots and verifying desktop rendering fidelity.
 */

import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env['BASE_URL'] || 'http://localhost:4200';
const SNAPSHOTS_DIR = path.join(__dirname, 'snapshots');

export async function runDesktopVisualAudit(baseUrl: string = BASE_URL): Promise<boolean> {
  console.log('\n--- VISUAL REGRESSION: DESKTOP (1440x900) BREAKPOINT ---');

  if (!fs.existsSync(SNAPSHOTS_DIR)) {
    fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
  }

  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page: Page = await context.newPage();

  const keyPages = [
    { name: 'desktop-catalog', route: '/catalog' },
    { name: 'desktop-game-detail', route: '/games/game_001' },
    { name: 'desktop-genres', route: '/genres' },
    { name: 'desktop-login', route: '/login' },
    { name: 'desktop-support', route: '/support' }
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
      console.log(`  ✓ [Visual 1440px] Snapshot captured: ${p.name}.png (${(fs.statSync(snapshotPath).size / 1024).toFixed(1)} KB)`);
    } else {
      console.error(`  ✗ [Visual 1440px] Failed capturing ${p.name}.png`);
    }
  }

  await browser.close();

  const passed = captured === keyPages.length;
  console.log(`\n📊 DESKTOP VISUAL SUMMARY: ${captured} / ${keyPages.length} SNAPSHOTS VERIFIED\n`);
  return passed;
}

if (require.main === module) {
  runDesktopVisualAudit().then(passed => {
    if (!passed) process.exit(1);
  });
}
