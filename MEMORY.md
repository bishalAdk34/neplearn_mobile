# NepLearn Memory

## Deadline
- **Sunday** - Project must be finished by this weekend.
- **Reminder**: Remind the user about the deadline periodically (after building something or ~1 hour).

## Project Context
- **Lesson Screen**: Completely rewritten `app/lesson.tsx`. Now features dynamic word selection, multiple-choice answers, check/skip logic, TTS audio, visual feedback (green/red), and a completion summary.
- **Menu**: Added hamburger menu with Settings, Help, About, Sign Out.
- **Settings**: Created `app/settings.tsx` with placeholder options.
- **Backend**: Supabase integrated with hybrid Google OAuth (client Google Sign-In → `signInWithIdToken`). Session managed by Supabase.

## Done
### Phase 1 — Quick Wins & Bug Fixes
- Registered `/story` route in `_layout.tsx` Stack (was 404ing)
- Fixed quiz speaking English instead of Nepali (`'en-US'` → `'ne-NP'` in `app/quiz/[category].tsx`)
- Fixed `learnWord` allowing duplicate entries (added `isLearned` guard in `lesson.tsx` and `morning-vocab.tsx`)
- `resetOnboarding` dead code and duplicate category metadata were already cleaned up

### Backend Phase A+B — Supabase setup + Hybrid Auth
- Installed `@supabase/supabase-js`
- Created `src/services/supabase.ts` — Supabase client with AsyncStorage session persistence
- Created `supabase/migrations/001_schema.sql` — all tables (profiles, learned words, streaks, XP, journal, chat history) + RLS policies
- Updated `src/config.ts` — added `SUPABASE_URL` and `SUPABASE_ANON_KEY` placeholders
- Rewrote `src/stores/auth.ts` — no longer persists to AsyncStorage; Supabase handles session. Exposes `initialize()` and `clearUser()`.
- Updated `app/signin.tsx` — Google Sign-In → `supabase.auth.signInWithIdToken({ provider: 'google', token: idToken })`
- Wired `initializeAuth()` in `app/_layout.tsx` on splash finish
- Created `.env.example`

## Plan

### Phase 2 — Wire Up Non-Functional UI
- **Home**: Notifications bell icon handler
- **Learn**: Search + filter chip filtering logic; wire "Start Exploring", "Practice Phrases", "Start Simulation" buttons
- **Profile**: Wire preferences menu items (Help Center, About); use real auth data
- **Settings**: Implement TTS speed control, notifications toggle, daily reminder, clear learned words, account management
- **Story**: Wire audio play, Next Chapter, Back to Folklore Map
- **Journal**: Persist entries to AsyncStorage

### Phase 3 — Real Gamification
- **Streak**: Replace `Math.min(totalLearned, 15)` with real consecutive-day tracking in Zustand
- **XP**: Persistent XP store with level progression
- **Achievements**: Milestone-based unlock system

### Phase 4 — Feature Completeness
- **Echo Practice**: Add `@react-native-voice/voice` for speech recognition
- **AI Tutor**: Integrate Gemini/OpenAI API for real conversations
- **Notifications**: Add `expo-notifications`, wire bell + daily reminder
- **Heatmap**: Add charting lib / custom SVG for activity visualization

### Phase 5 — Quality
- ESLint, TypeScript strict mode, test scripts
- Remove `any` types (quiz `useState<any[]>` etc.)
- Extract shared types for category metadata
- Move OAuth client IDs to `.env`

### Backend Phase C — Sync user data to Supabase
- Learned words, XP, streaks, achievements → Supabase DB
- Guest data migration on signup

### Backend Phase D — AI Tutor Edge Function
- Supabase Edge Function (Deno) proxying to Gemini/OpenAI

### Backend Phase E — Journal persistence
- Save/load journal entries from `journal_entries` table

### Backend Phase F — Cleanup
- Remove old AsyncStorage-only stores
- Offline resilience layer (Zustand cache → sync to Supabase)

---
## Supabase Setup Progress

### ✅ Done
1. Project created at supabase.com
2. `SUPABASE_URL` and `SUPABASE_ANON_KEY` pasted into `src/config.ts`

### ⏳ Next Steps (when you're back, tell chigga)
3. **Enable Google Auth** in Supabase dashboard
   - Authentication → Providers → Google → Enable
   - Paste Web Client ID: `176881736395-29mk0b06ut3v239i07ijuqghg5mj9998.apps.googleusercontent.com`
   - Copy the Redirect URL shown (looks like `https://<project>.supabase.co/auth/v1/callback`)
   - Go to https://console.cloud.google.com/apis/credentials → edit your Web OAuth client → add that Redirect URL to Authorized redirect URIs
   - Click Save

4. **Run the SQL migration**
   - Supabase Dashboard → SQL Editor → New query
   - Open `supabase/migrations/001_schema.sql` from this project, copy contents, paste, click Run

5. **Verify**
   - Sign in via the app → check `profiles` table in Supabase for your row
