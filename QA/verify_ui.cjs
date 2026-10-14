const { chromium } = require('d:/GitHub_Projects/payledger/web/node_modules/playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  const qaDir = path.resolve(__dirname, '../qa/screenshots');
  if (!fs.existsSync(qaDir)) fs.mkdirSync(qaDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:5174...');
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // 1. Capture Header Alignment (seamless horizontal line at y=64)
  console.log('Capturing header alignment...');
  await page.screenshot({ path: path.join(qaDir, '01_header_alignment.png') });

  // 2. Open Notification Dropdown
  console.log('Opening notification dropdown...');
  const bellBtn = page.locator('button[title*="Notification Center"]');
  await bellBtn.click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(qaDir, '02_notification_dropdown.png') });

  // 3. Click Preferences inside Notification Dropdown
  console.log('Clicking Preferences in notification panel...');
  const prefBtn = page.locator('button:has-text("Preferences")');
  await prefBtn.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(qaDir, '03_notification_preferences_routing.png') });

  // 4. Return to Dashboard and Test Multi-Window Floating Utilities
  console.log('Returning to Dashboard...');
  await page.locator('button:has-text("Dashboard")').first().click();
  await page.waitForTimeout(600);

  // Open Edge Dock
  console.log('Opening Edge Dock handle...');
  const edgeHandle = page.locator('button[aria-label*="Finance Utilities"]');
  await edgeHandle.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(qaDir, '04_edge_dock_opened.png') });

  // Launch Calculator
  console.log('Launching Calculator window...');
  await page.locator('button:has-text("Calculator")').last().click({ force: true });
  await page.waitForTimeout(500);

  // Open Edge Dock again and launch Loan EMI
  await edgeHandle.click({ force: true });
  await page.waitForTimeout(400);
  console.log('Launching Loan EMI window...');
  await page.locator('button:has-text("Loan EMI")').last().click({ force: true });
  await page.waitForTimeout(500);

  // Open Edge Dock again and launch Income Tax
  await edgeHandle.click({ force: true });
  await page.waitForTimeout(400);
  console.log('Launching Income Tax window...');
  await page.locator('button:has-text("Income Tax")').last().click({ force: true });
  await page.waitForTimeout(500);

  // Minimize Loan EMI
  console.log('Minimizing Loan EMI window...');
  const loanWindow = page.locator('section[aria-label="Loan EMI"]');
  await loanWindow.locator('button[aria-label="Minimize"]').click({ force: true });
  await page.waitForTimeout(500);

  // Capture Multi-Window with Bottom Dock Tray
  console.log('Capturing multi-floating windows with bottom dock tray...');
  await page.screenshot({ path: path.join(qaDir, '05_multi_floating_windows.png') });

  await browser.close();
  console.log('All verification screenshots captured successfully in qa/screenshots!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
