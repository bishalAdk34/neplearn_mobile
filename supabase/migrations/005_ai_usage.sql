-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql/new)
-- Migration 005: server-side daily AI quota for the ai-chat Edge Function

-- 1. Per-user, per-day (UTC) request counter
create table if not exists public.ai_usage (
  user_id uuid references auth.users(id) on delete cascade not null,
  day date not null default current_date,
  count integer not null default 0,
  primary key (user_id, day)
);

alter table public.ai_usage enable row level security;

-- Users may read their own usage; only the Edge Function (service role) writes.
drop policy if exists "Users can read own AI usage" on public.ai_usage;
create policy "Users can read own AI usage"
  on public.ai_usage for select
  using (auth.uid() = user_id);

-- 2. Atomically take one unit of quota. Returns the new count, or null when
--    the user is already at p_limit for today.
create or replace function public.consume_ai_quota(p_user uuid, p_limit integer)
returns integer
language sql
security definer
set search_path = public
as $$
  insert into public.ai_usage (user_id, day, count)
  values (p_user, current_date, 1)
  on conflict (user_id, day) do update
    set count = public.ai_usage.count + 1
    where public.ai_usage.count < p_limit
  returning count;
$$;

-- 3. Give one unit back when the upstream LLM call fails.
create or replace function public.refund_ai_quota(p_user uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.ai_usage
    set count = greatest(count - 1, 0)
    where user_id = p_user and day = current_date;
$$;

-- Only the service role (Edge Function) may call these.
revoke all on function public.consume_ai_quota(uuid, integer) from public, anon, authenticated;
revoke all on function public.refund_ai_quota(uuid) from public, anon, authenticated;
grant execute on function public.consume_ai_quota(uuid, integer) to service_role;
grant execute on function public.refund_ai_quota(uuid) to service_role;
