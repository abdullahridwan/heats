import type { MedalKind } from './art'
import type { Stamp } from './types'

// v1 has exactly three medals, all derived from a runner's stamped heats. Nothing is stored.
// Podium and Closer only lock in once now() > closes_at, so a runner can't hold a medal at 9am
// and lose it by noon.

export const MEDAL_ORDER: MedalKind[] = ['founding', 'podium', 'closer']

export const MEDAL_INFO: Record<MedalKind, { name: string; obj: string; how: string }> = {
  founding: { name: 'Founding Runner', obj: 'For lining up at the very first heat.', how: 'Finish Heat 001.' },
  podium: { name: 'Podium', obj: 'Top three, in enamel.', how: 'Place top three in a heat.' },
  closer: { name: 'Closer', obj: 'A megaphone, because everyone stayed to cheer.', how: 'Finish last in a heat.' },
}

export type MedalState = { kind: MedalKind; earned: boolean; on?: string; progress?: string }

export function computeMedals(stamps: Stamp[], now = Date.now()): MedalState[] {
  const founding = stamps.find(s => s.heat.number === 1)

  // A heat is settled once its window has closed; only then do place-based medals exist.
  const settled = stamps.filter(s => now > new Date(s.heat.closes_at).getTime())
  const podium = settled.filter(s => s.place > 0 && s.place <= 3).sort((a, b) => a.place - b.place)[0]
  const closer = settled.filter(s => s.finishers > 1 && s.place === s.finishers).sort((a, b) => a.place - b.place)[0]

  return [
    { kind: 'founding', earned: !!founding, on: founding ? founding.heat.name : undefined, progress: 'Finish Heat 001' },
    { kind: 'podium', earned: !!podium, on: podium ? podium.heat.name : undefined, progress: 'Top 3 in a heat' },
    { kind: 'closer', earned: !!closer, on: closer ? closer.heat.name : undefined, progress: 'Finish last in a heat' },
  ]
}
