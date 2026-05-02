-- tracks table: enable RLS + policies
-- Run in Supabase SQL Editor (project dashboard -> SQL Editor)
--
-- Access model:
--   SELECT  — public (anon) can read non-voided tracks for vault browsing
--   INSERT  — authenticated users only (console owners D/L uploading via INTAKE)
--   UPDATE  — authenticated users only (void operations)
--   DELETE  — blocked (soft-delete via is_voided only)

alter table public.tracks enable row level security;

-- ── Read: anyone can see active (non-voided) tracks ──────────────────────
drop policy
if exists tracks_select_public on public.tracks;
create policy tracks_select_public
  on public.tracks
  for
select
    to anon, authenticated
  using
(is_voided = false);

-- ── Insert: authenticated console owners only ────────────────────────────
drop policy
if exists tracks_insert_auth on public.tracks;
create policy tracks_insert_auth
  on public.tracks
  for
insert
  to authenticated
  with check (
true);

-- ── Update: authenticated users only (for void operations) ───────────────
drop policy
if exists tracks_update_auth on public.tracks;
create policy tracks_update_auth
  on public.tracks
  for
update
  to authenticated
  using (true)
with check
(true);

-- ── Delete: blocked entirely — use is_voided = true instead ──────────────
-- (no delete policy = no deletes allowed for any role)
