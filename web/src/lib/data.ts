import 'server-only'
import { cache } from 'react'
import { hasDb, supabasePublic, supabaseServer } from './supabase/server'
import type { Finish, Heat, Profile, Result, SheetRow } from './types'

// Used until Supabase is connected, so the site renders the season read-only.
const SEED: Heat[] = [
  { id: 'seed-1', number: 1, name: 'Central Park 5K', park: 'Central Park', borough: 'Manhattan', starts_at: '2026-10-10T14:00:00Z', meet_point: "Engineer's Gate", address: '5th Ave & E 90th St', note: 'Heat 001. The first one.', distance_km: 5, color_key: 'volt', stamp_shape: 'circle', course_key: 'cp', cover_url: null, status: 'open' },
  { id: 'seed-2', number: 2, name: 'Prospect Park 5K', park: 'Prospect Park', borough: 'Brooklyn', starts_at: '2026-10-17T13:00:00Z', meet_point: 'Grand Army Plaza', address: 'Flatbush Ave & Plaza St', note: 'One full loop of the park drive.', distance_km: 5, color_key: 'coral', stamp_shape: 'octagon', course_key: 'loop', cover_url: null, status: 'open' },
  { id: 'seed-3', number: 3, name: 'Hudson River 5K', park: 'Hudson River Greenway', borough: 'Manhattan', starts_at: '2026-10-25T12:00:00Z', meet_point: 'Pier 84', address: 'W 44th St & 12th Ave', note: 'Flat, fast, out and back.', distance_km: 5, color_key: 'hudson', stamp_shape: 'rect', course_key: 'line', cover_url: null, status: 'open' },
  { id: 'seed-4', number: 4, name: 'Brooklyn Bridge Sunset 5K', park: 'Brooklyn Bridge Park', borough: 'Brooklyn', starts_at: '2026-10-31T21:30:00Z', meet_point: 'Pier 1', address: 'Furman St & Old Fulton St', note: 'Halloween. Costumes encouraged.', distance_km: 5, color_key: 'sunset', stamp_shape: 'circle', course_key: 'line2', cover_url: null, status: 'open' },
  { id: 'seed-5', number: 5, name: "Randall's Island 5K", park: "Randall's Island", borough: 'Manhattan', starts_at: '2026-11-07T14:00:00Z', meet_point: 'Icahn Stadium', address: "Randall's Island Park", note: 'Track finish inside Icahn Stadium.', distance_km: 5, color_key: 'lilac', stamp_shape: 'oval', course_key: 'oval', cover_url: null, status: 'open' },
  { id: 'seed-6', number: 6, name: 'Van Cortlandt XC 5K', park: 'Van Cortlandt Park', borough: 'Bronx', starts_at: '2026-11-14T14:00:00Z', meet_point: 'The Parade Ground', address: 'Broadway & W 242nd St', note: 'Real cross country. Bring trail shoes.', distance_km: 5, color_key: 'forest', stamp_shape: 'octagon', course_key: 'xc', cover_url: null, status: 'open' },
  { id: 'seed-7', number: 7, name: 'Rockaway Boardwalk 5K', park: 'Rockaway Beach', borough: 'Queens', starts_at: '2026-11-21T14:00:00Z', meet_point: 'Beach 97th St', address: 'Rockaway Beach Blvd', note: 'Ocean on your left the whole way.', distance_km: 5, color_key: 'seafoam', stamp_shape: 'rect', course_key: 'bw', cover_url: null, status: 'open' },
]

const HEAT_COLS = 'id, number, name, park, borough, starts_at, meet_point, address, note, distance_km, color_key, stamp_shape, course_key, cover_url, status'

export const getHeats = cache(async (): Promise<Heat[]> => {
  if (!hasDb) return SEED
  const { data, error } = await supabasePublic().from('heats').select(HEAT_COLS).neq('status', 'draft').order('starts_at')
  if (error) throw error
  return data as Heat[]
})

export const getHeat = cache(async (number: number): Promise<Heat | null> => {
  if (!hasDb) return SEED.find(h => h.number === number) ?? null
  const { data } = await supabasePublic().from('heats').select(HEAT_COLS).eq('number', number).neq('status', 'draft').maybeSingle()
  return (data as Heat) ?? null
})

export type Going = { count: number; runners: Pick<Profile, 'alias' | 'avatar_url'>[] }

export const getGoing = cache(async (heatId: string): Promise<Going> => {
  if (!hasDb) return { count: 0, runners: [] }
  const { data, count } = await supabasePublic()
    .from('registrations')
    .select('created_at, profiles(alias, avatar_url)', { count: 'exact' })
    .eq('heat_id', heatId)
    .order('created_at', { ascending: false })
    .limit(6)
  const runners = (data ?? []).map(r => r.profiles as unknown as Pick<Profile, 'alias' | 'avatar_url'>).filter(Boolean)
  return { count: count ?? 0, runners }
})

export const getHeatSheet = cache(async (heatId: string): Promise<SheetRow[]> => {
  if (!hasDb) return []
  const { data } = await supabasePublic().from('heat_sheet').select('*').eq('heat_id', heatId).order('place').order('created_at')
  return (data ?? []) as SheetRow[]
})

export const getMyProfile = cache(async (userId: string | null): Promise<Profile | null> => {
  if (!hasDb || !userId) return null
  const { data } = await supabasePublic().from('profiles').select('*').eq('id', userId).maybeSingle()
  return (data as Profile) ?? null
})

// Sample passport at /p/demo while the database isn't connected
export const SAMPLE_PROFILE: Profile = { id: 'demo', alias: 'demo', avatar_url: null, home_park: 'Prospect Park', created_at: '2026-10-10T14:00:00Z' }
const DEMO_HEATS = SEED
export const SAMPLE_FINISHES: Finish[] = [
  [1302, 'first heat, will be back', 12, 34, false], [1271, 'PR!!!', 9, 41, false], [1288, 'headwind the whole way back', 27, 27, true],
  [1244, 'ran it as a banana', 4, 52, false], [1259, 'track finish felt like the olympics', 6, 23, false],
].map(([t, note, place, field, last], i) => ({ heat: { ...DEMO_HEATS[i], status: 'closed' }, time_seconds: t as number, note: note as string, place: place as number, finishers: field as number, last: last as boolean }))

export const getProfileByAlias = cache(async (alias: string): Promise<Profile | null> => {
  if (!hasDb) return alias === 'demo' ? SAMPLE_PROFILE : null
  const { data } = await supabasePublic().from('profiles').select('*').eq('alias', alias.toLowerCase()).maybeSingle()
  return (data as Profile) ?? null
})

export type MyHeatState = { registered: boolean; result: Result | null }

export async function getMyHeatState(heatId: string, userId: string | null): Promise<MyHeatState> {
  if (!hasDb || !userId) return { registered: false, result: null }
  const sb = await supabaseServer()
  const [{ data: reg }, { data: res }] = await Promise.all([
    sb.from('registrations').select('heat_id').eq('heat_id', heatId).eq('user_id', userId).maybeSingle(),
    sb.from('results').select('*').eq('heat_id', heatId).eq('user_id', userId).maybeSingle(),
  ])
  return { registered: !!reg, result: (res as Result) ?? null }
}

export async function getMyRegistrations(userId: string | null): Promise<Set<string>> {
  if (!hasDb || !userId) return new Set()
  const { data } = await supabasePublic().from('registrations').select('heat_id').eq('user_id', userId)
  return new Set((data ?? []).map(r => r.heat_id as string))
}

// Every verified finish for a runner, with place and field size for medals.
export async function getFinishes(userId: string): Promise<Finish[]> {
  if (!hasDb) return userId === 'demo' ? SAMPLE_FINISHES : []
  const sb = supabasePublic()
  const { data: mine } = await sb.from('heat_sheet').select('heat_id, place, time_seconds, note').eq('user_id', userId)
  if (!mine?.length) return []
  const heatIds = mine.map(m => m.heat_id as string)
  const [{ data: heats }, { data: all }] = await Promise.all([
    sb.from('heats').select(HEAT_COLS).in('id', heatIds),
    sb.from('heat_sheet').select('heat_id, place').in('heat_id', heatIds),
  ])
  const field: Record<string, { n: number; max: number }> = {}
  for (const r of all ?? []) {
    const f = (field[r.heat_id as string] ??= { n: 0, max: 0 })
    f.n++
    f.max = Math.max(f.max, r.place as number)
  }
  return mine.flatMap(m => {
    const heat = (heats as Heat[] | null)?.find(h => h.id === m.heat_id)
    if (!heat) return []
    const f = field[heat.id]
    const settled = heat.status === 'results' || heat.status === 'closed'
    return [{ heat, time_seconds: m.time_seconds as number, note: m.note as string | null, place: m.place as number, finishers: f?.n ?? 1, last: settled && (f?.n ?? 0) > 1 && m.place === f?.max }]
  }).sort((a, b) => a.heat.starts_at.localeCompare(b.heat.starts_at))
}
