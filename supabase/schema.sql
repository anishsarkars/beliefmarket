-- ============================================================
-- Belief Market — Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).
-- Safe to re-run.
-- ============================================================

-- ---------- PROFILES ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  name text not null,
  avatar_url text,
  bio text default 'Building conviction, one belief at a time.',
  points integer not null default 10000,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- ---------- AUTO-CREATE PROFILE ON SIGNUP ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base_username text;
  final_username text;
  suffix int := 0;
begin
  base_username := coalesce(
    nullif(new.raw_user_meta_data->>'username', ''),
    split_part(new.email, '@', 1)
  );
  base_username := lower(regexp_replace(base_username, '[^a-zA-Z0-9_]', '', 'g'));
  if base_username is null or base_username = '' then
    base_username := 'user';
  end if;

  final_username := base_username;
  while exists (select 1 from public.profiles where username = final_username) loop
    suffix := suffix + 1;
    final_username := base_username || suffix::text;
  end loop;

  insert into public.profiles (id, username, name, avatar_url)
  values (
    new.id,
    final_username,
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), final_username),
    'https://api.dicebear.com/7.x/thumbs/svg?seed=' || final_username ||
      '&backgroundColor=111111,0d0d0d,1a1a1a'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- BELIEFS ----------
create table if not exists public.beliefs (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  prediction text not null,
  topic text not null,
  category text not null,
  time_horizon text not null,
  description text not null default '',
  evidence text not null default '',
  sources text[] not null default '{}',
  confidence integer not null default 50,
  risk_factors text[] not null default '{}',
  conviction integer not null default 50,
  conviction_label text not null default 'Building',
  status text not null default 'debating',
  debate jsonb not null default '{}'::jsonb,
  believe_count integer not null default 1,
  cope_count integer not null default 0,
  neutral_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.beliefs enable row level security;

drop policy if exists "Beliefs are viewable by everyone" on public.beliefs;
create policy "Beliefs are viewable by everyone"
  on public.beliefs for select using (true);

drop policy if exists "Users can create beliefs" on public.beliefs;
create policy "Users can create beliefs"
  on public.beliefs for insert with check (auth.uid() = author_id);

drop policy if exists "Users can update own beliefs" on public.beliefs;
create policy "Users can update own beliefs"
  on public.beliefs for update using (auth.uid() = author_id);

drop policy if exists "Users can delete own beliefs" on public.beliefs;
create policy "Users can delete own beliefs"
  on public.beliefs for delete using (auth.uid() = author_id);

-- ---------- VOTES ----------
-- belief_id is text so votes can attach to seed beliefs ("b1") or real uuids.
create table if not exists public.belief_votes (
  id uuid primary key default gen_random_uuid(),
  belief_id text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  side text not null check (side in ('believe', 'cope', 'neutral')),
  created_at timestamptz not null default now(),
  unique (belief_id, user_id)
);

alter table public.belief_votes enable row level security;

drop policy if exists "Votes are viewable by everyone" on public.belief_votes;
create policy "Votes are viewable by everyone"
  on public.belief_votes for select using (true);

drop policy if exists "Users insert own votes" on public.belief_votes;
create policy "Users insert own votes"
  on public.belief_votes for insert with check (auth.uid() = user_id);

drop policy if exists "Users update own votes" on public.belief_votes;
create policy "Users update own votes"
  on public.belief_votes for update using (auth.uid() = user_id);

drop policy if exists "Users delete own votes" on public.belief_votes;
create policy "Users delete own votes"
  on public.belief_votes for delete using (auth.uid() = user_id);

-- ---------- COMMENTS ----------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  belief_id text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  side text check (side in ('believe', 'cope', 'neutral')),
  is_challenge boolean not null default false,
  likes integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

drop policy if exists "Comments are viewable by everyone" on public.comments;
create policy "Comments are viewable by everyone"
  on public.comments for select using (true);

drop policy if exists "Users can create comments" on public.comments;
create policy "Users can create comments"
  on public.comments for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete own comments" on public.comments;
create policy "Users can delete own comments"
  on public.comments for delete using (auth.uid() = user_id);
