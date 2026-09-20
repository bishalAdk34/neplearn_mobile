const fs = require('fs');
const path = require('path');
try { require('dotenv').config(); } catch {}

const isDev =
  process.env.EAS_BUILD_PROFILE?.startsWith('dev') ||
  process.env.APP_ENV === 'development';

const envValues = {
  googleClientId: isDev
    ? (process.env.GOOGLE_CLIENT_ID_DEV ?? '')
    : (process.env.GOOGLE_CLIENT_ID ?? ''),
  googleAndroidClientId: isDev
    ? (process.env.GOOGLE_ANDROID_CLIENT_ID_DEV ?? '')
    : (process.env.GOOGLE_ANDROID_CLIENT_ID ?? ''),
  googleIosClientId: isDev
    ? (process.env.GOOGLE_IOS_CLIENT_ID_DEV ?? '')
    : (process.env.GOOGLE_IOS_CLIENT_ID ?? ''),
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? '',
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  groqApiKey: process.env.GROQ_API_KEY ?? '',
};

const envTs = [
  `export const GOOGLE_CLIENT_ID = '${envValues.googleClientId}';`,
  `export const GOOGLE_ANDROID_CLIENT_ID = '${envValues.googleAndroidClientId}';`,
  `export const GOOGLE_IOS_CLIENT_ID = '${envValues.googleIosClientId}';`,
  `export const SUPABASE_URL = '${envValues.supabaseUrl}';`,
  `export const SUPABASE_ANON_KEY = '${envValues.supabaseAnonKey}';`,
  `export const GEMINI_API_KEY = '${envValues.geminiApiKey}';`,
  `export const GROQ_API_KEY = '${envValues.groqApiKey}';`,
].join('\n') + '\n';

fs.writeFileSync(path.join(__dirname, '..', 'src', 'env.ts'), envTs);
console.log('Generated src/env.ts with env values');
