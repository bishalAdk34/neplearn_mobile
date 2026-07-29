import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PersistStorage } from 'zustand/middleware';

export type TtsSpeed = 'slow' | 'normal' | 'fast';

export type LearningDirection = 'en-to-ne' | 'ne-to-en';

export const TTS_RATES: Record<TtsSpeed, number> = {
  slow: 0.55,
  normal: 0.8,
  fast: 1.0,
};

type SettingsState = {
  ttsSpeed: TtsSpeed;
  dailyGoalXp: number;
  learningDirection: LearningDirection;
  setTtsSpeed: (speed: TtsSpeed) => void;
  setDailyGoalXp: (xp: number) => void;
  setLearningDirection: (direction: LearningDirection) => void;
};

const asyncStorage: PersistStorage<SettingsState> = {
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

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ttsSpeed: 'normal',
      dailyGoalXp: 50,
      learningDirection: 'en-to-ne',
      setTtsSpeed: (speed) => set({ ttsSpeed: speed }),
      setDailyGoalXp: (xp) => set({ dailyGoalXp: xp }),
      setLearningDirection: (direction) => set({ learningDirection: direction }),
    }),
    {
      name: 'nepali-settings',
      storage: asyncStorage,
    }
  )
);
