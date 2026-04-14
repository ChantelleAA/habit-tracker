-- Multi-user schema for Habit Tracker
-- Run this in the Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  auth_email text not null default '',
  reminder_email text not null default '',
  timezone text not null default 'UTC',
  reminder_time text not null default '08:00',
  reminders_enabled boolean not null default true,
  theme text not null default 'green',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migration: add theme column to existing databases
-- alter table public.profiles add column if not exists theme text not null default 'green';

create table if not exists public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  start_date date not null default current_date,
  updated_at timestamptz not null default now()
);

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '',
  cat text not null default 'health',
  freq text not null default 'daily',
  core boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checkins (
  id bigserial primary key,
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  check_date date not null,
  day_index integer not null,
  checked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, habit_id, check_date)
);

create table if not exists public.intentions (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  day_index integer not null,
  text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

create table if not exists public.reflections (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start_date date not null,
  week_index integer not null,
  text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start_date)
);

alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.habits enable row level security;
alter table public.checkins enable row level security;
alter table public.intentions enable row level security;
alter table public.reflections enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = user_id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "settings_select_own" on public.settings for select using (auth.uid() = user_id);
create policy "settings_insert_own" on public.settings for insert with check (auth.uid() = user_id);
create policy "settings_update_own" on public.settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "habits_select_own" on public.habits for select using (auth.uid() = user_id);
create policy "habits_insert_own" on public.habits for insert with check (auth.uid() = user_id);
create policy "habits_update_own" on public.habits for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "habits_delete_own" on public.habits for delete using (auth.uid() = user_id);

create policy "checkins_select_own" on public.checkins for select using (auth.uid() = user_id);
create policy "checkins_insert_own" on public.checkins for insert with check (auth.uid() = user_id);
create policy "checkins_update_own" on public.checkins for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "checkins_delete_own" on public.checkins for delete using (auth.uid() = user_id);

create policy "intentions_select_own" on public.intentions for select using (auth.uid() = user_id);
create policy "intentions_insert_own" on public.intentions for insert with check (auth.uid() = user_id);
create policy "intentions_update_own" on public.intentions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "intentions_delete_own" on public.intentions for delete using (auth.uid() = user_id);

create policy "reflections_select_own" on public.reflections for select using (auth.uid() = user_id);
create policy "reflections_insert_own" on public.reflections for insert with check (auth.uid() = user_id);
create policy "reflections_update_own" on public.reflections for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reflections_delete_own" on public.reflections for delete using (auth.uid() = user_id);
