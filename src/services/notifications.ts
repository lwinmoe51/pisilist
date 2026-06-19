import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Configure notification behavior for the app.
 * Call once on app startup (from App.tsx or notifications service init).
 */
export async function setupNotifications(): Promise<boolean> {
  // Configure how notifications are displayed when app is in foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  // Request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Notification permissions not granted');
    return false;
  }

  // Android channel (required for Android 8+)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Task Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return true;
}

/**
 * Schedule a local push notification for a task reminder.
 * Returns the notification identifier.
 */
export async function scheduleReminder(
  taskId: string,
  cardTitle: string,
  taskText: string,
  timestamp: Date,
): Promise<string> {
  // Don't schedule reminders in the past
  const now = new Date();
  if (timestamp <= now) return '';

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `⏰ Reminder: ${cardTitle}`,
      body: taskText,
      data: { taskId, type: 'reminder' },
      sound: true,
      ...(Platform.OS === 'android' ? { channelId: 'reminders' } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: timestamp,
    },
  });

  return id;
}

/**
 * Cancel a single scheduled notification by its identifier.
 */
export async function cancelReminder(
  notificationId: string,
): Promise<void> {
  if (!notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel all scheduled reminders for a task.
 * Pass the notification IDs stored on the task's reminders.
 */
export async function cancelAllRemindersForTask(
  notificationIds: string[],
): Promise<void> {
  await Promise.all(
    notificationIds
      .filter(Boolean)
      .map((id) => Notifications.cancelScheduledNotificationAsync(id)),
  );
}
