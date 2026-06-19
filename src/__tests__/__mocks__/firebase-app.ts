/** Minimal mock of firebase/app for unit tests. */

export function initializeApp() {
  return { name: 'mock-app' };
}

export function getApps() {
  return [];
}
