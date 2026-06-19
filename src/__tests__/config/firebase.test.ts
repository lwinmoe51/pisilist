/**
 * Firebase config module tests.
 *
 * firebase/app is mocked via moduleNameMapper in jest.config.js
 */

import app, { auth, db } from '../../config/firebase';

describe('firebase config', () => {
  it('should export initialized app', () => {
    expect(app).toBeDefined();
    expect(app.name).toBe('mock-app');
  });

  it('should export auth instance', () => {
    expect(auth).toBeDefined();
    // The mock auth has the getAuth shape
    expect(typeof auth.onAuthStateChanged).toBe('function');
  });

  it('should export firestore db instance', () => {
    expect(db).toBeDefined();
    expect(typeof db).toBe('object');
  });
});
