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
