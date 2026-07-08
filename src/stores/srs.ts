import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PersistStorage } from 'zustand/middleware';
import { supabase } from '../services/supabase';
import { networkManager } from '../services/network';
import { enqueue } from '../services/offlineQueue';
import { useMistakesStore, type MistakeSource } from './mistakes';
import { useStatsStore } from './stats';

/** Leitner box intervals in days. Box 1 = 1 day ... Box 5 = 30 days. */
export const BOX_INTERVALS_DAYS: Record<number, number> = {
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30,
};

export const MAX_BOX = 5;

export interface WordSRS {
  wordId: number;
  box: number;
  lastResult: boolean;
  lastReviewedAt: string;
  dueAt: string;
  correctCount: number;
  incorrectCount: number;
}

type SrsState = {
  srsByUser: Record<string, Record<number, WordSRS>>;
  seedWord: (userId: string, wordId: number) => void;
  recordResult: (userId: string, wordId: number, correct: boolean, source: MistakeSource) => void;
  getDueWords: (userId: string) => WordSRS[];
  getStrength: (userId: string, wordId: number) => number;
  syncFromCloud: (userId: string) => Promise<void>;
};

const asyncStorage: PersistStorage<SrsState> = {
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

function dueAtFromBox(box: number, from: Date): string {
  const days = BOX_INTERVALS_DAYS[box] ?? 1;
  const due = new Date(from);
  due.setDate(due.getDate() + days);
  return due.toISOString();
}

/** Push one SRS entry to Supabase; enqueue on failure/offline. Guests skipped. */
async function pushSrs(userId: string, entry: WordSRS): Promise<void> {
  if (userId.startsWith('__guest__')) return;

  if (networkManager.getIsConnected()) {
    try {
      const { error } = await supabase.from('user_word_srs').upsert(
        {
          user_id: userId,
          word_id: entry.wordId,
          box: entry.box,
          last_result: entry.lastResult,
          last_reviewed_at: entry.lastReviewedAt,
          due_at: entry.dueAt,
          correct_count: entry.correctCount,
          incorrect_count: entry.incorrectCount,
        },
        { onConflict: 'user_id,word_id' }
      );
      if (!error) return;
    } catch (e) {
      console.warn('pushSrs failed, queueing:', e);
    }
  }

  await enqueue(
    {
      type: 'UPSERT_SRS',
      payload: {
        userId,
        wordId: entry.wordId,
        srsBox: entry.box,
        srsLastResult: entry.lastResult,
        srsLastReviewedAt: entry.lastReviewedAt,
        srsDueAt: entry.dueAt,
        srsCorrectCount: entry.correctCount,
        srsIncorrectCount: entry.incorrectCount,
      },
    },
    `srs-${userId}-${entry.wordId}`
  );
}

export const useSrsStore = create<SrsState>()(
  persist(
    (set, get) => ({
      srsByUser: {},
      seedWord: (userId, wordId) => {
        const userSrs = get().srsByUser[userId] || {};
        if (userSrs[wordId]) return; // already tracked
        const now = new Date();
        const entry: WordSRS = {
          wordId,
          box: 1,
          lastResult: true,
          lastReviewedAt: now.toISOString(),
          dueAt: dueAtFromBox(1, now),
          correctCount: 0,
          incorrectCount: 0,
        };
        set({ srsByUser: { ...get().srsByUser, [userId]: { ...userSrs, [wordId]: entry } } });
        pushSrs(userId, entry);
      },
      recordResult: (userId, wordId, correct, source) => {
        const userSrs = get().srsByUser[userId] || {};
        const existing = userSrs[wordId];
        const now = new Date();
        const newBox = correct ? Math.min((existing?.box ?? 0) + 1, MAX_BOX) : 1;
        const entry: WordSRS = {
          wordId,
          box: newBox,
          lastResult: correct,
          lastReviewedAt: now.toISOString(),
          dueAt: dueAtFromBox(newBox, now),
          correctCount: (existing?.correctCount ?? 0) + (correct ? 1 : 0),
          incorrectCount: (existing?.incorrectCount ?? 0) + (correct ? 0 : 1),
        };
        set({ srsByUser: { ...get().srsByUser, [userId]: { ...userSrs, [wordId]: entry } } });
        pushSrs(userId, entry);

        // Mistake tracking
        const mistakes = useMistakesStore.getState();
        if (!correct) {
          mistakes.recordMistake(userId, wordId, source);
        } else if (source === 'mistakes') {
          mistakes.resolveMistake(userId, wordId);
        }

        if (source === 'review') {
          useStatsStore.getState().incrementReviewAnswers(userId);
        }
      },
      getDueWords: (userId) => {
        const userSrs = get().srsByUser[userId] || {};
        const now = new Date().toISOString();
        return Object.values(userSrs)
          .filter((e) => e.dueAt <= now)
          .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
      },
      getStrength: (userId, wordId) => {
        const entry = (get().srsByUser[userId] || {})[wordId];
        if (!entry) return 0;
        const base = entry.box / MAX_BOX;
        const now = Date.now();
        const due = new Date(entry.dueAt).getTime();
        if (now <= due) return base;
        // Decay past due: strength halves each full interval overdue
        const interval = due - new Date(entry.lastReviewedAt).getTime();
        if (interval <= 0) return base;
        const overdueRatio = (now - due) / interval;
        return Math.max(0.1, base * Math.pow(0.5, overdueRatio));
      },
      syncFromCloud: async (userId) => {
        if (userId.startsWith('__guest__')) return;
        try {
          const { data, error } = await supabase
            .from('user_word_srs')
            .select('word_id, box, last_result, last_reviewed_at, due_at, correct_count, incorrect_count')
            .eq('user_id', userId);
          if (error || !data) return;

          const userSrs = { ...(get().srsByUser[userId] || {}) };
          for (const row of data) {
            const local = userSrs[row.word_id];
            // Later lastReviewedAt wins
            if (!local || row.last_reviewed_at > local.lastReviewedAt) {
              userSrs[row.word_id] = {
                wordId: row.word_id,
                box: row.box,
                lastResult: row.last_result,
                lastReviewedAt: row.last_reviewed_at,
                dueAt: row.due_at,
                correctCount: row.correct_count,
                incorrectCount: row.incorrect_count,
              };
            }
          }
          set({ srsByUser: { ...get().srsByUser, [userId]: userSrs } });
        } catch (e) {
          console.warn('SRS syncFromCloud failed:', e);
        }
      },
    }),
    {
      name: 'nepali-srs',
      storage: asyncStorage,
    }
  )
);
