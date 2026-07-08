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
```

No lint, typecheck, or test scripts exist.

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
- `useVocabStore` — tracks learned words per user, persisted to AsyncStorage key `nepali-vocab`
- `useAuthStore` — current user session, persisted to AsyncStorage key `nepali-auth`
- Guest mode: `GUEST_ID = '__guest__'` — all features work without auth
- Import both stores from their source files (`src/data/vocab.ts` and `src/stores/auth.ts`)

### Data
- 54 words across 10 categories in `src/data/vocab.ts`
- `Word.image` can be an emoji string or an HTTP URL — code checks `.startsWith('http')` to decide
- Category metadata (emoji, gradient colors) is **duplicated** across `app/index.tsx` (`CATEGORY_META`) and `app/progress.tsx` (`CATEGORY_COLORS`/`CATEGORY_EMOJIS`)
- `getWordsByCategory(cat)` and `shuffle()` from `src/data/vocab.ts`

### Auth
- Google OAuth via `expo-auth-session` — web client ID in `src/config.ts`
- Android client ID is a placeholder (`YOUR_ANDROID_CLIENT_ID`)
- Fetches user info from `googleapis.com/userinfo/v2/me`

### Services
- **TTS** (`src/services/tts.ts`): tries `expo-speech` for `ne-NP` voice, falls back to Google Translate TTS URL via `expo-av`
- **Images** (`src/services/image.ts`): fetches Wikipedia page summary thumbnails, in-memory `Map` cache, falls back to first word of compound queries (e.g. "How are you?" → "How")
- **DB** (`src/services/db.ts`): Supabase CRUD — syncs learned words, journal entries, XP, streaks to cloud for authenticated users; guest users skip cloud ops; queues writes when offline
- **AI** (`src/services/ai.ts`): Gemini 2.0 Flash integration, "Aama" tutor persona, offline-aware
- **Network** (`src/services/network.ts`): NetInfo wrapper with listener pattern for connectivity state
- **OfflineQueue** (`src/services/offlineQueue.ts`): AsyncStorage-backed queue for failed writes
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
- Correct answers auto-mark word as learned via `learnWord`

## Config notes
- `app.json`: scheme `neplearn`, `newArchEnabled: true`, `edgeToEdgeEnabled: true` on Android
- `tsconfig.json`: extends `expo/tsconfig.base`, path alias `@/*` → `./*`
- Tailwind: custom `primary` color palette (#6366F1), `surface`, `text-primary`, `text-secondary`
- `.gitignore`: `.expo/`, `dist/`, `web-build/`, `expo-env.d.ts`, `/ios`, `/android`
- Google OAuth config lives only in `src/config.ts` — no env files used

## Known Gaps & Missing Features

### Broken/Missing Routes
- `/story` exists as a file but is **NOT registered** in `_layout.tsx` Stack — will 404 when tapped from `/learn`

### Non-Functional UI Elements (no handlers)
- **Learn**: Search bar has no search logic; theme filter chips don't filter content
- **Profile**: "View Heatmap" does nothing
- **Story**: Audio player play button has no handler; "Next Chapter" and "Back to Folklore Map" do nothing

### Incomplete Features
- **Story**: Audio play button, "Next Chapter", "Back to Folklore Map" have no handlers

### Code Defects
- `resetOnboarding` declared 12 times in `VocabState` type (`src/data/vocab.ts`) — dead code
- Quiz speaks **English** instead of Nepali (`speak(q.english, 'en-US')` in `app/quiz/[category].tsx:91`)
- Duplicate category metadata across `app/index.tsx` and `app/progress.tsx`

### Installed Dependencies (previously missing)
| Feature | Package |
|---|---|
| Speech recognition | `@dev-amirzubair/react-native-voice` |
| AI/LLM | Gemini API (fetch-based) |
| Push notifications | `expo-notifications` |
| Network detection | `@react-native-community/netinfo` |

### Still Missing
| Needed For | Package |
|---|---|
| Heatmap visualization | Charting library or custom SVG |

### Quality
- No lint, typecheck, or test scripts in `package.json`
- No TypeScript strict mode
- Multiple `any` types (e.g., quiz `useState<any[]>([])`)
