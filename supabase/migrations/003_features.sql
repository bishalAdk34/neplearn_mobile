-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql/new)
-- Migration 003: heatmap RPC, journal AI feedback, streak freeze, weekly leaderboard

-- 1. RPC: daily XP totals for heatmap (security invoker; RLS already limits to own rows,
--    but filter by p_user_id explicitly anyway)
create or replace function public.get_daily_xp(p_user_id uuid)
returns table(day date, xp integer)
language sql stable
as $$
  select created_at::date as day, coalesce(sum(xp_amount), 0)::integer as xp
  from public.user_xp
  where user_id = p_user_id
  group by created_at::date
  order by day;
$$;

-- 2. Journal AI feedback
alter table public.journal_entries
  add column if not exists feedback_text text;

-- 3. Streak freeze (ISO week string, e.g. '2026-W28', when freeze was consumed)
alter table public.user_streaks
  add column if not exists freeze_week text;

-- 4. RPC: weekly leaderboard.
--    SECURITY DEFINER because RLS blocks cross-user reads of user_xp/profiles.
--    Returns only non-sensitive fields.
create or replace function public.get_weekly_leaderboard(p_limit integer default 50)
returns table(name text, avatar_url text, weekly_xp integer, rank bigint)
language sql stable
security definer
set search_path = public
as $$
  select
    coalesce(p.name, 'Learner') as name,
    p.avatar_url,
    sum(x.xp_amount)::integer as weekly_xp,
    rank() over (order by sum(x.xp_amount) desc) as rank
  from public.user_xp x
  join public.profiles p on p.id = x.user_id
  where x.created_at >= date_trunc('week', now())
  group by p.id, p.name, p.avatar_url
  order by weekly_xp desc
  limit greatest(1, least(p_limit, 100));
$$;

revoke all on function public.get_weekly_leaderboard(integer) from public;
revoke all on function public.get_weekly_leaderboard(integer) from anon;
grant execute on function public.get_weekly_leaderboard(integer) to authenticated;
