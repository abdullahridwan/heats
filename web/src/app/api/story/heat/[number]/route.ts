import { heatStory } from '@/lib/story'
import { pngResponse } from '@/lib/story-response'
import { getHeat } from '@/lib/data'
import { heatNo } from '@/lib/time'

export const runtime = 'nodejs'

// "I'm running Heat 001" invite. ?alias=x adds "x is in".
export async function GET(req: Request, { params }: { params: Promise<{ number: string }> }) {
  const heat = await getHeat(parseInt((await params).number, 10))
  if (!heat) return new Response('Not found', { status: 404 })
  const q = new URL(req.url).searchParams
  const svg = heatStory(heat, { alias: q.get('alias') ?? undefined })
  return pngResponse(svg, `heat-${heatNo(heat.number)}.png`, q.has('download'))
}
