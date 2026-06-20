# Code Flowchart -- pisilist

> Updated: 2026-06-20 (Keep-style UI rewrite complete — T41-T47 all done)

## Project -- pisilist-app (Firebase)

- **Project ID:** pisilist-app
- **Web App:** PisiList Web (1:579611680236:web:3ca7f2cf07be57ab0634c9)
- **Console:** https://console.firebase.google.com/project/pisilist-app/overview

## Directory Structure

```
pisilist/
├── App.tsx                                  # SafeAreaProvider -> Auth -> Cards -> Invitations -> NavigationContainer
├── index.ts                                 # registerRootComponent(App)
├── firebase.json                            # Firebase config pointing to firestore.rules + indexes
├── firestore.rules                          # Access rules: users, cards, tasks, invitations
├── firestore.indexes.json                   # Composite indexes (invitations: toEmail + status + createdAt)
├── jest.config.js                           # Jest preset (jest-expo), Firebase mocks, coverage thresholds
├── src/
│   ├── config/
│   │   └── firebase.ts                      # Firebase init (pisilist-app), exports auth & db
│   ├── services/
│   │   ├── auth.ts                          # signUp (-> creates users/ doc), signIn, resetPassword, logOut
│   │   ├── cards.ts                         # Card & Task CRUD, addCollaborator, updateTaskReminders, batch ops
│   │   ├── users.ts                         # Firestore users/: upsertUser, findUserByEmail, getUserByUid, getUsersByUids
│   │   ├── invitations.ts                   # send/accept/decline, onPendingInvitations real-time listener
│   │   └── notifications.ts                 # expo-notifications: setup, scheduleReminder, cancelReminder
│   ├── contexts/
│   │   ├── AuthContext.tsx                   # AuthProvider + useAuth (onAuthStateChanged)
│   │   ├── CardsContext.tsx                  # CardsProvider + useCards (dual onSnapshot, owner+collab)
│   │   ├── InvitationsContext.tsx            # InvitationsProvider + useInvitations (onPendingInvitations)
│   │   └── ThemeContext.tsx                  # ThemeProvider + useTheme (useColorScheme, AsyncStorage persistence)
│   ├── components/
│   │   ├── CardPreview.tsx                  # Keep-style card: shadow-only (no border), checkbox preview items, shared indicator
│   │   ├── AssigneePicker.tsx               # Bottom sheet: pick collaborator for per-task assignment
│   │   ├── DateTimePicker.tsx               # Platform-aware DateTimePicker (native/HTML5)
│   │   └── ReminderModal.tsx               # DateTimePicker: add/remove per-task reminders
│   ├── screens/
│   │   ├── LoginScreen.tsx                  # Email/password login form (needs shadow input update T45)
│   │   ├── SignUpScreen.tsx                 # Registration form with confirm password (needs T45)
│   │   ├── ResetPasswordScreen.tsx          # Password reset request -> confirmation UI (needs T45)
│   │   ├── DashboardScreen.tsx              # Keep-style grid: search bar, bell badge, avatar, headerShadow (T43 partial)
│   │   ├── CardDetailScreen.tsx             # Full card: title, inline assignee, inline reminders with timestamps (needs T44)
│   │   ├── InvitationsScreen.tsx            # Pending invitations: accept/decline (needs T46)
│   │   └── SettingsScreen.tsx               # User profile, dark mode toggle, sign out (NEW -- LAYOUT.md view #6)
│   ├── navigation/
│   │   └── AppNavigator.tsx                 # RootNavigator: AuthStack <-> AppStack (Dashboard, CardDetail, Invitations, Settings)
│   ├── theme/
│   │   ├── colors.ts                        # AppColors interface + lightColors/darkColors (20 tokens including Keep-style additions)
│   │   └── ThemeContext.tsx                 # ThemeProvider + useTheme hook
│   ├── types/
│   │   └── index.ts                         # Card, Task, Reminder, Invitation, AppUser
│   └── __tests__/
│       ├── __mocks__/                       # Firebase module mocks (auth, app, firestore, async-storage)
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
│       └── components/
│           └── CardPreview.test.tsx          # 13 rendering path tests (100% coverage)
└── wiki/
    ├── report.md                            # Job-by-job log
    ├── state.md                             # Current project state
    ├── code_flowchart.md                    # This file
    └── plan_ui_layout_rewrite.md            # Keep-style UI rewrite plan (T41-T47)
```

## App Component Tree

```
App.tsx
  └── SafeAreaProvider
      └── ThemeProvider (useColorScheme + AsyncStorage)
          └── AuthProvider (onAuthStateChanged)
              └── CardsProvider (dual onSnapshot: ownedCardsQuery + collaboratedCardsQuery)
                  └── InvitationsProvider (onPendingInvitations)
                      └── NavigationContainer
                          └── RootNavigator (AppNavigator.tsx)
                              ├── [unauthenticated] AuthStack
                              │   ├── LoginScreen
                              │   ├── SignUpScreen
                              │   └── ResetPasswordScreen
                              └── [authenticated] AppStack
                                  ├── Dashboard (cards grid + search + bell + avatar)
                                  ├── CardDetail/{cardId}
                                  ├── Invitations
                                  └── Settings
```

## Data Flow

```
Firebase Auth                          Firestore
  onAuthStateChanged                     onSnapshot (ownedCardsQuery: where ownerId==uid, orderBy updatedAt desc)
       |                                 onSnapshot (collaboratedCardsQuery: where collaborators array-contains uid, orderBy updatedAt desc)
       v                                          |
  AuthContext (user: AppUser | null)              v
       |                                 CardsContext (cards: Card[], merge + dedupe + sort)
       |                                          |
       ├──────────> AppNavigator <────────────────┤
       |            (auth gating)                  |
       |                                           v
       |                                   DashboardScreen
       |                                     search filter (client-side)
       |                                     pinned / others sections
       |                                     FlatList numColumns={2|3|4}
       |                                       |
       |                                       v
       |                                   CardPreview (shadow-only, checkbox preview items)
       |                                       |
       |        onPress(cardId) ───────────────┘
       v
  CardDetailScreen
    tasksQuery onSnapshot (where cardId, orderBy order)
    inline assignee dropdown (per task)
    inline reminders with timestamps + [✕] remove
    inline DateTimePicker (+ Add Reminder)
    invite collaborator modal
```

## Theme System (18 Color Tokens)

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

ThemeContext (src/theme/ThemeContext.tsx)
  useColorScheme() -> default mode
  AsyncStorage('theme_mode') -> manual override
  useTheme() -> { colors, mode, setMode }
```

## Keep-Style UI Rewrite -- Current State

### Completed (All Tasks Done)

| Task | Screen/Component | Change |
|------|-----------------|--------|
| T41 | `src/theme/colors.ts` | Added `cardShadow`, `headerShadow`, `checkboxBorder`, `chipBg` tokens. Removed unused `cardBorder`, `cardSharedBorder`. 18 tokens total. |
| T42 | `src/components/CardPreview.tsx` | Border removed (`borderWidth: 0`), shadow-only cards. Mini checkboxes (16px) with `checkboxBorder` for unchecked, `primary` for checked fill. |
| T43 | `src/screens/DashboardScreen.tsx` | Header uses `headerShadow`. FAB is flat (no boxShadow/elevation). Grid padding 8px, gap 8px. |
| T44 | `src/screens/CardDetailScreen.tsx` | Checkboxes 22px with `checkboxBorder`. Reminder rows are chip containers with `chipBg` background, borderRadius 12. |
| T45 | `LoginScreen.tsx`, `SignUpScreen.tsx`, `ResetPasswordScreen.tsx` | Input fields: `borderWidth: 0` + `boxShadow: cardShadow` (shadow-only inputs). |
| T46 | `src/screens/InvitationsScreen.tsx` | Header uses `headerShadow`. Accept/decline buttons are pill-shaped (borderRadius 20), decline uses `chipBg`. |
| T47 | Various | Removed `cardBorder`/`cardSharedBorder` tokens. Zero deprecated `shadow*` props in codebase. |

## Firestore Collections

```
users/{uid}           -- email, displayName, uid, createdAt
cards/{cardId}        -- title, ownerId, collaborators[], pinned, taskCount, completedCount
cards/{cardId}/tasks/ -- text, completed, assignee, reminders[], order
invitations/{id}      -- fromUserId, toEmail, cardId, cardTitle, status
```

## Firestore Security Rules Summary

```
users/{uid}         -- read: any auth user | create: own uid | update: own uid | delete: denied
cards/{cardId}      -- read: owner+collabs | create: any auth (becomes owner) | update: owner+collabs (collabs can't change ownerId/collaborators) | delete: owner only
tasks/{taskId}      -- all: inherits parent card access via get() lookup
invitations/{id}    -- read: sender or recipient | create: any auth (must be sender) | update: recipient only (accept/decline) | delete: denied
```

## Test Coverage

```
Test Suites: 9 passed, 9 total
Tests:       133 passed, 133 total

Services tested (API contract):
  auth.ts           -- 25 tests (every function, param, error code)
  cards.ts          -- 38 tests (full CRUD, batch ops, queries, doc conversion)
  users.ts          -- 12 tests (upsert/create/find-by-email/get-by-uid/batch)
  invitations.ts    -- 15 tests (send/accept/decline/listener + Firestore doc mapping)
  notifications.ts  -- 18 tests (full lifecycle, permissions, content/trigger verification)

Other:
  types/index.ts         -- 7 tests (structural validation)
  config/firebase.ts     -- 3 tests (init exports)
  components/CardPreview -- 13 tests (100% coverage -- all rendering paths)
  contexts/AuthContext   -- 3 tests (88% coverage)

Screens: 0% (require React Native Testing Library + Firebase mock setup)
```

## Key Commands

```bash
npm start               # Expo dev server
npm run web             # Web target
npm test                # Run Jest (133 tests)
npm run test:coverage   # Jest + coverage report
npx tsc --noEmit        # TypeScript type-check
```
