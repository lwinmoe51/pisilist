# State -- pisilist

## Completed
- ✅ Project initialization (Expo SDK 56 + Firebase)
- ✅ Authentication flow (email/password sign-up, login, password reset)
- ✅ Navigation (auth-gated stack navigator)
- ✅ Card & Task CRUD (create cards, add tasks, toggle/delete)
- ✅ Card grid UI (Google Keep-style responsive grid with pinned/others sections)
- ✅ Collaboration (invite by email, accept/decline, shared cards on dashboard)
- ✅ Granular Task Assignment (per-task assignee picker, collaborator avatars)
- ✅ Multi-Reminder System (platform-aware DateTimePicker, expo-notifications scheduling)
- ✅ Firebase project: pisilist-app (Firestore + Auth provisioned)
- ✅ Firestore security rules deployed (users, cards, tasks, invitations)
- ✅ Firestore indexes deployed (invitations, cards owned, cards collaborated)
- ✅ Firestore query split (owned + collaborated queries matching security rules)
- ✅ Theme system (dark mode with light/dark palettes, 18 color tokens)
- ✅ Responsive layout (web/mobile adaptive grid, max-width centering, capped modals)
- ✅ Platform-aware DateTimePicker (native spinner on Android/iOS, HTML5 inputs on web)
- ✅ shadow* deprecation cleanup (all boxShadow now, zero warnings)
- ✅ frontend-design plugin installed (project-scoped UI/UX skill)
- ✅ Comprehensive API contract tests (133 tests, 9 suites, all passing)
- ✅ LAYOUT.md matching rewrite — Dashboard search + avatar, CardDetail inline assignee + reminders, SettingsScreen with dark mode toggle
- ✅ Keep-style UI rewrite — All 7 tasks complete (T41-T47)
- ✅ Cross-platform ConfirmModal component (replaces Alert.alert and window.confirm)
- ✅ Full console logging on all UI handlers and Firebase service functions
- ✅ WSL networking fix (web:wsl script for Expo on WSL2)

## In Progress
- None

## Pending
- Write tests for AssigneePicker, ReminderModal, and screens
- Test end-to-end on device (Android)
- Deploy to app stores

## Blockers
- None

## Installed Plugins (5)
1. `firebase@claude-plugins-official` — Firestore, Auth, Cloud Functions, Security Rules
2. `github@claude-plugins-official` — Repo management, commits, PRs, issues
3. `context7@claude-plugins-official` — Library docs, wiki maintenance
4. `expo@claude-plugins-official` — Expo SDK 56 docs, build/deploy guidance
5. `frontend-design@claude-plugins-official` — UI/UX design patterns (MANDATORY for .tsx/StyleSheet work)

## Project Skills (3)
- `code_review/SKILL.md` — Pre-land code review using context7 for API validation
- `documentation/SKILL.md` — Doc generation using context7 for API references
- `frontend-design` (plugin) — Scoped as `pisilist:frontend-design`; must invoke before any UI change

## Key Commands
```bash
npm run web          # Expo dev server (local)
npm run web:wsl      # Expo dev server (WSL2 → Windows browser)
npm test             # Run Jest (133 tests)
npm run test:coverage # Jest + coverage report
npx tsc --noEmit     # TypeScript type-check
```

## Blockers
- None

## Installed Plugins (5)
1. `firebase@claude-plugins-official` -- Firestore, Auth, Cloud Functions, Security Rules
2. `github@claude-plugins-official` -- Repo management, commits, PRs, issues
3. `context7@claude-plugins-official` -- Library docs, wiki maintenance
4. `expo@claude-plugins-official` -- Expo SDK 56 docs, build/deploy guidance
5. `frontend-design@claude-plugins-official` -- UI/UX design patterns (MANDATORY for .tsx/StyleSheet work)

## Project Skills (3)
- `code_review/SKILL.md` -- Pre-land code review using context7 for API validation
- `documentation/SKILL.md` -- Doc generation using context7 for API references
- `frontend-design` (plugin) -- Scoped as `pisilist:frontend-design`; must invoke before any UI change
