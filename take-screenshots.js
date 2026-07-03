const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');
const path = require('path');

const SCREENSHOTS_DIR = '/mnt/c/Users/robot/VibeCodeTour/pisilist/screenshots';
const BASE_URL = 'http://localhost:8081';
const EMAIL = 'lwinmoe969786@gmail.com';
const PASSWORD = 'chitthu1500';

const PAGES = [
  { name: '01-login', path: '/' },
  { name: '02-signup', path: '/signup' },
  { name: '03-reset-password', path: '/reset-password' },
  { name: '04-dashboard', path: '/dashboard' },
  { name: '05-card-detail', path: '/card/demo-card-id' },
  { name: '06-invitations', path: '/invitations' },
  { name: '07-settings', path: '/settings' },
];

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

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = {};
  }
  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.on('open', resolve);
      this.ws.on('error', reject);
      this.ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.id && this.callbacks[msg.id]) {
          this.callbacks[msg.id](msg);
          delete this.callbacks[msg.id];
        }
      });
    });
  }
  send(method, params = {}, sessionId = null) {
    return new Promise((resolve) => {
      const id = this.id++;
      this.callbacks[id] = resolve;
      const msg = { id, method, params };
      if (sessionId) msg.sessionId = sessionId;
      this.ws.send(JSON.stringify(msg));
    });
  }
  close() { if (this.ws) this.ws.close(); }
}

async function main() {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  console.log('Connecting to Chrome...');
  const version = await fetchJSON('http://localhost:9222/json/version');
  const browser = new CDPClient(version.webSocketDebuggerUrl);
  await browser.connect();
  console.log('Connected.\n');

  const cdp = (method, params = {}, sid) => browser.send(method, params, sid);

  // Create tab and attach
  const { result: target } = await cdp('Target.createTarget', { url: BASE_URL });
  const { result: { sessionId: sid } } = await cdp('Target.attachToTarget', { targetId: target.targetId, flatten: true });

  await cdp('DOM.enable', {}, sid);
  await cdp('Runtime.enable', {}, sid);
  await cdp('Page.enable', {}, sid);
  await cdp('Emulation.setDeviceMetricsOverride', {
    width: 1280, height: 800, deviceScaleFactor: 1, mobile: false
  }, sid);

  // Wait for login page to load
  await sleep(4000);

  // --- Capture AUTH pages BEFORE login ---
  const authPages = [
    { name: '01-login', path: '/' },
    { name: '02-signup', path: '/signup' },
    { name: '03-reset-password', path: '/reset-password' },
  ];

  for (const page of authPages) {
    console.log(`📸 ${page.name}`);
    if (page.path !== '/') {
      await cdp('Page.navigate', { url: BASE_URL + page.path }, sid);
      await sleep(3000);
    }
    let ss = await cdp('Page.captureScreenshot', { format: 'png' }, sid);
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, `${page.name}.png`), Buffer.from(ss.result.data, 'base64'));
    console.log(`  ✅ Saved`);
  }

  // --- Now Login ---
  console.log('\n🔐 Logging in...');

  // Fill email
  await cdp('Runtime.evaluate', {
    expression: `
      (function() {
        const inputs = document.querySelectorAll('input[type="email"], input[name="email"], input[placeholder*="mail"], input[placeholder*="Mail"]');
        if (inputs.length > 0) {
          const el = inputs[0];
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(el, '${EMAIL}');
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          return 'email set';
        }
        return 'email input not found, inputs: ' + document.querySelectorAll('input').length;
      })()
    `
  }, sid);
  await sleep(300);

  // Fill password
  await cdp('Runtime.evaluate', {
    expression: `
      (function() {
        const inputs = document.querySelectorAll('input[type="password"]');
        if (inputs.length > 0) {
          const el = inputs[0];
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(el, '${PASSWORD}');
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          return 'password set';
        }
        return 'password input not found';
      })()
    `
  }, sid);
  await sleep(300);

  // Click login button (React Native web uses divs, not buttons)
  const clickResult = await cdp('Runtime.evaluate', {
    expression: `
      (function() {
        // Try divs with tabindex (React Native Pressable/TouchableOpacity)
        const divs = document.querySelectorAll('div[tabindex="0"]');
        for (const d of divs) {
          const text = d.textContent.toLowerCase().trim();
          if (text === 'log in' || text.includes('log in') || text.includes('sign in')) {
            d.click();
            return 'clicked div: ' + d.textContent.trim();
          }
        }
        // Fallback: try buttons
        const btns = document.querySelectorAll('button');
        for (const b of btns) {
          const t = b.textContent.toLowerCase().trim();
          if (t.includes('log in') || t.includes('sign in')) {
            b.click();
            return 'clicked button: ' + b.textContent.trim();
          }
        }
        return 'no login element found';
      })()
    `
  }, sid);
  console.log('  Button:', clickResult.result?.result?.value);

  // Wait for navigation after login
  console.log('  Waiting for redirect...');
  await sleep(8000);

  const urlAfter = await cdp('Runtime.evaluate', { expression: 'window.location.href' }, sid);
  console.log('  Current URL:', urlAfter.result?.result?.value);

  // --- Screenshot 4: Dashboard (post-login) ---
  console.log('\n📸 04-dashboard');
  ss = await cdp('Page.captureScreenshot', { format: 'png' }, sid);
  fs.writeFileSync(path.join(SCREENSHOTS_DIR, '04-dashboard.png'), Buffer.from(ss.result.data, 'base64'));
  console.log('  ✅ Saved');

  // --- Click card title to go to Card Detail ---
  console.log('\n📸 05-card-detail (clicking card title)');
  // Click on the card title "Card" - approximately at x=190, y=95
  await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: 190, y: 95, button: 'left', clickCount: 1 }, sid);
  await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 190, y: 95, button: 'left', clickCount: 1 }, sid);
  await sleep(4000);
  ss = await cdp('Page.captureScreenshot', { format: 'png' }, sid);
  fs.writeFileSync(path.join(SCREENSHOTS_DIR, '05-card-detail.png'), Buffer.from(ss.result.data, 'base64'));
  console.log('  ✅ Saved');

  // Go back to dashboard
  console.log('\n  Going back to dashboard...');
  await cdp('Page.navigate', { url: BASE_URL + '/dashboard' }, sid);
  await sleep(4000);

  // --- Click three-dot menu on card for Invitations ---
  console.log('\n📸 06-invitations (clicking card menu)');
  // Click three-dot menu (⋮) - approximately at x=310, y=95
  await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: 310, y: 95, button: 'left', clickCount: 1 }, sid);
  await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 310, y: 95, button: 'left', clickCount: 1 }, sid);
  await sleep(1500);

  // Look for "Invitations" or "Invite" in the menu and click it
  await cdp('Runtime.evaluate', {
    expression: `
      (function() {
        const divs = document.querySelectorAll('div[tabindex="0"], div[role="menuitem"], div[role="button"]');
        for (const d of divs) {
          const text = d.textContent.toLowerCase().trim();
          if (text.includes('invitation') || text.includes('invite') || text.includes('collabor')) {
            d.click();
            return 'clicked: ' + d.textContent.trim();
          }
        }
        // Try all clickable divs
        const allDivs = document.querySelectorAll('div');
        for (const d of allDivs) {
          const text = d.textContent.toLowerCase().trim();
          if ((text === 'invitations' || text === 'invite') && d.offsetParent !== null) {
            d.click();
            return 'clicked div: ' + d.textContent.trim();
          }
        }
        return 'no invitations option found';
      })()
    `
  }, sid);
  await sleep(3000);
  ss = await cdp('Page.captureScreenshot', { format: 'png' }, sid);
  fs.writeFileSync(path.join(SCREENSHOTS_DIR, '06-invitations.png'), Buffer.from(ss.result.data, 'base64'));
  console.log('  ✅ Saved');

  // Go back to dashboard
  console.log('\n  Going back to dashboard...');
  await cdp('Page.navigate', { url: BASE_URL + '/dashboard' }, sid);
  await sleep(4000);

  // --- Click avatar for Settings ---
  console.log('\n📸 07-settings (clicking avatar)');
  // Click avatar "L" in top right - approximately at x=1240, y=30
  await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: 1240, y: 30, button: 'left', clickCount: 1 }, sid);
  await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 1240, y: 30, button: 'left', clickCount: 1 }, sid);
  await sleep(1500);

  // Look for "Settings" option and click it
  await cdp('Runtime.evaluate', {
    expression: `
      (function() {
        const divs = document.querySelectorAll('div[tabindex="0"], div[role="menuitem"], div[role="button"]');
        for (const d of divs) {
          const text = d.textContent.toLowerCase().trim();
          if (text === 'settings' || text.includes('setting')) {
            d.click();
            return 'clicked: ' + d.textContent.trim();
          }
        }
        const allDivs = document.querySelectorAll('div');
        for (const d of allDivs) {
          const text = d.textContent.toLowerCase().trim();
          if (text === 'settings' && d.offsetParent !== null) {
            d.click();
            return 'clicked div: ' + d.textContent.trim();
          }
        }
        return 'no settings option found';
      })()
    `
  }, sid);
  await sleep(3000);
  ss = await cdp('Page.captureScreenshot', { format: 'png' }, sid);
  fs.writeFileSync(path.join(SCREENSHOTS_DIR, '07-settings.png'), Buffer.from(ss.result.data, 'base64'));
  console.log('  ✅ Saved');

  await cdp('Target.closeTarget', { targetId: target.targetId });
  browser.close();
  console.log('\n🎉 All done!');
}

main().catch(err => { console.error('Error:', err); process.exit(1); });
