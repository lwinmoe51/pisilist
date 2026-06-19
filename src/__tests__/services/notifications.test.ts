/**
 * Notifications service tests.
 *
 * expo-notifications is mocked via moduleNameMapper in jest.config.js
 */

import {
  setupNotifications,
  scheduleReminder,
  cancelReminder,
  cancelAllRemindersForTask,
} from '../../services/notifications';

describe('setupNotifications', () => {
  it('should return true when permissions granted', async () => {
    const result = await setupNotifications();
    expect(result).toBe(true);
  });

  it('should be a function', () => {
    expect(typeof setupNotifications).toBe('function');
  });
});

describe('scheduleReminder', () => {
  it('should schedule and return a notification ID', async () => {
    const future = new Date(Date.now() + 3600000); // 1 hour from now

    const id = await scheduleReminder(
      'task-1',
      'Test Card',
      'Buy groceries',
      future,
    );
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('should return empty string for past dates', async () => {
    const past = new Date(Date.now() - 3600000); // 1 hour ago

    const id = await scheduleReminder('task-2', 'Card', 'Old task', past);
    expect(id).toBe('');
  });
});

describe('cancelReminder', () => {
  it('should handle empty string gracefully', async () => {
    await expect(cancelReminder('')).resolves.toBeUndefined();
  });

  it('should cancel a scheduled notification', async () => {
    await expect(cancelReminder('notif-1')).resolves.toBeUndefined();
  });
});

describe('cancelAllRemindersForTask', () => {
  it('should cancel multiple notification IDs', async () => {
    await expect(
      cancelAllRemindersForTask(['notif-1', 'notif-2', 'notif-3']),
    ).resolves.toBeUndefined();
  });

  it('should handle empty array', async () => {
    await expect(cancelAllRemindersForTask([])).resolves.toBeUndefined();
  });
});
