import type { Card, Task, Reminder, Invitation, AppUser } from '../../types';

describe('Type interfaces — structural checks', () => {
  it('should accept a valid Card object', () => {
    const card: Card = {
      id: 'c1',
      title: 'Test Card',
      ownerId: 'u1',
      collaborators: ['u2'],
      pinned: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(card.id).toBe('c1');
    expect(card.pinned).toBe(true);
    expect(card.collaborators).toContain('u2');
  });

  it('should accept a valid Task with reminders', () => {
    const reminder: Reminder = {
      id: 'r1',
      timestamp: new Date('2026-06-20T09:00:00'),
    };

    const task: Task = {
      id: 't1',
      text: 'Do the thing',
      completed: false,
      assignee: 'collab@test.com',
      reminders: [reminder],
      createdAt: new Date(),
      order: 3,
    };

    expect(task.reminders).toHaveLength(1);
    expect(task.reminders[0].timestamp).toEqual(
      new Date('2026-06-20T09:00:00'),
    );
    expect(task.assignee).toBe('collab@test.com');
  });

  it('should accept a Task with null assignee and empty reminders', () => {
    const task: Task = {
      id: 't2',
      text: 'Simple task',
      completed: true,
      assignee: null,
      reminders: [],
      createdAt: new Date(),
      order: 0,
    };
    expect(task.completed).toBe(true);
    expect(task.assignee).toBeNull();
  });

  it('should accept a valid Invitation', () => {
    const inv: Invitation = {
      id: 'inv1',
      fromUserId: 'u1',
      fromEmail: 'owner@test.com',
      toEmail: 'friend@test.com',
      cardId: 'c1',
      cardTitle: 'Shared Card',
      status: 'pending',
      createdAt: new Date(),
    };
    expect(inv.status).toBe('pending');
  });

  it('should accept all Invitation statuses', () => {
    const statuses: Invitation['status'][] = [
      'pending',
      'accepted',
      'declined',
    ];
    expect(statuses).toHaveLength(3);
  });

  it('should accept a valid AppUser', () => {
    const user: AppUser = {
      uid: 'abc123',
      email: 'test@pisilist.com',
      displayName: 'Test User',
    };
    expect(user.uid).toBe('abc123');
    expect(user.email).toBe('test@pisilist.com');
  });

  it('should accept AppUser with null displayName', () => {
    const user: AppUser = {
      uid: 'abc',
      email: null,
      displayName: null,
    };
    expect(user.email).toBeNull();
  });
});
