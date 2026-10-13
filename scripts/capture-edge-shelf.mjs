// scripts/capture-edge-shelf.mjs
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.resolve('QA/temp_shelf_test');
fs.mkdirSync(userDataDir, { recursive: true });

async function run() {
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9227',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1920,1080',
    'http://localhost:5174',
  ]);

  await new Promise(r => setTimeout(r, 2200));
  const versionRes = await fetch('http://127.0.0.1:9227/json/list');
  const tabs = await versionRes.json();
  const pageTab = tabs.find(t => t.type === 'page');
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
  await new Promise(r => setTimeout(r, 1500));

  // Click Edge Handle
  const clickRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const handle = document.querySelector('[title*="Samsung Finance Utilities"]');
      if (handle) {
        handle.click();
        return true;
      }
      return false;
    })()`,
    returnByValue: true
  });
  console.log('Handle click result:', clickRes.result.value);
  await new Promise(r => setTimeout(r, 700));

  const ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('QA/evidence/resolutions/desktop-1920x1080-04-samsung-edge-shelf.png', Buffer.from(ss.data, 'base64'));
  console.log('Saved updated desktop-1920x1080-04-samsung-edge-shelf.png');

  ws.close();
  chromeProc.kill();
  try {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  } catch {}
}

run().catch(console.error);
