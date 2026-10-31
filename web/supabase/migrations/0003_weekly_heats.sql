-- Heats · weekly heats, stamps, no Clerk
-- A heat now runs a whole weekend (Sat 00:00 to Sun 23:59 NY time) in one park, and each heat has its
-- own stamp scene. Runners sign up for the heats they want (signups replaces the Luma rsvps import; the old rsvps table is left in place, unused).
-- users.id is now the Supabase Auth user id (email-code sign in). Everything stays server-mediated:
-- RLS on, no policies, service key only.

alter table public.heats
  add column if not exists park  text not null default 'Central Park',
  add column if not exists scene text not null default 'central_fall';

update public.heats set park = 'Central Park', scene = 'central_fall' where number = 1;

create table if not exists public.signups (
  user_id    text not null references public.users on delete cascade,
  heat_id    uuid not null references public.heats on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, heat_id)
);
create index if not exists signups_heat_idx on public.signups (heat_id);

alter table public.signups enable row level security;
revoke all on public.signups from anon, authenticated;

-- The 2026 weekend schedule. Locations can be changed from /admin.
insert into public.heats (number, name, park, scene, opens_at, closes_at, location_terms) values
(2,  'Central Park at Dusk',     'Central Park',          'central_dusk', '2026-10-31 00:00-04', '2026-11-01 23:59:59-05', array['Central Park','Reservoir','Jacqueline Kennedy Onassis Reservoir','Great Lawn','East Drive','West Drive','Engineer''s Gate']),
(3,  'Prospect Park 5K',         'Prospect Park',         'prospect',     '2026-11-07 00:00-05', '2026-11-08 23:59:59-05', array['Prospect Park','Grand Army Plaza','Park Slope','Prospect Park West','Lookout Hill','Long Meadow']),
(4,  'Hudson River 5K',          'Hudson River Greenway', 'hudson',       '2026-11-14 00:00-05', '2026-11-15 23:59:59-05', array['Hudson River Greenway','Hudson River Park','Riverside Park','Fort Washington Park','West Side Highway','Hudson River']),
(5,  'Flushing Meadows 5K',      'Flushing Meadows',      'flushing',     '2026-11-21 00:00-05', '2026-11-22 23:59:59-05', array['Flushing Meadows','Flushing Meadows Corona Park','Corona Park','Meadow Lake','Unisphere','Queens']),
(6,  'Brooklyn Bridge Park 5K',  'Brooklyn Bridge Park',  'bbp',          '2026-11-28 00:00-05', '2026-11-29 23:59:59-05', array['Brooklyn Bridge Park','DUMBO','Brooklyn Heights','Promenade','Pier 1','Brooklyn Bridge']),
(7,  'Astoria Park 5K',          'Astoria Park',          'astoria',      '2026-12-05 00:00-05', '2026-12-06 23:59:59-05', array['Astoria Park','Astoria','Shore Boulevard','Hell Gate','Ditmars','Queens']),
(8,  'Snowy Central Park 5K',    'Central Park',          'central_snow', '2026-12-12 00:00-05', '2026-12-13 23:59:59-05', array['Central Park','The Pond','Gapstow Bridge','The Mall','East Drive','West Drive']),
(9,  'Coney Island 5K',          'Coney Island',          'coney',        '2026-12-19 00:00-05', '2026-12-20 23:59:59-05', array['Coney Island','Riegelmann Boardwalk','Boardwalk','Brighton Beach','Surf Avenue','Brooklyn']),
(10, 'New Year''s Run',          'Central Park',          'nye',          '2026-12-26 00:00-05', '2026-12-27 23:59:59-05', array['Central Park','Reservoir','Great Lawn','East Drive','West Drive','Engineer''s Gate'])
on conflict (number) do nothing;
