import { FunctionsHttpError } from '@supabase/supabase-js';
import { networkManager } from './network';
import { supabase } from './supabase';
import { useAiQuotaStore, DAILY_AI_LIMIT } from '../stores/aiQuota';
import { useAuthStore } from '../stores/auth';
import { GUEST_ID } from '../data/vocab';

// Two paths:
//  - User added their own key in Settings → call their provider directly.
//  - Otherwise → the `ai-chat` Supabase Edge Function, which holds our Groq key
//    and enforces the daily quota. Requires a signed-in (non-guest) user.

/** The user's own API key from Settings, or '' when they use the built-in AI. */
function getOwnApiKey(): string {
  return useAiQuotaStore.getState().getEffectiveApiKey('');
}

function getSignedInUserId(): string | null {
  const id = useAuthStore.getState().user?.id;
  return id && id !== GUEST_ID ? id : null;
}

/** True when built-in AI is unavailable because the user is a guest with no own key. */
export function aiNeedsSignIn(): boolean {
  return !getOwnApiKey() && !getSignedInUserId();
}

/** Get current provider config */
function getProviderConfig() {
  return useAiQuotaStore.getState().getProviderConfig();
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const SYSTEM_PROMPT = `You are Aama, a warm, patient Nepali language tutor.

TEACHING FORMAT — When introducing words or phrases, ALWAYS use this structure:
Nepali: [devanagari text]
Roman: [romanized text]
English: [translation]

RULES:
- Keep responses concise (2-4 sentences for basic queries, expand when asked)
- Adapt your teaching to the user's demonstrated level
- If user makes an error, gently correct with explanation
- If user speaks Nepali, respond in Nepali then give English translation
- Use natural conversational examples
- Encourage practice and celebrate progress
- NEVER use markdown formatting (no **, *, #, etc.) — plain text only
- NEVER comment on your own responses or say "I hope this helps"`;

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES,
): Promise<Response> {
  const res = await fetch(url, options);
  if (res.status === 429 && retries > 0) {
    const delay = BASE_DELAY_MS * Math.pow(2, MAX_RETRIES - retries);
    console.warn(`Groq API rate limited, retrying in ${delay}ms...`);
    await new Promise(r => setTimeout(r, delay));
    return fetchWithRetry(url, options, retries - 1);
  }
  return res;
}

type LlmMessage = { role: string; content: unknown };
type CompletionOpts = { jsonMode?: boolean; vision?: boolean };

/** Call the user's own provider with their own key. */
async function directCompletion(
  apiKey: string,
  messages: LlmMessage[],
  { jsonMode = false, vision = false }: CompletionOpts,
): Promise<string | null> {
  const { baseUrl, model, visionModel } = getProviderConfig();
  const useModel = vision ? visionModel : model;
  if (!baseUrl || !useModel) return null;

  try {
    const res = await fetchWithRetry(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: useModel,
        messages,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.warn('LLM API error:', data.error?.message || res.status);
      return null;
    }

    return data?.choices?.[0]?.message?.content ?? null;
  } catch (e) {
    console.warn('LLM API fetch failed:', e);
    return null;
  }
}

/** Call the built-in AI through the ai-chat Edge Function. */
async function proxyCompletion(
  messages: LlmMessage[],
  { jsonMode = false, vision = false }: CompletionOpts,
): Promise<string | null> {
  const userId = getSignedInUserId();
  if (!supabase || !userId) return null;

  try {
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: { messages, jsonMode, vision },
    });

    if (error) {
      if (error instanceof FunctionsHttpError && error.context?.status === 429) {
        useAiQuotaStore.getState().syncQuota(userId, 0);
      } else {
        console.warn('ai-chat function error:', error.message);
      }
      return null;
    }

    if (typeof data?.remaining === 'number') {
      useAiQuotaStore.getState().syncQuota(userId, data.remaining);
    }
    return typeof data?.content === 'string' ? data.content : null;
  } catch (e) {
    console.warn('ai-chat invoke failed:', e);
    return null;
  }
}

async function completion(messages: LlmMessage[], opts: CompletionOpts = {}): Promise<string | null> {
  const ownKey = getOwnApiKey();
  return ownKey ? directCompletion(ownKey, messages, opts) : proxyCompletion(messages, opts);
}

async function llmChat(
  messages: { role: string; content: string }[],
  systemPrompt: string,
  jsonMode = false,
): Promise<string | null> {
  return completion([{ role: 'system', content: systemPrompt }, ...messages], { jsonMode });
}

/** Local mirror of the server quota; true when the user has none left today. */
function quotaExhausted(userId?: string): boolean {
  const quotaStore = useAiQuotaStore.getState();
  if (quotaStore.hasCustomKey() || !userId) return false;
  return quotaStore.getQuota(userId).remaining <= 0;
}

const QUOTA_MESSAGE = `You've reached your daily limit of ${DAILY_AI_LIMIT} AI messages. Add your own API key in Settings > Advanced for unlimited access, or wait until tomorrow. 🙏`;

export function isOffline(): boolean {
  return !networkManager.getIsConnected();
}

/** Get current AI quota for a user */
export function getAiQuota(userId: string) {
  return useAiQuotaStore.getState().getQuota(userId);
}

/** Check if user has custom API key (unlimited) */
export function hasUnlimitedAi(): boolean {
  return useAiQuotaStore.getState().hasCustomKey();
}

export interface TestApiKeyResult {
  success: boolean;
  error?: string;
  model?: string;
}

/** Test an API key with the current provider config */
export async function testApiKey(apiKey: string, baseUrl?: string, model?: string): Promise<TestApiKeyResult> {
  if (!networkManager.getIsConnected()) {
    return { success: false, error: 'No internet connection' };
  }

  const config = getProviderConfig();
  const url = baseUrl || config.baseUrl;
  const testModel = model || config.model;

  if (!url || !testModel) {
    return { success: false, error: 'Missing base URL or model' };
  }

  try {
    const res = await fetch(`${url}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: testModel,
        messages: [{ role: 'user', content: 'Say "ok" and nothing else.' }],
        max_tokens: 5,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.error?.message || `HTTP ${res.status}`,
      };
    }

    const reply = data?.choices?.[0]?.message?.content;
    if (reply) {
      return { success: true, model: testModel };
    }

    return { success: false, error: 'No response from model' };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Connection failed' };
  }
}

export async function sendMessage(
  history: ChatMessage[],
  newMessage: string,
  context?: string,
  userId?: string,
): Promise<string> {
  if (!networkManager.getIsConnected()) {
    return 'You are currently offline. Aama needs an internet connection to respond. Please reconnect and try again. 🙏';
  }

  if (aiNeedsSignIn()) {
    return 'Namaste! Please sign in with Google to chat with Aama — it\'s free. (Or add your own API key in Settings > Advanced.) 🙏';
  }

  if (quotaExhausted(userId)) return QUOTA_MESSAGE;

  const messages = history.map(msg => ({
    role: msg.role === 'model' ? 'assistant' : 'user',
    content: msg.text,
  }));

  messages.push({ role: 'user', content: newMessage });

  const systemPrompt = context ? `${SYSTEM_PROMPT}\n\n${context}` : SYSTEM_PROMPT;
  const reply = await llmChat(messages, systemPrompt);

  if (!reply) {
    // The server may have just told us the quota ran out.
    if (quotaExhausted(userId)) return QUOTA_MESSAGE;
    return 'Maaf garnuhos, Aama is having trouble thinking right now. Please try again in a moment. 🙏';
  }

  return reply;
}

export interface JournalFeedback {
  corrected: string;
  roman: string;
  explanation: string;
}

/** AI feedback on a Nepali journal entry. Returns null offline or on failure. */
export async function getJournalFeedback(
  prompt: string,
  userText: string,
  userId?: string,
): Promise<JournalFeedback | null> {
  if (aiNeedsSignIn() || quotaExhausted(userId)) return null;

  const content =
    `Journal prompt: ${prompt}\n` +
    `Learner's answer: ${userText}\n\n` +
    'Respond as JSON with keys: ' +
    '"corrected" (the corrected Nepali text in Devanagari; if already correct, repeat it), ' +
    '"roman" (romanization of the corrected text), ' +
    '"explanation" (1-4 short English sentences: first check if the answer logically responds to the prompt. If it\'s off-topic or doesn\'t make sense, gently point that out. Then note any language corrections, or praise if both content and grammar are good).';

  const result = await llmChat(
    [{ role: 'user', content }],
    'You are a Nepali language teacher correcting a beginner\'s journal entry. First evaluate whether the answer logically responds to the journal prompt. If it is unrelated or nonsensical, gently explain that. Then correct any Nepali grammar/spelling. Be gentle and concise. Output only valid JSON.',
    true,
  );

  if (!result) return null;
  try {
    const parsed = JSON.parse(result) as JournalFeedback;
    if (typeof parsed.corrected !== 'string' || typeof parsed.explanation !== 'string') return null;
    return { corrected: parsed.corrected, roman: parsed.roman || '', explanation: parsed.explanation };
  } catch {
    return null;
  }
}

export interface AiQuizQuestion {
  wordId: number;
  question: string;
  options: string[];
  answerIndex: number;
}

/**
 * Generate practice questions targeting the given mistake words.
 * Each returned question is validated to map to a real word id; invalid ones dropped.
 * Returns null offline or on failure (caller should fall back to local quiz builder).
 */
export async function generateMistakeQuiz(
  words: { id: number; english: string; nepali: string; roman: string }[],
  userId?: string,
): Promise<AiQuizQuestion[] | null> {
  if (words.length === 0) return null;
  if (aiNeedsSignIn() || quotaExhausted(userId)) return null;

  const wordList = words
    .map(w => `id=${w.id}: ${w.english} = ${w.nepali} (${w.roman})`)
    .join('\n');

  const content =
    `Vocabulary the learner keeps getting wrong:\n${wordList}\n\n` +
    'Create one multiple-choice question per word that tests it in a fresh way ' +
    '(fill-in-the-blank sentence, usage context, or translation variation). ' +
    'Respond as JSON: {"questions": [{"wordId": number (must be one of the ids above), ' +
    '"question": string (English, may embed Nepali in Devanagari), ' +
    '"options": [4 strings], "answerIndex": number (0-3)}]}';

  const result = await llmChat(
    [{ role: 'user', content }],
    'You create short Nepali vocabulary quiz questions for a beginner. Output only valid JSON.',
    true,
  );

  if (!result) return null;
  let parsed: { questions?: AiQuizQuestion[] };
  try {
    parsed = JSON.parse(result);
  } catch {
    return null;
  }

  if (!Array.isArray(parsed?.questions)) return null;

  const validIds = new Set(words.map(w => w.id));
  const valid = parsed.questions.filter(q =>
    q &&
    validIds.has(q.wordId) &&
    typeof q.question === 'string' &&
    Array.isArray(q.options) &&
    q.options.length === 4 &&
    q.options.every(o => typeof o === 'string') &&
    typeof q.answerIndex === 'number' &&
    q.answerIndex >= 0 &&
    q.answerIndex < 4
  );

  return valid.length > 0 ? valid : null;
}

export interface IdentifiedObject {
  english: string;
  nepali: string;
  roman: string;
}

/** Identify objects in a photo and name them in Nepali. Returns null offline or on failure. */
export async function identifyObjects(base64: string, userId?: string): Promise<IdentifiedObject[] | null> {
  if (!networkManager.getIsConnected()) return null;
  if (aiNeedsSignIn() || quotaExhausted(userId)) return null;

  const content = [
    {
      type: 'text',
      text:
        'Identify up to 6 distinct physical objects visible in this photo. ' +
        'For each, give its Nepali name. Respond as JSON: ' +
        '{"objects": [{"english": string, "nepali": string (Devanagari script), "roman": string (romanized spelling)}]}',
    },
    {
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${base64}` },
    },
  ];

  const raw = await completion([{ role: 'user', content }], { jsonMode: true, vision: true });
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { objects?: IdentifiedObject[] };
    if (!Array.isArray(parsed.objects)) return null;

    const valid = parsed.objects.filter(
      o => o && typeof o.english === 'string' && typeof o.nepali === 'string' && typeof o.roman === 'string',
    );

    return valid.length > 0 ? valid : null;
  } catch (e) {
    console.warn('Vision response parse failed:', e);
    return null;
  }
}
