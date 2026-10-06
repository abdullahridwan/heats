import 'server-only'
import { cache } from 'react'
import { db } from './db'
import type { Heat, ResultRow, Stamp, Submission, UserRow } from './types'

// Every read goes through the service client on the server. Nothing here is reachable from the
// browser, and no anon/authenticated key can read anything (RLS is on with no policies).

export const HEAT_COLS = 'id, number, name, opens_at, closes_at, location_terms, min_km, max_km'

// Reading the clock belongs in the data layer, not in a component render (React purity).
export async function serverNow(): Promise<number> {
  return Date.now()
}

export const getHeats = cache(async (): Promise<Heat[]> => {
  const { data, error } = await db().from('heats').select(HEAT_COLS).order('number')
  if (error) throw error
  return (data ?? []) as Heat[]
})

export const getHeat = cache(async (number: number): Promise<Heat | null> => {
  const { data } = await db().from('heats').select(HEAT_COLS).eq('number', number).maybeSingle()
  return (data as Heat) ?? null
})

export const getMe = cache(async (userId: string | null): Promise<UserRow | null> => {
  if (!userId) return null
  const { data } = await db().from('users').select('*').eq('id', userId).maybeSingle()
  return (data as UserRow) ?? null
})

export const getUserByAlias = cache(async (alias: string): Promise<UserRow | null> => {
  const { data } = await db().from('users').select('*').eq('alias', alias.toLowerCase()).maybeSingle()
  return (data as UserRow) ?? null
})

// The results view: stamped submissions, ranked per heat (ties share a place).
export const getResults = cache(async (heatId?: string): Promise<ResultRow[]> => {
  let q = db().from('results').select('heat_id, alias, avatar_url, time_s, note, place')
  if (heatId) q = q.eq('heat_id', heatId)
  const { data } = await q.order('place')
  return (data ?? []) as ResultRow[]
})

export const getMySubmission = cache(async (userId: string | null, heatId: string): Promise<Submission | null> => {
  if (!userId) return null
  const { data } = await db().from('submissions').select('*').eq('user_id', userId).eq('heat_id', heatId).maybeSingle()
  return (data as Submission) ?? null
})

// Every stamped heat for one runner, with place and field size, in season order. place comes
// from the results view; finishers is the field size for that heat.
export async function getStamps(userId: string): Promise<Stamp[]> {
  const { data: mine } = await db()
    .from('submissions')
    .select('heat_id, time_s, note, status')
    .eq('user_id', userId)
    .in('status', ['auto_verified', 'verified'])
  if (!mine?.length) return []

  const heatIds = [...new Set(mine.map(m => m.heat_id as string))]
  const [{ data: heats }, { data: all }, { data: meRow }] = await Promise.all([
    db().from('heats').select(HEAT_COLS).in('id', heatIds),
    db().from('results').select('heat_id, place').in('heat_id', heatIds),
    db().from('users').select('alias').eq('id', userId).maybeSingle(),
  ])
  const alias = (meRow?.alias as string) ?? ''

  // place for this runner's row in each heat, plus the field size (max place).
  const { data: mineRows } = await db().from('results').select('heat_id, alias, place').eq('alias', alias).in('heat_id', heatIds)
  const field: Record<string, { n: number; max: number }> = {}
  for (const r of all ?? []) {
    const f = (field[r.heat_id as string] ??= { n: 0, max: 0 })
    f.n++
    f.max = Math.max(f.max, r.place as number)
  }

  const heatById = new Map((heats as Heat[] ?? []).map(h => [h.id, h]))
  return mine.flatMap(m => {
    const heat = heatById.get(m.heat_id as string)
    if (!heat) return []
    const row = (mineRows ?? []).find(r => r.heat_id === m.heat_id)
    const place = (row?.place as number) ?? 0
    const f = field[heat.id]
    return [{ heat, alias, time_s: m.time_s as number, note: m.note as string | null, place, finishers: f?.n ?? 1 }]
  }).sort((a, b) => a.heat.opens_at.localeCompare(b.heat.opens_at))
}

// Passport by alias: the owner's stamps, resolved through the results view (public by design
// once a runner is stamped).
export async function getStampsForAlias(user: UserRow): Promise<Stamp[]> {
  const { data: rows } = await db()
    .from('results')
    .select('heat_id, alias, time_s, note, place')
    .eq('alias', user.alias)
  if (!rows?.length) return []
  const heatIds = [...new Set(rows.map(r => r.heat_id as string))]
  const [{ data: heats }, { data: all }] = await Promise.all([
    db().from('heats').select(HEAT_COLS).in('id', heatIds),
    db().from('results').select('heat_id, place').in('heat_id', heatIds),
  ])
  const field: Record<string, { n: number }> = {}
  for (const r of all ?? []) { const f = (field[r.heat_id as string] ??= { n: 0 }); f.n++ }
  const heatById = new Map((heats as Heat[] ?? []).map(h => [h.id, h]))
  return rows.flatMap(r => {
    const heat = heatById.get(r.heat_id as string)
    if (!heat) return []
    return [{ heat, alias: r.alias as string, time_s: r.time_s as number, note: r.note as string | null, place: r.place as number, finishers: field[heat.id]?.n ?? 1 }]
  }).sort((a, b) => a.heat.opens_at.localeCompare(b.heat.opens_at))
}
