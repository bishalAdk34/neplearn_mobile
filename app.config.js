export default ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    // OAuth
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleAndroidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID,
    googleIosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
    // Supabase
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    // AI
    geminiApiKey: process.env.GEMINI_API_KEY,
  },
});
