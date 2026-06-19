# Code Flowchart — pisilist

> Updated: 2026-06-19 (All features + rules + tests complete)

## Project — pisilist-app (Firebase)

- **Project ID:** pisilist-app
- **Web App:** PisiList Web (1:579611680236:web:3ca7f2cf07be57ab0634c9)
- **Console:** https://console.firebase.google.com/project/pisilist-app/overview

## Directory Structure

```
pisilist/
├── App.tsx                                  # SafeAreaProvider → Auth → Cards → Invitations → NavigationContainer
├── index.ts                                 # registerRootComponent(App)
├── firebase.json                            # Firebase config pointing to firestore.rules + indexes
├── firestore.rules                          # Access rules: users, cards, tasks, invitations
├── firestore.indexes.json                   # Composite indexes (invitations: toEmail + status + createdAt)
├── jest.config.js                           # Jest preset (jest-expo), Firebase mocks, coverage thresholds
├── src/
│   ├── config/
│   │   └── firebase.ts                      # Firebase init (pisilist-app), exports auth & db
│   ├── services/
│   │   ├── auth.ts                          # signUp (→ creates users/ doc), signIn, resetPassword, logOut
│   │   ├── cards.ts                         # Card & Task CRUD, addCollaborator, updateTaskReminders, batch ops
│   │   ├── users.ts                         # Firestore users/: upsertUser, findUserByEmail, getUserByUid, getUsersByUids
│   │   ├── invitations.ts                   # send/accept/decline, onPendingInvitations real-time listener
│   │   └── notifications.ts                 # expo-notifications: setup, scheduleReminder, cancelReminder
│   ├── contexts/
│   │   ├── AuthContext.tsx                   # AuthProvider + useAuth (onAuthStateChanged)
│   │   ├── CardsContext.tsx                  # CardsProvider + useCards (onSnapshot, client-side owner+collab filter)
│   │   └── InvitationsContext.tsx            # InvitationsProvider + useInvitations (onPendingInvitations)
│   ├── components/
│   │   ├── CardPreview.tsx                  # Grid card: title, tasks, shared indicator, collaborator badge
│   │   ├── AssigneePicker.tsx              # Bottom sheet: pick collaborator for per-task assignment
│   │   └── ReminderModal.tsx               # DateTimePicker: add/remove per-task reminders
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── SignUpScreen.tsx
│   │   ├── ResetPasswordScreen.tsx
│   │   ├── DashboardScreen.tsx              # 2-col card grid + bell badge (pending invites) + FAB
│   │   ├── CardDetailScreen.tsx             # Full card: title, avatars, tasks, assignee picker, reminder modal
│   │   └── InvitationsScreen.tsx            # Pending invitations: accept/decline
│   ├── navigation/
│   │   └── AppNavigator.tsx                 # RootNavigator: AuthStack ↕ AppStack (Dashboard, CardDetail, Invitations)
│   ├── types/
│   │   └── index.ts                         # Card, Task, Reminder, Invitation, AppUser
│   └── __tests__/
│       ├── __mocks__/                       # Firebase module mocks (auth, app, firestore)
│       ├── services/
│       │   ├── auth.test.ts                 # AuthError, signUp, signIn, resetPassword, logOut (5 tests)
│       │   ├── cards.test.ts                # docToCard, docToTask conversions + edge cases (5 tests)
│       │   └── users.test.ts                # User service exports verification (5 tests)
│       └── types/
│           └── types.test.ts                # Structural type checks (7 tests)
```

## Firestore Security Rules Summary

```
users/{uid}         — read: any auth user | create: own uid | update: own uid | delete: denied
cards/{cardId}      — read: owner+collabs | create: any auth (becomes owner) | update: owner+collabs (collabs can't change ownerId/collaborators) | delete: owner only
tasks/{taskId}      — all: inherits parent card access via get() lookup
invitations/{id}    — read: sender or recipient | create: any auth (must be sender) | update: recipient only (accept/decline) | delete: denied
```

## Test Coverage

```
Test Suites: 4 passed, 4 total
Tests:       22 passed, 22 total

Services tested:
  auth.ts       — 73% stmts (error mapping + all public functions)
  cards.ts      — 16% stmts (doc converters fully covered; CRUD requires integration tests)
  users.ts      — 72% stmts (all functions exercised)
  notifications — not yet unit tested (requires expo-notifications mocking)

Screens/components: 0% (require React Native Testing Library + Firebase mock setup)
Types: structural validation tests (type narrowing, union coverage)
```

## Key Commands

```bash
npm start            # Expo dev server
npm run web          # Web target
npm test             # Run Jest (22 tests)
npm run test:coverage  # Jest + coverage report
```
