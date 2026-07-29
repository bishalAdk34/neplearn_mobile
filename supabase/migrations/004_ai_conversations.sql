-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql/new)
-- Migration 004: multi-conversation AI chat (Aama)

-- 1. Conversations table
create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'New chat',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.ai_conversations enable row level security;

drop policy if exists "Users can read own conversations" on public.ai_conversations;
create policy "Users can read own conversations"
  on public.ai_conversations for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own conversations" on public.ai_conversations;
create policy "Users can insert own conversations"
  on public.ai_conversations for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own conversations" on public.ai_conversations;
create policy "Users can update own conversations"
  on public.ai_conversations for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own conversations" on public.ai_conversations;
create policy "Users can delete own conversations"
  on public.ai_conversations for delete
  using (auth.uid() = user_id);

-- 2. Link chat history rows to a conversation (nullable, backward compat)
alter table public.ai_chat_history
  add column if not exists conversation_id uuid references public.ai_conversations(id) on delete cascade;

-- 3. Missing delete policy on ai_chat_history (only had select/insert before)
drop policy if exists "Users can delete own chat messages" on public.ai_chat_history;
create policy "Users can delete own chat messages"
  on public.ai_chat_history for delete
  using (auth.uid() = user_id);

-- 4. Backfill: one 'Legacy chat' conversation per user with pre-existing null-conversation rows.
--    Idempotent: only touches rows that are still unassigned.
do $$
declare
  r record;
  new_conv_id uuid;
begin
  for r in
    select distinct user_id
    from public.ai_chat_history
    where conversation_id is null
  loop
    insert into public.ai_conversations (user_id, title)
    values (r.user_id, 'Legacy chat')
    returning id into new_conv_id;

    update public.ai_chat_history
    set conversation_id = new_conv_id
    where user_id = r.user_id
      and conversation_id is null;
  end loop;
end $$;

-- 5. Indexes
create index if not exists ai_chat_history_conversation_id_idx
  on public.ai_chat_history (conversation_id);

create index if not exists ai_conversations_user_id_updated_at_idx
  on public.ai_conversations (user_id, updated_at desc);
