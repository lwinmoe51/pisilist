/**
 * Users service unit tests.
 *
 * Firebase firestore is mocked via moduleNameMapper in jest.config.js
 */

import {
  upsertUser,
  findUserByEmail,
  getUserByUid,
  getUsersByUids,
} from '../../services/users';

describe('users service', () => {
  describe('upsertUser', () => {
    it('should resolve without error (mocked)', async () => {
      await expect(
        upsertUser('uid-1', 'test@test.com', 'Test User'),
      ).resolves.toBeUndefined();
    });
  });

  describe('findUserByEmail', () => {
    it('should return null when no user found (mocked empty)', async () => {
      const result = await findUserByEmail('nobody@test.com');
      expect(result).toBeNull();
    });
  });

  describe('getUserByUid', () => {
    it('should return null when no user found (mocked empty)', async () => {
      const result = await getUserByUid('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getUsersByUids', () => {
    it('should return an empty map for nonexistent users', async () => {
      const result = await getUsersByUids(['uid-1', 'uid-2']);
      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });
  });
});
