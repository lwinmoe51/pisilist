# Plan: Comprehensive API Tests for All Firebase Service Calls

## Goal
Write API-level integration tests that verify every service function's request payload (what it sends to Firebase) and response handling (how it processes Firebase responses), covering all success and error paths. These tests will serve as the diagnostics layer between UI and Firebase.

## Strategy
Enhance Firebase mocks to act as **spies** that record every call with its arguments. Then write tests that invoke service functions and assert:
1. The correct Firebase SDK function was called
2. The correct parameters were passed (document shapes, queries, etc.)
3. The return value is correct for a given response
4. Error paths are handled correctly

## Phase 1: Spy-Enhanced Firebase Mocks (1 file changed)

Replace current `firebase-auth.ts` and `firebase-firestore.ts` mocks with spy-enhanced versions that:
- Export Jest `jest.fn()` functions so tests can assert `.toHaveBeenCalledWith()`
- Preserve existing behavior (return values, Timestamp class)
- Expose a `resetAllMocks()` helper for test isolation

## Phase 2: Auth API Tests (`auth.test.ts` — rewrites existing 5 → ~25 tests)

| Function | Tests |
|----------|-------|
| `signUp` | Calls createUserWithEmailAndPassword with (auth, email, password); calls updateProfile with {displayName}; calls upsertUser with (uid, email, displayName); returns {user, error:null} on success; returns {user:null, error:AuthError} on Firebase error; maps each known Firebase error code; falls back to raw message for unknown codes |
| `signIn` | Calls signInWithEmailAndPassword with (auth, email, password); returns user on success; maps errors |
| `resetPassword` | Calls sendPasswordResetEmail with (auth, email); returns {success:true} on resolve; returns {success:false, error} on reject |
| `logOut` | Calls signOut(auth); resolves void |
| `AuthError` | instanceof Error; name = 'AuthError'; stores code |

## Phase 3: Cards & Tasks API Tests (`cards.test.ts` — rewrites existing 5 → ~30 tests)

| Function | Tests |
|----------|-------|
| `createCard` | Calls addDoc with correct collection; creates doc with ownerId, title, collaborators:[], pinned:false, taskCount:0, completedCount:0, serverTimestamp; returns doc id |
| `updateCard` | Calls updateDoc with cardId ref and {title/pinned, updatedAt: serverTimestamp} |
| `deleteCard` | getDocs on tasks subcollection; writeBatch deletes all tasks + card; batch.commit() called |
| `createTask` | getDocs for max order; addDoc with text, completed:false, assignee:null, reminders:[], order, serverTimestamp; calls updateDoc on card with taskCount increment(1) |
| `updateTask` | updateDoc with {text, assignee} on task doc |
| `toggleTask` | writeBatch: update task {completed}, update card {completedCount: increment(±1)}; batch.commit() |
| `deleteTask(task, wasCompleted:true)` | writeBatch: delete task, update card {taskCount:-1, completedCount:-1}; batch.commit() |
| `addCollaborator` | updateDoc with arrayUnion(userId) |
| `updateTaskReminders` | updateDoc with {reminders} |
| `cardsQuery` → `ownedCardsQuery` | query with where('ownerId','==',uid) + orderBy('updatedAt','desc') |
| `collaboratedCardsQuery` | query with where('collaborators','array-contains',uid) + orderBy |
| `tasksQuery` | query with orderBy('order','asc') on subcollection |
| `docToCard` | Handles all fields; defaults for missing; handles null/undefined timestamps |
| `docToTask` | Handles all fields; defaults; reminder timestamp conversion |

## Phase 4: Users API Tests (`users.test.ts` — rewrites existing 5 → ~12 tests)

| Function | Tests |
|----------|-------|
| `upsertUser` (new user) | getDoc returns !exists → setDoc with {uid, email, displayName, createdAt, updatedAt} |
| `upsertUser` (existing user) | getDoc returns exists → setDoc merge:true with {email, displayName, updatedAt} |
| `findUserByEmail` (found) | query with where('email','==',lowercase); returns {uid, email, displayName} |
| `findUserByEmail` (not found) | returns null when snapshot.empty |
| `getUserByUid` (found) | getDoc → {email, displayName} |
| `getUserByUid` (not found) | returns null |
| `getUsersByUids` | calls getUserByUid for each; returns Map with found users; excludes missing |

## Phase 5: Invitations API Tests (`invitations.test.ts` — rewrites existing 6 → ~15 tests)

| Function | Tests |
|----------|-------|
| `sendInvitation` (valid) | findUserByEmail returns user → addDoc with {fromUserId, fromEmail, toEmail(normalized), cardId, cardTitle, status:'pending', serverTimestamp}; returns doc id |
| `sendInvitation` (self-invite) | findUserByEmail returns same uid → throws "cannot invite yourself" |
| `sendInvitation` (unknown email) | findUserByEmail returns null → throws "No Pisilist account" |
| `acceptInvitation` | writeBatch: update invitation {status:'accepted'}, update card {collaborators: arrayUnion(userId)}; batch.commit() |
| `declineInvitation` | updateDoc with {status:'declined'} |
| `onPendingInvitations` | query with where('toEmail','==',email) + where('status','==','pending') + orderBy('createdAt','desc'); onSnapshot called; returns unsubscribe fn; data mapping verified |

## Phase 6: Notifications API Tests (`notifications.test.ts` — rewrites existing 7 → ~10 tests)

| Function | Tests |
|----------|-------|
| `setupNotifications` | setNotificationHandler with correct behavior; getPermissionsAsync; if not granted, requestPermissionsAsync; Android: setNotificationChannelAsync with 'reminders' |
| `scheduleReminder` (future) | scheduleNotificationAsync with correct content (title, body, data, sound) + trigger (DATE, timestamp); returns id |
| `scheduleReminder` (past) | returns '' immediately, no call |
| `cancelReminder` (valid) | cancelScheduledNotificationAsync(id) |
| `cancelReminder` (empty) | returns void without calling |
| `cancelAllRemindersForTask` | cancels all non-empty ids in parallel; returns void |

## Test Count Estimates

| File | Existing Tests | New Tests |
|------|---------------|-----------|
| `auth.test.ts` | 5 | ~25 |
| `cards.test.ts` | 5 | ~35 |
| `users.test.ts` | 5 | ~12 |
| `invitations.test.ts` | 6 | ~15 |
| `notifications.test.ts` | 7 | ~10 |
| **Total** | **28** → | **~97** |

These are not "mock unit tests" — they are API contract tests. They verify the exact Firestore document shapes, query structures, batch operation sequences, and error transformations that the UI depends on. When the UI and Firebase disagree, these tests pinpoint exactly which service function sends wrong data.

## Implementation Order
1. Enhance `__mocks__/firebase-firestore.ts` with spy functions
2. Enhance `__mocks__/firebase-auth.ts` with spy functions  
3. Rewrite `auth.test.ts` 
4. Rewrite `cards.test.ts`
5. Rewrite `users.test.ts`
6. Rewrite `invitations.test.ts`
7. Rewrite `notifications.test.ts`
8. Run `npm test` (all 97+ must pass)
9. TypeScript check
10. Report → Commit via git_manager
