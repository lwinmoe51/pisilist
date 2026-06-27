#!/usr/bin/env node
/**
 * Post-build script: injects PWA meta tags and service worker registration
 * into dist/index.html after `npx expo export:web`.
 *
 * Usage: node scripts/inject-pwa-meta.js
 */

const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
const ASSETS = path.join(__dirname, '..', 'assets');
const INDEX = path.join(DIST, 'index.html');
const SW_SRC = path.join(__dirname, '..', 'public', 'service-worker.js');
const SW_DEST = path.join(DIST, 'service-worker.js');
const DIST_ASSETS = path.join(DIST, 'assets');

// 0. Ensure dist/assets exists
if (!fs.existsSync(DIST_ASSETS)) {
  fs.mkdirSync(DIST_ASSETS, { recursive: true });
}

// 0a. Copy PWA icon assets into dist/assets/
const ICON_FILES = ['icon-192.png', 'icon-512.png', 'maskable-icon-512.png'];
ICON_FILES.forEach((file) => {
  const src = path.join(ASSETS, file);
  const dest = path.join(DIST_ASSETS, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✓ Copied ${file} → dist/assets/`);
  }
});

// 0b. Generate manifest.json in dist/
const manifest = {
  name: 'pisilist',
  short_name: 'pisilist',
  description: 'Collaborative to-do list with shared cards and reminders',
  start_url: '/',
  display: 'standalone',
  orientation: 'portrait',
  theme_color: '#1a1a2e',
  background_color: '#1a1a2e',
  icons: [
    { src: '/assets/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/assets/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/assets/maskable-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};
fs.writeFileSync(path.join(DIST, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log('✓ Generated manifest.json');

// 1. Copy service worker into dist/
if (fs.existsSync(SW_SRC)) {
  fs.copyFileSync(SW_SRC, SW_DEST);
  console.log('✓ Copied service-worker.js → dist/');
} else {
  console.error('✗ service-worker.js not found in public/');
  process.exit(1);
}

// 2. Inject meta tags + SW registration into index.html
if (!fs.existsSync(INDEX)) {
  console.error('✗ dist/index.html not found. Run `npx expo export:web` first.');
  process.exit(1);
}

let html = fs.readFileSync(INDEX, 'utf-8');

const META_TAGS = `
    <meta name="theme-color" content="#1a1a2e" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <link rel="apple-touch-icon" href="/assets/icon-192.png" />`;

const SW_REGISTRATION = `
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
          navigator.serviceWorker.register('/service-worker.js');
        });
      }
    </script>`;

// Inject manifest link if not present
if (!html.includes('manifest.json')) {
  html = html.replace('</head>', '    <link rel="manifest" href="/manifest.json">\n  </head>');
  console.log('✓ Injected manifest link');
}

// Inject apple meta tags before </head> if not already present
if (!html.includes('apple-mobile-web-app-capable')) {
  const appleMeta = `    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <link rel="apple-touch-icon" href="/assets/icon-192.png" />`;
  html = html.replace('</head>', appleMeta + '\n  </head>');
  console.log('✓ Injected Apple PWA meta tags');
}

// Inject SW registration before </body> if not already present
if (!html.includes('serviceWorker')) {
  html = html.replace('</body>', SW_REGISTRATION + '\n  </body>');
  console.log('✓ Injected service worker registration');
}

fs.writeFileSync(INDEX, html);
console.log('✓ dist/index.html updated');
console.log('\nPWA post-build complete!');
