# NepLearn Memory

## Deadline
- **Sunday** — Project must be finished by this weekend.
- **Reminder**: Remind the user about the deadline periodically (after building something or ~1 hour).

## Project Context
A React Native / Expo app (iOS/Android/Web) for learning Nepali vocabulary. Uses Supabase for auth and backend, Zustand + AsyncStorage for local state, NativeWind for styling.

## App Features (snapshot July 15, 2026 — post vocab expansion)

### Learning Core
| Feature | Route | XP | Notes |
|---|---|---|---|
| Vocabulary lessons | `/lesson` | +20/correct | 5-word multiple-choice per category; auto-marks learned |
| Category quiz | `/quiz/[category]` | +15/correct | 10 questions max; correct answers auto-learn via `learnWord` |
| Flashcards | `/flashcards/[category]` | — | Flip cards, Wikipedia image fetch, toggle learned |
| Browse/search vocab | `/learn` | — | Search English/Nepali/Roman; category filter chips |
| SRS review | `/review` | +20/10 correct | Leitner boxes 1–5, intervals 1/3/7/14/30 days; due words only; cloud-synced |
| Mistake practice | `/practice-mistakes` | — | Replays wrongly-answered words; AI quiz mode, offline fallback; resolved flag |
| Morning vocab | `/morning-vocab` | +20/correct | 5 daily words aligned to learning goal |

### Speaking / Listening / Writing
| Feature | Route | XP | Notes |
|---|---|---|---|
| Echo practice | `/echo-practice` | +30 + 10/word | Listen + speak; speech recognition (`ne-NP`, Levenshtein 0.7); TTS speed setting |
| Listening drills | `/listening` | +20 | Hear Nepali → pick English; 10 questions; slow/normal playback |
| Journal | `/journal` | +25/save | Free Nepali writing, daily prompts, Gemini feedback; offline-queued |
| Sentence builder | `/sentence-builder` | — | Word-order + fill-in-blank, 5-exercise sessions |

### Conversation (Gemini)
| Feature | Route | XP | Notes |
|---|---|---|---|
| AI tutor "Aama" | `/ai-tutor` | +20 after 3 exchanges | Persona chat, learner context (goal/level/learned words), history in `ai_chat_history` |
| Roleplay scenarios | `/roleplay` | +20 after 3 exchanges | Market, doctor, bus, hotel etc.; ephemeral (no cloud save) |

### Knowledge & Culture
- `/grammar` — expandable tips (formality tiers, verb endings), +5 XP first read
- `/culture` — expandable culture cards, +5 XP first read
- `/story` — folklore stories + comprehension quiz, audio + images, +20 XP

### Gamification & Progress
- XP level = `floor(xp / 500) + 1`; daily goal configurable (25/50/100, default 50)
- Streaks: auto-update on any XP activity, reset on missed day; one streak-freeze per ISO week
- `/progress` per-category mastery %, `/achievements` (14 milestone unlocks), `/leaderboard` weekly XP ranking, `/heatmap` activity calendar

### Vocabulary Data (`src/data/vocab.ts`)
- 320 words, 21 categories: greetings, numbers, colors, family, food, directions, days, time, adjectives, places, verbs, questions, body, animals, months (BS calendar), weather, transport, shopping, health, emotions, clothing
- Each word: Devanagari + roman + English + emoji/image URL; ids never reused after removal
- New categories (ids 203–327) back roleplay scenarios + goal personalization; need native-speaker review before store release

### Personalization
- Onboarding: goal (travel/culture/business/family) + level (beginner/intermediate/advanced)
- `GOAL_CATEGORY_PRIORITY` orders categories per goal; `CATEGORY_DIFFICULTY` reorders by level; drives recommendations, morning vocab, "Continue Learning"

### Cross-Cutting
- Offline-first: writes queue to AsyncStorage `nepali-offline-queue`; SyncManager replays FIFO on reconnect, max 3 retries; AI features skip/fallback offline
- Guest mode: `GUEST_ID = '__guest__'`, all features local-only, cloud ops skipped
- Auth: Google Sign-In idToken → Supabase; learned words sync bidirectionally
- TTS: `expo-speech` `ne-NP`, fallback Google TTS URL via `expo-av`; speed 0.55/0.8/1.0
- Images: Wikipedia thumbnails, in-memory Map cache; `Word.image` branches on `.startsWith('http')`
- Notifications: daily reminder + word-of-day, configurable times
- Quick-actions FAB (home/profile/learn/ai-tutor): echo, flashcards, Aama, daily quiz

### Stores (Zustand + AsyncStorage)
- `useVocabStore` (in `src/data/vocab.ts`) — learned words, local XP/streak, goal/level, onboarding flag
- `stores/srs.ts` — Leitner state per word, strength decay when overdue
- `stores/stats.ts` — review answers, sentences, listening sessions, grammar/culture read ids, goal days
- `stores/mistakes.ts` — per-word mistake count, source, resolved flag
- `stores/settings.ts` — TTS speed, daily XP goal, learning direction (en-to-ne/ne-to-en, default en-to-ne)
- `stores/auth.ts` — session

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

## 🚫 Git Push Blocked — GCP API Key Secret Detection

GitHub push protection **blocks pushes** containing the Gemini API key in `src/config.ts:18`.

The key `YOUR_GEMINI_API_KEY` is flagged as a "GCP API Key Bound to a Service Account" secret.

**To unblock:**
- Option 1: Remove key from commits and use env vars instead
- Option 2: Allow the secret at:
  https://github.com/bishalAdk34/neplearn_mobile/security/secret-scanning/unblock-secret/3FviE091wiQxjPQibXNI4NdAnkL

**Reminder**: Every time you start working, check this before pushing.

## Supabase Setup Checklist

### ✅ Done
1. Project created at supabase.com
2. `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `src/config.ts`

### ⏳ Tell Chigga When You're Back
3. Run `supabase/migrations/001_schema.sql` in Supabase SQL Editor
4. Enable Google Auth in Supabase dashboard, add redirect URI to Google Cloud Console
5. Verify: sign in via app → check `profiles` table for your row

## CTO/CEO Gap Analysis

Not implementation plan. Strategic review: what senior eng/CTO/CEO flag before shipping this Nepali-learning app wider, even solo-built.

### What's Solid (keep as-is)
- Offline-first queue (dedup, retry, dual sync) — `src/services/offlineQueue.ts`, `syncManager.ts`. Better than most indie apps.
- Zustand multi-store + guest mode clean separation.
- Notifications: streak-aware daily reminders, word-of-day, timezone (Nepal UTC+5:45) — nice touch.
- Deps current, no rot.
- Onboarding (goal+level) → personalization — good UX instinct.

### Critical Gaps (business-blocking)

**1. API key exposed client-side, no backend proxy** — GROQ_API_KEY shipped in app bundle (`src/config.ts` → `app.config.js`). Anyone decompiles APK, extracts key, drains quota or runs own workload on ur bill. CTO kills launch on this alone.
Fix: Supabase Edge Function / thin serverless proxy for Groq calls. Auth-gated, rate-limited server-side.

**2. Zero cost/abuse control on AI chat** — No per-user token cap, no daily quota, no request throttle beyond retry-on-429. One user (or bot) burns entire Groq quota for all users. No usage tracking = no visibility into cost driver.
Fix: Server-side rate limit (e.g. N msgs/day per user), track usage in `ai_chat_history` row count or separate counter table.

**3. Prompt injection unmitigated** — User text interpolated raw into prompts (`ai.ts` journal feedback, chat, quiz gen). Low stakes today (tutor bot) but if AI ever gates XP/rewards or handles PII, exploitable.
Fix: input sanitization, structured prompt templates, output schema validation (partially exists for quiz JSON — extend pattern).

**4. Guest → auth data migration missing** — Guest learns 50 words, builds streak, has AI chat history — then signs in. All local guest data orphaned, not merged to account. Massive retention leak: exactly the users motivated enough to sign up lose their progress.
Fix: on sign-in, detect existing guest AsyncStorage data, push to cloud under new user_id, clear guest keys.

**5. No revenue model** — Fully free, no ads/IAP/subscription. Fine for MVP/portfolio, not fine as "business." CEO asks: how does this survive Groq/Supabase bills at scale?
Fix: not urgent pre-PMF, but flag: freemium (AI chat cap for free tier, unlimited for paid) fits existing XP-cap pattern already in code.

**6. No crash reporting / telemetry** — Zero Sentry/PostHog/analytics. All errors → console.warn, invisible in production. Can't see crash rate, can't see feature usage, can't debug user-reported bugs without repro.
Fix: Sentry (crash+perf) minimum bar. Add before any real user base.

### Major Gaps (quality/scale)

**7. Testing near-zero** — 2 test files (~170 lines) covering offline queue + personalization logic only. Services (ai.ts, db.ts, syncManager.ts), stores, components — untested. Any refactor is blind.
Fix: prioritize sync/queue logic (already partially covered), auth store, SRS algorithm — highest-risk-of-silent-bug areas.

**8. Sync race conditions** — XP inserts are append-only + queue replay → duplicate rows possible on retry (RPC sum hides it but DB bloats). Learned-words union sync has no delete-conflict handling (unlearn offline + relearn cloud = ambiguous). SRS "latest wins" can silently drop concurrent-device reviews.
Fix: idempotency keys on XP inserts, explicit tombstone for unlearn events.

**9. No CI** — No GitHub Actions. No automated typecheck/test/lint gate on PR. `npm run typecheck` and `npm test` exist but nobody forces them to pass before merge.
Fix: minimal workflow — typecheck + test on PR.

**10. Accessibility: zero** — No accessibilityLabel/Role anywhere. Excludes visually-impaired learners entirely, also App Store/Play Store increasingly weight this in review guidelines.

**11. i18n: English-only UI, one direction** — Teaches English-speakers→Nepali only. No UI localization. Fine for target market (diaspora kids, English speakers) but caps addressable market — e.g. Nepali speakers wanting to learn English (arguably bigger market) excluded structurally. *(Learning-direction half of this addressed July 29 — see toggle in settings.ts/direction.ts; UI localization still open.)*

**12. SRS is naive Leitner, not real spaced repetition** — Fixed box intervals (1/3/7/14/30 days), no per-item difficulty (e-factor), no adaptive scheduling. Works, but competitors (Anki-style apps) use SM-2/FSRS for meaningfully better retention. Differentiator opportunity if "smarter than Duolingo" is the pitch.

**13. Content depth: ~320 words, 21 categories** — Thin compared to established competitors (Duolingo Nepali-adjacent courses, Drops: 1000s of words). Fine for MVP, but retention past week 2 needs more content or generative content pipeline (AI already integrated — could generate contextual sentences/stories from existing vocab, extending life of same 320 words).

**14. Supabase RLS not verified in repo** — `db.ts` assumes RLS policies exist server-side (not IaC'd, not in repo). No way to audit/version security rules. If RLS misconfigured, any user could read/write others' data via anon key.
Fix: export/version RLS policies as SQL migration files in repo.

### Minor / Polish
- Custom scoped RN voice package (`@dev-amirzubair/react-native-voice`) — single-maintainer, unclear support. Risk if abandoned.
- `identifyObjects()` in ai.ts stubbed (returns null, Groq free tier no vision) — dead code path or planned feature left half-done.
- iOS OAuth client ID placeholder per AGENTS.md — iOS sign-in currently broken until replaced.
- Several `any` types noted in AGENTS.md — type-safety debt.
- App version hardcoded 1.0.0 in app.config.js, only build number auto-increments — version bumps manual, easy to forget.

### Priority If Fixing (order)
1. API key proxy (security, blocking)
2. Guest→auth migration (retention, blocking)
3. AI abuse/cost control (cost, blocking)
4. Crash reporting (Sentry) — visibility prerequisite for everything else
5. CI gate (typecheck+test on PR)
6. Sync idempotency (XP dup, unlearn tombstone)
7. Then: accessibility, SRS upgrade, content expansion, i18n — in whatever order matches actual user feedback
