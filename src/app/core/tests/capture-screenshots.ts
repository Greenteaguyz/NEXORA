import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

async function main() {
  const artifactDir = 'C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\4e4e38e6-bb39-4f0b-a5c3-3cc7cee55d50';
  const outDir = path.join(artifactDir, 'screenshots');
  const projectOutDir = 'c:\\Users\\User\\Downloads\\AngularProject\\screenshots';

  [outDir, projectOutDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  console.log('Launching browser to capture latest screenshots of all pages...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  async function snap(name: string) {
    const p1 = path.join(outDir, name);
    const p2 = path.join(projectOutDir, name);
    await page.screenshot({ path: p1, fullPage: true });
    fs.copyFileSync(p1, p2);
    console.log(`  ✓ Saved: ${name}`);
  }

  // 1. Landing Page (Anonymous)
  console.log('1. Capturing Landing Page (Anonymous)...');
  await page.goto('http://localhost:4200/catalog', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await snap('01_landing_anonymous.png');

  // 2. Login Page
  console.log('2. Capturing Login Page...');
  await page.goto('http://localhost:4200/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await snap('02_login_page.png');

  // 3. Register Page
  console.log('3. Capturing Register Page...');
  await page.goto('http://localhost:4200/register', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await snap('03_register_page.png');

  // 4. Forgot Password Page
  console.log('4. Capturing Forgot Password Page...');
  await page.goto('http://localhost:4200/forgot-password', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await snap('04_forgot_password.png');

  // 5. Support & Help Center Page
  console.log('5. Capturing Support Page...');
  await page.goto('http://localhost:4200/support', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await snap('05_support_page.png');

  // 6. Logged In as Alice (Creator)
  console.log('6. Logging in as Alice Vance (Creator)...');
  await page.goto('http://localhost:4200/login', { waitUntil: 'networkidle' });
  await page.click('.demo-box button:has-text("Alice (Creator)")');
  await page.waitForTimeout(150);
  await page.click('button.btn-submit');
  await page.waitForURL('**/catalog', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(500);
  await snap('06_logged_in_alice_creator.png');

  // 7. Switched to Bob (Buyer)
  console.log('7. Switching to Bob Mercer (Buyer)...');
  await page.click('.demo-switcher button:has-text("Bob (Buyer)")');
  await page.waitForTimeout(500);
  await snap('07_switched_to_bob_buyer.png');

  // 8. 404 Not Found Page
  console.log('8. Capturing 404 Not Found Page...');
  await page.goto('http://localhost:4200/non-existent-route', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await snap('08_not_found_page.png');

  await browser.close();
  console.log('\nAll latest screenshots captured successfully!');
}

main().catch(err => {
  console.error('Error capturing latest screenshots:', err);
  process.exit(1);
});
