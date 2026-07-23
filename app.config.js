require('dotenv').config();

const isDev =
  process.env.EAS_BUILD_PROFILE?.startsWith('dev') ||
  process.env.APP_ENV === 'development';

module.exports = {
  expo: {
    scheme: isDev ? 'neplearn-dev' : 'neplearn',
    name: isDev ? 'NepLearn (Dev)' : 'NepLearn',
    slug: 'NepLearn',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#4F46E5',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: isDev ? 'com.neplearn.app.dev' : 'com.neplearn.app',
    },
    android: {
      googleServicesFile: './google-services.json',
      package: isDev ? 'com.neplearn.app.dev' : 'com.neplearn.app',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-web-browser',
      '@react-native-google-signin/google-signin',
      'expo-notifications',
      [
        'expo-image-picker',
        {
          photosPermission:
            'NepLearn uses your photos to identify objects and teach you their Nepali names.',
          cameraPermission:
            'NepLearn uses your camera to identify objects and teach you their Nepali names.',
        },
      ],
    ],
    extra: {
      googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
      googleAndroidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID ?? '',
      googleIosClientId: process.env.GOOGLE_IOS_CLIENT_ID ?? '',
      supabaseUrl: process.env.SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? '',
      geminiApiKey: process.env.GEMINI_API_KEY ?? '',
      groqApiKey: process.env.GROQ_API_KEY ?? '',
      router: {},
      eas: {
        projectId: '86e6ac25-acce-4ebb-a3b1-568dd84ea3b5',
      },
    },
  },
};
