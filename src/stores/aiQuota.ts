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

export type AiProvider = 'groq' | 'google' | 'openai' | 'openrouter' | 'together' | 'custom';

export interface ProviderConfig {
  label: string;
  baseUrl: string;
  defaultModel: string;
  visionModel?: string;
  keyPrefix?: string;
  keyHint: string;
}

export const AI_PROVIDERS: Record<AiProvider, ProviderConfig> = {
  groq: {
    label: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'qwen/qwen3.8-27b',
    visionModel: 'qwen/qwen3.8-27b',
    keyPrefix: 'gsk_',
    keyHint: 'gsk_...',
  },
  google: {
    label: 'Google AI Studio',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-3.5-flash-lite',
    visionModel: 'gemini-3.5-flash-lite',
    keyPrefix: 'AIza',
    keyHint: 'AIza...',
  },
  openai: {
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    visionModel: 'gpt-4o-mini',
    keyPrefix: 'sk-',
    keyHint: 'sk-...',
  },
  openrouter: {
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'google/gemini-2.0-flash-001',
    visionModel: 'google/gemini-2.0-flash-001',
    keyPrefix: 'sk-or-',
    keyHint: 'sk-or-...',
  },
  together: {
    label: 'Together AI',
    baseUrl: 'https://api.together.xyz/v1',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    keyHint: 'API key',
  },
  custom: {
    label: 'Custom',
    baseUrl: '',
    defaultModel: '',
    keyHint: 'API key',
  },
};

type AiQuotaState = {
  quotaByUser: Record<string, UserQuota>;
  customApiKey: string | null;
  provider: AiProvider;
  customBaseUrl: string | null;
  customModel: string | null;
  getQuota: (userId: string) => { used: number; remaining: number; limit: number };
  consumeQuota: (userId: string) => boolean;
  hasCustomKey: () => boolean;
  setCustomApiKey: (key: string | null) => void;
  setProvider: (provider: AiProvider) => void;
  setCustomBaseUrl: (url: string | null) => void;
  setCustomModel: (model: string | null) => void;
  getEffectiveApiKey: (defaultKey: string) => string;
  getProviderConfig: () => { baseUrl: string; model: string; visionModel: string };
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
      provider: 'groq' as AiProvider,
      customBaseUrl: null,
      customModel: null,

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

      setProvider: (provider: AiProvider) => {
        set({ provider });
      },

      setCustomBaseUrl: (url: string | null) => {
        set({ customBaseUrl: url?.trim() || null });
      },

      setCustomModel: (model: string | null) => {
        set({ customModel: model?.trim() || null });
      },

      getEffectiveApiKey: (defaultKey: string) => {
        const customKey = get().customApiKey;
        return customKey && customKey.trim().length > 0 ? customKey : defaultKey;
      },

      getProviderConfig: () => {
        const { provider, customBaseUrl, customModel } = get();
        const config = AI_PROVIDERS[provider];

        if (provider === 'custom') {
          return {
            baseUrl: customBaseUrl || '',
            model: customModel || '',
            visionModel: customModel || '',
          };
        }

        return {
          baseUrl: config.baseUrl,
          model: customModel || config.defaultModel,
          visionModel: config.visionModel || config.defaultModel,
        };
      },
    }),
    {
      name: 'nepali-ai-quota',
      storage: asyncStorage,
    }
  )
);

export const DAILY_AI_LIMIT = DAILY_LIMIT;
