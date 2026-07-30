import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PersistStorage } from 'zustand/middleware';
import {
  fetchConversations,
  createConversation,
  renameConversation,
  deleteConversation,
  type StoredConversation,
} from '../services/db';

type ChatsState = {
  conversations: StoredConversation[];
  currentConversationId: string | null;
  activeConversationIdByUser: Record<string, string>;
  isLoadingConversations: boolean;
  loadConversations: (userId: string) => Promise<void>;
  switchConversation: (userId: string, id: string) => void;
  newConversation: (userId: string) => Promise<void>;
  rename: (userId: string, id: string, title: string) => Promise<void>;
  remove: (userId: string, id: string) => Promise<void>;
};

const asyncStorage: PersistStorage<ChatsState> = {
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

export const useChatsStore = create<ChatsState>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversationId: null,
      activeConversationIdByUser: {},
      isLoadingConversations: false,

      loadConversations: async (userId) => {
        set({ isLoadingConversations: true });
        const list = await fetchConversations(userId);
        const lastActiveId = get().activeConversationIdByUser[userId];
        let target = list.find((c) => c.id === lastActiveId) || list[0];

        if (!target) {
          target = await createConversation(userId);
          list.unshift(target);
        }

        set((state) => ({
          conversations: list,
          currentConversationId: target!.id,
          activeConversationIdByUser: { ...state.activeConversationIdByUser, [userId]: target!.id },
          isLoadingConversations: false,
        }));
      },

      switchConversation: (userId, id) => {
        set((state) => ({
          currentConversationId: id,
          activeConversationIdByUser: { ...state.activeConversationIdByUser, [userId]: id },
        }));
      },

      newConversation: async (userId) => {
        const created = await createConversation(userId);
        set((state) => ({
          conversations: [created, ...state.conversations],
          currentConversationId: created.id,
          activeConversationIdByUser: { ...state.activeConversationIdByUser, [userId]: created.id },
        }));
      },

      rename: async (userId, id, title) => {
        await renameConversation(userId, id, title);
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, title, updated_at: new Date().toISOString() } : c
          ),
        }));
      },

      remove: async (userId, id) => {
        await deleteConversation(userId, id);
        set((state) => {
          const remaining = state.conversations.filter((c) => c.id !== id);
          if (state.currentConversationId !== id) {
            return { conversations: remaining };
          }
          if (remaining.length > 0) {
            return {
              conversations: remaining,
              currentConversationId: remaining[0].id,
              activeConversationIdByUser: { ...state.activeConversationIdByUser, [userId]: remaining[0].id },
            };
          }
          const rest = { ...state.activeConversationIdByUser };
          delete rest[userId];
          return { conversations: remaining, currentConversationId: null, activeConversationIdByUser: rest };
        });
      },
    }),
    {
      name: 'nepali-active-chat',
      storage: asyncStorage,
      partialize: (state) => ({ activeConversationIdByUser: state.activeConversationIdByUser } as ChatsState),
    }
  )
);
