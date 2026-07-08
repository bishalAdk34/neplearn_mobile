import { GEMINI_API_KEY } from '../config';
import { networkManager } from './network';

const MODEL = 'gemini-2.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

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
    console.warn(`Gemini API rate limited, retrying in ${delay}ms...`);
    await new Promise(r => setTimeout(r, delay));
    return fetchWithRetry(url, options, retries - 1);
  }
  return res;
}

export function isOffline(): boolean {
  return !networkManager.getIsConnected();
}
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
    const res = await fetchWithRetry(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
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
