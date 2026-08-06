# NepLearn v2: Skill Tree + Mini-Games (Roadmap Plan)

> Status: **Implemented** (Phases A-E complete). Kept here as a record of the design decisions and scope, and as the source-of-truth if extending further (Phase F).

Scope: v2 gamification (post-MVP-publish). Priorities: skill-tree lesson map + mini-game variety. Additive only — must not touch in-flight onboarding/UI polish work (`app/_layout.tsx`, `app/learn.tsx`).

## Design Decisions

1. **Unit = existing Category** (1:1, zero risk to 327-word dataset / Supabase `user_learned_words`).
2. **Lesson = deterministic chunk of a category's words**, sorted by `id` ascending, size 5. Append-safe: new words always get higher ids, so future additions only append trailing lessons, never reshuffle existing ones.
3. **No new Zustand store.** Unlock/lesson logic = pure functions reading existing `learnedByUser` (from `useVocabStore`), same pattern as `src/data/personalization.ts`.
4. **Unlock thresholds**: lesson unlocks next lesson at ≥60% learned (not 100% — avoids permanent soft-lock from one missed word); unit unlocks next unit at ≥70% of prior unit.
5. Unit **order** reuses existing `getPrioritizedCategories(goal, level)` — no duplicate priority table.

## Phase A — Data Model + Unlock Logic (no UI change)

**Created:**
- `src/data/skillTree.ts` — types `SkillLesson`, `SkillUnit`, `NodeStatus`; fns `getLessonsForCategory`, `getLessonWords`, `buildSkillUnits(goal, level)`, `getUnitStatus`, `getLessonStatus`. Constants `LESSON_SIZE=5`, `UNIT_UNLOCK_THRESHOLD=0.7`, `LESSON_UNLOCK_THRESHOLD=0.6`.
- `__tests__/skillTree.test.ts` — mirrors `__tests__/personalization.test.ts` style: every word covered exactly once per category, threshold boundaries, category with `<5` words, `goal=null` fallback.

## Phase B — Skill Tree Screen (additive entry point)

**Created:**
- `app/skill-tree.tsx` — screen wiring `useVocabStore` + `buildSkillUnits`/status fns.
- `src/components/skillTree/SkillTreePath.tsx` — SVG zig-zag connector (`react-native-svg`, same pattern as `BottomNav.tsx`'s `buildBarPath()`).
- `src/components/skillTree/LessonNode.tsx` — circular node, `react-native-reanimated` scale-in + pulse on next-unlocked node (first real use of Reanimated 4.1 in the app).
- `src/components/skillTree/UnitHeader.tsx` — category banner via `CATEGORY_META`.

**Modified (additive lines only):**
- `app/_layout.tsx` — `<Stack.Screen name="skill-tree" .../>`.
- `app/learn.tsx` — one tile added to "Skills & Practice" array: Skill Path.
- `app/lesson.tsx` — extended to accept optional `lessonIndex` param; when present + `category` set, calls `getLessonWords(category, lessonIndex)` instead of `shuffle(words).slice(0,5)`. Fully backward-compatible — every caller that omits the param keeps the old random-5 behavior.

## Phase C — Mini-Game 1: Listen-and-Type (lowest risk, no DB migration)

Play `word.nepali` via existing `speak()`, learner types `word.roman`, fuzzy-matched.

**Created:**
- `src/utils/spellingMatch.ts` (+ test) — case-insensitive/edit-distance compare.
- `app/listen-type.tsx` — route file, follows `sentence-builder.tsx`/`listening.tsx` pattern (TextInput exercise, not MCQ engine).

**Modified:** `app/_layout.tsx` (+1 route), `app/learn.tsx` (+1 tile).

**XP source:** reused existing `'listening'` — zero schema risk.

## Phase D — Mini-Game 2: Match Pairs (required DB migration)

⚠️ `supabase/migrations/002_xp_sources_and_srs.sql:9-10`: `user_xp.source` has a hard `CHECK` constraint enumerating allowed values. Adding a new XP source in code without widening this constraint makes every insert fail and retry forever in the offline queue — same bug class migration 002 fixed for `'ai_tutor'`.

**Created:**
- `supabase/migrations/005_xp_sources_v2.sql` — widens the CHECK constraint (adds `match_pairs`, later `speak_check` in Phase E). **Not yet applied to the live DB — must be run manually before shipping match-pairs/speak-check.**
- `src/utils/matchPairsBuilder.ts` (+ test) — `buildMatchPairs(words, count)`.
- `src/components/MatchPairsSession.tsx` — tap-to-match two shuffled columns (English/Nepali).
- `app/match-pairs.tsx` — route wrapper.

**Modified:** `src/services/db.ts` (`XpSource` union), `src/stores/mistakes.ts` (`MistakeSource` union), `app/_layout.tsx`, `app/learn.tsx`.

## Phase E — Mini-Game 3: Speak-and-Check + skill-tree exercise-type wiring

Differs from `echo-practice.tsx` (repeat-after-me): shows only the English word, requires production recall of Nepali — harder skill, separate SRS signal. Reuses existing `useSpeechRecognition()` + `isPronunciationMatch()` (already power echo-practice), no new native/permission work. XP: mirrors echo-practice's `30 base + 10/correct`.

**Created:** `src/components/SpeakCheckSession.tsx`, `app/speak-check.tsx`.

**Modified:**
- `src/services/db.ts`, `src/stores/mistakes.ts` — added `'speak_check'`.
- `supabase/migrations/005_xp_sources_v2.sql` — bundled `speak_check` into the same (still-unapplied) migration rather than a new file.
- `app/_layout.tsx`, `app/learn.tsx`.
- `src/data/skillTree.ts` — added `ExerciseType` (`mcq | listen_type | match_pairs | speak_check`), `getExerciseType(lessonIndex)` (lesson 0 of every category always `mcq`, then cycles through the mini-games), `getRouteForLesson(lesson)` resolving pathname + params.
- `app/skill-tree.tsx` — node press now uses `getRouteForLesson` instead of a hardcoded `/lesson` push.

## Out of Scope (Phase F, future)

Promoting skill-tree to replace the primary `learn` tab / BottomNav target — deferred until B-E usage data justifies the UX change. Cloud leaderboard — explicitly excluded this round.

## Testing Convention

- Pure logic (A, C, D, E builders/routing): plain Jest, no RN rendering, same style as `__tests__/personalization.test.ts`.
- No `@testing-library/react-native` in repo — UI phases verified via `npm run typecheck` + manual QA, not component tests.
- XP/offline flow: routes through existing `awardXp()` → offline queue (covered by `__tests__/offlineQueue.test.ts`). Manual QA in airplane mode recommended for match-pairs/speak-check specifically, to confirm the new CHECK constraint doesn't silently reject queued inserts once migration 005 is applied.

## Key Files Referenced

- `src/data/personalization.ts` — pattern followed for `skillTree.ts`; `getPrioritizedCategories` called directly.
- `src/data/vocab.ts` — `Word`/`Category` types, `getWordsByCategory`, `CATEGORY_META`, id-stability guarantee.
- `app/lesson.tsx` — additive `lessonIndex` param.
- `supabase/migrations/002_xp_sources_and_srs.sql:9-10` — CHECK constraint pattern, template for `005_xp_sources_v2.sql`.
- `src/components/QuizSession.tsx` — reusable MCQ session engine; new mini-games follow its chrome/XP/SRS conventions where the interaction model fits.

## Outstanding Action Item

`supabase/migrations/005_xp_sources_v2.sql` must be run in the Supabase SQL Editor before match-pairs or speak-check reach real users — otherwise XP inserts for those sources fail and retry forever in the offline queue.
