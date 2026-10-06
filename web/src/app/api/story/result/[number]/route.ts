import { resultStory } from '@/lib/story'
import { pngResponse } from '@/lib/story-response'
import { getFinishes, getHeat, getProfileByAlias } from '@/lib/data'
import { heatNo } from '@/lib/time'

// "Stamped" story for a verified result: /api/story/result/001?alias=x
export async function GET(req: Request, { params }: { params: Promise<{ number: string }> }) {
  const number = parseInt((await params).number, 10)
  const q = new URL(req.url).searchParams
  const [heat, profile] = await Promise.all([getHeat(number), getProfileByAlias(q.get('alias') ?? '')])
  if (!profile) return new Response('Not found', { status: 404 })
  const finish = (await getFinishes(profile.id)).find(f => f.heat.number === number)
  if (!finish) return new Response('Not found', { status: 404 })
  const svg = resultStory(heat ?? finish.heat, { alias: profile.alias, time_seconds: finish.time_seconds, place: finish.place, finishers: finish.finishers, note: finish.note })
  return pngResponse(svg, `heat-${heatNo(number)}-${profile.alias}.png`, q.has('download'))
}
