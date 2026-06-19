# Report — pisilist

## [2026-06-19] Job: Clean Remaining shadow* Deprecation Warnings

**Status:** ✅ Success
**Summary:** Replaced remaining `shadowColor`/`shadowOffset`/`shadowOpacity`/`shadowRadius` props with `boxShadow` in `DashboardScreen.tsx` FAB button. Zero shadow* deprecation warnings now.

### Changes
- `src/screens/DashboardScreen.tsx` — FAB button style: `shadow*` → `boxShadow: '0 4px 8px rgba(26,115,232,0.35)'`
- Verified no remaining `shadow*` usage in any `.tsx`/`.ts` source file.

### Test Results
All 55 tests pass (9 suites).

### Errors
None.

---

## [2026-06-19] Job: Firestore Composite Indexes for Card Queries

**Status:** ✅ Success
**Summary:** Added composite indexes required by `ownedCardsQuery` and `collaboratedCardsQuery` to `firestore.indexes.json` and deployed to pisilist-app.

### Changes
- `firestore.indexes.json` — Added two composite indexes on `cards` collection:
  - `collaborators` (ARRAY_CONTAINS) + `updatedAt` (DESC)
  - `ownerId` (ASC) + `updatedAt` (DESC)
- Deployed via `firebase deploy --only firestore`

### Why
The new query split (`ownedCardsQuery` / `collaboratedCardsQuery`) uses `where` + `orderBy` combinations that Firestore needs composite indexes for. Without them, the query returns: "The query requires an index."

### Test Results
All 55 tests pass (9 suites).

### Errors
None. Indexes may take 2-5 minutes to build before the app queries work.

---

## [2026-06-19] Job: Firestore Query Fix — Two Queries Matching Security Rules

**Status:** ✅ Success
**Summary:** Fixed "Missing or insufficient permissions" on Dashboard by splitting card query into two queries that each match the Firestore security rules.

### Root Cause
`cardsQuery(uid)` queried ALL cards with only `orderBy('updatedAt', 'desc')` — no `where` clause. Firestore security rules are **not filters** — the query itself must only ask for documents the rules allow. Since `canReadCard` checks `ownerId == uid` OR `uid in collaborators`, a query that asks for all cards is rejected entirely.

### Changes
- `src/services/cards.ts`: Replaced single `cardsQuery()` with `ownedCardsQuery(uid)` (where ownerId == uid) and `collaboratedCardsQuery(uid)` (where array-contains collaborators, uid). Added `where` to `firebase/firestore` imports.
- `src/contexts/CardsContext.tsx`: Runs two `onSnapshot` listeners, merges + deduplicates into one sorted card list. Each query matches security rules independently — no more permission errors.

### Test Results
All 55 tests pass (9 suites). No regressions.

### Errors
None.

---

## [2026-06-19] Job: Web Launch Fixes — Auth Error Mapping + CardPreview Shadow

**Status:** ✅ Success
**Summary:** Fixed Firebase 400 error messaging and React Native Web deprecation warning for shadow* props.

### Changes
- Added `auth/operation-not-allowed` error mapping in `src/services/auth.ts` (clarifies Email/Password must be enabled in Firebase Console)
- Changed default error fallback to include error code: `` `[${code}] ${message}` `` (previously swallowed code)
- Replaced deprecated `shadowColor`/`shadowOffset`/`shadowOpacity`/`shadowRadius` with `boxShadow` in `src/components/CardPreview.tsx` (React Native Web `shadow*` deprecation)

### Test Results
All 55 tests pass (9 suites). No regressions.

### Errors
None.

---

## [2026-06-19] Job: Project Initialization

**Status:** ✅ Success
**Summary:** Initialized Expo SDK 56 TypeScript project with Firebase SDK 11.

### Changes
- Created Expo project via `create-expo-app` with blank-typescript template
- Added `firebase` dependency (^11.0.0)
- Created `.claude/` agents: wiki_manager, git_manager, test_manager
- Created `.claude/` skills: code_review, documentation
- Created `.mcp.json` MCP configuration
- Created `wiki/` directory
- Added `.gitignore` (Expo + Firebase)
- Renamed project from `pisilist_expo` to `pisilist` in `package.json` and `app.json`
- Installed 532 npm packages

### Dependencies
- expo: 56.0.12
- react: 19.2.3
- react-native: 0.85.3
- firebase: 11.x
- typescript: 6.0.3

### Errors
None.

### Test Results
N/A — no tests yet.

---

## [2026-06-19] Job: Firebase Auth Implementation

**Status:** ✅ Success
**Summary:** Set up Firebase Auth (email/password) with login, sign-up, and password reset flow. Wired up React Navigation with auth-gated routing.

### Changes
- Installed `@react-navigation/native`, `@react-navigation/native-stack`, `react-native-screens`, `react-native-safe-area-context`
- Created `src/config/firebase.ts` — Firebase app init with project `aibaydin-f273e` config
- Created `src/services/auth.ts` — Auth service functions (signUp, signIn, resetPassword, logOut) with error mapping
- Created `src/types/index.ts` — Shared TypeScript types (Card, Task, Reminder, Invitation, AppUser)
- Created `src/contexts/AuthContext.tsx` — Auth state provider with `onAuthStateChanged` listener
- Created `src/screens/LoginScreen.tsx` — Email/password login form
- Created `src/screens/SignUpScreen.tsx` — Registration form with confirm password
- Created `src/screens/ResetPasswordScreen.tsx` — Password reset request → confirmation UI
- Created `src/screens/DashboardScreen.tsx` — Welcome view with sign-out, placeholder for card grid
- Created `src/navigation/AppNavigator.tsx` — Stack navigator: unauthenticated → AuthStack (Login/SignUp/ResetPassword), authenticated → AppStack (Dashboard)
- Updated `App.tsx` — Wraps app in SafeAreaProvider → AuthProvider → NavigationContainer → RootNavigator

### Architecture
```
App.tsx → AuthProvider → NavigationContainer → RootNavigator
  ├── [loading] → ActivityIndicator spinner
  ├── [unauthenticated] → AuthStack
  │   ├── LoginScreen
  │   ├── SignUpScreen
  │   └── ResetPasswordScreen
  └── [authenticated] → AppStack
      └── DashboardScreen (placeholder)
```

### Errors
None. TypeScript compiles cleanly (`npx tsc --noEmit`).

---

## [2026-06-19] Job: Card & Task CRUD + Google Keep Grid

**Status:** ✅ Success
**Summary:** Implemented Firestore-backed card and task management with real-time sync, Google Keep-style 2-column grid on dashboard, and full card detail view.

### Changes
- Created `src/services/cards.ts` — Firestore CRUD for cards and tasks subcollection with batch operations and denormalized counts
- Created `src/contexts/CardsContext.tsx` — Real-time `onSnapshot` listener providing live card list
- Created `src/components/CardPreview.tsx` — Grid card preview component (title, task counts, collaborator badge)
- Rewrote `DashboardScreen.tsx` — Google Keep-style 2-column card grid with pinned/others sections, FAB to create cards, modal for card title input
- Created `CardDetailScreen.tsx` — Full card view with editable title, task list (toggle/delete), add task input, collapsible checked items group
- Updated `AppNavigator.tsx` — Added CardDetail route with cardId param
- Updated `App.tsx` — Wrapped app in CardsProvider (inside AuthProvider so it has user context)

### Architecture
```
App.tsx → AuthProvider → CardsProvider → NavigationContainer → RootNavigator
  └── [authenticated] → AppStack
      ├── Dashboard — 2-col grid (pinned/others), FAB, create modal
      └── CardDetail/{cardId} — tasks list, toggle, add, delete, checked items group

Data flow:
  Firestore onSnapshot (cardsQuery)
    → CardsContext (cards: Card[])
      → DashboardScreen renders CardPreview grid
        → Tap → CardDetailScreen
          → Firestore onSnapshot (tasksQuery)
            → renders TaskRow list
```

### Errors
None. TypeScript compiles cleanly (`npx tsc --noEmit`).

---

## [2026-06-19] Job: Collaboration + Multi-Reminder System

**Status:** ✅ Success
**Summary:** Implemented invitation-based collaboration with accept/decline, granular per-task assignment, and multi-reminder scheduling via expo-notifications.

### Changes
- Installed `expo-notifications` and `@react-native-community/datetimepicker`
- Created services: users.ts, invitations.ts, notifications.ts
- Created context: InvitationsContext.tsx
- Created screen: InvitationsScreen.tsx (accept/decline UI)
- Created components: AssigneePicker.tsx, ReminderModal.tsx
- Modified auth.ts — auto-create users/{uid} doc on signup
- Modified cards.ts — addCollaborator, updateTaskReminders
- Modified CardsContext.tsx — include collaborated cards (client-side filter)
- Modified CardPreview.tsx — "Shared with you" indicator
- Modified CardDetailScreen.tsx — invite modal, assignee picker, reminder modal, collaborator avatars
- Modified DashboardScreen.tsx — bell badge for pending invitations
- Modified AppNavigator.tsx — Invitations route
- Modified App.tsx — InvitationsProvider, setupNotifications on mount

### Errors
None. TypeScript compiles cleanly.

---

## [2026-06-19] Job: Firebase Project + Security Rules + Test Suite

**Status:** ✅ Success
**Summary:** Created new Firebase project "pisilist-app", deployed Firestore security rules and indexes, set up Jest test suite with 22 passing tests.

### Firestore rules
- `firestore.rules` — Access control for users, cards, tasks, invitations collections
- `firestore.indexes.json` — Composite index on invitations (toEmail + status + createdAt)
- Deployed to `pisilist-app` project with zero compilation warnings

### Test suite
- **22 tests, 4 suites, all passing**
- `src/__tests__/services/auth.test.ts` (5 tests) — AuthError, signUp, signIn, resetPassword, logOut
- `src/__tests__/services/cards.test.ts` (5 tests) — docToCard, docToTask with full field coverage + edge cases
- `src/__tests__/services/users.test.ts` (5 tests) — All user service exports verified
- `src/__tests__/types/types.test.ts` (7 tests) — Structural type checks for Card, Task, Reminder, Invitation, AppUser
- Firebase mocked via `__mocks__/` for pure unit testing without network

### Commands
- `npm test` — Run all tests
- `npm run test:coverage` — Run with coverage report

### Errors
None. Rules compiled cleanly, all 22 tests pass.

---

## [2026-06-19] Job: Component & Context Tests (Coverage from 7% → 16%)

**Status:** ✅ Success
**Summary:** Added 33 new tests across 5 new test suites. Coverage improved from 7.6% to 16.2%. CardPreview component reaches 100% coverage.

### New Test Suites (5)

| Suite | Tests | Coverage |
|-------|-------|----------|
| `config/firebase.test.ts` | 3 | Config exports verified (83% stmts) |
| `services/notifications.test.ts` | 7 | scheduleReminder, cancelReminder, setupNotifications (74% stmts) |
| `services/invitations.test.ts` | 6 | sendInvitation validation, accept, decline, onPendingInvitations (78% stmts) |
| `components/CardPreview.test.tsx` | 13 | All rendering paths: title, counts, pinned, shared, collab badge, onPress (100% stmts) |
| `contexts/AuthContext.test.tsx` | 3 | Provider rendering, default state, useAuth defaults (87% stmts) |

### Key Changes
- Added `expo-notifications` mock (`__mocks__/expo-notifications.ts`) to jest.config.js moduleNameMapper
- Fixed `@testing-library/react-native` v14 async render (await render())
- Raised coverage thresholds: stmts 5→15%, branches 5→10%, funcs 5→12%, lines 5→15%

### Services coverage (improved)
- `invitations.ts`: 0% → 78%
- `notifications.ts`: 0% → 74%
- `auth.ts`: 73% (unchanged, already solid)
- `users.ts`: 73% (unchanged)
- `cards.ts`: 16% (unchanged, CRUD needs integration tests)

### Components coverage (new)
- `CardPreview.tsx`: 100% stmts, branches, funcs, lines
- `AssigneePicker.tsx`: 0% (not yet tested)
- `ReminderModal.tsx`: 0% (not yet tested)

### Contexts coverage (new)
- `AuthContext.tsx`: 87.5% stmts (loading state path covered)

### Errors
None. All 55 tests pass. Coverage thresholds met.
