# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/claude-code) when working with code in this repository.

## Project

NepLearn — Expo SDK 54 React Native app (iOS/Android/Web) for learning Nepali vocabulary.

## Commands

```sh
npm start          # expo dev server
npm run android    # expo run:android
npm run ios        # expo run:ios
npm run web        # expo start --web
```

No lint, test, or typecheck scripts exist. For type checking use `npx tsc --noEmit`.

## Architecture

### Entry & Routing
- `index.ts` → imports `react-native-gesture-handler` first, then `expo-router/entry`.
- expo-router file-based routing under `app/`. All screens use `headerShown: false`.
- Route params read via `useGlobalSearchParams` (not `useLocalSearchParams`).
- Custom animated `SplashScreen` component renders before the Stack in `app/_layout.tsx`.

### State (Zustand + AsyncStorage persistence)
- Stores live in two places: `src/stores/` (auth, srs, stats, mistakes, settings) and `src/data/vocab.ts` (`useVocabStore` — learned words + the vocab dataset itself).
- Guest mode: `GUEST_ID = '__guest__'`. Every feature works local-only without auth; guest users skip all cloud ops.

### Services (`src/services/`)
- `supabase.ts` — Supabase client.
- `db.ts` — cloud CRUD: learned words, journal entries, XP, streaks; queues writes when offline.
- `ai.ts` — Gemini integration, "Aama" tutor persona, offline-aware.
- `tts.ts` — tries `expo-speech` `ne-NP` voice, falls back to Google TTS URL via `expo-av`.
- `image.ts` — Wikipedia page-summary thumbnails, in-memory Map cache.
- `network.ts` — `expo-network` wrapper with listener pattern.
- `offlineQueue.ts` + `syncManager.ts` — offline-first write path (below).

### Offline-first
- `NetworkProvider` wraps the app in `app/_layout.tsx`; components use `useNetworkState()`.
- Write ops queue to AsyncStorage key `nepali-offline-queue` when offline.
- `SyncManager` replays the queue FIFO on reconnect, max 3 retries per op.

### Backend (Supabase)
- Tables: `profiles`, `user_learned_words`, `user_streaks`, `user_xp`, `journal_entries`, `ai_chat_history`. `get_total_xp` RPC for XP sums.
- Learned words sync bidirectionally (local → cloud on learn/unlearn; cloud → local on app start via `syncFromCloud`).
- Auth: Google Sign-In (`@react-native-google-signin`) idToken → `supabase.auth.signInWithIdToken`.

### Styling
NativeWind (Tailwind for RN) via `className`. Custom colors (`primary` #6366F1, `surface`, `text-primary`, `text-secondary`) in `tailwind.config.js`. `global.css` imported in `app/_layout.tsx`.

### Config
- Flow: `.env` → `app.config.js` (`process.env` → `expo.extra`) → `src/config.ts` (reads via `expo-constants`).
- Required keys listed in `.env.example`: Google OAuth client IDs, Supabase URL/anon key, Gemini API key.
- Path alias: `@/*` → project root (e.g. `import { vocab } from '@/src/data/vocab'`).

## Domain Notes

- XP: lesson +20/correct, quiz +15/correct, journal +25/save, echo practice +30/complete. Streak auto-updates on any XP-earning activity; resets on missed day.
- Quiz caps at 10 questions per session; correct answers auto-mark words as learned via `learnWord`.
- `Word.image` is either an emoji string or an HTTP URL — code branches on `.startsWith('http')`.
- Category metadata (emoji, gradient colors) is duplicated between `app/index.tsx` (`CATEGORY_META`) and `app/progress.tsx` (`CATEGORY_COLORS`/`CATEGORY_EMOJIS`) — update both.

## Known Gaps

- `/story` route file exists but is not registered in the `_layout.tsx` Stack — 404s when navigated to.
- Non-functional UI: Learn screen search bar and theme filter chips, Profile "View Heatmap", Story audio play / "Next Chapter" / "Back to Folklore Map".
- Quiz speaks English instead of Nepali (`speak(q.english, 'en-US')` in `app/quiz/[category].tsx`).
- No test infrastructure.

## See Also

`AGENTS.md` has more detailed specs. **Caveat:** its env/config section is outdated — it claims no env files are used and that the Gemini key is hardcoded in `src/config.ts`; current code reads all keys from `.env` via `app.config.js` → `expo-constants`.
