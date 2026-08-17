import { chromium } from 'playwright';

async function runE2ETests() {
  console.log('====================================================');
  console.log('🚀 RUNNING COMPREHENSIVE PHASE 1 LIVE E2E TEST SUITE');
  console.log('====================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  let passed = 0;
  let failed = 0;

  function testPass(name: string) {
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  }

  function testFail(name: string, error: any) {
    console.error(`  ❌ FAIL: ${name}`, error);
    failed++;
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Anonymous Home & Header Navigation
    // ----------------------------------------------------
    console.log('TEST 1: Anonymous Visitor Navigation & Header');
    await page.goto('http://localhost:4200/catalog', { waitUntil: 'networkidle' });
    const pageTitle = await page.title();
    if (pageTitle.includes('NEXORA')) {
      testPass('Page title contains "NEXORA"');
    } else {
      testFail('Page title', `Got: "${pageTitle}"`);
    }

    const loginBtn = await page.$('a.btn-secondary:has-text("Log In")');
    const registerBtn = await page.$('a.btn-primary:has-text("Register")');
    if (loginBtn && registerBtn) {
      testPass('Anonymous header renders Log In and Register buttons');
    } else {
      testFail('Anonymous header buttons', 'Log In or Register button missing');
    }

    // ----------------------------------------------------
    // TEST 2: Login Flow with Alice (Creator)
    // ----------------------------------------------------
    console.log('\nTEST 2: Creator Authentication & Role Guard Execution');
    await page.goto('http://localhost:4200/login', { waitUntil: 'networkidle' });
    await page.click('.demo-box button:has-text("Alice (Creator)")');
    await page.waitForTimeout(150);
    await page.click('button.btn-submit');
    await page.waitForURL('**/catalog', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(400);

    const userName = await page.$eval('.user-name', el => el.textContent?.trim());
    const rolePill = await page.$eval('.role-pill', el => el.textContent?.trim());
    if (userName === 'Alice Vance' && rolePill === 'Creator') {
      testPass('Alice Vance logged in with "Creator" role badge');
    } else {
      testFail('Creator Login', `Got user: "${userName}", role: "${rolePill}"`);
    }

    const studioLink = await page.$('nav a[href="/studio"]');
    const libraryLink = await page.$('nav a[href="/library"]');
    const wishlistLink = await page.$('nav a[href="/wishlist"]');
    const ordersLink = await page.$('nav a[href="/orders"]');
    if (studioLink && libraryLink && wishlistLink && ordersLink) {
      testPass('Creator navigation shows Creator Studio, Library, Wishlist, Orders');
    } else {
      testFail('Creator nav links', 'One or more navigation links missing for Creator');
    }

    // ----------------------------------------------------
    // TEST 3: Switching to Bob Mercer (Buyer Only)
    // ----------------------------------------------------
    console.log('\nTEST 3: Switching to Buyer Role (Bob Mercer)');
    await page.click('.demo-switcher button:has-text("Bob (Buyer)")');
    await page.waitForTimeout(400);

    const bobName = await page.$eval('.user-name', el => el.textContent?.trim());
    const bobRole = await page.$eval('.role-pill', el => el.textContent?.trim());
    if (bobName === 'Bob Mercer' && bobRole === 'Buyer') {
      testPass('Switched to Bob Mercer with "Buyer" role badge');
    } else {
      testFail('Buyer Switch', `Got user: "${bobName}", role: "${bobRole}"`);
    }

    const bobStudioLink = await page.$('nav a[href="/studio"]');
    if (!bobStudioLink) {
      testPass('Creator Studio link is hidden for Buyer role');
    } else {
      testFail('Buyer nav isolation', 'Creator Studio link is still visible for Buyer');
    }

    // ----------------------------------------------------
    // TEST 4: Role Guard Protection (/studio access blocked for buyer)
    // ----------------------------------------------------
    console.log('\nTEST 4: Role Guard Protection (/studio)');
    await page.goto('http://localhost:4200/studio', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const currentUrl = page.url();
    if (currentUrl.includes('/catalog')) {
      testPass('RoleGuard redirected Bob (Buyer) away from /studio to /catalog');
    } else {
      testFail('RoleGuard redirection', `Expected redirect to /catalog, stayed at: ${currentUrl}`);
    }

    // ----------------------------------------------------
    // TEST 5: Support Center FAQ & Ticket Form
    // ----------------------------------------------------
    console.log('\nTEST 5: Support & Help Center Features');
    await page.goto('http://localhost:4200/support', { waitUntil: 'networkidle' });
    
    // Check auto-fill
    const prefilledName = await page.$eval('input#ticketName', (el: any) => el.value);
    const prefilledEmail = await page.$eval('input#ticketEmail', (el: any) => el.value);
    if (prefilledName === 'Bob Mercer' && prefilledEmail === 'bob@nexora.io') {
      testPass('Ticket form auto-filled with active user profile (Bob Mercer / bob@nexora.io)');
    } else {
      testFail('Ticket auto-fill', `Got name: "${prefilledName}", email: "${prefilledEmail}"`);
    }

    // Submit ticket
    await page.fill('input#ticketSubject', 'Game installation question');
    await page.fill('textarea#ticketMessage', 'How do I extract the package?');
    await page.click('button.btn-submit');
    await page.waitForSelector('.ticket-success', { timeout: 3000 });
    const successMsg = await page.$eval('.ticket-success', el => el.textContent);
    if (successMsg && successMsg.includes('Created Successfully')) {
      testPass('Support ticket submitted successfully with generated ticket ID');
    } else {
      testFail('Ticket submission', 'Success banner did not appear');
    }

    // ----------------------------------------------------
    // TEST 6: Auth Guard (Anonymous redirected to /login with returnUrl)
    // ----------------------------------------------------
    console.log('\nTEST 6: Auth Guard & returnUrl Preservation');
    // Logout
    await page.click('button.btn-logout');
    await page.waitForTimeout(300);

    // Try navigating to /library while logged out
    await page.goto('http://localhost:4200/library', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const authGuardUrl = page.url();
    if (authGuardUrl.includes('/login') && authGuardUrl.includes('returnUrl=%2Flibrary')) {
      testPass('AuthGuard blocked anonymous /library access and preserved returnUrl=/library');
    } else {
      testFail('AuthGuard preservation', `URL: ${authGuardUrl}`);
    }

    // ----------------------------------------------------
    // TEST 7: Registration Flow with Creator Toggle
    // ----------------------------------------------------
    console.log('\nTEST 7: User Registration Flow');
    await page.goto('http://localhost:4200/register', { waitUntil: 'networkidle' });
    await page.fill('input#displayName', 'NeonTester');
    await page.fill('input#email', 'neon.tester@nexora.io');
    await page.fill('input#password', 'securepass123');
    await page.click('label.switch'); // Toggle creator mode
    await page.click('button.btn-submit');
    await page.waitForURL('**/catalog', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(400);

    const regName = await page.$eval('.user-name', el => el.textContent?.trim());
    const regRole = await page.$eval('.role-pill', el => el.textContent?.trim());
    if (regName === 'NeonTester' && regRole === 'Creator') {
      testPass('New user "NeonTester" registered with Creator permissions');
    } else {
      testFail('Registration', `Got user: "${regName}", role: "${regRole}"`);
    }

    // ----------------------------------------------------
    // TEST 8: Forgot Password Simulated Recovery
    // ----------------------------------------------------
    console.log('\nTEST 8: Password Reset Recovery Flow');
    await page.goto('http://localhost:4200/forgot-password', { waitUntil: 'networkidle' });
    await page.fill('input#email', 'alice@nexora.io');
    await page.click('button.btn-submit');
    await page.waitForSelector('.success-box', { timeout: 3000 });
    const resetText = await page.$eval('.success-box', el => el.textContent);
    if (resetText && resetText.includes('Reset Link Dispatched')) {
      testPass('Password recovery simulated link dispatched successfully');
    } else {
      testFail('Forgot Password', 'Recovery banner missing');
    }

  } catch (err) {
    console.error('Fatal E2E error:', err);
    failed++;
  } finally {
    await browser.close();
  }

  console.log('\n====================================================');
  console.log(`📊 E2E TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runE2ETests();
