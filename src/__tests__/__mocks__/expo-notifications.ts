/**
 * Spy-enhanced mock of expo-notifications for API contract tests.
 */

export interface NotificationBehavior {
  shouldShowAlert: boolean;
  shouldPlaySound: boolean;
  shouldSetBadge: boolean;
  priority?: 'default' | 'high' | 'low';
}

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

export const setNotificationHandler = jest.fn(
  (config: { handleNotification: (notification: any) => Promise<NotificationBehavior> }) => {
    handler = config.handleNotification;
  },
);

export const getNotificationHandler = jest.fn(() => handler);

export const getPermissionsAsync = jest.fn(() =>
  Promise.resolve({ status: 'granted', granted: true }),
);

export const requestPermissionsAsync = jest.fn(() =>
  Promise.resolve({ status: 'granted', granted: true }),
);

export const setNotificationChannelAsync = jest.fn(
  (_channelId: string, _config: any) => Promise.resolve(null),
);

export const scheduleNotificationAsync = jest.fn((_config: any) => {
  nextId++;
  return Promise.resolve(`notif-${nextId}`);
});

export const cancelScheduledNotificationAsync = jest.fn(
  (_notificationId: string) => Promise.resolve(),
);

export const cancelAllScheduledNotificationsAsync = jest.fn(() =>
  Promise.resolve(),
);

export const getScheduledNotificationsAsync = jest.fn(() =>
  Promise.resolve([]),
);

/** Reset all mock call history and implementation chains between tests. */
export function resetAllNotificationsMocks(): void {
  handler = null;
  nextId = 0;

  setNotificationHandler.mockReset();
  getNotificationHandler.mockReset();
  getPermissionsAsync.mockReset();
  requestPermissionsAsync.mockReset();
  setNotificationChannelAsync.mockReset();
  scheduleNotificationAsync.mockReset();
  cancelScheduledNotificationAsync.mockReset();
  cancelAllScheduledNotificationsAsync.mockReset();
  getScheduledNotificationsAsync.mockReset();

  // Re-apply defaults
  setNotificationHandler.mockImplementation(
    (config: { handleNotification: (notification: any) => Promise<NotificationBehavior> }) => {
      handler = config.handleNotification;
    },
  );
  getNotificationHandler.mockImplementation(() => handler);
  getPermissionsAsync.mockResolvedValue({ status: 'granted', granted: true });
  requestPermissionsAsync.mockResolvedValue({ status: 'granted', granted: true });
  setNotificationChannelAsync.mockResolvedValue(null);
  scheduleNotificationAsync.mockImplementation((_config: any) => {
    nextId++;
    return Promise.resolve(`notif-${nextId}`);
  });
  cancelScheduledNotificationAsync.mockResolvedValue(undefined);
  cancelAllScheduledNotificationsAsync.mockResolvedValue(undefined);
  getScheduledNotificationsAsync.mockResolvedValue([]);
}
