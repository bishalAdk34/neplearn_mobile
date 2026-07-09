import { GEMINI_API_KEY } from '../config';
import { networkManager } from './network';

const MODEL = 'gemini-2.0-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

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

  const contents = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }],
  }));

  contents.push({
    role: 'user',
    parts: [{ text: newMessage }],
  });

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: context ? `${SYSTEM_PROMPT}\n\n${context}` : SYSTEM_PROMPT }],
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.warn('Gemini API error:', data.error?.message || res.status);
      return 'Maaf garnuhos, Aama is having trouble thinking right now. Please try again in a moment. 🙏';
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return 'Aama is searching for the right words... could you repeat that?';
    }

    return text;
  } catch (e) {
    console.warn('Gemini API fetch failed:', e);
    return 'Aama could not hear you. Check your connection and try again. 🙏';
  }
}

type GeminiPart = { text: string } | { inline_data: { mime_type: string; data: string } };

/** One-shot JSON-mode request. Returns parsed JSON or null on any failure. */
async function requestJson<T>(parts: GeminiPart[], systemPrompt: string): Promise<T | null> {
  if (!networkManager.getIsConnected()) return null;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.warn('Gemini JSON API error:', data.error?.message || res.status);
      return null;
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch (e) {
    console.warn('Gemini JSON request failed:', e);
    return null;
  }
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
  const result = await requestJson<JournalFeedback>(
    [{
      text:
        `Journal prompt (Nepali): ${prompt}\n` +
        `Learner's answer: ${userText}\n\n` +
        'Correct the learner\'s Nepali. Respond as JSON with keys: ' +
        '"corrected" (the corrected Nepali text in Devanagari; if already correct, repeat it), ' +
        '"roman" (romanization of the corrected text), ' +
        '"explanation" (1-3 short English sentences explaining the main correction, or praise if correct).',
    }],
    'You are a Nepali language teacher correcting a beginner\'s journal entry. Be gentle and concise. Output only valid JSON.'
  );
  if (!result || typeof result.corrected !== 'string' || typeof result.explanation !== 'string') {
    return null;
  }
  return { corrected: result.corrected, roman: result.roman || '', explanation: result.explanation };
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

  const result = await requestJson<{ questions: AiQuizQuestion[] }>(
    [{
      text:
        `Vocabulary the learner keeps getting wrong:\n${wordList}\n\n` +
        'Create one multiple-choice question per word that tests it in a fresh way ' +
        '(fill-in-the-blank sentence, usage context, or translation variation). ' +
        'Respond as JSON: {"questions": [{"wordId": number (must be one of the ids above), ' +
        '"question": string (English, may embed Nepali in Devanagari), ' +
        '"options": [4 strings], "answerIndex": number (0-3)}]}',
    }],
    'You create short Nepali vocabulary quiz questions for a beginner. Output only valid JSON.'
  );

  if (!result || !Array.isArray(result.questions)) return null;

  const validIds = new Set(words.map(w => w.id));
  const valid = result.questions.filter(q =>
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
export async function identifyObjects(base64: string): Promise<IdentifiedObject[] | null> {
  const result = await requestJson<{ objects: IdentifiedObject[] }>(
    [
      { inline_data: { mime_type: 'image/jpeg', data: base64 } },
      {
        text:
          'Identify up to 8 clearly visible everyday objects in this photo. ' +
          'Respond as JSON: {"objects": [{"english": string (one or two words), ' +
          '"nepali": string (Devanagari), "roman": string (romanized Nepali)}]}',
      },
    ],
    'You label objects in photos with their Nepali names for a language learner. Output only valid JSON.'
  );

  if (!result || !Array.isArray(result.objects)) return null;
  const valid = result.objects.filter(o =>
    o && typeof o.english === 'string' && typeof o.nepali === 'string' && typeof o.roman === 'string'
  );
  return valid.length > 0 ? valid : null;
}
