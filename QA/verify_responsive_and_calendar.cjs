const { chromium } = require('d:/GitHub_Projects/payledger/web/node_modules/playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  const screenshotsDir = path.resolve(__dirname, 'screenshots_responsive');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  console.log('--- 1. DESKTOP / LAPTOP TESTING (1440x900) ---');
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const desktopPage = await desktopContext.newPage();

  console.log('Navigating to http://localhost:5174/?tab=transactions...');
  await desktopPage.goto('http://localhost:5174/?tab=transactions', { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(1500);

  // 1. Transactions Split View (Calendar + Ledger)
  console.log('Capturing Transactions Split view...');
  await desktopPage.screenshot({ path: path.join(screenshotsDir, '01_desktop_transactions_split_view.png') });

  // 2. Click a date on the calendar to trigger Confluence-style action menu
  console.log('Clicking on calendar date 15...');
  // Find a date button or container on the calendar
  const day15 = desktopPage.locator('button:has-text("15"), div:has-text("15")').filter({ hasText: /^15$/ }).first();
  if (await day15.count() > 0) {
    await day15.click();
    await desktopPage.waitForTimeout(500);
    console.log('Capturing Confluence-style date popup menu...');
    await desktopPage.screenshot({ path: path.join(screenshotsDir, '02_desktop_calendar_date_popup.png') });
    // Close modal before proceeding
    const closeBtn = desktopPage.locator('button:has(svg.w-4.h-4), button:has(svg.lucide-x), button[aria-label="Close"]').first();
    if (await closeBtn.count() > 0) {
      await closeBtn.click();
    } else {
      await desktopPage.keyboard.press('Escape');
    }
    await desktopPage.waitForTimeout(500);
  }

  // 3. Switch to Full Calendar View
  console.log('Switching to Calendar View...');
  const calBtn = desktopPage.locator('button:has-text("Calendar")').first();
  if (await calBtn.count() > 0) {
    await calBtn.click();
    await desktopPage.waitForTimeout(500);
    await desktopPage.screenshot({ path: path.join(screenshotsDir, '03_desktop_transactions_full_calendar.png') });
  }

  // 4. Switch to Full List View
  console.log('Switching to List View...');
  const listBtn = desktopPage.locator('button:has-text("List")').first();
  if (await listBtn.count() > 0) {
    await listBtn.click();
    await desktopPage.waitForTimeout(500);
    await desktopPage.screenshot({ path: path.join(screenshotsDir, '04_desktop_transactions_full_list.png') });
  }

  // 5. Navigate to Utilities View (Desktop 2-column landscape layout)
  console.log('Navigating to Utilities dedicated workspace...');
  await desktopPage.goto('http://localhost:5174/?tab=utilities', { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(1000);
  console.log('Capturing desktop utilities landscape view...');
  await desktopPage.screenshot({ path: path.join(screenshotsDir, '05_desktop_utilities_landscape_view.png') });

  // 6. Test sidebar collapse shortcut "["
  console.log('Testing sidebar collapse keyboard shortcut "["...');
  await desktopPage.keyboard.press('[');
  await desktopPage.waitForTimeout(400);
  await desktopPage.screenshot({ path: path.join(screenshotsDir, '06_desktop_sidebar_collapsed_rail.png') });
  await desktopPage.keyboard.press('[');
  await desktopPage.waitForTimeout(400);

  // 7. Upcoming Bills Calendar View
  console.log('Navigating to Upcoming Bills...');
  await desktopPage.goto('http://localhost:5174/?tab=recurring', { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(1000);
  console.log('Capturing Upcoming Bills calendar view...');
  await desktopPage.screenshot({ path: path.join(screenshotsDir, '07_desktop_upcoming_bills_calendar.png') });

  await desktopContext.close();

  console.log('--- 2. MOBILE RESPONSIVE TESTING (390x844 - iPhone 14 style) ---');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();

  console.log('Navigating to Dashboard on mobile...');
  await mobilePage.goto('http://localhost:5174/?tab=dashboard', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1500);
  console.log('Capturing mobile dashboard with bottom tab bar...');
  await mobilePage.screenshot({ path: path.join(screenshotsDir, '08_mobile_dashboard_bottom_bar.png') });

  // Click "More..." on bottom tab bar
  console.log('Clicking "More" tab in bottom navigation...');
  const moreBtn = mobilePage.locator('button:has-text("More")');
  await moreBtn.click();
  await mobilePage.waitForTimeout(500);
  console.log('Capturing mobile "More" menu sheet...');
    await mobilePage.screenshot({ path: path.join(screenshotsDir, '09_mobile_more_drawer.png') });
    await mobilePage.keyboard.press('Escape');
    await mobilePage.waitForTimeout(300);

    // Navigate to Transactions on mobile
    console.log('Navigating to Transactions on mobile...');
    await mobilePage.goto('http://localhost:5174/?tab=transactions', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(800);
    console.log('Capturing mobile Transactions view...');
    await mobilePage.screenshot({ path: path.join(screenshotsDir, '10_mobile_transactions_view.png') });

    // Navigate to Utilities on mobile
    console.log('Navigating to Utilities on mobile...');
    await mobilePage.goto('http://localhost:5174/?tab=utilities', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(800);
    console.log('Capturing mobile Utilities view...');
    await mobilePage.screenshot({ path: path.join(screenshotsDir, '11_mobile_utilities_view.png') });

  await mobileContext.close();
  await browser.close();

  console.log('Verification completed successfully! All screenshots saved in QA/screenshots_responsive/');
}

run().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
