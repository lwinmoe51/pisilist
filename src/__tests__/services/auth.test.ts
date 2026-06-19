/**
 * Auth service unit tests.
 *
 * Firebase auth is mocked via moduleNameMapper in jest.config.js
 * so all imports resolve to src/__tests__/__mocks__/firebase-auth.ts
 */

import { AuthError, signUp, signIn, resetPassword, logOut } from '../../services/auth';

// Mock the users service since signUp calls upsertUser
jest.mock('../../services/users', () => ({
  upsertUser: jest.fn(() => Promise.resolve()),
}));

describe('AuthError', () => {
  it('should create an AuthError with code and message', () => {
    const error = new AuthError('Test message', 'test/code');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AuthError);
    expect(error.message).toBe('Test message');
    expect(error.code).toBe('test/code');
    expect(error.name).toBe('AuthError');
  });
});

describe('signUp', () => {
  it('should return user on successful sign-up', async () => {
    const result = await signUp('test@test.com', 'Test', 'password');
    expect(result.error).toBeNull();
    expect(result.user).toBeDefined();
  });
});

describe('signIn', () => {
  it('should return user on successful sign-in', async () => {
    const result = await signIn('test@test.com', 'password');
    expect(result.error).toBeNull();
    expect(result.user).toBeDefined();
  });
});

describe('resetPassword', () => {
  it('should return success on reset request', async () => {
    const result = await resetPassword('test@test.com');
    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
  });
});

describe('logOut', () => {
  it('should resolve without error', async () => {
    await expect(logOut()).resolves.toBeUndefined();
  });
});
