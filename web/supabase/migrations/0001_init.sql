-- Heats · MVP 1 schema
-- Auth comes from Clerk (Supabase third-party auth). The signed-in user is auth.jwt()->>'sub', a text id like "user_2abc…".

create or replace function public.uid() returns text
language sql stable as $$ select auth.jwt()->>'sub' $$;

-- ───────────────────────── tables

create table public.profiles (
  id          text primary key default public.uid(),
  alias       text unique not null check (alias ~ '^[a-z0-9._]{3,20}$'),
  avatar_url  text,
  home_park   text,
  created_at  timestamptz not null default now()
);

create table public.heats (
  id           uuid primary key default gen_random_uuid(),
  number       int unique not null,
  name         text not null,
  park         text not null,
  borough      text not null check (borough in ('Manhattan','Brooklyn','Queens','Bronx','Staten Island')),
  starts_at    timestamptz not null,
  meet_point   text not null,
  address      text,
  note         text,
  distance_km  numeric(4,2) not null default 5.0,
  color_key    text not null default 'volt',
  stamp_shape  text not null default 'circle' check (stamp_shape in ('circle','octagon','rect','oval')),
  course_key   text,
  cover_url    text,
  status       text not null default 'draft' check (status in ('draft','open','results','closed')),
  created_at   timestamptz not null default now()
);

create table public.registrations (
  heat_id     uuid not null references public.heats on delete cascade,
  user_id     text not null default public.uid() references public.profiles on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (heat_id, user_id)
);

create table public.results (
  id               uuid primary key default gen_random_uuid(),
  heat_id          uuid not null references public.heats on delete cascade,
  user_id          text not null default public.uid() references public.profiles on delete cascade,
  time_seconds     int  not null check (time_seconds between 600 and 7200),
  note             text check (char_length(note) <= 100),
  screenshot_path  text not null,
  status           text not null default 'pending' check (status in ('pending','verified','rejected')),
  reject_reason    text,
  reviewed_at      timestamptz,
  created_at       timestamptz not null default now(),
  unique (heat_id, user_id)
);

create index on public.results (heat_id, status);
create index on public.results (user_id, status);

-- Heat sheet: verified results, ranked per heat (ties share a place)
create view public.heat_sheet with (security_invoker = true) as
select r.heat_id,
       rank() over (partition by r.heat_id order by r.time_seconds) as place,
       r.id as result_id, r.user_id, p.alias, p.avatar_url,
       r.time_seconds, r.note, r.created_at
from public.results r
join public.profiles p on p.id = r.user_id
where r.status = 'verified';

-- ───────────────────────── row-level security

alter table public.profiles      enable row level security;
alter table public.heats         enable row level security;
alter table public.registrations enable row level security;
alter table public.results       enable row level security;

create policy "profiles are public" on public.profiles for select using (true);
create policy "create own profile"  on public.profiles for insert to authenticated with check (id = public.uid());
create policy "edit own profile"    on public.profiles for update to authenticated using (id = public.uid()) with check (id = public.uid());

create policy "published heats are public" on public.heats for select using (status <> 'draft');

create policy "registrations are public" on public.registrations for select using (true);
create policy "join an open heat" on public.registrations for insert to authenticated with check (
  user_id = public.uid()
  and exists (select 1 from public.heats h where h.id = heat_id and h.status = 'open')
);
create policy "leave a heat" on public.registrations for delete to authenticated using (user_id = public.uid());

create policy "verified or own results" on public.results for select
  using (status = 'verified' or user_id = public.uid());
create policy "post own result after the gun" on public.results for insert to authenticated with check (
  user_id = public.uid()
  and status = 'pending'
  and exists (select 1 from public.registrations r where r.heat_id = results.heat_id and r.user_id = public.uid())
  and exists (select 1 from public.heats h where h.id = results.heat_id and now() >= h.starts_at)
);
create policy "fix own pending result" on public.results for update to authenticated
  using (user_id = public.uid() and status = 'pending')
  with check (user_id = public.uid() and status = 'pending');

-- ───────────────────────── storage

insert into storage.buckets (id, name, public) values
  ('proofs', 'proofs', false),
  ('avatars', 'avatars', true),
  ('covers', 'covers', true)
on conflict (id) do nothing;

create policy "upload own proof" on storage.objects for insert to authenticated
  with check (bucket_id = 'proofs' and (storage.foldername(name))[1] = public.uid());
create policy "replace own proof" on storage.objects for update to authenticated
  using (bucket_id = 'proofs' and (storage.foldername(name))[1] = public.uid());
create policy "read own proof" on storage.objects for select to authenticated
  using (bucket_id = 'proofs' and (storage.foldername(name))[1] = public.uid());

create policy "upload own avatar" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = public.uid());
create policy "replace own avatar" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = public.uid());

-- ───────────────────────── season seed

insert into public.heats (number, name, park, borough, starts_at, meet_point, address, note, color_key, stamp_shape, course_key, status) values
(1, 'Central Park 5K',           'Central Park',          'Manhattan', '2026-10-10 10:00-04', 'Engineer''s Gate',  '5th Ave & E 90th St',       'Heat 001. The first one.',               'volt',    'circle',  'cp',    'open'),
(2, 'Prospect Park 5K',          'Prospect Park',         'Brooklyn',  '2026-10-17 09:00-04', 'Grand Army Plaza',  'Flatbush Ave & Plaza St',   'One full loop of the park drive.',       'coral',   'octagon', 'loop',  'open'),
(3, 'Hudson River 5K',           'Hudson River Greenway', 'Manhattan', '2026-10-25 08:00-04', 'Pier 84',           'W 44th St & 12th Ave',      'Flat, fast, out and back.',              'hudson',  'rect',    'line',  'open'),
(4, 'Brooklyn Bridge Sunset 5K', 'Brooklyn Bridge Park',  'Brooklyn',  '2026-10-31 17:30-04', 'Pier 1',            'Furman St & Old Fulton St', 'Halloween. Costumes encouraged.',        'sunset',  'circle',  'line2', 'open'),
(5, 'Randall''s Island 5K',      'Randall''s Island',     'Manhattan', '2026-11-07 09:00-05', 'Icahn Stadium',     'Randall''s Island Park',    'Track finish inside Icahn Stadium.',     'lilac',   'oval',    'oval',  'open'),
(6, 'Van Cortlandt XC 5K',       'Van Cortlandt Park',    'Bronx',     '2026-11-14 09:00-05', 'The Parade Ground', 'Broadway & W 242nd St',     'Real cross country. Bring trail shoes.', 'forest',  'octagon', 'xc',    'open'),
(7, 'Rockaway Boardwalk 5K',     'Rockaway Beach',        'Queens',    '2026-11-21 09:00-05', 'Beach 97th St',     'Rockaway Beach Blvd',       'Ocean on your left the whole way.',      'seafoam', 'rect',    'bw',    'open');
