import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'nepali-notifications';
const DAILY_REMINDER_ID = 'daily-practice-reminder';

let NotificationsModule: typeof import('expo-notifications') | null = null;

async function getNotifications() {
  if (!NotificationsModule) {
    try {
      NotificationsModule = await import('expo-notifications');
    } catch {
      return null;
    }
  }
  return NotificationsModule;
}

export type NotificationPrefs = {
  enabled: boolean;
  reminderHour: number;
  reminderMinute: number;
};

const NEPAL_TIMEZONE = 'Asia/Kathmandu';

const defaultPrefs: NotificationPrefs = {
  enabled: false,
  reminderHour: 17,
  reminderMinute: 35,
};

export async function getPrefs(): Promise<NotificationPrefs> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultPrefs, ...JSON.parse(raw) };
  } catch {}
  return defaultPrefs;
}

export async function savePrefs(prefs: NotificationPrefs): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export async function initNotifications() {
  const Notifications = await getNotifications();
  if (!Notifications) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export async function requestPermissions(): Promise<boolean> {
  const Notifications = await getNotifications();
  if (!Notifications) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const { status: s } = await Notifications.requestPermissionsAsync();
    status = s;
  }
  if (status !== 'granted') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Practice Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#800816',
    });
  }
  return true;
}

export async function scheduleDailyReminder(hour: number, minute: number): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) return;

  await cancelDailyReminder();
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: {
      title: 'Time to practice!',
      body: 'Keep your streak alive — practice your Nepali vocabulary today.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
      timezone: NEPAL_TIMEZONE,
    },
  });
}

export async function cancelDailyReminder(): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  if (scheduled.some(n => n.identifier === DAILY_REMINDER_ID)) {
    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID);
  }
}

export async function getScheduledCount(): Promise<number> {
  const Notifications = await getNotifications();
  if (!Notifications) return 0;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.length;
}

export async function sendTestNotification(): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Namaste!',
      body: 'This is a test notification from NepLearn. Stay consistent with your practice!',
      sound: true,
    },
    trigger: null,
  });
}
