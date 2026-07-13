# Code Flowchart — pisilist

> Last updated: 2026-06-20

## Project — pisilist-app (Firebase)

- **Project ID:** pisilist-app
- **Web App:** PisiList Web (1:579611680236:web:3ca7f2cf07be57ab0634c9)
- **Hosting:** https://pisilist-app.web.app
- **Console:** https://console.firebase.google.com/project/pisilist-app/overview

## Directory Structure

```
pisilist/
├── App.tsx                                  # SafeAreaProvider → ThemeProvider → AuthProvider → CardsProvider → InvitationsProvider → NavigationContainer
├── index.ts                                 # registerRootComponent(App)
├── firebase.json                            # Firestore rules + indexes + hosting config
├── firestore.rules                          # Access rules: users, cards (with invitee self-add), tasks, invitations
├── firestore.indexes.json                   # Composite indexes (cards: owner/collab, invitations: toEmail+status+createdAt)
├── jest.config.js                           # Jest preset (jest-expo), Firebase mocks, coverage thresholds
├── .mcp.json                                # MCP servers: firebase, github, context7
├── src/
│   ├── config/
│   │   └── firebase.ts                      # Firebase init (pisilist-app), exports auth & db
│   ├── services/
│   │   ├── auth.ts                          # signUp, signIn, resetPassword, logOut (with error mapping)
│   │   ├── cards.ts                         # Card & Task CRUD, updateCardCosmetic, batch ops, docToCard/docToTask
│   │   ├── users.ts                         # upsertUser, findUserByEmail, getUserByUid, getUsersByUids
│   │   ├── invitations.ts                   # sendInvitation, acceptInvitation (atomic batch), declineInvitation, onPendingInvitations
│   │   ├── notifications.ts                 # Platform-aware: expo-notifications (native) + setTimeout/browser Notification (web)
│   │   └── notificationSync.ts              # Sync engine: clears stale timers, re-schedules future reminders from Firestore snapshots
│   ├── contexts/
│   │   ├── AuthContext.tsx                   # AuthProvider + useAuth (onAuthStateChanged)
│   │   ├── CardsContext.tsx                  # CardsProvider + useCards (dual onSnapshot, pinned ascending, others descending)
│   │   ├── InvitationsContext.tsx            # InvitationsProvider + useInvitations (onPendingInvitations)
│   │   └── NotificationSyncContext.tsx       # NotificationSyncProvider: per-card task listeners → syncLocalNotifications
│   ├── components/
│   │   ├── CardPreview.tsx                  # Masonry card: flat design, 1px border, accent color, footer strip (pin 🎨 ⋮), task preview, ellipsis menu, color popover
│   │   ├── AssigneePicker.tsx               # Bottom sheet: pick collaborator for per-task assignment
│   │   ├── ConfirmModal.tsx                 # Cross-platform confirmation modal (window.confirm on web, Alert.alert on native)
│   │   ├── DateTimePicker.tsx               # Platform-aware: HTML5 inputs on web, native spinner on Android/iOS
│   │   ├── ReminderModal.tsx                # DateTimePicker wrapper: add/remove per-task reminders
│   │   └── Toast.tsx                        # Animated toast notification (success/error/info, auto-dismiss 3s)
│   ├── screens/
│   │   ├── LoginScreen.tsx                  # Email/password login form (shadow inputs, web-compatible alerts)
│   │   ├── SignUpScreen.tsx                 # Registration form with confirm password (web-compatible alerts)
│   │   ├── ResetPasswordScreen.tsx          # Password reset request → confirmation UI (web-compatible alerts)
│   │   ├── DashboardScreen.tsx              # Masonry grid (1-4 cols), section labels, task listeners, card actions, toast feedback
│   │   ├── CardDetailScreen.tsx             # Full card: title, inline assignee, inline reminders, invite modal, toast feedback
│   │   ├── InvitationsScreen.tsx            # Pending invitations: accept/decline with toast feedback
│   │   └── SettingsScreen.tsx               # User profile, dark mode toggle, sign out
│   ├── navigation/
│   │   └── AppNavigator.tsx                 # RootNavigator: AuthStack ↔ AppStack (Dashboard, CardDetail, Invitations, Settings)
│   ├── theme/
│   │   ├── colors.ts                        # AppColors interface + lightColors/darkColors (18 tokens) + CARD_ACCENT_COLORS (8 per theme)
│   │   └── ThemeContext.tsx                 # ThemeProvider + useTheme (useColorScheme, AsyncStorage persistence)
│   ├── types/
│   │   └── index.ts                         # Card (with color field), Task, Reminder, Invitation, AppUser
│   └── __tests__/
│       ├── __mocks__/                       # Firebase module mocks (auth, app, firestore, async-storage, expo-notifications)
│       ├── services/
│       │   ├── auth.test.ts                 # 25 API contract tests
│       │   ├── cards.test.ts                # 38 API contract tests
│       │   ├── users.test.ts                # 12 API contract tests
│       │   ├── invitations.test.ts          # 15 API contract tests
│       │   └── notifications.test.ts        # 18 API contract tests
│       ├── types/
│       │   └── types.test.ts                # 7 structural type checks
│       ├── config/
│       │   └── firebase.test.ts             # 3 Firebase init export checks
│       ├── contexts/
│       │   └── AuthContext.test.tsx          # 3 AuthContext rendering tests
│       └── components/
│           └── CardPreview.test.tsx          # 13 rendering path tests (100% coverage)
└── wiki/
    ├── report.md                            # Job-by-job log (all sessions)
    ├── state.md                             # Current project state + roadmap
    ├── code_flowchart.md                    # This file
    ├── plan_ui_layout_rewrite.md            # Keep-style UI rewrite plan
    ├── plan_api_tests.md                    # API contract test plan
    └── plan_ui_overhaul.md                  # Theme + responsive + DateTimePicker plan
```

## App Component Tree

```
App.tsx
  └── SafeAreaProvider
      └── ThemeProvider (useColorScheme + AsyncStorage persistence)
          └── AuthProvider (onAuthStateChanged)
              └── CardsProvider (dual onSnapshot: owned + collaborated, sorted: pinned asc, others desc)
                  └── InvitationsProvider (onPendingInvitations real-time)
                      └── NotificationSyncProvider (per-card task onSnapshot → syncLocalNotifications)
                          └── NavigationContainer
                          └── RootNavigator (AppNavigator.tsx)
                              ├── [unauthenticated] AuthStack
                              │   ├── LoginScreen
                              │   ├── SignUpScreen
                              │   └── ResetPasswordScreen
                              └── [authenticated] AppStack
                                  ├── DashboardScreen (masonry grid + search + bell + avatar + logo)
                                  ├── CardDetail/{cardId} (tasks + invite + assign + reminders)
                                  ├── Invitations (accept/decline + toast)
                                  └── Settings (profile + dark mode + sign out)
```

## Data Flow

```
Firebase Auth                          Firestore
  onAuthStateChanged                     onSnapshot (ownedCardsQuery: where ownerId==uid)
       |                                 onSnapshot (collaboratedCardsQuery: where collaborators array-contains uid)
       v                                          |
  AuthContext (user: AppUser | null)              v
       |                                 CardsContext (cards: merged, deduped, sorted)
       |                                   pinned: ascending by updatedAt (oldest first)
       |                                   others: descending by updatedAt (newest first)
       |                                          |
       ├──────────> AppNavigator <────────────────┤
       |            (auth gating)                  |
       |                                           v
       |                                   DashboardScreen
       |                                     masonry grid (1-4 columns)
       |                                     real-time task listeners per card
       |                                     section labels (📌 Pinned / Others)
       |                                     search filter (client-side)
       |                                       |
       |                                       v
       |                                   CardPreview
       |                                     flat design (1px border, accent color)
       |                                     task preview (actual uncompleted names)
       |                                     footer: pin toggle, 🎨 color picker, ⋮ menu
       |                                       |
       |        onPress(cardId) ───────────────┘
       v
  CardDetailScreen
    tasksQuery onSnapshot (orderBy order)
    inline assignee dropdown (per task)
    inline reminder chips with timestamps + [✕] remove
    inline DateTimePicker (+ Add Reminder)
    invite collaborator modal
    confirm modal (delete card / delete task)
    toast notifications (success/error)
```

## Theme System (18 Color Tokens + 8 Accent Colors)

```
AppColors interface (src/theme/colors.ts)
  │
  ├── lightColors              ├── darkColors
  │   background: '#f5f5f5'   │   background: '#121212'
  │   surface: '#ffffff'      │   surface: '#1e1e1e'
  │   text: '#1a1a2e'         │   text: '#e0e0e0'
  │   subtext: '#666666'      │   subtext: '#aaaaaa'
  │   border: '#e0e0e0'       │   border: '#333333'
  │   primary: '#1a73e8'      │   primary: '#4da3ff'
  │   danger: '#e53935'       │   danger: '#ef5350'
  │   warning: '#f9a825'      │   warning: '#ffd54f'
  │   muted: '#f5f5f5'        │   muted: '#2a2a2a'
  │   placeholder: '#999999'  │   placeholder: '#777777'
  │   headerBg: '#ffffff'     │   headerBg: '#1a1a1a'
  │   modalBg: 'rgba(...)'    │   modalBg: 'rgba(...)'
  │   inputBg: '#ffffff'      │   inputBg: '#2a2a2a'
  │   overlayBg: 'rgba(...)'  │   overlayBg: 'rgba(...)'
  │   cardShadow: '0 1px...'  │   cardShadow: '0 1px...'
  │   headerShadow: '0 1px...'│   headerShadow: '0 1px...'
  │   checkboxBorder: '#c4c4' │   checkboxBorder: '#555'
  │   chipBg: '#f0f0f0'       │   chipBg: '#333333'

CARD_ACCENT_COLORS (src/theme/colors.ts)
  null (default), blue, red, yellow, green, purple, pink, teal
  Light: '#e8f0fe', '#fce8e6', '#fef7e0', '#e6f4ea', '#f3e8fd', '#fce2db', '#e0f2f1'
  Dark:  '#1a2744', '#3c1a1a', '#3d3520', '#1a3324', '#2a1a3d', '#3d1a2a', '#1a3330'

ThemeContext (src/theme/ThemeContext.tsx)
  useColorScheme() → default mode
  AsyncStorage('theme_mode') → manual override
  useTheme() → { colors, mode, setMode, isDark }
```

## Firestore Collections

```
users/{uid}           -- email, displayName, uid, createdAt
cards/{cardId}        -- title, ownerId, collaborators[], pinned, color, taskCount, completedCount, createdAt, updatedAt
cards/{cardId}/tasks/ -- text, completed, assignee, reminders[], order, createdAt
invitations/{id}      -- fromUserId, fromEmail, toEmail, cardId, cardTitle, status, createdAt
```

## Firestore Security Rules Summary

```
users/{uid}         -- read: any auth | create: own uid | update: own uid | delete: denied
cards/{cardId}      -- read: owner+collabs | create: any auth (becomes owner)
                      update: owner+collabs OR any auth adding self to collaborators (size+1 check)
                      delete: owner only
tasks/{taskId}      -- all: inherits parent card access via get() lookup
invitations/{id}    -- read: sender or recipient | create: sender only | update: recipient only | delete: denied
```

## Pin/Unpin Sort Lifecycle

```
PIN:
  User taps 📌 → updateCardCosmetic({ pinned: true }) → sets updatedAt = now
  → CardsContext sorts pinned ASCENDING → card goes to END of Pinned section

UNPIN:
  User taps 📍 → updateCardCosmetic({ pinned: false }) → sets updatedAt = now
  → CardsContext sorts others DESCENDING → card goes to TOP of Others section

COLOR CHANGE:
  User picks color → updateCardCosmetic({ color }) → NO updatedAt update
  → card stays in place (no reorder)
```

## Toast Notification System

```
Component: src/components/Toast.tsx
  Variants: success (green), error (red), info (blue)
  Animation: fade in + slide down, auto-dismiss after 3s
  Position: fixed top, z-index 9999

Usage:
  CardDetailScreen → send invite success/error
  InvitationsScreen → accept/decline success/error
```

## Test Coverage

```
Test Suites: 9 passed, 9 total
Tests:       133 passed, 133 total

Services: 118 tests (auth: 25, cards: 38, users: 12, invitations: 15, notifications: 18, notificationSync: 10)
Types: 7 | Config: 3 | Components: 13 (CardPreview: 100%) | Contexts: 3 (AuthContext: 88%)
Screens: 0% (require React Native Testing Library + Firebase mock setup)
```

## Key Commands

```bash
npm run web              # Expo dev server (local)
npm run web:wsl          # Expo dev server (WSL2 → Windows browser)
npm test                 # Run Jest (185 tests)
npm run test:coverage    # Jest + coverage report
npx tsc --noEmit         # TypeScript type-check
npx expo start           # Expo dev server (all platforms)
npm run build:web        # Build static web export + inject PWA meta → dist/
npm run serve:dist       # Serve built dist/ on localhost:3000 (PWA testing)
firebase deploy --only hosting  # Deploy to Firebase Hosting
firebase deploy --only firestore:rules  # Deploy Firestore rules
```
