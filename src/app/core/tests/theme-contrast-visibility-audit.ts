import { chromium, Browser, Page } from 'playwright';

interface ContrastSample {
  view: string;
  theme: 'dark' | 'light';
  element: string;
  fgColor: string;
  bgColor: string;
  contrastRatio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
  notes: string;
}

export async function runThemeContrastAudit(baseUrl: string = 'http://localhost:4200') {
  console.log('======================================================================');
  console.log(`🎨 EXECUTING DUAL-THEME VISIBILITY & SCANNABILITY AUDIT: ${baseUrl}`);
  console.log('======================================================================\n');

  const samples: ContrastSample[] = [];
  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page: Page = await context.newPage();

  function getLuminance(r: number, g: number, b: number): number {
    const a = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

  function parseRgb(colorStr: string): [number, number, number] {
    const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
    }
    return [255, 255, 255];
  }

  function calculateContrast(fgStr: string, bgStr: string): number {
    const fg = parseRgb(fgStr);
    const bg = parseRgb(bgStr);
    const l1 = getLuminance(fg[0], fg[1], fg[2]);
    const l2 = getLuminance(bg[0], bg[1], bg[2]);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return parseFloat(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
  }

  const themes: ('dark' | 'light')[] = ['dark', 'light'];

  for (const theme of themes) {
    console.log(`\n----------------------------------------------------------------------`);
    console.log(`🌓 Auditing Theme: ${theme.toUpperCase()} MODE`);
    console.log(`----------------------------------------------------------------------`);

    // 1. Catalog Page
    await page.goto(`${baseUrl}/catalog`, { waitUntil: 'networkidle' });
    await page.evaluate((t) => {
      document.documentElement.setAttribute('data-theme', t);
      localStorage.setItem('app_theme', t);
    }, theme);
    await page.waitForTimeout(300);

    const catalogData = await page.evaluate(() => {
      function getStyles(sel: string) {
        const el = document.querySelector(sel);
        if (!el) return null;
        const comp = window.getComputedStyle(el);
        return { color: comp.color, bg: comp.backgroundColor };
      }
      const bodyBg = window.getComputedStyle(document.body).backgroundColor;
      const activeChip = getStyles('.tag-filter-chip.active');
      const inactiveChip = getStyles('.tag-filter-chip:not(.active)');
      const gameCard = getStyles('.game-card');

      return {
        heroTitle: getStyles('.hero-title'),
        heroSubtitle: getStyles('.hero-subtitle'),
        searchInput: getStyles('.search-input'),
        activeChip,
        inactiveChip,
        gameTitle: getStyles('.game-title'),
        gamePrice: getStyles('.price-badge, .card-price'),
        bodyBg,
        cardBg: gameCard?.bg || bodyBg
      };
    });

    if (catalogData.heroTitle) {
      const ratio = calculateContrast(catalogData.heroTitle.color, catalogData.bodyBg);
      samples.push({
        view: 'Catalog',
        theme,
        element: 'Hero Headline (.hero-title)',
        fgColor: catalogData.heroTitle.color,
        bgColor: catalogData.bodyBg,
        contrastRatio: ratio,
        wcagAA: ratio >= 4.5,
        wcagAAA: ratio >= 7.0,
        notes: 'Main store discovery headline'
      });
    }

    if (catalogData.heroSubtitle) {
      const ratio = calculateContrast(catalogData.heroSubtitle.color, catalogData.bodyBg);
      samples.push({
        view: 'Catalog',
        theme,
        element: 'Hero Subtitle (.hero-subtitle)',
        fgColor: catalogData.heroSubtitle.color,
        bgColor: catalogData.bodyBg,
        contrastRatio: ratio,
        wcagAA: ratio >= 4.5,
        wcagAAA: ratio >= 7.0,
        notes: 'Exploratory subtext'
      });
    }

    if (catalogData.activeChip) {
      const ratio = calculateContrast(catalogData.activeChip.color, catalogData.activeChip.bg);
      samples.push({
        view: 'Catalog',
        theme,
        element: 'Active Filter Chip (.tag-filter-chip.active)',
        fgColor: catalogData.activeChip.color,
        bgColor: catalogData.activeChip.bg,
        contrastRatio: ratio,
        wcagAA: ratio >= 4.5,
        wcagAAA: ratio >= 7.0,
        notes: 'Active selected genre pill'
      });
    }

    if (catalogData.inactiveChip) {
      const ratio = calculateContrast(catalogData.inactiveChip.color, catalogData.inactiveChip.bg);
      samples.push({
        view: 'Catalog',
        theme,
        element: 'Inactive Filter Chip (.tag-filter-chip)',
        fgColor: catalogData.inactiveChip.color,
        bgColor: catalogData.inactiveChip.bg,
        contrastRatio: ratio,
        wcagAA: ratio >= 4.5,
        wcagAAA: ratio >= 7.0,
        notes: 'Unselected genre pill'
      });
    }

    if (catalogData.gameTitle) {
      const ratio = calculateContrast(catalogData.gameTitle.color, catalogData.cardBg);
      samples.push({
        view: 'Catalog',
        theme,
        element: 'Card Game Title (.game-title)',
        fgColor: catalogData.gameTitle.color,
        bgColor: catalogData.cardBg,
        contrastRatio: ratio,
        wcagAA: ratio >= 4.5,
        wcagAAA: ratio >= 7.0,
        notes: 'Store game card headline'
      });
    }

    // 2. Game Detail View
    await page.goto(`${baseUrl}/games/game_001`, { waitUntil: 'networkidle' });
    await page.evaluate((t) => {
      document.documentElement.setAttribute('data-theme', t);
      localStorage.setItem('app_theme', t);
    }, theme);
    await page.waitForTimeout(300);

    const detailData = await page.evaluate(() => {
      const titleEl = document.querySelector('.steam-game-title');
      const buyBtnEl = document.querySelector('.btn-download, .btn-steam-buy');
      const bodyBg = window.getComputedStyle(document.body).backgroundColor;
      return {
        titleColor: titleEl ? window.getComputedStyle(titleEl).color : null,
        buyBtn: buyBtnEl ? {
          color: window.getComputedStyle(buyBtnEl).color,
          bg: window.getComputedStyle(buyBtnEl).backgroundColor
        } : null,
        bodyBg
      };
    });

    if (detailData.titleColor) {
      const ratio = calculateContrast(detailData.titleColor, detailData.bodyBg);
      samples.push({
        view: 'Game Detail',
        theme,
        element: 'Product Title (.steam-game-title)',
        fgColor: detailData.titleColor,
        bgColor: detailData.bodyBg,
        contrastRatio: ratio,
        wcagAA: ratio >= 4.5,
        wcagAAA: ratio >= 7.0,
        notes: 'Primary title on game showcase'
      });
    }

    if (detailData.buyBtn) {
      const ratio = calculateContrast(detailData.buyBtn.color, detailData.buyBtn.bg);
      samples.push({
        view: 'Game Detail',
        theme,
        element: 'Primary Action Button (.btn-download)',
        fgColor: detailData.buyBtn.color,
        bgColor: detailData.buyBtn.bg,
        contrastRatio: ratio,
        wcagAA: ratio >= 4.5,
        wcagAAA: ratio >= 7.0,
        notes: 'Acquisition / Purchase CTA'
      });
    }

    // 3. Login Page
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
    await page.evaluate((t) => {
      document.documentElement.setAttribute('data-theme', t);
      localStorage.setItem('app_theme', t);
    }, theme);
    await page.waitForTimeout(300);

    const loginData = await page.evaluate(() => {
      const submitBtnEl = document.querySelector('.btn-submit');
      return {
        submitBtn: submitBtnEl ? {
          color: window.getComputedStyle(submitBtnEl).color,
          bg: window.getComputedStyle(submitBtnEl).backgroundColor
        } : null
      };
    });

    if (loginData.submitBtn) {
      const ratio = calculateContrast(loginData.submitBtn.color, loginData.submitBtn.bg);
      samples.push({
        view: 'Login',
        theme,
        element: 'Submit Button (.btn-submit)',
        fgColor: loginData.submitBtn.color,
        bgColor: loginData.submitBtn.bg,
        contrastRatio: ratio,
        wcagAA: ratio >= 4.5,
        wcagAAA: ratio >= 7.0,
        notes: 'Authentication submission CTA'
      });
    }

    // 4. Header Navigation
    const headerData = await page.evaluate(() => {
      const headerEl = document.querySelector('.nexora-header');
      const linkEl = document.querySelector('.nav-link');
      const headerBg = headerEl ? window.getComputedStyle(headerEl).backgroundColor : '#131622';
      return {
        link: linkEl ? window.getComputedStyle(linkEl).color : null,
        headerBg
      };
    });

    if (headerData.link) {
      const ratio = calculateContrast(headerData.link, headerData.headerBg);
      samples.push({
        view: 'Header Nav',
        theme,
        element: 'Navigation Links (.nav-link)',
        fgColor: headerData.link,
        bgColor: headerData.headerBg,
        contrastRatio: ratio,
        wcagAA: ratio >= 4.5,
        wcagAAA: ratio >= 7.0,
        notes: 'Top navigation links'
      });
    }
  }

  await browser.close();

  // Print results summary
  console.log('\n======================================================================');
  console.log('📊 WCAG CONTRAST & VISIBILITY COMPLIANCE SCORECARD');
  console.log('======================================================================\n');

  for (const s of samples) {
    const icon = s.wcagAAA ? '🌟 AAA' : (s.wcagAA ? '✅ AA' : '⚠️ FAIL');
    console.log(`[${s.theme.toUpperCase()}] ${s.view} -> ${s.element}`);
    console.log(`   FG: ${s.fgColor} | BG: ${s.bgColor}`);
    console.log(`   Contrast: ${s.contrastRatio}:1 | Compliance: ${icon} (${s.notes})\n`);
  }

  const allAA = samples.every(s => s.wcagAA);
  const aaaCount = samples.filter(s => s.wcagAAA).length;

  console.log('======================================================================');
  console.log(`🏆 AUDIT VERDICT: ${allAA ? '100% WCAG COMPLIANT' : 'ISSUES DETECTED'}`);
  console.log(`   Total Elements Tested: ${samples.length}`);
  console.log(`   WCAG AAA (>= 7.0:1): ${aaaCount}/${samples.length}`);
  console.log(`   WCAG AA  (>= 4.5:1): ${samples.filter(s => s.wcagAA).length}/${samples.length}`);
  console.log('======================================================================\n');

  return samples;
}

const target = process.argv[2] || 'http://localhost:4200';
runThemeContrastAudit(target);
