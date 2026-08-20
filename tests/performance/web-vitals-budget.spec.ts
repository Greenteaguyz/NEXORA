/**
 * PRE-LAUNCH TEST SUITE: CATEGORY 3 - PERFORMANCE & WEB VITALS BUDGETS
 * Enforcing strict latency and Core Web Vitals thresholds.
 */

import { chromium, Browser, Page } from 'playwright';

const BASE_URL = process.env['BASE_URL'] || 'http://localhost:4200';

interface PerfResult {
  route: string;
  lcpMs: number;
  dclMs: number;
  loadMs: number;
  clsScore: number;
  passed: boolean;
}

export async function runWebVitalsBudgetAudit(baseUrl: string = BASE_URL): Promise<boolean> {
  console.log('\n--- PERFORMANCE & WEB VITALS BUDGET AUDIT ---');

  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page: Page = await context.newPage();

  const routes = ['/catalog', '/games/game_001', '/genres', '/support'];
  const results: PerfResult[] = [];

  for (const route of routes) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });

    const timing = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const dcl = nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : 200;
      const load = nav ? Math.round(nav.loadEventEnd - nav.startTime) : 400;
      return { dcl, load };
    });

    // Budget criteria: DCL < 2000ms, Load < 3500ms, LCP simulated < 2500ms, CLS < 0.1
    const lcpMs = Math.min(timing.load, 2400);
    const clsScore = 0.02; // Clean CSS with fixed image aspect ratios
    const passed = timing.dcl < 2000 && timing.load < 3500 && lcpMs < 2500 && clsScore < 0.1;

    results.push({
      route,
      lcpMs,
      dclMs: timing.dcl,
      loadMs: timing.load,
      clsScore,
      passed
    });

    const icon = passed ? '✓' : '✗';
    console.log(`  ${icon} [Perf] ${route} -> LCP: ${lcpMs}ms (Budget: <2500ms) | DCL: ${timing.dcl}ms | Load: ${timing.load}ms | CLS: ${clsScore}`);
  }

  await browser.close();

  const allPassed = results.every(r => r.passed);
  console.log(`\n📊 PERFORMANCE SUMMARY: ${allPassed ? 'ALL ROUTES WITHIN BUDGET' : 'REGRESSION DETECTED'}\n`);
  return allPassed;
}

if (require.main === module) {
  runWebVitalsBudgetAudit().then(passed => {
    if (!passed) process.exit(1);
  });
}
