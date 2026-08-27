/**
 * NEXORA MASTER TEST BATTERY ORCHESTRATOR
 * Executes all 8 testing tiers and generates a comprehensive executive scorecard.
 */

import { execSync } from 'child_process';
import { runA11yAudit } from './audit/a11y-axe-audit.spec';
import { runBrokenLinkCrawler } from './audit/broken-links-crawler.spec';
import { runPerformanceAudit } from './audit/performance-vitals.spec';
import { runSeoAudit } from './audit/seo-meta-audit.spec';

interface SuiteSummary {
  layer: string;
  name: string;
  passed: boolean;
  durationMs: number;
}

async function runAllSuites() {
  const startTime = Date.now();
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║             NEXORA ENTERPRISE AUTOMATED TEST BATTERY                 ║');
  console.log('║  Covering Unit, Integration, E2E, a11y, Performance, SEO & Crawler   ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

  const scorecard: SuiteSummary[] = [];

  // LAYER 1: UNIT TESTS
  try {
    const t0 = Date.now();
    execSync('npx tsc tests/unit/unit-tests.spec.ts --rootDir . --outDir dist --module commonjs --target es2022 --skipLibCheck && node dist/tests/unit/unit-tests.spec.js', { stdio: 'inherit' });
    scorecard.push({ layer: 'Layer 1', name: 'Unit Tests (Validations, Transforms, Storage)', passed: true, durationMs: Date.now() - t0 });
  } catch (e) {
    scorecard.push({ layer: 'Layer 1', name: 'Unit Tests', passed: false, durationMs: 0 });
  }

  // LAYER 2: INTEGRATION TESTS
  try {
    const t0 = Date.now();
    execSync('npx tsc tests/integration/integration-tests.spec.ts --rootDir . --outDir dist --module commonjs --target es2022 --skipLibCheck && node dist/tests/integration/integration-tests.spec.js', { stdio: 'inherit' });
    scorecard.push({ layer: 'Layer 2', name: 'Integration Tests (Auth, Catalog, Checkout, Studio)', passed: true, durationMs: Date.now() - t0 });
  } catch (e) {
    scorecard.push({ layer: 'Layer 2', name: 'Integration Tests', passed: false, durationMs: 0 });
  }

// LAYER 3 & 4: E2E & RESPONSIVE PLAYWRIGHT BATTERY
  try {
    const t0 = Date.now();
    execSync('npx playwright test tests/e2e/e2e-user-journeys.spec.ts', { stdio: 'inherit' });
    scorecard.push({ layer: 'Layer 3 & 4', name: 'Playwright E2E & Responsive Battery (5 Journeys)', passed: true, durationMs: Date.now() - t0 });
  } catch (e) {
    scorecard.push({ layer: 'Layer 3 & 4', name: 'Playwright E2E & Responsive Battery', passed: false, durationMs: 0 });
  }

  // LAYER 5: ACCESSIBILITY (a11y) AXE-CORE AUDIT
  try {
    const t0 = Date.now();
    const a11yPassed = await runA11yAudit('http://localhost:4200');
    scorecard.push({ layer: 'Layer 5', name: 'Axe-Core WCAG 2.1 AA Accessibility Audit', passed: a11yPassed, durationMs: Date.now() - t0 });
  } catch (e) {
    scorecard.push({ layer: 'Layer 5', name: 'Axe-Core Accessibility Audit', passed: false, durationMs: 0 });
  }

  // LAYER 6: BROKEN LINK CRAWLER
  try {
    const t0 = Date.now();
    const crawlerPassed = await runBrokenLinkCrawler('http://localhost:4200');
    scorecard.push({ layer: 'Layer 6', name: 'Broken-Link Route Crawler (13 Routes)', passed: crawlerPassed, durationMs: Date.now() - t0 });
  } catch (e) {
    scorecard.push({ layer: 'Layer 6', name: 'Broken-Link Route Crawler', passed: false, durationMs: 0 });
  }

  // LAYER 7: PERFORMANCE & CORE WEB VITALS
  try {
    const t0 = Date.now();
    const perfPassed = await runPerformanceAudit('http://localhost:4200');
    scorecard.push({ layer: 'Layer 7', name: 'Performance & Navigation Timing Audit', passed: perfPassed, durationMs: Date.now() - t0 });
  } catch (e) {
    scorecard.push({ layer: 'Layer 7', name: 'Performance Audit', passed: false, durationMs: 0 });
  }

  // LAYER 8: SEO & METADATA AUDIT
  try {
    const t0 = Date.now();
    const seoPassed = await runSeoAudit('http://localhost:4200');
    scorecard.push({ layer: 'Layer 8', name: 'SEO, OpenGraph & Metadata Semantic Audit', passed: seoPassed, durationMs: Date.now() - t0 });
  } catch (e) {
    scorecard.push({ layer: 'Layer 8', name: 'SEO & Metadata Audit', passed: false, durationMs: 0 });
  }

  // FINAL EXECUTIVE SCORECARD
  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  const totalPassed = scorecard.filter(s => s.passed).length;
  const totalSuites = scorecard.length;

  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║                   CONSOLIDATED EXECUTIVE SCORECARD                   ║');
  console.log('╠══════════════════════════════════════════════════════════════════════╣');
  scorecard.forEach(s => {
    const icon = s.passed ? '✅ PASSED' : '❌ FAILED';
    const line = `║ [${s.layer}] ${s.name.padEnd(46)} | ${icon} ║`;
    console.log(line);
  });
  console.log('╠══════════════════════════════════════════════════════════════════════╣');
  console.log(`║ OVERALL RESULT: ${totalPassed} / ${totalSuites} LAYERS PASSED (${Math.round((totalPassed / totalSuites) * 100)}%) in ${totalElapsed}s`.padEnd(71) + '║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

  if (totalPassed !== totalSuites) {
    process.exit(1);
  }
}

runAllSuites();
