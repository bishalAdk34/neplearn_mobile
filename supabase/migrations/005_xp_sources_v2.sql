-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql/new)
-- Migration 005: widen XP source CHECK for v2 mini-games (match_pairs, speak_check)
--
-- Same bug class migration 002 fixed for 'ai_tutor': inserting an XP row with
-- a source not in this CHECK constraint fails and retries forever in the
-- offline queue. Must be applied BEFORE shipping match-pairs / speak-check.

alter table public.user_xp drop constraint if exists user_xp_source_check;

alter table public.user_xp add constraint user_xp_source_check
  check (source in (
    'lesson',
    'quiz',
    'journal',
    'streak',
    'echo_practice',
    'ai_tutor',
    'review',
    'mistakes',
    'sentence',
    'listening',
    'grammar',
    'match_pairs',
    'speak_check'
  ));
