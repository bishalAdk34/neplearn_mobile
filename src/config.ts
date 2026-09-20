import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const GOOGLE_CLIENT_ID = extra.googleClientId ?? '';
export const GOOGLE_ANDROID_CLIENT_ID = extra.googleAndroidClientId ?? '';
export const GOOGLE_IOS_CLIENT_ID = extra.googleIosClientId ?? '';
export const SUPABASE_URL = extra.supabaseUrl ?? '';
export const SUPABASE_ANON_KEY = extra.supabaseAnonKey ?? '';
export const GEMINI_API_KEY = extra.geminiApiKey ?? '';
export const GROQ_API_KEY = extra.groqApiKey ?? '';

/** Returns names of required env keys that are missing, for a clear startup warning. */
export function getMissingConfigKeys(): string[] {
  const required: Record<string, string> = {
    GOOGLE_CLIENT_ID,
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
  };
  return Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);
}
