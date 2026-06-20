/**
 * Cards & Tasks service API contract tests.
 *
 * Verifies every Firestore SDK call — function, collection/doc paths,
 * document shapes, batch operation sequences, and return values.
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  writeBatch,
  query,
  where,
  orderBy,
  arrayUnion,
  serverTimestamp,
  increment,
  Timestamp,
  resetAllFirestoreMocks,
} from '../__mocks__/firebase-firestore';

import {
  createCard,
  updateCard,
  deleteCard,
  createTask,
  updateTask,
  toggleTask,
  deleteTask,
  addCollaborator,
  updateTaskReminders,
  ownedCardsQuery,
  collaboratedCardsQuery,
  tasksQuery,
  docToCard,
  docToTask,
} from '../../services/cards';

import type { Card, Task } from '../../types';

beforeEach(() => {
  resetAllFirestoreMocks();
  jest.clearAllMocks();
});

// ── Helpers ────────────────────────────────────────────────────────

/** Build a mock doc snapshot for getDocs return value. */
function mockDocSnap(id: string, data: Record<string, any>) {
  return { id, data: () => data, ref: { _type: 'docRef', path: `cards/${id}` } };
}

// ── createCard ─────────────────────────────────────────────────────

describe('createCard', () => {
  it('should call addDoc on the cards collection', async () => {
    await createCard('user-1', 'My Card');

    expect(addDoc).toHaveBeenCalledTimes(1);
    // First arg should be a collection reference for 'cards'
    expect(collection).toHaveBeenCalledWith(expect.any(Object), 'cards');
  });

  it('should create a card with correct document shape', async () => {
    (serverTimestamp as jest.Mock).mockReturnValue(
      Timestamp.fromDate(new Date('2026-06-19T12:00:00Z')),
    );

    await createCard('user-1', '  My Tasks  '); // trimmed

    const data = (addDoc as jest.Mock).mock.calls[0][1];
    expect(data.title).toBe('My Tasks');
    expect(data.ownerId).toBe('user-1');
    expect(data.collaborators).toEqual([]);
    expect(data.pinned).toBe(false);
    expect(data.taskCount).toBe(0);
    expect(data.completedCount).toBe(0);
    expect(data.createdAt).toBeDefined();
    expect(data.updatedAt).toBeDefined();
  });

  it('should use "Untitled" for empty title', async () => {
    await createCard('user-1', '   ');

    const data = (addDoc as jest.Mock).mock.calls[0][1];
    expect(data.title).toBe('Untitled');
  });

  it('should return the new document ID', async () => {
    (addDoc as jest.Mock).mockResolvedValueOnce({ id: 'card-xyz' });

    const id = await createCard('user-1', 'Test');
    expect(id).toBe('card-xyz');
  });
});

// ── updateCard ─────────────────────────────────────────────────────

describe('updateCard', () => {
  it('should call updateDoc on the card document ref', async () => {
    await updateCard('card-1', { title: 'Updated Title' });

    expect(doc).toHaveBeenCalledWith(expect.any(Object), 'cards', 'card-1');
    expect(updateDoc).toHaveBeenCalledTimes(1);
    expect(updateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ _type: 'doc', path: 'cards/card-1' }),
      expect.objectContaining({ title: 'Updated Title', updatedAt: expect.any(Object) }),
    );
  });

  it('should include pinned in update data', async () => {
    await updateCard('card-1', { pinned: true });

    const data = (updateDoc as jest.Mock).mock.calls[0][1];
    expect(data.pinned).toBe(true);
  });

  it('should always set updatedAt server timestamp', async () => {
    await updateCard('card-1', { title: 'Hi' });

    expect(serverTimestamp).toHaveBeenCalled();
  });
});

// ── deleteCard ─────────────────────────────────────────────────────

describe('deleteCard', () => {
  it('should fetch all tasks in the subcollection', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      empty: true,
      docs: [],
    });

    await deleteCard('card-1');

    // Should query tasks subcollection
    expect(collection).toHaveBeenCalledWith(
      expect.any(Object), 'cards', 'card-1', 'tasks',
    );
  });

  it('should delete all tasks and the card in a single batch', async () => {
    const taskSnaps = [
      mockDocSnap('task-1', { text: 'A' }),
      mockDocSnap('task-2', { text: 'B' }),
    ];
    (getDocs as jest.Mock).mockResolvedValueOnce({
      empty: false,
      docs: taskSnaps,
    });

    await deleteCard('card-1');

    // Batch was created
    const batch = (writeBatch as jest.Mock).mock.results[0].value;
    expect(batch.delete).toHaveBeenCalledTimes(3); // 2 tasks + 1 card
    expect(batch.commit).toHaveBeenCalledTimes(1);
  });

  it('should only delete the card when there are no tasks', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      empty: true,
      docs: [],
    });

    await deleteCard('card-1');

    const batch = (writeBatch as jest.Mock).mock.results[0].value;
    expect(batch.delete).toHaveBeenCalledTimes(1); // card only
    expect(batch.commit).toHaveBeenCalledTimes(1);
  });
});

// ── createTask ─────────────────────────────────────────────────────

describe('createTask', () => {
  it('should query tasks for max order', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({ empty: true, docs: [] });

    await createTask('card-1', 'New task');

    expect(query).toHaveBeenCalled();
    expect(orderBy).toHaveBeenCalledWith('order', 'desc');
  });

  it('should create task with correct shape and order = max+1', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      empty: false,
      docs: [mockDocSnap('t1', { order: 5 })],
    });

    await createTask('card-1', '  Buy milk  ');

    const taskData = (addDoc as jest.Mock).mock.calls[0][1];
    expect(taskData.text).toBe('Buy milk');
    expect(taskData.completed).toBe(false);
    expect(taskData.assignee).toBeNull();
    expect(taskData.reminders).toEqual([]);
    expect(taskData.order).toBe(6);
  });

  it('should start order at 0 when no tasks exist', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      empty: true,
      docs: [],
    });

    await createTask('card-1', 'First task');

    const taskData = (addDoc as jest.Mock).mock.calls[0][1];
    expect(taskData.order).toBe(0);
  });

  it('should increment card taskCount after creating task', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      empty: true,
      docs: [],
    });

    await createTask('card-1', 'Task');

    // updateDoc on card with increment(1)
    expect(increment).toHaveBeenCalledWith(1);
    const cardUpdate = (updateDoc as jest.Mock).mock.calls[0][1];
    expect(cardUpdate.taskCount).toBe(1); // increment returns the number
    expect(cardUpdate.updatedAt).toBeDefined();
  });

  it('should return the new task ID', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      empty: true,
      docs: [],
    });
    (addDoc as jest.Mock).mockResolvedValueOnce({ id: 'task-xyz' });

    const id = await createTask('card-1', 'Task');
    expect(id).toBe('task-xyz');
  });
});

// ── updateTask ─────────────────────────────────────────────────────

describe('updateTask', () => {
  it('should call updateDoc on the task document', async () => {
    await updateTask('card-1', 'task-1', { text: 'Updated text' });

    expect(doc).toHaveBeenCalledWith(
      expect.any(Object), 'cards', 'card-1', 'tasks', 'task-1',
    );
    expect(updateDoc).toHaveBeenCalledWith(
      expect.any(Object),
      { text: 'Updated text' },
    );
  });

  it('should pass assignee in update data', async () => {
    await updateTask('card-1', 'task-1', {
      text: 'A',
      assignee: 'collab@test.com',
    });

    const data = (updateDoc as jest.Mock).mock.calls[0][1];
    expect(data.assignee).toBe('collab@test.com');
    expect(data.text).toBe('A');
  });

  it('should allow null assignee for unassign', async () => {
    await updateTask('card-1', 'task-1', { assignee: null });

    const data = (updateDoc as jest.Mock).mock.calls[0][1];
    expect(data.assignee).toBeNull();
  });
});

// ── toggleTask ─────────────────────────────────────────────────────

describe('toggleTask', () => {
  it('should use a batch to update task + card atomically', async () => {
    await toggleTask('card-1', 'task-1', true); // mark completed

    const batch = (writeBatch as jest.Mock).mock.results[0].value;
    expect(batch.update).toHaveBeenCalledTimes(2);
    expect(batch.commit).toHaveBeenCalledTimes(1);
  });

  it('should set completed=true on the task and increment card completedCount', async () => {
    await toggleTask('card-1', 'task-1', true);

    const batch = (writeBatch as jest.Mock).mock.results[0].value;
    const taskCall = batch.update.mock.calls[0];
    const cardCall = batch.update.mock.calls[1];

    expect(taskCall[1]).toEqual({ completed: true });
    expect(increment).toHaveBeenCalledWith(1);
    expect(cardCall[1].completedCount).toBe(1);
  });

  it('should set completed=false and decrement card completedCount', async () => {
    await toggleTask('card-1', 'task-1', false);

    const batch = (writeBatch as jest.Mock).mock.results[0].value;
    const taskCall = batch.update.mock.calls[0];

    expect(taskCall[1]).toEqual({ completed: false });
    expect(increment).toHaveBeenCalledWith(-1);
  });
});

// ── deleteTask ─────────────────────────────────────────────────────

describe('deleteTask', () => {
  it('should batch-delete the task and decrement card taskCount', async () => {
    await deleteTask('card-1', 'task-1', false); // was not completed

    const batch = (writeBatch as jest.Mock).mock.results[0].value;
    expect(batch.delete).toHaveBeenCalledTimes(1); // task
    expect(batch.update).toHaveBeenCalledTimes(1); // card

    const cardUpdate = batch.update.mock.calls[0][1];
    expect(cardUpdate.taskCount).toBe(-1); // increment(-1)
    expect(cardUpdate.completedCount).toBeUndefined(); // was not completed
  });

  it('should also decrement completedCount when task was completed', async () => {
    await deleteTask('card-1', 'task-1', true); // was completed

    const batch = (writeBatch as jest.Mock).mock.results[0].value;
    const cardUpdate = batch.update.mock.calls[0][1];

    expect(cardUpdate.taskCount).toBe(-1);
    expect(cardUpdate.completedCount).toBe(-1);
  });

  it('should commit the batch', async () => {
    await deleteTask('card-1', 'task-1', false);

    const batch = (writeBatch as jest.Mock).mock.results[0].value;
    expect(batch.commit).toHaveBeenCalledTimes(1);
  });
});

// ── addCollaborator ────────────────────────────────────────────────

describe('addCollaborator', () => {
  it('should call updateDoc with arrayUnion on the card', async () => {
    await addCollaborator('card-1', 'user-2');

    expect(arrayUnion).toHaveBeenCalledWith('user-2');
    expect(doc).toHaveBeenCalledWith(
      expect.any(Object), 'cards', 'card-1',
    );
    expect(updateDoc).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        collaborators: ['user-2'], // arrayUnion returns the items
        updatedAt: expect.any(Object),
      }),
    );
  });
});

// ── updateTaskReminders ────────────────────────────────────────────

describe('updateTaskReminders', () => {
  it('should call updateDoc with reminders array on the task doc', async () => {
    const reminders = [
      { id: 'r1', timestamp: new Date('2026-06-20T10:00:00Z') },
      { id: 'r2', timestamp: new Date('2026-06-21T14:00:00Z') },
    ];

    await updateTaskReminders('card-1', 'task-1', reminders);

    expect(doc).toHaveBeenCalledWith(
      expect.any(Object), 'cards', 'card-1', 'tasks', 'task-1',
    );
    expect(updateDoc).toHaveBeenCalledWith(
      expect.any(Object),
      { reminders },
    );
  });

  it('should work with an empty reminders array', async () => {
    await updateTaskReminders('card-1', 'task-1', []);

    const data = (updateDoc as jest.Mock).mock.calls[0][1];
    expect(data.reminders).toEqual([]);
  });
});

// ── Queries ────────────────────────────────────────────────────────

describe('ownedCardsQuery', () => {
  it('should query with where ownerId == uid and orderBy updatedAt desc', () => {
    ownedCardsQuery('user-1');

    expect(collection).toHaveBeenCalledWith(expect.any(Object), 'cards');
    expect(where).toHaveBeenCalledWith('ownerId', '==', 'user-1');
    expect(orderBy).toHaveBeenCalledWith('updatedAt', 'desc');
    expect(query).toHaveBeenCalled();
  });
});

describe('collaboratedCardsQuery', () => {
  it('should query with where collaborators array-contains uid', () => {
    collaboratedCardsQuery('user-2');

    expect(where).toHaveBeenCalledWith('collaborators', 'array-contains', 'user-2');
    expect(orderBy).toHaveBeenCalledWith('updatedAt', 'desc');
  });
});

describe('tasksQuery', () => {
  it('should query tasks subcollection ordered by order asc', () => {
    tasksQuery('card-1');

    expect(collection).toHaveBeenCalledWith(
      expect.any(Object), 'cards', 'card-1', 'tasks',
    );
    expect(orderBy).toHaveBeenCalledWith('order', 'asc');
  });
});

// ── docToCard ──────────────────────────────────────────────────────

describe('docToCard', () => {
  it('should convert a full Firestore doc to a Card', () => {
    const ts = Timestamp.fromDate(new Date('2026-06-19T12:00:00Z'));

    const result = docToCard('card-abc', {
      title: 'My Card',
      ownerId: 'user-1',
      collaborators: ['user-2', 'user-3'],
      pinned: true,
      color: '#e8f0fe',
      createdAt: ts,
      updatedAt: ts,
    });

    expect(result).toEqual<Card>({
      id: 'card-abc',
      title: 'My Card',
      ownerId: 'user-1',
      collaborators: ['user-2', 'user-3'],
      pinned: true,
      color: '#e8f0fe',
      createdAt: ts.toDate(),
      updatedAt: ts.toDate(),
    });
  });

  it('should default missing fields', () => {
    const ts = Timestamp.fromDate(new Date());

    const result = docToCard('empty', {
      createdAt: ts,
      updatedAt: ts,
    });

    expect(result.title).toBe('');
    expect(result.ownerId).toBe('');
    expect(result.collaborators).toEqual([]);
    expect(result.pinned).toBe(false);
    expect(result.color).toBeNull();
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('should handle null/undefined timestamps by returning a Date', () => {
    const result = docToCard('ts-test', {
      title: 'No Dates',
      createdAt: null,
      updatedAt: undefined,
    });

    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('should handle plain Date timestamps (not Firestore Timestamp)', () => {
    const plain = new Date('2026-01-15T08:00:00Z');

    const result = docToCard('plain-ts', {
      title: 'Plain',
      createdAt: plain,
      updatedAt: plain,
    });

    expect(result.createdAt).toEqual(plain);
    expect(result.updatedAt).toEqual(plain);
  });
});

// ── docToTask ──────────────────────────────────────────────────────

describe('docToTask', () => {
  it('should convert a full Firestore doc to a Task', () => {
    const ts = Timestamp.fromDate(new Date('2026-06-19T09:00:00Z'));
    const remTs = Timestamp.fromDate(new Date('2026-06-20T10:00:00Z'));

    const result = docToTask('task-1', {
      text: 'Buy groceries',
      completed: false,
      assignee: 'user-2@test.com',
      reminders: [{ id: 'r1', timestamp: remTs }],
      createdAt: ts,
      order: 3,
    });

    expect(result).toEqual<Task>({
      id: 'task-1',
      text: 'Buy groceries',
      completed: false,
      assignee: 'user-2@test.com',
      reminders: [{ id: 'r1', timestamp: remTs.toDate() }],
      createdAt: ts.toDate(),
      order: 3,
    });
  });

  it('should default missing fields', () => {
    const ts = Timestamp.fromDate(new Date());

    const result = docToTask('minimal', { createdAt: ts });

    expect(result.text).toBe('');
    expect(result.completed).toBe(false);
    expect(result.assignee).toBeNull();
    expect(result.reminders).toEqual([]);
    expect(result.order).toBe(0);
  });

  it('should convert reminder timestamps from Firestore Timestamp to Date', () => {
    const ts = Timestamp.fromDate(new Date());
    const remTs = Timestamp.fromDate(new Date('2026-06-21T15:00:00Z'));

    const result = docToTask('with-rem', {
      text: 'Reminder task',
      reminders: [{ id: 'r1', timestamp: remTs }],
      createdAt: ts,
      order: 1,
    });

    expect(result.reminders[0].timestamp).toBeInstanceOf(Date);
    expect(result.reminders[0].timestamp).toEqual(remTs.toDate());
  });

  it('should handle plain Date timestamps in reminders', () => {
    const ts = Timestamp.fromDate(new Date());
    const plain = new Date('2026-07-01T12:00:00Z');

    const result = docToTask('plain-rem', {
      text: 'Plain reminder',
      reminders: [{ id: 'x', timestamp: plain }],
      createdAt: ts,
      order: 0,
    });

    expect(result.reminders[0].timestamp).toEqual(plain);
  });
});
