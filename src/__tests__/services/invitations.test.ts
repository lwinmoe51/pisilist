/**
 * Invitations service tests.
 *
 * firebase/firestore is mocked via moduleNameMapper.
 * We mock the users service dependency within tests.
 */

import {
  sendInvitation,
  acceptInvitation,
  declineInvitation,
  onPendingInvitations,
} from '../../services/invitations';

// Mock the users service so we control the "user lookup" responses
jest.mock('../../services/users', () => ({
  findUserByEmail: jest.fn(),
}));

import { findUserByEmail } from '../../services/users';

const mockFindUserByEmail = findUserByEmail as jest.MockedFunction<
  typeof findUserByEmail
>;

describe('sendInvitation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw if target user is not found', async () => {
    mockFindUserByEmail.mockResolvedValueOnce(null);

    await expect(
      sendInvitation('from-uid', 'from@test.com', {
        toEmail: 'nobody@test.com',
        cardId: 'card-1',
        cardTitle: 'Test Card',
      }),
    ).rejects.toThrow('No Pisilist account found');
  });

  it('should throw if user tries to invite themselves', async () => {
    mockFindUserByEmail.mockResolvedValueOnce({
      uid: 'from-uid',
      email: 'from@test.com',
      displayName: 'Sender',
    });

    await expect(
      sendInvitation('from-uid', 'from@test.com', {
        toEmail: 'from@test.com',
        cardId: 'card-1',
        cardTitle: 'Test Card',
      }),
    ).rejects.toThrow('You cannot invite yourself');
  });

  it('should create invitation when target user exists', async () => {
    mockFindUserByEmail.mockResolvedValueOnce({
      uid: 'target-uid',
      email: 'target@test.com',
      displayName: 'Target',
    });

    const id = await sendInvitation('from-uid', 'from@test.com', {
      toEmail: 'target@test.com',
      cardId: 'card-1',
      cardTitle: 'Test Card',
    });

    expect(typeof id).toBe('string');
    expect(id).toBe('mock-doc-id');
  });
});

describe('acceptInvitation', () => {
  it('should resolve without error', async () => {
    await expect(
      acceptInvitation('inv-1', 'user-1', 'card-1'),
    ).resolves.toBeUndefined();
  });
});

describe('declineInvitation', () => {
  it('should resolve without error', async () => {
    await expect(
      declineInvitation('inv-1'),
    ).resolves.toBeUndefined();
  });
});

describe('onPendingInvitations', () => {
  it('should return an unsubscribe function', () => {
    const callback = jest.fn();
    const unsubscribe = onPendingInvitations('test@test.com', callback);

    expect(typeof unsubscribe).toBe('function');
    // Should not throw when called
    expect(() => unsubscribe()).not.toThrow();
  });
});
