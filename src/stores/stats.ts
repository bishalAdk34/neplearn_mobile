import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PersistStorage } from 'zustand/middleware';

export interface UserStats {
  /** Answers given in review sessions. */
  reviewAnswers: number;
  /** Sentence-builder exercises completed. */
  sentencesCompleted: number;
  /** Listening sessions completed. */
  listeningSessions: number;
  /** Grammar tip ids that have been read. */
  grammarRead: number[];
  /** Dates (YYYY-MM-DD) where the daily XP goal was hit. */
  goalDays: string[];
}

const EMPTY_STATS: UserStats = {
  reviewAnswers: 0,
  sentencesCompleted: 0,
  listeningSessions: 0,
  grammarRead: [],
  goalDays: [],
};

type StatsState = {
  statsByUser: Record<string, UserStats>;
  getStats: (userId: string) => UserStats;
  incrementReviewAnswers: (userId: string) => void;
  incrementSentences: (userId: string, count?: number) => void;
  incrementListening: (userId: string) => void;
  markGrammarRead: (userId: string, tipId: number) => boolean;
  recordGoalDay: (userId: string, date: string) => void;
};

const asyncStorage: PersistStorage<StatsState> = {
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

export const useStatsStore = create<StatsState>()(
  persist(
    (set, get) => {
      const update = (userId: string, patch: Partial<UserStats>) => {
        const current = get().statsByUser[userId] || EMPTY_STATS;
        set({
          statsByUser: { ...get().statsByUser, [userId]: { ...current, ...patch } },
        });
      };

      return {
        statsByUser: {},
        getStats: (userId) => get().statsByUser[userId] || EMPTY_STATS,
        incrementReviewAnswers: (userId) => {
          const s = get().statsByUser[userId] || EMPTY_STATS;
          update(userId, { reviewAnswers: s.reviewAnswers + 1 });
        },
        incrementSentences: (userId, count = 1) => {
          const s = get().statsByUser[userId] || EMPTY_STATS;
          update(userId, { sentencesCompleted: s.sentencesCompleted + count });
        },
        incrementListening: (userId) => {
          const s = get().statsByUser[userId] || EMPTY_STATS;
          update(userId, { listeningSessions: s.listeningSessions + 1 });
        },
        markGrammarRead: (userId, tipId) => {
          const s = get().statsByUser[userId] || EMPTY_STATS;
          if (s.grammarRead.includes(tipId)) return false;
          update(userId, { grammarRead: [...s.grammarRead, tipId] });
          return true;
        },
        recordGoalDay: (userId, date) => {
          const s = get().statsByUser[userId] || EMPTY_STATS;
          if (s.goalDays.includes(date)) return;
          update(userId, { goalDays: [...s.goalDays, date] });
        },
      };
    },
    {
      name: 'nepali-stats',
      storage: asyncStorage,
    }
  )
);
