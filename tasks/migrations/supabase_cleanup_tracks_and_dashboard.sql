-- Supabase cleanup pass: quiet dashboard migration noise + harden tracks RLS
-- Run in Supabase SQL Editor (project dashboard -> SQL Editor)

begin;

-- 1) Quiet dashboard query noise: relation "supabase_migrations.schema_migrations" does not exist
create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (
  version text primary key,
  name text,
  statements text[],
  inserted_at timestamptz not null default now()
);

-- 2) Ensure tracks table has RLS enabled and policies aligned with app behavior
alter table if exists public.tracks enable row level security;

drop policy if exists tracks_select_public on public.tracks;
create policy tracks_select_public
  on public.tracks
  for select
  to anon, authenticated
  using (is_voided = false);

drop policy if exists tracks_insert_auth on public.tracks;
create policy tracks_insert_auth
  on public.tracks
  for insert
  to authenticated
  with check (true);

drop policy if exists tracks_update_auth on public.tracks;
create policy tracks_update_auth
  on public.tracks
  for update
  to authenticated
  using (true)
  with check (true);

-- no delete policy on purpose: soft-delete via is_voided

commit;

-- Optional verification:
-- select c.relrowsecurity as rls_enabled
-- from pg_class c
-- join pg_namespace n on n.oid = c.relnamespace
-- where n.nspname = 'public' and c.relname = 'tracks';
--
-- select policyname, roles, cmd, qual, with_check
-- from pg_policies
-- where schemaname = 'public' and tablename = 'tracks'
-- order by policyname;
