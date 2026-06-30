import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const AI_CHAT_STORAGE_KEY = 'nepali-ai-chat';

export async function upsertProfile(userId: string, name: string, email: string, avatarUrl?: string) {
  if (userId.startsWith('__guest__')) return;
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, name, email, avatar_url: avatarUrl }, { onConflict: 'id' });
  if (error) console.warn('upsertProfile failed:', error.message);
}

export async function syncLearnWord(userId: string, wordId: number) {
  if (userId.startsWith('__guest__')) return;
  const { error } = await supabase
    .from('user_learned_words')
    .upsert({ user_id: userId, word_id: wordId }, { onConflict: 'user_id,word_id' });
  if (error) console.warn('syncLearnWord failed:', error.message);
}

export async function syncUnlearnWord(userId: string, wordId: number) {
  if (userId.startsWith('__guest__')) return;
  const { error } = await supabase
    .from('user_learned_words')
    .delete()
    .eq('user_id', userId)
    .eq('word_id', wordId);
  if (error) console.warn('syncUnlearnWord failed:', error.message);
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

export async function saveJournalEntry(
  userId: string,
  promptNepali: string,
  promptRoman: string,
  promptEnglish: string,
  responseText: string,
) {
  if (userId.startsWith('__guest__')) {
    return { guest: true };
  }
  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      user_id: userId,
      prompt_nepali: promptNepali,
      prompt_roman: promptRoman,
      prompt_english: promptEnglish,
      response_text: responseText,
    })
    .select('id')
    .single();
  if (error) {
    console.warn('saveJournalEntry failed:', error.message);
    return null;
  }
  return data;
}

export async function addXp(userId: string, amount: number, source: 'lesson' | 'quiz' | 'journal' | 'streak' | 'echo_practice' | 'ai_tutor') {
  if (userId.startsWith('__guest__')) return;
  const { error } = await supabase
    .from('user_xp')
    .insert({ user_id: userId, xp_amount: amount, source });
  if (error) console.warn('addXp failed:', error.message);
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

export async function updateStreak(userId: string) {
  if (userId.startsWith('__guest__')) return null;
  const today = new Date().toISOString().split('T')[0];

  const { data: existing } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!existing) {
    await supabase
      .from('user_streaks')
      .insert({ user_id: userId, current_streak: 1, longest_streak: 1, last_activity_date: today });
    return { current_streak: 1, longest_streak: 1 };
  }

  const lastDate = existing.last_activity_date;
  let newCurrent = existing.current_streak;
  let newLongest = existing.longest_streak;

  if (lastDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastDate === yesterdayStr) {
      newCurrent += 1;
    } else {
      newCurrent = 1;
    }
    if (newCurrent > newLongest) newLongest = newCurrent;
  }

  await supabase
    .from('user_streaks')
    .update({ current_streak: newCurrent, longest_streak: newLongest, last_activity_date: today })
    .eq('user_id', userId);

  return { current_streak: newCurrent, longest_streak: newLongest };
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
  const { error } = await supabase
    .from('ai_chat_history')
    .insert({ user_id: userId, role, content });
  if (error) console.warn('saveChatMessage failed:', error.message);
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
