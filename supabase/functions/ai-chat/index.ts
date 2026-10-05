// Supabase Edge Function: proxies LLM calls so the Groq key never ships in the app.
//
// Deploy:
//   supabase secrets set GROQ_API_KEY=gsk_...
//   supabase functions deploy ai-chat
//
// Optional secrets: GROQ_MODEL, GROQ_VISION_MODEL, AI_DAILY_LIMIT (default 50,
// keep in sync with DAILY_LIMIT in src/stores/aiQuota.ts).
//
// Request body:  { messages: {role, content}[], jsonMode?: boolean, vision?: boolean }
// Response:      { content: string, remaining: number }
// Errors:        401 not signed in, 429 { error: 'quota', remaining: 0 }, 4xx/5xx { error }

import { createClient } from 'npm:@supabase/supabase-js@2';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = Deno.env.get('GROQ_MODEL') ?? 'qwen/qwen3.8-27b';
const VISION_MODEL = Deno.env.get('GROQ_VISION_MODEL') ?? MODEL;
const DAILY_LIMIT = Number(Deno.env.get('AI_DAILY_LIMIT') ?? '50');

// Abuse guards: the system prompt comes from the client, so cap what one call can cost.
const MAX_MESSAGES = 60;
const MAX_TEXT_CHARS = 40_000;
const MAX_IMAGE_CHARS = 6_000_000; // ~4.5MB base64
const MAX_TOKENS = 1500;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

type Message = { role: string; content: string | ContentPart[] };

/** Returns an error string, or null when the messages are acceptable. */
function validateMessages(messages: unknown, vision: boolean): string | null {
  if (!Array.isArray(messages) || messages.length === 0) return 'messages required';
  if (messages.length > MAX_MESSAGES) return 'too many messages';

  let textChars = 0;
  let imageChars = 0;
  for (const m of messages as Message[]) {
    if (!m || !['system', 'user', 'assistant'].includes(m.role)) return 'bad role';
    if (typeof m.content === 'string') {
      textChars += m.content.length;
    } else if (Array.isArray(m.content)) {
      for (const part of m.content) {
        if (part?.type === 'text' && typeof part.text === 'string') {
          textChars += part.text.length;
        } else if (vision && part?.type === 'image_url' && typeof part.image_url?.url === 'string') {
          if (!part.image_url.url.startsWith('data:image/')) return 'images must be data URLs';
          imageChars += part.image_url.url.length;
        } else {
          return 'bad content part';
        }
      }
    } else {
      return 'bad content';
    }
  }
  if (textChars > MAX_TEXT_CHARS) return 'messages too long';
  if (imageChars > MAX_IMAGE_CHARS) return 'image too large';
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const groqKey = Deno.env.get('GROQ_API_KEY');
  if (!groqKey) return json({ error: 'server not configured' }, 500);

  // Identify the caller from their Supabase session JWT.
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user || user.is_anonymous) return json({ error: 'sign in required' }, 401);

  let body: { messages?: unknown; jsonMode?: boolean; vision?: boolean };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid json' }, 400);
  }
  const vision = body.vision === true;
  const invalid = validateMessages(body.messages, vision);
  if (invalid) return json({ error: invalid }, 400);

  const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: count, error: quotaError } = await admin.rpc('consume_ai_quota', {
    p_user: user.id,
    p_limit: DAILY_LIMIT,
  });
  if (quotaError) {
    console.error('consume_ai_quota failed:', quotaError);
    return json({ error: 'quota check failed' }, 500);
  }
  if (count === null) return json({ error: 'quota', remaining: 0 }, 429);

  const refund = () => admin.rpc('refund_ai_quota', { p_user: user.id });

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: vision ? VISION_MODEL : MODEL,
        messages: body.messages,
        max_tokens: MAX_TOKENS,
        ...(body.jsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      console.error('Groq error:', res.status, data?.error?.message);
      await refund();
      // Pass upstream rate limiting through so the client can back off.
      return json({ error: 'upstream error' }, res.status === 429 ? 503 : 502);
    }

    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      await refund();
      return json({ error: 'empty response' }, 502);
    }

    return json({ content, remaining: Math.max(0, DAILY_LIMIT - (count as number)) });
  } catch (e) {
    console.error('Groq fetch failed:', e);
    await refund();
    return json({ error: 'upstream error' }, 502);
  }
});
