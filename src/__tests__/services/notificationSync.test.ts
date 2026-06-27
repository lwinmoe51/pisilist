/**
 * Notification Sync Engine tests.
 *
 * Verifies that syncLocalNotifications correctly cancels stale
 * timers and re-schedules only future reminders.
 */

import {
  scheduleNotificationAsync,
  cancelScheduledNotificationAsync,
  resetAllNotificationsMocks,
} from '../__mocks__/expo-notifications';

import {
  syncLocalNotifications,
  cancelAllScheduledReminders,
  getScheduledCount,
  resetSyncState,
} from '../../services/notificationSync';

import type { Task } from '../../types';

beforeEach(() => {
  resetAllNotificationsMocks();
  resetSyncState();
});

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    text: 'Buy groceries',
    completed: false,
    assignee: null,
    reminders: [],
    createdAt: new Date(),
    order: 0,
    ...overrides,
  };
}

function makeReminder(id: string, timestamp: Date) {
  return { id, timestamp };
}

// ── syncLocalNotifications ──────────────────────────────────────────

describe('syncLocalNotifications', () => {
  it('should schedule future reminders', async () => {
    const future = new Date(Date.now() + 3600000); // 1 hour
    const task = makeTask({
      reminders: [makeReminder('rem-1', future)],
    });

    await syncLocalNotifications([task], 'My Card');

    expect(scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    expect(getScheduledCount()).toBe(1);
  });

  it('should skip expired reminders', async () => {
    const past = new Date(Date.now() - 3600000); // 1 hour ago
    const task = makeTask({
      reminders: [makeReminder('rem-past', past)],
    });

    await syncLocalNotifications([task], 'My Card');

    expect(scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(getScheduledCount()).toBe(0);
  });

  it('should cancel old reminders before re-scheduling', async () => {
    const future1 = new Date(Date.now() + 3600000);
    const task1 = makeTask({
      reminders: [makeReminder('rem-1', future1)],
    });

    // First sync — schedules 1
    await syncLocalNotifications([task1], 'Card');
    expect(scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    expect(cancelScheduledNotificationAsync).toHaveBeenCalledTimes(0);

    // Reset mocks to isolate second sync
    (cancelScheduledNotificationAsync as jest.Mock).mockClear();
    (scheduleNotificationAsync as jest.Mock).mockClear();

    // Second sync — cancels old, schedules new
    const future2 = new Date(Date.now() + 7200000);
    const task2 = makeTask({
      id: 'task-2',
      reminders: [makeReminder('rem-2', future2)],
    });

    await syncLocalNotifications([task2], 'Card');

    // Should have cancelled the old notification
    expect(cancelScheduledNotificationAsync).toHaveBeenCalledTimes(1);
    // Should have scheduled the new one
    expect(scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    expect(getScheduledCount()).toBe(1);
  });

  it('should handle mixed future and expired reminders', async () => {
    const past = new Date(Date.now() - 3600000);
    const future = new Date(Date.now() + 3600000);
    const task = makeTask({
      reminders: [
        makeReminder('rem-past', past),
        makeReminder('rem-future', future),
      ],
    });

    await syncLocalNotifications([task], 'Card');

    // Only the future one should be scheduled
    expect(scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    expect(getScheduledCount()).toBe(1);
  });

  it('should handle tasks with no reminders', async () => {
    const task = makeTask({ reminders: [] });

    await syncLocalNotifications([task], 'Card');

    expect(scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(getScheduledCount()).toBe(0);
  });

  it('should handle empty task list', async () => {
    await syncLocalNotifications([], 'Card');

    expect(scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(getScheduledCount()).toBe(0);
  });

  it('should handle multiple tasks with multiple reminders', async () => {
    const future1 = new Date(Date.now() + 3600000);
    const future2 = new Date(Date.now() + 7200000);
    const future3 = new Date(Date.now() + 10800000);

    const tasks = [
      makeTask({
        id: 'task-1',
        reminders: [
          makeReminder('rem-1a', future1),
          makeReminder('rem-1b', future2),
        ],
      }),
      makeTask({
        id: 'task-2',
        reminders: [makeReminder('rem-2a', future3)],
      }),
    ];

    await syncLocalNotifications(tasks, 'Card');

    expect(scheduleNotificationAsync).toHaveBeenCalledTimes(3);
    expect(getScheduledCount()).toBe(3);
  });
});

// ── cancelAllScheduledReminders ─────────────────────────────────────

describe('cancelAllScheduledReminders', () => {
  it('should cancel all scheduled notifications', async () => {
    const future1 = new Date(Date.now() + 3600000);
    const future2 = new Date(Date.now() + 7200000);
    const task = makeTask({
      reminders: [
        makeReminder('rem-1', future1),
        makeReminder('rem-2', future2),
      ],
    });

    await syncLocalNotifications([task], 'Card');
    expect(getScheduledCount()).toBe(2);

    // Reset mock to only count cancelAllScheduledReminders calls
    (cancelScheduledNotificationAsync as jest.Mock).mockClear();

    await cancelAllScheduledReminders();

    expect(cancelScheduledNotificationAsync).toHaveBeenCalledTimes(2);
    expect(getScheduledCount()).toBe(0);
  });

  it('should handle empty state gracefully', async () => {
    await cancelAllScheduledReminders();

    expect(cancelScheduledNotificationAsync).not.toHaveBeenCalled();
    expect(getScheduledCount()).toBe(0);
  });
});
