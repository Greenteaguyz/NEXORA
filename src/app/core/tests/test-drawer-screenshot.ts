import { chromium } from 'playwright';
import path from 'path';

async function testDrawerModes() {
  const browser = await chromium.launch({ headless: true });
  
  // Test Light Mode
  const lightContext = await browser.newContext({ viewport: { width: 768, height: 900 } });
  const lightPage = await lightContext.newPage();
  await lightPage.goto('http://localhost:4200/catalog', { waitUntil: 'networkidle' });
  
  // Toggle to light mode first
  await lightPage.click('button.theme-pill');
  await lightPage.waitForTimeout(300);
  
  // Open mobile drawer
  await lightPage.click('button.hamburger-btn');
  await lightPage.waitForTimeout(400);
  
  const lightOut = path.join('C:/Users/User/.gemini/antigravity-ide/brain/0b8bc6ef-6851-40ea-9d6b-2357e622cd2d/screenshots', 'mobile_drawer_light_768px.png');
  await lightPage.screenshot({ path: lightOut });
  console.log('Saved light mode drawer screenshot to:', lightOut);
  await lightContext.close();

  // Test Dark Mode
  const darkContext = await browser.newContext({ viewport: { width: 768, height: 900 } });
  const darkPage = await darkContext.newPage();
  await darkPage.goto('http://localhost:4200/catalog', { waitUntil: 'networkidle' });
  
  // Open mobile drawer in dark mode
  await darkPage.click('button.hamburger-btn');
  await darkPage.waitForTimeout(400);
  
  const darkOut = path.join('C:/Users/User/.gemini/antigravity-ide/brain/0b8bc6ef-6851-40ea-9d6b-2357e622cd2d/screenshots', 'mobile_drawer_dark_768px.png');
  await darkPage.screenshot({ path: darkOut });
  console.log('Saved dark mode drawer screenshot to:', darkOut);
  await darkContext.close();

  await browser.close();
}

testDrawerModes().catch(console.error);
