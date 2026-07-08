import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { networkManager } from './network';
import { enqueue } from './offlineQueue';

const AI_CHAT_STORAGE_KEY = 'nepali-ai-chat';
const JOURNAL_STORAGE_KEY = 'nepali-journal';

export async function upsertProfile(userId: string, name: string, email: string, avatarUrl?: string) {
  if (userId.startsWith('__guest__')) return;

  if (networkManager.getIsConnected()) {
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId, name, email, avatar_url: avatarUrl }, { onConflict: 'id' });
    if (!error) return;
    console.warn('upsertProfile failed, queueing:', error.message);
  }

  await enqueue(
    {
      type: 'UPSERT_PROFILE',
      payload: { userId, profileName: name, profileEmail: email, profileAvatarUrl: avatarUrl },
    },
    `profile-${userId}`
  );
}

export async function syncLearnWord(userId: string, wordId: number) {
  if (userId.startsWith('__guest__')) return;

  if (networkManager.getIsConnected()) {
    const { error } = await supabase
      .from('user_learned_words')
      .upsert({ user_id: userId, word_id: wordId }, { onConflict: 'user_id,word_id' });
    if (!error) return;
  }

  await enqueue({ type: 'LEARN_WORD', payload: { userId, wordId } });
}

export async function syncUnlearnWord(userId: string, wordId: number) {
  if (userId.startsWith('__guest__')) return;

  if (networkManager.getIsConnected()) {
    const { error } = await supabase
      .from('user_learned_words')
      .delete()
      .eq('user_id', userId)
      .eq('word_id', wordId);
    if (!error) return;
  }

  await enqueue({ type: 'UNLEARN_WORD', payload: { userId, wordId } });
}

export async function fetchLearnedWords(userId: string): Promise<number[]> {
  if (userId.startsWith('__guest__')) return [];
  const { data, error } = await supabase
    .from('user_learned_words')
    .select('word_id')
    .eq('user_id', userId);
  if (error) {
    console.warn('fetchLearnedWords failed:', error.message);
    return [];
  }
  return data.map(r => r.word_id);
}

export interface StoredJournalEntry {
  prompt_nepali: string;
  prompt_roman: string;
  prompt_english: string;
  response_text: string;
  created_at: string;
}

export type SaveJournalResult =
  | { saved: true; queued?: false; guest?: boolean }
  | { saved: true; queued: true };

export async function saveJournalEntry(
  userId: string,
  promptNepali: string,
  promptRoman: string,
  promptEnglish: string,
  responseText: string,
): Promise<SaveJournalResult> {
  if (userId.startsWith('__guest__')) {
    const key = `${JOURNAL_STORAGE_KEY}-${userId}`;
    const raw = await AsyncStorage.getItem(key);
    const entries: StoredJournalEntry[] = raw ? JSON.parse(raw) : [];
    entries.push({
      prompt_nepali: promptNepali,
      prompt_roman: promptRoman,
      prompt_english: promptEnglish,
      response_text: responseText,
      created_at: new Date().toISOString(),
    });
    await AsyncStorage.setItem(key, JSON.stringify(entries));
    return { saved: true, guest: true };
  }

  if (networkManager.getIsConnected()) {
    const { error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: userId,
        prompt_nepali: promptNepali,
        prompt_roman: promptRoman,
        prompt_english: promptEnglish,
        response_text: responseText,
      });
    if (!error) return { saved: true };
    console.warn('saveJournalEntry failed, queueing:', error.message);
  }

  await enqueue({
    type: 'SAVE_JOURNAL',
    payload: { userId, promptNepali, promptRoman, promptEnglish, responseText },
  });
  return { saved: true, queued: true };
}

export type XpSource =
  | 'lesson'
  | 'quiz'
  | 'journal'
  | 'streak'
  | 'echo_practice'
  | 'ai_tutor'
  | 'review'
  | 'mistakes'
  | 'sentence'
  | 'listening'
  | 'grammar';

export async function addXp(userId: string, amount: number, source: XpSource) {
  if (userId.startsWith('__guest__')) return;

  if (networkManager.getIsConnected()) {
    const { error } = await supabase
      .from('user_xp')
      .insert({ user_id: userId, xp_amount: amount, source });
    if (!error) return;
  }

  await enqueue({ type: 'ADD_XP', payload: { userId, xpAmount: amount, xpSource: source } });
}

export async function getTotalXp(userId: string): Promise<number> {
  if (userId.startsWith('__guest__')) return 0;
  const { data, error } = await supabase
    .rpc('get_total_xp', { p_user_id: userId });
  if (error) {
    const { data: fallback, error: fallbackError } = await supabase
      .from('user_xp')
      .select('xp_amount')
      .eq('user_id', userId);
    if (fallbackError) return 0;
    return fallback.reduce((sum, r) => sum + r.xp_amount, 0);
  }
  return data || 0;
}

export async function getStreak(userId: string): Promise<{ current_streak: number; longest_streak: number }> {
  if (userId.startsWith('__guest__')) return { current_streak: 0, longest_streak: 0 };
  const { data, error } = await supabase
    .from('user_streaks')
    .select('current_streak, longest_streak')
    .eq('user_id', userId)
    .single();
  if (error || !data) return { current_streak: 0, longest_streak: 0 };
  return data;
}

export interface StoredChatMessage {
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export async function saveChatMessage(
  userId: string,
  role: 'user' | 'assistant',
  content: string,
): Promise<void> {
  if (userId.startsWith('__guest__')) {
    const key = `${AI_CHAT_STORAGE_KEY}-${userId}`;
    const raw = await AsyncStorage.getItem(key);
    const msgs: StoredChatMessage[] = raw ? JSON.parse(raw) : [];
    msgs.push({ role, content, created_at: new Date().toISOString() });
    await AsyncStorage.setItem(key, JSON.stringify(msgs));
    return;
  }

  if (networkManager.getIsConnected()) {
    const { error } = await supabase
      .from('ai_chat_history')
      .insert({ user_id: userId, role, content });
    if (!error) return;
  }

  await enqueue({ type: 'SAVE_CHAT_MESSAGE', payload: { userId, chatRole: role, chatContent: content } });
}

export async function fetchChatHistory(
  userId: string,
  limit = 50,
): Promise<StoredChatMessage[]> {
  if (userId.startsWith('__guest__')) {
    const key = `${AI_CHAT_STORAGE_KEY}-${userId}`;
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as StoredChatMessage[]).slice(-limit) : [];
  }
  const { data, error } = await supabase
    .from('ai_chat_history')
    .select('role, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) {
    console.warn('fetchChatHistory failed:', error.message);
    return [];
  }
  return data || [];
}
