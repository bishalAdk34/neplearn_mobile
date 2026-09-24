import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PersistStorage } from 'zustand/middleware';

const DAILY_LIMIT = 50;

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface UserQuota {
  date: string;
  count: number;
}

type AiQuotaState = {
  quotaByUser: Record<string, UserQuota>;
  customApiKey: string | null;
  getQuota: (userId: string) => { used: number; remaining: number; limit: number };
  consumeQuota: (userId: string) => boolean;
  hasCustomKey: () => boolean;
  setCustomApiKey: (key: string | null) => void;
  getEffectiveApiKey: (defaultKey: string) => string;
};

const asyncStorage: PersistStorage<AiQuotaState> = {
  getItem: async (name) => {
    const val = await AsyncStorage.getItem(name);
    if (!val) return null;
    try {
      return JSON.parse(val);
    } catch {
      return null;
    }
  },
  setItem: async (name, value) => {
    await AsyncStorage.setItem(name, JSON.stringify(value));
  },
  removeItem: async (name) => {
    await AsyncStorage.removeItem(name);
  },
};

export const useAiQuotaStore = create<AiQuotaState>()(
  persist(
    (set, get) => ({
      quotaByUser: {},
      customApiKey: null,

      getQuota: (userId: string) => {
        const today = getTodayDate();
        const quota = get().quotaByUser[userId];

        // Reset if new day
        if (!quota || quota.date !== today) {
          return { used: 0, remaining: DAILY_LIMIT, limit: DAILY_LIMIT };
        }

        return {
          used: quota.count,
          remaining: Math.max(0, DAILY_LIMIT - quota.count),
          limit: DAILY_LIMIT,
        };
      },

      consumeQuota: (userId: string) => {
        // If user has custom key, don't consume quota
        if (get().customApiKey) return true;

        const today = getTodayDate();
        const currentQuota = get().quotaByUser[userId];

        // Reset if new day
        const count = currentQuota?.date === today ? currentQuota.count : 0;

        if (count >= DAILY_LIMIT) {
          return false; // Quota exhausted
        }

        set({
          quotaByUser: {
            ...get().quotaByUser,
            [userId]: { date: today, count: count + 1 },
          },
        });
        return true;
      },

      hasCustomKey: () => {
        const key = get().customApiKey;
        return !!key && key.trim().length > 0;
      },

      setCustomApiKey: (key: string | null) => {
        set({ customApiKey: key?.trim() || null });
      },

      getEffectiveApiKey: (defaultKey: string) => {
        const customKey = get().customApiKey;
        return customKey && customKey.trim().length > 0 ? customKey : defaultKey;
      },
    }),
    {
      name: 'nepali-ai-quota',
      storage: asyncStorage,
    }
  )
);

export const DAILY_AI_LIMIT = DAILY_LIMIT;
