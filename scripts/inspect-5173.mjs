// scripts/inspect-5173.mjs
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.resolve('QA/temp_5173_profile');
fs.mkdirSync(userDataDir, { recursive: true });

async function run() {
  console.log('Connecting to localhost:5173...');
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9229',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1920,1080',
    'http://localhost:5173',
  ]);

  await new Promise(r => setTimeout(r, 2500));
  const versionRes = await fetch('http://127.0.0.1:9229/json/list');
  const tabs = await versionRes.json();
  const pageTab = tabs.find(t => t.type === 'page');

  if (!pageTab) {
    console.error('No tab found!');
    chromeProc.kill();
    return;
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

  await new Promise(r => setTimeout(r, 2000));

  // Take screenshot of 5173 initial
  const ss1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('QA/debug_screenshots/localhost-5173-initial.png', Buffer.from(ss1.data, 'base64'));
  console.log('Captured QA/debug_screenshots/localhost-5173-initial.png');

  // Inspect DOM of 5173: buttons, right menu, sidebars, utilities
  const info = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const allButtons = Array.from(document.querySelectorAll('button')).map(b => ({
          text: b.textContent?.trim().replace(/\\s+/g, ' '),
          title: b.title,
          ariaLabel: b.getAttribute('aria-label'),
          className: b.className,
          rect: b.getBoundingClientRect()
        }));

        const rightElements = Array.from(document.querySelectorAll('*')).filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.right >= window.innerWidth - 60 && rect.width > 0 && rect.height > 20;
        }).map(el => ({
          tag: el.tagName,
          text: el.textContent?.trim().slice(0, 100),
          className: el.className,
          rect: el.getBoundingClientRect()
        }));

        const navs = Array.from(document.querySelectorAll('nav, aside, header')).map(n => ({
          tag: n.tagName,
          rect: n.getBoundingClientRect(),
          className: n.className
        }));

        return {
          title: document.title,
          allButtons: allButtons.slice(0, 30),
          rightElements: rightElements.slice(0, 20),
          navs,
        };
      })()
    `,
    returnByValue: true
  });

  console.log('5173 Inspection:', JSON.stringify(info.result.value, null, 2));

  // Try to find and click right-side menu on 5173 if present
  const clickRightRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        // Look for buttons on the right side
        const rightBtns = Array.from(document.querySelectorAll('button, div[role="button"], [class*="edge"], [class*="sidebar"], [class*="drawer"]'))
          .filter(el => {
            const r = el.getBoundingClientRect();
            return r.right >= window.innerWidth - 80 && r.width > 15;
          });
        if (rightBtns.length > 0) {
          rightBtns[0].click();
          return { clicked: true, text: rightBtns[0].textContent, tag: rightBtns[0].tagName, className: rightBtns[0].className };
        }
        return { clicked: false, count: rightBtns.length };
      })()
    `,
    returnByValue: true
  });
  console.log('Click right result on 5173:', clickRightRes.result.value);

  await new Promise(r => setTimeout(r, 1000));
  const ss2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('QA/debug_screenshots/localhost-5173-after-click.png', Buffer.from(ss2.data, 'base64'));
  console.log('Captured QA/debug_screenshots/localhost-5173-after-click.png');

  ws.close();
  chromeProc.kill();
  try {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  } catch {}
}

run().catch(console.error);
