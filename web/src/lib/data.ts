import 'server-only'
import { cache } from 'react'
import { db } from './db'
import type { Heat, HeatState, ResultRow, Runner, StampEntry, Submission } from './types'

// Every read goes through the service client on the server. Nothing here is reachable from the
// browser, and no anon/authenticated key can read anything (RLS is on with no policies).

export const HEAT_COLS = 'id, number, name, park, scene, opens_at, closes_at, location_terms, min_km, max_km'

type HeatRow = Omit<Heat, 'min_km' | 'max_km'> & { min_km: number | string; max_km: number | string }

// numeric columns come back from PostgREST as strings in some setups.
function toHeat(r: HeatRow): Heat {
  return { ...r, min_km: Number(r.min_km), max_km: Number(r.max_km) }
}

// Reading the clock belongs in the data layer, not in a component render (React purity).
export async function serverNow(): Promise<number> {
  return Date.now()
}

export function heatState(h: Heat, now = Date.now()): HeatState {
  if (now < new Date(h.opens_at).getTime()) return 'upcoming'
  if (now > new Date(h.closes_at).getTime()) return 'past'
  return 'live'
}

export const getHeats = cache(async (): Promise<Heat[]> => {
  const { data, error } = await db().from('heats').select(HEAT_COLS).order('number')
  if (error) throw error
  return ((data ?? []) as unknown as HeatRow[]).map(toHeat)
})

export const getHeat = cache(async (number: number): Promise<Heat | null> => {
  const { data } = await db().from('heats').select(HEAT_COLS).eq('number', number).maybeSingle()
  return data ? toHeat(data as unknown as HeatRow) : null
})

// The calendar: one heats read, split by state. Past is newest first, upcoming oldest first.
export async function getCalendar(): Promise<{ live: Heat | null; upcoming: Heat[]; past: Heat[] }> {
  const heats = await getHeats()
  const now = await serverNow()
  const live: Heat[] = []
  const upcoming: Heat[] = []
  const past: Heat[] = []
  for (const h of heats) {
    const s = heatState(h, now)
    if (s === 'live') live.push(h)
    else if (s === 'upcoming') upcoming.push(h)
    else past.push(h)
  }
  upcoming.sort((a, b) => a.opens_at.localeCompare(b.opens_at))
  past.sort((a, b) => b.opens_at.localeCompare(a.opens_at))
  return { live: live[0] ?? null, upcoming, past }
}

export async function getLiveHeat(): Promise<Heat | null> {
  return (await getCalendar()).live
}

export const getRunnerById = cache(async (id: string): Promise<Runner | null> => {
  const { data } = await db().from('users').select('id, alias, email, created_at').eq('id', id).maybeSingle()
  return (data as Runner) ?? null
})

export const getRunnerByAlias = cache(async (alias: string): Promise<Runner | null> => {
  const { data } = await db()
    .from('users')
    .select('id, alias, email, created_at')
    .eq('alias', alias.toLowerCase())
    .maybeSingle()
  return (data as Runner) ?? null
})

export async function getSignedUpHeatIds(userId: string): Promise<string[]> {
  const { data } = await db().from('signups').select('heat_id').eq('user_id', userId)
  return (data ?? []).map(r => r.heat_id as string)
}

// The results view: stamped submissions, ranked per heat (ties share a place).
export async function getResults(heatId: string): Promise<ResultRow[]> {
  const { data } = await db()
    .from('results')
    .select('heat_id, alias, time_s, note, place')
    .eq('heat_id', heatId)
    .order('place')
  return (data ?? []) as ResultRow[]
}

// A runner's passport: stamped heats in season order. Each stamp's place comes from the results
// view, matched by heat and alias. heats is the whole season, for the empty slots.
export async function getStampCase(runnerId: string): Promise<{ stamps: StampEntry[]; heats: Heat[] }> {
  const [heats, runner, { data: mine }] = await Promise.all([
    getHeats(),
    getRunnerById(runnerId),
    db()
      .from('submissions')
      .select('heat_id, time_s')
      .eq('user_id', runnerId)
      .in('status', ['auto_verified', 'verified']),
  ])
  if (!mine?.length || !runner) return { stamps: [], heats }

  const heatIds = [...new Set(mine.map(m => m.heat_id as string))]
  const { data: placed } = await db()
    .from('results')
    .select('heat_id, place')
    .eq('alias', runner.alias)
    .in('heat_id', heatIds)
  const placeByHeat = new Map((placed ?? []).map(r => [r.heat_id as string, Number(r.place)]))
  const heatById = new Map(heats.map(h => [h.id, h]))

  const stamps: StampEntry[] = []
  for (const m of mine) {
    const heat = heatById.get(m.heat_id as string)
    if (!heat) continue
    stamps.push({
      heat,
      time_s: Number(m.time_s),
      place: placeByHeat.get(heat.id) ?? 0,
    })
  }
  stamps.sort((a, b) => a.heat.number - b.heat.number)
  return { stamps, heats }
}

export const getMySubmission = cache(async (userId: string, heatId: string): Promise<Submission | null> => {
  const { data } = await db().from('submissions').select('*').eq('user_id', userId).eq('heat_id', heatId).maybeSingle()
  return (data as Submission) ?? null
})
