import { log, warn } from "../utils/logger";
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

// Store active web reminder timeouts so we can cancel them
const webTimers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Configure notification behavior for the app.
 * Call once on app startup (from App.tsx or notifications service init).
 */
export async function setupNotifications(): Promise<boolean> {
  if (isWeb) {
    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    log('[notifications] Web: using browser Notification API');
    return 'Notification' in window && Notification.permission === 'granted';
  }

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
    warn('Notification permissions not granted');
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
 * On web, uses setTimeout + browser Notification API.
 */
export async function scheduleReminder(
  taskId: string,
  cardTitle: string,
  taskText: string,
  timestamp: Date,
): Promise<string> {
  const now = new Date();
  if (timestamp <= now) return '';

  if (isWeb) {
    const id = `web-rem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const delay = timestamp.getTime() - now.getTime();

    log(`[notifications] Web: scheduling in ${Math.round(delay / 1000)}s —`, cardTitle);

    const timer = setTimeout(() => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`⏰ ${cardTitle}`, {
          body: taskText,
          icon: '/assets/icon.png',
        });
      }
      webTimers.delete(id);
    }, delay);

    webTimers.set(id, timer);
    return id;
  }

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

  if (isWeb) {
    const timer = webTimers.get(notificationId);
    if (timer) {
      clearTimeout(timer);
      webTimers.delete(notificationId);
    }
    return;
  }

  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel all scheduled reminders for a task.
 */
export async function cancelAllRemindersForTask(
  notificationIds: string[],
): Promise<void> {
  if (isWeb) {
    notificationIds.forEach((id) => {
      const timer = webTimers.get(id);
      if (timer) {
        clearTimeout(timer);
        webTimers.delete(id);
      }
    });
    return;
  }

  await Promise.all(
    notificationIds
      .filter(Boolean)
      .map((id) => Notifications.cancelScheduledNotificationAsync(id)),
  );
}
