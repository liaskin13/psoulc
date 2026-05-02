-- play_events table + RLS
-- Run in Supabase SQL Editor (project dashboard -> SQL Editor)

create extension
if not exists pgcrypto;

create table
if not exists play_events
(
  id uuid primary key default gen_random_uuid
(),
  track_id uuid not null references tracks
(id) on
delete cascade,
  event_type text
not null check
(event_type in
('play', 'pause', 'seek', 'skip', 'duration')),
  session_owner text,
  duration_s numeric,
  created_at timestamptz not null default now
()
);

create index
if not exists play_events_track_id_idx on play_events
(track_id);
create index
if not exists play_events_created_at_idx on play_events
(created_at desc);

alter table play_events enable row level security;

drop policy
if exists play_events_insert_anon on play_events;
create policy play_events_insert_anon
on play_events
for
insert
to anon
with check (
track_id
is
not
null
and
event_type
in
('play', 'pause', 'seek', 'skip', 'duration')
  and
(duration_s is null or
(duration_s >= 0 and duration_s <= 86400))
  and
(session_owner is null or char_length
(session_owner) <= 64)
);

drop policy
if exists play_events_insert_authenticated on play_events;
create policy play_events_insert_authenticated
on play_events
for
insert
to authenticated
with check (
track_id
is
not
null
and
event_type
in
('play', 'pause', 'seek', 'skip', 'duration')
  and
(duration_s is null or
(duration_s >= 0 and duration_s <= 86400))
  and
(session_owner is null or char_length
(session_owner) <= 64)
);
