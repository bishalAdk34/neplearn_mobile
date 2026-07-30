import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PersistStorage } from 'zustand/middleware';

type NotifPromptState = {
  hasPrompted: boolean;
  visible: boolean;
  markPrompted: () => void;
  show: () => void;
  hide: () => void;
};

const asyncStorage: PersistStorage<NotifPromptState> = {
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

export const useNotifPromptStore = create<NotifPromptState>()(
  persist(
    (set) => ({
      hasPrompted: false,
      visible: false,
      markPrompted: () => set({ hasPrompted: true }),
      show: () => set({ visible: true }),
      hide: () => set({ visible: false }),
    }),
    {
      name: 'nepali-notif-prompt',
      storage: asyncStorage,
      partialize: (state) => ({ hasPrompted: state.hasPrompted } as NotifPromptState),
    }
  )
);

/** Show notif prompt once ever — no-op if already prompted. */
export function maybeShowNotifPrompt(): void {
  const { hasPrompted, show } = useNotifPromptStore.getState();
  if (!hasPrompted) show();
}
