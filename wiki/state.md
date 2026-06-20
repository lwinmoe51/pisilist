# State — pisilist

> Last updated: 2026-06-20

## Completed

### Core Infrastructure
- ✅ Expo SDK 56 + React Native 0.85.3 + Firebase 11 project setup
- ✅ Firebase project `pisilist-app` provisioned (Firestore + Auth)
- ✅ Firestore security rules deployed (users, cards, tasks, invitations)
- ✅ Firestore composite indexes deployed
- ✅ Firestore query split (owned + collaborated) matching security rules
- ✅ Jest test suite — 133 tests, 9 suites, all passing
- ✅ TypeScript strict compilation clean

### Authentication
- ✅ Email/password sign-up (creates `users/{uid}` doc automatically)
- ✅ Email/password login with error mapping (5 error codes)
- ✅ Password reset via email link
- ✅ Sign out (cross-platform: `window.confirm` on web, `Alert.alert` on native)
- ✅ Auth-gated navigation (AuthStack ↔ AppStack)
- ✅ `onAuthStateChanged` listener in AuthContext

### Dashboard & Grid
- ✅ Masonry staggered grid (strict left-to-right dense packing per section)
- ✅ Responsive columns: 1 mobile, 2 tablet (600px+), 3 desktop (900px+), 4 large (1200px+)
- ✅ 16px gap between cards
- ✅ Section labels ("📌 Pinned" / "Others") as full-width headers above grids
- ✅ Client-side search filter
- ✅ PisiList logo in header
- ✅ Bell icon with pending invitation badge
- ✅ User avatar → Settings navigation

### Card System
- ✅ Card CRUD (create, update title, delete with confirmation)
- ✅ Card accent colors — 8 colors (light + dark), 🎨 picker popover
- ✅ Pin/Unpin with predictable sort lifecycle:
  - Pin: `updatedAt = now` → sorts to END of Pinned (ascending)
  - Unpin: `updatedAt = now` → sorts to TOP of Others (descending)
- ✅ Flat card design: 1px border, borderRadius 10, accent background
- ✅ Real task preview — live Firestore listeners show actual uncompleted task names
- ✅ Footer control strip: Pin toggle, 🎨 color picker, ⋮ ellipsis menu
- ✅ Ellipsis menu: Pin/Unpin + Delete Card (destructive)
- ✅ ConfirmModal for delete card + delete task

### Task System
- ✅ Task CRUD (create, toggle complete, delete)
- ✅ Inline assignee dropdown per task (collaborator picker)
- ✅ Inline reminder chips with timestamps + remove [✕]
- ✅ Inline DateTimePicker for adding reminders
- ✅ Checked items collapsible section
- ✅ Task count + completion progress display

### Collaboration
- ✅ Send invitation by email (verifies user exists)
- ✅ Accept invitation → atomic batch (invitation status + card collaborators)
- ✅ Decline invitation
- ✅ Real-time pending invitations listener
- ✅ Toast notification system (success/error/info, auto-dismiss)
- ✅ Shared card indicator ("↗ Shared with you") on dashboard
- ✅ Collaborator avatars on card detail

### Reminders
- ✅ Multi-reminder system per task
- ✅ Platform-aware: `expo-notifications` on Android/iOS, browser Notification API on web
- ✅ `setTimeout` + `new Notification()` fallback for web
- ✅ Cancel reminders (single + all for task)

### Theme & Design
- ✅ Dark mode with system preference detection + manual toggle
- ✅ 18 color tokens (light + dark palettes)
- ✅ 8 card accent colors (light + dark)
- ✅ AsyncStorage persistence for theme preference
- ✅ `boxShadow` everywhere (zero deprecated `shadow*` props)
- ✅ Keep-style visual language throughout

### Cross-Platform
- ✅ ConfirmModal component (replaces Alert.alert on web)
- ✅ Toast component (animated, auto-dismiss)
- ✅ `window.confirm` / `window.alert` on web, `Alert.alert` on native
- ✅ Platform-aware DateTimePicker (HTML5 inputs on web, native spinner on Android/iOS)
- ✅ WSL2 networking fix (`npm run web:wsl`)

### Deployment
- ✅ Firebase Hosting live at https://pisilist-app.web.app
- ✅ Firestore rules deployed and verified
- ✅ Console logging on all UI handlers + Firebase service functions

## In Progress
- None

## Pending

### High Priority
- [ ] **Mobile testing** — Test entire app on Android device (Expo Go or dev build)
- [ ] **Input validation** — Email format, password strength, required field checks
- [ ] **Error handling** — User-friendly error messages for all failure cases
- [ ] **Loading states** — Skeleton loaders for all data-fetching screens

### Medium Priority
- [ ] **User profile management** — Edit displayName, profile picture upload
- [ ] **Password change** — Allow logged-in users to change password
- [ ] **Email verification** — Send verification email on sign-up
- [ ] **User roles** — Owner vs collaborator permission levels in UI
- [ ] **Card sharing** — Share link or QR code for quick collaboration
- [ ] **Offline support** — Firestore offline persistence, sync indicator

### Low Priority
- [ ] **Push notifications on Android** — Dev build with expo-notifications
- [ ] **Card archiving** — Soft delete / archive cards
- [ ] **Task due dates** — Date-based task scheduling beyond reminders
- [ ] **Drag-and-drop reorder** — Manual task ordering within cards
- [ ] **Export data** — JSON/CSV export of cards and tasks
- [ ] **App store deployment** — Google Play Store + Apple App Store

## Blockers
- None

## Test Coverage

```
Test Suites: 9 passed, 9 total
Tests:       133 passed, 133 total

Services: 108 tests (auth: 25, cards: 38, users: 12, invitations: 15, notifications: 18)
Types: 7 tests
Config: 3 tests
Components: 13 tests (CardPreview: 100% coverage)
Contexts: 3 tests (AuthContext: 88% coverage)

Screens: 0% (require React Native Testing Library + Firebase mock setup)
```

## Key Commands

```bash
npm run web          # Expo dev server (local)
npm run web:wsl      # Expo dev server (WSL2 → Windows browser)
npm test             # Run Jest (133 tests)
npm run test:coverage # Jest + coverage report
npx tsc --noEmit     # TypeScript type-check
npx expo start       # Expo dev server (all platforms)
```

## Installed Plugins (5)
1. `firebase@claude-plugins-official` — Firestore, Auth, Cloud Functions, Security Rules
2. `github@claude-plugins-official` — Repo management, commits, PRs, issues
3. `context7@claude-plugins-official` — Library docs, wiki maintenance
4. `expo@claude-plugins-official` — Expo SDK 56 docs, build/deploy guidance
5. `frontend-design@claude-plugins-official` — UI/UX design patterns

## Project Skills (3)
- `code_review/SKILL.md` — Pre-land code review using context7 for API validation
- `documentation/SKILL.md` — Doc generation using context7 for API references
- `frontend-design` (plugin) — Scoped as `pisilist:frontend-design`
