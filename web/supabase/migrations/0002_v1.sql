-- Heats · v1 schema
-- Replaces 0001_init.sql. Everything is server-mediated: our Next.js server uses the
-- Supabase service key, and every table has RLS enabled with NO policies, so the anon
-- and authenticated keys can read and write nothing. Clerk only answers "who is this";
-- there is no Clerk-to-Supabase token setup and no browser-side Supabase client.

create extension if not exists citext;

-- ───────────────────────── tables

-- id is the Clerk user id (e.g. "user_2abc…"). email is lowercased so it matches Luma RSVPs.
create table public.users (
  id          text primary key,
  alias       citext unique not null check (alias ~ '^[a-z0-9._]{3,20}$'),
  email       citext not null,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

create table public.heats (
  id             uuid primary key default gen_random_uuid(),
  number         int unique not null,
  name           text not null,
  opens_at       timestamptz not null,
  closes_at      timestamptz not null,
  location_terms text[] not null default '{}',
  min_km         numeric not null default 4.9,
  max_km         numeric not null default 5.6,
  created_at     timestamptz not null default now()
);

create type submission_status as enum ('auto_verified', 'needs_review', 'verified', 'rejected');

-- One live submission per runner per heat (the unique constraint). attempts counts resubmits
-- while a row is needs_review or rejected; a verified row is locked.
create table public.submissions (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null references public.users on delete cascade,
  heat_id       uuid not null references public.heats on delete cascade,
  image_path    text not null,
  sha256        text not null,                  -- exact duplicate
  dhash         text not null,                  -- 16 hex chars, near duplicate
  distance_km   numeric,
  time_s        int,
  pace_s_per_km int,
  ocr_raw       jsonb,
  vision_raw    jsonb,
  is_strava     boolean,
  location_ok   boolean,
  note          text check (char_length(note) <= 100),
  status        submission_status not null,
  review_reason text,                           -- not_strava | location | ocr_mismatch | distance | duplicate | runner_flagged | vision_unavailable
  attempts      int not null default 1,
  reviewed_by   text,
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now(),
  unique (user_id, heat_id)
);
create index on public.submissions (heat_id, sha256);
create index on public.submissions (heat_id, status);

-- Optional: Luma RSVP import.
create table public.rsvps (
  id         uuid primary key default gen_random_uuid(),
  email      citext not null,
  name       text,
  heat_id    uuid not null references public.heats on delete cascade,
  created_at timestamptz not null default now(),
  unique (email, heat_id)
);

-- The public results view: only stamped submissions, ranked per heat by time.
-- security_invoker: the view obeys RLS of the caller, so the public API (anon key) sees nothing.
-- Only our server (service key) reads it.
create view public.results with (security_invoker = true) as
select s.heat_id, u.alias, u.avatar_url, s.time_s, s.note,
       rank() over (partition by s.heat_id order by s.time_s) as place
from public.submissions s
join public.users u on u.id = s.user_id
where s.status in ('auto_verified', 'verified');

-- ───────────────────────── row-level security: on, with no policies

alter table public.users       enable row level security;
alter table public.heats       enable row level security;
alter table public.submissions enable row level security;
alter table public.rsvps       enable row level security;

-- Belt and braces: the public API roles get no table privileges at all.
revoke all on public.users, public.heats, public.submissions, public.rsvps, public.results from anon, authenticated;

-- ───────────────────────── storage: one private bucket for screenshots

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('proofs', 'proofs', false, 8388608, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- No storage policies: only the service key can read or write the bucket.

-- ───────────────────────── seed: Heat 001

insert into public.heats (number, name, opens_at, closes_at, location_terms, min_km, max_km) values
(1, 'Chilly Central Park 5K', '2026-10-10 00:00-04', '2026-10-10 23:59:59-04',
 ARRAY['Central Park', 'Reservoir', 'Jacqueline Kennedy Onassis Reservoir', 'Great Lawn', 'E 90th St', 'Engineer''s Gate', 'Fifth Avenue', 'Central Park West', 'East Drive', 'West Drive', '86th St', '96th St'],
 4.9, 5.6);
