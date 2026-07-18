import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { vocab } from '../data/vocab';

const STORAGE_KEY = 'nepali-notifications';
const LOG_KEY = 'nepali-notification-log';
const DAILY_REMINDER_ID = 'daily-practice-reminder';
const WORD_OF_DAY_ID = 'word-of-day';
const LOG_LIMIT = 50;

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
  wordOfDayEnabled: boolean;
  wordOfDayHour: number;
};

const NEPAL_TIMEZONE = 'Asia/Kathmandu';

const defaultPrefs: NotificationPrefs = {
  enabled: false,
  reminderHour: 17,
  reminderMinute: 35,
  wordOfDayEnabled: false,
  wordOfDayHour: 9,
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
  try {
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
  } catch (e) {
    console.warn('requestPermissions failed:', e);
    return false;
  }
}

function reminderContent(streakDays: number): { title: string; body: string } {
  if (streakDays >= 30) {
    return {
      title: `🔥 ${streakDays}-day streak!`,
      body: 'A month of dedication! A few minutes of Nepali today keeps the flame burning.',
    };
  }
  if (streakDays >= 7) {
    return {
      title: `🔥 ${streakDays}-day streak — keep going!`,
      body: `Do not break your ${streakDays}-day streak. A quick review is all it takes.`,
    };
  }
  if (streakDays >= 2) {
    return {
      title: `You're on a ${streakDays}-day streak!`,
      body: 'Practice your Nepali today and keep the momentum going.',
    };
  }
  return {
    title: 'Time to practice!',
    body: 'Keep your streak alive — practice your Nepali vocabulary today.',
  };
}

export async function scheduleDailyReminder(hour: number, minute: number, streakDays = 0): Promise<void> {
  try {
    const Notifications = await getNotifications();
    if (!Notifications) return;

    await cancelDailyReminder();
    const content = reminderContent(streakDays);
    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_REMINDER_ID,
      content: {
        title: content.title,
        body: content.body,
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
  } catch (e) {
    console.warn('scheduleDailyReminder failed:', e);
  }
}

/** Re-schedule the daily reminder (if enabled) with fresh streak-aware copy. */
export async function refreshDailyReminder(streakDays: number): Promise<void> {
  const prefs = await getPrefs();
  if (!prefs.enabled) return;
  await scheduleDailyReminder(prefs.reminderHour, prefs.reminderMinute, streakDays);
}

/** Deterministic word for a given date: dayOfYear % vocab.length. */
function wordOfDayFor(date: Date): { english: string; nepali: string; roman: string } {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86400000);
  return vocab[dayOfYear % vocab.length];
}

export async function scheduleWordOfDay(hour: number): Promise<void> {
  try {
    const Notifications = await getNotifications();
    if (!Notifications) return;

    await cancelWordOfDay();

    const now = new Date();
    const target = new Date(now);
    if (now.getHours() >= hour) target.setDate(target.getDate() + 1);
    const word = wordOfDayFor(target);

    await Notifications.scheduleNotificationAsync({
      identifier: WORD_OF_DAY_ID,
      content: {
        title: `📖 Word of the day: ${word.english}`,
        body: `${word.nepali} (${word.roman}) — open NepLearn to practice it!`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute: 0,
        repeats: true,
        timezone: NEPAL_TIMEZONE,
      },
    });
  } catch (e) {
    console.warn('scheduleWordOfDay failed:', e);
  }
}

export async function cancelWordOfDay(): Promise<void> {
  try {
    const Notifications = await getNotifications();
    if (!Notifications) return;

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    if (scheduled.some(n => n.identifier === WORD_OF_DAY_ID)) {
      await Notifications.cancelScheduledNotificationAsync(WORD_OF_DAY_ID);
    }
  } catch (e) {
    console.warn('cancelWordOfDay failed:', e);
  }
}

/** Re-bake word-of-day content (if enabled) so the repeating trigger carries a fresh word. */
export async function refreshWordOfDay(): Promise<void> {
  const prefs = await getPrefs();
  if (!prefs.wordOfDayEnabled) return;
  await scheduleWordOfDay(prefs.wordOfDayHour);
}

export type ScheduledReminder = {
  identifier: string;
  title: string;
  body: string;
  hour: number | null;
  minute: number | null;
};

export async function getScheduledReminders(): Promise<ScheduledReminder[]> {
  const Notifications = await getNotifications();
  if (!Notifications) return [];

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.map(n => {
    const trigger = n.trigger as { hour?: number; minute?: number } | null;
    return {
      identifier: n.identifier,
      title: n.content.title ?? 'Reminder',
      body: n.content.body ?? '',
      hour: trigger?.hour ?? null,
      minute: trigger?.minute ?? null,
    };
  });
}

export type NotificationLogEntry = {
  id: string;
  title: string;
  body: string;
  receivedAt: string; // ISO
};

export async function getNotificationLog(): Promise<NotificationLogEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(LOG_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

async function appendNotificationLog(entry: NotificationLogEntry): Promise<void> {
  const log = await getNotificationLog();
  const next = [entry, ...log].slice(0, LOG_LIMIT);
  await AsyncStorage.setItem(LOG_KEY, JSON.stringify(next));
}

export async function clearNotificationLog(): Promise<void> {
  await AsyncStorage.removeItem(LOG_KEY);
}

/** Listen for delivered notifications and log them. Returns an unsubscribe fn. */
export async function initNotificationLogListener(): Promise<() => void> {
  const Notifications = await getNotifications();
  if (!Notifications) return () => {};

  const sub = Notifications.addNotificationReceivedListener(notification => {
    appendNotificationLog({
      id: notification.request.identifier + '-' + Date.now(),
      title: notification.request.content.title ?? 'Notification',
      body: notification.request.content.body ?? '',
      receivedAt: new Date().toISOString(),
    }).catch(() => {});
  });
  return () => sub.remove();
}

export async function cancelDailyReminder(): Promise<void> {
  try {
    const Notifications = await getNotifications();
    if (!Notifications) return;

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    if (scheduled.some(n => n.identifier === DAILY_REMINDER_ID)) {
      await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID);
    }
  } catch (e) {
    console.warn('cancelDailyReminder failed:', e);
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
  if (!Notifications) {
    throw new Error('expo-notifications is not available');
  }

  const granted = await requestPermissions();
  if (!granted) {
    throw new Error('Notification permission not granted');
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Namaste!',
      body: 'This is a test notification from NepLearn. Stay consistent with your practice!',
      sound: true,
    },
    trigger: null,
  });
}
