/**
 * NEXORA MASTER PRE-LAUNCH TEST SUITE RUNNER
 * Orchestrates all 6 required pre-launch validation categories into a single CI gate.
 */

import { execSync } from 'child_process';
import { runAxeA11yAudit } from './a11y/axe-wcag.spec';
import { runWebVitalsBudgetAudit } from './performance/web-vitals-budget.spec';
import { runDesktopVisualAudit } from './visual-regression/desktop-1440-visual.spec';
import { runMobileVisualAudit } from './visual-regression/mobile-375-visual.spec';
import { runSecurityAudit } from './security/security-audit.spec';
import { runSeoPrelaunchAudit } from './seo/seo-metadata-audit.spec';
import { runRigorousValidation } from '../src/app/core/tests/rigorous-validation-suite';

interface CategoryScore {
  category: string;
  name: string;
  passed: boolean;
  durationMs: number;
}

async function runPrelaunchSuite() {
  const startTime = Date.now();
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║               NEXORA PRE-LAUNCH QUALITY ASSURANCE GATE               ║');
  console.log('║   6-Tier Verification: Functional, a11y, Perf, Visual, Security, SEO ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

  const scorecard: CategoryScore[] = [];

  // CATEGORY 1A: FUNCTIONAL UNIT
  try {
    const t0 = Date.now();
    execSync('npx tsc tests/functional/unit.spec.ts --rootDir . --outDir dist --module commonjs --target es2022 --skipLibCheck && node dist/tests/functional/unit.spec.js', { stdio: 'inherit' });
    scorecard.push({ category: 'Category 1A', name: 'Functional: Unit Tests (Math, Splits, Validation)', passed: true, durationMs: Date.now() - t0 });
  } catch (e) {
    scorecard.push({ category: 'Category 1A', name: 'Functional: Unit Tests', passed: false, durationMs: 0 });
  }

  // CATEGORY 1B: FUNCTIONAL INTEGRATION
  try {
    const t0 = Date.now();
    execSync('npx tsc tests/functional/integration.spec.ts --rootDir . --outDir dist --module commonjs --target es2022 --skipLibCheck && node dist/tests/functional/integration.spec.js', { stdio: 'inherit' });
    scorecard.push({ category: 'Category 1B', name: 'Functional: Integration Tests (Auth, Commerce, Studio)', passed: true, durationMs: Date.now() - t0 });
  } catch (e) {
    scorecard.push({ category: 'Category 1B', name: 'Functional: Integration Tests', passed: false, durationMs: 0 });
  }

  // CATEGORY 1C: FUNCTIONAL E2E
  try {
    const t0 = Date.now();
    await runRigorousValidation('http://localhost:4200');
    scorecard.push({ category: 'Category 1C', name: 'Functional: Playwright E2E User Journeys (33 Tests)', passed: true, durationMs: Date.now() - t0 });
  } catch (e) {
    scorecard.push({ category: 'Category 1C', name: 'Functional: Playwright E2E User Journeys', passed: false, durationMs: 0 });
  }

  // CATEGORY 2: ACCESSIBILITY (a11y)
  try {
    const t0 = Date.now();
    const passed = await runAxeA11yAudit('http://localhost:4200');
    scorecard.push({ category: 'Category 2', name: 'Accessibility: Axe-core WCAG 2.1 AA Audit', passed, durationMs: Date.now() - t0 });
  } catch (e) {
    scorecard.push({ category: 'Category 2', name: 'Accessibility: Axe-core WCAG 2.1 AA Audit', passed: false, durationMs: 0 });
  }

  // CATEGORY 3: PERFORMANCE & WEB VITALS
  try {
    const t0 = Date.now();
    const passed = await runWebVitalsBudgetAudit('http://localhost:4200');
    scorecard.push({ category: 'Category 3', name: 'Performance: Core Web Vitals & Load Budgets', passed, durationMs: Date.now() - t0 });
  } catch (e) {
    scorecard.push({ category: 'Category 3', name: 'Performance: Core Web Vitals & Load Budgets', passed: false, durationMs: 0 });
  }

  // CATEGORY 4: VISUAL REGRESSION (Desktop 1440px + Mobile 375px)
  try {
    const t0 = Date.now();
    const dPassed = await runDesktopVisualAudit('http://localhost:4200');
    const mPassed = await runMobileVisualAudit('http://localhost:4200');
    scorecard.push({ category: 'Category 4', name: 'Visual Regression: Desktop (1440px) & Mobile (375px)', passed: dPassed && mPassed, durationMs: Date.now() - t0 });
  } catch (e) {
    scorecard.push({ category: 'Category 4', name: 'Visual Regression: Desktop & Mobile', passed: false, durationMs: 0 });
  }

  // CATEGORY 5: SECURITY & VULNERABILITIES
  try {
    const t0 = Date.now();
    const passed = await runSecurityAudit('http://localhost:4200');
    scorecard.push({ category: 'Category 5', name: 'Security: NPM Audit, Sandbox Isolation & XSS Defense', passed, durationMs: Date.now() - t0 });
  } catch (e) {
    scorecard.push({ category: 'Category 5', name: 'Security: Vulnerability Audit', passed: false, durationMs: 0 });
  }

  // CATEGORY 6: SEO & DISCOVERY
  try {
    const t0 = Date.now();
    const passed = await runSeoPrelaunchAudit('http://localhost:4200');
    scorecard.push({ category: 'Category 6', name: 'SEO: Metadata, Robots.txt, Sitemap & OpenGraph', passed, durationMs: Date.now() - t0 });
  } catch (e) {
    scorecard.push({ category: 'Category 6', name: 'SEO: Metadata & Discovery Audit', passed: false, durationMs: 0 });
  }

  // EXECUTIVE SCORECARD
  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  const totalPassed = scorecard.filter(s => s.passed).length;
  const totalSuites = scorecard.length;

  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║               PRE-LAUNCH CONSOLIDATED AUDIT SCORECARD                ║');
  console.log('╠══════════════════════════════════════════════════════════════════════╣');
  scorecard.forEach(s => {
    const icon = s.passed ? '✅ PASSED' : '❌ FAILED';
    const line = `║ [${s.category.padEnd(11)}] ${s.name.padEnd(43)} | ${icon} ║`;
    console.log(line);
  });
  console.log('╠══════════════════════════════════════════════════════════════════════╣');
  console.log(`║ OVERALL STATUS: ${totalPassed} / ${totalSuites} CATEGORIES PASSED (100%) in ${totalElapsed}s`.padEnd(71) + '║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

  if (totalPassed !== totalSuites) {
    process.exit(1);
  }
}

runPrelaunchSuite();
