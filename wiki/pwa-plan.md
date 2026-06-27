# PWA Implementation Plan — pisilist

## Known Bug (Mobile APK — Do Not Fix Now)

**Bug:** On Android APK, the "Create Task" button is not visible on the CardDetail page. Tasks created by invited contributors are also not visible on mobile. Web version works fine.

**Suspected cause:** Layout overflow or platform-specific rendering in CardDetailScreen. The task input + button may be clipped below the fold on smaller mobile screens, or the FlatList/ScrollView nesting differs between web and native.

**Status:** Documented for future fix. Not blocking PWA work.

---

## Goal

Add Progressive Web App (PWA) support to the web version so users can:
- Install pisilist as an app on desktop and mobile browsers
- Get a native app-like experience (standalone window, home screen icon)
- Access the app offline (cached shell)

## Plan

### Step 1: Configure PWA Manifest in `app.json`

Add `web.manifest` config to `app.json`:
- `name`: "pisilist"
- `short_name`: "pisilist"
- `start_url`: "/"
- `display`: "standalone"
- `theme_color`: "#1a1a2e" (dark theme primary)
- `background_color`: "#1a1a2e"
- `icons`: 192x192 and 512x512 PNG icons

Expo auto-generates `manifest.json` and injects `<link rel="manifest">` into the web build from this config.

### Step 2: Generate PWA Icons

Create properly sized icons for PWA manifest:
- `assets/icon-192.png` (192x192)
- `assets/icon-512.png` (512x512)
- `assets/maskable-icon-512.png` (512x512 with safe zone padding)

Use the existing `assets/icon.png` as source and resize.

### Step 3: Create Service Worker

Create `public/service-worker.js`:
- Cache the app shell (HTML, JS, CSS, fonts)
- Use cache-first strategy for static assets
- Use network-first strategy for Firestore/API calls
- Register in `index.html` via a small inline script

**Note:** Expo's default web build doesn't include a service worker. We add it manually.

### Step 4: Update `index.html` for PWA Meta Tags

After `npx expo export:web` generates `dist/`, we need to ensure these meta tags exist:
- `<meta name="theme-color" content="#1a1a2e">`
- `<meta name="apple-mobile-web-app-capable" content="yes">`
- `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
- `<link rel="apple-touch-icon" href="/assets/icon-192.png">`

**Approach:** Add a post-build script that injects these into `dist/index.html` after export.

### Step 5: Build Web Version

```bash
npx expo export:web
```

This generates the production build in `dist/`. Verify:
- `dist/manifest.json` exists
- `dist/service-worker.js` exists
- `dist/index.html` has PWA meta tags

### Step 6: Test Locally

```bash
npx serve dist -l 3000
```

Test checklist:
- [ ] App loads at http://localhost:3000
- [ ] "Install app" prompt appears in Chrome (address bar icon)
- [ ] Manifest is valid (Chrome DevTools → Application → Manifest)
- [ ] Service worker registers (Chrome DevTools → Application → Service Workers)
- [ ] App runs in standalone mode when installed
- [ ] Offline: app shell loads without network

### Step 7: Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

Verify at the live URL:
- [ ] PWA install prompt works
- [ ] App installs and runs standalone
- [ ] Service worker caches assets

### Step 8: Update Wiki + Commit

- Update `wiki/report.md` with PWA implementation entry
- Update `wiki/state.md` with new status
- Ask user for commit permission
- Push to origin

## Files to Create/Modify

| File | Action |
|------|--------|
| `app.json` | Add `web.manifest` config |
| `assets/icon-192.png` | Create (resize from icon.png) |
| `assets/icon-512.png` | Create (resize from icon.png) |
| `public/service-worker.js` | Create |
| `scripts/inject-pwa-meta.js` | Create (post-build script) |
| `package.json` | Add `build:web` script |
| `wiki/report.md` | Append PWA entry |
| `wiki/state.md` | Update status |
| `wiki/pwa-plan.md` | This file (already exists) |

## Dependencies

No new npm packages needed. Everything uses:
- Expo's built-in web manifest generation (via `app.json` config)
- Native browser Service Worker API
- Firebase CLI for hosting deployment
