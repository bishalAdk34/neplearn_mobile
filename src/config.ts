import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

// Google OAuth client IDs
export const GOOGLE_CLIENT_ID = extra.googleClientId ?? '';
export const GOOGLE_ANDROID_CLIENT_ID = extra.googleAndroidClientId ?? '';
export const GOOGLE_IOS_CLIENT_ID = extra.googleIosClientId ?? '';

// Supabase
export const SUPABASE_URL = extra.supabaseUrl ?? '';
export const SUPABASE_ANON_KEY = extra.supabaseAnonKey ?? '';

// Google Gemini
export const GEMINI_API_KEY = extra.geminiApiKey ?? '';
