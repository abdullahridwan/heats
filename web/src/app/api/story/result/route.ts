import { resultStory } from '@/lib/story'
import { pngResponse } from '@/lib/story-response'
import { getResults, getStamps, getUserByAlias, getHeat } from '@/lib/data'
import { heatNo } from '@/lib/time'

export const runtime = 'nodejs'

// "Stamped" story for one runner's result: /api/story/result?alias=x&heat=001
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams
  const alias = q.get('alias')
  if (!alias) return new Response('Not found', { status: 404 })

  const user = await getUserByAlias(alias)
  if (!user) return new Response('Not found', { status: 404 })

  const stamps = await getStamps(user.id)
  const wanted = q.get('heat') ? parseInt(q.get('heat')!, 10) : undefined
  const stamp = wanted === undefined ? stamps[stamps.length - 1] : stamps.find(s => s.heat.number === wanted)
  if (!stamp) return new Response('Not found', { status: 404 })

  const heat = await getHeat(stamp.heat.number)
  if (!heat) return new Response('Not found', { status: 404 })

  // Finishers for this heat come from the full results set.
  const results = await getResults(heat.id)
  const finishers = results.length || 1

  const svg = resultStory(heat, {
    alias: user.alias,
    time_s: stamp.time_s,
    place: stamp.place || 1,
    finishers,
    note: stamp.note,
  })
  return pngResponse(svg, `heat-${heatNo(heat.number)}-${user.alias}.png`, q.has('download'))
}
