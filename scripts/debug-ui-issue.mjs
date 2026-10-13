// debug-ui-issue.mjs
import http from 'http';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.resolve('QA/debug_chrome_profile');
fs.mkdirSync(userDataDir, { recursive: true });

async function run() {
  console.log('Starting headless Chrome with remote debugging on port 9222...');
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1920,1080',
    'http://localhost:5174',
  ]);

  // Wait 2 seconds for Chrome to start
  await new Promise(r => setTimeout(r, 2000));

  // Connect to Chrome DevTools Protocol
  const versionRes = await fetch('http://127.0.0.1:9222/json/list');
  const tabs = await versionRes.json();
  const pageTab = tabs.find(t => t.type === 'page');

  if (!pageTab) {
    console.error('No page tab found in Chrome!');
    chromeProc.kill();
    return;
  }

  const wsUrl = pageTab.webSocketDebuggerUrl;
  console.log('Connecting to WebSocket:', wsUrl);

  const ws = new globalThis.WebSocket(wsUrl);

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
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
    } else if (msg.method === 'Runtime.exceptionThrown') {
      console.error('[BROWSER EXCEPTION]', msg.params.exceptionDetails);
    }
  });

  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  console.log('Connected to CDP.');

  await send('Runtime.enable');
  await send('Page.enable');

  // Wait 2 seconds for initial render
  await new Promise(r => setTimeout(r, 2000));

  // Take screenshot 1: initial
  const ss1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('QA/debug_screenshots/step1-initial.png', Buffer.from(ss1.data, 'base64'));
  console.log('Captured step1-initial.png');

  // Click Finance Tools button in sidebar
  console.log('Evaluating click on Finance Tools button...');
  const clickRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Finance Tools'));
        if (btn) {
          btn.click();
          return 'Clicked Finance Tools button in sidebar';
        }
        return 'Finance Tools button not found';
      })()
    `,
    returnByValue: true
  });
  console.log('Click result:', clickRes.result.value);

  // Wait 1 second
  await new Promise(r => setTimeout(r, 1000));

  // Take screenshot 2: after clicking finance tools
  const ss2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('QA/debug_screenshots/step2-after-finance-tools.png', Buffer.from(ss2.data, 'base64'));
  console.log('Captured step2-after-finance-tools.png');

  // Check DOM state of finance tools window and main container
  const evalState = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const main = document.querySelector('main');
        const mainRect = main ? main.getBoundingClientRect() : null;
        const allDivs = Array.from(document.querySelectorAll('*'));
        const matched = allDivs.filter(d => (d.textContent && d.textContent.includes('Finance Utility:')) || (d.className && typeof d.className === 'string' && d.className.includes('modal-card-luxury')));
        return {
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight,
          mainRect: mainRect ? { left: mainRect.left, top: mainRect.top, width: mainRect.width, right: mainRect.right } : null,
          matchedCount: matched.length,
          matched: matched.slice(0, 5).map(el => ({
            tag: el.tagName,
            id: el.id,
            className: el.className,
            rect: el.getBoundingClientRect(),
            parentTag: el.parentElement ? el.parentElement.tagName : null,
            parentClass: el.parentElement ? el.parentElement.className : null,
            computedStyle: {
              display: getComputedStyle(el).display,
              visibility: getComputedStyle(el).visibility,
              opacity: getComputedStyle(el).opacity,
              zIndex: getComputedStyle(el).zIndex,
              position: getComputedStyle(el).position,
              backgroundColor: getComputedStyle(el).backgroundColor,
              transform: getComputedStyle(el).transform,
            }
          }))
        };
      })()
    `,
    returnByValue: true
  });
  console.log('DOM Layout State:', JSON.stringify(evalState.result.value, null, 2));

  // Click Notification bell icon
  console.log('Evaluating click on Notification bell icon...');
  const bellClick = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const bellBtn = Array.from(document.querySelectorAll('button')).find(b => b.title && b.title.includes('Notification'));
        if (bellBtn) {
          bellBtn.click();
          return 'Clicked Notification Bell';
        }
        return 'Bell button not found';
      })()
    `,
    returnByValue: true
  });
  console.log('Bell click result:', bellClick.result.value);

  await new Promise(r => setTimeout(r, 1000));

  // Take screenshot 3: after clicking notification
  const ss3 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('QA/debug_screenshots/step3-after-notification.png', Buffer.from(ss3.data, 'base64'));
  console.log('Captured step3-after-notification.png');

  ws.close();
  chromeProc.kill();
  console.log('Done!');
}

run().catch(console.error);
