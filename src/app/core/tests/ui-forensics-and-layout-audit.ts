import { chromium, Browser, Page } from 'playwright';

interface UIForensicIssue {
  severity: 'CRITICAL' | 'WARNING' | 'MINOR' | 'INFO';
  category: 'OVERFLOW' | 'CONTRAST' | 'CLIPPING' | 'ALIGNMENT' | 'ASSET' | 'INTERACTION';
  page: string;
  viewport: string;
  theme: string;
  description: string;
  elementSelector?: string;
  details?: string;
}

export async function runUiForensics(baseUrl: string = 'http://localhost:4200') {
  console.log('======================================================================');
  console.log(`🔍 EXECUTING FORENSIC UI & LAYOUT ANOMALY AUDIT: ${baseUrl}`);
  console.log('======================================================================\n');

  const issues: UIForensicIssue[] = [];
  const browser: Browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: 'Ultra-Mobile (320px)', width: 320, height: 640 },
    { name: 'Mobile (375px)', width: 375, height: 812 },
    { name: 'Tablet (768px)', width: 768, height: 1024 },
    { name: 'Laptop (1024px)', width: 1024, height: 768 },
    { name: 'Desktop HD (1440px)', width: 1440, height: 900 },
    { name: 'Ultrawide (1920px)', width: 1920, height: 1080 }
  ];

  const routes = [
    { path: '/catalog', name: 'Catalog' },
    { path: '/games/game_001', name: 'Game Detail (Paid)' },
    { path: '/games/game_002', name: 'Game Detail (Free)' },
    { path: '/login', name: 'Login' },
    { path: '/register', name: 'Register' },
    { path: '/library', name: 'My Library (Buyer)', auth: 'bob' },
    { path: '/wishlist', name: 'Wishlist (Buyer)', auth: 'bob' },
    { path: '/orders', name: 'Orders History (Buyer)', auth: 'bob' },
    { path: '/profile', name: 'User Profile', auth: 'alice' },
    { path: '/studio', name: 'Creator Studio Dashboard', auth: 'alice' },
    { path: '/studio/games/new', name: 'Publish Game Form', auth: 'alice' },
    { path: '/support', name: 'Support Hub' }
  ];

  const themes: ('dark' | 'light')[] = ['dark', 'light'];

  for (const vp of viewports) {
    console.log(`\n📱 Testing Viewport: ${vp.name} (${vp.width}x${vp.height})`);
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();

    for (const theme of themes) {
      for (const route of routes) {
        try {
          await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'networkidle' });
          
          // Theme setter
          await page.evaluate((t) => {
            document.documentElement.setAttribute('data-theme', t);
            localStorage.setItem('app_theme', t);
          }, theme);
          await page.waitForTimeout(200);

          // Authenticate if required
          if (route.auth) {
            const email = route.auth === 'alice' ? 'alice@nexora.io' : 'bob@nexora.io';
            const isLogged = await page.evaluate((e) => {
              const u = localStorage.getItem('current_user');
              return u && JSON.parse(u).email === e;
            }, email);

            if (!isLogged) {
              await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
              await page.fill('#email', email);
              await page.fill('#password', 'password123');
              await page.click('button.btn-submit');
              await page.waitForTimeout(600);
              await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'networkidle' });
            }
          }

          // ------------------------------------------------------------------
          // 1. CHECK HORIZONTAL OVERFLOW (Scroll Width > Viewport Width)
          // ------------------------------------------------------------------
          const overflowData = await page.evaluate(() => {
            const docWidth = document.documentElement.scrollWidth;
            const winWidth = window.innerWidth;
            const overflowingElements: string[] = [];

            if (docWidth > winWidth + 1) { // 1px threshold for subpixel rounding
              const all = document.querySelectorAll('*');
              all.forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.right > winWidth + 2) {
                  const tag = el.tagName.toLowerCase();
                  const cls = el.className ? `.${String(el.className).split(' ').join('.')}` : '';
                  const id = el.id ? `#${el.id}` : '';
                  overflowingElements.push(`${tag}${id}${cls} (right: ${Math.round(rect.right)}px vs win: ${winWidth}px)`);
                }
              });
            }

            return { hasOverflow: docWidth > winWidth + 1, docWidth, winWidth, overflowingElements };
          });

          if (overflowData.hasOverflow) {
            issues.push({
              severity: vp.width <= 375 ? 'WARNING' : 'CRITICAL',
              category: 'OVERFLOW',
              page: route.name,
              viewport: vp.name,
              theme,
              description: `Horizontal page overflow detected: content width (${overflowData.docWidth}px) exceeds viewport (${overflowData.winWidth}px)`,
              details: overflowData.overflowingElements.slice(0, 3).join('; ')
            });
          }

          // ------------------------------------------------------------------
          // 2. CHECK BROKEN IMAGES (NaturalWidth === 0)
          // ------------------------------------------------------------------
          const brokenImages = await page.evaluate(() => {
            const imgs = Array.from(document.querySelectorAll('img'));
            return imgs
              .filter(img => !img.complete || img.naturalWidth === 0)
              .map(img => img.src || img.getAttribute('src') || 'unknown');
          });

          if (brokenImages.length > 0) {
            issues.push({
              severity: 'CRITICAL',
              category: 'ASSET',
              page: route.name,
              viewport: vp.name,
              theme,
              description: `Found ${brokenImages.length} broken / unrendered image(s)`,
              details: brokenImages.join(', ')
            });
          }

          // ------------------------------------------------------------------
          // 3. CHECK TEXT CLIPPING WITHOUT ELLIPSIS
          // ------------------------------------------------------------------
          const clippedTexts = await page.evaluate(() => {
            const headings = Array.from(document.querySelectorAll('h1, h2, h3, .game-card-title, .library-title'));
            const clipped: string[] = [];
            headings.forEach(el => {
              const htmlEl = el as HTMLElement;
              if (htmlEl.scrollWidth > htmlEl.clientWidth + 2) {
                const style = window.getComputedStyle(htmlEl);
                if (style.textOverflow !== 'ellipsis' && style.whiteSpace === 'nowrap') {
                  clipped.push(`"${htmlEl.textContent?.trim().slice(0, 20)}..." in ${htmlEl.tagName.toLowerCase()}`);
                }
              }
            });
            return clipped;
          });

          if (clippedTexts.length > 0) {
            issues.push({
              severity: 'WARNING',
              category: 'CLIPPING',
              page: route.name,
              viewport: vp.name,
              theme,
              description: `Text is clipped horizontally without ellipsis overflow styling`,
              details: clippedTexts.join(', ')
            });
          }

          // ------------------------------------------------------------------
          // 4. CHECK BUTTON TOUCH TARGET SIZES ON MOBILE
          // ------------------------------------------------------------------
          if (vp.width <= 375) {
            const smallTouchTargets = await page.evaluate(() => {
              const buttons = Array.from(document.querySelectorAll('button, a.nav-link, input[type="checkbox"]'));
              const tooSmall: string[] = [];
              buttons.forEach(b => {
                const rect = b.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                  // Apple / Google minimum target guidelines: 32px height minimum for dense UI, 44px recommended
                  if (rect.height < 28 || rect.width < 28) {
                    const text = b.textContent?.trim().slice(0, 15) || b.getAttribute('aria-label') || b.className;
                    tooSmall.push(`[${text}] (${Math.round(rect.width)}x${Math.round(rect.height)}px)`);
                  }
                }
              });
              return tooSmall;
            });

            if (smallTouchTargets.length > 3) {
              issues.push({
                severity: 'INFO',
                category: 'INTERACTION',
                page: route.name,
                viewport: vp.name,
                theme,
                description: `${smallTouchTargets.length} interactive elements have touch targets under 28px`,
                details: smallTouchTargets.slice(0, 4).join(', ')
              });
            }
          }

        } catch (err: any) {
          console.error(`  Error inspecting ${route.name} on ${vp.name} (${theme}):`, err.message);
        }
      }
    }

    await context.close();
  }

  await browser.close();

  // --------------------------------------------------------------------------
  // SUMMARY REPORT
  // --------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(`📊 FORENSIC UI AUDIT SUMMARY REPORT`);
  console.log('======================================================================\n');

  const criticals = issues.filter(i => i.severity === 'CRITICAL');
  const warnings = issues.filter(i => i.severity === 'WARNING');
  const infos = issues.filter(i => i.severity === 'INFO');

  console.log(`Total Findings: ${issues.length} (Critical: ${criticals.length}, Warnings: ${warnings.length}, Info/Suggestions: ${infos.length})\n`);

  issues.forEach((issue, idx) => {
    const icon = issue.severity === 'CRITICAL' ? '🛑' : (issue.severity === 'WARNING' ? '⚠️' : 'ℹ️');
    console.log(`${icon} [${issue.severity}] ${issue.page} | ${issue.viewport} | ${issue.theme}`);
    console.log(`   Category: ${issue.category}`);
    console.log(`   Issue: ${issue.description}`);
    if (issue.details) {
      console.log(`   Details: ${issue.details}`);
    }
    console.log('');
  });

  return issues;
}

const target = process.argv[2] || 'http://localhost:4200';
runUiForensics(target);
