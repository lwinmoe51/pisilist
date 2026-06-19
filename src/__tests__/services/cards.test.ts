import { Timestamp } from 'firebase/firestore';
import { docToCard, docToTask } from '../../services/cards';
import type { Card, Task } from '../../types';

describe('docToCard', () => {
  it('should convert a Firestore doc snapshot to a Card object', () => {
    const now = new Date();
    const firestoreTs = Timestamp.fromDate(now);

    const result = docToCard('card-abc', {
      title: 'My Test Card',
      ownerId: 'user-1',
      collaborators: ['user-2', 'user-3'],
      pinned: true,
      createdAt: firestoreTs,
      updatedAt: firestoreTs,
    });

    expect(result).toEqual<Card>({
      id: 'card-abc',
      title: 'My Test Card',
      ownerId: 'user-1',
      collaborators: ['user-2', 'user-3'],
      pinned: true,
      createdAt: now,
      updatedAt: now,
    });
  });

  it('should handle missing fields with defaults', () => {
    const firestoreTs = Timestamp.fromDate(new Date());

    const result = docToCard('empty-card', {
      createdAt: firestoreTs,
      updatedAt: firestoreTs,
    });

    expect(result).toEqual<Card>({
      id: 'empty-card',
      title: '',
      ownerId: '',
      collaborators: [],
      pinned: false,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  it('should handle null/undefined timestamps', () => {
    const result = docToCard('ts-test', {
      title: 'No Dates',
      createdAt: null,
      updatedAt: undefined,
    });

    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });
});

describe('docToTask', () => {
  it('should convert a Firestore subcollection doc to a Task', () => {
    const now = new Date();
    const firestoreTs = Timestamp.fromDate(now);

    const result = docToTask('task-1', {
      text: 'Buy groceries',
      completed: false,
      assignee: 'user-2@test.com',
      reminders: [
        { id: 'r1', timestamp: firestoreTs },
      ],
      createdAt: firestoreTs,
      order: 0,
    });

    expect(result).toEqual<Task>({
      id: 'task-1',
      text: 'Buy groceries',
      completed: false,
      assignee: 'user-2@test.com',
      reminders: [{ id: 'r1', timestamp: now }],
      createdAt: now,
      order: 0,
    });
  });

  it('should handle missing optional fields', () => {
    const firestoreTs = Timestamp.fromDate(new Date());

    const result = docToTask('minimal', {
      createdAt: firestoreTs,
    });

    expect(result).toEqual<Task>({
      id: 'minimal',
      text: '',
      completed: false,
      assignee: null,
      reminders: [],
      createdAt: expect.any(Date),
      order: 0,
    });
  });

  it('should handle empty reminders array', () => {
    const firestoreTs = Timestamp.fromDate(new Date());

    const result = docToTask('no-reminders', {
      text: 'Empty reminders',
      reminders: [],
      createdAt: firestoreTs,
      order: 2,
    });

    expect(result.reminders).toEqual([]);
    expect(result.text).toBe('Empty reminders');
    expect(result.order).toBe(2);
  });
});
