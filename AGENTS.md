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
- **Home**: Notifications bell icon does nothing
- **Learn**: Search bar has no search logic; theme filter chips don't filter content; "Start Exploring", "Practice Phrases", "Start Simulation" buttons have no `onPress`
- **Profile**: Hardcoded user "Arjun" instead of `useAuthStore`; all stats (Level 14, XP, streak) are static; menu button, "View Heatmap", "View All Badges", "Continue Journey" do nothing
- **Story**: Audio player play button has no handler; "Next Chapter" and "Back to Folklore Map" do nothing
- **Settings**: All items (TTS Speed, Notifications, Daily Reminder, Clear Learned Words, Account) are non-functional
- **Journal**: "Save Entry" only shows an Alert — nothing is persisted

### Incomplete Features
- **AI Tutor** (`app/ai-tutor.tsx`): Static mock UI only — no actual AI/LLM integration
- **Echo Practice** (`app/echo-practice.tsx`): Plays audio but has no speech recognition to compare user's pronunciation
- **Streak system**: Fake — computed as `Math.min(totalLearned, 15)` instead of tracking actual consecutive days
- **XP system**: Computed on-the-fly (`totalLearned * 100`) with no persistence or history
- **Achievements**: Profile shows static array of 3 hardcoded achievements
- **Notifications**: No `expo-notifications` dependency; bell icon and daily reminder settings do nothing

### Code Defects
- `resetOnboarding` declared 12 times in `VocabState` type (`src/data/vocab.ts`) — dead code
- `learnWord` allows duplicate entries in `lesson.tsx` and `morning-vocab.tsx` (quiz guards against it)
- Quiz speaks **English** instead of Nepali (`speak(q.english, 'en-US')` in `app/quiz/[category].tsx:91`)
- `GOOGLE_ANDROID_CLIENT_ID` is still placeholder `YOUR_ANDROID_CLIENT_ID`
- Duplicate category metadata across `app/index.tsx` and `app/progress.tsx`

### Missing Dependencies
| Needed For | Package |
|---|---|
| Speech recognition (Echo Practice) | `@react-native-voice/voice` or similar |
| AI/LLM integration (AI Tutor) | API client (OpenAI, Gemini, etc.) |
| Push notifications | `expo-notifications` |
| Heatmap visualization | Charting library or custom SVG |

### Quality
- No lint, typecheck, or test scripts in `package.json`
- No TypeScript strict mode
- Multiple `any` types (e.g., quiz `useState<any[]>([])`)
