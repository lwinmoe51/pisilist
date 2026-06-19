/**
 * Auth service API contract tests.
 *
 * Verifies every Firebase Auth SDK call — function, parameters, and
 * return-value handling — for signUp, signIn, resetPassword, and logOut.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { resetAllAuthMocks } from '../__mocks__/firebase-auth';

import {
  AuthError,
  signUp,
  signIn,
  resetPassword,
  logOut,
} from '../../services/auth';

// signUp calls upsertUser — we mock it to keep this test focused on Auth
import { upsertUser } from '../../services/users';
jest.mock('../../services/users', () => ({
  upsertUser: jest.fn(() => Promise.resolve()),
}));

beforeEach(() => {
  resetAllAuthMocks();
  (upsertUser as jest.Mock).mockClear();
  jest.clearAllMocks();
});

// ── AuthError ─────────────────────────────────────────────────────

describe('AuthError', () => {
  it('should be an instance of Error and AuthError', () => {
    const err = new AuthError('msg', 'test/code');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AuthError);
  });

  it('should store message and code', () => {
    const err = new AuthError('Something failed', 'auth/oops');
    expect(err.message).toBe('Something failed');
    expect(err.code).toBe('auth/oops');
    expect(err.name).toBe('AuthError');
  });
});

// ── signUp ────────────────────────────────────────────────────────

describe('signUp', () => {
  it('should call createUserWithEmailAndPassword with auth, email, password', async () => {
    await signUp('alice@test.com', 'Alice', 'secret12');

    expect(createUserWithEmailAndPassword).toHaveBeenCalledTimes(1);
    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.any(Object), // auth instance
      'alice@test.com',
      'secret12',
    );
  });

  it('should call updateProfile with displayName after creation', async () => {
    await signUp('bob@test.com', 'Bob', 'password');

    expect(updateProfile).toHaveBeenCalledTimes(1);
    // updateProfile(user, { displayName })
    expect(updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ uid: 'mock-uid' }),
      { displayName: 'Bob' },
    );
  });

  it('should call upsertUser with uid, email, displayName', async () => {
    await signUp('carol@test.com', 'Carol', 'password');

    expect(upsertUser).toHaveBeenCalledTimes(1);
    expect(upsertUser).toHaveBeenCalledWith(
      'mock-uid',
      'carol@test.com',
      'Carol',
    );
  });

  it('should return user + null error on success', async () => {
    const result = await signUp('dave@test.com', 'Dave', 'password');

    expect(result.error).toBeNull();
    expect(result.user).toBeDefined();
    expect(result.user?.uid).toBe('mock-uid');
  });

  it('should return null user + AuthError on Firebase rejection', async () => {
    (createUserWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
      code: 'auth/email-already-in-use',
      message: 'Firebase: email exists',
    });

    const result = await signUp('used@test.com', 'Used', 'password');

    expect(result.user).toBeNull();
    expect(result.error).toBeInstanceOf(AuthError);
    expect(result.error!.code).toBe('auth/email-already-in-use');
    expect(result.error!.message).toContain('already exists');
  });

  it('should map auth/weak-password to a readable message', async () => {
    (createUserWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
      code: 'auth/weak-password',
      message: 'Firebase: weak',
    });

    const result = await signUp('weak@test.com', 'Weak', '123');

    expect(result.error!.message).toBe('Password must be at least 6 characters.');
  });

  it('should map auth/invalid-email', async () => {
    (createUserWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
      code: 'auth/invalid-email',
      message: 'bad email',
    });

    const result = await signUp('not-an-email', 'Bad', 'password');

    expect(result.error!.message).toBe('Please enter a valid email address.');
  });

  it('should map auth/operation-not-allowed', async () => {
    (createUserWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
      code: 'auth/operation-not-allowed',
      message: 'disabled',
    });

    const result = await signUp('x@test.com', 'X', 'password');

    expect(result.error!.message).toContain('Enable it in Firebase Console');
  });

  it('should fall back to raw message for unknown error codes', async () => {
    (createUserWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
      code: 'auth/something-weird',
      message: 'A strange error occurred',
    });

    const result = await signUp('odd@test.com', 'Odd', 'password');

    expect(result.error!.message).toBe('[auth/something-weird] A strange error occurred');
  });

  it('should not call updateProfile or upsertUser on failure', async () => {
    (createUserWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
      code: 'auth/email-already-in-use',
      message: 'nope',
    });

    await signUp('nope@test.com', 'Nope', 'password');

    expect(updateProfile).not.toHaveBeenCalled();
    expect(upsertUser).not.toHaveBeenCalled();
  });
});

// ── signIn ────────────────────────────────────────────────────────

describe('signIn', () => {
  it('should call signInWithEmailAndPassword with auth, email, password', async () => {
    await signIn('user@test.com', 'mypassword');

    expect(signInWithEmailAndPassword).toHaveBeenCalledTimes(1);
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.any(Object),
      'user@test.com',
      'mypassword',
    );
  });

  it('should return user + null error on success', async () => {
    const result = await signIn('ok@test.com', 'password');

    expect(result.error).toBeNull();
    expect(result.user).toBeDefined();
    expect(result.user?.uid).toBe('mock-uid');
  });

  it('should return null user + AuthError on Firebase rejection', async () => {
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
      code: 'auth/invalid-credential',
      message: 'bad creds',
    });

    const result = await signIn('bad@test.com', 'wrong');

    expect(result.user).toBeNull();
    expect(result.error).toBeInstanceOf(AuthError);
    expect(result.error!.message).toBe('Invalid email or password.');
  });

  it('should map auth/user-not-found', async () => {
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
      code: 'auth/user-not-found',
      message: 'no user',
    });

    const result = await signIn('ghost@test.com', 'password');

    expect(result.error!.message).toBe('No account found with this email address.');
  });

  it('should map auth/wrong-password', async () => {
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
      code: 'auth/wrong-password',
      message: 'wrong pw',
    });

    const result = await signIn('user@test.com', 'wrongpw');

    expect(result.error!.message).toBe('Incorrect password. Please try again.');
  });

  it('should map auth/too-many-requests', async () => {
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
      code: 'auth/too-many-requests',
      message: 'rate limited',
    });

    const result = await signIn('spam@test.com', 'password');

    expect(result.error!.message).toBe('Too many attempts. Please try again later.');
  });

  it('should map auth/network-request-failed', async () => {
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
      code: 'auth/network-request-failed',
      message: 'offline',
    });

    const result = await signIn('net@test.com', 'password');

    expect(result.error!.message).toContain('Network error');
  });
});

// ── resetPassword ─────────────────────────────────────────────────

describe('resetPassword', () => {
  it('should call sendPasswordResetEmail with auth, email', async () => {
    await resetPassword('forgot@test.com');

    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.any(Object),
      'forgot@test.com',
    );
  });

  it('should return { success: true, error: null } on resolve', async () => {
    const result = await resetPassword('ok@test.com');

    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
  });

  it('should return { success: false, error } on rejection', async () => {
    (sendPasswordResetEmail as jest.Mock).mockRejectedValueOnce({
      code: 'auth/user-not-found',
      message: 'not found',
    });

    const result = await resetPassword('ghost@test.com');

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(AuthError);
    expect(result.error!.code).toBe('auth/user-not-found');
  });
});

// ── logOut ─────────────────────────────────────────────────────────

describe('logOut', () => {
  it('should call signOut with auth', async () => {
    await logOut();

    expect(firebaseSignOut).toHaveBeenCalledTimes(1);
    expect(firebaseSignOut).toHaveBeenCalledWith(expect.any(Object));
  });

  it('should resolve without error', async () => {
    await expect(logOut()).resolves.toBeUndefined();
  });

  it('should propagate Firebase signOut errors', async () => {
    (firebaseSignOut as jest.Mock).mockRejectedValueOnce(
      new Error('sign-out failed'),
    );

    await expect(logOut()).rejects.toThrow('sign-out failed');
  });
});
