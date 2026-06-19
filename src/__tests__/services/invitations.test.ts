/**
 * Invitations service API contract tests.
 *
 * Verifies Firestore SDK calls for sendInvitation, acceptInvitation,
 * declineInvitation, and onPendingInvitations.
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  writeBatch,
  query,
  where,
  orderBy,
  onSnapshot,
  arrayUnion,
  serverTimestamp,
  resetAllFirestoreMocks,
} from '../__mocks__/firebase-firestore';

import {
  sendInvitation,
  acceptInvitation,
  declineInvitation,
  onPendingInvitations,
} from '../../services/invitations';

// sendInvitation calls findUserByEmail from users service
import { findUserByEmail } from '../../services/users';
jest.mock('../../services/users', () => ({
  findUserByEmail: jest.fn(),
}));

beforeEach(() => {
  resetAllFirestoreMocks();
  (findUserByEmail as jest.Mock).mockReset();
});

// ── sendInvitation ────────────────────────────────────────────────

describe('sendInvitation', () => {
  it('should normalize email and look up target user', async () => {
    (findUserByEmail as jest.Mock).mockResolvedValueOnce({
      uid: 'target-uid',
      email: 'target@test.com',
      displayName: 'Target',
    });

    await sendInvitation('from-uid', 'from@test.com', {
      toEmail: '  TARGET@TEST.com  ',
      cardId: 'card-1',
      cardTitle: 'Shared Card',
    });

    expect(findUserByEmail).toHaveBeenCalledWith('target@test.com');
  });

  it('should throw when target user not registered', async () => {
    (findUserByEmail as jest.Mock).mockResolvedValueOnce(null);

    await expect(
      sendInvitation('from-uid', 'from@test.com', {
        toEmail: 'ghost@test.com',
        cardId: 'card-1',
        cardTitle: 'Card',
      }),
    ).rejects.toThrow('No Pisilist account found');
  });

  it('should throw when user tries to invite themselves', async () => {
    (findUserByEmail as jest.Mock).mockResolvedValueOnce({
      uid: 'from-uid', // same as sender
      email: 'from@test.com',
      displayName: 'Self',
    });

    await expect(
      sendInvitation('from-uid', 'from@test.com', {
        toEmail: 'from@test.com',
        cardId: 'card-1',
        cardTitle: 'Card',
      }),
    ).rejects.toThrow('You cannot invite yourself');
  });

  it('should create invitation doc with correct shape', async () => {
    (findUserByEmail as jest.Mock).mockResolvedValueOnce({
      uid: 'target-uid',
      email: 'target@test.com',
      displayName: 'Target',
    });

    await sendInvitation('from-uid', 'from@test.com', {
      toEmail: 'target@test.com',
      cardId: 'card-abc',
      cardTitle: 'Project Tasks',
    });

    expect(addDoc).toHaveBeenCalledTimes(1);
    const data = (addDoc as jest.Mock).mock.calls[0][1];

    expect(data.fromUserId).toBe('from-uid');
    expect(data.fromEmail).toBe('from@test.com');
    expect(data.toEmail).toBe('target@test.com');
    expect(data.cardId).toBe('card-abc');
    expect(data.cardTitle).toBe('Project Tasks');
    expect(data.status).toBe('pending');
    expect(data.createdAt).toBeDefined();
  });

  it('should return the invitation document ID', async () => {
    (findUserByEmail as jest.Mock).mockResolvedValueOnce({
      uid: 'target-uid',
      email: 't@t.com',
      displayName: 'T',
    });
    (addDoc as jest.Mock).mockResolvedValueOnce({ id: 'inv-xyz' });

    const id = await sendInvitation('f', 'f@f.com', {
      toEmail: 't@t.com',
      cardId: 'c',
      cardTitle: 'C',
    });

    expect(id).toBe('inv-xyz');
  });
});

// ── acceptInvitation ──────────────────────────────────────────────

describe('acceptInvitation', () => {
  it('should batch-update invitation status and add collaborator', async () => {
    await acceptInvitation('inv-1', 'user-1', 'card-1');

    expect(writeBatch).toHaveBeenCalledTimes(1);
    const batch = (writeBatch as jest.Mock).mock.results[0].value;

    // Update invitation status
    expect(batch.update).toHaveBeenCalledWith(
      expect.any(Object),
      { status: 'accepted' },
    );

    // Add collaborator to card
    expect(arrayUnion).toHaveBeenCalledWith('user-1');
    expect(batch.update).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ collaborators: ['user-1'] }),
    );

    expect(batch.commit).toHaveBeenCalledTimes(1);
  });

  it('should reference correct invitation and card docs', async () => {
    await acceptInvitation('inv-42', 'uid-99', 'card-77');

    // doc() called for invitation and card
    expect(doc).toHaveBeenCalledWith(expect.any(Object), 'invitations', 'inv-42');
    expect(doc).toHaveBeenCalledWith(expect.any(Object), 'cards', 'card-77');
  });
});

// ── declineInvitation ─────────────────────────────────────────────

describe('declineInvitation', () => {
  it('should update invitation status to declined', async () => {
    await declineInvitation('inv-5');

    expect(doc).toHaveBeenCalledWith(expect.any(Object), 'invitations', 'inv-5');
    expect(updateDoc).toHaveBeenCalledWith(
      expect.any(Object),
      { status: 'declined' },
    );
  });
});

// ── onPendingInvitations ──────────────────────────────────────────

describe('onPendingInvitations', () => {
  it('should query with correct filters and sorting', () => {
    onPendingInvitations('user@test.com', jest.fn());

    expect(collection).toHaveBeenCalledWith(expect.any(Object), 'invitations');
    expect(where).toHaveBeenCalledWith('toEmail', '==', 'user@test.com');
    expect(where).toHaveBeenCalledWith('status', '==', 'pending');
    expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    expect(query).toHaveBeenCalled();
  });

  it('should call onSnapshot with query and callbacks', () => {
    const callback = jest.fn();
    const onError = jest.fn();

    onPendingInvitations('u@t.com', callback, onError);

    expect(onSnapshot).toHaveBeenCalledTimes(1);
    expect(onSnapshot).toHaveBeenCalledWith(
      expect.any(Object), // query
      expect.any(Function), // onNext
      expect.any(Function), // onError
    );
  });

  it('should return the unsubscribe function', () => {
    const unsub = onPendingInvitations('u@t.com', jest.fn());
    expect(typeof unsub).toBe('function');
  });

  it('should map Firestore docs to Invitation objects when snapshot fires', () => {
    const callback = jest.fn();

    onPendingInvitations('u@t.com', callback);

    // Get the onNext handler that was passed to onSnapshot
    const onNext = (onSnapshot as jest.Mock).mock.calls[0][1];

    // Simulate a snapshot with docs
    const fakeTimestamp = { toDate: () => new Date('2026-06-19T12:00:00Z') };
    onNext({
      docs: [
        {
          id: 'inv-1',
          data: () => ({
            fromUserId: 'from-1',
            fromEmail: 'f1@test.com',
            toEmail: 'u@t.com',
            cardId: 'card-1',
            cardTitle: 'Card 1',
            status: 'pending',
            createdAt: fakeTimestamp,
          }),
        },
        {
          id: 'inv-2',
          data: () => ({
            fromUserId: 'from-2',
            fromEmail: 'f2@test.com',
            toEmail: 'u@t.com',
            cardId: 'card-2',
            cardTitle: 'Card 2',
            status: 'pending',
            createdAt: fakeTimestamp,
          }),
        },
      ],
    });

    expect(callback).toHaveBeenCalledTimes(1);
    const invitations = callback.mock.calls[0][0];
    expect(invitations).toHaveLength(2);
    expect(invitations[0].id).toBe('inv-1');
    expect(invitations[0].fromUserId).toBe('from-1');
    expect(invitations[0].cardTitle).toBe('Card 1');
    expect(invitations[0].status).toBe('pending');
    expect(invitations[0].createdAt).toBeInstanceOf(Date);
  });

  it('should default missing fields in Firestore docs', () => {
    const callback = jest.fn();
    onPendingInvitations('u@t.com', callback);
    const onNext = (onSnapshot as jest.Mock).mock.calls[0][1];

    onNext({
      docs: [
        {
          id: 'inv-minimal',
          data: () => ({ createdAt: { toDate: () => new Date() } }),
        },
      ],
    });

    const inv = callback.mock.calls[0][0][0];
    expect(inv.fromUserId).toBe('');
    expect(inv.fromEmail).toBe('');
    expect(inv.cardId).toBe('');
    expect(inv.cardTitle).toBe('');
    expect(inv.status).toBe('pending'); // default
  });
});
