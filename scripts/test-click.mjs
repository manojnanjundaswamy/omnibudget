// test-click.mjs
import { spawn } from 'child_process';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.resolve('QA/debug_chrome_profile');

async function test() {
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1920,1080',
    'http://localhost:5174',
  ]);
  await new Promise(r => setTimeout(r, 2000));
  const tabs = await (await fetch('http://127.0.0.1:9222/json/list')).json();
  const ws = new globalThis.WebSocket(tabs[0].webSocketDebuggerUrl);
  let id = 1;
  const send = (method, params = {}) => new Promise(res => {
    const curId = id++;
    const handler = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id === curId) {
        ws.removeEventListener('message', handler);
        res(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });
  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  await send('Runtime.enable');
  await new Promise(r => setTimeout(r, 1500));

  const result = await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const ftBtn = btns.find(b => b.textContent && b.textContent.includes('Finance Tools'));
      if (!ftBtn) return { error: 'Button not found', allButtons: btns.map(b => b.textContent?.trim() || b.title) };
      ftBtn.click();
      return { success: true, text: ftBtn.textContent };
    })()`,
    returnByValue: true
  });
  console.log('Click result:', result.result.value);

  await new Promise(r => setTimeout(r, 500));

  const afterClick = await send('Runtime.evaluate', {
    expression: `(() => {
      const divs = Array.from(document.querySelectorAll('*'));
      const matched = divs.filter(d => (d.textContent && d.textContent.includes('Finance Utility:')));
      return matched.map(m => ({
        tag: m.tagName,
        className: m.className,
        rect: m.getBoundingClientRect(),
        style: m.getAttribute('style'),
      }));
    })()`,
    returnByValue: true
  });
  console.log('After click:', JSON.stringify(afterClick.result.value, null, 2));

  ws.close();
  chromeProc.kill();
}
test().catch(console.error);
