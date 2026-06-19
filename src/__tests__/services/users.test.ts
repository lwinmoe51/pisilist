/**
 * Users service API contract tests.
 *
 * Verifies Firestore SDK calls for upsertUser, findUserByEmail,
 * getUserByUid, and getUsersByUids.
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  resetAllFirestoreMocks,
} from '../__mocks__/firebase-firestore';

import {
  upsertUser,
  findUserByEmail,
  getUserByUid,
  getUsersByUids,
} from '../../services/users';

beforeEach(() => {
  resetAllFirestoreMocks();
});

// ── upsertUser (new user) ─────────────────────────────────────────

describe('upsertUser', () => {
  it('should check if user doc exists via getDoc', async () => {
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => false,
      id: 'uid-1',
      data: () => ({}),
    });

    await upsertUser('uid-1', 'alice@test.com', 'Alice');

    expect(doc).toHaveBeenCalledWith(expect.any(Object), 'users', 'uid-1');
    expect(getDoc).toHaveBeenCalledTimes(1);
  });

  it('should create a new user doc with full profile when not existing', async () => {
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => false,
      id: 'uid-1',
      data: () => ({}),
    });

    await upsertUser('uid-1', 'bob@test.com', 'Bob');

    expect(setDoc).toHaveBeenCalledTimes(1);
    const [ref, data] = (setDoc as jest.Mock).mock.calls[0];
    expect(data.uid).toBe('uid-1');
    expect(data.email).toBe('bob@test.com');
    expect(data.displayName).toBe('Bob');
    expect(data.createdAt).toBeDefined();
    expect(data.updatedAt).toBeDefined();
    expect(serverTimestamp).toHaveBeenCalled();
  });

  it('should merge-update existing user doc preserving fields', async () => {
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      id: 'uid-1',
      data: () => ({ uid: 'uid-1', email: 'old@test.com', displayName: 'Old' }),
    });

    await upsertUser('uid-1', 'new@test.com', 'NewName');

    expect(setDoc).toHaveBeenCalledTimes(1);
    const [ref, data, options] = (setDoc as jest.Mock).mock.calls[0];
    expect(data.email).toBe('new@test.com');
    expect(data.displayName).toBe('NewName');
    expect(data.updatedAt).toBeDefined();
    expect(options).toEqual({ merge: true });
  });
});

// ── findUserByEmail ───────────────────────────────────────────────

describe('findUserByEmail', () => {
  it('should query users collection where email == normalized', async () => {
    await findUserByEmail('  Alice@TEST.com  ');

    expect(collection).toHaveBeenCalledWith(expect.any(Object), 'users');
    expect(where).toHaveBeenCalledWith('email', '==', 'alice@test.com');
    expect(query).toHaveBeenCalled();
    expect(getDocs).toHaveBeenCalledTimes(1);
  });

  it('should return null when no user found', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({ empty: true, docs: [] });

    const result = await findUserByEmail('nobody@test.com');
    expect(result).toBeNull();
  });

  it('should return uid, email, displayName when user found', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      empty: false,
      docs: [
        {
          id: 'user-xyz',
          data: () => ({
            email: 'found@test.com',
            displayName: 'Found User',
          }),
        },
      ],
    });

    const result = await findUserByEmail('found@test.com');

    expect(result).toEqual({
      uid: 'user-xyz',
      email: 'found@test.com',
      displayName: 'Found User',
    });
  });

  it('should default missing email/displayName to empty string', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      empty: false,
      docs: [
        { id: 'minimal', data: () => ({}) },
      ],
    });

    const result = await findUserByEmail('minimal@test.com');

    expect(result!.email).toBe('');
    expect(result!.displayName).toBe('');
  });
});

// ── getUserByUid ──────────────────────────────────────────────────

describe('getUserByUid', () => {
  it('should call getDoc on users/{uid}', async () => {
    await getUserByUid('uid-42');

    expect(doc).toHaveBeenCalledWith(expect.any(Object), 'users', 'uid-42');
    expect(getDoc).toHaveBeenCalledTimes(1);
  });

  it('should return null when user doc does not exist', async () => {
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => false,
      id: 'uid-404',
      data: () => ({}),
    });

    const result = await getUserByUid('uid-404');
    expect(result).toBeNull();
  });

  it('should return email and displayName when found', async () => {
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      id: 'uid-42',
      data: () => ({ email: 'x@test.com', displayName: 'X' }),
    });

    const result = await getUserByUid('uid-42');

    expect(result).toEqual({ email: 'x@test.com', displayName: 'X' });
  });

  it('should default missing fields to empty string', async () => {
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      id: 'uid-empty',
      data: () => ({}),
    });

    const result = await getUserByUid('uid-empty');

    expect(result).toEqual({ email: '', displayName: '' });
  });
});

// ── getUsersByUids ────────────────────────────────────────────────

describe('getUsersByUids', () => {
  it('should call getUserByUid for each uid', async () => {
    // Mock three getDoc calls (one per uid)
    (getDoc as jest.Mock)
      .mockResolvedValueOnce({ exists: () => false, data: () => ({}) })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ email: 'a@test.com', displayName: 'A' }),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ email: 'b@test.com', displayName: 'B' }),
      });

    const result = await getUsersByUids(['uid-1', 'uid-2', 'uid-3']);

    expect(getDoc).toHaveBeenCalledTimes(3);
    // Only found users appear in the map
    expect(result.size).toBe(2);
    expect(result.get('uid-2')).toEqual({ email: 'a@test.com', displayName: 'A' });
    expect(result.get('uid-3')).toEqual({ email: 'b@test.com', displayName: 'B' });
    expect(result.has('uid-1')).toBe(false);
  });

  it('should return empty Map for empty input', async () => {
    const result = await getUsersByUids([]);

    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(0);
    expect(getDoc).not.toHaveBeenCalled();
  });
});
