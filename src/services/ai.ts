import { GROQ_API_KEY } from '../config';
import { networkManager } from './network';

const MODEL = 'llama-3.3-70b-versatile';
const BASE_URL = 'https://api.groq.com/openai/v1';

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

async function groqChat(
  messages: { role: string; content: string }[],
  systemPrompt: string,
  jsonMode = false,
): Promise<string | null> {
  const allMessages = [{ role: 'system', content: systemPrompt }, ...messages];

  try {
    const res = await fetchWithRetry(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        messages: allMessages,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.warn('Groq API error:', data.error?.message || res.status);
      return null;
    }

    return data?.choices?.[0]?.message?.content ?? null;
  } catch (e) {
    console.warn('Groq API fetch failed:', e);
    return null;
  }
}

export function isOffline(): boolean {
  return !networkManager.getIsConnected();
}

export async function sendMessage(
  history: ChatMessage[],
  newMessage: string,
  context?: string,
): Promise<string> {
  if (!networkManager.getIsConnected()) {
    return 'You are currently offline. Aama needs an internet connection to respond. Please reconnect and try again. 🙏';
  }

  if (!GROQ_API_KEY) {
    return 'Maaf garnuhos, Aama\'s brain hasn\'t been configured yet. The developer needs to set the GROQ_API_KEY environment variable. 🙏';
  }

  const messages = history.map(msg => ({
    role: msg.role === 'model' ? 'assistant' : 'user',
    content: msg.text,
  }));

  messages.push({ role: 'user', content: newMessage });

  const systemPrompt = context ? `${SYSTEM_PROMPT}\n\n${context}` : SYSTEM_PROMPT;
  const reply = await groqChat(messages, systemPrompt);

  if (!reply) {
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
): Promise<JournalFeedback | null> {
  const content =
    `Journal prompt: ${prompt}\n` +
    `Learner's answer: ${userText}\n\n` +
    'Respond as JSON with keys: ' +
    '"corrected" (the corrected Nepali text in Devanagari; if already correct, repeat it), ' +
    '"roman" (romanization of the corrected text), ' +
    '"explanation" (1-4 short English sentences: first check if the answer logically responds to the prompt. If it\'s off-topic or doesn\'t make sense, gently point that out. Then note any language corrections, or praise if both content and grammar are good).';

  const result = await groqChat(
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
): Promise<AiQuizQuestion[] | null> {
  if (words.length === 0) return null;

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

  const result = await groqChat(
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
export async function identifyObjects(_base64: string): Promise<IdentifiedObject[] | null> {
  // Groq's free tier models are text-only — no vision/multimodal support
  console.warn('Photo analysis is not available on the current AI provider (Groq free tier)');
  return null;
}
