/** Minimal mock of expo-notifications for unit tests. */

export const AndroidImportance = {
  HIGH: 'high',
  DEFAULT: 'default',
  LOW: 'low',
};

export const SchedulableTriggerInputTypes = {
  DATE: 'date',
  TIME_INTERVAL: 'timeInterval',
};

let handler: ((notification: any) => Promise<NotificationBehavior>) | null = null;
let nextId = 0;

export function setNotificationHandler(config: {
  handleNotification: (notification: any) => Promise<NotificationBehavior>;
}) {
  handler = config.handleNotification;
}

export function getNotificationHandler() {
  return handler;
}

export async function getPermissionsAsync() {
  return { status: 'granted', granted: true };
}

export async function requestPermissionsAsync() {
  return { status: 'granted', granted: true };
}

export async function setNotificationChannelAsync(
  channelId: string,
  config: any,
) {
  return null;
}

export async function scheduleNotificationAsync(config: any) {
  nextId++;
  return `notif-${nextId}`;
}

export async function cancelScheduledNotificationAsync(
  notificationId: string,
) {
  // no-op
}

export async function cancelAllScheduledNotificationsAsync() {
  // no-op
}

export async function getScheduledNotificationsAsync() {
  return [];
}
