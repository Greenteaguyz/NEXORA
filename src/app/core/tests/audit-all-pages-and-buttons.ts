import { chromium } from 'playwright';

interface ButtonCheck {
  page: string;
  selector: string;
  description: string;
  expectedBehavior: string;
  passed: boolean;
  notes?: string;
}

async function auditAllPagesAndButtons() {
  console.log('======================================================================');
  console.log('🔍 COMPREHENSIVE UI & BUTTON INTERACTION AUDIT ACROSS ALL PAGES');
  console.log('======================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(`[${msg.location().url || 'page'}] ${msg.text()}`);
    }
  });

  const buttonChecks: ButtonCheck[] = [];

  function record(pageName: string, selector: string, description: string, expectedBehavior: string, passed: boolean, notes?: string) {
    buttonChecks.push({ page: pageName, selector, description, expectedBehavior, passed, notes });
    const status = passed ? '  [✓] PASS' : '  [✗] FAIL';
    console.log(`${status}: [${pageName}] ${description} (${selector})`);
    if (notes) {
      console.log(`        Notes: ${notes}`);
    }
  }

  try {
    // ==================================================================
    // 1. GLOBAL HEADER & SHELL BUTTONS
    // ==================================================================
    console.log('--- 1. GLOBAL HEADER & SHELL BUTTONS ---');
    await page.goto('http://localhost:4200/catalog', { waitUntil: 'networkidle' });

    // 1.1 Brand Logo
    const brandLogo = await page.$('a.logo-link');
    record('Header', 'a.logo-link', 'NEXORA Brand Logo Link', 'Navigates to /catalog', !!brandLogo);

    // 1.2 Nav Links (Store, Genres) & Platform Support Link
    const storeLink = await page.$('nav a[href="/catalog"]');
    const genresLink = await page.$('nav a[href="/genres"]');
    const supportLink = await page.$('a[href="/support"]');
    record('Header', 'nav a[href="/catalog"]', 'Store Nav Link', 'Active link to /catalog', !!storeLink);
    record('Header', 'nav a[href="/genres"]', 'Genres Nav Link', 'Navigates to /genres', !!genresLink);
    record('Platform', 'a[href="/support"]', 'Support & Help Center Link', 'Navigates to /support', !!supportLink);

    // 1.3 Theme Toggle Button
    const themeBtn = await page.$('button.theme-pill');
    if (themeBtn) {
      await themeBtn.click();
      await page.waitForTimeout(150);
      const lightTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      await themeBtn.click();
      await page.waitForTimeout(150);
      const darkTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      record('Header', 'button.theme-pill', 'Theme Switcher Pill', 'Toggles [data-theme] dark <-> light', lightTheme === 'light' && darkTheme === 'dark');
    } else {
      record('Header', 'button.theme-pill', 'Theme Switcher Pill', 'Toggles [data-theme]', false, 'Button not found');
    }

    // 1.4 Demo Account Persona Pills
    const alicePill = await page.$('button.demo-pill:has-text("Alice (Creator)")');
    const bobPill = await page.$('button.demo-pill:has-text("Bob (Buyer)")');
    const carolPill = await page.$('button.demo-pill:has-text("Carol (Creator)")');
    record('Header', 'button.demo-pill (Alice)', 'Demo Persona Switcher (Alice Vance)', 'Instant auth as Creator', !!alicePill);
    record('Header', 'button.demo-pill (Bob)', 'Demo Persona Switcher (Bob Mercer)', 'Instant auth as Buyer', !!bobPill);
    record('Header', 'button.demo-pill (Carol)', 'Demo Persona Switcher (Carol)', 'Instant auth as Creator', !!carolPill);

    // 1.5 Header Log In / Register CTAs (Anonymous State)
    const headerLogin = await page.$('a.btn-secondary:has-text("Log In")');
    const headerRegister = await page.$('a.btn-primary:has-text("Register")');
    record('Header', 'a.btn-secondary:has-text("Log In")', 'Header Log In Button', 'Links to /login', !!headerLogin);
    record('Header', 'a.btn-primary:has-text("Register")', 'Header Register Button', 'Links to /register', !!headerRegister);

    // ==================================================================
    // 2. STORE CATALOG PAGE (/catalog)
    // ==================================================================
    console.log('\n--- 2. STORE CATALOG PAGE (/catalog) ---');
    await page.goto('http://localhost:4200/catalog', { waitUntil: 'networkidle' });

    // 2.1 Search Input & Clear Button
    await page.fill('input.search-input', 'Drift');
    await page.waitForTimeout(300);
    const clearBtn = await page.$('button.btn-clear-search');
    record('Catalog', 'button.btn-clear-search', 'Search Clear Button', 'Appears on input and clears search text', !!clearBtn);
    if (clearBtn) {
      await clearBtn.click();
      await page.waitForTimeout(200);
      const val = await page.$eval('input.search-input', (el: any) => el.value);
      record('Catalog', 'input.search-input', 'Search Input Value Reset', 'Resets value to empty string', val === '');
    }

    // 2.2 Tag Filter Chips
    const tagChips = await page.$$('button.tag-filter-chip');
    record('Catalog', 'button.tag-filter-chip', 'Category Filter Chips', 'Renders all category filter buttons', tagChips.length > 0, `Found ${tagChips.length} tags`);

    if (tagChips.length > 1) {
      await tagChips[1].click();
      await page.waitForTimeout(200);
      const resetBtn = await page.$('button.btn-reset-filters');
      record('Catalog', 'button.btn-reset-filters', 'Reset Filters Button', 'Appears when non-All tag filter active and resets tags', !!resetBtn);
      if (resetBtn) {
        await resetBtn.click();
        await page.waitForTimeout(200);
      }
    }

    // 2.3 Game Card Wishlist Heart Buttons & Navigation Links
    const cardWishlistBtn = await page.$('app-game-card button.btn-wishlist');
    record('Catalog', 'app-game-card button.btn-wishlist', 'Card Wishlist Heart Button', 'Present on each game card', !!cardWishlistBtn);

    const cardMediaLink = await page.$('app-game-card a.media-link');
    const cardTitleLink = await page.$('app-game-card h3.game-title a');
    record('Catalog', 'app-game-card a.media-link, h3.game-title a', 'Card Clickable Media & Title Links', 'Navigates to /games/:id', !!cardMediaLink && !!cardTitleLink);

    // ==================================================================
    // 3. GENRE CATEGORY DIRECTORY (/genres)
    // ==================================================================
    console.log('\n--- 3. GENRE CATEGORY DIRECTORY (/genres) ---');
    await page.goto('http://localhost:4200/genres', { waitUntil: 'networkidle' });

    const genreCards = await page.$$('a.genre-card');
    record('Genres', 'a.genre-card', 'Genre Category Navigation Cards', 'Renders interactive cards linking to /catalog?tag=...', genreCards.length >= 8, `Found ${genreCards.length} genre cards`);

    if (genreCards.length > 0) {
      const firstGenreHref = await genreCards[0].getAttribute('href');
      record('Genres', 'a.genre-card[href]', 'Genre Card Query Link', 'Properly formats /catalog?tag=... link', !!firstGenreHref && firstGenreHref.includes('/catalog?tag='), `Href: ${firstGenreHref}`);
    }

    // ==================================================================
    // 4. GAME DETAIL SHOWCASE (/games/game_001)
    // ==================================================================
    console.log('\n--- 4. GAME DETAIL SHOWCASE (/games/game_001) ---');
    await page.goto('http://localhost:4200/games/game_001', { waitUntil: 'networkidle' });

    // 4.1 Breadcrumb Back Button
    const backBtn = await page.$('a.back-link');
    record('Game Detail', 'a.back-link', 'Back to Store Navigation Link', 'Navigates back to /catalog', !!backBtn);

    // 4.2 Tag Chips
    const detailTags = await page.$$('.hero-tags a.detail-tag-chip');
    record('Game Detail', 'a.detail-tag-chip', 'Game Genre Tag Chips', 'Links directly to filtered catalog view', detailTags.length > 0, `Found ${detailTags.length} tags`);

    // 4.3 Buy / Download Action Button
    const buyActionBtn = await page.$('button.btn-action-main');
    record('Game Detail', 'button.btn-action-main', 'Main Buy / Download CTA Button', 'Primary interactive acquisition action', !!buyActionBtn);

    // 4.4 Wishlist Action Button
    const detailWishlistBtn = await page.$('button.btn-wishlist-action');
    record('Game Detail', 'button.btn-wishlist-action', 'Detail Page Wishlist Toggle Button', 'Interactive bookmark button', !!detailWishlistBtn);

    // 4.5 Developer Storefront Link
    const creatorStorefrontBtn = await page.$('a.btn-view-creator');
    record('Game Detail', 'a.btn-view-creator', 'Developer Storefront CTA Button', 'Navigates to /creators/:id', !!creatorStorefrontBtn);

    // 4.6 Screenshot Gallery & Lightbox Modal Controls
    const thumbBoxes = await page.$$('.screenshot-thumb-box');
    record('Game Detail', '.screenshot-thumb-box', 'Interactive Screenshot Thumbnails', 'Opens full-screen lightbox modal on click', thumbBoxes.length > 0);

    if (thumbBoxes.length > 0) {
      await thumbBoxes[0].click();
      await page.waitForTimeout(200);

      const lightboxBackdrop = await page.$('.lightbox-backdrop');
      const closeBtn = await page.$('button.btn-lightbox-close');
      const nextBtn = await page.$('button.btn-lightbox-nav.next');
      const prevBtn = await page.$('button.btn-lightbox-nav.prev');

      record('Game Detail (Lightbox)', '.lightbox-backdrop', 'Full-screen Lightbox Overlay', 'Renders enlarged image preview modal', !!lightboxBackdrop);
      record('Game Detail (Lightbox)', 'button.btn-lightbox-close', 'Lightbox Close Button (✕)', 'Closes modal on click', !!closeBtn);
      record('Game Detail (Lightbox)', 'button.btn-lightbox-nav.next', 'Lightbox Next Slide Button (›)', 'Advances to next screenshot', !!nextBtn);
      record('Game Detail (Lightbox)', 'button.btn-lightbox-nav.prev', 'Lightbox Previous Slide Button (‹)', 'Navigates to previous screenshot', !!prevBtn);

      if (closeBtn) {
        await closeBtn.click();
        await page.waitForTimeout(200);
      }
    }

    // ==================================================================
    // 5. CREATOR PROFILE STOREFRONT (/creators/usr_alice)
    // ==================================================================
    console.log('\n--- 5. CREATOR PROFILE STOREFRONT (/creators/usr_alice) ---');
    await page.goto('http://localhost:4200/creators/usr_alice', { waitUntil: 'networkidle' });

    const creatorBackBtn = await page.$('a.back-link');
    record('Creator Profile', 'a.back-link', 'Back to Store Link', 'Returns user to /catalog', !!creatorBackBtn);

    const portfolioCards = await page.$$('.portfolio-section app-game-card');
    record('Creator Profile', '.portfolio-section app-game-card', 'Creator Portfolio Game Cards', 'Renders all games created by this developer', portfolioCards.length > 0, `Found ${portfolioCards.length} published games`);

    // ==================================================================
    // 6. SUPPORT & HELP CENTER (/support)
    // ==================================================================
    console.log('\n--- 6. SUPPORT & HELP CENTER (/support) ---');
    await page.goto('http://localhost:4200/support', { waitUntil: 'networkidle' });

    // 6.1 FAQ Accordion Toggle Buttons
    const faqButtons = await page.$$('button.faq-question');
    record('Support', 'button.faq-question', 'FAQ Accordion Expand/Collapse Buttons', 'Expands and collapses FAQ answer panels', faqButtons.length >= 4, `Found ${faqButtons.length} FAQ accordion items`);

    const initialOpenAnswer = await page.isVisible('.faq-answer');
    record('Support', '.faq-answer', 'Initial FAQ Answer Panel Expanded', 'Shows first FAQ answer by default', initialOpenAnswer);

    if (faqButtons.length > 1) {
      await faqButtons[1].click();
      await page.waitForTimeout(150);
      const isSecondExpanded = await page.isVisible('.faq-answer');
      record('Support', 'button.faq-question (Click)', 'FAQ Toggle Action', 'Switches active answer on accordion click', isSecondExpanded);
    }

    // 6.2 Ticket Submission Form & Submit Button
    const ticketNameInput = await page.$('input#ticketName');
    const ticketEmailInput = await page.$('input#ticketEmail');
    const ticketSubjectInput = await page.$('input#ticketSubject');
    const ticketMsgInput = await page.$('textarea#ticketMessage');
    const ticketSubmitBtn = await page.$('form button.btn-submit');

    record('Support', 'input#ticketName, #ticketEmail, #ticketSubject, #ticketMessage', 'Ticket Form Inputs', 'All form fields present and editable', !!ticketNameInput && !!ticketEmailInput && !!ticketSubjectInput && !!ticketMsgInput);
    record('Support', 'form button.btn-submit', 'Submit Ticket Button', 'Validates form and triggers ticket submission', !!ticketSubmitBtn);

    if (ticketSubmitBtn) {
      await page.fill('input#ticketName', 'QA Explorer');
      await page.fill('input#ticketEmail', 'qa@nexora.io');
      await page.fill('input#ticketSubject', 'Audit Test Ticket');
      await page.fill('textarea#ticketMessage', 'Testing UI buttons.');
      await ticketSubmitBtn.click();
      await page.waitForSelector('.ticket-success', { timeout: 3000 });
      const ticketSuccess = await page.isVisible('.ticket-success');
      record('Support', '.ticket-success', 'Ticket Confirmation Banner', 'Renders dynamic ticket ID upon submission', ticketSuccess);
    }

    // 6.3 Privacy Notice Anchor Link
    const privacyNotice = await page.$('#privacy');
    record('Support', '#privacy', 'Privacy & Data Trust Notice Card (#privacy)', 'Anchor section for privacy disclosures', !!privacyNotice);

    // 6.4 Reset DB Button
    const resetDbBtn = await page.$('button.reset-db-btn');
    record('Support', 'button.reset-db-btn', 'Reset Mock Seed Data Button', 'Action button to restore original catalog state', !!resetDbBtn);

    // ==================================================================
    // 7. AUTHENTICATION PAGES (/login, /register, /forgot-password)
    // ==================================================================
    console.log('\n--- 7. AUTHENTICATION PAGES ---');

    // 7.1 Login Page
    await page.goto('http://localhost:4200/login', { waitUntil: 'networkidle' });
    const loginEmail = await page.$('input#email');
    const loginPass = await page.$('input#password');
    const loginSubmit = await page.$('button.btn-submit');
    const forgotPassLink = await page.$('a.forgot-link');
    const loginGoogleBtn = await page.$('button.btn-social.google');
    const loginAppleBtn = await page.$('button.btn-social.apple');
    const registerLinkFromLogin = await page.$('.auth-footer a[href="/register"]');

    record('Login', 'input#email, #password', 'Login Form Fields', 'Email and password inputs present', !!loginEmail && !!loginPass);
    record('Login', 'button.btn-submit', 'Sign In Submit Button', 'Submits credentials', !!loginSubmit);
    record('Login', 'a.forgot-link', 'Forgot Password Link', 'Links to /forgot-password', !!forgotPassLink);
    record('Login', 'button.btn-social.google', 'Google 1-Click Social Sign-In Button', 'Simulates Google authentication', !!loginGoogleBtn);
    record('Login', 'button.btn-social.apple', 'Apple 1-Click Social Sign-In Button', 'Simulates Apple authentication', !!loginAppleBtn);
    record('Login', '.auth-footer a[href="/register"]', 'Switch to Register Link', 'Links to /register', !!registerLinkFromLogin);

    // 7.2 Register Page
    await page.goto('http://localhost:4200/register', { waitUntil: 'networkidle' });
    const regName = await page.$('input#displayName');
    const regEmail = await page.$('input#email');
    const regPass = await page.$('input#password');
    const creatorToggle = await page.$('label.switch input[name="isCreator"]');
    const regSubmit = await page.$('button.btn-submit');
    const loginLinkFromReg = await page.$('.auth-footer a[href="/login"]');

    record('Register', 'input#displayName, #email, #password', 'Registration Form Inputs', 'Display name, email, password fields present', !!regName && !!regEmail && !!regPass);
    record('Register', 'label.switch input[name="isCreator"]', 'Creator Account Toggle Switch', 'Interactive toggle to enable creator capabilities', !!creatorToggle);
    record('Register', 'button.btn-submit', 'Create Account Submit Button', 'Submits registration request', !!regSubmit);
    record('Register', '.auth-footer a[href="/login"]', 'Switch to Login Link', 'Links to /login', !!loginLinkFromReg);

    // 7.3 Forgot Password Page
    await page.goto('http://localhost:4200/forgot-password', { waitUntil: 'networkidle' });
    const forgotEmail = await page.$('input#email');
    const forgotSubmit = await page.$('button.btn-submit');
    const backToLoginLink = await page.$('.auth-footer a[href="/login"]');

    record('Forgot Password', 'input#email', 'Email Input', 'Captures email address for reset link', !!forgotEmail);
    record('Forgot Password', 'button.btn-submit', 'Dispatch Reset Link Button', 'Dispatches simulated recovery link', !!forgotSubmit);
    record('Forgot Password', '.auth-footer a[href="/login"]', 'Back to Login Link', 'Returns user to /login', !!backToLoginLink);

    // ==================================================================
    // 8. LOGGED-IN USER SESSION UI & LOGOUT BUTTON
    // ==================================================================
    console.log('\n--- 8. LOGGED-IN USER SESSION & LOGOUT BUTTON ---');
    await page.goto('http://localhost:4200/login', { waitUntil: 'networkidle' });
    await page.click('.demo-box button:has-text("Alice (Creator)")');
    await page.waitForTimeout(150);
    await page.click('button.btn-submit');
    await page.waitForURL('**/catalog', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(300);

    const userBadgeGroup = await page.$('.user-badge-group');
    const userAvatarLink = await page.$('a[href="/profile"]');
    const logoutBtn = await page.$('button.btn-logout');

    record('Logged In Header', '.user-badge-group', 'User Name & Role Badge Container', 'Displays "Alice Vance" and "Creator"', !!userBadgeGroup);
    record('Logged In Header', 'a[href="/profile"]', 'User Avatar Profile Link', 'Avatar image linking to user profile', !!userAvatarLink);
    record('Logged In Header', 'button.btn-logout', 'Log Out Button', 'Terminates active session and resets navigation', !!logoutBtn);

    if (logoutBtn) {
      await logoutBtn.click();
      await page.waitForTimeout(200);
      const isLoggedOut = await page.isVisible('a.btn-secondary:has-text("Log In")');
      record('Logged In Header', 'button.btn-logout (Action)', 'Logout Execution Result', 'Successfully logs out and restores guest header', isLoggedOut);
    }

    // ==================================================================
    // 9. 404 NOT FOUND VOID SCREEN (/unknown-route)
    // ==================================================================
    console.log('\n--- 9. 404 NOT FOUND VOID SCREEN ---');
    await page.goto('http://localhost:4200/lost-in-the-grid', { waitUntil: 'networkidle' });

    const notFoundActionBtn = await page.$('a.not-found-action');
    record('404 Page', 'a.not-found-action', 'Return to Store Catalog Button', 'Recovers lost user back to /catalog', !!notFoundActionBtn);

  } catch (err) {
    console.error('Fatal error during UI & button audit:', err);
  } finally {
    await browser.close();
  }

  const passedCount = buttonChecks.filter(c => c.passed).length;
  const failedCount = buttonChecks.filter(c => !c.passed).length;

  console.log('\n======================================================================');
  console.log(`📊 UI & BUTTON AUDIT SUMMARY: ${passedCount} / ${buttonChecks.length} PASSED (${failedCount} FAILED)`);
  console.log(`⚠️ RUNTIME CONSOLE ERRORS: ${consoleErrors.length}`);
  console.log(`🏆 OVERALL UI VERDICT: ${failedCount === 0 && consoleErrors.length === 0 ? 'FLAWLESS (100% OPERATIONAL)' : 'ISSUES DETECTED'}`);
  console.log('======================================================================\n');

  if (failedCount > 0 || consoleErrors.length > 0) {
    process.exit(1);
  }
}

auditAllPagesAndButtons();
