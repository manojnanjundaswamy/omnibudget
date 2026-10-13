// scripts/inspect-dom.mjs
async function run() {
  const versionRes = await fetch('http://127.0.0.1:9222/json/list');
  const tabs = await versionRes.json();
  const pageTab = tabs.find(t => t.type === 'page');
  const ws = new globalThis.WebSocket(pageTab.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  let id = 1;
  const send = (method, params) => new Promise((resolve) => {
    const curId = id++;
    const listener = (event) => {
      const msg = JSON.parse(event.data.toString());
      if (msg.id === curId) {
        ws.removeEventListener('message', listener);
        resolve(msg.result);
      }
    };
    ws.addEventListener('message', listener);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      const edgeHandle = document.querySelector('[title*="Financial Utilities"]');
      const calcButtons = Array.from(document.querySelectorAll('button')).map(b => ({ text: b.textContent?.trim(), title: b.title }));
      const modals = Array.from(document.querySelectorAll('div')).filter(d => d.textContent?.includes('Scientific') || d.textContent?.includes('Finance Utility'));
      return {
        hasEdgeHandle: !!edgeHandle,
        edgeHandleRect: edgeHandle?.getBoundingClientRect(),
        calcButtons: calcButtons.filter(b => b.title?.includes('Finance') || b.title?.includes('Calculator') || b.text?.includes('Finance Tools')),
        modalsCount: modals.length,
        modalsInfo: modals.slice(0, 3).map(m => ({
          tag: m.tagName,
          className: m.className,
          rect: m.getBoundingClientRect(),
          style: {
            display: getComputedStyle(m).display,
            visibility: getComputedStyle(m).visibility,
            opacity: getComputedStyle(m).opacity,
            zIndex: getComputedStyle(m).zIndex,
            position: getComputedStyle(m).position
          }
        }))
      };
    })()`,
    returnByValue: true
  });
  console.log(JSON.stringify(res.result.value, null, 2));
  ws.close();
}

run().catch(console.error);
