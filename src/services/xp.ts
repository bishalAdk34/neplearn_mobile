import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PersistStorage } from 'zustand/middleware';
import { addXp, type XpSource } from './db';
import { recordActivity } from './streak';
import { useVocabStore } from '../data/vocab';
import { useSettingsStore } from '../stores/settings';
import { useStatsStore } from '../stores/stats';

const todayStr = () => new Date().toISOString().split('T')[0];

type DailyXpState = {
  daily: Record<string, { date: string; xp: number }>;
  addToday: (userId: string, amount: number) => void;
  getTodayXp: (userId: string) => number;
};

const asyncStorage: PersistStorage<DailyXpState> = {
  getItem: async (name) => {
    const val = await AsyncStorage.getItem(name);
    return val ? JSON.parse(val) : null;
  },
  setItem: async (name, value) => {
    await AsyncStorage.setItem(name, JSON.stringify(value));
  },
  removeItem: async (name) => {
    await AsyncStorage.removeItem(name);
  },
};

export const useDailyXpStore = create<DailyXpState>()(
  persist(
    (set, get) => ({
      daily: {},
      addToday: (userId, amount) => {
        const today = todayStr();
        const entry = get().daily[userId];
        const xp = entry && entry.date === today ? entry.xp + amount : amount;
        set({ daily: { ...get().daily, [userId]: { date: today, xp } } });
      },
      getTodayXp: (userId) => {
        const entry = get().daily[userId];
        return entry && entry.date === todayStr() ? entry.xp : 0;
      },
    }),
    {
      name: 'nepali-daily-xp',
      storage: asyncStorage,
    }
  )
);

/**
 * Award XP: updates today's tally (daily goal), routes to local store for
 * guests or Supabase for signed-in users, and records streak activity.
 */
export async function awardXp(userId: string, amount: number, source: XpSource): Promise<void> {
  useDailyXpStore.getState().addToday(userId, amount);

  // Track days where the daily goal was hit
  const goal = useSettingsStore.getState().dailyGoalXp;
  if (useDailyXpStore.getState().getTodayXp(userId) >= goal) {
    useStatsStore.getState().recordGoalDay(userId, todayStr());
  }

  if (userId.startsWith('__guest__')) {
    useVocabStore.getState().addLocalXp(userId, amount);
  } else {
    await addXp(userId, amount, source);
  }

  await recordActivity(userId);
}
