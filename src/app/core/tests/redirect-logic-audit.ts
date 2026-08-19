import { chromium, Browser, Page } from 'playwright';

interface RedirectTestResult {
  category: string;
  testCase: string;
  initialUrl: string;
  finalUrl: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

export async function runRedirectLogicAudit(baseUrl: string = 'http://localhost:4200') {
  console.log('======================================================================');
  console.log(`🧭 EXECUTING COMPREHENSIVE REDIRECT & ROUTE LOGIC AUDIT: ${baseUrl}`);
  console.log('======================================================================\n');

  const results: RedirectTestResult[] = [];
  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page: Page = await context.newPage();

  function record(category: string, testCase: string, initialUrl: string, finalUrl: string, status: 'PASS' | 'FAIL', details: string) {
    results.push({ category, testCase, initialUrl, finalUrl, status, details });
    const icon = status === 'PASS' ? '✅' : '❌';
    console.log(`  ${icon} [${category}] ${testCase}`);
    console.log(`     Initial: ${initialUrl} -> Final: ${finalUrl}`);
    console.log(`     Details: ${details}\n`);
  }

  // 1. ROOT & WILDCARD REDIRECTS
  console.log('--- 1. ROOT & WILDCARD REDIRECT LOGIC ---');
  
  // Test 1.1: Root / redirect to /catalog
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  let currentUrl = page.url();
  record('Routing Rules', 'Root URL Redirection', `${baseUrl}/`, currentUrl,
    currentUrl.endsWith('/catalog') ? 'PASS' : 'FAIL',
    'Root path redirects to /catalog as configured in app.routes.ts');

  // Test 1.2: Wildcard 404 redirection
  await page.goto(`${baseUrl}/some-invalid-page-12345`, { waitUntil: 'networkidle' });
  currentUrl = page.url();
  record('Routing Rules', 'Wildcard 404 Redirection', `${baseUrl}/some-invalid-page-12345`, currentUrl,
    currentUrl.endsWith('/not-found') ? 'PASS' : 'FAIL',
    'Invalid route successfully redirects to /not-found');

  // Test 1.3: 404 Action button back to catalog
  const notFoundBackBtn = page.locator('a.not-found-action, a:has-text("Back to Catalog")').first();
  if (await notFoundBackBtn.isVisible()) {
    await notFoundBackBtn.click();
    await page.waitForTimeout(400);
    currentUrl = page.url();
    record('Routing Rules', '404 Back to Catalog Action', `${baseUrl}/not-found`, currentUrl,
      currentUrl.endsWith('/catalog') ? 'PASS' : 'FAIL',
      '404 CTA returns user to /catalog');
  }

  // 2. UNAUTHENTICATED ROUTE GUARD REDIRECTS
  console.log('--- 2. UNAUTHENTICATED ROUTE GUARD REDIRECTS ---');
  await page.evaluate(() => localStorage.clear());

  const protectedRoutes = [
    { path: '/library', expectedParam: '%2Flibrary' },
    { path: '/wishlist', expectedParam: '%2Fwishlist' },
    { path: '/orders', expectedParam: '%2Forders' },
    { path: '/profile', expectedParam: '%2Fprofile' },
    { path: '/studio', expectedParam: '%2Fstudio' },
    { path: '/studio/games/new', expectedParam: '%2Fstudio%2Fgames%2Fnew' }
  ];

  for (const pr of protectedRoutes) {
    await page.goto(`${baseUrl}${pr.path}`, { waitUntil: 'networkidle' });
    currentUrl = page.url();
    const isLogin = currentUrl.includes('/login');
    const hasReturnUrl = currentUrl.includes('returnUrl=');
    record('Auth Guard', `Unauthenticated Access to ${pr.path}`, `${baseUrl}${pr.path}`, currentUrl,
      isLogin && hasReturnUrl ? 'PASS' : 'FAIL',
      `Redirected to /login preserving returnUrl parameter`);
  }

  // 3. POST-LOGIN RETURN URL RESOLUTION
  console.log('--- 3. POST-LOGIN RETURN URL RESOLUTION ---');
  
  // Test 3.1: Log in with returnUrl=/wishlist
  await page.goto(`${baseUrl}/login?returnUrl=%2Fwishlist`, { waitUntil: 'networkidle' });
  await page.fill('#email', 'bob@nexora.io');
  await page.fill('#password', 'password123');
  await page.click('button.btn-submit');
  await page.waitForTimeout(600);
  currentUrl = page.url();
  record('Login Logic', 'ReturnUrl Target Redirection (/wishlist)', `${baseUrl}/login?returnUrl=%2Fwishlist`, currentUrl,
    currentUrl.endsWith('/wishlist') ? 'PASS' : 'FAIL',
    'Login successfully routed directly to requested returnUrl target');

  // Test 3.2: Log out and default login redirect (no returnUrl -> /catalog)
  const logoutBtn = page.locator('button.btn-logout, button:has-text("Log Out")').first();
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
    await page.waitForTimeout(400);
  }
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
  await page.fill('#email', 'bob@nexora.io');
  await page.fill('#password', 'password123');
  await page.click('button.btn-submit');
  await page.waitForTimeout(600);
  currentUrl = page.url();
  record('Login Logic', 'Default Login Redirection (/catalog)', `${baseUrl}/login`, currentUrl,
    currentUrl.endsWith('/catalog') ? 'PASS' : 'FAIL',
    'Login without returnUrl default-routed to /catalog');

  // 4. ROLE GUARD ENFORCEMENT (BUYER BLOCKED FROM CREATOR STUDIO)
  console.log('--- 4. ROLE GUARD REDIRECT LOGIC ---');
  // Bob is logged in (Buyer only)
  await page.goto(`${baseUrl}/studio`, { waitUntil: 'networkidle' });
  currentUrl = page.url();
  record('Role Guard', 'Buyer Accessing /studio (Blocked)', `${baseUrl}/studio`, currentUrl,
    currentUrl.endsWith('/catalog') ? 'PASS' : 'FAIL',
    'Buyer without creator role was safely deflected to /catalog');

  await page.goto(`${baseUrl}/studio/games/new`, { waitUntil: 'networkidle' });
  currentUrl = page.url();
  record('Role Guard', 'Buyer Accessing /studio/games/new (Blocked)', `${baseUrl}/studio/games/new`, currentUrl,
    currentUrl.endsWith('/catalog') ? 'PASS' : 'FAIL',
    'Buyer was safely deflected from new game form to /catalog');

  // 5. CREATOR ROLE & OWNERSHIP GUARD ENFORCEMENT
  console.log('--- 5. CREATOR ROLE & OWNERSHIP GUARD REDIRECTS ---');
  
  // Log in as Carol (Creator)
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
  await page.fill('#email', 'carol@nexora.io');
  await page.fill('#password', 'password123');
  await page.click('button.btn-submit');
  await page.waitForTimeout(600);

  // Carol visiting /studio -> allowed
  await page.goto(`${baseUrl}/studio`, { waitUntil: 'networkidle' });
  currentUrl = page.url();
  record('Role Guard', 'Creator Accessing /studio (Allowed)', `${baseUrl}/studio`, currentUrl,
    currentUrl.endsWith('/studio') ? 'PASS' : 'FAIL',
    'Creator with verified role successfully enters /studio');

  // Carol trying to edit Alice\'s game (game_001) -> blocked by ownershipGuard
  await page.goto(`${baseUrl}/studio/games/game_001/edit`, { waitUntil: 'networkidle' });
  currentUrl = page.url();
  record('Ownership Guard', 'Unauthorized Game Edit Tampering (Blocked)', `${baseUrl}/studio/games/game_001/edit`, currentUrl,
    currentUrl.endsWith('/studio') ? 'PASS' : 'FAIL',
    'Non-owner creator attempting to edit foreign game was deflected back to /studio');

  // 6. BREADCRUMBS & CONTEXTUAL NAVIGATION
  console.log('--- 6. BREADCRUMBS & CONTEXTUAL BACK LINKS ---');
  
  // Game detail breadcrumb link
  await page.goto(`${baseUrl}/games/game_001`, { waitUntil: 'networkidle' });
  const breadcrumbLink = page.locator('a.breadcrumb-link, a:has-text("Store")').first();
  if (await breadcrumbLink.isVisible()) {
    await breadcrumbLink.click();
    await page.waitForTimeout(400);
    currentUrl = page.url();
    record('Breadcrumb Logic', 'Game Detail Breadcrumb -> Catalog', `${baseUrl}/games/game_001`, currentUrl,
      currentUrl.endsWith('/catalog') ? 'PASS' : 'FAIL',
      'Breadcrumbs return user to catalog context');
  }

  // Header Brand Logo click
  const logoLink = page.locator('a.brand-logo, a.logo-link').first();
  if (await logoLink.isVisible()) {
    await page.goto(`${baseUrl}/support`, { waitUntil: 'networkidle' });
    await logoLink.click();
    await page.waitForTimeout(400);
    currentUrl = page.url();
    record('Header Navigation', 'Brand Logo -> Catalog Home', `${baseUrl}/support`, currentUrl,
      currentUrl.endsWith('/catalog') ? 'PASS' : 'FAIL',
      'Clicking logo returns user to catalog');
  }

  await browser.close();

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;

  console.log('======================================================================');
  console.log(`🏆 REDIRECT & ROUTE LOGIC AUDIT COMPLETE: ${passed} PASSED / ${failed} FAILED`);
  console.log('======================================================================\n');

  return results;
}

const target = process.argv[2] || 'http://localhost:4200';
runRedirectLogicAudit(target);
