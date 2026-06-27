/**
 * Notification Sync Engine
 *
 * Reactive layer that keeps local notifications in sync with Firestore
 * reminder data. When a reminder is added from another device, the
 * Firestore onSnapshot listener fires → this engine clears stale local
 * timers and re-schedules only future reminders.
 *
 * Works identically on Web (setTimeout) and Android (expo-notifications).
 */

import { log } from '../utils/logger';
import { scheduleReminder, cancelReminder } from './notifications';
import type { Task } from '../types';

// Track reminder.id → notificationId (or web timer id) for what's currently scheduled
const scheduledMap = new Map<string, string>();

/**
 * Sync local notifications to match the current Firestore state.
 *
 * For each task with reminders:
 * 1. Cancel ALL previously scheduled local notifications
 * 2. Filter out expired timestamps (<= now)
 * 3. Re-schedule only future reminders
 *
 * Call this whenever tasks snapshot changes (from onSnapshot).
 */
export async function syncLocalNotifications(
  tasks: Task[],
  cardTitle: string,
): Promise<void> {
  const now = new Date();

  // Step 1: Cancel everything currently scheduled
  for (const [reminderId, notifId] of scheduledMap) {
    await cancelReminder(notifId);
    scheduledMap.delete(reminderId);
  }

  // Step 2: Collect all future reminders across all tasks
  for (const task of tasks) {
    if (!task.reminders || task.reminders.length === 0) continue;

    for (const reminder of task.reminders) {
      const ts = reminder.timestamp instanceof Date
        ? reminder.timestamp
        : new Date(reminder.timestamp);

      // Skip expired reminders
      if (ts <= now) {
        log('[notificationSync] skipping expired reminder:', reminder.id);
        continue;
      }

      // Step 3: Schedule and track
      const notifId = await scheduleReminder(task.id, cardTitle, task.text, ts);
      if (notifId) {
        scheduledMap.set(reminder.id, notifId);
        log('[notificationSync] scheduled reminder:', reminder.id, '→', notifId);
      }
    }
  }
}

/**
 * Cancel all currently scheduled notifications.
 * Call on unmount or when the user logs out.
 */
export async function cancelAllScheduledReminders(): Promise<void> {
  for (const [reminderId, notifId] of scheduledMap) {
    await cancelReminder(notifId);
    scheduledMap.delete(reminderId);
  }
}

/**
 * Get the current scheduled map size (for testing/debugging).
 */
export function getScheduledCount(): number {
  return scheduledMap.size;
}

/**
 * Reset internal state (for testing only).
 */
export function resetSyncState(): void {
  scheduledMap.clear();
}
