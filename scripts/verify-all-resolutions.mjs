// scripts/verify-all-resolutions.mjs
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputDir = path.resolve('QA/evidence/resolutions');
fs.mkdirSync(outputDir, { recursive: true });

const RESOLUTIONS = [
  { name: 'desktop-1920x1080', width: 1920, height: 1080, isMobile: false },
  { name: 'laptop-1440x900', width: 1440, height: 900, isMobile: false },
  { name: 'compact-1280x800', width: 1280, height: 800, isMobile: false },
  { name: 'tablet-768x1024', width: 768, height: 1024, isMobile: true },
  { name: 'mobile-390x844', width: 390, height: 844, isMobile: true },
];

async function run() {
  console.log('=== MULTI-RESOLUTION E2E VISUAL VERIFICATION ===');

  for (const res of RESOLUTIONS) {
    console.log(`\n--------------------------------------------`);
    console.log(`Testing Resolution: ${res.name} (${res.width}x${res.height})`);
    console.log(`--------------------------------------------`);

    const userDataDir = path.resolve(`QA/temp_chrome_profile_${res.width}x${res.height}`);
    fs.mkdirSync(userDataDir, { recursive: true });

    const chromeProc = spawn(chromePath, [
      '--headless=new',
      `--remote-debugging-port=9225`,
      `--user-data-dir=${userDataDir}`,
      `--window-size=${res.width},${res.height}`,
      'http://localhost:5174',
    ]);

    // Wait for Chrome to bind
    await new Promise(r => setTimeout(r, 2200));

    try {
      const versionRes = await fetch('http://127.0.0.1:9225/json/list');
      const tabs = await versionRes.json();
      const pageTab = tabs.find(t => t.type === 'page');

      if (!pageTab) {
        throw new Error('No page tab found in Chrome!');
      }

      const ws = new globalThis.WebSocket(pageTab.webSocketDebuggerUrl);
      let idCounter = 1;
      const pending = new Map();

      function send(method, params = {}) {
        return new Promise((resolve, reject) => {
          const id = idCounter++;
          pending.set(id, { resolve, reject });
          ws.send(JSON.stringify({ id, method, params }));
        });
      }

      ws.addEventListener('message', (event) => {
        const msg = JSON.parse(event.data.toString());
        if (msg.id && pending.has(msg.id)) {
          const { resolve, reject } = pending.get(msg.id);
          pending.delete(msg.id);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      });

      await new Promise(r => ws.addEventListener('open', r, { once: true }));

      await send('Runtime.enable');
      await send('Page.enable');
      await send('Emulation.setDeviceMetricsOverride', {
        width: res.width,
        height: res.height,
        deviceScaleFactor: 1,
        mobile: res.isMobile,
      });

      // Navigate cleanly
      await send('Page.navigate', { url: 'http://localhost:5174' });
      await new Promise(r => setTimeout(r, 2000));

      // 1. Capture Default Dashboard Screenshot
      const ss1 = await send('Page.captureScreenshot', { format: 'png' });
      const path1 = path.join(outputDir, `${res.name}-01-dashboard.png`);
      fs.writeFileSync(path1, Buffer.from(ss1.data, 'base64'));
      console.log(` [✓] Captured: ${path.basename(path1)}`);

      // Inspect layout bounds to verify no void
      const layoutCheck = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const main = document.querySelector('main');
            const mainRect = main ? main.getBoundingClientRect() : null;
            const topBar = document.querySelector('header');
            const topBarRect = topBar ? topBar.getBoundingClientRect() : null;
            const edgeHandle = document.querySelector('[title*="Samsung Finance Utilities"]');
            return {
              viewport: { width: window.innerWidth, height: window.innerHeight },
              mainRect: mainRect ? { left: mainRect.left, right: mainRect.right, width: mainRect.width } : null,
              topBarRect: topBarRect ? { left: topBarRect.left, right: topBarRect.right, width: topBarRect.width } : null,
              edgeHandlePresent: !!edgeHandle,
            };
          })()
        `,
        returnByValue: true
      });
      console.log('     Layout Metrics:', JSON.stringify(layoutCheck.result.value));

      // 2. Open Notification Center
      await send('Runtime.evaluate', {
        expression: `
          (() => {
            const bell = document.querySelector('button[title*="Notification"]');
            if (bell) bell.click();
          })()
        `
      });
      await new Promise(r => setTimeout(r, 600));

      const ss2 = await send('Page.captureScreenshot', { format: 'png' });
      const path2 = path.join(outputDir, `${res.name}-02-notification-modal.png`);
      fs.writeFileSync(path2, Buffer.from(ss2.data, 'base64'));
      console.log(` [✓] Captured: ${path.basename(path2)}`);

      // Verify notification modal is not cut off at top or bottom
      const notifModalCheck = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const modalTitle = Array.from(document.querySelectorAll('h3')).find(h => h.textContent?.includes('Notification Center'));
            const modalBox = modalTitle ? modalTitle.closest('.modal-card-luxury') : null;
            if (!modalBox) return { found: false };
            const rect = modalBox.getBoundingClientRect();
            return {
              found: true,
              top: rect.top,
              bottom: rect.bottom,
              height: rect.height,
              width: rect.width,
              isCutOffTop: rect.top < 0,
              isCutOffBottom: rect.bottom > window.innerHeight
            };
          })()
        `,
        returnByValue: true
      });
      console.log('     Notification Modal Metrics:', JSON.stringify(notifModalCheck.result.value));

      // Close Notification Center (via Escape or close button)
      await send('Runtime.evaluate', {
        expression: `
          (() => {
            const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.querySelector('svg.lucide-x') && b.closest('.modal-card-luxury'));
            if (closeBtn) closeBtn.click();
          })()
        `
      });
      await new Promise(r => setTimeout(r, 400));

      // 3. Open Finance Utilities Floating Window
      await send('Runtime.evaluate', {
        expression: `
          (() => {
            const financeBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Finance Tools') || b.title?.includes('Finance Utilities'));
            if (financeBtn) financeBtn.click();
          })()
        `
      });
      await new Promise(r => setTimeout(r, 600));

      const ss3 = await send('Page.captureScreenshot', { format: 'png' });
      const path3 = path.join(outputDir, `${res.name}-03-finance-tools-open.png`);
      fs.writeFileSync(path3, Buffer.from(ss3.data, 'base64'));
      console.log(` [✓] Captured: ${path.basename(path3)}`);

      const financeWindowCheck = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const titleEl = Array.from(document.querySelectorAll('span')).find(s => s.textContent?.includes('Finance Utility:'));
            const win = titleEl ? titleEl.closest('.modal-card-luxury') : null;
            if (!win) return { found: false };
            const rect = win.getBoundingClientRect();
            return {
              found: true,
              rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom },
              isWithinViewport: rect.left >= 0 && rect.top >= 0 && rect.right <= window.innerWidth && rect.bottom <= window.innerHeight,
              hasButtons: win.querySelectorAll('button').length
            };
          })()
        `,
        returnByValue: true
      });
      console.log('     Finance Window Metrics:', JSON.stringify(financeWindowCheck.result.value));

      // 4. Open Samsung Edge Shelf
      await send('Runtime.evaluate', {
        expression: `
          (() => {
            const edgeBtn = document.querySelector('[title*="Samsung Finance Utilities"]');
            if (edgeBtn) edgeBtn.click();
          })()
        `
      });
      await new Promise(r => setTimeout(r, 400));

      const ss4 = await send('Page.captureScreenshot', { format: 'png' });
      const path4 = path.join(outputDir, `${res.name}-04-samsung-edge-shelf.png`);
      fs.writeFileSync(path4, Buffer.from(ss4.data, 'base64'));
      console.log(` [✓] Captured: ${path.basename(path4)}`);

      ws.close();
    } catch (err) {
      console.error(`Error testing ${res.name}:`, err);
    } finally {
      chromeProc.kill();
      try {
        fs.rmSync(userDataDir, { recursive: true, force: true });
      } catch {}
    }
  }

  console.log('\n============================================');
  console.log('ALL RESOLUTION VERIFICATIONS COMPLETE!');
  console.log('Screenshots stored in:', outputDir);
  console.log('============================================');
}

run().catch(console.error);
