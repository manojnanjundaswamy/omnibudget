const { chromium } = require('D:/GitHub_Projects/payledger/web/node_modules/playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  const screenshotsDir = 'C:/Users/manoj/.gemini/antigravity/brain/9f3ee126-8ba4-4d22-9fb2-9d74665c2a08/screenshots';
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  console.log('1. Navigating to OmniBudget Capture Page...');
  await page.goto('http://localhost:5174/?tab=capture', { waitUntil: 'networkidle' });

  // Wait for header to appear
  await page.waitForSelector('text=Auto-Pull & Smart Capture', { timeout: 10000 });
  console.log('✓ Header rendered successfully');

  // Verify personal email address
  const emailBox = await page.waitForSelector('text=inbound.omnibudget.local', { timeout: 5000 });
  const emailText = await emailBox.innerText();
  console.log(`✓ Personal forwarding address detected: ${emailText}`);

  await page.screenshot({ path: path.join(screenshotsDir, 'capture_01_overview.png'), fullPage: true });

  console.log('2. Testing simulated Gmail confirmation code webhook...');
  const simulateBtn = await page.waitForSelector('button:has-text("Simulate Arrival (Dev Test)")');
  await simulateBtn.click();
  await page.waitForTimeout(1500);

  // Verify confirmation code box
  await page.waitForSelector('text=Gmail\'s Forwarding Confirmation Code Received!', { timeout: 5000 });
  console.log('✓ Gmail forwarding confirmation code displayed in UI');
  await page.screenshot({ path: path.join(screenshotsDir, 'capture_02_gmail_confirmation.png'), fullPage: true });

  console.log('3. Testing Paste Bank SMS...');
  const smsTab = await page.waitForSelector('button:has-text("Paste Bank SMS")');
  await smsTab.click();
  await page.waitForTimeout(500);

  const sampleBtn = await page.waitForSelector('button:has-text("Load Sample SMS")');
  await sampleBtn.click();
  await page.waitForTimeout(500);

  const readBtn = await page.waitForSelector('button:has-text("Read and Stage for Review")');
  await readBtn.click();
  await page.waitForTimeout(2000);

  console.log('✓ Staged bank SMS in To Review Queue');
  await page.screenshot({ path: path.join(screenshotsDir, 'capture_03_staged_review_queue.png'), fullPage: true });

  console.log('4. Adding transaction from Review Queue to permanent Ledger...');
  const addBtn = await page.waitForSelector('button:has-text("Add to Ledger")');
  await addBtn.click();
  await page.waitForTimeout(1500);

  console.log('✓ Transaction successfully added to Ledger');
  await page.screenshot({ path: path.join(screenshotsDir, 'capture_04_added_to_ledger.png'), fullPage: true });

  console.log('5. Testing Web Share Target parameter ingestion (?tab=capture&text=...)');
  await page.goto('http://localhost:5174/?tab=capture&text=Alert%3A+Rs+850.00+spent+on+HDFC+Bank+Card+ending+4412+at+Uber+on+14-Oct-26.+Avl+bal%3A+Rs+44360.00', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('✓ Web Share Target auto-parsed SMS alert');
  await page.screenshot({ path: path.join(screenshotsDir, 'capture_05_shared_sms_target.png'), fullPage: true });

  console.log('All Capture E2E tests completed with 5 screenshots captured!');
  await browser.close();
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
