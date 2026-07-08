# NepLearn Memory

## Deadline
- **Sunday** — Project must be finished by this weekend.
- **Reminder**: Remind the user about the deadline periodically (after building something or ~1 hour).

## Project Context
A React Native / Expo app (iOS/Android/Web) for learning Nepali vocabulary. Uses Supabase for auth and backend, Zustand + AsyncStorage for local state, NativeWind for styling.

## Current State (July 2, 2026)

### What's Done
1. **Supabase OAuth** — Google Sign-In via `@react-native-google-signin` → `supabase.auth.signInWithIdToken`. Session managed by Supabase. Guest mode still works without auth.
2. **Database service** (`src/services/db.ts`) — Full CRUD for learned words, journal entries, XP, streaks against Supabase. Guest users skip cloud ops.
3. **Learned words sync** — Bidirectional. Local → cloud on learn/unlearn. Cloud → local on app start via `syncFromCloud`. Deduped with `Set` union merge.
4. **XP system** — Real persistence. +20/lesson, +15/quiz, +25/journal, +30/echo practice. `get_total_xp` RPC sums all XP. Profile fetches real total.
5. **Streak system** — Real consecutive-day tracking. Compares `last_activity_date` against today/yesterday. Resets on miss. Updates on any XP-earning activity.
6. **Journal persistence** — Saves to `journal_entries` table. Awards XP. Shows spinner while saving.
7. **Settings** — Clear learned words (wipes local + cloud), Account info, Sign Out wired up.
8. **Profile** — Uses real XP and streak from Supabase, falls back to local computation.
9. **Notifications** — `expo-notifications` installed, service layer (`src/services/notifications.ts`) handles permissions/scheduling/removal. Settings has toggle + time picker + test notification.
10. **Achievements** — 14 achievements with real unlock logic (words learned, categories mastered, streaks, XP). Dedicated screen + profile integration.
11. **Echo Practice Speech Recognition** — `@dev-amirzubair/react-native-voice` integrated. `useSpeechRecognition` hook (`src/hooks/useSpeechRecognition.ts`) wraps the Voice API. After audio plays, mic auto-starts listening in `ne-NP`. Recognized text compared against Nepali script via fuzzy matching (Levenshtein threshold 0.7). Correct → green +10 XP bonus per word. Wrong → red + retry/skip. 5s timeout fallback. Completion: +30 + (correctCount × 10) XP.
12. **AI Tutor** — Real Gemini 2.0 Flash integration via `src/services/ai.ts`. "Aama" persona teaches Nepali conversationally. Chat history persisted to Supabase `ai_chat_history` table.
13. **Offline-First Architecture** — Network detection + queue + auto-sync:
    - `src/services/network.ts` — NetInfo wrapper with listener pattern
    - `src/services/offlineQueue.ts` — AsyncStorage queue for failed writes (key: `nepali-offline-queue`)
    - `src/services/syncManager.ts` — FIFO processor, 3 retries max, auto-triggers on reconnect
    - `src/contexts/NetworkContext.tsx` + `src/hooks/useNetworkState.ts` — React context/hook for components
    - `db.ts` write ops queue on failure: LEARN_WORD, UNLEARN_WORD, ADD_XP, SAVE_CHAT_MESSAGE
    - AI Tutor shows offline banner, disables send when disconnected
    - Guest users unaffected (already local-only)

### SQL Migration ✅ RUN
Tables `profiles`, `user_learned_words`, `user_streaks`, `user_xp`, `journal_entries`, `ai_chat_history` + RPC `get_total_xp` are created.

### What's Next (Priority Order)
1. **Enable Google Auth** in Supabase dashboard (Authentication → Providers → Google) and add the redirect URI to Google Cloud Console
2. Wire up Story screen buttons (audio play, Next Chapter, Back to Folklore Map)
3. Quality: remove `any` types, lint

### Known Issues
- Story audio play button has no handler
- Story "Next Chapter" and "Back to Folklore Map" buttons have no `onPress`
- `any` types scattered across codebase
- Pre-existing TS errors in achievements.tsx, learn.tsx, profile.tsx, QuickActionsModal.tsx (not from offline changes)

## Supabase Setup Checklist

### ✅ Done
1. Project created at supabase.com
2. `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `src/config.ts`

### ⏳ Tell Chigga When You're Back
3. Run `supabase/migrations/001_schema.sql` in Supabase SQL Editor
4. Enable Google Auth in Supabase dashboard, add redirect URI to Google Cloud Console
5. Verify: sign in via app → check `profiles` table for your row
