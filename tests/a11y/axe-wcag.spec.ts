/**
 * PRE-LAUNCH TEST SUITE: CATEGORY 2 - ACCESSIBILITY AUDIT (a11y)
 * Axe-core WCAG 2.1 AA automated compliance scan across all key routes.
 */

import { chromium, Browser, Page } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const BASE_URL = process.env['BASE_URL'] || 'http://localhost:4200';

export async function runAxeA11yAudit(baseUrl: string = BASE_URL): Promise<boolean> {
  console.log('\n--- ACCESSIBILITY (a11y) WCAG 2.1 AA AUDIT ---');

  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page: Page = await context.newPage();

  const auditRoutes = ['/catalog', '/games/game_001', '/genres', '/login', '/register', '/support'];
  let totalCritical = 0;
  let totalSerious = 0;

  for (const route of auditRoutes) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const scan = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['color-contrast'])
      .analyze();

    const critical = scan.violations.filter(v => v.impact === 'critical').length;
    const serious = scan.violations.filter(v => v.impact === 'serious').length;
    totalCritical += critical;
    totalSerious += serious;

    const icon = critical === 0 ? '✓' : '✗';
    console.log(`  ${icon} [a11y] ${route} -> Critical: ${critical} | Serious: ${serious}`);
  }

  await browser.close();

  const passed = totalCritical === 0;
  console.log(`\n📊 a11y SUMMARY: ${passed ? 'PASSED (0 Critical WCAG Violations)' : 'FAILED'}\n`);
  return passed;
}

if (require.main === module) {
  runAxeA11yAudit().then(passed => {
    if (!passed) process.exit(1);
  });
}
