-- Fix: allow anon uploads from the PSC console.
-- PSC uses its own gate/code system — Supabase Auth is NOT used.
-- The anon key is used for all operations, so RLS must permit anon INSERT.
--
-- Run this in: Supabase Dashboard → SQL Editor → New query

-- ── 1. STORAGE: allow anon to upload into the "audio" bucket ─────────────
-- (storage.objects lives in the "storage" schema)

insert into storage.buckets (id, name, public)
values ('audio', 'audio', false)
on conflict (id) do update set public = false;

drop policy if exists "audio_anon_insert" on storage.objects;
create policy "audio_anon_insert"
  on storage.objects
  for insert
  to anon
  with check (bucket_id = 'audio');

drop policy if exists "audio_anon_select" on storage.objects;
create policy "audio_anon_select"
  on storage.objects
  for select
  to anon
  using (bucket_id = 'audio');

-- ── 2. TRACKS TABLE: open INSERT to anon ─────────────────────────────────
-- Drop old authenticated-only insert policy, replace with anon + authenticated

drop policy if exists tracks_insert_auth on public.tracks;

create policy tracks_insert_anon
  on public.tracks
  for insert
  to anon, authenticated
  with check (true);

-- ── 3. Confirm RLS is enabled (idempotent) ───────────────────────────────
alter table public.tracks enable row level security;
