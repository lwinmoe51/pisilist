/**
 * Spy-enhanced mock of firebase/auth for API contract tests.
 *
 * Every exported function is a jest.fn() so tests can assert
 * `.toHaveBeenCalledWith()` on the exact Firebase Auth SDK calls.
 */

// ── Init ───────────────────────────────────────────────────────────

export const getAuth = jest.fn(() => ({
  currentUser: null,
  onAuthStateChanged: jest.fn(() => () => {}),
}));

// ── Auth operations ────────────────────────────────────────────────

export const createUserWithEmailAndPassword = jest.fn(
  (_auth: any, _email: string, _password: string) =>
    Promise.resolve({
      user: {
        uid: 'mock-uid',
        email: 'mock@test.com',
        getIdToken: jest.fn(() => Promise.resolve('mock-token')),
      },
    }),
);

export const signInWithEmailAndPassword = jest.fn(
  (_auth: any, _email: string, _password: string) =>
    Promise.resolve({
      user: {
        uid: 'mock-uid',
        email: 'mock@test.com',
        getIdToken: jest.fn(() => Promise.resolve('mock-token')),
      },
    }),
);

export const signOut = jest.fn((_auth: any) => Promise.resolve());

export const sendPasswordResetEmail = jest.fn(
  (_auth: any, _email: string) => Promise.resolve(),
);

export const updateProfile = jest.fn(
  (_user: any, _profile: { displayName?: string; photoURL?: string }) =>
    Promise.resolve(),
);

export const onAuthStateChanged = jest.fn(
  (_auth: any, _callback: (user: any) => void) => {
    // Default: don't invoke callback (no user signed in)
    return () => {}; // unsubscribe
  },
);

// ── Test utilities ─────────────────────────────────────────────────

/** Reset all mock call history AND implementation chains between tests. */
export function resetAllAuthMocks(): void {
  getAuth.mockReset();
  createUserWithEmailAndPassword.mockReset();
  signInWithEmailAndPassword.mockReset();
  signOut.mockReset();
  sendPasswordResetEmail.mockReset();
  updateProfile.mockReset();
  onAuthStateChanged.mockReset();

  // Re-apply default implementations
  getAuth.mockReturnValue({
    currentUser: null,
    onAuthStateChanged: jest.fn(() => () => {}),
  });
  createUserWithEmailAndPassword.mockResolvedValue({
    user: {
      uid: 'mock-uid',
      email: 'mock@test.com',
      getIdToken: jest.fn(() => Promise.resolve('mock-token')),
    },
  });
  signInWithEmailAndPassword.mockResolvedValue({
    user: {
      uid: 'mock-uid',
      email: 'mock@test.com',
      getIdToken: jest.fn(() => Promise.resolve('mock-token')),
    },
  });
  signOut.mockResolvedValue(undefined);
  sendPasswordResetEmail.mockResolvedValue(undefined);
  updateProfile.mockResolvedValue(undefined);
  onAuthStateChanged.mockImplementation((_auth: any, _callback: (user: any) => void) => {
    return () => {}; // unsubscribe
  });
}
