import { chromium } from 'playwright';

interface PagePerf {
  route: string;
  ttfb: number;
  fcp: number;
  domContentLoaded: number;
  loadEvent: number;
  domNodeCount: number;
  jsHeapSizeMB: number;
  consoleErrors: string[];
}

async function measurePerformance() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const routes = [
    '/catalog',
    '/genres',
    '/login',
    '/support',
    '/games/game-1'
  ];

  const results: PagePerf[] = [];

  for (const route of routes) {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const url = `http://localhost:4200${route}`;
    await page.goto(url, { waitUntil: 'networkidle' });

    const perfMetrics = await page.evaluate(() => {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(p => p.name === 'first-contentful-paint');
      const domNodeCount = document.querySelectorAll('*').length;
      const memory = (performance as any).memory;
      
      return {
        ttfb: navEntry ? Math.round(navEntry.responseStart - navEntry.requestStart) : 0,
        fcp: fcpEntry ? Math.round(fcpEntry.startTime) : 0,
        domContentLoaded: navEntry ? Math.round(navEntry.domContentLoadedEventEnd - navEntry.startTime) : 0,
        loadEvent: navEntry ? Math.round(navEntry.loadEventEnd - navEntry.startTime) : 0,
        domNodeCount,
        jsHeapSizeMB: memory ? Math.round((memory.usedJSHeapSize / (1024 * 1024)) * 10) / 10 : 0
      };
    });

    results.push({
      route,
      ...perfMetrics,
      consoleErrors
    });
  }

  await browser.close();

  console.log('--- PERF_AUDIT_START ---');
  console.log(JSON.stringify(results, null, 2));
  console.log('--- PERF_AUDIT_END ---');
}

measurePerformance().catch(console.error);
