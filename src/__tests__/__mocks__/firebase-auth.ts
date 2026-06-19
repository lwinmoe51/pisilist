/** Minimal mock of firebase/auth for unit tests. */

export function getAuth() {
  return {
    currentUser: null,
    onAuthStateChanged: () => () => {},
    signInWithEmailAndPassword: async () => ({}),
    createUserWithEmailAndPassword: async () => ({
      user: { uid: 'mock-uid', email: 'mock@test.com' },
    }),
    signOut: async () => {},
    sendPasswordResetEmail: async () => {},
    updateProfile: async () => {},
  };
}

export function createUserWithEmailAndPassword() {
  return Promise.resolve({ user: { uid: 'mock-uid' } });
}

export function signInWithEmailAndPassword() {
  return Promise.resolve({ user: { uid: 'mock-uid' } });
}

export function signOut() {
  return Promise.resolve();
}

export function sendPasswordResetEmail() {
  return Promise.resolve();
}

export function updateProfile() {
  return Promise.resolve();
}

export function onAuthStateChanged() {
  return () => {}; // unsubscribe function
}
