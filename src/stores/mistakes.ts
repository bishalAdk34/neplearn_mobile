import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PersistStorage } from 'zustand/middleware';

export type MistakeSource =
  | 'quiz'
  | 'lesson'
  | 'morning_vocab'
  | 'flashcards'
  | 'review'
  | 'mistakes'
  | 'listening'
  | 'sentence';

export interface Mistake {
  wordId: number;
  source: MistakeSource;
  count: number;
  lastMissedAt: string;
  resolved: boolean;
}

type MistakesState = {
  mistakesByUser: Record<string, Record<number, Mistake>>;
  recordMistake: (userId: string, wordId: number, source: MistakeSource) => void;
  resolveMistake: (userId: string, wordId: number) => void;
  getActiveMistakes: (userId: string) => Mistake[];
  getResolvedCount: (userId: string) => number;
};

const asyncStorage: PersistStorage<MistakesState> = {
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

export const useMistakesStore = create<MistakesState>()(
  persist(
    (set, get) => ({
      mistakesByUser: {},
      recordMistake: (userId, wordId, source) => {
        const userMistakes = get().mistakesByUser[userId] || {};
        const existing = userMistakes[wordId];
        const updated: Mistake = existing
          ? {
              ...existing,
              source,
              count: existing.count + 1,
              lastMissedAt: new Date().toISOString(),
              resolved: false, // later miss un-resolves
            }
          : {
              wordId,
              source,
              count: 1,
              lastMissedAt: new Date().toISOString(),
              resolved: false,
            };
        set({
          mistakesByUser: {
            ...get().mistakesByUser,
            [userId]: { ...userMistakes, [wordId]: updated },
          },
        });
      },
      resolveMistake: (userId, wordId) => {
        const userMistakes = get().mistakesByUser[userId] || {};
        const existing = userMistakes[wordId];
        if (!existing || existing.resolved) return;
        set({
          mistakesByUser: {
            ...get().mistakesByUser,
            [userId]: { ...userMistakes, [wordId]: { ...existing, resolved: true } },
          },
        });
      },
      getActiveMistakes: (userId) => {
        const userMistakes = get().mistakesByUser[userId] || {};
        return Object.values(userMistakes)
          .filter((m) => !m.resolved)
          .sort((a, b) => b.lastMissedAt.localeCompare(a.lastMissedAt));
      },
      getResolvedCount: (userId) => {
        const userMistakes = get().mistakesByUser[userId] || {};
        return Object.values(userMistakes).filter((m) => m.resolved).length;
      },
    }),
    {
      name: 'nepali-mistakes',
      storage: asyncStorage,
    }
  )
);
