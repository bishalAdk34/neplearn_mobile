# NepLearn

## Persona
- **User**: Address the user as "my lord".
- **Assistant**: Refer to yourself as "chigga".

Expo SDK 54 React Native app (iOS/Android/Web) for learning Nepali vocabulary.

## Commands

```sh
npm start          # expo dev server
npm run android    # start for Android
npm run ios        # start for iOS
npm run web        # start for web
npm test           # jest
npm run typecheck  # tsc --noEmit
```

## Architecture

### Entry & Routing
- `index.ts` → imports `react-native-gesture-handler` then `expo-router/entry`
- File-based routing under `app/` — all screens `headerShown: false`
- Custom `SplashScreen` component shown before Stack renders (1.8s, animated dismiss)
- Route params use `useGlobalSearchParams` (not `useLocalSearchParams`)

### Path alias
`@/` maps to project root (e.g. `import { vocab } from '@/src/data/vocab'`)

### Styling
NativeWind (Tailwind CSS for RN) — `className` prop, `global.css` imported in `_layout.tsx`

### State (Zustand)
- `useVocabStore` — tracks learned words per user, XP, streaks, persisted to AsyncStorage key `nepali-vocab`
- `useAuthStore` — Supabase auth session (no persist middleware; Supabase handles session persistence internally)
- Guest mode: `GUEST_ID = '__guest__'` — all features work without auth
- Import both stores from their source files (`src/data/vocab.ts` and `src/stores/auth.ts`)

### Data
- 327 words across 21 categories in `src/data/vocab.ts`
- `Word.image` can be an emoji string or an HTTP URL — code checks `.startsWith('http')` to decide
- Category metadata (emoji, gradient colors) lives in `CATEGORY_META` map in `src/data/vocab.ts`, imported by screens that need it
- `getWordsByCategory(cat)`, `shuffle()`, and `quizBuilder()` from `src/data/vocab.ts`

### Auth
- Supabase auth (natively handles Google OAuth, session persistence via AsyncStorage adapter)
- Google Sign-In via `@react-native-google-signin`
- Client IDs loaded from `.env` → `app.config.js` → `Constants.expoConfig.extra` at runtime

### Services
- **TTS** (`src/services/tts.ts`): tries `expo-speech` for `ne-NP` voice, falls back to Google Translate TTS URL via `expo-av`
- **Images** (`src/services/image.ts`): fetches Wikipedia page summary thumbnails, in-memory `Map` cache, falls back to first word of compound queries (e.g. "How are you?" → "How")
- **DB** (`src/services/db.ts`): Supabase CRUD — syncs learned words, journal entries, XP, streaks to cloud for authenticated users; guest users skip cloud ops; queues writes when offline
- **AI** (`src/services/ai.ts`): Groq API (llama-3.3-70b-versatile), "Aama" tutor persona, offline-aware. Supports chat, journal feedback, mistake quiz generation. Photo identification is stubbed (no vision model).
- **Network** (`src/services/network.ts`): uses `expo-network` with fetch-based connectivity verification (`generate_204`)
- **OfflineQueue** (`src/services/offlineQueue.ts`): AsyncStorage-backed queue for failed writes, dedup support
- **SyncManager** (`src/services/syncManager.ts`): FIFO queue processor, 3 retries, auto-triggers on reconnect

### Backend (Supabase)
Tables: `profiles`, `user_learned_words`, `user_streaks`, `user_xp`, `journal_entries`, `ai_chat_history`
- Learned words sync bidirectionally (local → cloud on learn/unlearn, cloud → local on app start via `syncFromCloud`)
- XP earned from: lesson (+20/correct), quiz (+15/correct), journal (+25/save), echo practice (+30/complete)
- Streak auto-updated on any XP-earning activity; consecutive days tracked; resets on miss
- Journal entries persisted to `journal_entries` table
- Guest mode: all features work locally, no cloud sync
- `get_total_xp` RPC for efficient XP sum
- Auth: Supabase session with Google OAuth via `@react-native-google-signin`

### Offline-First Architecture
- `NetworkProvider` wraps app in `_layout.tsx`, initialized on mount
- Write ops (learn/unlearn word, add XP, save chat) queue to AsyncStorage when offline
- Queue key: `nepali-offline-queue`
- `SyncManager` processes queue FIFO on reconnect, max 3 retries per op
- AI Tutor shows offline banner, disables send button when disconnected
- `useNetworkState()` hook for components needing connectivity state

### Quiz
- Caps at 10 questions per session (`shuffle(getWordsByCategory(category)).slice(0, 10)`)
- Forward mode (Nepali→English) and reverse mode (English→Nepali via `?mode=reverse`)
- Correct answers auto-mark word as learned via `learnWord`
- SRS tracking, XP awards (15/correct), haptic & spring animations

### SRS (Spaced Repetition)
- `useSrsStore` tracks review schedules per word per user
- Records results after each quiz answer
- Persisted to AsyncStorage

## Config
- `app.config.js` reads `.env` via `dotenv` and injects values into `Constants.expoConfig.extra`
- `app.json` remains as a static reference but is not used at runtime
- `tsconfig.json`: extends `expo/tsconfig.base`, **strict mode enabled**, path alias `@/*` → `./*`
- Tailwind: custom `primary` color palette (#6366F1), `surface`, `text-primary`, `text-secondary`
- `.gitignore`: `.expo/`, `dist/`, `web-build/`, `expo-env.d.ts`, `/ios`, `/android`, `.env`
- `.env` is in `.gitignore`; copy `.env.example` to `.env` and fill in values

## Known Issues

### Missing Feature
| Needed For | Package | Status |
|---|---|---|
| Heatmap visualization | `react-native-svg` | ✅ Installed, chart implementation pending |

### Config Setup Required (manual)
- `GOOGLE_IOS_CLIENT_ID` in `.env` is a placeholder — must be replaced with a real iOS OAuth client ID from the Google Cloud Console before iOS Google Sign-In will work

### Stubs
- `identifyObjects()` in `src/services/ai.ts` returns `null` — Groq does not provide a vision model. Photo-vocab feature requires switching AI providers or adding a dedicated vision API.

### Quality
- Multiple `any` types (e.g., quiz `useState<any[]>([])`)
