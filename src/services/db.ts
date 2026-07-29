import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { supabase } from './supabase';
import { networkManager } from './network';
import { enqueue } from './offlineQueue';

const AI_CHAT_STORAGE_KEY = 'nepali-ai-chat';
const AI_CONVERSATIONS_STORAGE_KEY = 'nepali-ai-conversations';
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
  feedback_text?: string | null;
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
  feedbackText?: string,
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
      feedback_text: feedbackText ?? null,
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
        feedback_text: feedbackText ?? null,
      });
    if (!error) return { saved: true };
    console.warn('saveJournalEntry failed, queueing:', error.message);
  }

  await enqueue({
    type: 'SAVE_JOURNAL',
    payload: { userId, promptNepali, promptRoman, promptEnglish, responseText, feedbackText },
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

/** Daily XP totals from the cloud (for the heatmap). Returns 'YYYY-MM-DD' -> xp. */
export async function fetchDailyXp(userId: string): Promise<Record<string, number>> {
  if (userId.startsWith('__guest__')) return {};
  const { data, error } = await supabase
    .rpc('get_daily_xp', { p_user_id: userId });
  if (error || !data) {
    console.warn('fetchDailyXp failed:', error?.message);
    return {};
  }
  const map: Record<string, number> = {};
  for (const row of data as { day: string; xp: number }[]) {
    map[row.day] = row.xp;
  }
  return map;
}

export interface LeaderboardRow {
  name: string;
  avatar_url: string | null;
  weekly_xp: number;
  rank: number;
}

/** Weekly leaderboard (signed-in only; RPC is security definer). */
export async function fetchWeeklyLeaderboard(limit = 50): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase
    .rpc('get_weekly_leaderboard', { p_limit: limit });
  if (error || !data) {
    console.warn('fetchWeeklyLeaderboard failed:', error?.message);
    return [];
  }
  return data as LeaderboardRow[];
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

export interface StoredConversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const DEFAULT_TITLE = 'New chat';

function truncateTitle(text: string): string {
  const trimmed = text.trim();
  return trimmed.length > 40 ? `${trimmed.slice(0, 40)}…` : trimmed;
}

function conversationsListKey(userId: string): string {
  return `${AI_CONVERSATIONS_STORAGE_KEY}-${userId}`;
}

function guestChatKey(userId: string, conversationId: string): string {
  return `${AI_CHAT_STORAGE_KEY}-${userId}-${conversationId}`;
}

function sortConversations(list: StoredConversation[]): StoredConversation[] {
  return [...list].sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
}

async function getGuestConversationsList(userId: string): Promise<StoredConversation[]> {
  const raw = await AsyncStorage.getItem(conversationsListKey(userId));
  return raw ? (JSON.parse(raw) as StoredConversation[]) : [];
}

async function setGuestConversationsList(userId: string, list: StoredConversation[]): Promise<void> {
  await AsyncStorage.setItem(conversationsListKey(userId), JSON.stringify(list));
}

/** One-time migration: wraps a pre-multi-chat guest blob into a single "Legacy chat" conversation. No-op if a conversation list already exists, or if there's no legacy blob to migrate. */
export async function migrateGuestLegacyChat(userId: string): Promise<void> {
  const listKey = conversationsListKey(userId);
  const existingList = await AsyncStorage.getItem(listKey);
  if (existingList !== null) return;

  const oldKey = `${AI_CHAT_STORAGE_KEY}-${userId}`;
  const raw = await AsyncStorage.getItem(oldKey);
  if (!raw) return;

  let msgs: StoredChatMessage[];
  try {
    msgs = JSON.parse(raw);
  } catch {
    return;
  }
  if (!Array.isArray(msgs) || msgs.length === 0) return;

  const id = Crypto.randomUUID();
  const now = new Date().toISOString();
  await AsyncStorage.setItem(guestChatKey(userId, id), JSON.stringify(msgs));
  const conversation: StoredConversation = {
    id,
    title: 'Legacy chat',
    created_at: msgs[0]?.created_at || now,
    updated_at: msgs[msgs.length - 1]?.created_at || now,
  };
  await setGuestConversationsList(userId, [conversation]);
  await AsyncStorage.removeItem(oldKey);
}

export async function fetchConversations(userId: string): Promise<StoredConversation[]> {
  if (userId.startsWith('__guest__')) {
    await migrateGuestLegacyChat(userId);
    return sortConversations(await getGuestConversationsList(userId));
  }

  const { data, error } = await supabase
    .from('ai_conversations')
    .select('id, title, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) {
    console.warn('fetchConversations failed:', error.message);
    return [];
  }
  return data || [];
}

export async function createConversation(
  userId: string,
  title: string = DEFAULT_TITLE,
): Promise<StoredConversation> {
  const id = Crypto.randomUUID();
  const now = new Date().toISOString();
  const conversation: StoredConversation = { id, title, created_at: now, updated_at: now };

  if (userId.startsWith('__guest__')) {
    const list = await getGuestConversationsList(userId);
    list.push(conversation);
    await setGuestConversationsList(userId, list);
    return conversation;
  }

  if (networkManager.getIsConnected()) {
    const { error } = await supabase
      .from('ai_conversations')
      .insert({ id, user_id: userId, title });
    if (!error) return conversation;
    console.warn('createConversation failed, queueing:', error.message);
  }

  await enqueue({
    type: 'CREATE_CONVERSATION',
    payload: { userId, conversationId: id, conversationTitle: title },
  });
  return conversation;
}

export async function renameConversation(
  userId: string,
  conversationId: string,
  title: string,
): Promise<void> {
  if (userId.startsWith('__guest__')) {
    const list = await getGuestConversationsList(userId);
    const idx = list.findIndex(c => c.id === conversationId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], title, updated_at: new Date().toISOString() };
      await setGuestConversationsList(userId, list);
    }
    return;
  }

  if (networkManager.getIsConnected()) {
    const { error } = await supabase
      .from('ai_conversations')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', conversationId)
      .eq('user_id', userId);
    if (!error) return;
    console.warn('renameConversation failed, queueing:', error.message);
  }

  await enqueue(
    { type: 'RENAME_CONVERSATION', payload: { userId, conversationId, conversationTitle: title } },
    `rename-${conversationId}`
  );
}

export async function deleteConversation(userId: string, conversationId: string): Promise<void> {
  if (userId.startsWith('__guest__')) {
    const list = await getGuestConversationsList(userId);
    await setGuestConversationsList(userId, list.filter(c => c.id !== conversationId));
    await AsyncStorage.removeItem(guestChatKey(userId, conversationId));
    return;
  }

  if (networkManager.getIsConnected()) {
    const { error } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', userId);
    if (!error) return;
    console.warn('deleteConversation failed, queueing:', error.message);
  }

  await enqueue(
    { type: 'DELETE_CONVERSATION', payload: { userId, conversationId } },
    `delete-${conversationId}`
  );
}

/** Bumps updated_at and, if the conversation still has the default title, auto-titles it from the first user message. */
async function bumpConversationMeta(
  userId: string,
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
): Promise<void> {
  const now = new Date().toISOString();
  if (role !== 'user') {
    const { error } = await supabase
      .from('ai_conversations')
      .update({ updated_at: now })
      .eq('id', conversationId)
      .eq('user_id', userId);
    if (error) console.warn('bumpConversationMeta failed:', error.message);
    return;
  }

  const { data } = await supabase
    .from('ai_conversations')
    .select('title')
    .eq('id', conversationId)
    .eq('user_id', userId)
    .maybeSingle();

  const patch: { updated_at: string; title?: string } = { updated_at: now };
  if (!data || data.title === DEFAULT_TITLE) {
    patch.title = truncateTitle(content);
  }

  const { error } = await supabase
    .from('ai_conversations')
    .update(patch)
    .eq('id', conversationId)
    .eq('user_id', userId);
  if (error) console.warn('bumpConversationMeta failed:', error.message);
}

export async function saveChatMessage(
  userId: string,
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
): Promise<void> {
  if (userId.startsWith('__guest__')) {
    const key = guestChatKey(userId, conversationId);
    const raw = await AsyncStorage.getItem(key);
    const msgs: StoredChatMessage[] = raw ? JSON.parse(raw) : [];
    msgs.push({ role, content, created_at: new Date().toISOString() });
    await AsyncStorage.setItem(key, JSON.stringify(msgs));

    const list = await getGuestConversationsList(userId);
    const idx = list.findIndex(c => c.id === conversationId);
    if (idx !== -1) {
      const updated = { ...list[idx], updated_at: new Date().toISOString() };
      if (role === 'user' && updated.title === DEFAULT_TITLE) {
        updated.title = truncateTitle(content);
      }
      list[idx] = updated;
      await setGuestConversationsList(userId, list);
    }
    return;
  }

  if (networkManager.getIsConnected()) {
    const { error } = await supabase
      .from('ai_chat_history')
      .insert({ user_id: userId, conversation_id: conversationId, role, content });
    if (!error) {
      await bumpConversationMeta(userId, conversationId, role, content);
      return;
    }
  }

  await enqueue({
    type: 'SAVE_CHAT_MESSAGE',
    payload: { userId, conversationId, chatRole: role, chatContent: content },
  });
}

export async function fetchChatHistory(
  userId: string,
  conversationId: string,
  limit = 50,
): Promise<StoredChatMessage[]> {
  if (userId.startsWith('__guest__')) {
    const key = guestChatKey(userId, conversationId);
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as StoredChatMessage[]).slice(-limit) : [];
  }
  const { data, error } = await supabase
    .from('ai_chat_history')
    .select('role, content, created_at')
    .eq('user_id', userId)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) {
    console.warn('fetchChatHistory failed:', error.message);
    return [];
  }
  return data || [];
}
