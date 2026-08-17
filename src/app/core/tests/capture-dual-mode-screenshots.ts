import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

async function main() {
  const artifactDir = 'C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\0b8bc6ef-6851-40ea-9d6b-2357e622cd2d';
  const outDir = path.join(artifactDir, 'screenshots');
  const projectOutDir = 'c:\\Users\\User\\Downloads\\AngularProject\\screenshots';

  [outDir, projectOutDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  console.log('====================================================');
  console.log('📸 CAPTURING ALL PAGES IN DUAL THEME (DARK & LIGHT)');
  console.log('====================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  async function saveImg(filename: string, isViewportOnly = false) {
    const p1 = path.join(outDir, filename);
    const p2 = path.join(projectOutDir, filename);
    await page.screenshot({ path: p1, fullPage: !isViewportOnly });
    fs.copyFileSync(p1, p2);
    console.log(`  ✓ Saved: ${filename}`);
  }

  async function setDark() {
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('app_theme', 'dark');
    });
    await page.waitForTimeout(200);
  }

  async function setLight() {
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('app_theme', 'light');
    });
    await page.waitForTimeout(200);
  }

  // ----------------------------------------------------
  // 1. Landing / Catalog Page
  // ----------------------------------------------------
  console.log('1. Capturing Store Catalog Page (Anonymous)...');
  await page.goto('http://localhost:4200/catalog', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  await setDark();
  await saveImg('01_catalog_dark.png');
  await setLight();
  await saveImg('01_catalog_light.png');

  // ----------------------------------------------------
  // 2. Catalog Search & Filter Active
  // ----------------------------------------------------
  console.log('\n2. Capturing Catalog with Active Search & Tag Filter...');
  await page.fill('input.search-input', 'Cyber');
  await page.waitForTimeout(300);

  await setDark();
  await saveImg('02_search_filter_dark.png');
  await setLight();
  await saveImg('02_search_filter_light.png');

  // ----------------------------------------------------
  // 3. Genre Category Directory (/genres)
  // ----------------------------------------------------
  console.log('\n3. Capturing Genre Category Directory...');
  await page.goto('http://localhost:4200/genres', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  await setDark();
  await saveImg('03_genres_directory_dark.png');
  await setLight();
  await saveImg('03_genres_directory_light.png');

  // ----------------------------------------------------
  // 4. Game Detail Showcase (/games/game_001)
  // ----------------------------------------------------
  console.log('\n4. Capturing Game Detail Showcase (/games/game_001)...');
  await page.goto('http://localhost:4200/games/game_001', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  await setDark();
  await saveImg('04_game_detail_dark.png');
  await setLight();
  await saveImg('04_game_detail_light.png');

  // ----------------------------------------------------
  // 5. Screenshot Lightbox Full-Screen Modal
  // ----------------------------------------------------
  console.log('\n5. Capturing Full-Screen Screenshot Lightbox Modal...');
  await page.click('.screenshot-thumb-box >> nth=0');
  await page.waitForSelector('.lightbox-backdrop', { timeout: 3000 });
  await page.waitForTimeout(300);

  await setDark();
  await saveImg('05_screenshot_lightbox_dark.png', true);
  await setLight();
  await saveImg('05_screenshot_lightbox_light.png', true);

  // Close lightbox
  await page.click('button.btn-lightbox-close');
  await page.waitForTimeout(200);

  // ----------------------------------------------------
  // 6. Creator Developer Profile (/creators/usr_alice)
  // ----------------------------------------------------
  console.log('\n6. Capturing Creator Profile Storefront (/creators/usr_alice)...');
  await page.goto('http://localhost:4200/creators/usr_alice', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  await setDark();
  await saveImg('06_creator_profile_dark.png');
  await setLight();
  await saveImg('06_creator_profile_light.png');

  // ----------------------------------------------------
  // 7. Support & Help Center (/support)
  // ----------------------------------------------------
  console.log('\n7. Capturing Support & Help Center (/support)...');
  await page.goto('http://localhost:4200/support', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  await setDark();
  await saveImg('07_support_page_dark.png');
  await setLight();
  await saveImg('07_support_page_light.png');

  // ----------------------------------------------------
  // 8. Sign In Page (/login)
  // ----------------------------------------------------
  console.log('\n8. Capturing Sign In Page (/login)...');
  await page.goto('http://localhost:4200/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  await setDark();
  await saveImg('08_login_page_dark.png');
  await setLight();
  await saveImg('08_login_page_light.png');

  // ----------------------------------------------------
  // 9. Register Page with Creator Toggle (/register)
  // ----------------------------------------------------
  console.log('\n9. Capturing Register Page (/register)...');
  await page.goto('http://localhost:4200/register', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  await setDark();
  await saveImg('09_register_page_dark.png');
  await setLight();
  await saveImg('09_register_page_light.png');

  // ----------------------------------------------------
  // 10. Forgot Password Recovery (/forgot-password)
  // ----------------------------------------------------
  console.log('\n10. Capturing Forgot Password Recovery (/forgot-password)...');
  await page.goto('http://localhost:4200/forgot-password', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  await setDark();
  await saveImg('10_forgot_password_dark.png');
  await setLight();
  await saveImg('10_forgot_password_light.png');

  // ----------------------------------------------------
  // 11. Active Creator Session: Alice Vance
  // ----------------------------------------------------
  console.log('\n11. Capturing Active Session: Alice Vance (Creator)...');
  await page.goto('http://localhost:4200/login', { waitUntil: 'networkidle' });
  await page.click('.demo-box button:has-text("Alice (Creator)")');
  await page.waitForTimeout(150);
  await page.click('button.btn-submit');
  await page.waitForURL('**/catalog', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(400);

  await setDark();
  await saveImg('11_logged_in_alice_dark.png');
  await setLight();
  await saveImg('11_logged_in_alice_light.png');

  // ----------------------------------------------------
  // 12. Active Buyer Session: Bob Mercer
  // ----------------------------------------------------
  console.log('\n12. Capturing Active Session: Bob Mercer (Buyer)...');
  await page.click('.demo-switcher button:has-text("Bob (Buyer)")');
  await page.waitForTimeout(400);

  await setDark();
  await saveImg('12_switched_to_bob_dark.png');
  await setLight();
  await saveImg('12_switched_to_bob_light.png');

  // ----------------------------------------------------
  // 13. 404 Void Fallback Screen (/not-found)
  // ----------------------------------------------------
  console.log('\n13. Capturing 404 Void Fallback Screen...');
  await page.goto('http://localhost:4200/unknown-coordinates', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  await setDark();
  await saveImg('13_not_found_dark.png');
  await setLight();
  await saveImg('13_not_found_light.png');

  await browser.close();
  console.log('\n====================================================');
  console.log('🎉 ALL DUAL-THEME SCREENSHOTS CAPTURED SUCCESSFULLY!');
  console.log('====================================================');
}

main().catch(err => {
  console.error('Error during dual-theme screenshot capture:', err);
  process.exit(1);
});
