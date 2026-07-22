# NepLearn

A cross-platform mobile app (iOS + Android + Web) for learning Nepali vocabulary, built with **Expo SDK 54** and **React Native**.

## Features

- **327+ vocabulary words** across 21 categories (travel, food, family, business, culture, etc.)
- **Spaced Repetition (SRS)** — optimizes review schedules for long-term retention
- **Quizzes** — forward (Nepali → English) and reverse (English → Nepali) modes, capped at 10 questions
- **AI Tutor "Aama"** — conversational practice powered by Groq (llama-3.3-70b)
- **Text-to-Speech** — native Nepali voice via `expo-speech` with Google Translate fallback
- **Echo Practice** — repeat Nepali phrases and get scored on pronunciation
- **Journal** — write daily entries and get AI feedback
- **Streaks & XP** — earn XP from lessons, quizzes, journal, and echo practice
- **Achievements & Leaderboard** — gamification to stay motivated
- **Google Sign-In** — optional auth with cloud sync via Supabase
- **Guest Mode** — all features work without signing in
- **Offline-First** — queue-based sync processes writes when connectivity returns

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 54 (React Native 0.81) |
| Language | TypeScript (strict mode) |
| Styling | NativeWind (Tailwind CSS for RN) |
| Navigation | expo-router (file-based routing) |
| State | Zustand (persisted via AsyncStorage) |
| Backend | Supabase (auth, database, RPC) |
| AI | Groq API (llama-3.3-70b-versatile) |
| Auth | Google OAuth (@react-native-google-signin) |
| Animations | react-native-reanimated |
| Gestures | react-native-gesture-handler |
| Testing | Jest + jest-expo |

## Prerequisites

- **Node.js** >= 18
- **npm** or **yarn**
- **Expo CLI** (`npm install -g expo-cli`)
- **iOS**: Xcode (for iOS simulator)
- **Android**: Android Studio (for Android emulator)
- **Web**: any modern browser

## Getting Started

### 1. Clone the repository

```sh
git clone https://github.com/bishalAdk34/neplearn_mobile.git
cd neplearn_mobile
```

### 2. Install dependencies

```sh
npm install
```

### 3. Set up environment variables

Copy the example env file and fill in your API keys:

```sh
cp .env.example .env
```

Open `.env` and provide the following values:

| Variable | Description | Where to get it |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Web OAuth client ID | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `GOOGLE_ANDROID_CLIENT_ID` | Android OAuth client ID | Google Cloud Console |
| `GOOGLE_IOS_CLIENT_ID` | iOS OAuth client ID | Google Cloud Console |
| `SUPABASE_URL` | Supabase project URL | [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → API |
| `SUPABASE_ANON_KEY` | Supabase anon/public key | Supabase Dashboard → Project Settings → API |
| `GEMINI_API_KEY` | Google Gemini API key | [AI Studio](https://aistudio.google.com/apikey) (optional - for image features) |
| `GROQ_API_KEY` | Groq API key | [Groq Console](https://console.groq.com/keys) (free, no credit card) |

> **Note:** Google Sign-In will not work without valid OAuth client IDs. All other features work in guest mode without auth.

### 4. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the schema from `supabase/migrations/` (or the SQL schema file) in your Supabase SQL editor
3. Copy your project URL and anon key into `.env`

### 5. Start the development server

```sh
npm start
```

This launches the Expo dev server. From here you can:

- Press **a** → open on Android emulator
- Press **i** → open on iOS simulator
- Press **w** → open in web browser

Or use the platform-specific commands:

```sh
npm run android   # Start for Android
npm run ios       # Start for iOS
npm run web       # Start for web
```

## Running Tests

```sh
npm test
```

## Type Checking

```sh
npm run typecheck
```

## Project Structure

```
neplearn_mobile/
├── app/                    # Expo Router screens (file-based routing)
│   ├── _layout.tsx         # Root layout (providers, splash screen)
│   ├── index.tsx           # Home / dashboard
│   ├── learn.tsx           # Browse & learn vocabulary
│   ├── quiz/               # Quiz screens
│   ├── flashcards/         # Flashcard screens
│   ├── ai-tutor.tsx        # AI tutor chat screen
│   ├── journal.tsx         # Journal entries
│   ├── echo-practice.tsx   # Pronunciation practice
│   ├── lesson.tsx          # Category-based lessons
│   ├── profile.tsx         # User profile & stats
│   ├── settings.tsx        # App settings
│   └── ...
├── src/
│   ├── components/         # Reusable UI components
│   ├── data/
│   │   └── vocab.ts        # 327 vocabulary words, categories, quiz builder
│   ├── services/
│   │   ├── ai.ts           # Groq AI client (tutor, journal feedback)
│   │   ├── db.ts           # Supabase CRUD operations
│   │   ├── tts.ts          # Text-to-speech (expo-speech + fallback)
│   │   ├── image.ts        # Wikipedia image fetching
│   │   ├── network.ts      # Connectivity monitoring
│   │   ├── offlineQueue.ts # AsyncStorage-backed offline queue
│   │   ├── syncManager.ts  # FIFO queue processor with retry
│   │   ├── streak.ts       # Streak calculation
│   │   ├── xp.ts           # XP management
│   │   └── supabase.ts     # Supabase client initialization
│   ├── stores/
│   │   ├── auth.ts         # Authentication state (Zustand)
│   │   ├── settings.ts     # User preferences
│   │   ├── srs.ts          # Spaced repetition schedules
│   │   ├── stats.ts        # Usage statistics
│   │   └── mistakes.ts     # Mistake tracking
│   ├── contexts/           # React contexts (network provider, etc.)
│   ├── hooks/              # Custom React hooks
│   ├── theme/              # Theme constants
│   └── utils/              # Utility functions
├── assets/                 # Images, icons, fonts
├── app.config.js           # Expo config (reads from .env)
├── tailwind.config.js      # Tailwind CSS / NativeWind config
├── tsconfig.json           # TypeScript config (strict mode, @/ alias)
├── babel.config.js         # Babel config (NativeWind, expo)
└── metro.config.js         # Metro bundler config (NativeWind)
```

## Architecture Highlights

- **Offline-first**: Writes are queued to AsyncStorage when offline and processed FIFO on reconnect (max 3 retries)
- **Guest mode**: No login required — all features work locally with persistent storage
- **Bidirectional sync**: Learned words, XP, streaks, and journal entries sync with Supabase when authenticated
- **Spaced Repetition**: Custom SRS algorithm tracks review schedules per word, optimizing for memory retention
- **File-based routing**: Uses expo-router with `headerShown: false` and route params via `useGlobalSearchParams`

## Scripts

| Command | Description |
|---|---|
| `npm start` | Start Expo dev server |
| `npm run android` | Start for Android |
| `npm run ios` | Start for iOS |
| `npm run web` | Start for web |
| `npm test` | Run Jest tests |
| `npm run typecheck` | Run TypeScript type checking |

## License

[MIT](LICENSE)
