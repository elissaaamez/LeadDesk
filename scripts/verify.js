const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const BASE_URL = 'http://localhost:3000';

async function screenshot(page, name) {
  const filepath = path.join(SCREENSHOTS_DIR, name);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`✓ ${name}`);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.setViewportSize({ width: 1920, height: 1080 });

  try {
    console.log('\n=== LANDING PAGE ===');
    await page.goto(BASE_URL);
    await page.waitForSelector('#root');
    await page.waitForTimeout(300);
    await screenshot(page, '01-landing.png');

    console.log('\n=== DEMO MODE: LOGIN ===');
    await page.click('text=Sign in');
    await page.waitForTimeout(300);
    await screenshot(page, '02-demo-login-form.png');

    await page.fill('#li_email', 'manager@company.com');
    await page.fill('#li_pass', 'admin123');
    await page.click('#loginForm button[type="submit"]');
    await page.waitForNavigation();
    await page.waitForTimeout(600);
    await screenshot(page, '03-demo-dashboard.png');

    console.log('\n=== DEMO MODE: ANALYTICS ===');
    await page.click('#runAnalytics');
    await page.waitForTimeout(1500);
    await screenshot(page, '04-demo-analytics.png');

    console.log('\n=== DEMO MODE: LEAD CAPTURE ===');
    await page.click('[data-tab="capture"]');
    await page.waitForTimeout(300);
    await screenshot(page, '05-demo-capture-form.png');

    await page.fill('#cap_msg', 'Hi, I am interested in your CRM solution. My email is john@company.tn and phone is +216 23 456 789');
    await page.click('#capBtn');
    await page.waitForTimeout(800);
    await screenshot(page, '06-demo-capture-result.png');

    console.log('\n=== DEMO MODE: WORKSPACE ===');
    await page.click('[data-tab="workspace"]');
    await page.waitForTimeout(300);
    await screenshot(page, '07-demo-workspace.png');

    console.log('\n=== DEMO MODE: FOLLOW-UP ===');
    await page.click('[data-tab="followup"]');
    await page.waitForTimeout(300);
    await screenshot(page, '08-demo-followup-form.png');

    await page.click('#runFollow');
    await page.waitForTimeout(1200);
    await screenshot(page, '09-demo-followup-results.png');

    console.log('\n=== LOGOUT & LOCAL MODE SETUP ===');
    await page.click('#logoutBtn');
    await page.waitForTimeout(600);
    await screenshot(page, '10-landing-after-logout.png');

    console.log('\n=== LOCAL MODE: SIGNUP ===');
    await page.click('text=Create account');
    await page.waitForTimeout(300);
    await screenshot(page, '11-local-signup-form.png');

    await page.fill('#su_name', 'Test User');
    await page.fill('#su_email', 'test@company.tn');
    await page.fill('#su_pass', 'Test@123456');
    await page.fill('#su_pass2', 'Test@123456');
    await page.click('#signupForm button[type="submit"]');
    await page.waitForNavigation();
    await page.waitForTimeout(600);
    await screenshot(page, '12-local-after-signup.png');

    console.log('\n=== LOCAL MODE: MODE TOGGLE ===');
    await page.click('#mtoggle');
    await page.waitForTimeout(300);
    await screenshot(page, '13-local-rail-open.png');

    await page.click('[data-mode="local"]');
    await page.waitForTimeout(500);
    await screenshot(page, '14-local-mode-activated.png');

    console.log('\n=== LOCAL MODE: DASHBOARD ===');
    await page.click('.scrim');
    await page.waitForTimeout(300);
    await page.waitForSelector('#page');
    await page.waitForTimeout(500);
    await screenshot(page, '15-local-dashboard.png');

    console.log('\n=== LOCAL MODE: CAPTURE ===');
    await page.click('[data-tab="capture"]');
    await page.waitForTimeout(300);
    await screenshot(page, '16-local-capture-form.png');

    await page.fill('#cap_name', 'Ahmed Ben Ali');
    await page.fill('#cap_email', 'ahmed@tunisia-corp.tn');
    await page.fill('#cap_msg', 'Interested in pricing and a demo of your CRM automation for Tunisian market');
    await page.click('#capBtn');
    await page.waitForTimeout(800);
    await screenshot(page, '17-local-capture-result.png');

    console.log('\n=== LOCAL MODE: WORKSPACE ===');
    await page.click('[data-tab="workspace"]');
    await page.waitForTimeout(300);
    await screenshot(page, '18-local-workspace.png');

    console.log('\n=== LOCAL MODE: FOLLOW-UP ===');
    await page.click('[data-tab="followup"]');
    await page.waitForTimeout(300);
    await screenshot(page, '19-local-followup-form.png');

    await page.click('#runFollow');
    await page.waitForTimeout(1200);
    await screenshot(page, '20-local-followup-results.png');

    console.log('\n=== LOCAL MODE: SETTINGS ===');
    await page.click('[data-tab="settings"]');
    await page.waitForTimeout(300);
    await screenshot(page, '21-local-settings.png');

    console.log('\n=== LIVE MODE: SETUP ===');
    await page.click('#mtoggle');
    await page.waitForTimeout(300);
    await page.click('[data-mode="live"]');
    await page.waitForTimeout(500);
    await page.click('.scrim');
    await page.waitForTimeout(300);
    await screenshot(page, '22-live-mode-activated.png');

    console.log('\n=== LIVE MODE: DASHBOARD ===');
    await page.click('[data-tab="dashboard"]');
    await page.waitForTimeout(300);
    await screenshot(page, '23-live-dashboard.png');

    console.log('\n=== ASSISTANT ===');
    await page.click('[data-tab="assistant"]');
    await page.waitForTimeout(300);
    await screenshot(page, '24-assistant-chat.png');

    console.log('\n=== ARCHITECTURE ===');
    await page.click('[data-tab="architecture"]');
    await page.waitForTimeout(300);
    await screenshot(page, '25-architecture.png');

    console.log('\n✅ All verification screenshots captured');
  } catch (err) {
    console.error('❌ Error during verification:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
