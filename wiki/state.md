# State — pisilist

## Completed
- ✅ Project initialization (Expo SDK 56 + Firebase)
- ✅ Authentication flow (email/password sign-up, login, password reset)
- ✅ Navigation (auth-gated stack navigator)
- ✅ Card & Task CRUD (create cards, add tasks, toggle/delete)
- ✅ Card grid UI (Google Keep-style 2-column grid with pinned/others sections)
- ✅ Collaboration (invite by email, accept/decline, shared cards on dashboard)
- ✅ Granular Task Assignment (per-task assignee picker, collaborator avatars)
- ✅ Multi-Reminder System (date/time picker, expo-notifications scheduling)
- ✅ Firebase project: pisilist-app (Firestore + Auth provisioned)
- ✅ Firestore security rules deployed (users, cards, tasks, invitations)
- ✅ Firestore indexes deployed
- ✅ Jest test suite (55 tests, 9 suites, all passing, 16% coverage)
  - Services: auth (73%), cards (16%), users (73%), invitations (78%), notifications (74%)
  - Components: CardPreview (100%)
  - Contexts: AuthContext (88%)
  - Config: firebase.ts (83%)
  - Types: structural validation

## Pending
- Write tests for remaining screens and components (AssigneePicker, ReminderModal, screens)
- Test end-to-end on device
- Deploy to app stores

## In Progress
- None

## Blockers
- None
