# Next Steps Plan — pisilist

> Created: 2026-06-25
> Status: PLANNING (no implementation started)

---

## Phase 1: Fix What's Broken

### 1.1 Fix failing test — notifications DATE trigger
- **File:** `src/__tests__/services/notifications.test.ts` line 149-156
- **Problem:** `scheduleReminder > should use DATE trigger with correct timestamp` fails. The test creates `new Date(Date.now() + 7200000)` but the service treats it as past because `Date.now()` resolves differently between test and service context.
- **Fix approach:** Mock `Date.now()` in the test to return a fixed value, then create the future date relative to that fixed value. This eliminates the timing race.
- **Effort:** Small (1 file, ~5 lines changed)
- **Blocks:** Nothing, but must pass before any commit

### 1.2 Fix duplicate style keys in CardPreview
- **File:** `src/components/CardPreview.tsx` lines 367-464
- **Problem:** `colorGrid`, `colorSwatch`, `colorSwatchDefault`, `colorSwatchSelected` are defined twice in `themedStyles`. Second definition silently overwrites the first. The popover styles (first group) are lost.
- **Fix approach:** Remove the second duplicate definitions (lines 443-464) since the first group (lines 367-383) is the popover version that should be kept.
- **Effort:** Small (1 file, delete ~20 lines)
- **Blocks:** Nothing

### 1.3 Remove dead code — ReminderModal
- **File:** `src/components/ReminderModal.tsx` (276 lines)
- **Problem:** Never imported by any screen. CardDetailScreen uses inline reminders directly in TaskRow.
- **Fix approach:** Delete the file. If the component is needed later, it can be recreated from git history.
- **Effort:** Small (delete 1 file)
- **Blocks:** Nothing

---

## Phase 2: Input Validation & Error Handling

### 2.1 Email format validation
- **Files:** `LoginScreen.tsx`, `SignUpScreen.tsx`, `ResetPasswordScreen.tsx`
- **What:** Add regex validation for email format before calling Firebase Auth. Show inline error message below the input field.
- **Pattern:** `const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- **UI:** Red error text below input, shake animation on submit
- **Effort:** Medium (3 files, ~15 lines each)

### 2.2 Password strength validation
- **Files:** `SignUpScreen.tsx`
- **What:** Enforce minimum 8 characters, at least 1 number. Show requirements list below password field with checkmarks as user types.
- **UI:** Live validation indicators (✓/✗) for each requirement
- **Effort:** Medium (1 file, ~30 lines)

### 2.3 Required field checks
- **Files:** All auth screens, CardDetailScreen (invite modal)
- **What:** Disable submit button when required fields are empty. Show "Required" hint on blur if field is empty.
- **Effort:** Small (4 files, ~10 lines each)

### 2.4 User-friendly error messages
- **Files:** `src/services/auth.ts` (already has mapping), screens that call services
- **What:** Map remaining Firebase error codes to human-readable messages. Currently auth.ts maps 5 codes; add mappings for `auth/invalid-credential`, `auth/network-request-failed`, Firestore permission errors.
- **Effort:** Small (1-2 files, ~20 lines)

---

## Phase 3: Loading States

### 3.1 Skeleton loader for Dashboard
- **File:** `src/screens/DashboardScreen.tsx`
- **What:** Show placeholder card shapes (gray rectangles matching card dimensions) while Firestore listeners are loading. Use `loading` state from CardsContext.
- **Pattern:** Animated pulse effect on placeholder cards (2-3 skeleton cards per column)
- **Effort:** Medium (1 new component `SkeletonCard.tsx` + DashboardScreen changes)

### 3.2 Skeleton loader for CardDetail
- **File:** `src/screens/CardDetailScreen.tsx`
- **What:** Show placeholder rows while task listener is loading.
- **Effort:** Small (reuse SkeletonCard or create SkeletonTaskRow)

### 3.3 Loading indicator for async actions
- **Files:** All screens with async operations (invite send, accept/decline, delete)
- **What:** Show ActivityIndicator on buttons during async operations. Disable button to prevent double-submit.
- **Pattern:** `const [loading, setLoading] = useState(false)` per action
- **Effort:** Medium (4-5 files, ~10 lines each)

---

## Phase 4: SettingsScreen — Match LAYOUT.md Spec

### 4.1 Editable profile fields
- **File:** `src/screens/SettingsScreen.tsx`
- **What:** Make Name and Email editable with TextInput fields. Add SAVE button that calls `updateProfile` (name) and re-authenticate flow (email change).
- **LAYOUT.md reference:** View #6 shows `[ Name: John Doe ]` as editable, `[ Email: john@example.com ]` as editable, `[ Password: ******** ]` as editable, and `[ SAVE ]` + `[ CHANGE PASSWORD ]` buttons.
- **Effort:** Large (1 file, ~100 lines + new service functions)

### 4.2 Password change
- **File:** `src/screens/SettingsScreen.tsx`, `src/services/auth.ts`
- **What:** Add CHANGE PASSWORD button that opens a modal with current password, new password, confirm password fields. Uses `reauthenticateWithCredential` + `updatePassword`.
- **Effort:** Medium (2 files, ~80 lines)

### 4.3 Display name on sign-up
- **File:** `src/screens/SignUpScreen.tsx`
- **What:** Add optional "Display Name" input field. If provided, pass to `signUp` which already calls `updateProfile({ displayName })`.
- **Effort:** Small (1 file, ~15 lines)

---

## Phase 5: Test Coverage Expansion

### 5.1 Screen tests (priority order)
| Screen | Complexity | Key things to test |
|--------|-----------|-------------------|
| `LoginScreen` | Low | Form renders, validation, submit calls signIn, error display |
| `SignUpScreen` | Low | Form renders, password match validation, submit calls signUp |
| `ResetPasswordScreen` | Low | Form renders, submit calls resetPassword, success state |
| `InvitationsScreen` | Medium | Invitation list renders, accept/decline calls service, toast feedback |
| `SettingsScreen` | Medium | Profile display, dark mode toggle, sign out |
| `DashboardScreen` | High | Grid layout, search filter, card actions, create modal |
| `CardDetailScreen` | Very High | Task CRUD, assignee, reminders, invite modal, 760 lines |

- **Approach:** Use `@testing-library/react-native` with mocked contexts (AuthContext, CardsContext, InvitationsContext, ThemeContext). Mock navigation prop. Mock Firebase services.
- **Mock pattern:** Create wrapper providers that supply test data without real Firestore connections.
- **Effort:** Large (7 files, 10-30 tests each)

### 5.2 Context tests
| Context | Key things to test |
|---------|-------------------|
| `CardsContext` | Dual listener setup, merge/sort logic, loading state, error handling |
| `InvitationsContext` | Listener setup, invitation list, loading state |
| `ThemeContext` | Mode switching, AsyncStorage persistence, color token access |

- **Effort:** Medium (3 files, 5-10 tests each)

### 5.3 Component tests
| Component | Key things to test |
|-----------|-------------------|
| `ConfirmModal` | Renders title/message, confirm/cancel callbacks, destructive styling |
| `Toast` | Renders variant, auto-dismiss, animation |
| `DateTimePicker` | Web vs native rendering, value change callback |
| `AssigneePicker` | Collaborator list, selection callback, unassigned option |

- **Effort:** Medium (4 files, 5-10 tests each)

### 5.4 Coverage target
- Current: ~15% statements
- Goal: 70%+ (per jest.config.js comment)
- After Phase 5: estimated 55-65% (screens are the largest gap)

---

## Phase 6: Production Readiness

### 6.1 Remove debug console.log
- **Files:** `src/services/cards.ts`, `src/services/invitations.ts`, `src/screens/DashboardScreen.tsx`, `src/screens/CardDetailScreen.tsx`, `src/screens/InvitationsScreen.tsx`
- **What:** Either remove all `console.log`/`console.error` statements, or gate behind a `__DEV__` flag: `if (__DEV__) console.log(...)`.
- **Approach:** Create a `src/utils/logger.ts` utility: `export const log = __DEV__ ? console.log : () => {}`
- **Effort:** Medium (6-8 files)

### 6.2 Remove hardcoded API key
- **File:** `src/config/firebase.ts`
- **What:** Move Firebase config to environment variables. Use `expo-constants` or `react-native-dotenv` to load from `.env` file.
- **Note:** Firebase web API keys are not truly secret (they're in the browser bundle), but moving them to env vars is best practice and prevents accidental key rotation issues.
- **Effort:** Small (1 file + new `.env.example`)

### 6.3 Fix app.json userInterfaceStyle
- **File:** `app.json`
- **What:** Change `"userInterfaceStyle": "light"` to `"userInterfaceStyle": "automatic"` to match dark mode support.
- **Effort:** Trivial (1 line)

### 6.4 Clean up unused imports
- **Files:** LoginScreen, SignUpScreen, ResetPasswordScreen, InvitationsScreen (unused `Alert` import), DashboardScreen (unused `query`, `orderBy`, `where`, `db`)
- **Effort:** Trivial (5 files, remove 1-2 lines each)

---

## Execution Order

```
Phase 1 (Fix broken)  →  Phase 2 (Validation)  →  Phase 3 (Loading states)
                                                        ↓
Phase 6 (Production)  ←  Phase 5 (Tests)        ←  Phase 4 (Settings)
```

- **Phase 1** — Do first. Unblocks clean test runs and removes dead code.
- **Phase 2** — Do second. Input validation is high-impact, low-effort.
- **Phase 3** — Do third. Loading states improve UX significantly.
- **Phase 4** — Do fourth. SettingsScreen spec compliance.
- **Phase 5** — Do fifth. Test coverage expansion (can be done incrementally alongside other phases).
- **Phase 6** — Do last. Production cleanup before deployment.

---

## Estimated Effort

| Phase | Files Changed | New Files | Tests Added | Effort |
|-------|--------------|-----------|-------------|--------|
| 1. Fix broken | 2 | 0 | 0 | ~30 min |
| 2. Validation | 4 | 0 | 5-8 | ~1 hour |
| 3. Loading | 3 | 1 | 3-5 | ~1.5 hours |
| 4. Settings | 2 | 0 | 5-8 | ~2 hours |
| 5. Tests | 0 | 14 | 80-120 | ~4 hours |
| 6. Production | 8 | 1 | 0 | ~1 hour |
| **Total** | **~19** | **~2** | **~100-140** | **~10 hours** |
