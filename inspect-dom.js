const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

class CDP {
  constructor(ws) { this.ws = null; this.url = ws; this.id = 1; this.cb = {}; }
  connect() {
    return new Promise((res, rej) => {
      this.ws = new WebSocket(this.url);
      this.ws.on('open', res);
      this.ws.on('error', rej);
      this.ws.on('message', d => {
        const m = JSON.parse(d.toString());
        if (m.id && this.cb[m.id]) { this.cb[m.id](m); delete this.cb[m.id]; }
      });
    });
  }
  send(method, params = {}, sid) {
    return new Promise(r => {
      const id = this.id++;
      this.cb[id] = r;
      const msg = { id, method, params };
      if (sid) msg.sessionId = sid;
      this.ws.send(JSON.stringify(msg));
    });
  }
  close() { this.ws.close(); }
}

async function main() {
  const v = await fetchJSON('http://localhost:9222/json/version');
  const c = new CDP(v.webSocketDebuggerUrl);
  await c.connect();

  const { result: t } = await c.send('Target.createTarget', { url: 'http://localhost:8081' });
  const { result: { sessionId: s } } = await c.send('Target.attachToTarget', { targetId: t.targetId, flatten: true });

  await c.send('DOM.enable', {}, s);
  await c.send('Runtime.enable', {}, s);
  await c.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false }, s);

  await sleep(5000);

  // Dump full HTML
  const html = await c.send('Runtime.evaluate', { expression: 'document.body.innerHTML.substring(0, 5000)' }, s);
  console.log('=== PAGE HTML ===');
  console.log(html.result?.result?.value);

  // Find all inputs
  const inputs = await c.send('Runtime.evaluate', {
    expression: `JSON.stringify(Array.from(document.querySelectorAll('input, button, a, [role="button"]')).map(e => ({
      tag: e.tagName,
      type: e.type || '',
      text: e.textContent?.trim().substring(0, 50),
      placeholder: e.placeholder || '',
      name: e.name || '',
      id: e.id || '',
      role: e.getAttribute('role') || '',
      href: e.href || ''
    })))`
  }, s);
  console.log('\n=== INTERACTIVE ELEMENTS ===');
  console.log(inputs.result?.result?.value);

  c.close();
}

main().catch(e => { console.error(e); process.exit(1); });
