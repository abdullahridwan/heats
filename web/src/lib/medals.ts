import type { MedalKind } from './art'
import type { Finish } from './types'
import { ordinal, shortDate } from './time'

export const MEDAL_INFO: Record<MedalKind, { name: string; obj: string; how: string }> = {
  sun:    { name: 'First Heat',     obj: 'A sunburst for your first morning at the line.', how: 'Finish your first heat.' },
  watch:  { name: 'PR',             obj: 'A stopwatch, stopped earlier than ever.',        how: 'Beat your best 5K time.' },
  token:  { name: 'Borough Hopper', obj: 'An old subway token, good for one heat.',        how: 'Run heats in 3 boroughs.' },
  mega:   { name: 'Closer',         obj: 'A megaphone, because everyone stayed to cheer.', how: 'Finish last in a heat.' },
  star:   { name: 'Five Heats',     obj: 'One point for every heat.',                      how: 'Finish five heats.' },
  flame:  { name: 'Streak',         obj: 'A flame kept lit four weekends straight.',       how: 'Four weekends in a row.' },
  podium: { name: 'Podium',         obj: 'The podium, in enamel.',                         how: 'Place top three in a heat.' },
  flower: { name: 'All Five',       obj: 'Five petals, one for each borough.',             how: 'Run a heat in every borough.' },
}

export const MEDAL_ORDER: MedalKind[] = ['sun', 'watch', 'token', 'mega', 'star', 'flame', 'podium', 'flower']

export type MedalState = { kind: MedalKind; earned: boolean; on?: string; progress?: string }

const WEEK = 7 * 864e5
const weekIndex = (iso: string) => Math.floor((new Date(iso).getTime() - Date.UTC(2024, 0, 1)) / WEEK) // weeks since a Monday

export function computeMedals(finishes: Finish[]): MedalState[] {
  const f = [...finishes].sort((a, b) => a.heat.starts_at.localeCompare(b.heat.starts_at))
  const n = f.length
  const boroughs: string[] = []
  const boroughDate: Record<number, string> = {}
  f.forEach(x => { if (!boroughs.includes(x.heat.borough)) { boroughs.push(x.heat.borough); boroughDate[boroughs.length] = x.heat.starts_at } })

  let prOn: string | undefined, best = Infinity
  f.forEach((x, i) => { if (i > 0 && x.time_seconds < best && !prOn) prOn = x.heat.starts_at; best = Math.min(best, x.time_seconds) })

  const weeks = [...new Set(f.map(x => weekIndex(x.heat.starts_at)))].sort((a, b) => a - b)
  let run = weeks.length ? 1 : 0, bestRun = run, streakOn: string | undefined
  for (let i = 1; i < weeks.length; i++) {
    run = weeks[i] === weeks[i - 1] + 1 ? run + 1 : 1
    if (run > bestRun) bestRun = run
    if (run >= 4 && !streakOn) streakOn = f.find(x => weekIndex(x.heat.starts_at) === weeks[i])?.heat.starts_at
  }

  const bestPlace = f.length ? Math.min(...f.map(x => x.place)) : 0
  const podium = f.find(x => x.place <= 3)
  const closer = f.find(x => x.last)
  const d = (iso?: string) => (iso ? shortDate(iso) : undefined)

  return [
    { kind: 'sun', earned: n >= 1, on: d(f[0]?.heat.starts_at), progress: 'Run Heat 001' },
    { kind: 'watch', earned: !!prOn, on: d(prOn), progress: n ? 'Beat your best' : 'Needs 2 heats' },
    { kind: 'token', earned: boroughs.length >= 3, on: d(boroughDate[3]), progress: `${boroughs.length} of 3` },
    { kind: 'mega', earned: !!closer, on: d(closer?.heat.starts_at), progress: 'Finish last' },
    { kind: 'star', earned: n >= 5, on: d(f[4]?.heat.starts_at), progress: `${n} of 5` },
    { kind: 'flame', earned: !!streakOn, on: d(streakOn), progress: `${bestRun} of 4` },
    { kind: 'podium', earned: !!podium, on: d(podium?.heat.starts_at), progress: bestPlace ? `Best: ${ordinal(bestPlace)}` : 'Top 3' },
    { kind: 'flower', earned: boroughs.length >= 5, on: d(boroughDate[5]), progress: `${boroughs.length} of 5` },
  ]
}
